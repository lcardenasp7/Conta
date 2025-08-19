#!/usr/bin/env node

/**
 * SCRIPT DE CORRECCIÓN FINAL: PRÉSTAMOS ENTRE FONDOS
 * Fuerza el reinicio del servidor y verifica la ruta
 */

console.log('🔧 CORRECCIÓN FINAL: PRÉSTAMOS ENTRE FONDOS\n');

const { spawn } = require('child_process');
const http = require('http');

function killNodeProcesses() {
    console.log('1️⃣ Terminando procesos de Node.js...');
    
    return new Promise((resolve) => {
        const killProcess = spawn('taskkill', ['/f', '/im', 'node.exe'], { shell: true });
        
        killProcess.on('close', (code) => {
            console.log('   ✅ Procesos terminados');
            resolve();
        });
        
        killProcess.on('error', () => {
            console.log('   ⚠️ No hay procesos de Node.js corriendo');
            resolve();
        });
    });
}

function startServer() {
    console.log('2️⃣ Iniciando servidor...');
    
    return new Promise((resolve) => {
        const serverProcess = spawn('npm', ['start'], { 
            shell: true,
            stdio: 'pipe'
        });
        
        let serverReady = false;
        
        serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('   📋 Server:', output.trim());
            
            if (output.includes('Server running on port 3000') && !serverReady) {
                serverReady = true;
                console.log('   ✅ Servidor iniciado correctamente');
                resolve(serverProcess);
            }
        });
        
        serverProcess.stderr.on('data', (data) => {
            const error = data.toString();
            console.log('   ❌ Error:', error.trim());
        });
        
        // Timeout de 10 segundos
        setTimeout(() => {
            if (!serverReady) {
                console.log('   ⚠️ Timeout esperando el servidor');
                resolve(serverProcess);
            }
        }, 10000);
    });
}

function testLoansRoute() {
    console.log('3️⃣ Probando ruta de préstamos...');
    
    return new Promise((resolve) => {
        const req = http.get('http://localhost:3000/api/funds/loans', (res) => {
            console.log(`   📊 Status: ${res.statusCode}`);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 401) {
                    console.log('   ✅ Ruta funciona (requiere autenticación)');
                    resolve(true);
                } else if (res.statusCode === 200) {
                    console.log('   ✅ Ruta funciona correctamente');
                    resolve(true);
                } else if (res.statusCode === 404) {
                    console.log('   ❌ Error 404 - Ruta no encontrada');
                    console.log('   📄 Respuesta:', data);
                    resolve(false);
                } else {
                    console.log(`   ⚠️ Status inesperado: ${res.statusCode}`);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`   ❌ Error de conexión: ${error.message}`);
            resolve(false);
        });
        
        req.setTimeout(5000, () => {
            console.log('   ❌ Timeout');
            req.destroy();
            resolve(false);
        });
    });
}

function generateFinalInstructions() {
    console.log('\n📋 INSTRUCCIONES FINALES:');
    console.log('');
    console.log('1. El servidor se ha reiniciado');
    console.log('2. Ve a http://localhost:3000');
    console.log('3. Inicia sesión con admin@villas.edu.co / admin123');
    console.log('4. Ve a "Gestión de Fondos" → "Préstamos entre Fondos"');
    console.log('');
    console.log('✅ RESULTADO ESPERADO:');
    console.log('   • Página carga sin error 404');
    console.log('   • Se muestran préstamos simulados');
    console.log('   • No hay errores en la consola');
    console.log('');
    console.log('🔧 SI PERSISTE EL ERROR:');
    console.log('   • Verifica que el servidor esté corriendo');
    console.log('   • Usa una pestaña de incógnito');
    console.log('   • Inicia sesión como admin (no como auxiliar)');
}

async function main() {
    try {
        await killNodeProcesses();
        
        // Esperar un momento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const serverProcess = await startServer();
        
        // Esperar que el servidor esté completamente listo
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const routeWorks = await testLoansRoute();
        
        console.log('\n📊 RESULTADO:');
        if (routeWorks) {
            console.log('✅ La ruta de préstamos funciona correctamente');
        } else {
            console.log('❌ La ruta de préstamos sigue fallando');
        }
        
        generateFinalInstructions();
        
        // Mantener el proceso vivo para que el servidor siga corriendo
        console.log('\n🚀 Servidor corriendo. Presiona Ctrl+C para detener.');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };