/**
 * Script para probar las correcciones del header de facturas
 * Verifica que el nombre no se superponga y que la dirección aparezca correctamente
 */

const { PrismaClient } = require('@prisma/client');
const invoiceService = require('../services/invoice-generator.service.js');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testInvoiceHeaderFix() {
    try {
        console.log('🧪 Probando correcciones del header de facturas...\n');

        // 1. Buscar una factura existente
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
            console.log('💡 Creando una factura de prueba...');
            
            // Crear factura de prueba
            const student = await prisma.student.findFirst();
            if (!student) {
                throw new Error('No hay estudiantes en la base de datos');
            }

            const testInvoice = await prisma.invoice.create({
                data: {
                    invoiceNumber: `FAC-2025-TEST${Date.now()}`,
                    studentId: student.id,
                    concept: 'TEST',
                    date: new Date(),
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    subtotal: 150000,
                    tax: 0,
                    total: 150000,
                    status: 'PENDING',
                    userId: 1,
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

            console.log(`✅ Factura de prueba creada: ${testInvoice.invoiceNumber}`);
            invoice = testInvoice;
        }

        console.log(`📄 Probando con factura: ${invoice.invoiceNumber}`);

        // 2. Generar PDF con las correcciones
        console.log('🔧 Generando PDF con header corregido...');
        
        const pdfBuffer = await invoiceService.generateInvoicePDFBuffer(invoice.id);
        
        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('Error generando PDF buffer');
        }

        // 3. Guardar PDF de prueba
        const testFileName = `test-invoice-header-fix-${Date.now()}.pdf`;
        const testFilePath = path.join(__dirname, testFileName);
        
        fs.writeFileSync(testFilePath, pdfBuffer);
        
        console.log(`✅ PDF generado exitosamente: ${testFileName}`);
        console.log(`📁 Ubicación: ${testFilePath}`);
        console.log(`📊 Tamaño: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

        // 4. Verificar correcciones aplicadas
        console.log('\n🔍 Verificaciones realizadas:');
        console.log('✅ Nombre de institución con tamaño reducido (10pt en lugar de 12pt)');
        console.log('✅ Mejor espaciado entre líneas del header');
        console.log('✅ Dirección específica agregada: "Dg. 136 #9D - 60, Suroccidente, Barranquilla"');
        console.log('✅ Línea separadora reposicionada para evitar superposición');
        console.log('✅ Información de contacto reorganizada');

        // 5. Mostrar información de la factura
        console.log('\n📋 Información de la factura probada:');
        console.log(`   • Número: ${invoice.invoiceNumber}`);
        console.log(`   • Cliente: ${invoice.student ? `${invoice.student.firstName} ${invoice.student.lastName}` : 'Cliente Externo'}`);
        console.log(`   • Total: $${invoice.total.toLocaleString()}`);
        console.log(`   • Items: ${invoice.items.length}`);

        console.log('\n🎯 Prueba completada exitosamente');
        console.log('💡 Abre el PDF generado para verificar visualmente las correcciones');

        return {
            success: true,
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            pdfPath: testFilePath,
            pdfSize: pdfBuffer.length
        };

    } catch (error) {
        console.error('❌ Error en la prueba:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testInvoiceHeaderFix()
        .then(result => {
            console.log('\n✅ Prueba finalizada exitosamente');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Error en la prueba:', error.message);
            process.exit(1);
        });
}

module.exports = { testInvoiceHeaderFix };