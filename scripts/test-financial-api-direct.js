/**
 * Script para probar la API del dashboard financiero directamente
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Importar las funciones de las rutas directamente
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

function groupByCategory(transactions) {
    const grouped = {};
    
    transactions.forEach(transaction => {
        const category = transaction.category || transaction.invoice?.concept || 'OTHER';
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

async function testFinancialDashboardAPI() {
    try {
        console.log('🧪 PROBANDO API DEL DASHBOARD FINANCIERO DIRECTAMENTE');
        console.log('====================================================');

        const period = 'current-month';
        const dates = calculatePeriodDates(period);
        
        console.log(`📅 Período: ${period}`);
        console.log(`📅 Desde: ${dates.startDate.toISOString()}`);
        console.log(`📅 Hasta: ${dates.endDate.toISOString()}`);

        // Obtener datos de ingresos
        console.log('\n💰 Obteniendo datos de ingresos...');
        const incomeData = await getIncomeData(dates);
        console.log(`✅ Ingresos encontrados: ${incomeData.length}`);

        // Obtener datos de gastos
        console.log('\n💸 Obteniendo datos de gastos...');
        const expenseData = await getExpenseData(dates);
        console.log(`✅ Gastos encontrados: ${expenseData.length}`);

        // Calcular totales
        const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = expenseData.reduce((sum, item) => sum + item.amount, 0);
        const netCashFlow = totalIncome - totalExpenses;

        console.log('\n📊 RESUMEN CALCULADO:');
        console.log(`💚 Total ingresos: $${totalIncome.toLocaleString()}`);
        console.log(`💸 Total gastos: $${totalExpenses.toLocaleString()}`);
        console.log(`📈 Flujo neto: $${netCashFlow.toLocaleString()}`);

        // Agrupar por categorías
        console.log('\n🏷️ Agrupando por categorías...');
        const incomeByCategory = groupByCategory(incomeData);
        const expensesByCategory = groupByCategory(expenseData);

        console.log('💰 Categorías de ingresos:');
        Object.keys(incomeByCategory).forEach(category => {
            console.log(`  - ${category}: $${incomeByCategory[category].total.toLocaleString()} (${incomeByCategory[category].count} transacciones)`);
        });

        console.log('💸 Categorías de gastos:');
        Object.keys(expensesByCategory).forEach(category => {
            console.log(`  - ${category}: $${expensesByCategory[category].total.toLocaleString()} (${expensesByCategory[category].count} transacciones)`);
        });

        // Simular respuesta de la API
        const mockResponse = {
            period: {
                name: 'Mes Actual',
                startDate: dates.startDate,
                endDate: dates.endDate
            },
            summary: {
                totalIncome,
                totalExpenses,
                netCashFlow,
                pendingAmount: 0,
                pendingCount: 0
            },
            income: {
                total: totalIncome,
                byCategory: incomeByCategory
            },
            expenses: {
                total: totalExpenses,
                byCategory: expensesByCategory
            },
            trends: [
                { monthName: 'Mes Actual', income: totalIncome, expenses: totalExpenses, net: netCashFlow }
            ],
            recentActivity: incomeData.slice(0, 5).map(payment => ({
                type: 'income',
                date: payment.date,
                amount: payment.amount,
                description: `Pago de ${payment.student?.firstName || 'Cliente'} ${payment.student?.lastName || ''}`,
                category: payment.invoice?.concept || 'OTHER'
            })),
            pending: {
                invoices: []
            }
        };

        console.log('\n✅ RESPUESTA SIMULADA GENERADA EXITOSAMENTE');
        console.log('Esta es la estructura que debería devolver la API:');
        console.log(JSON.stringify(mockResponse, null, 2));

        return mockResponse;

    } catch (error) {
        console.error('❌ Error probando API:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testFinancialDashboardAPI();