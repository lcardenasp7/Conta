/**
 * RUTAS DE PRÉSTAMOS ENTRE FONDOS
 * Sistema completo de préstamos con aprobación automática/manual
 * Autor: Sistema de Trazabilidad VSP
 * Fecha: 2024-01-15
 */

const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { 
  authenticateToken, 
  canManageAccounting, 
  canApproveLargeLoans,
  canManageFundTransfers,
  isRector 
} = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

// ==========================================
// GESTIÓN BÁSICA DE PRÉSTAMOS
// ==========================================

// Obtener todos los préstamos con filtros
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📋 GET /api/fund-loans - Obteniendo préstamos');
    
    const { 
      status,
      lenderFundId,
      borrowerFundId,
      requestedBy,
      overdue = 'false',
      page = 1,
      limit = 20
    } = req.query;

    let where = {};

    // Filtros
    if (status) {
      where.status = { in: status.split(',') };
    }

    if (lenderFundId) {
      where.lenderFundId = lenderFundId;
    }

    if (borrowerFundId) {
      where.borrowerFundId = borrowerFundId;
    }

    if (requestedBy) {
      where.requestedBy = requestedBy;
    }

    // Filtro de vencidos
    if (overdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = { in: ['DISBURSED', 'REPAYING'] };
    }

    const [loans, total] = await Promise.all([
      prisma.fundLoan.findMany({
        where,
        include: {
          lenderFund: { select: { id: true, name: true, code: true, currentBalance: true } },
          borrowerFund: { select: { id: true, name: true, code: true, currentBalance: true } },
          requester: { select: { id: true, name: true, role: true } },
          approver: { select: { id: true, name: true, role: true } },
          transactions: {
            include: {
              user: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { requestDate: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.fundLoan.count({ where })
    ]);

    // Calcular información adicional
    const loansWithDetails = loans.map(loan => {
      const today = new Date();
      const dueDate = new Date(loan.dueDate);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      return {
        ...loan,
        isOverdue: daysUntilDue < 0 && ['DISBURSED', 'REPAYING'].includes(loan.status),
        daysUntilDue,
        isNearDue: daysUntilDue >= 0 && daysUntilDue <= 7,
        requiresApproval: loan.amount >= 1000000,
        paymentProgress: loan.amount > 0 ? Math.round((loan.totalRepaid / loan.amount) * 100) : 0
      };
    });

    console.log(`✅ Obtenidos ${loansWithDetails.length} préstamos`);
    res.json({
      success: true,
      loans: loansWithDetails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo préstamos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener préstamos',
      details: error.message 
    });
  }
});

// Obtener préstamo específico
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 GET /api/fund-loans/:id - Obteniendo préstamo:', req.params.id);
    
    const loanId = req.params.id;

    const loan = await prisma.fundLoan.findUnique({
      where: { id: loanId },
      include: {
        lenderFund: { 
          select: { 
            id: true, 
            name: true, 
            code: true, 
            currentBalance: true,
            type: true 
          } 
        },
        borrowerFund: { 
          select: { 
            id: true, 
            name: true, 
            code: true, 
            currentBalance: true,
            type: true 
          } 
        },
        requester: { select: { id: true, name: true, role: true, email: true } },
        approver: { select: { id: true, name: true, role: true, email: true } },
        transactions: {
          include: {
            user: { select: { name: true } },
            fund: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Préstamo no encontrado'
      });
    }

    // Calcular detalles adicionales
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const requestDate = new Date(loan.requestDate);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    const daysSinceRequest = Math.ceil((today - requestDate) / (1000 * 60 * 60 * 24));

    const loanWithDetails = {
      ...loan,
      isOverdue: daysUntilDue < 0 && ['DISBURSED', 'REPAYING'].includes(loan.status),
      daysUntilDue,
      daysSinceRequest,
      isNearDue: daysUntilDue >= 0 && daysUntilDue <= 7,
      requiresApproval: loan.amount >= 1000000,
      paymentProgress: loan.amount > 0 ? Math.round((loan.totalRepaid / loan.amount) * 100) : 0,
      canUserApprove: req.user.role === 'RECTOR' || req.user.role === 'ADMIN',
      canUserEdit: loan.status === 'PENDING' && (loan.requestedBy === req.user.id || ['RECTOR', 'ADMIN'].includes(req.user.role))
    };

    console.log('✅ Préstamo obtenido con detalles completos');
    res.json({
      success: true,
      loan: loanWithDetails
    });

  } catch (error) {
    console.error('❌ Error obteniendo préstamo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener préstamo',
      details: error.message 
    });
  }
});

// Crear solicitud de préstamo
router.post('/', authenticateToken, canManageAccounting, [
  body('lenderFundId').isUUID().withMessage('ID de fondo prestamista inválido'),
  body('borrowerFundId').isUUID().withMessage('ID de fondo receptor inválido'),
  body('amount').isFloat({ min: 1 }).withMessage('Monto debe ser mayor a 0'),
  body('reason').isLength({ min: 10 }).withMessage('Razón debe tener al menos 10 caracteres'),
  body('dueDate').isISO8601().withMessage('Fecha de vencimiento inválida')
], async (req, res) => {
  try {
    console.log('📝 POST /api/fund-loans - Creando solicitud de préstamo');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Errores de validación',
        details: errors.array()
      });
    }

    const { lenderFundId, borrowerFundId, amount, reason, dueDate, observations } = req.body;

    // Validaciones de negocio
    if (lenderFundId === borrowerFundId) {
      return res.status(400).json({
        success: false,
        error: 'El fondo prestamista y receptor no pueden ser el mismo'
      });
    }

    // Verificar que la fecha de vencimiento sea futura
    const parsedDueDate = new Date(dueDate);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 7); // Mínimo 7 días

    if (parsedDueDate < minDate) {
      return res.status(400).json({
        success: false,
        error: 'La fecha de vencimiento debe ser al menos 7 días en el futuro'
      });
    }

    // Verificar fondos existen y están activos
    const [lenderFund, borrowerFund] = await Promise.all([
      prisma.fund.findUnique({ where: { id: lenderFundId } }),
      prisma.fund.findUnique({ where: { id: borrowerFundId } })
    ]);

    if (!lenderFund || !borrowerFund) {
      return res.status(404).json({
        success: false,
        error: 'Uno o ambos fondos no existen'
      });
    }

    if (!lenderFund.isActive || !borrowerFund.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Uno o ambos fondos no están activos'
      });
    }

    // Validar capacidad de préstamo (30% del saldo)
    const maxLoanAmount = Math.floor(lenderFund.currentBalance * 0.30);
    
    if (amount > maxLoanAmount) {
      return res.status(400).json({
        success: false,
        error: `El monto excede el límite de préstamo del fondo (30% del saldo). Máximo permitido: $${maxLoanAmount.toLocaleString()}`
      });
    }

    if (lenderFund.currentBalance < amount) {
      return res.status(400).json({
        success: false,
        error: `Saldo insuficiente en ${lenderFund.name}. Disponible: $${lenderFund.currentBalance.toLocaleString()}`
      });
    }

    // Determinar si requiere aprobación del rector
    const requiresRectorApproval = amount >= 1000000;
    const canAutoApprove = !requiresRectorApproval;
    const userCanApprove = ['RECTOR', 'ADMIN'].includes(req.user.role);

    const result = await prisma.$transaction(async (tx) => {
      // Crear solicitud de préstamo
      const loan = await tx.fundLoan.create({
        data: {
          lenderFundId,
          borrowerFundId,
          amount,
          reason,
          dueDate: parsedDueDate,
          observations,
          requestedBy: req.user.id,
          pendingAmount: amount,
          status: canAutoApprove || userCanApprove ? 'APPROVED' : 'PENDING',
          ...(canAutoApprove || userCanApprove ? {
            approvedBy: req.user.id,
            approvalDate: new Date()
          } : {})
        }
      });

      // Si se aprueba automáticamente, proceder con el desembolso
      if (canAutoApprove || userCanApprove) {
        console.log('💰 Aprobación automática - Desembolsando préstamo');
        
        // Registrar transacción de salida (fondo prestamista)
        const outTransaction = await tx.fundTransaction.create({
          data: {
            fundId: lenderFundId,
            type: 'LOAN_DISBURSED',
            amount,
            description: `Préstamo otorgado a ${borrowerFund.name}: ${reason}`,
            userId: req.user.id,
            performedBy: req.user.id,
            fundLoanId: loan.id,
            balanceAfter: lenderFund.currentBalance - amount,
            isApproved: true
          }
        });

        // Registrar transacción de entrada (fondo receptor)
        const inTransaction = await tx.fundTransaction.create({
          data: {
            fundId: borrowerFundId,
            type: 'LOAN_RECEIVED',
            amount,
            description: `Préstamo recibido de ${lenderFund.name}: ${reason}`,
            userId: req.user.id,
            performedBy: req.user.id,
            fundLoanId: loan.id,
            balanceAfter: borrowerFund.currentBalance + amount,
            isApproved: true
          }
        });

        // Actualizar saldos de los fondos
        await Promise.all([
          tx.fund.update({
            where: { id: lenderFundId },
            data: {
              currentBalance: { decrement: amount },
              totalExpenses: { increment: amount },
              balance: { decrement: amount }
            }
          }),
          tx.fund.update({
            where: { id: borrowerFundId },
            data: {
              currentBalance: { increment: amount },
              totalIncome: { increment: amount },
              balance: { increment: amount }
            }
          })
        ]);

        // Actualizar estado del préstamo a DISBURSED
        await tx.fundLoan.update({
          where: { id: loan.id },
          data: { status: 'DISBURSED' }
        });

        return { loan, outTransaction, inTransaction, autoApproved: true };
      }

      return { loan, autoApproved: false };
    });

    const message = result.autoApproved 
      ? 'Préstamo aprobado y desembolsado automáticamente'
      : requiresRectorApproval 
        ? 'Solicitud creada. Requiere aprobación del rector (monto ≥ $1,000,000)'
        : 'Solicitud de préstamo creada exitosamente';

    console.log('✅ Solicitud de préstamo procesada');
    res.status(201).json({
      success: true,
      loan: result.loan,
      autoApproved: result.autoApproved,
      requiresRectorApproval,
      message
    });

  } catch (error) {
    console.error('❌ Error creando solicitud:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al crear solicitud de préstamo',
      details: error.message 
    });
  }
});

