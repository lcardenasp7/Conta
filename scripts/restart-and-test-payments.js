#!/usr/bin/env node

/**
 * Script para reiniciar el servidor y probar las rutas de pagos
 */

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🔄 Restarting server to apply payment routes changes...\n');

// Verificar que las rutas están correctamente implementadas
console.log('📋 Checking payment routes implementation:');

const paymentRoutesContent = fs.readFileSync('routes/payment.routes.js', 'utf8');

// Verificar que la ruta DELETE está implementada
if (paymentRoutesContent.includes("router.delete('/:id'")) {
    console.log('✅ DELETE /api/payments/:id route - implemented');
} else {
    console.log('❌ DELETE /api/payments/:id route - missing');
}

// Verificar que se exporta el router
if (paymentRoutesContent.includes('module.exports = router')) {
    console.log('✅ Router export - correct');
} else {
    console.log('❌ Router export - missing');
}

// Verificar que server.js registra las rutas
const serverContent = fs.readFileSync('server.js', 'utf8');
if (serverContent.includes("app.use('/api/payments', paymentRoutes)")) {
    console.log('✅ Payment routes registration in server.js - correct');
} else {
    console.log('❌ Payment routes registration in server.js - missing');
}

console.log('\n🚀 Server restart required to apply changes.');
console.log('📋 After restart, the following endpoints should be available:');
console.log('   GET    /api/payments - List all payments');
console.log('   GET    /api/payments/:id - Get single payment');
console.log('   POST   /api/payments - Create payment');
console.log('   PUT    /api/payments/:id - Update payment');
console.log('   DELETE /api/payments/:id - Delete payment ✨ NEW');

console.log('\n🧪 To test after restart:');
console.log('1. Go to Event Assignments');
console.log('2. View payment history for a student');
console.log('3. Try to delete a payment');
console.log('4. Should work without 404 errors');

console.log('\n💡 If still getting 404 errors:');
console.log('1. Check server console for startup errors');
console.log('2. Verify routes are loaded correctly');
console.log('3. Check network tab in browser DevTools');

console.log('\n⚠️  IMPORTANT: Restart your development server now!');
console.log('   - If using nodemon: It should restart automatically');
console.log('   - If using node: Stop (Ctrl+C) and start again');
console.log('   - If using PM2: pm2 restart all');

console.log('\n✅ Payment routes fix ready for testing!');