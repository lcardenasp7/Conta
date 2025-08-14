/**
 * Script para forzar la limpieza del cache y reiniciar el servidor
 */

const fs = require('fs');
const { spawn } = require('child_process');

console.log('🔄 FORZANDO LIMPIEZA DE CACHE Y REINICIO');
console.log('=======================================');

// Generar nuevo timestamp para forzar recarga
const timestamp = Date.now();

console.log('📝 Actualizando versiones de archivos...');

// Actualizar versión en index.html
let indexContent = fs.readFileSync('public/index.html', 'utf8');
indexContent = indexContent.replace(
    /financial-dashboard\.js\?v=\d+/g,
    `financial-dashboard.js?v=${timestamp}`
);
fs.writeFileSync('public/index.html', indexContent);

console.log('✅ Versión actualizada en index.html');

// Matar procesos existentes
console.log('🛑 Terminando procesos Node.js...');
const killProcess = spawn('taskkill', ['/F', '/IM', 'node.exe'], { shell: true });

killProcess.on('close', (code) => {
    console.log('✅ Procesos terminados');
    
    setTimeout(() => {
        console.log('🚀 Reiniciando servidor...');
        
        const server = spawn('node', ['server.js'], {
            stdio: 'inherit',
            shell: true
        });
        
        server.on('error', (error) => {
            console.error('❌ Error iniciando servidor:', error);
        });
        
        setTimeout(() => {
            console.log('\n📋 INSTRUCCIONES PARA PROBAR:');
            console.log('============================');
            console.log('1. Abrir navegador en: http://localhost:3000');
            console.log('2. Presionar Ctrl+F5 para forzar recarga completa');
            console.log('3. Hacer login');
            console.log('4. Ir a Dashboard Financiero');
            console.log('5. Verificar que ya no hay error de API.request');
            console.log('\n✅ El dashboard debería cargar correctamente ahora');
        }, 3000);
        
    }, 2000);
});

killProcess.on('error', (error) => {
    console.log('⚠️ No hay procesos para terminar, iniciando servidor...');
    
    const server = spawn('node', ['server.js'], {
        stdio: 'inherit',
        shell: true
    });
});