// ==========================================
// GESTIÓN DE APROBACIONES
// ==========================================

// Obtener préstamos pendientes de aprobación
router.get('/pending-approvals', authenticateToken, canApproveLargeLoans, async (req, res) => {
  try {
    console.log('⏳ GET /api/fund-loans/pending-approvals - Obteniendo pendientes');
    
    const pendingLoans = await prisma.fundLoan.findMany({
      where: { 
        status: 'PENDING',
        amount: { gte: 1000000 } // Solo préstamos que requieren aprobación del rector
      },
      include: {
        lenderFund: { select: { name: true, code: true, currentBalance: true } },
        borrowerFund: { select: { name: true, code: true, currentBalance: true } },
        requester: { select: { name: true, role: true, email: true } }
      },
      orderBy: { requestDate: 'asc' }
    });

    // Calcular información adicional
    const loansWithDetails = pendingLoans.map(loan => {
      const daysSinceRequest = Math.ceil((new Date() - new Date(loan.requestDate)) / (1000 * 60 * 60 * 24));
      const daysUntilDue = Math.ceil((new Date(loan.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      
      return {
        ...loan,
        daysSinceRequest,
        daysUntilDue,
        isUrgent: daysSinceRequest >= 3 || daysUntilDue <= 30
      };
    });

    console.log(`✅ Encontrados ${loansWithDetails.length} préstamos pendientes`);
    res.json({
      success: true,
      loans: loansWithDetails,
      total: loansWithDetails.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo pendientes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener préstamos pendientes',
      details: error.message 
    });
  }
});

// Aprobar préstamo
router.patch('/:id/approve', authenticateToken, canApproveLargeLoans, [
  body('observations').optional().isString()
], async (req, res) => {
  try {
    console.log('✅ PATCH /api/fund-loans/:id/approve - Aprobando préstamo');
    
    const loanId = req.params.id;
    const { observations } = req.body;

    const loan = await prisma.fundLoan.findUnique({
      where: { id: loanId },
      include: {
        lenderFund: true,
        borrowerFund: true
      }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Préstamo no encontrado'
      });
    }

    if (loan.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden aprobar préstamos pendientes'
      });
    }

    // Verificar saldo actual del fondo prestamista
    if (loan.lenderFund.currentBalance < loan.amount) {
      return res.status(400).json({
        success: false,
        error: `Saldo insuficiente en ${loan.lenderFund.name} para desembolsar el préstamo`
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Aprobar préstamo
      const approvedLoan = await tx.fundLoan.update({
        where: { id: loanId },
        data: {
          status: 'DISBURSED', // Aprobamos y desembolsamos directamente
          approvedBy: req.user.id,
          approvalDate: new Date(),
          observations: observations || loan.observations
        }
      });

      // Registrar transacción de salida (fondo prestamista)
      const outTransaction = await tx.fundTransaction.create({
        data: {
          fundId: loan.lenderFundId,
          type: 'LOAN_DISBURSED',
          amount: loan.amount,
          description: `Préstamo aprobado y otorgado a ${loan.borrowerFund.name}: ${loan.reason}`,
          userId: req.user.id,
          performedBy: req.user.id,
          fundLoanId: loan.id,
          balanceAfter: loan.lenderFund.currentBalance - loan.amount,
          isApproved: true
        }
      });

      // Registrar transacción de entrada (fondo receptor)
      const inTransaction = await tx.fundTransaction.create({
        data: {
          fundId: loan.borrowerFundId,
          type: 'LOAN_RECEIVED',
          amount: loan.amount,
          description: `Préstamo recibido de ${loan.lenderFund.name}: ${loan.reason}`,
          userId: req.user.id,
          performedBy: req.user.id,
          fundLoanId: loan.id,
          balanceAfter: loan.borrowerFund.currentBalance + loan.amount,
          isApproved: true
        }
      });

      // Actualizar saldos
      await Promise.all([
        tx.fund.update({
          where: { id: loan.lenderFundId },
          data: {
            currentBalance: { decrement: loan.amount },
            totalExpenses: { increment: loan.amount },
            balance: { decrement: loan.amount }
          }
        }),
        tx.fund.update({
          where: { id: loan.borrowerFundId },
          data: {
            currentBalance: { increment: loan.amount },
            totalIncome: { increment: loan.amount },
            balance: { increment: loan.amount }
          }
        })
      ]);

      return { approvedLoan, outTransaction, inTransaction };
    });

    console.log('✅ Préstamo aprobado y desembolsado exitosamente');
    res.json({
      success: true,
      loan: result.approvedLoan,
      message: 'Préstamo aprobado y desembolsado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error aprobando préstamo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al aprobar préstamo',
      details: error.message 
    });
  }
});

// Rechazar préstamo
router.patch('/:id/reject', authenticateToken, canApproveLargeLoans, [
  body('reason').notEmpty().withMessage('Razón de rechazo es requerida')
], async (req, res) => {
  try {
    console.log('❌ PATCH /api/fund-loans/:id/reject - Rechazando préstamo');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Errores de validación',
        details: errors.array()
      });
    }

    const loanId = req.params.id;
    const { reason } = req.body;

    const loan = await prisma.fundLoan.findUnique({
      where: { id: loanId }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Préstamo no encontrado'
      });
    }

    if (loan.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden rechazar préstamos pendientes'
      });
    }

    const rejectedLoan = await prisma.fundLoan.update({
      where: { id: loanId },
      data: {
        status: 'CANCELLED',
        approvedBy: req.user.id,
        approvalDate: new Date(),
        observations: `RECHAZADO: ${reason}`
      }
    });

    console.log('✅ Préstamo rechazado');
    res.json({
      success: true,
      loan: rejectedLoan,
      message: 'Préstamo rechazado'
    });

  } catch (error) {
    console.error('❌ Error rechazando préstamo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al rechazar préstamo',
      details: error.message 
    });
  }
});

