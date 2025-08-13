const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [
      // Estudiantes
      totalStudents,
      activeStudents,
      
      // Eventos
      totalEvents,
      activeEvents,
      
      // Facturas
      totalInvoices,
      pendingInvoices,
      overdueInvoices,
      
      // Pagos e ingresos
      monthlyIncome,
      yearlyIncome,
      todayIncome,
      
      // Ingresos por categoría (mes actual)
      monthlyIncomeByCategory,
      
      // Egresos (facturas recibidas)
      monthlyExpenses,
      yearlyExpenses,
      monthlyExpensesByCategory,
      
      // Deudas
      totalDebtAmount,
      totalDebtors,
      
      // Grados y grupos
      totalGrades,
      totalGroups
    ] = await Promise.all([
      // Estudiantes
      prisma.student.count(),
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      
      // Eventos
      prisma.event.count(),
      prisma.event.count({ where: { status: 'ACTIVE' } }),
      
      // Facturas
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'PENDING' } }),
      prisma.invoice.count({ 
        where: { 
          status: 'PENDING',
          dueDate: { lt: today }
        } 
      }),
      
      // Ingresos
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          date: { gte: startOfMonth }
        }
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          date: { gte: startOfYear }
        }
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          date: { 
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
          }
        }
      }),
      
      // Ingresos por categoría (mes actual) - Placeholder for now
      Promise.resolve([]),
      
      // Egresos (facturas recibidas - INCOMING)
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: {
          type: 'INCOMING',
          status: 'PAID',
          date: { gte: startOfMonth }
        }
      }),
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: {
          type: 'INCOMING',
          status: 'PAID',
          date: { gte: startOfYear }
        }
      }),
      
      // Egresos por categoría (mes actual)
      prisma.invoice.groupBy({
        by: ['concept'],
        _sum: { total: true },
        where: {
          type: 'INCOMING',
          status: 'PAID',
          date: { gte: startOfMonth }
        }
      }),
      
      // Deudas
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { status: { in: ['PENDING', 'PARTIAL'] } }
      }),
      prisma.invoice.findMany({
        where: { status: { in: ['PENDING', 'PARTIAL'] } },
        select: { studentId: true },
        distinct: ['studentId']
      }),
      
      // Estructura académica
      prisma.grade.count(),
      prisma.group.count()
    ]);

    // Calcular porcentajes y tendencias
    const studentActivePercentage = totalStudents > 0 ? (activeStudents / totalStudents * 100) : 0;
    const invoicePaidPercentage = totalInvoices > 0 ? ((totalInvoices - pendingInvoices) / totalInvoices * 100) : 0;

    // Procesar ingresos por categoría
    const incomeCategories = await processIncomeByCategory();
    
    // Procesar egresos por categoría
    const expenseCategories = processExpensesByCategory(monthlyExpensesByCategory);

    res.json({
      // Resumen principal
      summary: {
        totalStudents,
        activeStudents,
        totalEvents,
        activeEvents,
        totalInvoices,
        pendingInvoices,
        overdueInvoices,
        totalGrades,
        totalGroups
      },
      
      // Ingresos
      income: {
        today: todayIncome._sum.amount || 0,
        thisMonth: monthlyIncome._sum.amount || 0,
        thisYear: yearlyIncome._sum.amount || 0,
        categories: incomeCategories
      },
      
      // Egresos
      expenses: {
        thisMonth: monthlyExpenses._sum.total || 0,
        thisYear: yearlyExpenses._sum.total || 0,
        categories: expenseCategories
      },
      
      // Balance
      balance: {
        thisMonth: (monthlyIncome._sum.amount || 0) - (monthlyExpenses._sum.total || 0),
        thisYear: (yearlyIncome._sum.amount || 0) - (yearlyExpenses._sum.total || 0)
      },
      
      // Deudas
      debts: {
        totalAmount: totalDebtAmount._sum.total || 0,
        totalDebtors: totalDebtors.length,
        overdueInvoices
      },
      
      // Porcentajes y métricas
      metrics: {
        studentActivePercentage: Math.round(studentActivePercentage),
        invoicePaidPercentage: Math.round(invoicePaidPercentage),
        averageDebtPerStudent: totalDebtors.length > 0 
          ? Math.round((totalDebtAmount._sum.total || 0) / totalDebtors.length)
          : 0
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Helper function to process income by category
async function processIncomeByCategory(incomeData) {
  const categories = {
    'TUITION': { name: 'Matrículas', amount: 0, color: '#3498db' },
    'MONTHLY': { name: 'Mensualidades', amount: 0, color: '#2ecc71' },
    'EVENT': { name: 'Eventos', amount: 0, color: '#9b59b6' },
    'UNIFORM': { name: 'Uniformes', amount: 0, color: '#f39c12' },
    'BOOKS': { name: 'Libros', amount: 0, color: '#e74c3c' },
    'TRANSPORT': { name: 'Transporte', amount: 0, color: '#1abc9c' },
    'CAFETERIA': { name: 'Cafetería', amount: 0, color: '#34495e' },
    'OTHER': { name: 'Otros', amount: 0, color: '#95a5a6' }
  };

  try {
    // Get invoice concepts for payments
    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        date: { 
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
        },
        invoiceId: { not: null }
      },
      include: {
        invoice: {
          select: { concept: true }
        }
      }
    });

    payments.forEach(payment => {
      const concept = payment.invoice?.concept || 'OTHER';
      if (categories[concept]) {
        categories[concept].amount += payment.amount;
      }
    });

    return Object.values(categories).filter(cat => cat.amount > 0);
  } catch (error) {
    console.error('Error processing income by category:', error);
    return Object.values(categories).slice(0, 3); // Return sample data
  }
}

