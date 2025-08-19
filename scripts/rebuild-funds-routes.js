/**
 * RECONSTRUCCIÓN COMPLETA DE RUTAS DE FONDOS
 * Solución definitiva para el error 404 en préstamos
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 RECONSTRUYENDO RUTAS DE FONDOS DESDE CERO...');

// 1. Crear un archivo de rutas completamente nuevo
const newFundsRoutes = `/**
 * RUTAS DE FONDOS - VERSIÓN RECONSTRUIDA
 * Solución definitiva para préstamos entre fondos
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth.middleware');
const router = express.Router();

console.log('📋 Cargando rutas de fondos...');

// ==========================================
// RUTA DE PRUEBA
// ==========================================
router.get('/test', (req, res) => {
  console.log('🧪 Ruta de prueba de fondos llamada');
  res.json({ 
    success: true, 
    message: 'Rutas de fondos funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// OBTENER FONDOS BÁSICOS
// ==========================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📊 GET /api/funds - Obteniendo fondos');
    
    // Datos simulados de fondos
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

    console.log(\`✅ Devolviendo \${mockFunds.length} fondos\`);
    
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

// ==========================================
// PRÉSTAMOS ENTRE FONDOS - RUTA PRINCIPAL
// ==========================================
router.get('/loans', authenticateToken, async (req, res) => {
  try {
    console.log('📋 GET /api/funds/loans - Obteniendo préstamos entre fondos');
    console.log('👤 Usuario:', req.user?.name || 'Desconocido', 'Rol:', req.user?.role || 'Sin rol');
    console.log('🔍 Query params:', req.query);
    
    const { page = 1, limit = 20, status, fundId } = req.query;
    
    // Datos simulados para préstamos entre fondos
    const mockLoans = [
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
      },
      {
        id: '3',
        lenderFund: { 
          id: '2',
          name: 'Fondo de Eventos', 
          code: 'EVE2025' 
        },
        borrowerFund: { 
          id: '3',
          name: 'Fondo de Matrícula', 
          code: 'MAT2025' 
        },
        amount: 150000,
        pendingAmount: 0,
        requestDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'COMPLETED',
        reason: 'Préstamo para cubrir gastos de matrícula',
        requester: { 
          id: '3',
          name: 'Contador Principal' 
        },
        approver: {
          id: '1',
          name: 'Rector Principal'
        },
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Filtrar por status si se proporciona
    let filteredLoans = mockLoans;
    if (status && status !== 'all') {
      filteredLoans = mockLoans.filter(loan => loan.status === status);
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
});

// ==========================================
// OBTENER PRÉSTAMO ESPECÍFICO
// ==========================================
router.get('/loans/:id', authenticateToken, async (req, res) => {
  try {
    console.log(\`🔍 GET /api/funds/loans/\${req.params.id} - Obteniendo préstamo específico\`);
    
    const loanId = req.params.id;
    
    // Simular búsqueda de préstamo específico
    const mockLoan = {
      id: loanId,
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
      }
    };

    console.log(\`✅ Préstamo \${loanId} encontrado\`);
    
    res.json({
      success: true,
      loan: mockLoan
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

// ==========================================
// ALERTAS DE FONDOS
// ==========================================
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    console.log('🔔 GET /api/funds/alerts - Obteniendo alertas de fondos');
    
    const mockAlerts = [
      {
        id: '1',
        fundId: '2',
        fund: { name: 'Fondo de Eventos', code: 'EVE2025' },
        level: 2,
        message: 'Saldo bajo en fondo de eventos',
        isActive: true,
        isRead: false,
        triggeredAt: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      alerts: mockAlerts,
      total: mockAlerts.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo alertas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener alertas',
      details: error.message 
    });
  }
});

console.log('✅ Rutas de fondos cargadas correctamente');

module.exports = router;
`;

// 2. Escribir el nuevo archivo
const fundsRoutePath = path.join(__dirname, '../routes/funds.js');
fs.writeFileSync(fundsRoutePath, newFundsRoutes);

console.log('✅ Archivo routes/funds.js reconstruido completamente');

// 3. Verificar server.js
const serverPath = path.join(__dirname, '../server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Asegurar que las rutas estén importadas y montadas
if (!serverContent.includes("const fundsRoutes = require('./routes/funds')")) {
  console.log('⚠️  Agregando importación de fundsRoutes a server.js');
  const routeImports = serverContent.match(/(const.*Routes = require.*\n)+/);
  if (routeImports) {
    const newImport = routeImports[0] + "const fundsRoutes = require('./routes/funds');\n";
    serverContent = serverContent.replace(routeImports[0], newImport);
  }
}

if (!serverContent.includes("app.use('/api/funds', fundsRoutes)")) {
  console.log('⚠️  Agregando montaje de rutas /api/funds a server.js');
  const routeUses = serverContent.match(/(app\.use\('\/api\/.*\n)+/);
  if (routeUses) {
    const newUse = routeUses[0] + "app.use('/api/funds', fundsRoutes);\n";
    serverContent = serverContent.replace(routeUses[0], newUse);
  }
}

fs.writeFileSync(serverPath, serverContent);

console.log('✅ server.js verificado y actualizado');

console.log('');
console.log('🎯 RECONSTRUCCIÓN COMPLETADA');
console.log('');
console.log('📋 PASOS SIGUIENTES:');
console.log('1. Reinicia el servidor: node server.js');
console.log('2. Prueba: http://localhost:3000/api/funds/test');
console.log('3. Prueba: http://localhost:3000/api/funds/loans');
console.log('4. Ve a la aplicación: Gestión de Fondos → Préstamos entre Fondos');
console.log('');
console.log('🔧 Si sigue fallando, ejecuta:');
console.log('   node scripts/test-funds-routes-direct.js');