// ==========================================
// GESTIÓN DE PAGOS
// ==========================================

// Registrar pago de préstamo
router.post('/:id/payments', authenticateToken, canManageAccounting, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    console.log('💳 POST /api/fund-loans/:id/payments - Registrando pago');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Errores de validación',
        details: errors.array()
      });
    }

    const loanId = req.params.id;
    const { amount, description } = req.body;

    const loan = await prisma.fundLoan.findUnique({
      where: { id: loanId },
      include: {
        lenderFund: true,
        borrowerFund: true
      }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Préstamo no encontrado'
      });
    }

    if (!['DISBURSED', 'REPAYING'].includes(loan.status)) {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden registrar pagos en préstamos desembolsados'
      });
    }

    if (amount > loan.pendingAmount) {
      return res.status(400).json({
        success: false,
        error: `El monto excede la deuda pendiente. Máximo: $${loan.pendingAmount.toLocaleString()}`
      });
    }

    if (loan.borrowerFund.currentBalance < amount) {
      return res.status(400).json({
        success: false,
        error: `Saldo insuficiente en ${loan.borrowerFund.name}`
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Actualizar préstamo
      const newTotalRepaid = loan.totalRepaid + amount;
      const newPendingAmount = loan.amount - newTotalRepaid;
      const isFullyRepaid = newPendingAmount <= 0;

      const updatedLoan = await tx.fundLoan.update({
        where: { id: loanId },
        data: {
          totalRepaid: newTotalRepaid,
          pendingAmount: Math.max(0, newPendingAmount),
          isFullyRepaid,
          status: isFullyRepaid ? 'FULLY_REPAID' : 'REPAYING'
        }
      });

      // Registrar transacción de salida (fondo que paga)
      const outTransaction = await tx.fundTransaction.create({
        data: {
          fundId: loan.borrowerFundId,
          type: 'LOAN_REPAYMENT',
          amount,
          description: description || `Pago de préstamo a ${loan.lenderFund.name}`,
          userId: req.user.id,
          performedBy: req.user.id,
          fundLoanId: loan.id,
          balanceAfter: loan.borrowerFund.currentBalance - amount,
          isApproved: true
        }
      });

      // Registrar transacción de entrada (fondo que recibe el pago)
      const inTransaction = await tx.fundTransaction.create({
        data: {
          fundId: loan.lenderFundId,
          type: 'INCOME',
          amount,
          description: description || `Pago recibido de préstamo de ${loan.borrowerFund.name}`,
          userId: req.user.id,
          performedBy: req.user.id,
          fundLoanId: loan.id,
          balanceAfter: loan.lenderFund.currentBalance + amount,
          isApproved: true
        }
      });

      // Actualizar saldos
      await Promise.all([
        tx.fund.update({
          where: { id: loan.borrowerFundId },
          data: {
            currentBalance: { decrement: amount },
            totalExpenses: { increment: amount },
            balance: { decrement: amount }
          }
        }),
        tx.fund.update({
          where: { id: loan.lenderFundId },
          data: {
            currentBalance: { increment: amount },
            totalIncome: { increment: amount },
            balance: { increment: amount }
          }
        })
      ]);

      return { updatedLoan, outTransaction, inTransaction };
    });

    const message = result.updatedLoan.isFullyRepaid 
      ? 'Pago registrado - Préstamo totalmente pagado'
      : 'Pago registrado exitosamente';

    console.log('✅ Pago de préstamo registrado');
    res.status(201).json({
      success: true,
      loan: result.updatedLoan,
      payment: result.outTransaction,
      message
    });

  } catch (error) {
    console.error('❌ Error registrando pago:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al registrar pago',
      details: error.message 
    });
  }
});

