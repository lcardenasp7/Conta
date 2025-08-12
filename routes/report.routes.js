const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

// Get student account statement
router.get('/student-account/:studentId', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { startDate, endDate } = req.query;

        // Get student info
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                grade: true,
                group: true
            }
        });

        if (!student) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }

        // Build date filter
        const dateFilter = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);

        // Get invoices
        const invoices = await prisma.invoice.findMany({
            where: {
                studentId: studentId,
                ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
            },
            include: {
                items: true,
                payments: true
            },
            orderBy: { date: 'desc' }
        });

        // Get payments
        const payments = await prisma.payment.findMany({
            where: {
                studentId: studentId,
                ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
            },
            include: {
                invoice: true,
                event: true
            },
            orderBy: { date: 'desc' }
        });

        // Get event assignments
        const eventAssignments = await prisma.eventAssignment.findMany({
            where: {
                studentId: studentId,
                event: {
                    ...(Object.keys(dateFilter).length > 0 && { eventDate: dateFilter })
                }
            },
            include: {
                event: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate totals
        const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const totalPending = totalInvoiced - totalPaid;

        // Calculate event totals
        const totalEventAssignments = eventAssignments.reduce((sum, assignment) => 
            sum + (assignment.ticketsAssigned * assignment.event.ticketPrice), 0);
        const totalEventRaised = eventAssignments.reduce((sum, assignment) => 
            sum + assignment.amountRaised, 0);
        const totalEventPending = totalEventAssignments - totalEventRaised;

        res.json({
            student: {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                document: student.document,
                grade: student.grade.name,
                group: student.group.name,
                email: student.email,
                phone: student.phone
            },
            summary: {
                totalInvoiced,
                totalPaid,
                totalPending,
                totalEventAssignments,
                totalEventRaised,
                totalEventPending,
                grandTotalPending: totalPending + totalEventPending
            },
            invoices: invoices.map(invoice => ({
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                date: invoice.date,
                dueDate: invoice.dueDate,
                concept: invoice.concept,
                total: invoice.total,
                status: invoice.status,
                items: invoice.items,
                paidAmount: invoice.payments.reduce((sum, p) => sum + p.amount, 0)
            })),
            payments: payments.map(payment => ({
                id: payment.id,
                paymentNumber: payment.paymentNumber,
                date: payment.date,
                amount: payment.amount,
                method: payment.method,
                reference: payment.reference,
                invoiceNumber: payment.invoice?.invoiceNumber,
                eventName: payment.event?.name
            })),
            eventAssignments: eventAssignments.map(assignment => ({
                id: assignment.id,
                eventName: assignment.event.name,
                eventDate: assignment.event.eventDate,
                ticketsAssigned: assignment.ticketsAssigned,
                ticketPrice: assignment.event.ticketPrice,
                totalAssigned: assignment.ticketsAssigned * assignment.event.ticketPrice,
                amountRaised: assignment.amountRaised,
                pending: (assignment.ticketsAssigned * assignment.event.ticketPrice) - assignment.amountRaised,
                status: assignment.status
            }))
        });

    } catch (error) {
        console.error('Error getting student account:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get overdue payments report
router.get('/overdue-payments', authenticateToken, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                status: {
                    in: ['PENDING', 'PARTIAL']
                },
                dueDate: {
                    lt: new Date()
                }
            },
            include: {
                student: {
                    include: {
                        grade: true,
                        group: true
                    }
                },
                payments: true
            },
            orderBy: { dueDate: 'asc' }
        });

        const overdueData = overdueInvoices.map(invoice => {
            const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
            const pendingAmount = invoice.total - paidAmount;
            const daysOverdue = Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));

            return {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                studentName: `${invoice.student.firstName} ${invoice.student.lastName}`,
                studentDocument: invoice.student.document,
                grade: invoice.student.grade.name,
                group: invoice.student.group.name,
                concept: invoice.concept,
                dueDate: invoice.dueDate,
                totalAmount: invoice.total,
                paidAmount,
                pendingAmount,
                daysOverdue,
                status: invoice.status
            };
        });

        const summary = {
            totalOverdueInvoices: overdueData.length,
            totalOverdueAmount: overdueData.reduce((sum, item) => sum + item.pendingAmount, 0),
            averageDaysOverdue: overdueData.length > 0 
                ? Math.round(overdueData.reduce((sum, item) => sum + item.daysOverdue, 0) / overdueData.length)
                : 0
        };

        res.json({
            summary,
            overdueInvoices: overdueData
        });

    } catch (error) {
        console.error('Error getting overdue payments:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get cash flow report
router.get('/cash-flow/:year/:month', authenticateToken, async (req, res) => {
    try {
        const { year, month } = req.params;
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0);

        // Get income (payments received)
        const payments = await prisma.payment.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                invoice: true,
                event: true
            }
        });

        // Get expenses (supplier invoices)
        const expenses = await prisma.invoice.findMany({
            where: {
                type: 'INCOMING',
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                items: true
            }
        });

        // Group income by concept
        const incomeByType = {};
        payments.forEach(payment => {
            const concept = payment.invoice?.concept || payment.event?.type || 'OTHER';
            if (!incomeByType[concept]) incomeByType[concept] = 0;
            incomeByType[concept] += payment.amount;
        });

        // Group expenses by concept
        const expensesByType = {};
        expenses.forEach(expense => {
            const concept = expense.concept;
            if (!expensesByType[concept]) expensesByType[concept] = 0;
            expensesByType[concept] += expense.total;
        });

        const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.total, 0);
        const netCashFlow = totalIncome - totalExpenses;

        res.json({
            period: {
                year: parseInt(year),
                month: parseInt(month),
                monthName: new Date(parseInt(year), parseInt(month) - 1).toLocaleString('es-ES', { month: 'long' })
            },
            summary: {
                totalIncome,
                totalExpenses,
                netCashFlow
            },
            incomeByType,
            expensesByType,
            transactions: {
                income: payments.map(p => ({
                    date: p.date,
                    amount: p.amount,
                    concept: p.invoice?.concept || p.event?.type || 'OTHER',
                    reference: p.reference,
                    method: p.method
                })),
                expenses: expenses.map(e => ({
                    date: e.date,
                    amount: e.total,
                    concept: e.concept,
                    supplier: e.supplierName,
                    reference: e.invoiceNumber
                }))
            }
        });

    } catch (error) {
        console.error('Error getting cash flow:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Get event analysis report
router.get('/event-analysis/:eventId', authenticateToken, async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                assignments: {
                    include: {
                        student: {
                            include: {
                                grade: true,
                                group: true
                            }
                        }
                    }
                },
                payments: true
            }
        });

        if (!event) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        // Calculate statistics
        const totalAssignments = event.assignments.length;
        const totalTicketsAssigned = event.assignments.reduce((sum, a) => sum + a.ticketsAssigned, 0);
        const totalTicketsSold = event.assignments.reduce((sum, a) => sum + a.ticketsSold, 0);
        const totalAmountRaised = event.assignments.reduce((sum, a) => sum + a.amountRaised, 0);
        const totalDirectPayments = event.payments.reduce((sum, p) => sum + p.amount, 0);
        const totalRaised = totalAmountRaised + totalDirectPayments;

        // Performance by grade
        const performanceByGrade = {};
        event.assignments.forEach(assignment => {
            const gradeName = assignment.student.grade.name;
            if (!performanceByGrade[gradeName]) {
                performanceByGrade[gradeName] = {
                    students: 0,
                    ticketsAssigned: 0,
                    ticketsSold: 0,
                    amountRaised: 0
                };
            }
            performanceByGrade[gradeName].students++;
            performanceByGrade[gradeName].ticketsAssigned += assignment.ticketsAssigned;
            performanceByGrade[gradeName].ticketsSold += assignment.ticketsSold;
            performanceByGrade[gradeName].amountRaised += assignment.amountRaised;
        });

        // Top performers
        const topPerformers = event.assignments
            .sort((a, b) => b.amountRaised - a.amountRaised)
            .slice(0, 10)
            .map(assignment => ({
                studentName: `${assignment.student.firstName} ${assignment.student.lastName}`,
                grade: assignment.student.grade.name,
                group: assignment.student.group.name,
                ticketsAssigned: assignment.ticketsAssigned,
                ticketsSold: assignment.ticketsSold,
                amountRaised: assignment.amountRaised,
                performance: assignment.ticketsAssigned > 0 
                    ? Math.round((assignment.ticketsSold / assignment.ticketsAssigned) * 100)
                    : 0
            }));

        res.json({
            event: {
                id: event.id,
                name: event.name,
                type: event.type,
                eventDate: event.eventDate,
                ticketPrice: event.ticketPrice,
                fundraisingGoal: event.fundraisingGoal,
                status: event.status
            },
            summary: {
                totalAssignments,
                totalTicketsAssigned,
                totalTicketsSold,
                totalAmountRaised,
                totalDirectPayments,
                totalRaised,
                goalProgress: event.fundraisingGoal > 0 
                    ? Math.round((totalRaised / event.fundraisingGoal) * 100)
                    : 0,
                averagePerStudent: totalAssignments > 0 
                    ? Math.round(totalRaised / totalAssignments)
                    : 0,
                salesEfficiency: totalTicketsAssigned > 0 
                    ? Math.round((totalTicketsSold / totalTicketsAssigned) * 100)
                    : 0
            },
            performanceByGrade,
            topPerformers
        });

    } catch (error) {
        console.error('Error getting event analysis:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;