// Helper function to process expenses by category
function processExpensesByCategory(expenseData) {
  const categories = {
    'OFFICE_SUPPLIES': { name: 'Útiles de Oficina', amount: 0, color: '#3498db' },
    'MAINTENANCE': { name: 'Mantenimiento', amount: 0, color: '#e74c3c' },
    'UTILITIES': { name: 'Servicios Públicos', amount: 0, color: '#f39c12' },
    'PROFESSIONAL_SERVICES': { name: 'Servicios Profesionales', amount: 0, color: '#9b59b6' },
    'EQUIPMENT': { name: 'Equipos', amount: 0, color: '#2ecc71' },
    'CLEANING_SUPPLIES': { name: 'Insumos de Aseo', amount: 0, color: '#1abc9c' },
    'FOOD_SUPPLIES': { name: 'Insumos de Cafetería', amount: 0, color: '#e67e22' },
    'EDUCATIONAL_MATERIALS': { name: 'Material Educativo', amount: 0, color: '#8e44ad' },
    'TECHNOLOGY': { name: 'Tecnología', amount: 0, color: '#34495e' },
    'INSURANCE': { name: 'Seguros', amount: 0, color: '#16a085' },
    'RENT': { name: 'Arrendamiento', amount: 0, color: '#c0392b' },
    'OTHER': { name: 'Otros', amount: 0, color: '#95a5a6' }
  };

  expenseData.forEach(expense => {
    const concept = expense.concept;
    if (categories[concept]) {
      categories[concept].amount += expense._sum.total || 0;
    }
  });

  return Object.values(categories).filter(cat => cat.amount > 0);
}