// Obtener historial de pagos de un préstamo
router.get('/:id/payments', authenticateToken, async (req, res) => {
  try {
    console.log('📋 GET /api/fund-loans/:id/payments - Historial de pagos');
    
    const loanId = req.params.id;

    const loan = await prisma.fundLoan.findUnique({
      where: { id: loanId },
      select: { id: true, amount: true, totalRepaid: true, pendingAmount: true }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Préstamo no encontrado'
      });
    }

    const payments = await prisma.fundTransaction.findMany({
      where: {
        fundLoanId: loanId,
        type: { in: ['LOAN_REPAYMENT', 'INCOME'] }
      },
      include: {
        user: { select: { name: true, role: true } },
        fund: { select: { name: true, code: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Separar pagos de salida (del fondo deudor) y entrada (al fondo prestamista)
    const outgoingPayments = payments.filter(p => p.type === 'LOAN_REPAYMENT');
    const incomingPayments = payments.filter(p => p.type === 'INCOME');

    // Calcular estadísticas de pagos
    const paymentStats = {
      totalPayments: outgoingPayments.length,
      totalPaid: loan.totalRepaid || 0,
      pendingAmount: loan.pendingAmount || 0,
      originalAmount: loan.amount,
      paymentProgress: loan.amount > 0 ? Math.round((loan.totalRepaid / loan.amount) * 100) : 0
    };

    console.log(`✅ Obtenidos ${payments.length} registros de pago`);
    res.json({
      success: true,
      payments: outgoingPayments, // Solo los pagos del deudor
      allTransactions: payments, // Todas las transacciones relacionadas
      paymentStats
    });

  } catch (error) {
    console.error('❌ Error obteniendo pagos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener historial de pagos',
      details: error.message 
    });
  }
});

// ==========================================
// CONSULTAS ESPECIALIZADAS
// ==========================================

// Obtener préstamos vencidos
router.get('/overdue/list', authenticateToken, async (req, res) => {
  try {
    console.log('⚠️ GET /api/fund-loans/overdue/list - Préstamos vencidos');
    
    const today = new Date();
    
    const overdueLoans = await prisma.fundLoan.findMany({
      where: {
        dueDate: { lt: today },
        status: { in: ['DISBURSED', 'REPAYING'] },
        isFullyRepaid: false
      },
      include: {
        lenderFund: { select: { name: true, code: true } },
        borrowerFund: { select: { name: true, code: true } },
        requester: { select: { name: true, role: true } }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Calcular días de retraso
    const loansWithDelay = overdueLoans.map(loan => {
      const dueDate = new Date(loan.dueDate);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      
      return {
        ...loan,
        daysOverdue,
        severityLevel: daysOverdue <= 7 ? 'LOW' : daysOverdue <= 30 ? 'MEDIUM' : 'HIGH'
      };
    });

    console.log(`✅ Encontrados ${loansWithDelay.length} préstamos vencidos`);
    res.json({
      success: true,
      loans: loansWithDelay,
      total: loansWithDelay.length,
      summary: {
        lowSeverity: loansWithDelay.filter(l => l.severityLevel === 'LOW').length,
        mediumSeverity: loansWithDelay.filter(l => l.severityLevel === 'MEDIUM').length,
        highSeverity: loansWithDelay.filter(l => l.severityLevel === 'HIGH').length
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo vencidos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener préstamos vencidos',
      details: error.message 
    });
  }
});

// Obtener estadísticas generales de préstamos
router.get('/statistics/general', authenticateToken, async (req, res) => {
  try {
    console.log('📊 GET /api/fund-loans/statistics/general - Estadísticas generales');
    
    const { fundId } = req.query;
    
    let whereClause = {};
    if (fundId) {
      whereClause = {
        OR: [
          { lenderFundId: fundId },
          { borrowerFundId: fundId }
        ]
      };
    }

    const [
      totalLoans,
      pendingLoans,
      activeLoans,
      completedLoans,
      cancelledLoans,
      totalAmountLent,
      totalAmountRepaid,
      overdueLoans
    ] = await Promise.all([
      prisma.fundLoan.count({ where: whereClause }),
      prisma.fundLoan.count({ where: { ...whereClause, status: 'PENDING' } }),
      prisma.fundLoan.count({ where: { ...whereClause, status: { in: ['DISBURSED', 'REPAYING'] } } }),
      prisma.fundLoan.count({ where: { ...whereClause, status: 'FULLY_REPAID' } }),
      prisma.fundLoan.count({ where: { ...whereClause, status: 'CANCELLED' } }),
      prisma.fundLoan.aggregate({
        where: { ...whereClause, status: { not: 'CANCELLED' } },
        _sum: { amount: true }
      }),
      prisma.fundLoan.aggregate({
        where: { ...whereClause, status: { not: 'CANCELLED' } },
        _sum: { totalRepaid: true }
      }),
      prisma.fundLoan.count({
        where: {
          ...whereClause,
          dueDate: { lt: new Date() },
          status: { in: ['DISBURSED', 'REPAYING'] },
          isFullyRepaid: false
        }
      })
    ]);

    const statistics = {
      overview: {
        totalLoans,
        pendingLoans,
        activeLoans,
        completedLoans,
        cancelledLoans,
        overdueLoans
      },
      financial: {
        totalAmountLent: totalAmountLent._sum.amount || 0,
        totalAmountRepaid: totalAmountRepaid._sum.totalRepaid || 0,
        pendingAmount: (totalAmountLent._sum.amount || 0) - (totalAmountRepaid._sum.totalRepaid || 0),
        repaymentRate: totalAmountLent._sum.amount > 0 
          ? Math.round(((totalAmountRepaid._sum.totalRepaid || 0) / totalAmountLent._sum.amount) * 100)
          : 0
      },
      health: {
        overduePercentage: activeLoans > 0 ? Math.round((overdueLoans / activeLoans) * 100) : 0,
        completionRate: totalLoans > 0 ? Math.round((completedLoans / totalLoans) * 100) : 0,
        cancellationRate: totalLoans > 0 ? Math.round((cancelledLoans / totalLoans) * 100) : 0
      }
    };

    console.log('✅ Estadísticas calculadas');
    res.json({
      success: true,
      statistics
    });

  } catch (error) {
    console.error('❌ Error calculando estadísticas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al calcular estadísticas',
      details: error.message 
    });
  }
});

// ==========================================
// GESTIÓN ADMINISTRATIVA
// ==========================================

// Cancelar préstamo pendiente
router.patch('/:id/cancel', authenticateToken, canManageAccounting, [
  body('reason').notEmpty().withMessage('Razón de cancelación es requerida')
], async (req, res) => {
  try {
    console.log('🚫 PATCH /api/fund-loans/:id/cancel - Cancelando préstamo');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Errores de validación',
        details: errors.array()
      });
    }

    const loanId = req.params.id;
    const { reason } = req.body;

    const loan = await prisma.fundLoan.findUnique({
      where: { id: loanId }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Préstamo no encontrado'
      });
    }

    // Solo se pueden cancelar préstamos pendientes o aprobados no desembolsados
    if (!['PENDING', 'APPROVED'].includes(loan.status)) {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden cancelar préstamos pendientes o aprobados no desembolsados'
      });
    }

    // Verificar permisos: solo el solicitante o admin/rector pueden cancelar
    if (loan.requestedBy !== req.user.id && !['RECTOR', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tiene permisos para cancelar este préstamo'
      });
    }

    const cancelledLoan = await prisma.fundLoan.update({
      where: { id: loanId },
      data: {
        status: 'CANCELLED',
        observations: `CANCELADO: ${reason}`,
        ...(loan.status === 'PENDING' ? {} : {
          approvedBy: req.user.id,
          approvalDate: new Date()
        })
      }
    });

    console.log('✅ Préstamo cancelado');
    res.json({
      success: true,
      loan: cancelledLoan,
      message: 'Préstamo cancelado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error cancelando préstamo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al cancelar préstamo',
      details: error.message 
    });
  }
});

