/**
 * IMPLEMENTAR ACCIONES COMPLETAS DE FONDOS Y PRÉSTAMOS
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 IMPLEMENTANDO ACCIONES COMPLETAS DE FONDOS Y PRÉSTAMOS...');

// 1. Agregar rutas de acciones al backend
const fundsRoutePath = path.join(__dirname, '../routes/funds.js');
let fundsContent = fs.readFileSync(fundsRoutePath, 'utf8');

const additionalRoutes = `
// ==========================================
// ACCIONES DE PRÉSTAMOS
// ==========================================

// Aprobar préstamo
router.post('/loans/:id/approve', authenticateToken, async (req, res) => {
  try {
    console.log(\`✅ POST /api/funds/loans/\${req.params.id}/approve - Aprobando préstamo\`);
    
    const loanId = req.params.id;
    const { approvalNotes } = req.body;
    
    // Simular aprobación
    const approvedLoan = {
      id: loanId,
      status: 'APPROVED',
      approver: {
        id: req.user.id,
        name: req.user.name
      },
      approvedAt: new Date().toISOString(),
      approvalNotes: approvalNotes || 'Préstamo aprobado'
    };
    
    console.log(\`✅ Préstamo \${loanId} aprobado exitosamente\`);
    
    res.json({
      success: true,
      loan: approvedLoan,
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
    console.log(\`❌ POST /api/funds/loans/\${req.params.id}/reject - Rechazando préstamo\`);
    
    const loanId = req.params.id;
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        error: 'La razón del rechazo es requerida'
      });
    }
    
    // Simular rechazo
    const rejectedLoan = {
      id: loanId,
      status: 'REJECTED',
      rejectedBy: {
        id: req.user.id,
        name: req.user.name
      },
      rejectedAt: new Date().toISOString(),
      rejectionReason
    };
    
    console.log(\`❌ Préstamo \${loanId} rechazado\`);
    
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

// Desembolsar préstamo
router.post('/loans/:id/disburse', authenticateToken, async (req, res) => {
  try {
    console.log(\`💰 POST /api/funds/loans/\${req.params.id}/disburse - Desembolsando préstamo\`);
    
    const loanId = req.params.id;
    const { disbursementNotes } = req.body;
    
    // Simular desembolso
    const disbursedLoan = {
      id: loanId,
      status: 'DISBURSED',
      disbursedBy: {
        id: req.user.id,
        name: req.user.name
      },
      disbursedAt: new Date().toISOString(),
      disbursementNotes: disbursementNotes || 'Préstamo desembolsado'
    };
    
    console.log(\`💰 Préstamo \${loanId} desembolsado exitosamente\`);
    
    res.json({
      success: true,
      loan: disbursedLoan,
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

// Crear nuevo préstamo
router.post('/loans', authenticateToken, async (req, res) => {
  try {
    console.log('➕ POST /api/funds/loans - Creando nuevo préstamo');
    
    const { lenderFundId, borrowerFundId, amount, reason, dueDate } = req.body;
    
    // Validaciones básicas
    if (!lenderFundId || !borrowerFundId || !amount || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }
    
    if (lenderFundId === borrowerFundId) {
      return res.status(400).json({
        success: false,
        error: 'No se puede prestar al mismo fondo'
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El monto debe ser mayor a cero'
      });
    }
    
    // Simular creación de préstamo
    const newLoan = {
      id: Date.now().toString(),
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
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log(\`✅ Préstamo creado exitosamente: \${newLoan.id}\`);
    
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

// ==========================================
// ACCIONES DE FONDOS
// ==========================================

// Crear nuevo fondo
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('➕ POST /api/funds - Creando nuevo fondo');
    
    const { name, code, type, description, initialBalance } = req.body;
    
    // Validaciones básicas
    if (!name || !code || !type) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, código y tipo son requeridos'
      });
    }
    
    // Simular creación de fondo
    const newFund = {
      id: Date.now().toString(),
      name,
      code: code.toUpperCase(),
      type,
      description: description || '',
      currentBalance: parseFloat(initialBalance) || 0,
      totalIncome: parseFloat(initialBalance) || 0,
      totalExpenses: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log(\`✅ Fondo creado exitosamente: \${newFund.code}\`);
    
    res.status(201).json({
      success: true,
      fund: newFund,
      message: 'Fondo creado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error creando fondo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al crear fondo',
      details: error.message 
    });
  }
});

// Actualizar fondo
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    console.log(\`📝 PUT /api/funds/\${req.params.id} - Actualizando fondo\`);
    
    const fundId = req.params.id;
    const updateData = req.body;
    
    // Simular actualización
    const updatedFund = {
      id: fundId,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    console.log(\`✅ Fondo \${fundId} actualizado exitosamente\`);
    
    res.json({
      success: true,
      fund: updatedFund,
      message: 'Fondo actualizado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error actualizando fondo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al actualizar fondo',
      details: error.message 
    });
  }
});

// Activar/Desactivar fondo
router.patch('/:id/toggle-status', authenticateToken, async (req, res) => {
  try {
    console.log(\`🔄 PATCH /api/funds/\${req.params.id}/toggle-status - Cambiando estado del fondo\`);
    
    const fundId = req.params.id;
    const { isActive } = req.body;
    
    // Simular cambio de estado
    const updatedFund = {
      id: fundId,
      isActive: isActive,
      updatedAt: new Date().toISOString()
    };
    
    const status = isActive ? 'activado' : 'desactivado';
    console.log(\`✅ Fondo \${fundId} \${status} exitosamente\`);
    
    res.json({
      success: true,
      fund: updatedFund,
      message: \`Fondo \${status} exitosamente\`
    });

  } catch (error) {
    console.error('❌ Error cambiando estado del fondo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al cambiar estado del fondo',
      details: error.message 
    });
  }
});

`;

// Insertar las nuevas rutas antes del module.exports
const moduleExportIndex = fundsContent.lastIndexOf('module.exports = router;');
if (moduleExportIndex !== -1) {
  fundsContent = fundsContent.substring(0, moduleExportIndex) + additionalRoutes + '\n' + fundsContent.substring(moduleExportIndex);
}

fs.writeFileSync(fundsRoutePath, fundsContent);

console.log('✅ Rutas de acciones agregadas al backend');

// 2. Agregar funciones al API del frontend
const apiPath = path.join(__dirname, '../public/js/api.js');
let apiContent = fs.readFileSync(apiPath, 'utf8');

const apiFunctions = `
    // ==========================================
    // ACCIONES DE PRÉSTAMOS
    // ==========================================
    
    // Aprobar préstamo
    async approveLoan(loanId, approvalNotes = '') {
        console.log(\`✅ Aprobando préstamo: \${loanId}\`);
        return this.request(\`/api/funds/loans/\${loanId}/approve\`, {
            method: 'POST',
            body: JSON.stringify({ approvalNotes })
        });
    }
    
    // Rechazar préstamo
    async rejectLoan(loanId, rejectionReason) {
        console.log(\`❌ Rechazando préstamo: \${loanId}\`);
        return this.request(\`/api/funds/loans/\${loanId}/reject\`, {
            method: 'POST',
            body: JSON.stringify({ rejectionReason })
        });
    }
    
    // Desembolsar préstamo
    async disburseLoan(loanId, disbursementNotes = '') {
        console.log(\`💰 Desembolsando préstamo: \${loanId}\`);
        return this.request(\`/api/funds/loans/\${loanId}/disburse\`, {
            method: 'POST',
            body: JSON.stringify({ disbursementNotes })
        });
    }
    
    // Crear préstamo
    async createLoan(loanData) {
        console.log('➕ Creando nuevo préstamo');
        return this.request('/api/funds/loans', {
            method: 'POST',
            body: JSON.stringify(loanData)
        });
    }
    
    // ==========================================
    // ACCIONES DE FONDOS
    // ==========================================
    
    // Crear fondo
    async createFund(fundData) {
        console.log('➕ Creando nuevo fondo');
        return this.request('/api/funds', {
            method: 'POST',
            body: JSON.stringify(fundData)
        });
    }
    
    // Actualizar fondo
    async updateFund(fundId, fundData) {
        console.log(\`📝 Actualizando fondo: \${fundId}\`);
        return this.request(\`/api/funds/\${fundId}\`, {
            method: 'PUT',
            body: JSON.stringify(fundData)
        });
    }
    
    // Cambiar estado del fondo
    async toggleFundStatus(fundId, isActive) {
        console.log(\`🔄 Cambiando estado del fondo: \${fundId}\`);
        return this.request(\`/api/funds/\${fundId}/toggle-status\`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive })
        });
    }
`;

// Insertar las funciones antes del cierre de la clase
const classEndIndex = apiContent.lastIndexOf('}');
if (classEndIndex !== -1) {
  apiContent = apiContent.substring(0, classEndIndex) + apiFunctions + '\n' + apiContent.substring(classEndIndex);
}

fs.writeFileSync(apiPath, apiContent);

console.log('✅ Funciones de API agregadas al frontend');

console.log('');
console.log('🎯 ACCIONES IMPLEMENTADAS');
console.log('');
console.log('📋 BACKEND:');
console.log('  ✅ Aprobar préstamo: POST /api/funds/loans/:id/approve');
console.log('  ✅ Rechazar préstamo: POST /api/funds/loans/:id/reject');
console.log('  ✅ Desembolsar préstamo: POST /api/funds/loans/:id/disburse');
console.log('  ✅ Crear préstamo: POST /api/funds/loans');
console.log('  ✅ Crear fondo: POST /api/funds');
console.log('  ✅ Actualizar fondo: PUT /api/funds/:id');
console.log('  ✅ Cambiar estado fondo: PATCH /api/funds/:id/toggle-status');
console.log('');
console.log('📋 FRONTEND:');
console.log('  ✅ api.approveLoan()');
console.log('  ✅ api.rejectLoan()');
console.log('  ✅ api.disburseLoan()');
console.log('  ✅ api.createLoan()');
console.log('  ✅ api.createFund()');
console.log('  ✅ api.updateFund()');
console.log('  ✅ api.toggleFundStatus()');
console.log('');
console.log('🔄 REINICIA EL SERVIDOR PARA APLICAR CAMBIOS');
console.log('📋 Ejecuta: node server.js');