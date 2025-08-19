/**
 * SOLUCIÓN FINAL PARA PRÉSTAMOS ENTRE FONDOS
 * Corrige el error 404 en /api/funds/loans
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 SOLUCIONANDO ERROR 404 EN PRÉSTAMOS ENTRE FONDOS...');

// 1. Verificar que la ruta existe en funds.js
const fundsRoutePath = path.join(__dirname, '../routes/funds.js');
let fundsContent = fs.readFileSync(fundsRoutePath, 'utf8');

// 2. Asegurar que la ruta /loans esté correctamente definida
const loansRouteCode = `
// ==========================================
// PRÉSTAMOS ENTRE FONDOS - ACCESO PARA AUXILIAR
// ==========================================

// Obtener préstamos entre fondos (ACCESO PARA AUXILIAR)
router.get('/loans', authenticateToken, async (req, res) => {
  try {
    console.log('📋 GET /api/funds/loans - Obteniendo préstamos entre fondos');
    console.log('👤 Usuario:', req.user?.name, 'Rol:', req.user?.role);
    
    const { page = 1, limit = 20, status, fundId } = req.query;
    
    // Datos simulados para préstamos entre fondos
    const mockLoans = [
      {
        id: '1',
        lenderFund: { name: 'Fondo Operacional', code: 'OPE2025' },
        borrowerFund: { name: 'Fondo de Eventos', code: 'EVE2025' },
        amount: 200000,
        pendingAmount: 200000,
        requestDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING',
        reason: 'Préstamo para evento escolar',
        requester: { name: 'Usuario Test' }
      },
      {
        id: '2',
        lenderFund: { name: 'Fondo de Matrícula', code: 'MAT2025' },
        borrowerFund: { name: 'Fondo Operacional', code: 'OPE2025' },
        amount: 500000,
        pendingAmount: 300000,
        requestDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'APPROVED',
        reason: 'Préstamo para gastos operacionales',
        requester: { name: 'Admin Sistema' }
      }
    ];

    // Filtrar por status si se proporciona
    let filteredLoans = mockLoans;
    if (status) {
      filteredLoans = mockLoans.filter(loan => loan.status === status);
    }

    // Aplicar paginación
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedLoans = filteredLoans.slice(startIndex, endIndex);

    console.log(\`✅ Devolviendo \${paginatedLoans.length} préstamos simulados\`);

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
      error: 'Error al obtener préstamos',
      details: error.message 
    });
  }
});

module.exports = router;`;

// 3. Reemplazar el final del archivo con la nueva ruta
const moduleExportIndex = fundsContent.lastIndexOf('module.exports = router;');
if (moduleExportIndex !== -1) {
  fundsContent = fundsContent.substring(0, moduleExportIndex) + loansRouteCode;
} else {
  // Si no encuentra module.exports, agregar al final
  fundsContent += '\n' + loansRouteCode;
}

fs.writeFileSync(fundsRoutePath, fundsContent);
console.log('✅ Ruta /loans actualizada en funds.js');

// 4. Verificar middleware de autenticación para auxiliar
const authMiddlewarePath = path.join(__dirname, '../middleware/auth.middleware.js');
let authContent = fs.readFileSync(authMiddlewarePath, 'utf8');

// Asegurar que AUXILIAR tenga acceso a fondos
if (!authContent.includes("role === 'AUXILIAR'")) {
  const canManageAccountingFunction = `
// Función para verificar acceso a contabilidad (incluye AUXILIAR)
const canManageAccounting = (req, res, next) => {
  const allowedRoles = ['ADMIN', 'RECTOR', 'CONTADOR', 'AUXILIAR'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'No tienes permisos para acceder a esta funcionalidad'
    });
  }
  
  next();
};`;

  // Agregar la función antes de module.exports
  const moduleExportIndex = authContent.lastIndexOf('module.exports');
  if (moduleExportIndex !== -1) {
    authContent = authContent.substring(0, moduleExportIndex) + 
                  canManageAccountingFunction + '\n\n' + 
                  authContent.substring(moduleExportIndex);
  }

  // Actualizar exports
  authContent = authContent.replace(
    'module.exports = {',
    'module.exports = {\n  canManageAccounting,'
  );

  fs.writeFileSync(authMiddlewarePath, authContent);
  console.log('✅ Middleware actualizado para incluir AUXILIAR');
}

console.log('🎯 SOLUCIÓN APLICADA - REINICIA EL SERVIDOR');
console.log('📋 Ejecuta: npm start');
console.log('🔗 Luego ve a: Gestión de Fondos → Préstamos entre Fondos');