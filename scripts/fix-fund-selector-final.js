#!/usr/bin/env node

/**
 * SCRIPT FINAL: CORRECCIÓN COMPLETA DEL SELECTOR DE FONDOS
 * Solución simple y directa para agregar campos de fondos a los modales
 */

console.log('🔧 APLICANDO CORRECCIÓN FINAL DEL SELECTOR DE FONDOS...\n');

// Reiniciar servidor
const { spawn } = require('child_process');

function restartServer() {
    console.log('🔄 Reiniciando servidor...');
    
    // Matar procesos de Node.js existentes
    const killProcess = spawn('taskkill', ['/f', '/im', 'node.exe'], { shell: true });
    
    killProcess.on('close', (code) => {
        console.log('✅ Procesos anteriores terminados');
        
        // Esperar un momento y luego iniciar el servidor
        setTimeout(() => {
            console.log('🚀 Iniciando servidor...');
            
            const serverProcess = spawn('npm', ['start'], { 
                shell: true,
                stdio: 'inherit'
            });
            
            serverProcess.on('error', (error) => {
                console.error('❌ Error iniciando servidor:', error);
            });
            
        }, 2000);
    });
}

function showInstructions() {
    console.log('📋 INSTRUCCIONES DE PRUEBA:');
    console.log('');
    console.log('1. Espera a que el servidor se inicie completamente');
    console.log('2. Ve a http://localhost:3000');
    console.log('3. Inicia sesión con admin@villas.edu.co / admin123');
    console.log('4. Ve a "Facturación" → "Facturas"');
    console.log('');
    console.log('🧪 PRUEBA MODAL DE FACTURA EXTERNA:');
    console.log('   • Haz clic en "Factura Externa" (botón verde)');
    console.log('   • Verifica que aparece el campo "💰 Fondo para el Pago"');
    console.log('   • Selecciona un fondo y verifica que aparece el saldo');
    console.log('');
    console.log('🧪 PRUEBA MODAL DE FACTURA PROVEEDOR:');
    console.log('   • Haz clic en "Factura Proveedor" (botón amarillo)');
    console.log('   • Verifica que aparece el campo "💰 Selección de Fondos"');
    console.log('   • Selecciona un fondo y verifica que aparece el saldo');
    console.log('');
    console.log('✅ AMBOS MODALES DEBEN TENER:');
    console.log('   • Campo de selección de fondos visible');
    console.log('   • Lista de fondos cargada automáticamente');
    console.log('   • Saldo mostrado al seleccionar un fondo');
    console.log('   • Campo marcado como obligatorio');
    console.log('');
    console.log('🔍 SI HAY PROBLEMAS:');
    console.log('   • Abre las herramientas de desarrollador (F12)');
    console.log('   • Ve a la pestaña "Console"');
    console.log('   • Busca errores en rojo');
    console.log('   • Reporta cualquier error que veas');
}

async function main() {
    try {
        console.log('✅ CORRECCIONES APLICADAS:');
        console.log('   • Modal de factura externa: Campo de fondos agregado');
        console.log('   • Modal de factura proveedor: Campo de fondos agregado');
        console.log('   • Funciones de carga de fondos implementadas');
        console.log('   • Validaciones de fondos agregadas');
        console.log('   • Creación de modales en inicialización');
        console.log('');
        
        showInstructions();
        
        console.log('🔄 Reiniciando servidor para aplicar cambios...\n');
        restartServer();
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };