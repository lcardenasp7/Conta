/**
 * Crear datos de muestra para el dashboard financiero
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleData() {
    try {
        console.log('📊 Creando datos de muestra para dashboard financiero...');

        // Obtener un estudiante existente
        const student = await prisma.student.findFirst();
        if (!student) {
            console.log('❌ No hay estudiantes en la base de datos');
            return;
        }

        // Obtener un usuario existente
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log('❌ No hay usuarios en la base de datos');
            return;
        }

        // Crear algunos pagos de muestra (ingresos)
        const payments = [
            {
                paymentNumber: 'PAY-' + Date.now() + '-1',
                amount: 50000,
                method: 'CASH',
                date: new Date(),
                status: 'COMPLETED',
                studentId: student.id,
                userId: user.id,
                observations: 'Pago mensualidad'
            },
            {
                paymentNumber: 'PAY-' + Date.now() + '-2',
                amount: 25000,
                method: 'BANK_TRANSFER',
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 días atrás
                status: 'COMPLETED',
                studentId: student.id,
                userId: user.id,
                observations: 'Pago transporte'
            },
            {
                paymentNumber: 'PAY-' + Date.now() + '-3',
                amount: 15000,
                method: 'CARD',
                date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 días atrás
                status: 'COMPLETED',
                studentId: student.id,
                userId: user.id,
                observations: 'Pago materiales'
            }
        ];

        for (const payment of payments) {
            await prisma.payment.create({ data: payment });
        }

        // Crear algunas facturas de gastos
        const invoices = [
            {
                invoiceNumber: 'GASTO-001',
                type: 'OUTGOING',
                total: 80000,
                concept: 'UTILITIES',
                date: new Date(),
                dueDate: new Date(),
                status: 'PAID',
                supplierName: 'Empresa de Servicios',
                userId: user.id
            },
            {
                invoiceNumber: 'GASTO-002',
                type: 'OUTGOING',
                total: 45000,
                concept: 'EDUCATIONAL_MATERIALS',
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                status: 'PAID',
                supplierName: 'Librería Educativa',
                userId: user.id
            },
            {
                invoiceNumber: 'GASTO-003',
                type: 'OUTGOING',
                total: 25000,
                concept: 'MAINTENANCE',
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                status: 'PAID',
                supplierName: 'Servicios de Mantenimiento',
                userId: user.id
            }
        ];

        for (const invoice of invoices) {
            await prisma.invoice.create({ data: invoice });
        }

        // Crear algunas facturas pendientes
        const pendingInvoices = [
            {
                invoiceNumber: 'PEND-001',
                type: 'INCOMING',
                total: 120000,
                concept: 'MONTHLY',
                date: new Date(),
                status: 'PENDING',
                studentId: student.id,
                userId: user.id,
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
            },
            {
                invoiceNumber: 'PEND-002',
                type: 'INCOMING',
                total: 75000,
                concept: 'TRANSPORT',
                date: new Date(),
                status: 'PENDING',
                studentId: student.id,
                userId: user.id,
                dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
            }
        ];

        for (const invoice of pendingInvoices) {
            await prisma.invoice.create({ data: invoice });
        }

        console.log('✅ Datos de muestra creados exitosamente:');
        console.log(`- ${payments.length} pagos (ingresos)`);
        console.log(`- ${invoices.length} facturas de gastos`);
        console.log(`- ${pendingInvoices.length} facturas pendientes`);

    } catch (error) {
        console.error('❌ Error creando datos de muestra:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createSampleData();