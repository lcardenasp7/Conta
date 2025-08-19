/**
 * RECREAR DASHBOARD FINANCIERO COMPLETAMENTE
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 RECREANDO DASHBOARD FINANCIERO DESDE CERO...');

const newFinancialDashboard = `/**
 * RUTAS DEL DASHBOARD FINANCIERO - VERSIÓN CORREGIDA
 * Compatible con studentId opcional en pagos
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

console.log('📊 Cargando rutas del dashboard financiero...');

// Funciones auxiliares para cálculo de fechas
function calculatePeriodDates(period) {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
        case 'current-month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case 'last-month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
        case 'current-year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            break;
        case 'last-year':
            startDate = new Date(now.getFullYear() - 1, 0, 1);
            endDate = new Date(now.getFullYear() - 1, 11, 31);
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { startDate, endDate };
}

function getPeriodName(period) {
    const names = {
        'current-month': 'Mes Actual',
        'last-month': 'Mes Anterior',
        'current-year': 'Año Actual',
        'last-year': 'Año Anterior'
    };
    return names[period] || 'Mes Actual';
}

/**
 * Dashboard financiero principal
 * GET /api/financial-dashboard/overview
 */
router.get('/overview', authenticateToken, async (req, res) => {
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
                    invoiceId: true,
                    reference: true
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
                    status: true,
                    invoiceNumber: true
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
                    category: 'Ingresos',
                    reference: payment.reference
                }))
            },
            expenses: {
                total: totalExpenses,
                transactions: invoices.slice(0, 10).map(invoice => ({
                    id: invoice.id,
                    amount: invoice.total,
                    date: invoice.date,
                    description: invoice.concept || 'Gasto',
                    category: 'Gastos',
                    invoiceNumber: invoice.invoiceNumber
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
});

/**
 * Estadísticas rápidas del dashboard
 * GET /api/financial-dashboard/stats
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        console.log('📈 Generando estadísticas financieras...');

        const currentMonth = new Date();
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        // Obtener datos básicos
        const [totalPayments, totalInvoices, pendingInvoices] = await Promise.all([
            prisma.payment.aggregate({
                where: {
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    },
                    status: 'COMPLETED'
                },
                _sum: { amount: true },
                _count: true
            }),
            prisma.invoice.aggregate({
                where: {
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    },
                    type: 'OUTGOING'
                },
                _sum: { total: true },
                _count: true
            }),
            prisma.invoice.count({
                where: {
                    status: { in: ['PENDING', 'PARTIAL'] }
                }
            })
        ]);

        const stats = {
            totalIncome: totalPayments._sum.amount || 0,
            totalExpenses: totalInvoices._sum.total || 0,
            netCashFlow: (totalPayments._sum.amount || 0) - (totalInvoices._sum.total || 0),
            paymentsCount: totalPayments._count || 0,
            invoicesCount: totalInvoices._count || 0,
            pendingInvoicesCount: pendingInvoices || 0
        };

        console.log('✅ Estadísticas financieras generadas');
        res.json(stats);

    } catch (error) {
        console.error('❌ Error generando estadísticas:', error);
        res.status(500).json({ 
            error: 'Error al generar estadísticas financieras',
            details: error.message 
        });
    }
});

/**
 * Tendencias mensuales
 * GET /api/financial-dashboard/trends
 */
router.get('/trends', authenticateToken, async (req, res) => {
    try {
        console.log('📈 Generando tendencias mensuales...');

        const { months = 6 } = req.query;
        const trends = [];

        for (let i = parseInt(months) - 1; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const [income, expenses] = await Promise.all([
                prisma.payment.aggregate({
                    where: {
                        date: {
                            gte: startOfMonth,
                            lte: endOfMonth
                        },
                        status: 'COMPLETED'
                    },
                    _sum: { amount: true }
                }),
                prisma.invoice.aggregate({
                    where: {
                        date: {
                            gte: startOfMonth,
                            lte: endOfMonth
                        },
                        type: 'OUTGOING'
                    },
                    _sum: { total: true }
                })
            ]);

            trends.push({
                month: date.toISOString().substring(0, 7), // YYYY-MM
                monthName: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
                income: income._sum.amount || 0,
                expenses: expenses._sum.total || 0,
                netCashFlow: (income._sum.amount || 0) - (expenses._sum.total || 0)
            });
        }

        console.log('✅ Tendencias mensuales generadas');
        res.json(trends);

    } catch (error) {
        console.error('❌ Error generando tendencias:', error);
        res.status(500).json({ 
            error: 'Error al generar tendencias mensuales',
            details: error.message 
        });
    }
});

console.log('✅ Rutas del dashboard financiero cargadas correctamente');

module.exports = router;
`;

// Escribir el archivo completamente nuevo
const dashboardRoutesPath = path.join(__dirname, '../routes/financial-dashboard.routes.js');
fs.writeFileSync(dashboardRoutesPath, newFinancialDashboard);

console.log('✅ Dashboard financiero recreado completamente');

// Verificar sintaxis
try {
    const { spawn } = require('child_process');
    const checkSyntax = spawn('node', ['-c', 'routes/financial-dashboard.routes.js'], { 
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
    });

    checkSyntax.on('close', (code) => {
        if (code === 0) {
            console.log('✅ Sintaxis del archivo verificada - Sin errores');
        } else {
            console.log('❌ Aún hay errores de sintaxis');
        }
    });

    checkSyntax.stderr.on('data', (data) => {
        console.log('❌ Error de sintaxis:', data.toString());
    });

} catch (error) {
    console.log('⚠️ No se pudo verificar sintaxis automáticamente');
}

console.log('');
console.log('🎯 DASHBOARD FINANCIERO RECREADO');
console.log('');
console.log('📋 RUTAS DISPONIBLES:');
console.log('  ✅ GET /api/financial-dashboard/overview');
console.log('  ✅ GET /api/financial-dashboard/stats');
console.log('  ✅ GET /api/financial-dashboard/trends');
console.log('');
console.log('📋 CARACTERÍSTICAS:');
console.log('  ✅ Compatible con studentId opcional');
console.log('  ✅ Consultas simplificadas y seguras');
console.log('  ✅ Manejo de errores mejorado');
console.log('  ✅ Cálculos básicos funcionales');
console.log('');
console.log('🔄 REINICIA EL SERVIDOR:');
console.log('  node server.js');
console.log('');
console.log('🧪 DESPUÉS DEL REINICIO:');
console.log('  - Ve al Dashboard Financiero');
console.log('  - Cambia entre períodos');
console.log('  - No debería haber errores 500');
console.log('  - Datos básicos deberían cargar correctamente');