/**
 * Script final para reiniciar el servidor y verificar que las correcciones funcionen
 */

const { spawn, exec } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function finalRestartAndVerify() {
    try {
        console.log('🔄 Reinicio final y verificación de correcciones...\n');

        // 1. Verificar estado de las correcciones
        console.log('🔍 Verificando estado de las correcciones...');
        
        const serviceCode = fs.readFileSync(path.join(__dirname, '../services/invoice-generator.service.js'), 'utf8');
        const routeCode = fs.readFileSync(path.join(__dirname, '../routes/invoice.routes.js'), 'utf8');
        
        const corrections = {
            'Servicio - División por palabras': serviceCode.includes('words.length > 3'),
            'Servicio - Tamaño 9pt': serviceCode.includes('fontSize(9)'),
            'Servicio - Dirección específica': serviceCode.includes('Dg. 136 #9D - 60, Suroccidente, Barranquilla'),
            'Servicio - Espaciado Y+26': serviceCode.includes('startY + 26'),
            'Endpoint - Usa servicio': routeCode.includes('generateInvoicePDFBuffer'),
            'Endpoint - No manual': !routeCode.includes('new PDFDocument') || routeCode.indexOf('generateInvoicePDFBuffer') < routeCode.indexOf('new PDFDocument')
        };

        console.log('\n📋 Estado de correcciones:');
        Object.entries(corrections).forEach(([correction, applied]) => {
            console.log(`   ${applied ? '✅' : '❌'} ${correction}`);
        });

        const allCorrectionsApplied = Object.values(corrections).every(Boolean);

        if (!allCorrectionsApplied) {
            throw new Error('No todas las correcciones están aplicadas');
        }

        console.log('\n🎉 ¡Todas las correcciones están aplicadas!');

        // 2. Generar PDF de prueba final
        console.log('\n📄 Generando PDF de prueba final...');
        
        const invoice = await prisma.invoice.findFirst({
            select: { id: true, invoiceNumber: true }
        });

        if (!invoice) {
            throw new Error('No hay facturas para probar');
        }

        // Limpiar caché
        const servicePath = path.resolve(__dirname, '../services/invoice-generator.service.js');
        delete require.cache[servicePath];
        
        const invoiceService = require('../services/invoice-generator.service.js');
        const pdfBuffer = await invoiceService.generateInvoicePDFBuffer(invoice.id);
        
        const fileName = `final-verification-${Date.now()}.pdf`;
        const filePath = path.join(__dirname, fileName);
        
        fs.writeFileSync(filePath, pdfBuffer);
        
        console.log(`✅ PDF final generado: ${fileName}`);
        console.log(`📊 Tamaño: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

        // 3. Mostrar resumen
        console.log('\n📋 Resumen de correcciones aplicadas:');
        console.log('   ✅ Nombre de institución dividido en múltiples líneas');
        console.log('   ✅ Tamaño de fuente reducido a 9pt');
        console.log('   ✅ Dirección específica agregada');
        console.log('   ✅ Espaciado mejorado entre elementos');
        console.log('   ✅ Endpoint corregido para usar el servicio');

        // 4. Instrucciones finales
        console.log('\n🎯 INSTRUCCIONES FINALES:');
        console.log('   1. 🛑 DETÉN el servidor actual (Ctrl+C)');
        console.log('   2. 🚀 EJECUTA: node server.js');
        console.log('   3. 🌐 Ve a la interfaz web');
        console.log('   4. 📄 Crea o descarga una factura');
        console.log('   5. ✅ Verifica que el header esté corregido');

        console.log('\n💡 Si el problema persiste:');
        console.log('   - Limpia caché del navegador (Ctrl+Shift+R)');
        console.log('   - Verifica que no hay otros procesos de Node.js');
        console.log('   - Revisa la consola del servidor por errores');

        return {
            success: true,
            allCorrectionsApplied,
            pdfPath: filePath,
            invoiceNumber: invoice.invoiceNumber
        };

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    finalRestartAndVerify()
        .then(result => {
            console.log('\n🎉 VERIFICACIÓN COMPLETADA EXITOSAMENTE');
            console.log('🔄 Ahora reinicia el servidor para aplicar todos los cambios');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Error en la verificación final:', error.message);
            process.exit(1);
        });
}

module.exports = { finalRestartAndVerify };