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
        thisYear: yearlyIncome._sum.amount || 0
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

// Get recent activities for dashboard
router.get('/recent-activities', authenticateToken, async (req, res) => {
  try {
    const [
      recentPayments,
      recentInvoices,
      recentEvents
    ] = await Promise.all([
      // Últimos 5 pagos
      prisma.payment.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          student: {
            select: { firstName: true, lastName: true }
          }
        }
      }),
      
      // Últimas 5 facturas
      prisma.invoice.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          student: {
            select: { firstName: true, lastName: true }
          }
        }
      }),
      
      // Próximos eventos
      prisma.event.findMany({
        take: 3,
        where: {
          eventDate: { gte: new Date() },
          status: { in: ['PLANNING', 'ACTIVE'] }
        },
        orderBy: { eventDate: 'asc' }
      })
    ]);

    res.json({
      recentPayments,
      recentInvoices,
      upcomingEvents: recentEvents
    });

  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({ error: 'Error al obtener actividades recientes' });
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

module.exports = router;