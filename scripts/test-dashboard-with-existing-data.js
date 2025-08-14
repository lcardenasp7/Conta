/**
 * Script para probar el dashboard con datos existentes
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDashboardData() {
    try {
        console.log('🔍 ANALIZANDO DATOS EXISTENTES PARA EL DASHBOARD');
        console.log('===============================================');

        // Contar datos existentes
        const studentCount = await prisma.student.count();
        const invoiceCount = await prisma.invoice.count();
        const paymentCount = await prisma.payment.count();

        console.log(`👥 Estudiantes: ${studentCount}`);
        console.log(`📄 Facturas: ${invoiceCount}`);
        console.log(`💳 Pagos: ${paymentCount}`);

        if (invoiceCount === 0 && paymentCount === 0) {
            console.log('\n⚠️ No hay datos financieros en la base de datos');
            console.log('El dashboard mostrará valores en cero, lo cual es normal');
            console.log('\n✅ ESTO ES ESPERADO - El dashboard debe funcionar aunque no haya datos');
            return;
        }

        // Analizar facturas por tipo
        const outgoingInvoices = await prisma.invoice.count({ where: { type: 'OUTGOING' } });
        const incomingInvoices = await prisma.invoice.count({ where: { type: 'INCOMING' } });

        console.log(`\n📊 Análisis de facturas:`);
        console.log(`📤 Facturas emitidas (ingresos): ${outgoingInvoices}`);
        console.log(`📥 Facturas recibidas (gastos): ${incomingInvoices}`);

        // Analizar pagos
        const completedPayments = await prisma.payment.count({ where: { status: 'COMPLETED' } });
        const pendingPayments = await prisma.payment.count({ where: { status: 'PENDING' } });

        console.log(`\n💰 Análisis de pagos:`);
        console.log(`✅ Pagos completados: ${completedPayments}`);
        console.log(`⏳ Pagos pendientes: ${pendingPayments}`);

        // Calcular totales aproximados
        const totalIncome = await prisma.payment.aggregate({
            where: { status: 'COMPLETED' },
            _sum: { amount: true }
        });

        const totalExpenses = await prisma.invoice.aggregate({
            where: { type: 'INCOMING', status: 'PAID' },
            _sum: { total: true }
        });

        console.log(`\n💵 Totales calculados:`);
        console.log(`💚 Total ingresos: $${(totalIncome._sum.amount || 0).toLocaleString()}`);
        console.log(`💸 Total gastos: $${(totalExpenses._sum.total || 0).toLocaleString()}`);
        console.log(`📈 Flujo neto: $${((totalIncome._sum.amount || 0) - (totalExpenses._sum.total || 0)).toLocaleString()}`);

        console.log('\n✅ ANÁLISIS COMPLETADO');
        console.log('El dashboard debería mostrar estos datos o valores en cero si no hay datos');

    } catch (error) {
        console.error('❌ Error analizando datos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testDashboardData();