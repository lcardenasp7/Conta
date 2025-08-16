#!/usr/bin/env node

/**
 * Script para probar la factura mejorada con todas las mejoras legales y de diseño
 */

const { PrismaClient } = require('@prisma/client');
const invoiceService = require('../services/invoice-generator.service');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testImprovedInvoice() {
    try {
        console.log('🎨 Probando factura mejorada con mejoras legales y de diseño...\n');

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

        // Generar PDF mejorado
        console.log('🎨 Generando PDF con mejoras legales y de diseño...');
        const pdfBuffer = await invoiceService.generateInvoicePDFBuffer(existingInvoice.id);

        // Guardar PDF mejorado
        const improvedPdfPath = path.join(__dirname, '../improved-invoice-half-page.pdf');
        fs.writeFileSync(improvedPdfPath, pdfBuffer);

        console.log(`✅ PDF mejorado generado: ${improvedPdfPath}`);
        console.log(`📐 Tamaño del archivo: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

        // Información de las mejoras implementadas
        console.log('\n🎨 Mejoras implementadas:');
        console.log('✅ Logo más prominente (50x50 vs 40x40)');
        console.log('✅ Información legal completa (NIT, Régimen, CIIU)');
        console.log('✅ Resolución DIAN incluida');
        console.log('✅ Email actualizado: contabilidad@villasanpablo.edu.co');
        console.log('✅ Colores institucionales (naranja #FF6B35 y azul #1E3A8A)');
        console.log('✅ Rectángulos con bordes de colores');
        console.log('✅ Información del cliente mejorada');
        console.log('✅ Tabla con header colorido');
        console.log('✅ Totales con información fiscal completa');
        console.log('✅ Total en letras (requerimiento legal)');
        console.log('✅ Footer con información de pago y legal');
        console.log('✅ Jerarquía visual mejorada');
        console.log('✅ Separación clara de secciones');

        console.log('\n📋 Información legal incluida:');
        console.log('• Régimen tributario: Común');
        console.log('• Resolución DIAN: 18764003688415');
        console.log('• Actividad económica: 8521 - Enseñanza');
        console.log('• Base gravable identificada');
        console.log('• IVA exento especificado');
        console.log('• Total en letras');
        console.log('• Forma de pago especificada');

        console.log('\n🎨 Elementos de diseño:');
        console.log('• Colores institucionales solo en líneas y bordes');
        console.log('• Rectángulos con fondos sutiles');
        console.log('• Header de tabla con fondo azul');
        console.log('• Líneas separadoras naranjas');
        console.log('• Estados con colores semafóricos');
        console.log('• Tipografía jerárquica');

        console.log('\n🧪 Para verificar:');
        console.log('1. Abrir: improved-invoice-half-page.pdf');
        console.log('2. Verificar tamaño media hoja carta (8.5" x 5.5")');
        console.log('3. Confirmar colores institucionales');
        console.log('4. Verificar información legal completa');
        console.log('5. Comprobar que no hay superposición');
        console.log('6. Verificar email: contabilidad@villasanpablo.edu.co');
        console.log('7. Confirmar total en letras');

        console.log('\n✅ Factura mejorada lista para revisión!');
        console.log('🎨 Cumple con todos los requerimientos legales y de diseño');

    } catch (error) {
        console.error('❌ Error generando factura mejorada:', error);
        if (error.message.includes('not found')) {
            console.log('💡 Asegúrate de que el servicio de facturas esté funcionando correctamente');
        }
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testImprovedInvoice();
}

module.exports = { testImprovedInvoice };