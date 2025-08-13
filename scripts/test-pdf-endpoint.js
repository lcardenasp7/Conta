/**
 * Script para probar el endpoint de PDF directamente
 * Verifica que use el servicio corregido
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testPDFEndpoint() {
    try {
        console.log('🧪 Probando endpoint de PDF corregido...\n');

        // 1. Buscar una factura existente
        const invoice = await prisma.invoice.findFirst({
            select: { id: true, invoiceNumber: true }
        });

        if (!invoice) {
            throw new Error('No se encontraron facturas para probar');
        }

        console.log(`📄 Probando con factura: ${invoice.invoiceNumber}`);
        console.log(`🆔 ID: ${invoice.id}`);

        // 2. Simular llamada al endpoint usando el servicio directamente
        console.log('🔧 Simulando llamada al endpoint...');
        
        const invoiceService = require('../services/invoice-generator.service.js');
        
        const pdfBuffer = await invoiceService.generateInvoicePDFBuffer(invoice.id);
        
        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('Error generando PDF desde el servicio');
        }

        // 3. Guardar PDF de prueba
        const fileName = `endpoint-test-${invoice.invoiceNumber}-${Date.now()}.pdf`;
        const filePath = path.join(__dirname, fileName);
        
        fs.writeFileSync(filePath, pdfBuffer);
        
        console.log(`✅ PDF generado exitosamente: ${fileName}`);
        console.log(`📁 Ubicación: ${filePath}`);
        console.log(`📊 Tamaño: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

        // 4. Verificar que el endpoint está usando el servicio correcto
        console.log('\n🔍 Verificando endpoint...');
        
        const routeCode = fs.readFileSync(path.join(__dirname, '../routes/invoice.routes.js'), 'utf8');
        
        const endpointChecks = {
            'Usa servicio corregido': routeCode.includes('require(\'../services/invoice-generator.service.js\')'),
            'Llama generateInvoicePDFBuffer': routeCode.includes('generateInvoicePDFBuffer'),
            'No genera PDF manualmente': !routeCode.includes('new PDFDocument') || routeCode.indexOf('generateInvoicePDFBuffer') < routeCode.indexOf('new PDFDocument'),
            'Endpoint corregido': routeCode.includes('USANDO SERVICIO CORREGIDO')
        };

        console.log('\n📋 Estado del endpoint:');
        Object.entries(endpointChecks).forEach(([check, passed]) => {
            console.log(`   ${passed ? '✅' : '❌'} ${check}`);
        });

        const allEndpointChecksPass = Object.values(endpointChecks).every(Boolean);

        if (allEndpointChecksPass) {
            console.log('\n🎉 ¡El endpoint está correctamente configurado!');
            console.log('💡 Ahora el PDF se genera usando el servicio con las correcciones');
        } else {
            console.log('\n⚠️  El endpoint necesita más correcciones');
        }

        // 5. Instrucciones finales
        console.log('\n📖 Para probar en la interfaz web:');
        console.log('   1. Reinicia el servidor completamente');
        console.log('   2. Ve a la sección de facturas');
        console.log('   3. Descarga cualquier factura');
        console.log('   4. Verifica que el header esté corregido');

        return {
            success: true,
            endpointCorrected: allEndpointChecksPass,
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
    testPDFEndpoint()
        .then(result => {
            console.log('\n✅ Prueba completada');
            if (result.endpointCorrected) {
                console.log('🎯 El endpoint está usando el servicio corregido');
                console.log('🔄 Reinicia el servidor para aplicar los cambios');
            }
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Error en la prueba:', error.message);
            process.exit(1);
        });
}

module.exports = { testPDFEndpoint };