// Actualizar observaciones del préstamo
router.patch('/:id/observations', authenticateToken, canManageAccounting, [
  body('observations').isString().withMessage('Las observaciones deben ser texto')
], async (req, res) => {
  try {
    console.log('📝 PATCH /api/fund-loans/:id/observations - Actualizando observaciones');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Errores de validación',
        details: errors.array()
      });
    }

    const loanId = req.params.id;
    const { observations } = req.body;

    const loan = await prisma.fundLoan.findUnique({
      where: { id: loanId }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Préstamo no encontrado'
      });
    }

    // Verificar permisos: solo el solicitante o admin/rector pueden editar
    if (loan.requestedBy !== req.user.id && !['RECTOR', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tiene permisos para editar este préstamo'
      });
    }

    const updatedLoan = await prisma.fundLoan.update({
      where: { id: loanId },
      data: { observations }
    });

    console.log('✅ Observaciones actualizadas');
    res.json({
      success: true,
      loan: updatedLoan,
      message: 'Observaciones actualizadas exitosamente'
    });

  } catch (error) {
    console.error('❌ Error actualizando observaciones:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al actualizar observaciones',
      details: error.message 
    });
  }
});

// Extender fecha de vencimiento
router.patch('/:id/extend-due-date', authenticateToken, canApproveLargeLoans, [
  body('newDueDate').isISO8601().withMessage('Nueva fecha de vencimiento inválida'),
  body('reason').notEmpty().withMessage('Razón de extensión es requerida')
], async (req, res) => {
  try {
    console.log('📅 PATCH /api/fund-loans/:id/extend-due-date - Extendiendo vencimiento');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Errores de validación',
        details: errors.array()
      });
    }

    const loanId = req.params.id;
    const { newDueDate, reason } = req.body;

    const loan = await prisma.fundLoan.findUnique({
      where: { id: loanId }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Préstamo no encontrado'
      });
    }

    if (!['DISBURSED', 'REPAYING'].includes(loan.status)) {
      return res.status(400).json({
        success: false,
        error: 'Solo se puede extender la fecha de préstamos activos'
      });
    }

    const parsedNewDueDate = new Date(newDueDate);
    const currentDueDate = new Date(loan.dueDate);

    if (parsedNewDueDate <= currentDueDate) {
      return res.status(400).json({
        success: false,
        error: 'La nueva fecha debe ser posterior a la fecha actual de vencimiento'
      });
    }

    // Máximo 6 meses de extensión
    const maxExtensionDate = new Date(currentDueDate);
    maxExtensionDate.setMonth(maxExtensionDate.getMonth() + 6);

    if (parsedNewDueDate > maxExtensionDate) {
      return res.status(400).json({
        success: false,
        error: 'La extensión no puede ser mayor a 6 meses'
      });
    }

    const updatedLoan = await prisma.fundLoan.update({
      where: { id: loanId },
      data: {
        dueDate: parsedNewDueDate,
        observations: `${loan.observations || ''}\n\nEXTENSIÓN: ${reason} - Nueva fecha: ${parsedNewDueDate.toLocaleDateString()} (Autorizada por: ${req.user.name})`
      }
    });

    console.log('✅ Fecha de vencimiento extendida');
    res.json({
      success: true,
      loan: updatedLoan,
      message: 'Fecha de vencimiento extendida exitosamente'
    });

  } catch (error) {
    console.error('❌ Error extendiendo fecha:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al extender fecha de vencimiento',
      details: error.message 
    });
  }
});

