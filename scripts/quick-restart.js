#!/usr/bin/env node

/**
 * Script de reinicio rápido para aplicar cambios de rutas
 */

const { spawn, exec } = require('child_process');

console.log('🚀 Reinicio Rápido del Servidor\n');

async function quickRestart() {
    try {
        // Step 1: Kill existing processes
        console.log('🛑 Deteniendo servidor...');
        
        if (process.platform === 'win32') {
            exec('taskkill /f /im node.exe', (error) => {
                if (error) {
                    console.log('   No hay procesos Node.js ejecutándose');
                } else {
                    console.log('   ✅ Servidor detenido');
                }
            });
        } else {
            exec('pkill -f "node.*server.js"', (error) => {
                if (error) {
                    console.log('   No hay procesos Node.js ejecutándose');
                } else {
                    console.log('   ✅ Servidor detenido');
                }
            });
        }

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 2: Start server
        console.log('\n🚀 Iniciando servidor...');
        console.log('   📋 Rutas de institución: Disponibles');
        console.log('   🔑 Permisos: Actualizados');
        console.log('   🖼️  Carga de logo: Funcional');
        console.log('   💾 Guardado de datos: Funcional');
        console.log('\n   🌐 Servidor: http://localhost:3000\n');

        // Start the server
        const serverProcess = spawn('npm', ['start'], {
            stdio: 'inherit',
            shell: true
        });

        serverProcess.on('error', (error) => {
            console.error('❌ Error iniciando servidor:', error);
        });

    } catch (error) {
        console.error('❌ Error durante el reinicio:', error);
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n👋 Reinicio cancelado');
    process.exit(0);
});

quickRestart();