/**
 * Script para reiniciar el servidor y probar las correcciones de factura
 */

const { spawn } = require('child_process');
const path = require('path');

async function restartAndTestInvoice() {
    console.log('🔄 Reiniciando servidor con correcciones de factura...');

    try {
        // Ejecutar el script de prueba primero
        console.log('🧪 Ejecutando prueba de factura corregida...');
        
        const testProcess = spawn('node', ['scripts/test-corrected-half-page-invoice.js'], {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        await new Promise((resolve, reject) => {
            testProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Prueba de factura completada exitosamente');
                    resolve();
                } else {
                    reject(new Error(`Prueba falló con código: ${code}`));
                }
            });
        });

        // Reiniciar el servidor
        console.log('🚀 Reiniciando servidor...');
        
        const serverProcess = spawn('node', ['restart-server.js'], {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        console.log('✅ Servidor reiniciado con las correcciones aplicadas');
        console.log('');
        console.log('📋 Correcciones implementadas en la factura:');
        console.log('   ✓ Formato media hoja carta (8.5" x 5.5")');
        console.log('   ✓ Una sola página (no más 3 páginas)');
        console.log('   ✓ QR movido al header junto al número de factura');
        console.log('   ✓ Sin superposición del nombre con datos de abajo');
        console.log('   ✓ Precios dentro del margen (no se salen)');
        console.log('   ✓ Texto del resumen fiscal sin superposición con líneas');
        console.log('   ✓ Espaciado optimizado entre todas las secciones');
        console.log('   ✓ Tamaños de fuente ajustados para mejor legibilidad');
        console.log('');
        console.log('🌐 Servidor disponible en: http://localhost:3000');
        console.log('📄 Puedes probar las facturas desde el panel de administración');

    } catch (error) {
        console.error('❌ Error durante el reinicio:', error);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    restartAndTestInvoice()
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = restartAndTestInvoice;