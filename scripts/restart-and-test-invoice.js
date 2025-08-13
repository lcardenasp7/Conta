/**
 * Script para reiniciar el servidor y probar las correcciones de facturas
 */

const { spawn, exec } = require('child_process');
const path = require('path');

async function restartAndTest() {
    try {
        console.log('🔄 Reiniciando servidor para aplicar cambios...\n');

        // 1. Detener procesos de Node.js existentes (si los hay)
        console.log('🛑 Deteniendo procesos existentes...');
        
        await new Promise((resolve) => {
            exec('taskkill /f /im node.exe', (error) => {
                // Ignorar errores si no hay procesos
                resolve();
            });
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('✅ Procesos detenidos');

        // 2. Iniciar el servidor en segundo plano
        console.log('🚀 Iniciando servidor...');
        
        const serverProcess = spawn('node', ['server.js'], {
            detached: true,
            stdio: 'ignore'
        });

        serverProcess.unref();

        // Esperar un momento para que el servidor inicie
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('✅ Servidor iniciado');

        // 3. Probar las correcciones
        console.log('🧪 Probando correcciones de header...');
        
        const testProcess = spawn('node', ['scripts/test-header-fix-final.js'], {
            stdio: 'inherit'
        });

        testProcess.on('close', (code) => {
            if (code === 0) {
                console.log('\n🎉 ¡Correcciones aplicadas exitosamente!');
                console.log('💡 El servidor está ejecutándose con los cambios aplicados');
                console.log('📄 Puedes crear nuevas facturas para verificar las correcciones');
            } else {
                console.log('\n❌ Error en las pruebas');
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    restartAndTest();
}

module.exports = { restartAndTest };