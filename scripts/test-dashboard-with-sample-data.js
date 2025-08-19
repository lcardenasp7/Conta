/**
 * Probar dashboard financiero con datos de muestra
 */

const { spawn } = require('child_process');

console.log('🔄 Reiniciando servidor y probando dashboard...');

// Reiniciar servidor
const server = spawn('npm', ['start'], {
    stdio: 'inherit',
    shell: true
});

// Esperar un poco y luego abrir el navegador
setTimeout(() => {
    console.log('🌐 Abriendo dashboard financiero en el navegador...');
    const { spawn } = require('child_process');
    spawn('start', ['http://localhost:3000'], { shell: true });
}, 3000);

// Manejar cierre del proceso
process.on('SIGINT', () => {
    console.log('🛑 Cerrando servidor...');
    server.kill();
    process.exit();
});