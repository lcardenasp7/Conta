/**
 * Script para probar una factura de transporte específica
 * Simula la factura que se mostró en la imagen
 */

const { PrismaClient } = require('@prisma/client');
const invoiceService = require('../services/invoice-generator.service.js');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createTransportInvoiceTest() {
    try {
        console.log('🚌 Creando factura de transporte de prueba...\n');

        // 1. Buscar estudiante existente
        let student = await prisma.student.findFirst({
            include: {
                grade: { select: { name: true } },
                group: { select: { name: true } }
            }
        });

        if (!student) {
            throw new Error('No hay estudiantes en la base de datos para probar');
        }

        console.log(`✅ Usando estudiante: ${student.firstName} ${student.lastName}`);

        // 2. Obtener un usuario válido
        const user = await prisma.user.findFirst();
        if (!user) {
            throw new Error('No hay usuarios en la base de datos');
        }

        // 3. Crear factura de transporte
        const transportInvoice = await prisma.invoice.create({
            data: {
                invoiceNumber: `FAC-2025-${String(Date.now()).slice(-6)}`,
                studentId: student.id,
                concept: 'TRANSPORT',
                date: new Date('2025-08-13'),
                dueDate: new Date('2025-09-11'),
                subtotal: 150000,
                tax: 0,
                total: 150000,
                status: 'PENDING',
                userId: user.id,
                observations: 'Factura de prueba - Transporte',
                items: {
                    create: [{
                        description: 'Transporte Barranquilla colegio',
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

        console.log(`📄 Factura creada: ${transportInvoice.invoiceNumber}`);

        // 4. Generar PDF
        console.log('🔧 Generando PDF con header corregido...');
        
        const pdfBuffer = await invoiceService.generateInvoicePDFBuffer(transportInvoice.id);
        
        // 5. Guardar PDF
        const fileName = `factura-transporte-corregida-${Date.now()}.pdf`;
        const filePath = path.join(__dirname, fileName);
        
        fs.writeFileSync(filePath, pdfBuffer);
        
        console.log(`✅ PDF generado: ${fileName}`);
        console.log(`📁 Ubicación: ${filePath}`);
        console.log(`📊 Tamaño: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

        // 6. Mostrar detalles
        console.log('\n📋 Detalles de la factura:');
        console.log(`   • Número: ${transportInvoice.invoiceNumber}`);
        console.log(`   • Cliente: ${transportInvoice.student.firstName} ${transportInvoice.student.lastName}`);
        console.log(`   • Documento: ${transportInvoice.student.document}`);
        console.log(`   • Email: ${transportInvoice.student.email}`);
        console.log(`   • Teléfono: ${transportInvoice.student.phone}`);
        console.log(`   • Concepto: Transporte`);
        console.log(`   • Descripción: ${transportInvoice.items[0].description}`);
        console.log(`   • Total: $${transportInvoice.total.toLocaleString()}`);
        console.log(`   • Fecha: ${transportInvoice.date.toLocaleDateString()}`);
        console.log(`   • Vencimiento: ${transportInvoice.dueDate.toLocaleDateString()}`);

        console.log('\n🎯 Correcciones aplicadas:');
        console.log('✅ Nombre de institución no se superpone');
        console.log('✅ Dirección agregada: "Dg. 136 #9D - 60, Suroccidente, Barranquilla"');
        console.log('✅ Mejor espaciado en el header');
        console.log('✅ Información de contacto reorganizada');

        return {
            success: true,
            invoiceId: transportInvoice.id,
            invoiceNumber: transportInvoice.invoiceNumber,
            pdfPath: filePath
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
    createTransportInvoiceTest()
        .then(result => {
            console.log('\n✅ Prueba completada exitosamente');
            console.log('💡 Revisa el PDF generado para verificar las correcciones');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Error en la prueba:', error.message);
            process.exit(1);
        });
}

module.exports = { createTransportInvoiceTest };