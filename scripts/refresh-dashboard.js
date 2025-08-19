/**
 * Refrescar dashboard y abrir en navegador
 */

const { spawn } = require('child_process');

console.log('🔄 Refrescando dashboard financiero...');
console.log('📊 Los datos están disponibles en la API');
console.log('🌐 Abriendo dashboard en el navegador...');

// Abrir el navegador en la página del dashboard
spawn('start', ['http://localhost:3000/#dashboard-financiero'], { shell: true });

console.log('💡 Instrucciones:');
console.log('1. Haz login con: rector@villasanpablo.edu.co / VillasSP2024!');
console.log('2. Ve al Dashboard Financiero');
console.log('3. Los gráficos deberían mostrar los datos ahora');
console.log('4. Si no se muestran, presiona F5 para refrescar');
console.log('5. Abre la consola del navegador (F12) para ver logs');