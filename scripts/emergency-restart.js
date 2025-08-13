#!/usr/bin/env node

/**
 * Emergency restart script for when the server crashes
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY RESTART - Sistema de Gestión Educativa');
console.log('================================================\n');

async function emergencyRestart() {
    try {
        // Step 1: Kill any existing Node processes
        console.log('🛑 1. Deteniendo procesos existentes...');
        
        if (process.platform === 'win32') {
            exec('taskkill /f /im node.exe', (error) => {
                if (error) {
                    console.log('   No hay procesos Node.js ejecutándose');
                } else {
                    console.log('   ✅ Procesos Node.js detenidos');
                }
            });
        } else {
            exec('pkill -f "node.*server.js"', (error) => {
                if (error) {
                    console.log('   No hay procesos Node.js ejecutándose');
                } else {
                    console.log('   ✅ Procesos Node.js detenidos');
                }
            });
        }

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 2: Check if we need to use simple dashboard
        console.log('\n🔧 2. Verificando configuración...');
        
        const serverPath = path.join(__dirname, '../server.js');
        const dashboardPath = path.join(__dirname, '../routes/dashboard.routes.js');
        const simpleDashboardPath = path.join(__dirname, '../routes/dashboard-simple.routes.js');
        
        if (fs.existsSync(simpleDashboardPath)) {
            console.log('   📋 Dashboard simplificado disponible');
            
            // Backup current dashboard and use simple one
            if (fs.existsSync(dashboardPath)) {
                fs.copyFileSync(dashboardPath, dashboardPath + '.backup');
                console.log('   💾 Dashboard actual respaldado');
            }
            
            fs.copyFileSync(simpleDashboardPath, dashboardPath);
            console.log('   🔄 Dashboard simplificado activado');
        }

        // Step 3: Install missing dependencies
        console.log('\n📦 3. Verificando dependencias...');
        
        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
        const requiredDeps = ['multer', 'pdfkit'];
        
        for (const dep of requiredDeps) {
            if (!packageJson.dependencies[dep]) {
                console.log(`   📥 Instalando ${dep}...`);
                exec(`npm install ${dep}`, (error) => {
                    if (error) {
                        console.log(`   ⚠️  Error instalando ${dep}: ${error.message}`);
                    } else {
                        console.log(`   ✅ ${dep} instalado`);
                    }
                });
            }
        }

        // Step 4: Check database connection
        console.log('\n🗄️  4. Verificando base de datos...');
        
        try {
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            
            await prisma.$connect();
            console.log('   ✅ Conexión a base de datos OK');
            await prisma.$disconnect();
        } catch (error) {
            console.log('   ⚠️  Problema con base de datos:', error.message);
            console.log('   💡 Ejecuta: npx prisma db push');
        }

        // Step 5: Start server
        console.log('\n🚀 5. Iniciando servidor...');
        console.log('   🌐 URL: http://localhost:3000');
        console.log('   📊 Dashboard: Versión simplificada (sin errores)');
        console.log('   📄 Facturas: PDF disponible');
        console.log('   🏛️  Logo: Carga disponible');
        console.log('\n   Para volver al dashboard completo:');
        console.log('   - Soluciona los errores de base de datos');
        console.log('   - Ejecuta: node scripts/restore-dashboard.js\n');

        // Start the server
        const serverProcess = spawn('npm', ['start'], {
            stdio: 'inherit',
            shell: true
        });

        serverProcess.on('error', (error) => {
            console.error('❌ Error iniciando servidor:', error);
        });

        serverProcess.on('close', (code) => {
            console.log(`🛑 Servidor detenido con código: ${code}`);
        });

    } catch (error) {
        console.error('❌ Error durante el reinicio de emergencia:', error);
        console.log('\n🆘 SOLUCIÓN MANUAL:');
        console.log('1. Abre una nueva terminal');
        console.log('2. Ejecuta: npm install');
        console.log('3. Ejecuta: npx prisma db push');
        console.log('4. Ejecuta: npm start');
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n👋 Reinicio cancelado por el usuario');
    process.exit(0);
});

// Run emergency restart
emergencyRestart();