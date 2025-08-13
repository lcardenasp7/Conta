#!/usr/bin/env node

/**
 * Script para solucionar los problemas actuales
 */

const { spawn, exec } = require('child_process');

console.log('🔧 Solucionando problemas actuales del sistema...\n');

async function fixCurrentIssues() {
    try {
        console.log('1️⃣ Problemas identificados:');
        console.log('   • Error 500 en /api/invoices/external');
        console.log('   • Problema de accesibilidad en studentEventsModal');
        console.log('   • Conflicto de variables en invoices.js');
        console.log('');

        console.log('2️⃣ Soluciones aplicadas:');
        console.log('   ✅ Corregida variable "result" en invoices.js');
        console.log('   ✅ Mejorada accesibilidad en studentEventsModal');
        console.log('   ✅ Agregado logging en endpoint external');
        console.log('   ✅ Creado script de prueba para facturas externas');
        console.log('');

        console.log('3️⃣ Para aplicar completamente las correcciones:');
        console.log('   🔄 Reiniciando servidor...');

        // Kill existing processes
        if (process.platform === 'win32') {
            exec('taskkill /f /im node.exe', (error) => {
                if (error) {
                    console.log('   No hay procesos Node.js ejecutándose');
                } else {
                    console.log('   ✅ Procesos anteriores detenidos');
                }
            });
        } else {
            exec('pkill -f "node.*server.js"', (error) => {
                if (error) {
                    console.log('   No hay procesos Node.js ejecutándose');
                } else {
                    console.log('   ✅ Procesos anteriores detenidos');
                }
            });
        }

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('\n4️⃣ Iniciando servidor con correcciones...');
        console.log('   📄 Facturas externas: Endpoint corregido');
        console.log('   ♿ Accesibilidad: Modales mejorados');
        console.log('   🔧 JavaScript: Variables corregidas');
        console.log('   📊 Logging: Mejorado para debugging');
        console.log('');

        // Start server
        const serverProcess = spawn('npm', ['start'], {
            stdio: 'inherit',
            shell: true
        });

        serverProcess.on('error', (error) => {
            console.error('❌ Error iniciando servidor:', error);
        });

        console.log('5️⃣ Después del reinicio, puedes probar:');
        console.log('   • Crear facturas externas desde la interfaz');
        console.log('   • Verificar que los modales sean accesibles');
        console.log('   • Usar Tab para navegar en modales');
        console.log('   • Probar con: node scripts/test-external-invoice.js <token>');

    } catch (error) {
        console.error('❌ Error durante la corrección:', error);
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n👋 Corrección cancelada');
    process.exit(0);
});

fixCurrentIssues();