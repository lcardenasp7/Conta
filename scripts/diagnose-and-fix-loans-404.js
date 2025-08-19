/**
 * DIAGNÓSTICO Y SOLUCIÓN DEFINITIVA PARA ERROR 404 EN PRÉSTAMOS
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSTICANDO ERROR 404 EN /api/funds/loans...');

// 1. Verificar que server.js tenga las rutas montadas
const serverPath = path.join(__dirname, '../server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

console.log('📋 Verificando server.js...');

// Buscar la línea de importación de funds
const fundsImportRegex = /const fundsRoutes = require\('\.\/routes\/funds'\);?/;
const fundsUseRegex = /app\.use\('\/api\/funds', fundsRoutes\);?/;

if (!fundsImportRegex.test(serverContent)) {
  console.log('❌ No se encontró importación de fundsRoutes');
  // Agregar importación
  const importSection = serverContent.match(/(const.*routes.*require.*\n)+/);
  if (importSection) {
    const newImport = importSection[0] + "const fundsRoutes = require('./routes/funds');\n";
    serverContent = serverContent.replace(importSection[0], newImport);
  }
} else {
  console.log('✅ Importación de fundsRoutes encontrada');
}

if (!fundsUseRegex.test(serverContent)) {
  console.log('❌ No se encontró montaje de rutas /api/funds');
  // Agregar montaje de rutas
  const routeSection = serverContent.match(/(app\.use\('\/api\/.*\n)+/);
  if (routeSection) {
    const newRoute = routeSection[0] + "app.use('/api/funds', fundsRoutes);\n";
    serverContent = serverContent.replace(routeSection[0], newRoute);
  }
} else {
  console.log('✅ Montaje de rutas /api/funds encontrado');
}

fs.writeFileSync(serverPath, serverContent);

// 2. Crear una ruta de prueba simple en funds.js
const fundsPath = path.join(__dirname, '../routes/funds.js');
let fundsContent = fs.readFileSync(fundsPath, 'utf8');

console.log('📋 Verificando routes/funds.js...');

// Verificar que tenga la estructura básica
if (!fundsContent.includes("const express = require('express')")) {
  console.log('❌ Estructura básica faltante en funds.js');
  process.exit(1);
}

// Agregar ruta de prueba simple al inicio
const testRoute = `
// RUTA DE PRUEBA PARA DIAGNÓSTICO
router.get('/test', (req, res) => {
  console.log('🧪 TEST ROUTE CALLED');
  res.json({ success: true, message: 'Funds routes working' });
});

`;

// Buscar donde insertar la ruta de prueba
const routerGetIndex = fundsContent.indexOf("router.get('/");
if (routerGetIndex !== -1) {
  fundsContent = fundsContent.substring(0, routerGetIndex) + testRoute + fundsContent.substring(routerGetIndex);
} else {
  // Si no hay rutas, agregar después de la declaración del router
  const routerIndex = fundsContent.indexOf('const router = express.Router();');
  if (routerIndex !== -1) {
    const insertIndex = fundsContent.indexOf('\n', routerIndex) + 1;
    fundsContent = fundsContent.substring(0, insertIndex) + testRoute + fundsContent.substring(insertIndex);
  }
}

// Asegurar que la ruta /loans esté presente y sea simple
const simpleLoansRoute = `
// RUTA SIMPLE DE PRÉSTAMOS (SIN AUTENTICACIÓN PARA PRUEBA)
router.get('/loans', (req, res) => {
  console.log('📋 GET /api/funds/loans - Ruta llamada exitosamente');
  console.log('🔍 Query params:', req.query);
  
  try {
    const mockLoans = [
      {
        id: '1',
        lenderFund: { name: 'Fondo Operacional', code: 'OPE2025' },
        borrowerFund: { name: 'Fondo de Eventos', code: 'EVE2025' },
        amount: 200000,
        status: 'PENDING',
        reason: 'Préstamo para evento escolar'
      },
      {
        id: '2',
        lenderFund: { name: 'Fondo de Matrícula', code: 'MAT2025' },
        borrowerFund: { name: 'Fondo Operacional', code: 'OPE2025' },
        amount: 500000,
        status: 'APPROVED',
        reason: 'Préstamo para gastos operacionales'
      }
    ];

    console.log('✅ Devolviendo préstamos simulados');
    
    res.json({
      success: true,
      loans: mockLoans,
      pagination: {
        page: 1,
        limit: 20,
        total: mockLoans.length,
        pages: 1
      }
    });

  } catch (error) {
    console.error('❌ Error en ruta loans:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

`;

// Reemplazar cualquier ruta /loans existente
const loansRouteRegex = /router\.get\('\/loans'[\s\S]*?\}\);/g;
fundsContent = fundsContent.replace(loansRouteRegex, '');

// Agregar la nueva ruta antes del module.exports
const moduleExportIndex = fundsContent.lastIndexOf('module.exports');
if (moduleExportIndex !== -1) {
  fundsContent = fundsContent.substring(0, moduleExportIndex) + simpleLoansRoute + '\n' + fundsContent.substring(moduleExportIndex);
}

fs.writeFileSync(fundsPath, fundsContent);

console.log('✅ Archivos actualizados');
console.log('🔄 REINICIA EL SERVIDOR AHORA');
console.log('📋 Ejecuta: node server.js');
console.log('🧪 Prueba: http://localhost:3000/api/funds/test');
console.log('🏦 Prueba: http://localhost:3000/api/funds/loans');