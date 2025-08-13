/**
 * Financial Dashboard Routes
 * Sistema completo de dashboard financiero con entradas y salidas de dinero
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

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
        
        // Obtener datos financieros en paralelo
        const [
            incomeData,
            expenseData,
            pendingInvoices,
            recentTransactions,
            categoryBreakdown,
            monthlyTrends
        ] = await Promise.all([
            getIncomeData(dates),
            getExpenseData(dates),
            getPendingInvoices(),
            getRecentTransactions(10),
            getCategoryBreakdown(dates),
            getMonthlyTrends(6) // Últimos 6 meses
        ]);

        const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = expenseData.reduce((sum, item) => sum + item.amount, 0);
        const netCashFlow = totalIncome - totalExpenses;

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
                byCategory: groupByCategory(incomeData),
                transactions: incomeData.slice(0, 10) // Últimas 10
            },
            expenses: {
                total: totalExpenses,
                byCategory: groupByCategory(expenseData),
                transactions: expenseData.slice(0, 10) // Últimas 10
            },
            pending: {
                invoices: pendingInvoices.slice(0, 10),
                total: pendingInvoices.reduce((sum, inv) => sum + inv.total, 0)
            },
            trends: monthlyTrends,
            recentActivity: recentTransactions
        };

        console.log('✅ Overview financiero generado exitosamente');
        res.json(response);

    } catch (error) {
        console.error('❌ Error generando overview financiero:', error);
        res.status(500).json({ error: 'Error al generar dashboard financiero' });
    }
});

/**
 * Detalle de ingresos por categoría
 * GET /api/financial-dashboard/income/:category
 */
router.get('/income/:category', authenticateToken, async (req, res) => {
    try {
        const { category } = req.params;
        const { period = 'current-month', page = 1, limit = 20 } = req.query;
        
        const dates = calculatePeriodDates(period);
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Obtener ingresos por categoría
        const incomeTransactions = await prisma.payment.findMany({
            where: {
                date: {
                    gte: dates.startDate,
                    lte: dates.endDate
                },
                ...(category !== 'all' && {
                    OR: [
                        { invoice: { concept: category } },
                        { event: { type: category } }
                    ]
                })
            },
            include: {
                student: {
                    select: {
                        firstName: true,
                        lastName: true,
                        document: true
                    }
                },
                invoice: {
                    select: {
                        invoiceNumber: true,
                        concept: true
                    }
                },
                event: {
                    select: {
                        name: true,
                        type: true
                    }
                },
                user: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: { date: 'desc' },
            skip: offset,
            take: parseInt(limit)
        });

        const total = await prisma.payment.count({
            where: {
                date: {
                    gte: dates.startDate,
                    lte: dates.endDate
                },
                ...(category !== 'all' && {
                    OR: [
                        { invoice: { concept: category } },
                        { event: { type: category } }
                    ]
                })
            }
        });

        const totalAmount = incomeTransactions.reduce((sum, payment) => sum + payment.amount, 0);

        res.json({
            category,
            period: getPeriodName(period),
            transactions: incomeTransactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            summary: {
                totalAmount,
                transactionCount: incomeTransactions.length
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo detalle de ingresos:', error);
        res.status(500).json({ error: 'Error al obtener detalle de ingresos' });
    }
});

/**
 * Detalle de gastos por categoría
 * GET /api/financial-dashboard/expenses/:category
 */
router.get('/expenses/:category', authenticateToken, async (req, res) => {
    try {
        const { category } = req.params;
        const { period = 'current-month', page = 1, limit = 20 } = req.query;
        
        const dates = calculatePeriodDates(period);
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Obtener gastos por categoría
        const expenseInvoices = await prisma.invoice.findMany({
            where: {
                type: 'INCOMING', // Facturas que recibimos (gastos)
                date: {
                    gte: dates.startDate,
                    lte: dates.endDate
                },
                ...(category !== 'all' && { concept: category })
            },
            include: {
                items: true,
                user: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: { date: 'desc' },
            skip: offset,
            take: parseInt(limit)
        });

        const total = await prisma.invoice.count({
            where: {
                type: 'INCOMING',
                date: {
                    gte: dates.startDate,
                    lte: dates.endDate
                },
                ...(category !== 'all' && { concept: category })
            }
        });

        const totalAmount = expenseInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

        res.json({
            category,
            period: getPeriodName(period),
            invoices: expenseInvoices,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            summary: {
                totalAmount,
                invoiceCount: expenseInvoices.length
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo detalle de gastos:', error);
        res.status(500).json({ error: 'Error al obtener detalle de gastos' });
    }
});

/**
 * Balance por período
 * GET /api/financial-dashboard/balance
 */
router.get('/balance', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
        }

        const dates = {
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        };

        // Obtener todos los movimientos del período
        const [payments, expenses] = await Promise.all([
            getIncomeData(dates),
            getExpenseData(dates)
        ]);

        // Agrupar por día para mostrar flujo diario
        const dailyFlow = {};
        
        // Procesar ingresos
        payments.forEach(payment => {
            const day = payment.date.toISOString().split('T')[0];
            if (!dailyFlow[day]) {
                dailyFlow[day] = { date: day, income: 0, expenses: 0, net: 0 };
            }
            dailyFlow[day].income += payment.amount;
        });

        // Procesar gastos
        expenses.forEach(expense => {
            const day = expense.date.toISOString().split('T')[0];
            if (!dailyFlow[day]) {
                dailyFlow[day] = { date: day, income: 0, expenses: 0, net: 0 };
            }
            dailyFlow[day].expenses += expense.amount;
        });

        // Calcular neto diario
        Object.values(dailyFlow).forEach(day => {
            day.net = day.income - day.expenses;
        });

        const sortedDays = Object.values(dailyFlow).sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({
            period: {
                startDate: dates.startDate,
                endDate: dates.endDate
            },
            summary: {
                totalIncome: payments.reduce((sum, p) => sum + p.amount, 0),
                totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
                netBalance: payments.reduce((sum, p) => sum + p.amount, 0) - expenses.reduce((sum, e) => sum + e.amount, 0)
            },
            dailyFlow: sortedDays,
            incomeByCategory: groupByCategory(payments),
            expensesByCategory: groupByCategory(expenses)
        });

    } catch (error) {
        console.error('❌ Error generando balance:', error);
        res.status(500).json({ error: 'Error al generar balance' });
    }
});

// ===== FUNCIONES AUXILIARES =====

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
        case 'last-30-days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = now;
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
        'last-30-days': 'Últimos 30 Días'
    };
    return names[period] || 'Período Personalizado';
}

async function getIncomeData(dates) {
    return await prisma.payment.findMany({
        where: {
            date: {
                gte: dates.startDate,
                lte: dates.endDate
            },
            status: 'COMPLETED'
        },
        include: {
            student: {
                select: {
                    firstName: true,
                    lastName: true
                }
            },
            invoice: {
                select: {
                    concept: true,
                    invoiceNumber: true
                }
            },
            event: {
                select: {
                    name: true,
                    type: true
                }
            }
        },
        orderBy: { date: 'desc' }
    });
}

async function getExpenseData(dates) {
    const invoices = await prisma.invoice.findMany({
        where: {
            type: 'INCOMING',
            date: {
                gte: dates.startDate,
                lte: dates.endDate
            }
        },
        include: {
            items: true
        },
        orderBy: { date: 'desc' }
    });

    return invoices.map(invoice => ({
        id: invoice.id,
        date: invoice.date,
        amount: invoice.total,
        category: invoice.concept,
        description: invoice.supplierName || 'Proveedor',
        reference: invoice.invoiceNumber,
        items: invoice.items
    }));
}

async function getPendingInvoices() {
    return await prisma.invoice.findMany({
        where: {
            type: 'OUTGOING',
            status: {
                in: ['PENDING', 'OVERDUE']
            }
        },
        include: {
            student: {
                select: {
                    firstName: true,
                    lastName: true
                }
            }
        },
        orderBy: { dueDate: 'asc' },
        take: 20
    });
}

async function getRecentTransactions(limit = 10) {
    const [recentPayments, recentInvoices] = await Promise.all([
        prisma.payment.findMany({
            take: limit / 2,
            orderBy: { date: 'desc' },
            include: {
                student: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                invoice: {
                    select: {
                        concept: true
                    }
                }
            }
        }),
        prisma.invoice.findMany({
            where: { type: 'INCOMING' },
            take: limit / 2,
            orderBy: { date: 'desc' },
            select: {
                id: true,
                date: true,
                total: true,
                concept: true,
                supplierName: true,
                invoiceNumber: true
            }
        })
    ]);

    // Combinar y ordenar por fecha
    const combined = [
        ...recentPayments.map(p => ({
            type: 'income',
            date: p.date,
            amount: p.amount,
            description: `Pago de ${p.student.firstName} ${p.student.lastName}`,
            category: p.invoice?.concept || 'OTHER'
        })),
        ...recentInvoices.map(i => ({
            type: 'expense',
            date: i.date,
            amount: i.total,
            description: `Gasto: ${i.supplierName || 'Proveedor'}`,
            category: i.concept
        }))
    ];

    return combined.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
}

async function getCategoryBreakdown(dates) {
    // Implementar lógica para breakdown por categorías
    return {
        income: {},
        expenses: {}
    };
}

async function getMonthlyTrends(months) {
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const [income, expenses] = await Promise.all([
            getIncomeData({ startDate: monthStart, endDate: monthEnd }),
            getExpenseData({ startDate: monthStart, endDate: monthEnd })
        ]);

        trends.push({
            month: monthStart.toISOString().slice(0, 7), // YYYY-MM
            monthName: monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
            income: income.reduce((sum, item) => sum + item.amount, 0),
            expenses: expenses.reduce((sum, item) => sum + item.amount, 0),
            net: income.reduce((sum, item) => sum + item.amount, 0) - expenses.reduce((sum, item) => sum + item.amount, 0)
        });
    }

    return trends;
}

function groupByCategory(transactions) {
    const grouped = {};
    
    transactions.forEach(transaction => {
        const category = transaction.category || transaction.invoice?.concept || transaction.event?.type || 'OTHER';
        if (!grouped[category]) {
            grouped[category] = {
                total: 0,
                count: 0,
                transactions: []
            };
        }
        grouped[category].total += transaction.amount;
        grouped[category].count += 1;
        grouped[category].transactions.push(transaction);
    });

    return grouped;
}

module.exports = router;