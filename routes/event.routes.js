const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, canManageStudents } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

// Validation rules
const validateEvent = [
  body('name').notEmpty().trim().withMessage('Nombre del evento es requerido'),
  body('type').notEmpty().withMessage('Tipo de evento es requerido'),
  body('eventDate').isISO8601().withMessage('Fecha del evento debe ser válida'),
  body('ticketPrice').isFloat({ min: 0 }).withMessage('Precio del boleto debe ser mayor o igual a 0'),
  body('fundraisingGoal').isFloat({ min: 0 }).withMessage('Meta de recaudación debe ser mayor o igual a 0')
];

const validateAssignment = [
  body('studentId').isUUID().withMessage('ID del estudiante inválido'),
  body('ticketsAssigned').isInt({ min: 1 }).withMessage('Número de boletos debe ser mayor a 0')
];

// ================================
// EVENTOS - CRUD COMPLETO
// ================================

// Get all events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, type, year } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      where.eventDate = { gte: startDate, lte: endDate };
    }
    
    const events = await prisma.event.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { 
            assignments: true,
            payments: true 
          }
        }
      },
      orderBy: { eventDate: 'desc' }
    });

    // Add calculated fields
    const eventsWithStats = events.map(event => ({
      ...event,
      progress: event.fundraisingGoal > 0 ? 
        Math.round((event.totalRaised / event.fundraisingGoal) * 100) : 0,
      studentsAssigned: event._count.assignments,
      paymentsReceived: event._count.payments
    }));

    res.json(eventsWithStats);
  } catch (error) {
    console.error('Events fetch error:', error);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
});

// Get single event
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        assignments: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                document: true,
                grade: { select: { name: true } },
                group: { select: { name: true } }
              }
            }
          },
          orderBy: [
            { student: { lastName: 'asc' } },
            { student: { firstName: 'asc' } }
          ]
        },
        payments: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                document: true
              }
            }
          },
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Calculate additional stats
    const stats = {
      totalStudents: event.assignments.length,
      totalTicketsAssigned: event.assignments.reduce((sum, a) => sum + a.ticketsAssigned, 0),
      totalTicketsSold: event.assignments.reduce((sum, a) => sum + a.ticketsSold, 0),
      totalRaised: event.totalRaised,
      pendingAmount: event.assignments.reduce((sum, a) => 
        sum + ((a.ticketsAssigned - a.ticketsSold) * event.ticketPrice), 0),
      progress: event.fundraisingGoal > 0 ? 
        Math.round((event.totalRaised / event.fundraisingGoal) * 100) : 0
    };

    res.json({ ...event, stats });
  } catch (error) {
    console.error('Event fetch error:', error);
    res.status(500).json({ error: 'Error al obtener evento' });
  }
});

// Create event
router.post('/', authenticateToken, canManageStudents, validateEvent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      type,
      description,
      eventDate,
      location,
      ticketPrice,
      fundraisingGoal,
      responsible,
      targetGrades,
      targetGroups,
      assignmentType
    } = req.body;

    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        type,
        description: description?.trim(),
        eventDate: new Date(eventDate),
        location: location?.trim(),
        ticketPrice: parseFloat(ticketPrice),
        fundraisingGoal: parseFloat(fundraisingGoal),
        responsible: responsible?.trim() || req.user.name,
        responsibleId: req.user.id,
        status: 'PLANNING',
        targetGrades: targetGrades ? JSON.stringify(targetGrades) : null,
        targetGroups: targetGroups ? JSON.stringify(targetGroups) : null,
        assignmentType: assignmentType || 'MANUAL'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Event creation error:', error);
    res.status(500).json({ error: 'Error al crear evento' });
  }
});