// ==========================================
// REPORTES Y EXPORTACIÓN
// ==========================================

// Exportar préstamos a CSV
router.get('/export/csv', authenticateToken, async (req, res) => {
  try {
    console.log('📤 GET /api/fund-loans/export/csv - Exportando a CSV');
    
    const { 
      status,
      lenderFundId,
      borrowerFundId,
      startDate,
      endDate
    } = req.query;

    let where = {};

    // Aplicar filtros
    if (status) {
      where.status = { in: status.split(',') };
    }

    if (lenderFundId) {
      where.lenderFundId = lenderFundId;
    }

    if (borrowerFundId) {
      where.borrowerFundId = borrowerFundId;
    }

    if (startDate || endDate) {
      where.requestDate = {};
      if (startDate) where.requestDate.gte = new Date(startDate);
      if (endDate) where.requestDate.lte = new Date(endDate);
    }

    const loans = await prisma.fundLoan.findMany({
      where,
      include: {
        lenderFund: { select: { name: true, code: true } },
        borrowerFund: { select: { name: true, code: true } },
        requester: { select: { name: true, role: true } },
        approver: { select: { name: true, role: true } }
      },
      orderBy: { requestDate: 'desc' }
    });

    // Generar CSV
    const csvHeaders = [
      'ID',
      'Fondo Prestamista',
      'Código Prestamista',
      'Fondo Receptor',
      'Código Receptor',
      'Monto Original',
      'Total Pagado',
      'Monto Pendiente',
      'Estado',
      'Fecha Solicitud',
      'Fecha Vencimiento',
      'Fecha Aprobación',
      'Solicitado Por',
      'Aprobado Por',
      'Razón',
      'Observaciones'
    ];

    const csvRows = loans.map(loan => [
      loan.id,
      loan.lenderFund.name,
      loan.lenderFund.code,
      loan.borrowerFund.name,
      loan.borrowerFund.code,
      loan.amount,
      loan.totalRepaid || 0,
      loan.pendingAmount || 0,
      loan.status,
      new Date(loan.requestDate).toLocaleDateString('es-CO'),
      new Date(loan.dueDate).toLocaleDateString('es-CO'),
      loan.approvalDate ? new Date(loan.approvalDate).toLocaleDateString('es-CO') : '',
      loan.requester.name,
      loan.approver?.name || '',
      `"${(loan.reason || '').replace(/"/g, '""')}"`,
      `"${(loan.observations || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="prestamos_fondos_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('\uFEFF' + csvContent); // BOM para UTF-8

    console.log(`✅ Exportados ${loans.length} préstamos a CSV`);

  } catch (error) {
    console.error('❌ Error exportando CSV:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al exportar datos',
      details: error.message 
    });
  }
});

// ==========================================
// NOTIFICACIONES Y ALERTAS
// ==========================================

// Obtener préstamos que requieren atención
router.get('/alerts/attention-required', authenticateToken, async (req, res) => {
  try {
    console.log('🚨 GET /api/fund-loans/alerts/attention-required - Alertas de préstamos');
    
    const today = new Date();
    const in7Days = new Date();
    in7Days.setDate(today.getDate() + 7);

    const [pendingApprovals, nearDue, overdue] = await Promise.all([
      // Préstamos pendientes de aprobación
      prisma.fundLoan.findMany({
        where: {
          status: 'PENDING',
          amount: { gte: 1000000 }
        },
        include: {
          lenderFund: { select: { name: true } },
          borrowerFund: { select: { name: true } },
          requester: { select: { name: true } }
        }
      }),
      
      // Préstamos próximos a vencer
      prisma.fundLoan.findMany({
        where: {
          status: { in: ['DISBURSED', 'REPAYING'] },
          dueDate: { gte: today, lte: in7Days },
          isFullyRepaid: false
        },
        include: {
          lenderFund: { select: { name: true } },
          borrowerFund: { select: { name: true } }
        }
      }),
      
      // Préstamos vencidos
      prisma.fundLoan.findMany({
        where: {
          status: { in: ['DISBURSED', 'REPAYING'] },
          dueDate: { lt: today },
          isFullyRepaid: false
        },
        include: {
          lenderFund: { select: { name: true } },
          borrowerFund: { select: { name: true } }
        }
      })
    ]);

    const alerts = {
      pendingApprovals: {
        count: pendingApprovals.length,
        items: pendingApprovals.map(loan => ({
          id: loan.id,
          amount: loan.amount,
          lenderFund: loan.lenderFund.name,
          borrowerFund: loan.borrowerFund.name,
          requester: loan.requester.name,
          daysPending: Math.ceil((today - new Date(loan.requestDate)) / (1000 * 60 * 60 * 24))
        }))
      },
      nearDue: {
        count: nearDue.length,
        items: nearDue.map(loan => ({
          id: loan.id,
          amount: loan.amount,
          pendingAmount: loan.pendingAmount,
          lenderFund: loan.lenderFund.name,
          borrowerFund: loan.borrowerFund.name,
          dueDate: loan.dueDate,
          daysUntilDue: Math.ceil((new Date(loan.dueDate) - today) / (1000 * 60 * 60 * 24))
        }))
      },
      overdue: {
        count: overdue.length,
        items: overdue.map(loan => ({
          id: loan.id,
          amount: loan.amount,
          pendingAmount: loan.pendingAmount,
          lenderFund: loan.lenderFund.name,
          borrowerFund: loan.borrowerFund.name,
          dueDate: loan.dueDate,
          daysOverdue: Math.ceil((today - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24))
        }))
      }
    };

    const totalAlerts = alerts.pendingApprovals.count + alerts.nearDue.count + alerts.overdue.count;

    console.log(`✅ Generadas ${totalAlerts} alertas`);
    res.json({
      success: true,
      alerts,
      summary: {
        totalAlerts,
        criticalCount: alerts.overdue.count,
        warningCount: alerts.nearDue.count,
        infoCount: alerts.pendingApprovals.count
      }
    });

  } catch (error) {
    console.error('❌ Error generando alertas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al generar alertas',
      details: error.message 
    });
  }
});

module.exports = router;