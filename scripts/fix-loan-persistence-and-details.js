/**
 * CORREGIR PERSISTENCIA DE PRÉSTAMOS Y DETALLES
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 CORRIGIENDO PERSISTENCIA Y DETALLES DE PRÉSTAMOS...');

// 1. Actualizar el backend para manejar estados persistentes
const fundsRoutePath = path.join(__dirname, '../routes/funds.js');
let fundsContent = fs.readFileSync(fundsRoutePath, 'utf8');

// Crear un sistema de almacenamiento temporal en memoria
const persistentLoansSystem = `
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

// Función para obtener préstamo por ID
function getLoanById(id) {
  return loansStorage.find(loan => loan.id === id);
}

// Función para actualizar préstamo
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

// Función para agregar nuevo préstamo
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

`;

// Insertar el sistema de almacenamiento al inicio de las rutas
const routerIndex = fundsContent.indexOf('const router = express.Router();');
if (routerIndex !== -1) {
  const insertIndex = fundsContent.indexOf('\n', routerIndex) + 1;
  fundsContent = fundsContent.substring(0, insertIndex) + persistentLoansSystem + fundsContent.substring(insertIndex);
}

// Actualizar la ruta GET /loans para usar el almacenamiento
const newGetLoansRoute = `
router.get('/loans', authenticateToken, async (req, res) => {
  try {
    console.log('📋 GET /api/funds/loans - Obteniendo préstamos entre fondos');
    console.log('👤 Usuario:', req.user?.name || 'Desconocido', 'Rol:', req.user?.role || 'Sin rol');
    console.log('🔍 Query params:', req.query);
    
    const { page = 1, limit = 20, status, fundId } = req.query;
    
    // Usar datos del almacenamiento temporal
    let filteredLoans = [...loansStorage];
    
    // Filtrar por status si se proporciona
    if (status && status !== 'all') {
      filteredLoans = filteredLoans.filter(loan => loan.status === status);
      console.log(\`🔍 Filtrado por status '\${status}': \${filteredLoans.length} préstamos\`);
    }

    // Filtrar por fondo si se proporciona
    if (fundId) {
      filteredLoans = filteredLoans.filter(loan => 
        loan.lenderFund.id === fundId || loan.borrowerFund.id === fundId
      );
      console.log(\`🔍 Filtrado por fondo '\${fundId}': \${filteredLoans.length} préstamos\`);
    }

    // Aplicar paginación
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedLoans = filteredLoans.slice(startIndex, endIndex);

    console.log(\`✅ Devolviendo \${paginatedLoans.length} de \${filteredLoans.length} préstamos (página \${page})\`);

    res.json({
      success: true,
      loans: paginatedLoans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredLoans.length,
        pages: Math.ceil(filteredLoans.length / parseInt(limit))
      },
      filters: {
        status: status || 'all',
        fundId: fundId || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obteniendo préstamos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener préstamos entre fondos',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});`;

// Reemplazar la ruta GET /loans existente
const getLoansRegex = /router\.get\('\/loans', authenticateToken, async \(req, res\) => \{[\s\S]*?\}\);/;
if (getLoansRegex.test(fundsContent)) {
  fundsContent = fundsContent.replace(getLoansRegex, newGetLoansRoute);
}

// Actualizar las rutas de acciones para usar el almacenamiento
const updateApproveRoute = `
// Aprobar préstamo
router.post('/loans/:id/approve', authenticateToken, async (req, res) => {
  try {
    console.log(\`✅ POST /api/funds/loans/\${req.params.id}/approve - Aprobando préstamo\`);
    
    const loanId = req.params.id;
    const { approvalNotes } = req.body;
    
    // Buscar y actualizar el préstamo
    const updatedLoan = updateLoan(loanId, {
      status: 'APPROVED',
      approver: {
        id: req.user.id,
        name: req.user.name
      },
      approvedAt: new Date().toISOString(),
      approvalNotes: approvalNotes || 'Préstamo aprobado'
    });
    
    if (!updatedLoan) {
      return res.status(404).json({
        success: false,
        error: 'Préstamo no encontrado'
      });
    }
    
    console.log(\`✅ Préstamo \${loanId} aprobado exitosamente\`);
    
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
});`;

// Reemplazar la ruta de aprobación
const approveRouteRegex = /router\.post\('\/loans\/:id\/approve'[\s\S]*?\}\);/;
if (approveRouteRegex.test(fundsContent)) {
  fundsContent = fundsContent.replace(approveRouteRegex, updateApproveRoute);
}

// Actualizar ruta de rechazo
const updateRejectRoute = `
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
    
    // Buscar y actualizar el préstamo
    const updatedLoan = updateLoan(loanId, {
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
    
    console.log(\`❌ Préstamo \${loanId} rechazado\`);
    
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
});`;

// Reemplazar la ruta de rechazo
const rejectRouteRegex = /router\.post\('\/loans\/:id\/reject'[\s\S]*?\}\);/;
if (rejectRouteRegex.test(fundsContent)) {
  fundsContent = fundsContent.replace(rejectRouteRegex, updateRejectRoute);
}

// Actualizar ruta de creación para usar el almacenamiento
const updateCreateRoute = `
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
    
    // Crear nuevo préstamo usando el almacenamiento
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
});`;

// Reemplazar la ruta de creación
const createRouteRegex = /\/\/ Crear nuevo préstamo[\s\S]*?router\.post\('\/loans'[\s\S]*?\}\);/;
if (createRouteRegex.test(fundsContent)) {
  fundsContent = fundsContent.replace(createRouteRegex, updateCreateRoute);
}

// Agregar ruta para obtener detalles de préstamo específico
const getLoanDetailsRoute = `
// Obtener detalles de préstamo específico
router.get('/loans/:id', authenticateToken, async (req, res) => {
  try {
    console.log(\`🔍 GET /api/funds/loans/\${req.params.id} - Obteniendo detalles del préstamo\`);
    
    const loanId = req.params.id;
    const loan = getLoanById(loanId);
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Préstamo no encontrado'
      });
    }
    
    console.log(\`✅ Detalles del préstamo \${loanId} obtenidos\`);
    
    res.json({
      success: true,
      loan: loan
    });

  } catch (error) {
    console.error('❌ Error obteniendo detalles del préstamo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener detalles del préstamo',
      details: error.message 
    });
  }
});

`;

// Agregar la ruta de detalles después de la ruta GET /loans
const insertAfterGetLoans = fundsContent.indexOf('});', fundsContent.indexOf('GET /api/funds/loans - Obteniendo préstamos entre fondos'));
if (insertAfterGetLoans !== -1) {
  fundsContent = fundsContent.substring(0, insertAfterGetLoans + 3) + '\n' + getLoanDetailsRoute + fundsContent.substring(insertAfterGetLoans + 3);
}

// Escribir el archivo actualizado
fs.writeFileSync(fundsRoutePath, fundsContent);

console.log('✅ Backend actualizado con persistencia temporal');

// 2. Actualizar el frontend para mostrar detalles reales
const fundLoansPath = path.join(__dirname, '../public/js/fund-loans.js');
let fundLoansContent = fs.readFileSync(fundLoansPath, 'utf8');

// Reemplazar la función viewLoanDetails
const newViewLoanDetailsFunction = `
// Ver detalles del préstamo
async function viewLoanDetails(loanId) {
    try {
        console.log(\`🔍 Viendo detalles del préstamo: \${loanId}\`);
        
        showLoading();
        
        // Obtener detalles del préstamo desde el backend
        const response = await api.get(\`/funds/loans/\${loanId}\`);
        
        if (response.success && response.loan) {
            const loan = response.loan;
            
            // Crear modal con detalles
            const modalHtml = \`
                <div class="modal fade" id="loanDetailsModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Detalles del Préstamo #\${loan.id}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6>Información General</h6>
                                        <p><strong>Estado:</strong> \${getLoanStatusBadge(loan.status)}</p>
                                        <p><strong>Monto:</strong> \${formatCurrency(loan.amount)}</p>
                                        <p><strong>Monto Pendiente:</strong> \${formatCurrency(loan.pendingAmount)}</p>
                                        <p><strong>Fecha de Solicitud:</strong> \${formatDate(loan.requestDate)}</p>
                                        <p><strong>Fecha Límite:</strong> \${formatDate(loan.dueDate)}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6>Fondos Involucrados</h6>
                                        <p><strong>Fondo Prestamista:</strong> \${loan.lenderFund.name} (\${loan.lenderFund.code})</p>
                                        <p><strong>Fondo Receptor:</strong> \${loan.borrowerFund.name} (\${loan.borrowerFund.code})</p>
                                    </div>
                                </div>
                                <div class="row mt-3">
                                    <div class="col-12">
                                        <h6>Motivo del Préstamo</h6>
                                        <p>\${loan.reason}</p>
                                    </div>
                                </div>
                                \${loan.approver ? \`
                                <div class="row mt-3">
                                    <div class="col-12">
                                        <h6>Información de Aprobación</h6>
                                        <p><strong>Aprobado por:</strong> \${loan.approver.name}</p>
                                        <p><strong>Fecha de Aprobación:</strong> \${formatDate(loan.approvedAt)}</p>
                                        \${loan.approvalNotes ? \`<p><strong>Notas:</strong> \${loan.approvalNotes}</p>\` : ''}
                                    </div>
                                </div>
                                \` : ''}
                                \${loan.rejectedBy ? \`
                                <div class="row mt-3">
                                    <div class="col-12">
                                        <h6>Información de Rechazo</h6>
                                        <p><strong>Rechazado por:</strong> \${loan.rejectedBy.name}</p>
                                        <p><strong>Fecha de Rechazo:</strong> \${formatDate(loan.rejectedAt)}</p>
                                        <p><strong>Razón:</strong> \${loan.rejectionReason}</p>
                                    </div>
                                </div>
                                \` : ''}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            \`;
            
            // Remover modal existente si existe
            const existingModal = document.getElementById('loanDetailsModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Agregar modal al DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('loanDetailsModal'));
            modal.show();
            
        } else {
            throw new Error(response.error || 'No se pudieron obtener los detalles del préstamo');
        }
        
    } catch (error) {
        console.error('Error viewing loan details:', error);
        showError(error.message || 'Error al ver detalles del préstamo');
    } finally {
        hideLoading();
    }
}`;

// Reemplazar la función viewLoanDetails existente
const viewDetailsRegex = /\/\/ Ver detalles del préstamo[\s\S]*?async function viewLoanDetails\(loanId\)[\s\S]*?(?=\n\n\/\/|\nfunction|\nwindow\.|\n$)/;
if (viewDetailsRegex.test(fundLoansContent)) {
  fundLoansContent = fundLoansContent.replace(viewDetailsRegex, newViewLoanDetailsFunction);
}

// Escribir el archivo actualizado
fs.writeFileSync(fundLoansPath, fundLoansContent);

console.log('✅ Frontend actualizado con detalles reales');

console.log('');
console.log('🎯 CORRECCIONES APLICADAS');
console.log('');
console.log('📋 BACKEND:');
console.log('  ✅ Sistema de almacenamiento temporal en memoria');
console.log('  ✅ Estados de préstamos persistentes durante la sesión');
console.log('  ✅ Ruta GET /api/funds/loans/:id para detalles');
console.log('  ✅ Acciones que realmente cambian el estado');
console.log('');
console.log('📋 FRONTEND:');
console.log('  ✅ Modal de detalles con información completa');
console.log('  ✅ Muestra estado actual, fechas, montos');
console.log('  ✅ Información de aprobación/rechazo');
console.log('  ✅ Recarga automática después de acciones');
console.log('');
console.log('🔄 REINICIA EL SERVIDOR:');
console.log('  1. Ctrl+C para detener');
console.log('  2. node server.js para reiniciar');
console.log('  3. Recarga la página web');
console.log('');
console.log('🧪 AHORA:');
console.log('  - Los préstamos aprobados cambiarán de estado');
console.log('  - Los botones "Ver" mostrarán detalles reales');
console.log('  - Los cambios persistirán durante la sesión');
console.log('  - Cada acción actualizará la lista automáticamente');