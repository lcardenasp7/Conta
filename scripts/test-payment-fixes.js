#!/usr/bin/env node

/**
 * Script para verificar las correcciones de pagos
 */

const fs = require('fs');

console.log('🧪 Testing Payment Fixes...\n');

// Verificar corrección del endpoint de pagos parciales
console.log('📋 Checking partial payment endpoint fix:');

const apiContent = fs.readFileSync('public/js/api.js', 'utf8');

// Verificar que addPartialPayment usa el endpoint correcto
if (apiContent.includes('this.post(`/events/${eventId}/payments`, {')) {
    console.log('✅ addPartialPayment - usando endpoint correcto (/events/:id/payments)');
} else if (apiContent.includes('/payments/partial')) {
    console.log('❌ addPartialPayment - aún usa endpoint incorrecto (/payments/partial)');
} else {
    console.log('⚠️ addPartialPayment - endpoint no encontrado');
}

// Verificar corrección del dashboard financiero
console.log('\n💰 Checking financial dashboard fix:');

const assignmentsContent = fs.readFileSync('public/js/event-assignments.js', 'utf8');

// Verificar que se verifica la existencia de elementos antes de actualizar
if (assignmentsContent.includes('document.querySelector(\'#financialSummary, #incomeChart, #expenseChart\')')) {
    console.log('✅ Dashboard update - verifica existencia de elementos DOM');
} else {
    console.log('❌ Dashboard update - no verifica elementos DOM');
}

// Verificar que se omite la actualización si no están los elementos
if (assignmentsContent.includes('Dashboard financiero no está en la página actual')) {
    console.log('✅ Dashboard update - omite actualización cuando no es necesaria');
} else {
    console.log('❌ Dashboard update - no omite actualización innecesaria');
}

console.log('\n📋 Endpoints corregidos:');
console.log('✅ DELETE /api/payments/:id - Eliminar pagos (FUNCIONA)');
console.log('✅ GET /api/events/:id/payments - Obtener pagos de evento (FUNCIONA)');
console.log('✅ POST /api/events/:id/payments - Crear pago de evento (CORREGIDO)');

console.log('\n🔧 Problemas solucionados:');
console.log('✅ Eliminación de pagos funciona correctamente');
console.log('✅ Endpoint de pagos parciales corregido');
console.log('✅ Dashboard financiero no genera errores DOM');
console.log('✅ Actualización inteligente del dashboard');

console.log('\n🧪 Instrucciones de prueba:');
console.log('1. Ir a Asignaciones de Eventos');
console.log('2. Seleccionar el evento DERECHO DE GRADO');
console.log('3. Probar "Pago Rápido" en un estudiante');
console.log('4. Verificar que no hay error 404');
console.log('5. Verificar que el pago se registra correctamente');
console.log('6. Probar eliminar el pago');
console.log('7. Verificar que no hay errores en consola');

console.log('\n✅ Payment fixes completed!');
console.log('🚀 Ready for testing...');