// Update event
router.put('/:id', authenticateToken, canManageStudents, validateEvent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      type,
      description,
      eventDate,
      location,
      ticketPrice,
      fundraisingGoal,
      responsible,
      status,
      targetGrades,
      targetGroups,
      assignmentType
    } = req.body;

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        name: name.trim(),
        type,
        description: description?.trim(),
        eventDate: new Date(eventDate),
        location: location?.trim(),
        ticketPrice: parseFloat(ticketPrice),
        fundraisingGoal: parseFloat(fundraisingGoal),
        responsible: responsible?.trim(),
        status: status || 'PLANNING',
        targetGrades: targetGrades ? JSON.stringify(targetGrades) : null,
        targetGroups: targetGroups ? JSON.stringify(targetGroups) : null,
        assignmentType: assignmentType || 'MANUAL'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.json(event);
  } catch (error) {
    console.error('Event update error:', error);
    res.status(500).json({ error: 'Error al actualizar evento' });
  }
});

// Delete event
router.delete('/:id', authenticateToken, canManageStudents, async (req, res) => {
  try {
    // Check if event has assignments or payments
    const [assignmentsCount, paymentsCount] = await Promise.all([
      prisma.eventAssignment.count({ where: { eventId: req.params.id } }),
      prisma.payment.count({ where: { eventId: req.params.id } })
    ]);

    if (assignmentsCount > 0 || paymentsCount > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar un evento que tiene asignaciones o pagos registrados'
      });
    }

    await prisma.event.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Evento eliminado exitosamente' });
  } catch (error) {
    console.error('Event deletion error:', error);
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
});

// ================================
// ASIGNACIONES DE BOLETAS
// ================================

