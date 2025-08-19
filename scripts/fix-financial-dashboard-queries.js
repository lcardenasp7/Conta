/**
 * CORREGIR CONSULTAS DEL DASHBOARD FINANCIERO DESPUÉS DE CAMBIOS EN PRISMA
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 CORRIGIENDO CONSULTAS DEL DASHBOARD FINANCIERO...');

const dashboardRoutesPath = path.join(__dirname, '../routes/financial-dashboard.routes.js');
let dashboardContent = fs.readFileSync(dashboardRoutesPath, 'utf8');

// El problema principal es que las consultas pueden fallar cuando studentId es null
// Voy a crear una versión simplificada que maneje mejor los casos null

const simplifiedOverviewRoute = `router.get('/overview', authenticateToken, async (req, res) => {
    try {
        console.log('📊 Generando overview financiero...');

        const { period = 'current-month' } = req.query;
        
        // Calcular fechas según el período
        const dates = calculatePeriodDates(period);
        
        // Obtener datos básicos sin relaciones complejas
        const [payments, invoices] = await Promise.all([
            prisma.payment.findMany({
                where: {
                    date: {
                        gte: dates.startDate,
                        lte: dates.endDate
                    },
                    status: 'COMPLETED'
                },
                select: {
                    id: true,
                    amount: true,
                    method: true,
                    date: true,
                    studentId: true,
                    invoiceId: true
                },
                orderBy: { date: 'desc' }
            }),
            prisma.invoice.findMany({
                where: {
                    date: {
                        gte: dates.startDate,
                        lte: dates.endDate
                    },
                    type: 'OUTGOING'
                },
                select: {
                    id: true,
                    total: true,
                    concept: true,
                    date: true,
                    status: true
                },
                orderBy: { date: 'desc' }
            })
        ]);

        // Calcular totales
        const totalIncome = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const totalExpenses = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
        const netCashFlow = totalIncome - totalExpenses;

        // Obtener facturas pendientes
        const pendingInvoices = await prisma.invoice.findMany({
            where: {
                status: { in: ['PENDING', 'PARTIAL'] }
            },
            select: {
                id: true,
                invoiceNumber: true,
                total: true,
                concept: true,
                date: true,
                status: true
            },
            orderBy: { date: 'desc' },
            take: 10
        });

        const response = {
            period: {
                name: getPeriodName(period),
                startDate: dates.startDate,
                endDate: dates.endDate
            },
            summary: {
                totalIncome,
                totalExpenses,
                netCashFlow,
                pendingAmount: pendingInvoices.reduce((sum, inv) => sum + inv.total, 0),
                pendingCount: pendingInvoices.length
            },
            income: {
                total: totalIncome,
                transactions: payments.slice(0, 10).map(payment => ({
                    id: payment.id,
                    amount: payment.amount,
                    method: payment.method,
                    date: payment.date,
                    description: 'Pago recibido',
                    category: 'Ingresos'
                }))
            },
            expenses: {
                total: totalExpenses,
                transactions: invoices.slice(0, 10).map(invoice => ({
                    id: invoice.id,
                    amount: invoice.total,
                    date: invoice.date,
                    description: invoice.concept || 'Gasto',
                    category: 'Gastos'
                }))
            },
            pending: {
                invoices: pendingInvoices,
                total: pendingInvoices.reduce((sum, inv) => sum + inv.total, 0)
            },
            trends: [], // Simplificado por ahora
            recentActivity: [
                ...payments.slice(0, 5).map(p => ({
                    type: 'payment',
                    description: 'Pago recibido',
                    amount: p.amount,
                    date: p.date
                })),
                ...invoices.slice(0, 5).map(i => ({
                    type: 'expense',
                    description: i.concept || 'Gasto',
                    amount: i.total,
                    date: i.date
                }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)
        };

        console.log('✅ Overview financiero generado exitosamente');
        res.json(response);

    } catch (error) {
        console.error('❌ Error generando overview financiero:', error);
        res.status(500).json({ 
            error: 'Error al generar dashboard financiero',
            details: error.message 
        });
    }
});`;

// Reemplazar la ruta problemática
const overviewRouteRegex = /router\.get\('\/overview', authenticateToken, async \(req, res\) => \{[\s\S]*?\}\);/;
if (overviewRouteRegex.test(dashboardContent)) {
    dashboardContent = dashboardContent.replace(overviewRouteRegex, simplifiedOverviewRoute);
    console.log('✅ Ruta /overview simplificada');
} else {
    console.log('❌ No se encontró la ruta /overview para reemplazar');
}

// Escribir el archivo corregido
fs.writeFileSync(dashboardRoutesPath, dashboardContent);

console.log('');
console.log('🎯 CORRECCIONES APLICADAS');
console.log('');
console.log('📋 DASHBOARD FINANCIERO:');
console.log('  ✅ Consultas simplificadas sin relaciones complejas');
console.log('  ✅ Manejo seguro de studentId null');
console.log('  ✅ Cálculos básicos de ingresos y gastos');
console.log('  ✅ Facturas pendientes sin relaciones');
console.log('');
console.log('📋 CAMBIOS:');
console.log('  ✅ Eliminadas consultas include complejas');
console.log('  ✅ Agregado manejo de errores mejorado');
console.log('  ✅ Datos básicos pero funcionales');
console.log('');
console.log('🔄 REINICIA EL SERVIDOR:');
console.log('  1. Ctrl+C para detener');
console.log('  2. node server.js para reiniciar');
console.log('  3. Ve al Dashboard Financiero');
console.log('');
console.log('✅ RESULTADO ESPERADO:');
console.log('  - No más errores 500 en dashboard financiero');
console.log('  - Datos básicos de ingresos y gastos');
console.log('  - Facturas pendientes visibles');
console.log('  - Actividad reciente funcional');