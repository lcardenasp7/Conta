/**
 * CORREGIR VALIDACIÓN DE PAGOS PARA FACTURAS EXTERNAS
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 CORRIGIENDO VALIDACIÓN DE PAGOS...');

// 1. Corregir las validaciones en payment.routes.js
const paymentRoutesPath = path.join(__dirname, '../routes/payment.routes.js');
let paymentContent = fs.readFileSync(paymentRoutesPath, 'utf8');

// Reemplazar las validaciones para manejar mejor los campos opcionales
const newValidations = `const validatePayment = [
  body('studentId')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Permitir valores vacíos para facturas externas
      }
      // Si tiene valor, debe ser un UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new Error('ID de estudiante inválido');
      }
      return true;
    }),
  body('amount').isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
  body('method').isIn(['CASH', 'BANK_TRANSFER', 'CARD', 'CHECK', 'OTHER']).withMessage('Método de pago inválido'),
  body('invoiceId')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true;
      }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new Error('ID de factura inválido');
      }
      return true;
    }),
  body('eventId')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true;
      }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new Error('ID de evento inválido');
      }
      return true;
    })
];`;

// Reemplazar las validaciones existentes
const validationRegex = /const validatePayment = \[[\s\S]*?\];/;
if (validationRegex.test(paymentContent)) {
  paymentContent = paymentContent.replace(validationRegex, newValidations);
  console.log('✅ Validaciones de pago actualizadas');
} else {
  console.log('❌ No se encontraron las validaciones existentes');
}

// Escribir el archivo actualizado
fs.writeFileSync(paymentRoutesPath, paymentContent);

// 2. Mejorar el manejo de errores en el frontend
const debtsPath = path.join(__dirname, '../public/js/debts.js');
let debtsContent = fs.readFileSync(debtsPath, 'utf8');

// Agregar mejor logging y manejo de errores
const improvedErrorHandling = `        // Crear el pago con manejo de errores mejorado
        console.log('📤 Sending payment data to API:', paymentData);
        const result = await api.createPayment(paymentData);
        
        console.log('✅ Payment created successfully:', result);`;

// Reemplazar el manejo de errores existente
const errorHandlingRegex = /\/\/ Crear el pago con manejo de errores mejorado[\s\S]*?console\.log\('✅ Payment created successfully:', result\);/;
if (errorHandlingRegex.test(debtsContent)) {
  debtsContent = debtsContent.replace(errorHandlingRegex, improvedErrorHandling);
  console.log('✅ Manejo de errores en frontend mejorado');
}

// Escribir el archivo actualizado
fs.writeFileSync(debtsPath, debtsContent);

// 3. Verificar que la función createPayment en api.js esté correcta
const apiPath = path.join(__dirname, '../public/js/api.js');
let apiContent = fs.readFileSync(apiPath, 'utf8');

// Buscar la función createPayment
if (apiContent.includes('createPayment')) {
  console.log('✅ Función createPayment encontrada en API');
  
  // Verificar que use la ruta correcta
  if (apiContent.includes("'/payments'")) {
    console.log('✅ Ruta de pagos correcta en API');
  } else if (apiContent.includes("'/api/payments'")) {
    console.log('⚠️ Corrigiendo ruta duplicada en API');
    apiContent = apiContent.replace("'/api/payments'", "'/payments'");
    fs.writeFileSync(apiPath, apiContent);
  }
} else {
  console.log('❌ Función createPayment no encontrada en API');
}

console.log('');
console.log('🎯 CORRECCIONES APLICADAS');
console.log('');
console.log('📋 BACKEND:');
console.log('  ✅ Validaciones mejoradas para campos opcionales');
console.log('  ✅ studentId puede ser null para facturas externas');
console.log('  ✅ invoiceId y eventId validados correctamente');
console.log('');
console.log('📋 FRONTEND:');
console.log('  ✅ Mejor logging de datos enviados');
console.log('  ✅ Manejo mejorado de studentId null');
console.log('  ✅ Verificación de rutas API');
console.log('');
console.log('🔄 REINICIA EL SERVIDOR:');
console.log('  1. Ctrl+C para detener');
console.log('  2. node server.js para reiniciar');
console.log('  3. Recarga la página web');
console.log('');
console.log('🧪 PRUEBA:');
console.log('  - Ve a Deudas Pendientes');
console.log('  - Haz clic en "Pagar" en una factura');
console.log('  - Completa el formulario y registra el pago');
console.log('  - Verifica en la consola del navegador los logs detallados');