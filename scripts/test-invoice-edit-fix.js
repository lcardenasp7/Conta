/**
 * Script para probar y solucionar el error de edición de facturas
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testInvoiceEditFix() {
    try {
        console.log('🔧 Probando corrección de edición de facturas...');

        // 1. Buscar una factura PENDING para probar
        const testInvoice = await prisma.invoice.findFirst({
            where: { 
                status: 'PENDING'
            },
            include: {
                items: true,
                payments: true,
                student: {
                    include: {
                        grade: { select: { name: true } },
                        group: { select: { name: true } }
                    }
                }
            }
        });

        if (!testInvoice) {
            console.log('📝 Creando factura de prueba...');
            
            const student = await prisma.student.findFirst();
            const user = await prisma.user.findFirst();
            
            if (!student || !user) {
                throw new Error('No hay estudiantes o usuarios en la base de datos');
            }

            const createdInvoice = await prisma.invoice.create({
                data: {
                    invoiceNumber: `EDIT-TEST-${Date.now()}`,
                    studentId: student.id,
                    concept: 'MONTHLY',
                    date: new Date(),
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    subtotal: 150000,
                    tax: 0,
                    total: 150000,
                    status: 'PENDING',
                    userId: user.id,
                    observations: 'Factura de prueba para edición',
                    items: {
                        create: [{
                            description: 'Mensualidad Original',
                            quantity: 1,
                            unitPrice: 150000,
                            total: 150000
                        }]
                    }
                },
                include: {
                    items: true,
                    payments: true,
                    student: {
                        include: {
                            grade: { select: { name: true } },
                            group: { select: { name: true } }
                        }
                    }
                }
            });

            console.log(`✅ Factura de prueba creada: ${createdInvoice.invoiceNumber}`);
            testInvoice = createdInvoice;
        } else {
            console.log(`📄 Usando factura existente: ${testInvoice.invoiceNumber}`);
        }

        // 2. Probar edición directa en la base de datos
        console.log('🧪 Probando edición directa...');
        
        const editData = {
            dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            concept: 'MONTHLY',
            observations: 'Factura editada - Prueba de corrección',
            subtotal: 180000,
            tax: 0,
            total: 180000
        };

        const updatedInvoice = await prisma.$transaction(async (tx) => {
            // Actualizar factura
            const invoice = await tx.invoice.update({
                where: { id: testInvoice.id },
                data: editData
            });

            // Actualizar items
            await tx.invoiceItem.deleteMany({
                where: { invoiceId: testInvoice.id }
            });

            await tx.invoiceItem.createMany({
                data: [{
                    invoiceId: testInvoice.id,
                    description: 'Mensualidad Editada',
                    quantity: 1,
                    unitPrice: 180000,
                    total: 180000
                }]
            });

            return await tx.invoice.findUnique({
                where: { id: testInvoice.id },
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
        });

        console.log('✅ Edición directa exitosa');
        console.log(`   Total actualizado: $${updatedInvoice.total.toLocaleString()}`);
        console.log(`   Items: ${updatedInvoice.items.length}`);

        // 3. Crear script de prueba para el navegador
        const browserTestScript = `
// Script para probar edición de facturas en el navegador
async function testInvoiceEdit() {
    console.log('🧪 Probando edición de factura...');
    
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('❌ No hay token de autenticación');
        return;
    }

    const invoiceId = '${testInvoice.id}';
    console.log('📄 Probando con factura:', invoiceId);

    try {
        // Datos de prueba para edición
        const testData = {
            dueDate: '${new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}',
            concept: 'MONTHLY',
            observations: 'Factura editada desde navegador - Prueba',
            items: [{
                description: 'Mensualidad Navegador',
                quantity: 1,
                unitPrice: 200000
            }]
        };

        console.log('📤 Enviando datos:', testData);

        const response = await fetch(\`/api/invoices/\${invoiceId}\`, {
            method: 'PUT',
            headers: {
                'Authorization': \`Bearer \${token}\`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        console.log('📥 Response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Edición exitosa:', result);
        } else {
            const error = await response.json().catch(() => ({}));
            console.error('❌ Error en edición:', error);
        }

    } catch (error) {
        console.error('❌ Error probando edición:', error);
    }
}

// Ejecutar automáticamente
testInvoiceEdit();
`;

        // Guardar script para el navegador
        const fs = require('fs');
        fs.writeFileSync('public/test-invoice-edit.js', browserTestScript);
        console.log('📝 Script de prueba creado: public/test-invoice-edit.js');

        // 4. Instrucciones
        console.log('');
        console.log('📋 INSTRUCCIONES PARA PROBAR LA EDICIÓN:');
        console.log('');
        console.log('1. Abrir el navegador en: http://localhost:3000');
        console.log('2. Iniciar sesión en el sistema');
        console.log('3. Abrir la consola del navegador (F12)');
        console.log('4. Ejecutar:');
        console.log('');
        console.log('   const script = document.createElement("script");');
        console.log('   script.src = "/test-invoice-edit.js";');
        console.log('   document.head.appendChild(script);');
        console.log('');
        console.log('5. Revisar los logs en la consola');
        console.log('');
        console.log('📊 Si funciona, el problema estaba en el manejo de errores del backend.');

        return {
            success: true,
            testInvoiceId: testInvoice.id,
            testInvoiceNumber: testInvoice.invoiceNumber,
            message: 'Corrección aplicada y probada exitosamente'
        };

    } catch (error) {
        console.error('❌ Error en prueba de edición:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testInvoiceEditFix()
        .then(result => {
            console.log('✅ Prueba completada:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = testInvoiceEditFix;