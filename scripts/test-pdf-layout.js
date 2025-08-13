#!/usr/bin/env node

/**
 * Script para probar el layout de PDFs de facturas
 */

const { PrismaClient } = require('@prisma/client');
const invoiceGeneratorService = require('../services/invoice-generator.service');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testPDFLayout() {
    console.log('📄 Probando layout de PDFs de facturas...\n');

    try {
        // Buscar una factura existente
        const invoice = await prisma.invoice.findFirst({
            include: {
                student: {
                    include: {
                        grade: { select: { name: true } },
                        group: { select: { name: true } }
                    }
                },
                items: true,
                user: { select: { name: true } }
            }
        });

        if (!invoice) {
            console.log('❌ No se encontraron facturas para probar');
            console.log('💡 Crea una factura primero desde la interfaz web');
            return;
        }

        console.log(`✅ Factura encontrada: ${invoice.invoiceNumber}`);
        console.log(`   Cliente: ${invoice.student ? 
            `${invoice.student.firstName} ${invoice.student.lastName}` : 
            invoice.clientName || 'Cliente Externo'}`);
        console.log(`   Total: ${invoice.total}`);

        // Generar PDF
        console.log('\n📄 Generando PDF...');
        const pdfDoc = await invoiceGeneratorService.generateInvoicePDF(invoice.id);

        // Guardar PDF de prueba
        const testDir = path.join(__dirname, '../test-pdfs');
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        const testPdfPath = path.join(testDir, `test-invoice-${invoice.invoiceNumber}.pdf`);
        const writeStream = fs.createWriteStream(testPdfPath);
        
        pdfDoc.pipe(writeStream);
        pdfDoc.end();

        writeStream.on('finish', () => {
            console.log(`✅ PDF generado exitosamente: ${testPdfPath}`);
            console.log('\n🎯 Mejoras aplicadas:');
            console.log('   • Logo con búsqueda automática de archivos');
            console.log('   • Espaciado mejorado entre elementos');
            console.log('   • Nombres largos manejados correctamente');
            console.log('   • Posiciones ajustadas para evitar solapamiento');
            console.log('   • Texto con anchos limitados');
            console.log('   • Colores y fuentes mejorados');
            console.log('\n💡 Abre el archivo PDF para verificar el layout');
        });

        writeStream.on('error', (error) => {
            console.error('❌ Error guardando PDF:', error);
        });

    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        console.log('\n🔧 Posibles soluciones:');
        console.log('   1. Verifica que el servidor esté ejecutándose');
        console.log('   2. Asegúrate de que hay facturas en la base de datos');
        console.log('   3. Verifica que el logo esté cargado');
        console.log('   4. Ejecuta: npm install pdfkit');
    } finally {
        await prisma.$disconnect();
    }
}

async function checkLogoFiles() {
    console.log('🖼️  Verificando archivos de logo...\n');

    const uploadsDir = path.join(__dirname, '../public/uploads');
    
    if (!fs.existsSync(uploadsDir)) {
        console.log('❌ Directorio uploads no existe');
        return;
    }

    const files = fs.readdirSync(uploadsDir);
    const logoFiles = files.filter(file => 
        file.startsWith('logo') && 
        ['.png', '.jpg', '.jpeg', '.gif', '.webp'].some(ext => file.endsWith(ext))
    );

    if (logoFiles.length === 0) {
        console.log('⚠️  No se encontraron archivos de logo');
        console.log('💡 Carga un logo desde Configuración → Institución');
    } else {
        console.log(`✅ Archivos de logo encontrados: ${logoFiles.length}`);
        logoFiles.forEach(file => {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);
            console.log(`   • ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
        });
    }
}

// Ejecutar pruebas
async function runTests() {
    await checkLogoFiles();
    console.log('');
    await testPDFLayout();
}

runTests();