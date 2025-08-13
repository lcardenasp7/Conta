#!/usr/bin/env node

/**
 * Script para diagnosticar y corregir errores del dashboard
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDashboardQueries() {
    console.log('🔍 Diagnosticando consultas del dashboard...\n');

    try {
        // Test basic counts
        console.log('📊 Probando conteos básicos...');
        const totalStudents = await prisma.student.count();
        const activeStudents = await prisma.student.count({ where: { status: 'ACTIVE' } });
        console.log(`✅ Estudiantes: ${totalStudents} total, ${activeStudents} activos`);

        const totalEvents = await prisma.event.count();
        const activeEvents = await prisma.event.count({ where: { status: 'ACTIVE' } });
        console.log(`✅ Eventos: ${totalEvents} total, ${activeEvents} activos`);

        const totalInvoices = await prisma.invoice.count();
        const pendingInvoices = await prisma.invoice.count({ where: { status: 'PENDING' } });
        console.log(`✅ Facturas: ${totalInvoices} total, ${pendingInvoices} pendientes`);

        // Test aggregations
        console.log('\n💰 Probando agregaciones de pagos...');
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const monthlyIncome = await prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
                status: 'COMPLETED',
                date: { gte: startOfMonth }
            }
        });
        console.log(`✅ Ingresos del mes: $${monthlyIncome._sum.amount || 0}`);

        // Test invoice types
        console.log('\n📄 Probando tipos de facturas...');
        const outgoingInvoices = await prisma.invoice.count({ where: { type: 'OUTGOING' } });
        const incomingInvoices = await prisma.invoice.count({ where: { type: 'INCOMING' } });
        console.log(`✅ Facturas emitidas: ${outgoingInvoices}`);
        console.log(`✅ Facturas recibidas: ${incomingInvoices}`);

        // Test payment-invoice relationships
        console.log('\n🔗 Probando relaciones pago-factura...');
        const paymentsWithInvoices = await prisma.payment.count({
            where: { invoiceId: { not: null } }
        });
        const paymentsWithoutInvoices = await prisma.payment.count({
            where: { invoiceId: null }
        });
        console.log(`✅ Pagos con factura: ${paymentsWithInvoices}`);
        console.log(`✅ Pagos sin factura: ${paymentsWithoutInvoices}`);

        console.log('\n✅ Todas las consultas básicas funcionan correctamente');

    } catch (error) {
        console.error('❌ Error en las consultas:', error);
        console.log('\n🔧 Posibles soluciones:');
        console.log('   1. Verificar que la base de datos esté conectada');
        console.log('   2. Ejecutar: npx prisma db push');
        console.log('   3. Verificar el esquema de Prisma');
        console.log('   4. Reiniciar el servidor');
    } finally {
        await prisma.$disconnect();
    }
}

async function generateSampleData() {
    console.log('\n🎲 ¿Generar datos de ejemplo para el dashboard? (y/n)');
    
    // For now, just show what would be created
    console.log('\n📋 Datos de ejemplo que se pueden crear:');
    console.log('   • 5 estudiantes de prueba');
    console.log('   • 3 eventos de ejemplo');
    console.log('   • 10 facturas de muestra');
    console.log('   • 8 pagos de ejemplo');
    console.log('\n💡 Para generar datos: node scripts/create-sample-data.js');
}

// Run diagnostics
testDashboardQueries().then(() => {
    generateSampleData();
});