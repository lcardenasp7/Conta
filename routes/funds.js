/**
 * RUTAS DE FONDOS - VERSIÓN CORREGIDA
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth.middleware');
const router = express.Router();

console.log('📋 Cargando rutas de fondos...');

// Sistema de almacenamiento temporal de préstamos
let loansStorage = [
  {
    id: '1',
    lenderFund: { 
      id: '1',
      name: 'Fondo Operacional', 
      code: 'OPE2025' 
    },
    borrowerFund: { 
      id: '2',
      name: 'Fondo de Eventos', 
      code: 'EVE2025' 
    },
    amount: 200000,
    pendingAmount: 200000,
    requestDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
    reason: 'Préstamo para evento escolar de fin de año',
    requester: { 
      id: '1',
      name: 'Usuario Test' 
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    lenderFund: { 
      id: '3',
      name: 'Fondo de Matrícula', 
      code: 'MAT2025' 
    },
    borrowerFund: { 
      id: '1',
      name: 'Fondo Operacional', 
      code: 'OPE2025' 
    },
    amount: 500000,
    pendingAmount: 300000,
    requestDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'APPROVED',
    reason: 'Préstamo para gastos operacionales urgentes',
    requester: { 
      id: '2',
      name: 'Admin Sistema' 
    },
    approver: {
      id: '1',
      name: 'Rector Principal'
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Funciones auxiliares
function getLoanById(id) {
  return loansStorage.find(loan => loan.id === id);
}

function updateLoan(id, updates) {
  const loanIndex = loansStorage.findIndex(loan => loan.id === id);
  if (loanIndex !== -1) {
    loansStorage[loanIndex] = {
      ...loansStorage[loanIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return loansStorage[loanIndex];
  }
  return null;
}

function addLoan(loanData) {
  const newLoan = {
    id: Date.now().toString(),
    ...loanData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  loansStorage.push(newLoan);
  return newLoan;
}

// Ruta de prueba
router.get('/test', (req, res) => {
  console.log('🧪 Ruta de prueba de fondos llamada');
  res.json({ 
    success: true, 
    message: 'Rutas de fondos funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Obtener fondos básicos
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📊 GET /api/funds - Obteniendo fondos');
    
    const mockFunds = [
      {
        id: '1',
        name: 'Fondo Operacional',
        code: 'OPE2025',
        type: 'OPERATIONAL',
        currentBalance: 1500000,
        isActive: true
      },
      {
        id: '2',
        name: 'Fondo de Eventos',
        code: 'EVE2025',
        type: 'EVENTS',
        currentBalance: 800000,
        isActive: true
      },
      {
        id: '3',
        name: 'Fondo de Matrícula',
        code: 'MAT2025',
        type: 'TUITION',
        currentBalance: 2000000,
        isActive: true
      }
    ];

    console.log(`✅ Devolviendo ${mockFunds.length} fondos`);
    
    res.json({
      success: true,
      funds: mockFunds,
      total: mockFunds.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo fondos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener fondos',
      details: error.message 
    });
  }
});

// Obtener préstamos entre fondos
router.get('/loans', authenticateToken, async (req, res) => {
  try {
    console.log('📋 GET /api/funds/loans - Obteniendo préstamos entre fondos');
    
    const { page = 1, limit = 20, status, fundId } = req.query;
    
    let filteredLoans = [...loansStorage];
    
    if (status && status !== 'all') {
      filteredLoans = filteredLoans.filter(loan => loan.status === status);
    }

    if (fundId) {
      filteredLoans = filteredLoans.filter(loan => 
        loan.lenderFund.id === fundId || loan.borrowerFund.id === fundId
      );
    }

    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedLoans = filteredLoans.slice(startIndex, endIndex);

    console.log(`✅ Devolviendo ${paginatedLoans.length} préstamos`);

    res.json({
      success: true,
      loans: paginatedLoans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredLoans.length,
        pages: Math.ceil(filteredLoans.length / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo préstamos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener préstamos entre fondos',
      details: error.message
    });
  }
});

// Obtener detalles de préstamo específico
router.get('/loans/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`🔍 GET /api/funds/loans/${req.params.id} - Obteniendo detalles`);
    
    const loan = getLoanById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Préstamo no encontrado'
      });
    }
    
    res.json({
      success: true,
      loan: loan
    });

  } catch (error) {
    console.error('❌ Error obteniendo detalles:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener detalles del préstamo',
      details: error.message 
    });
  }
});

// Crear nuevo préstamo
router.post('/loans', authenticateToken, async (req, res) => {
  try {
    console.log('➕ POST /api/funds/loans - Creando préstamo');
    
    const { lenderFundId, borrowerFundId, amount, reason, dueDate } = req.body;
    
    if (!lenderFundId || !borrowerFundId || !amount || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }
    
    const newLoan = addLoan({
      lenderFund: { 
        id: lenderFundId,
        name: 'Fondo Prestamista',
        code: 'FP001'
      },
      borrowerFund: { 
        id: borrowerFundId,
        name: 'Fondo Receptor',
        code: 'FR001'
      },
      amount: parseFloat(amount),
      pendingAmount: parseFloat(amount),
      requestDate: new Date().toISOString(),
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING',
      reason,
      requester: {
        id: req.user.id,
        name: req.user.name
      }
    });
    
    res.status(201).json({
      success: true,
      loan: newLoan,
      message: 'Préstamo creado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error creando préstamo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al crear préstamo',
      details: error.message 
    });
  }
});

// Aprobar préstamo
router.post('/loans/:id/approve', authenticateToken, async (req, res) => {
  try {
    console.log(`✅ Aprobando préstamo: ${req.params.id}`);
    
    const updatedLoan = updateLoan(req.params.id, {
      status: 'APPROVED',
      approver: {
        id: req.user.id,
        name: req.user.name
      },
      approvedAt: new Date().toISOString(),
      approvalNotes: req.body.approvalNotes || 'Préstamo aprobado'
    });
    
    if (!updatedLoan) {
      return res.status(404).json({
        success: false,
        error: 'Préstamo no encontrado'
      });
    }
    
    res.json({
      success: true,
      loan: updatedLoan,
      message: 'Préstamo aprobado exitosamente'
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
router.post('/loans/:id/reject', authenticateToken, async (req, res) => {
  try {
    console.log(`❌ Rechazando préstamo: ${req.params.id}`);
    
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        error: 'La razón del rechazo es requerida'
      });
    }
    
    const updatedLoan = updateLoan(req.params.id, {
      status: 'REJECTED',
      rejectedBy: {
        id: req.user.id,
        name: req.user.name
      },
      rejectedAt: new Date().toISOString(),
      rejectionReason
    });
    
    if (!updatedLoan) {
      return res.status(404).json({
        success: false,
        error: 'Préstamo no encontrado'
      });
    }
    
    res.json({
      success: true,
      loan: updatedLoan,
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

// Desembolsar préstamo
router.post('/loans/:id/disburse', authenticateToken, async (req, res) => {
  try {
    console.log(`💰 Desembolsando préstamo: ${req.params.id}`);
    
    const updatedLoan = updateLoan(req.params.id, {
      status: 'DISBURSED',
      disbursedBy: {
        id: req.user.id,
        name: req.user.name
      },
      disbursedAt: new Date().toISOString(),
      disbursementNotes: req.body.disbursementNotes || 'Préstamo desembolsado'
    });
    
    if (!updatedLoan) {
      return res.status(404).json({
        success: false,
        error: 'Préstamo no encontrado'
      });
    }
    
    res.json({
      success: true,
      loan: updatedLoan,
      message: 'Préstamo desembolsado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error desembolsando préstamo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al desembolsar préstamo',
      details: error.message 
    });
  }
});

// Validar transferencia
router.post('/validate-transfer', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Validando transferencia');
    
    const { sourceFundId, targetFundId, amount } = req.body;
    
    if (!sourceFundId || !targetFundId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }
    
    res.json({
      success: true,
      isValid: true,
      sourceFund: { id: sourceFundId, name: 'Fondo Origen', currentBalance: 1000000 },
      targetFund: { id: targetFundId, name: 'Fondo Destino' },
      amount: parseFloat(amount),
      requiresApproval: amount >= 500000,
      shortfall: 0
    });

  } catch (error) {
    console.error('❌ Error validando transferencia:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al validar transferencia',
      details: error.message 
    });
  }
});

console.log('✅ Rutas de fondos cargadas correctamente');

module.exports = router;