// Get recent activities for dashboard
router.get('/recent-activities', authenticateToken, async (req, res) => {
  try {
    // Get recent payments (with null safety)
    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        student: {
          select: { firstName: true, lastName: true }
        },
        invoice: {
          select: { invoiceNumber: true, concept: true }
        },
        event: {
          select: { name: true, type: true }
        }
      }
    }).catch(() => []);
    
    // Get recent invoices (with null safety)
    const recentInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        student: {
          select: { firstName: true, lastName: true }
        }
      }
    }).catch(() => []);
    
    // Get upcoming events (with null safety)
    const upcomingEvents = await prisma.event.findMany({
      take: 3,
      where: {
        eventDate: { gte: new Date() },
        status: { in: ['PLANNING', 'ACTIVE'] }
      },
      orderBy: { eventDate: 'asc' }
    }).catch(() => []);

    // Format response with safe data
    const response = {
      recentPayments: recentPayments.map(payment => ({
        id: payment.id,
        paymentNumber: payment.paymentNumber,
        date: payment.date,
        amount: payment.amount,
        method: payment.method,
        studentName: payment.student ? `${payment.student.firstName} ${payment.student.lastName}` : 'N/A',
        concept: payment.invoice?.concept || payment.event?.type || 'N/A'
      })),
      recentInvoices: recentInvoices.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        total: invoice.total,
        status: invoice.status,
        concept: invoice.concept,
        studentName: invoice.student ? `${invoice.student.firstName} ${invoice.student.lastName}` : 'Cliente Externo'
      })),
      upcomingEvents: upcomingEvents.map(event => ({
        id: event.id,
        name: event.name,
        type: event.type,
        eventDate: event.eventDate,
        status: event.status,
        ticketPrice: event.ticketPrice,
        fundraisingGoal: event.fundraisingGoal
      }))
    };

    res.json(response);

  } catch (error) {
    console.error('Recent activities error:', error);
    // Return empty data instead of error to prevent dashboard crash
    res.json({
      recentPayments: [],
      recentInvoices: [],
      upcomingEvents: []
    });
  }
});

// Get monthly income chart data
router.get('/charts/monthly-income', authenticateToken, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    const monthlyData = await prisma.payment.groupBy({
      by: ['date'],
      _sum: { amount: true },
      where: {
        status: 'COMPLETED',
        date: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1)
        }
      }
    });

    // Organizar datos por mes
    const monthlyIncome = Array(12).fill(0);
    
    monthlyData.forEach(item => {
      const month = new Date(item.date).getMonth();
      monthlyIncome[month] += item._sum.amount || 0;
    });

    res.json({
      labels: [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ],
      data: monthlyIncome
    });

  } catch (error) {
    console.error('Monthly income chart error:', error);
    res.status(500).json({ error: 'Error al obtener datos del gráfico' });
  }
});

// Get students by grade chart data
router.get('/charts/students-by-grade', authenticateToken, async (req, res) => {
  try {
    const studentsData = await prisma.student.groupBy({
      by: ['gradeId'],
      _count: { id: true },
      where: { status: 'ACTIVE' }
    });

    // Obtener nombres de los grados
    const grades = await prisma.grade.findMany({
      select: { id: true, name: true }
    });

    const gradeMap = grades.reduce((acc, grade) => {
      acc[grade.id] = grade.name;
      return acc;
    }, {});

    const chartData = studentsData.map(item => ({
      label: gradeMap[item.gradeId] || 'Sin grado',
      value: item._count.id
    }));

    res.json(chartData);

  } catch (error) {
    console.error('Students by grade chart error:', error);
    res.status(500).json({ error: 'Error al obtener datos del gráfico' });
  }
});

// Get monthly income vs expense chart data
router.get('/charts/monthly-income-expense', authenticateToken, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    // Get monthly income data
    const monthlyIncome = await prisma.payment.groupBy({
      by: ['date'],
      _sum: { amount: true },
      where: {
        status: 'COMPLETED',
        date: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1)
        }
      }
    });

    // Get monthly expense data (incoming invoices that are paid)
    const monthlyExpenses = await prisma.invoice.groupBy({
      by: ['date'],
      _sum: { total: true },
      where: {
        type: 'INCOMING',
        status: 'PAID',
        date: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1)
        }
      }
    });

    // Organize data by month
    const incomeByMonth = Array(12).fill(0);
    const expensesByMonth = Array(12).fill(0);
    
    monthlyIncome.forEach(item => {
      const month = new Date(item.date).getMonth();
      incomeByMonth[month] += item._sum.amount || 0;
    });

    monthlyExpenses.forEach(item => {
      const month = new Date(item.date).getMonth();
      expensesByMonth[month] += item._sum.total || 0;
    });

    res.json({
      labels: [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ],
      income: incomeByMonth,
      expenses: expensesByMonth
    });

  } catch (error) {
    console.error('Monthly income/expense chart error:', error);
    res.status(500).json({ error: 'Error al obtener datos del gráfico' });
  }
});

module.exports = router;