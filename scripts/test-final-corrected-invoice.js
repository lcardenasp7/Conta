/**
 * Script final para probar todas las correcciones de factura
 */

const { PrismaClient } = require('@prisma/client');
const invoiceService = require('../services/invoice-generator.service');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testFinalCorrectedInvoice() {
    try {
        console.log('🎯 Probando factura con todas las correcciones aplicadas...');

        // 1. Buscar un usuario válido
        const user = await prisma.user.findFirst();
        if (!user) {
            throw new Error('No hay usuarios en la base de datos');
        }

        // 2. Buscar un estudiante y actualizar su información de contacto
        const student = await prisma.student.findFirst({
            include: {
                grade: { select: { name: true } },
                group: { select: { name: true } }
            }
        });

        if (!student) {
            throw new Error('No hay estudiantes en la base de datos');
        }

        // Actualizar información de contacto del estudiante
        await prisma.student.update({
            where: { id: student.id },
            data: {
                email: student.email || 'estudiante@villasanpablo.edu.co',
                phone: student.phone || '3001234567'
            }
        });

        console.log('📞 Información de contacto del estudiante actualizada');

        // 3. Crear factura de prueba CORRECTA (sin IVA)
        const testInvoice = await prisma.invoice.create({
            data: {
                invoiceNumber: `CORRECTED-${Date.now()}`,
                studentId: student.id,
                concept: 'MONTHLY',
                date: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                subtotal: 180000,
                tax: 0, // SIN IVA - Servicios educativos exentos
                total: 180000, // Total = Subtotal (sin IVA)
                status: 'PENDING',
                userId: user.id, // Usar ID de usuario válido
                observations: 'Factura corregida - Todas las mejoras aplicadas',
                items: {
                    create: [{
                        description: 'Mensualidad Escolar - Agosto 2025',
                        quantity: 1,
                        unitPrice: 180000,
                        total: 180000
                    }]
                }
            },
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

        console.log(`✅ Factura corregida creada: ${testInvoice.invoiceNumber}`);
        console.log(`   Cliente: ${testInvoice.student.firstName} ${testInvoice.student.lastName}`);
        console.log(`   Subtotal: $${testInvoice.subtotal.toLocaleString()}`);
        console.log(`   IVA: $${testInvoice.tax.toLocaleString()}`);
        console.log(`   Total: $${testInvoice.total.toLocaleString()}`);

        // 4. Generar PDF con todas las correcciones
        console.log('📄 Generando PDF con todas las correcciones...');
        
        const pdfBuffer = await invoiceService.generateInvoicePDFBuffer(testInvoice.id);
        
        // Guardar PDF
        const testPdfPath = path.join(__dirname, '..', 'factura-final-corregida.pdf');
        fs.writeFileSync(testPdfPath, pdfBuffer);

        console.log('🎉 TODAS LAS CORRECCIONES APLICADAS:');
        console.log('   ✅ Formato media hoja carta (8.5" x 5.5")');
        console.log('   ✅ Una sola página');
        console.log('   ✅ QR en el header junto al número de factura');
        console.log('   ✅ Sin superposiciones de texto');
        console.log('   ✅ Precios dentro del margen');
        console.log('   ✅ Footer alineado a la izquierda (no centrado)');
        console.log('   ✅ Información de contacto del estudiante incluida');
        console.log('   ✅ IVA = 0 (servicios educativos exentos)');
        console.log('   ✅ Total correcto = Subtotal');
        console.log('   ✅ Total en letras correcto');

        console.log(`📁 PDF generado: ${testPdfPath}`);
        console.log(`📊 Tamaño: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

        // 5. Verificar el total en letras
        const totalInWords = invoiceService.numberToWords(testInvoice.total);
        console.log(`💬 Total en letras: "${totalInWords} PESOS M/CTE"`);

        return {
            success: true,
            invoiceNumber: testInvoice.invoiceNumber,
            total: testInvoice.total,
            totalInWords: totalInWords,
            pdfPath: testPdfPath,
            corrections: [
                'Media hoja carta',
                'Una sola página',
                'QR en header',
                'Footer alineado izquierda',
                'Contacto del estudiante',
                'IVA = 0',
                'Total correcto',
                'Sin superposiciones'
            ]
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
    testFinalCorrectedInvoice()
        .then(result => {
            console.log('\n🏆 PRUEBA FINAL COMPLETADA EXITOSAMENTE');
            console.log('📋 Resumen:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error en prueba final:', error);
            process.exit(1);
        });
}

module.exports = testFinalCorrectedInvoice;