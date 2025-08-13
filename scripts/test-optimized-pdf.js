const { PrismaClient } = require('@prisma/client');
const invoiceGeneratorService = require('../services/invoice-generator.service');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testOptimizedPDF() {
    console.log('🧪 Probando generación optimizada de PDFs...');
    
    try {
        // 1. Buscar facturas existentes para probar
        console.log('📊 Buscando facturas para probar...');
        
        const invoices = await prisma.invoice.findMany({
            include: {
                items: true,
                student: {
                    include: {
                        grade: { select: { name: true } },
                        group: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        if (invoices.length === 0) {
            console.log('❌ No se encontraron facturas para probar');
            return;
        }

        console.log(`📄 Encontradas ${invoices.length} facturas para probar`);

        // 2. Probar diferentes tipos de facturas
        for (const invoice of invoices) {
            console.log(`\n🔍 Probando factura: ${invoice.invoiceNumber}`);
            console.log(`   Items: ${invoice.items.length}`);
            console.log(`   Cliente: ${invoice.student ? 
                `${invoice.student.firstName} ${invoice.student.lastName}` : 
                invoice.clientName || 'Cliente Externo'}`);

            try {
                // Generar PDF
                const pdfDoc = await invoiceGeneratorService.generateInvoicePDF(invoice.id);
                
                // Guardar PDF de prueba
                const outputDir = path.join(__dirname, '../test-pdfs');
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                const outputPath = path.join(outputDir, `${invoice.invoiceNumber}_optimized.pdf`);
                const writeStream = fs.createWriteStream(outputPath);
                
                pdfDoc.pipe(writeStream);
                
                // Esperar a que termine de escribir
                await new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                    pdfDoc.end();
                });

                console.log(`   ✅ PDF generado: ${outputPath}`);

                // Verificar tamaño del archivo
                const stats = fs.statSync(outputPath);
                console.log(`   📏 Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);

            } catch (error) {
                console.error(`   ❌ Error generando PDF: ${error.message}`);
            }
        }

        // 3. Crear factura de prueba con muchos items
        console.log('\n🔄 Creando factura de prueba con múltiples items...');
        
        const user = await prisma.user.findFirst({ where: { isActive: true } });
        if (!user) {
            console.log('❌ No se encontró usuario válido');
            return;
        }

        // Generar número único
        const lastInvoice = await prisma.invoice.findFirst({
            where: { invoiceNumber: { startsWith: 'FAC-2025-' } },
            orderBy: { invoiceNumber: 'desc' }
        });

        let nextNumber = 1;
        if (lastInvoice) {
            const parts = lastInvoice.invoiceNumber.split('-');
            if (parts.length === 3) {
                nextNumber = parseInt(parts[2]) + 1;
            }
        }

        const testInvoiceNumber = `FAC-2025-${nextNumber.toString().padStart(6, '0')}`;

        // Crear factura con múltiples items
        const testInvoice = await prisma.invoice.create({
            data: {
                invoiceNumber: testInvoiceNumber,
                concept: 'OTHER',
                subtotal: 500000,
                tax: 0,
                total: 500000,
                status: 'PENDING',
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                userId: user.id,
                type: 'OUTGOING',
                clientName: 'Cliente Prueba PDF',
                clientDocument: '12345678',
                isExternal: true,
                items: {
                    create: [
                        {
                            description: 'Producto 1 - Descripción corta',
                            quantity: 1,
                            unitPrice: 50000,
                            total: 50000
                        },
                        {
                            description: 'Producto 2 - Descripción mediana para probar el layout',
                            quantity: 2,
                            unitPrice: 75000,
                            total: 150000
                        },
                        {
                            description: 'Producto 3 - Descripción muy larga para verificar cómo se maneja el texto que excede el ancho disponible en la tabla',
                            quantity: 3,
                            unitPrice: 100000,
                            total: 300000
                        }
                    ]
                }
            },
            include: {
                items: true
            }
        });

        console.log(`✅ Factura de prueba creada: ${testInvoice.invoiceNumber}`);

        // Generar PDF de la factura de prueba
        const testPdfDoc = await invoiceGeneratorService.generateInvoicePDF(testInvoice.id);
        
        const testOutputPath = path.join(__dirname, '../test-pdfs', `${testInvoice.invoiceNumber}_test.pdf`);
        const testWriteStream = fs.createWriteStream(testOutputPath);
        
        testPdfDoc.pipe(testWriteStream);
        
        await new Promise((resolve, reject) => {
            testWriteStream.on('finish', resolve);
            testWriteStream.on('error', reject);
            testPdfDoc.end();
        });

        console.log(`✅ PDF de prueba generado: ${testOutputPath}`);

        // Limpiar factura de prueba
        await prisma.invoice.delete({ where: { id: testInvoice.id } });
        console.log('🧹 Factura de prueba eliminada');

        // 4. Comparar con facturas de un solo item
        console.log('\n📊 Análisis de optimización:');
        
        const singleItemInvoices = invoices.filter(inv => inv.items.length === 1);
        const multiItemInvoices = invoices.filter(inv => inv.items.length > 1);

        console.log(`   - Facturas con 1 item: ${singleItemInvoices.length} (deberían usar 1 página)`);
        console.log(`   - Facturas con múltiples items: ${multiItemInvoices.length}`);

        console.log('\n✅ Prueba de PDFs optimizados completada');
        console.log(`📁 PDFs generados en: ${path.join(__dirname, '../test-pdfs')}`);

    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

async function analyzeCurrentPDFs() {
    console.log('🔍 Analizando PDFs actuales...');
    
    try {
        const testPdfsDir = path.join(__dirname, '../test-pdfs');
        
        if (!fs.existsSync(testPdfsDir)) {
            console.log('📁 Directorio de PDFs de prueba no existe');
            return;
        }

        const files = fs.readdirSync(testPdfsDir).filter(file => file.endsWith('.pdf'));
        
        console.log(`📄 Encontrados ${files.length} PDFs de prueba:`);
        
        files.forEach(file => {
            const filePath = path.join(testPdfsDir, file);
            const stats = fs.statSync(filePath);
            console.log(`   - ${file}: ${(stats.size / 1024).toFixed(2)} KB`);
        });

    } catch (error) {
        console.error('❌ Error analizando PDFs:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'test';

    if (command === 'analyze') {
        analyzeCurrentPDFs()
            .then(() => {
                console.log('🎉 Análisis completado');
                process.exit(0);
            })
            .catch((error) => {
                console.error('💥 Error en análisis:', error);
                process.exit(1);
            });
    } else {
        testOptimizedPDF()
            .then(() => {
                console.log('🎉 Prueba completada');
                process.exit(0);
            })
            .catch((error) => {
                console.error('💥 Error en prueba:', error);
                process.exit(1);
            });
    }
}

module.exports = {
    testOptimizedPDF,
    analyzeCurrentPDFs
};