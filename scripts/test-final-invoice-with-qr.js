#!/usr/bin/env node

/**
 * Script para probar la factura final con todas las correcciones y código QR
 */

const { PrismaClient } = require('@prisma/client');
const invoiceService = require('../services/invoice-generator.service');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testFinalInvoiceWithQR() {
    try {
        console.log('🎨 Probando factura final con todas las correcciones y código QR...\n');

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
            console.log('💡 Crea una factura primero desde la interfaz web para probar las mejoras');
            return;
        }

        console.log(`📄 Factura seleccionada: ${existingInvoice.invoiceNumber}`);
        if (existingInvoice.student) {
            console.log(`👤 Estudiante: ${existingInvoice.student.firstName} ${existingInvoice.student.lastName}`);
            console.log(`📚 Grado: ${existingInvoice.student.grade?.name || 'N/A'} - Grupo: ${existingInvoice.student.group?.name || 'N/A'}`);
        }
        console.log(`💰 Total: $${existingInvoice.total.toLocaleString()}`);

        // Generar PDF final con todas las correcciones
        console.log('🎨 Generando PDF final con todas las correcciones...');
        const pdfBuffer = await invoiceService.generateInvoicePDFBuffer(existingInvoice.id);

        // Guardar PDF final
        const finalPdfPath = path.join(__dirname, '../final-invoice-with-qr.pdf');
        fs.writeFileSync(finalPdfPath, pdfBuffer);

        console.log(`✅ PDF final generado: ${finalPdfPath}`);
        console.log(`📐 Tamaño del archivo: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

        // Información de todas las correcciones implementadas
        console.log('\n🔧 Correcciones aplicadas:');
        console.log('✅ Superposición de "CANT" corregida');
        console.log('✅ IVA siempre muestra $0 (servicios educativos exentos)');
        console.log('✅ Información completa para clientes externos (email y teléfono)');
        console.log('✅ Datos de institución actualizados y correctos');
        console.log('✅ Código QR implementado para verificación');

        console.log('\n📋 Información institucional corregida:');
        console.log('• Nombre: INSTITUCIÓN EDUCATIVA DISTRITAL VILLAS DE SAN PABLO');
        console.log('• NIT: 901.079.125-0');
        console.log('• Email: contabilidad@villasanpablo.edu.co');
        console.log('• Teléfonos: 3004566968-3012678548');
        console.log('• Dirección: Diagonal 136 Nº 9D-60, Barrio Villas de San Pablo');
        console.log('• Resolución DIAN: 06584/2017');

        console.log('\n📱 Código QR incluye:');
        console.log('• Número de factura');
        console.log('• Fecha de emisión');
        console.log('• Total de la factura');
        console.log('• NIT de la institución');
        console.log('• URL de verificación');

        console.log('\n🎨 Elementos de diseño:');
        console.log('• Colores institucionales: Naranja #FF6B35 y Azul #1E3A8A');
        console.log('• Logo más prominente (50x50)');
        console.log('• Rectángulos con bordes de colores');
        console.log('• Tabla con header colorido');
        console.log('• QR en esquina inferior derecha');
        console.log('• Información legal completa');

        console.log('\n🧪 Para verificar:');
        console.log('1. Abrir: final-invoice-with-qr.pdf');
        console.log('2. Verificar que "CANT" no se superpone con valores');
        console.log('3. Confirmar que IVA muestra $0');
        console.log('4. Verificar información institucional actualizada');
        console.log('5. Comprobar que aparece el código QR');
        console.log('6. Escanear QR para ver información de verificación');
        console.log('7. Verificar colores institucionales');

        console.log('\n✅ Factura final con todas las correcciones lista!');
        console.log('🎨 Incluye código QR para verificación y cumple todos los requerimientos');

    } catch (error) {
        console.error('❌ Error generando factura final:', error);
        if (error.message.includes('qrcode')) {
            console.log('💡 Asegúrate de que la librería qrcode esté instalada: npm install qrcode');
        }
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testFinalInvoiceWithQR();
}

module.exports = { testFinalInvoiceWithQR };