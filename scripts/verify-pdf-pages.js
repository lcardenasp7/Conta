const fs = require('fs');
const path = require('path');

async function verifyPDFPages() {
    console.log('📄 Verificando número de páginas en PDFs generados...');
    
    try {
        const testPdfsDir = path.join(__dirname, '../test-pdfs');
        
        if (!fs.existsSync(testPdfsDir)) {
            console.log('📁 Directorio de PDFs de prueba no existe');
            return;
        }

        const files = fs.readdirSync(testPdfsDir).filter(file => file.endsWith('.pdf'));
        
        if (files.length === 0) {
            console.log('📄 No se encontraron PDFs para verificar');
            return;
        }

        console.log(`📊 Analizando ${files.length} PDFs:`);
        
        for (const file of files) {
            const filePath = path.join(testPdfsDir, file);
            const stats = fs.statSync(filePath);
            
            // Leer el contenido del PDF para contar páginas
            const pdfBuffer = fs.readFileSync(filePath);
            const pageCount = countPDFPages(pdfBuffer);
            
            console.log(`   📄 ${file}:`);
            console.log(`      - Páginas: ${pageCount}`);
            console.log(`      - Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
            
            // Determinar si es optimizado
            if (file.includes('_optimized') && pageCount === 1) {
                console.log(`      ✅ Optimización exitosa (1 página)`);
            } else if (file.includes('_optimized') && pageCount > 1) {
                console.log(`      ⚠️  PDF optimizado usa ${pageCount} páginas`);
            } else if (file.includes('_test')) {
                console.log(`      📝 PDF de prueba con múltiples items: ${pageCount} páginas`);
            }
        }

        // Resumen
        const optimizedFiles = files.filter(f => f.includes('_optimized'));
        const singlePageOptimized = optimizedFiles.filter(f => {
            const filePath = path.join(testPdfsDir, f);
            const pdfBuffer = fs.readFileSync(filePath);
            return countPDFPages(pdfBuffer) === 1;
        });

        console.log(`\n📊 Resumen de optimización:`);
        console.log(`   - PDFs optimizados: ${optimizedFiles.length}`);
        console.log(`   - PDFs de 1 página: ${singlePageOptimized.length}`);
        console.log(`   - Tasa de éxito: ${((singlePageOptimized.length / optimizedFiles.length) * 100).toFixed(1)}%`);

    } catch (error) {
        console.error('❌ Error verificando PDFs:', error);
    }
}

function countPDFPages(pdfBuffer) {
    try {
        // Método simple para contar páginas en PDF
        // Busca ocurrencias de "/Type /Page" en el buffer
        const pdfString = pdfBuffer.toString('binary');
        const pageMatches = pdfString.match(/\/Type\s*\/Page[^s]/g);
        return pageMatches ? pageMatches.length : 1;
    } catch (error) {
        console.warn('Error contando páginas, asumiendo 1 página');
        return 1;
    }
}

async function compareWithOriginal() {
    console.log('🔍 Comparando PDFs optimizados vs originales...');
    
    try {
        // Generar un PDF con el método legacy para comparar
        const { PrismaClient } = require('@prisma/client');
        const invoiceGeneratorService = require('../services/invoice-generator.service');
        
        const prisma = new PrismaClient();
        
        const invoice = await prisma.invoice.findFirst({
            where: { invoiceNumber: { startsWith: 'FAC-2025-' } },
            include: {
                items: true,
                student: {
                    include: {
                        grade: { select: { name: true } },
                        group: { select: { name: true } }
                    }
                }
            }
        });

        if (!invoice) {
            console.log('❌ No se encontró factura para comparar');
            return;
        }

        console.log(`📄 Comparando factura: ${invoice.invoiceNumber}`);
        console.log(`   Items: ${invoice.items.length}`);

        // Generar PDF optimizado
        const optimizedPdf = await invoiceGeneratorService.generateOptimizedPDF(
            invoice, 
            await prisma.institution.findFirst()
        );

        // Generar PDF legacy
        const legacyPdf = await invoiceGeneratorService.generateLegacyPDF(
            invoice, 
            await prisma.institution.findFirst()
        );

        // Guardar ambos para comparar
        const outputDir = path.join(__dirname, '../test-pdfs');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Guardar PDF optimizado
        const optimizedPath = path.join(outputDir, `${invoice.invoiceNumber}_comparison_optimized.pdf`);
        const optimizedStream = fs.createWriteStream(optimizedPath);
        optimizedPdf.pipe(optimizedStream);
        optimizedPdf.end();

        // Guardar PDF legacy
        const legacyPath = path.join(outputDir, `${invoice.invoiceNumber}_comparison_legacy.pdf`);
        const legacyStream = fs.createWriteStream(legacyPath);
        legacyPdf.pipe(legacyStream);
        legacyPdf.end();

        // Esperar a que terminen de escribir
        await Promise.all([
            new Promise(resolve => optimizedStream.on('finish', resolve)),
            new Promise(resolve => legacyStream.on('finish', resolve))
        ]);

        // Comparar tamaños
        const optimizedStats = fs.statSync(optimizedPath);
        const legacyStats = fs.statSync(legacyPath);

        console.log(`📊 Comparación de tamaños:`);
        console.log(`   - Optimizado: ${(optimizedStats.size / 1024).toFixed(2)} KB`);
        console.log(`   - Legacy: ${(legacyStats.size / 1024).toFixed(2)} KB`);
        console.log(`   - Diferencia: ${((optimizedStats.size - legacyStats.size) / 1024).toFixed(2)} KB`);

        await prisma.$disconnect();

    } catch (error) {
        console.error('❌ Error en comparación:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'verify';

    if (command === 'compare') {
        compareWithOriginal()
            .then(() => {
                console.log('🎉 Comparación completada');
                process.exit(0);
            })
            .catch((error) => {
                console.error('💥 Error en comparación:', error);
                process.exit(1);
            });
    } else {
        verifyPDFPages()
            .then(() => {
                console.log('🎉 Verificación completada');
                process.exit(0);
            })
            .catch((error) => {
                console.error('💥 Error en verificación:', error);
                process.exit(1);
            });
    }
}

module.exports = {
    verifyPDFPages,
    compareWithOriginal
};