// Get event assignments
router.get('/:id/assignments', authenticateToken, async (req, res) => {
  try {
    const { gradeId, groupId, status } = req.query;
    
    const where = { eventId: req.params.id };
    if (status) where.status = status;
    
    const assignments = await prisma.eventAssignment.findMany({
      where,
      include: {
        student: {
          include: {
            grade: { select: { id: true, name: true } },
            group: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: [
        { student: { grade: { order: 'asc' } } },
        { student: { group: { name: 'asc' } } },
        { student: { lastName: 'asc' } }
      ]
    });

    // Filter by grade or group if specified
    let filteredAssignments = assignments;
    if (gradeId) {
      filteredAssignments = assignments.filter(a => a.student.gradeId === gradeId);
    }
    if (groupId) {
      filteredAssignments = assignments.filter(a => a.student.groupId === groupId);
    }

    // Add calculated fields
    const assignmentsWithStats = filteredAssignments.map(assignment => {
      const totalValue = assignment.ticketsAssigned * assignment.event?.ticketPrice || 0;
      const paidValue = assignment.ticketsSold * assignment.event?.ticketPrice || 0;
      const pendingValue = totalValue - paidValue;

      return {
        ...assignment,
        totalValue,
        paidValue,
        pendingValue,
        progressPercentage: totalValue > 0 ? Math.round((paidValue / totalValue) * 100) : 0
      };
    });

    res.json(assignmentsWithStats);
  } catch (error) {
    console.error('Event assignments fetch error:', error);
    res.status(500).json({ error: 'Error al obtener asignaciones' });
  }
});

// Create assignment (single student)
router.post('/:id/assignments', authenticateToken, canManageStudents, validateAssignment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, ticketsAssigned } = req.body;

    // Check if student already has assignment for this event
    const existingAssignment = await prisma.eventAssignment.findUnique({
      where: {
        eventId_studentId: {
          eventId: req.params.id,
          studentId: studentId
        }
      }
    });

    if (existingAssignment) {
      return res.status(409).json({
        error: 'El estudiante ya tiene una asignación para este evento'
      });
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    const assignment = await prisma.eventAssignment.create({
      data: {
        eventId: req.params.id,
        studentId,
        ticketsAssigned: parseInt(ticketsAssigned),
        ticketsSold: 0,
        amountRaised: 0,
        status: 'PENDING'
      },
      include: {
        student: {
          include: {
            grade: { select: { name: true } },
            group: { select: { name: true } }
          }
        }
      }
    });

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Assignment creation error:', error);
    res.status(500).json({ error: 'Error al crear asignación' });
  }
});

// Bulk assign to grade or group
router.post('/:id/assignments/bulk', authenticateToken, canManageStudents, async (req, res) => {
  try {
    const { gradeId, groupId, gradeIds, groupIds, ticketsPerStudent } = req.body;

    if (!gradeId && !groupId && !gradeIds && !groupIds) {
      return res.status(400).json({ error: 'Debe especificar al menos un grado o grupo' });
    }

    if (!ticketsPerStudent || ticketsPerStudent < 1) {
      return res.status(400).json({ error: 'Debe especificar número válido de boletos por estudiante' });
    }

    // Build where clause for students
    const where = { status: 'ACTIVE' };
    
    if (gradeIds && gradeIds.length > 0) {
      where.gradeId = { in: gradeIds };
    } else if (gradeId) {
      where.gradeId = gradeId;
    }
    
    if (groupIds && groupIds.length > 0) {
      where.groupId = { in: groupIds };
    } else if (groupId) {
      where.groupId = groupId;
    }

    const students = await prisma.student.findMany({
      where,
      select: { 
        id: true, 
        firstName: true, 
        lastName: true,
        grade: { select: { name: true } },
        group: { select: { name: true } }
      }
    });

    if (students.length === 0) {
      return res.status(404).json({ error: 'No se encontraron estudiantes activos con los criterios especificados' });
    }

    // Check for existing assignments
    const existingAssignments = await prisma.eventAssignment.findMany({
      where: {
        eventId: req.params.id,
        studentId: { in: students.map(s => s.id) }
      }
    });

    if (existingAssignments.length > 0) {
      return res.status(409).json({
        error: `${existingAssignments.length} estudiantes ya tienen asignaciones para este evento`,
        existingCount: existingAssignments.length,
        newStudentsCount: students.length - existingAssignments.length
      });
    }

    // Create bulk assignments
    const assignmentsData = students.map(student => ({
      eventId: req.params.id,
      studentId: student.id,
      ticketsAssigned: parseInt(ticketsPerStudent),
      ticketsSold: 0,
      amountRaised: 0,
      status: 'PENDING'
    }));

    const assignments = await prisma.eventAssignment.createMany({
      data: assignmentsData
    });

    // Update event assignment type if it was automatic
    if (gradeIds || groupIds) {
      await prisma.event.update({
        where: { id: req.params.id },
        data: {
          assignmentType: gradeIds && groupIds ? 'MIXED' : gradeIds ? 'BY_GRADE' : 'BY_GROUP'
        }
      });
    }

    res.status(201).json({
      message: `Se asignaron ${ticketsPerStudent} boletos a ${students.length} estudiantes`,
      assignmentsCreated: assignments.count,
      studentsAffected: students.length,
      studentsDetails: students.map(s => ({
        name: `${s.firstName} ${s.lastName}`,
        grade: s.grade.name,
        group: s.group.name
      }))
    });
  } catch (error) {
    console.error('Bulk assignment error:', error);
    res.status(500).json({ error: 'Error al crear asignaciones masivas' });
  }
});

// Update assignment
router.put('/:id/assignments/:assignmentId', authenticateToken, canManageStudents, async (req, res) => {
  try {
    const { ticketsAssigned, ticketsSold, status } = req.body;

    const assignment = await prisma.eventAssignment.update({
      where: { id: req.params.assignmentId },
      data: {
        ticketsAssigned: ticketsAssigned ? parseInt(ticketsAssigned) : undefined,
        ticketsSold: ticketsSold !== undefined ? parseInt(ticketsSold) : undefined,
        status: status || undefined,
        amountRaised: ticketsSold !== undefined ? 
          ticketsSold * (await prisma.event.findUnique({
            where: { id: req.params.id },
            select: { ticketPrice: true }
          })).ticketPrice : undefined
      },
      include: {
        student: {
          include: {
            grade: { select: { name: true } },
            group: { select: { name: true } }
          }
        }
      }
    });

    // Update event total raised
    await updateEventTotalRaised(req.params.id);

    res.json(assignment);
  } catch (error) {
    console.error('Assignment update error:', error);
    res.status(500).json({ error: 'Error al actualizar asignación' });
  }
});

// Delete assignment
router.delete('/:id/assignments/:assignmentId', authenticateToken, canManageStudents, async (req, res) => {
  try {
    await prisma.eventAssignment.delete({
      where: { id: req.params.assignmentId }
    });

    res.json({ message: 'Asignación eliminada exitosamente' });
  } catch (error) {
    console.error('Assignment deletion error:', error);
    res.status(500).json({ error: 'Error al eliminar asignación' });
  }
});

// Get assignments by student
router.get('/assignments/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const assignments = await prisma.eventAssignment.findMany({
      where: { studentId: req.params.studentId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            type: true,
            ticketPrice: true,
            status: true
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            document: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ assignments });
  } catch (error) {
    console.error('Student assignments fetch error:', error);
    res.status(500).json({ error: 'Error al obtener asignaciones del estudiante' });
  }
});

// Get single assignment
router.get('/assignments/:assignmentId', authenticateToken, async (req, res) => {
  try {
    const assignment = await prisma.eventAssignment.findUnique({
      where: { id: req.params.assignmentId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            type: true,
            ticketPrice: true,
            status: true
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            document: true
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    res.json({ assignment });
  } catch (error) {
    console.error('Assignment fetch error:', error);
    res.status(500).json({ error: 'Error al obtener asignación' });
  }
});

// ================================
// PAGOS DE EVENTOS
// ================================

// Get event payments
router.get('/:id/payments', authenticateToken, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { eventId: req.params.id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            document: true,
            grade: { select: { name: true } },
            group: { select: { name: true } }
          }
        },
        user: {
          select: { name: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(payments);
  } catch (error) {
    console.error('Event payments fetch error:', error);
    res.status(500).json({ error: 'Error al obtener pagos del evento' });
  }
});

// Record payment for event
router.post('/:id/payments', authenticateToken, canManageStudents, async (req, res) => {
  try {
    const { studentId, amount, method, reference, observations } = req.body;

    // Verify student has assignment for this event
    const assignment = await prisma.eventAssignment.findUnique({
      where: {
        eventId_studentId: {
          eventId: req.params.id,
          studentId: studentId
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({
        error: 'El estudiante no tiene asignación para este evento'
      });
    }

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: req.params.id }
    });

    // Generate payment number
    const paymentCount = await prisma.payment.count();
    const paymentNumber = `PAG-${String(paymentCount + 1).padStart(6, '0')}`;

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        date: new Date(),
        studentId,
        eventId: req.params.id,
        amount: parseFloat(amount),
        method,
        reference,
        observations,
        userId: req.user.id,
        status: 'COMPLETED'
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            document: true
          }
        }
      }
    });

    // Update assignment tickets sold
    const newTicketsSold = Math.min(
      assignment.ticketsAssigned,
      assignment.ticketsSold + Math.floor(parseFloat(amount) / event.ticketPrice)
    );

    await prisma.eventAssignment.update({
      where: { id: assignment.id },
      data: {
        ticketsSold: newTicketsSold,
        amountRaised: assignment.amountRaised + parseFloat(amount)
      }
    });

    // Update event total raised
    await updateEventTotalRaised(req.params.id);

    res.status(201).json(payment);
  } catch (error) {
    console.error('Event payment error:', error);
    res.status(500).json({ error: 'Error al registrar pago' });
  }
});

// ================================
// REPORTES Y ESTADÍSTICAS
// ================================

// Get event statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const [event, assignments, payments] = await Promise.all([
      prisma.event.findUnique({
        where: { id: req.params.id },
        include: { user: { select: { name: true } } }
      }),
      prisma.eventAssignment.findMany({
        where: { eventId: req.params.id },
        include: {
          student: {
            include: {
              grade: { select: { id: true, name: true } },
              group: { select: { id: true, name: true } }
            }
          }
        }
      }),
      prisma.payment.findMany({
        where: { eventId: req.params.id }
      })
    ]);

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Calculate general stats
    const totalStudents = assignments.length;
    const totalTicketsAssigned = assignments.reduce((sum, a) => sum + a.ticketsAssigned, 0);
    const totalTicketsSold = assignments.reduce((sum, a) => sum + a.ticketsSold, 0);
    const totalRaised = event.totalRaised;
    const pendingAmount = (totalTicketsAssigned - totalTicketsSold) * event.ticketPrice;
    const progress = event.fundraisingGoal > 0 ? 
      Math.round((totalRaised / event.fundraisingGoal) * 100) : 0;

    // Stats by grade
    const statsByGrade = {};
    assignments.forEach(assignment => {
      const gradeName = assignment.student.grade.name;
      if (!statsByGrade[gradeName]) {
        statsByGrade[gradeName] = {
          students: 0,
          ticketsAssigned: 0,
          ticketsSold: 0,
          raised: 0
        };
      }
      statsByGrade[gradeName].students++;
      statsByGrade[gradeName].ticketsAssigned += assignment.ticketsAssigned;
      statsByGrade[gradeName].ticketsSold += assignment.ticketsSold;
      statsByGrade[gradeName].raised += assignment.amountRaised;
    });

    // Stats by group
    const statsByGroup = {};
    assignments.forEach(assignment => {
      const groupKey = `${assignment.student.grade.name} - ${assignment.student.group.name}`;
      if (!statsByGroup[groupKey]) {
        statsByGroup[groupKey] = {
          students: 0,
          ticketsAssigned: 0,
          ticketsSold: 0,
          raised: 0
        };
      }
      statsByGroup[groupKey].students++;
      statsByGroup[groupKey].ticketsAssigned += assignment.ticketsAssigned;
      statsByGroup[groupKey].ticketsSold += assignment.ticketsSold;
      statsByGroup[groupKey].raised += assignment.amountRaised;
    });

    // Recent payments
    const recentPayments = payments
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // Students with pending payments
    const studentsWithDebt = assignments.filter(a => 
      a.ticketsSold < a.ticketsAssigned
    ).map(assignment => ({
      studentId: assignment.student.id,
      studentName: `${assignment.student.firstName} ${assignment.student.lastName}`,
      grade: assignment.student.grade.name,
      group: assignment.student.group.name,
      ticketsAssigned: assignment.ticketsAssigned,
      ticketsSold: assignment.ticketsSold,
      pendingTickets: assignment.ticketsAssigned - assignment.ticketsSold,
      pendingAmount: (assignment.ticketsAssigned - assignment.ticketsSold) * event.ticketPrice
    }));

    res.json({
      event: {
        id: event.id,
        name: event.name,
        type: event.type,
        ticketPrice: event.ticketPrice,
        fundraisingGoal: event.fundraisingGoal,
        status: event.status
      },
      generalStats: {
        totalStudents,
        totalTicketsAssigned,
        totalTicketsSold,
        totalRaised,
        pendingAmount,
        progress,
        averagePerStudent: totalStudents > 0 ? Math.round(totalRaised / totalStudents) : 0
      },
      statsByGrade,
      statsByGroup,
      recentPayments,
      studentsWithDebt: studentsWithDebt.slice(0, 20) // Top 20 deudores
    });
  } catch (error) {
    console.error('Event stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas del evento' });
  }
});

// Get events dashboard
router.get('/dashboard/summary', authenticateToken, async (req, res) => {
  try {
    const [activeEvents, totalEvents, totalRaised, recentPayments] = await Promise.all([
      prisma.event.count({ where: { status: 'ACTIVE' } }),
      prisma.event.count(),
      prisma.event.aggregate({
        _sum: { totalRaised: true }
      }),
      prisma.payment.findMany({
        where: { eventId: { not: null } },
        include: {
          event: { select: { name: true } },
          student: {
            select: {
              firstName: true,
              lastName: true,
              grade: { select: { name: true } }
            }
          }
        },
        orderBy: { date: 'desc' },
        take: 5
      })
    ]);

    // Get events by status
    const eventsByStatus = await prisma.event.groupBy({
      by: ['status'],
      _count: true
    });

    // Get events by type
    const eventsByType = await prisma.event.groupBy({
      by: ['type'],
      _count: true
    });

    res.json({
      summary: {
        activeEvents,
        totalEvents,
        totalRaised: totalRaised._sum.totalRaised || 0,
        recentPaymentsCount: recentPayments.length
      },
      eventsByStatus,
      eventsByType,
      recentPayments
    });
  } catch (error) {
    console.error('Events dashboard error:', error);
    res.status(500).json({ error: 'Error al obtener dashboard de eventos' });
  }
});

// Get all event assignments (for reports)
router.get('/assignments/all', authenticateToken, async (req, res) => {
  try {
    const { eventId, eventType, startDate, endDate } = req.query;
    
    const where = {};
    
    // Build event filter (handle null/empty values)
    const eventWhere = {};
    if (eventId && eventId !== 'null' && eventId !== '') eventWhere.id = eventId;
    if (eventType && eventType !== 'null' && eventType !== '') eventWhere.type = eventType;
    if ((startDate && startDate !== 'null' && startDate !== '') || 
        (endDate && endDate !== 'null' && endDate !== '')) {
      eventWhere.eventDate = {};
      if (startDate && startDate !== 'null' && startDate !== '') {
        eventWhere.eventDate.gte = new Date(startDate);
      }
      if (endDate && endDate !== 'null' && endDate !== '') {
        eventWhere.eventDate.lte = new Date(endDate);
      }
    }
    
    // If we have event filters, get matching event IDs first
    if (Object.keys(eventWhere).length > 0) {
      const matchingEvents = await prisma.event.findMany({
        where: eventWhere,
        select: { id: true }
      });
      where.eventId = { in: matchingEvents.map(e => e.id) };
    }
    
    const assignments = await prisma.eventAssignment.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            type: true,
            ticketPrice: true,
            eventDate: true
          }
        },
        student: {
          include: {
            grade: { select: { id: true, name: true } },
            group: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: [
        { event: { eventDate: 'desc' } },
        { student: { lastName: 'asc' } }
      ]
    });

    res.json(assignments);
  } catch (error) {
    console.error('All assignments fetch error:', error);
    res.status(500).json({ error: 'Error al obtener todas las asignaciones' });
  }
});

// Get all event payments (for reports)
router.get('/payments/all', authenticateToken, async (req, res) => {
  try {
    const { eventId, eventType, startDate, endDate } = req.query;
    
    const where = { eventId: { not: null } };
    
    // Build event filter (handle null/empty values)
    const eventWhere = {};
    if (eventId && eventId !== 'null' && eventId !== '') eventWhere.id = eventId;
    if (eventType && eventType !== 'null' && eventType !== '') eventWhere.type = eventType;
    if ((startDate && startDate !== 'null' && startDate !== '') || 
        (endDate && endDate !== 'null' && endDate !== '')) {
      eventWhere.eventDate = {};
      if (startDate && startDate !== 'null' && startDate !== '') {
        eventWhere.eventDate.gte = new Date(startDate);
      }
      if (endDate && endDate !== 'null' && endDate !== '') {
        eventWhere.eventDate.lte = new Date(endDate);
      }
    }
    
    // If we have event filters, get matching event IDs first
    if (Object.keys(eventWhere).length > 0) {
      const matchingEvents = await prisma.event.findMany({
        where: eventWhere,
        select: { id: true }
      });
      where.eventId = { in: matchingEvents.map(e => e.id) };
    }
    
    const payments = await prisma.payment.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            type: true,
            ticketPrice: true,
            eventDate: true
          }
        },
        student: {
          include: {
            grade: { select: { id: true, name: true } },
            group: { select: { id: true, name: true } }
          }
        },
        user: {
          select: { name: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(payments);
  } catch (error) {
    console.error('All payments fetch error:', error);
    res.status(500).json({ error: 'Error al obtener todos los pagos' });
  }
});

// ================================
// HELPER FUNCTIONS
// ================================

async function updateEventTotalRaised(eventId) {
  try {
    const assignments = await prisma.eventAssignment.findMany({
      where: { eventId }
    });

    const totalRaised = assignments.reduce((sum, a) => sum + a.amountRaised, 0);

    await prisma.event.update({
      where: { id: eventId },
      data: { totalRaised }
    });
  } catch (error) {
    console.error('Error updating event total raised:', error);
  }
}

module.exports = router;