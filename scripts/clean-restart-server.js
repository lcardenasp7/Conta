#!/usr/bin/env node

/**
 * SCRIPT DE REINICIO LIMPIO
 * Reinicia el servidor de forma limpia para aplicar cambios
 */

console.log('🔄 REINICIO LIMPIO DEL SERVIDOR\n');

const { spawn } = require('child_process');

async function cleanRestart() {
    console.log('1️⃣ Terminando procesos existentes...');
    
    // Terminar procesos de Node.js
    const killProcess = spawn('taskkill', ['/f', '/im', 'node.exe'], { 
        shell: true,
        stdio: 'pipe'
    });
    
    await new Promise((resolve) => {
        killProcess.on('close', () => {
            console.log('   ✅ Procesos terminados');
            resolve();
        });
        
        killProcess.on('error', () => {
            console.log('   ⚠️ No hay procesos corriendo');
            resolve();
        });
    });
    
    console.log('2️⃣ Esperando 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('3️⃣ Iniciando servidor...');
    
    const serverProcess = spawn('npm', ['start'], { 
        shell: true,
        stdio: 'inherit'
    });
    
    console.log('✅ Servidor iniciándose...');
    console.log('');
    console.log('📋 DESPUÉS DE QUE APAREZCA "Server running on port 3000":');
    console.log('1. Ve a http://localhost:3000');
    console.log('2. Inicia sesión (admin@villas.edu.co / admin123)');
    console.log('3. Ve a "Gestión de Fondos" → "Préstamos entre Fondos"');
    console.log('4. Deberías ver en los logs del servidor:');
    console.log('   "📋 GET /api/funds/loans - Obteniendo préstamos entre fondos"');
    console.log('   "✅ Devolviendo X préstamos simulados"');
}

if (require.main === module) {
    cleanRestart();
}

module.exports = { cleanRestart };