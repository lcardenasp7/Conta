#!/usr/bin/env node

/**
 * Script para generar una factura de prueba en formato media hoja
 */

const { PrismaClient } = require('@prisma/client');
const invoiceService = require('../services/invoice-generator.service');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function generateTestInvoice() {
    try {
        console.log('🧾 Probando formato media hoja con factura existente...\n');

        // Buscar una factura existente
        const existingInvoice = await prisma.invoice.findFirst({
            include: {
                student: {
                    include: {
                        grade: { select: { name: true } },
                        group: { select: { name: true } }
                    }
                },
                items: true
            }
        });

        if (!existingInvoice) {
            console.log('❌ No se encontraron facturas en la base de datos');
            console.log('💡 Crea una factura primero desde la interfaz web para probar el formato');
            return;
        }

        console.log(`📄 Factura seleccionada: ${existingInvoice.invoiceNumber}`);
        if (existingInvoice.student) {
            console.log(`👤 Estudiante: ${existingInvoice.student.firstName} ${existingInvoice.student.lastName}`);
            console.log(`📚 Grado: ${existingInvoice.student.grade?.name || 'N/A'} - Grupo: ${existingInvoice.student.group?.name || 'N/A'}`);
        }
        console.log(`💰 Total: $${existingInvoice.total.toLocaleString()}`);

        // Generar PDF en formato media hoja
        console.log('📄 Generando PDF en formato media hoja...');
        const pdfBuffer = await invoiceService.generateInvoicePDFBuffer(existingInvoice.id);

        // Guardar PDF de prueba
        const testPdfPath = path.join(__dirname, '../test-invoice-half-page.pdf');
        fs.writeFileSync(testPdfPath, pdfBuffer);

        console.log(`✅ PDF generado exitosamente: ${testPdfPath}`);
        console.log(`📐 Tamaño del archivo: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

        // Información del PDF generado
        console.log('\n📋 Detalles del PDF generado:');
        console.log('• Formato: Media hoja carta (8.5" x 5.5")');
        console.log('• Márgenes: 25 puntos');
        console.log('• Teléfonos: 3004566968-3012678548');
        console.log('• Layout: Compacto de una página');

        console.log('\n🧪 Para probar:');
        console.log('1. Abrir el archivo: test-invoice-half-page.pdf');
        console.log('2. Verificar que el tamaño sea media hoja carta');
        console.log('3. Confirmar que no hay superposición de texto');
        console.log('4. Verificar que los teléfonos sean correctos');
        console.log('5. Comparar con el formato anterior (A4)');

        console.log('\n✅ Prueba completada exitosamente!');
        console.log('📄 El archivo PDF está listo para revisión');

    } catch (error) {
        console.error('❌ Error generando factura de prueba:', error);
        if (error.message.includes('not found')) {
            console.log('💡 Asegúrate de que el servicio de facturas esté funcionando correctamente');
        }
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    generateTestInvoice();
}

module.exports = { generateTestInvoice };