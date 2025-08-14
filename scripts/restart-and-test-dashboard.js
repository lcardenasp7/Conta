/**
 * Script para reiniciar el servidor y probar el dashboard financiero
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Reiniciando servidor para probar dashboard financiero...');

// Matar procesos de Node.js existentes
const killProcess = spawn('taskkill', ['/F', '/IM', 'node.exe'], { shell: true });

killProcess.on('close', (code) => {
    console.log('🛑 Procesos anteriores terminados');
    
    // Esperar un momento antes de reiniciar
    setTimeout(() => {
        console.log('🚀 Iniciando servidor...');
        
        // Iniciar el servidor principal
        const server = spawn('node', ['server.js'], {
            stdio: 'inherit',
            shell: true
        });
        
        server.on('error', (error) => {
            console.error('❌ Error iniciando servidor:', error);
        });
        
        // Mostrar instrucciones después de 3 segundos
        setTimeout(() => {
            console.log('\n📊 INSTRUCCIONES PARA PROBAR EL DASHBOARD:');
            console.log('==========================================');
            console.log('1. Abrir navegador en: http://localhost:3000');
            console.log('2. Hacer login en el sistema');
            console.log('3. Hacer click en "Dashboard Financiero" en el sidebar');
            console.log('4. Verificar que ya NO aparece "Página en Desarrollo"');
            console.log('5. Confirmar que el dashboard se carga correctamente');
            console.log('\n✅ Si todo funciona, deberías ver gráficos y datos financieros');
            console.log('❌ Si hay errores, revisar la consola del navegador');
            console.log('\n🔧 Presiona Ctrl+C para detener el servidor');
        }, 3000);
        
    }, 1000);
});

killProcess.on('error', (error) => {
    console.log('⚠️ No hay procesos Node.js para terminar, iniciando servidor...');
    
    // Iniciar el servidor principal
    const server = spawn('node', ['server.js'], {
        stdio: 'inherit',
        shell: true
    });
    
    server.on('error', (error) => {
        console.error('❌ Error iniciando servidor:', error);
    });
});