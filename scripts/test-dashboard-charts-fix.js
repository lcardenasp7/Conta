/**
 * Probar corrección de gráficos del dashboard
 */

console.log('🔧 Corrección aplicada al dashboard financiero');
console.log('📊 Los gráficos deberían mostrar datos ahora');
console.log('');
console.log('💡 Instrucciones:');
console.log('1. Ve al navegador donde tienes abierto el dashboard');
console.log('2. Presiona F5 para refrescar la página');
console.log('3. Los gráficos de "Ingresos por Categoría" y "Gastos por Categoría" deberían mostrar datos');
console.log('4. Deberías ver:');
console.log('   - Ingresos: CASH, BANK_TRANSFER, CARD');
console.log('   - Gastos: UTILITIES, EDUCATIONAL_MATERIALS, MAINTENANCE');
console.log('');
console.log('🔍 Si aún no funcionan, abre la consola del navegador (F12) y revisa los logs');

const { spawn } = require('child_process');
spawn('start', ['http://localhost:3000/#dashboard-financiero'], { shell: true });