/**
 * Script para crear datos de prueba para el dashboard financiero
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestData() {
    try {
        console.log('🧪 CREANDO DATOS DE PRUEBA PARA DASHBOARD FINANCIERO');
        console.log('===================================================');

        // Verificar si hay estudiantes
        const studentCount = await prisma.student.count();
        console.log(`📊 Estudiantes en la base de datos: ${studentCount}`);

        if (studentCount === 0) {
            console.log('⚠️ No hay estudiantes. Creando estudiante de prueba...');
            await prisma.student.create({
                data: {
                    document: '12345678',
                    documentType: 'CC',
                    firstName: 'Juan',
                    lastName: 'Pérez',
                    birthDate: new Date('2000-01-01'),
                    gender: 'M',
                    address: 'Calle 123',
                    phone: '3001234567',
                    email: 'juan.perez@test.com',
                    status: 'ACTIVE',
                    gradeId: 1,
                    groupId: 1
                }
            });
            console.log('✅ Estudiante de prueba creado');
        }

        // Obtener un estudiante para las pruebas
        const student = await prisma.student.findFirst();
        if (!student) {
            throw new Error('No se pudo obtener un estudiante para las pruebas');
        }

        // Obtener un usuario para las pruebas
        const user = await prisma.user.findFirst();
        if (!user) {
            throw new Error('No se pudo obtener un usuario para las pruebas');
        }

        console.log(`👤 Usando estudiante: ${student.firstName} ${student.lastName} (ID: ${student.id})`);
        console.log(`👨‍💼 Usando usuario: ${user.name} (ID: ${user.id})`);

        // Crear facturas de prueba
        console.log('\n💰 Creando facturas de prueba...');
        
        const invoices = [];
        const concepts = ['MONTHLY', 'TUITION', 'EVENT', 'TRANSPORT'];
        const amounts = [180000, 350000, 50000, 80000];

        for (let i = 0; i < 4; i++) {
            const invoice = await prisma.invoice.create({
                data: {
                    invoiceNumber: `FAC-TEST-${String(i + 1).padStart(3, '0')}`,
                    studentId: student.id,
                    userId: user.id,
                    concept: concepts[i],
                    date: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)), // Una por semana hacia atrás
                    dueDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 días desde hoy
                    subtotal: amounts[i],
                    tax: amounts[i] * 0.19,
                    total: amounts[i] * 1.19,
                    status: i < 2 ? 'PAID' : 'PENDING',
                    type: 'OUTGOING',
                    items: {
                        create: [{
                            description: `Concepto ${concepts[i]}`,
                            quantity: 1,
                            unitPrice: amounts[i],
                            total: amounts[i]
                        }]
                    }
                }
            });
            invoices.push(invoice);
            console.log(`✅ Factura creada: ${invoice.invoiceNumber} - $${amounts[i].toLocaleString()}`);
        }

        // Crear pagos de prueba para las facturas pagadas
        console.log('\n💳 Creando pagos de prueba...');
        
        for (let i = 0; i < 2; i++) { // Solo para las 2 primeras facturas (marcadas como PAID)
            const payment = await prisma.payment.create({
                data: {
                    paymentNumber: `PAG-TEST-${String(i + 1).padStart(3, '0')}`,
                    studentId: student.id,
                    invoiceId: invoices[i].id,
                    amount: invoices[i].total,
                    method: i === 0 ? 'CASH' : 'BANK_TRANSFER',
                    date: new Date(Date.now() - ((i + 1) * 5 * 24 * 60 * 60 * 1000)), // 5 y 10 días atrás
                    reference: `REF-TEST-${i + 1}`,
                    status: 'COMPLETED'
                }
            });
            console.log(`✅ Pago creado: ${payment.paymentNumber} - $${payment.amount.toLocaleString()}`);
        }

        // Crear algunas facturas de gastos (INCOMING)
        console.log('\n📄 Creando facturas de gastos...');
        
        const expenseConcepts = ['UTILITIES', 'MAINTENANCE', 'OFFICE_SUPPLIES'];
        const expenseAmounts = [200000, 150000, 80000];

        for (let i = 0; i < 3; i++) {
            const expense = await prisma.invoice.create({
                data: {
                    invoiceNumber: `GASTO-TEST-${String(i + 1).padStart(3, '0')}`,
                    userId: user.id,
                    concept: expenseConcepts[i],
                    date: new Date(Date.now() - (i * 10 * 24 * 60 * 60 * 1000)),
                    dueDate: new Date(Date.now() - (i * 5 * 24 * 60 * 60 * 1000)),
                    subtotal: expenseAmounts[i],
                    tax: 0,
                    total: expenseAmounts[i],
                    status: 'PAID',
                    type: 'INCOMING',
                    supplierName: `Proveedor Test ${i + 1}`,
                    items: {
                        create: [{
                            description: `Gasto en ${expenseConcepts[i]}`,
                            quantity: 1,
                            unitPrice: expenseAmounts[i],
                            total: expenseAmounts[i]
                        }]
                    }
                }
            });
            console.log(`✅ Gasto creado: ${expense.invoiceNumber} - $${expenseAmounts[i].toLocaleString()}`);
        }

        console.log('\n📊 RESUMEN DE DATOS CREADOS:');
        console.log('============================');
        
        const totalInvoices = await prisma.invoice.count({ where: { type: 'OUTGOING' } });
        const totalPayments = await prisma.payment.count();
        const totalExpenses = await prisma.invoice.count({ where: { type: 'INCOMING' } });
        
        console.log(`📄 Facturas de ingresos: ${totalInvoices}`);
        console.log(`💳 Pagos registrados: ${totalPayments}`);
        console.log(`📋 Facturas de gastos: ${totalExpenses}`);

        console.log('\n✅ DATOS DE PRUEBA CREADOS EXITOSAMENTE');
        console.log('Ahora puedes probar el dashboard financiero en el navegador');

    } catch (error) {
        console.error('❌ Error creando datos de prueba:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestData();