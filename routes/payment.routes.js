const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, canManageAccounting } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

// Validation rules - CORREGIDAS para facturas externas
const validatePayment = [
  body('studentId').optional().isUUID().withMessage('ID de estudiante inválido'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
  body('method').isIn(['CASH', 'BANK_TRANSFER', 'CARD', 'CHECK', 'OTHER']).withMessage('Método de pago inválido'),
  body('invoiceId').optional().isUUID().withMessage('ID de factura inválido'),
  body('eventId').optional().isUUID().withMessage('ID de evento inválido')
];

// Get all payments with filters and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = '', 
      studentId = '', 
      method = '',
      search = '',
      startDate = '',
      endDate = ''
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    const where = {};
    
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (method) where.method = method;
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    
    if (search) {
      where.OR = [
        { paymentNumber: { contains: search } },
        { reference: { contains: search, mode: 'insensitive' } },
        { student: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { document: { contains: search } }
          ]
        }}
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
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
          invoice: {
            select: {
              invoiceNumber: true,
              concept: true,
              total: true
            }
          },
          event: {
            select: {
              name: true,
              type: true
            }
          },
          user: { select: { name: true } }
        },
        orderBy: { date: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.payment.count({ where })
    ]);

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Payments fetch error:', error);
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
});

// Get single payment
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        student: {
          include: {
            grade: { select: { name: true } },
            group: { select: { name: true } }
          }
        },
        invoice: {
          include: {
            items: true
          }
        },
        event: true,
        user: { select: { name: true } }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Payment fetch error:', error);
    res.status(500).json({ error: 'Error al obtener pago' });
  }
});

// Create payment - FUNCIÓN CORREGIDA
router.post('/', authenticateToken, canManageAccounting, validatePayment, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { invoiceId, eventId, ...paymentData } = req.body;

    // CORREGIR: Generar número de pago único de forma robusta
    const currentYear = new Date().getFullYear();
    
    // Función para generar número único
    const generateUniquePaymentNumber = async (tx, retries = 5) => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          // Obtener el último número del año actual
          const lastPayment = await tx.payment.findFirst({
            where: {
              paymentNumber: {
                startsWith: `PAG-${currentYear}-`
              }
            },
            orderBy: { paymentNumber: 'desc' }
          });

          let nextNumber = 1;
          if (lastPayment) {
            const parts = lastPayment.paymentNumber.split('-');
            if (parts.length === 3) {
              nextNumber = parseInt(parts[2]) + 1;
            }
          }

          const paymentNumber = `PAG-${currentYear}-${nextNumber.toString().padStart(6, '0')}`;

          // Verificar que no existe (doble verificación)
          const existing = await tx.payment.findUnique({
            where: { paymentNumber }
          });

          if (!existing) {
            return paymentNumber;
          }

          // Si existe, incrementar y reintentar
          nextNumber++;
        } catch (error) {
          if (attempt === retries - 1) {
            throw new Error('No se pudo generar un número de pago único: ' + error.message);
          }
          
          // Esperar un tiempo aleatorio antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        }
      }
      
      throw new Error('No se pudo generar un número de pago único después de varios intentos');
    };

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generar número de pago único
      const paymentNumber = await generateUniquePaymentNumber(tx);
      
      console.log('🔢 Generated payment number:', paymentNumber);

      // Create payment
      const payment = await tx.payment.create({
        data: {
          ...paymentData,
          paymentNumber,
          userId: req.user.id,
          date: new Date(),
          status: 'COMPLETED',
          invoiceId: invoiceId || null,
          eventId: eventId || null
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
              total: true
            }
          }
        }
      });

      // Update invoice status if payment is for an invoice
      if (invoiceId) {
        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceId },
          include: { 
            payments: { 
              where: { status: 'COMPLETED' }
            } 
          }
        });

        if (invoice) {
          const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + paymentData.amount;
          
          let newStatus = 'PENDING';
          if (totalPaid >= invoice.total) {
            newStatus = 'PAID';
          } else if (totalPaid > 0) {
            newStatus = 'PARTIAL';
          }

          await tx.invoice.update({
            where: { id: invoiceId },
            data: { status: newStatus }
          });

          console.log('✅ Invoice status updated:', { invoiceId, newStatus, totalPaid, invoiceTotal: invoice.total });
        }
      }

      return payment;
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Error al crear pago' });
  }
});

// Update payment
router.put('/:id', authenticateToken, canManageAccounting, async (req, res) => {
  try {
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: req.body,
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
            total: true
          }
        }
      }
    });

    res.json(payment);
  } catch (error) {
    console.error('Payment update error:', error);
    res.status(500).json({ error: 'Error al actualizar pago' });
  }
});

// Cancel payment
router.patch('/:id/cancel', authenticateToken, canManageAccounting, async (req, res) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get payment details
      const payment = await tx.payment.findUnique({
        where: { id: req.params.id },
        include: { invoice: true }
      });

      if (!payment) {
        throw new Error('Pago no encontrado');
      }

      if (payment.status === 'CANCELLED') {
        throw new Error('El pago ya está cancelado');
      }

      // Cancel payment
      const updatedPayment = await tx.payment.update({
        where: { id: req.params.id },
        data: { 
          status: 'CANCELLED',
          observations: req.body.reason || 'Pago cancelado'
        }
      });

      // Update invoice status if applicable
      if (payment.invoiceId) {
        const invoice = await tx.invoice.findUnique({
          where: { id: payment.invoiceId },
          include: { 
            payments: {
              where: { 
                status: { not: 'CANCELLED' }
              }
            }
          }
        });

        if (invoice) {
          const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
          
          let newStatus = 'PENDING';
          if (totalPaid >= invoice.total) {
            newStatus = 'PAID';
          } else if (totalPaid > 0) {
            newStatus = 'PARTIAL';
          }

          await tx.invoice.update({
            where: { id: payment.invoiceId },
            data: { status: newStatus }
          });
        }
      }

      return updatedPayment;
    });

    res.json(result);
  } catch (error) {
    console.error('Payment cancellation error:', error);
    res.status(500).json({ error: error.message || 'Error al cancelar pago' });
  }
});

// Get payment statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const [
      totalPayments,
      todayPayments,
      monthPayments,
      totalAmount,
      todayAmount,
      monthAmount,
      paymentsByMethod
    ] = await Promise.all([
      prisma.payment.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.count({ 
        where: { 
          status: 'COMPLETED',
          date: { gte: startOfDay }
        } 
      }),
      prisma.payment.count({ 
        where: { 
          status: 'COMPLETED',
          date: { gte: startOfMonth }
        } 
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' }
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { 
          status: 'COMPLETED',
          date: { gte: startOfDay }
        }
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { 
          status: 'COMPLETED',
          date: { gte: startOfMonth }
        }
      }),
      prisma.payment.groupBy({
        by: ['method'],
        _count: { method: true },
        _sum: { amount: true },
        where: { status: 'COMPLETED' }
      })
    ]);

    res.json({
      totalPayments,
      todayPayments,
      monthPayments,
      totalAmount: totalAmount._sum.amount || 0,
      todayAmount: todayAmount._sum.amount || 0,
      monthAmount: monthAmount._sum.amount || 0,
      paymentsByMethod
    });
  } catch (error) {
    console.error('Payment stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Delete payment
router.delete('/:id', authenticateToken, canManageAccounting, async (req, res) => {
  try {
    const paymentId = req.params.id;

    // Get payment details before deletion
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: true,
        event: true
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Delete the payment
      await tx.payment.delete({
        where: { id: paymentId }
      });

      // Update invoice status if payment was linked to an invoice
      if (payment.invoiceId) {
        const invoice = await tx.invoice.findUnique({
          where: { id: payment.invoiceId },
          include: { payments: true }
        });

        if (invoice) {
          const remainingPayments = invoice.payments.filter(p => p.id !== paymentId);
          const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);
          
          let newStatus = 'PENDING';
          if (totalPaid >= invoice.total) {
            newStatus = 'PAID';
          } else if (totalPaid > 0) {
            newStatus = 'PARTIAL';
          }

          await tx.invoice.update({
            where: { id: payment.invoiceId },
            data: { status: newStatus }
          });
        }
      }

      // Update event assignment if payment was for an event
      if (payment.eventId) {
        const assignment = await tx.eventAssignment.findUnique({
          where: {
            eventId_studentId: {
              eventId: payment.eventId,
              studentId: payment.studentId
            }
          }
        });

        if (assignment) {
          const event = await tx.event.findUnique({
            where: { id: payment.eventId }
          });

          // Recalculate tickets sold and amount raised
          const remainingPayments = await tx.payment.findMany({
            where: {
              eventId: payment.eventId,
              studentId: payment.studentId,
              id: { not: paymentId }
            }
          });

          const newAmountRaised = remainingPayments.reduce((sum, p) => sum + p.amount, 0);
          const newTicketsSold = event ? Math.floor(newAmountRaised / event.ticketPrice) : 0;

          await tx.eventAssignment.update({
            where: { id: assignment.id },
            data: {
              ticketsSold: Math.min(assignment.ticketsAssigned, newTicketsSold),
              amountRaised: newAmountRaised
            }
          });

          // Update event total raised
          const allEventPayments = await tx.payment.findMany({
            where: { 
              eventId: payment.eventId,
              id: { not: paymentId }
            }
          });
          
          const newEventTotal = allEventPayments.reduce((sum, p) => sum + p.amount, 0);
          
          await tx.event.update({
            where: { id: payment.eventId },
            data: { totalRaised: newEventTotal }
          });
        }
      }

      return payment;
    });

    res.json({ 
      success: true, 
      message: 'Pago eliminado exitosamente',
      deletedPayment: result
    });
  } catch (error) {
    console.error('Payment deletion error:', error);
    res.status(500).json({ error: 'Error al eliminar pago' });
  }
});

module.exports = router;