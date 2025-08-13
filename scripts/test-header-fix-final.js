/**
 * Script final para probar las correcciones del header
 * Fuerza la regeneración del PDF con las correcciones aplicadas
 */

const { PrismaClient } = require('@prisma/client');
const invoiceService = require('../services/invoice-generator.service.js');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testHeaderFixFinal() {
    try {
        console.log('🔧 Probando correcciones finales del header...\n');

        // 1. Crear una factura nueva para probar
        const student = await prisma.student.findFirst({
            include: {
                grade: { select: { name: true } },
                group: { select: { name: true } }
            }
        });

        if (!student) {
            throw new Error('No hay estudiantes disponibles');
        }

        const user = await prisma.user.findFirst();
        if (!user) {
            throw new Error('No hay usuarios disponibles');
        }

        // 2. Crear factura de prueba con nombre específico
        const testInvoice = await prisma.invoice.create({
            data: {
                invoiceNumber: `FAC-2025-TEST${Date.now().toString().slice(-6)}`,
                studentId: student.id,
                concept: 'OTHER',
                date: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                subtotal: 150000,
                tax: 0,
                total: 150000,
                status: 'PENDING',
                userId: user.id,
                observations: 'Factura de prueba - Header corregido',
                items: {
                    create: [{
                        description: 'PRUEBA',
                        quantity: 1,
                        unitPrice: 150000,
                        total: 150000
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

        console.log(`✅ Factura de prueba creada: ${testInvoice.invoiceNumber}`);

        // 3. Generar PDF con correcciones
        console.log('📄 Generando PDF con header corregido...');
        
        const pdfBuffer = await invoiceService.generateInvoicePDFBuffer(testInvoice.id);
        
        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('Error generando PDF');
        }

        // 4. Guardar PDF
        const fileName = `header-corregido-final-${Date.now()}.pdf`;
        const filePath = path.join(__dirname, fileName);
        
        fs.writeFileSync(filePath, pdfBuffer);
        
        console.log(`✅ PDF generado: ${fileName}`);
        console.log(`📁 Ubicación: ${filePath}`);
        console.log(`📊 Tamaño: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

        // 5. Mostrar información
        console.log('\n📋 Información de la factura:');
        console.log(`   • Número: ${testInvoice.invoiceNumber}`);
        console.log(`   • Cliente: ${testInvoice.student.firstName} ${testInvoice.student.lastName}`);
        console.log(`   • Total: $${testInvoice.total.toLocaleString()}`);

        console.log('\n🎯 Correcciones aplicadas:');
        console.log('✅ Nombre de institución dividido en múltiples líneas');
        console.log('✅ Tamaño de fuente reducido a 9pt');
        console.log('✅ Dirección específica agregada');
        console.log('✅ Espaciado mejorado entre elementos');
        console.log('✅ Línea separadora reposicionada');

        // 6. Limpiar - eliminar factura de prueba
        await prisma.invoice.delete({
            where: { id: testInvoice.id }
        });

        console.log('\n✅ Factura de prueba eliminada');

        return {
            success: true,
            pdfPath: filePath,
            pdfSize: pdfBuffer.length
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
    testHeaderFixFinal()
        .then(result => {
            console.log('\n🎉 Prueba completada exitosamente');
            console.log('💡 Revisa el PDF generado para verificar las correcciones');
            console.log('🔄 Reinicia el servidor si es necesario para aplicar cambios');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Error en la prueba:', error.message);
            process.exit(1);
        });
}

module.exports = { testHeaderFixFinal };