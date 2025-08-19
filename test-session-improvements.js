const { execSync } = require('child_process');

console.log('🔧 Probando mejoras de sesión...');

try {
    // Reiniciar servidor
    console.log('🔄 Reiniciando servidor...');
    
    // Matar procesos existentes de Node.js
    try {
        execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
        console.log('✅ Procesos anteriores terminados');
    } catch (error) {
        console.log('ℹ️ No hay procesos anteriores que terminar');
    }
    
    // Esperar un momento
    setTimeout(() => {
        console.log('🚀 Iniciando servidor con mejoras...');
        
        // Iniciar servidor
        const { spawn } = require('child_process');
        const server = spawn('node', ['server.js'], {
            stdio: 'inherit',
            detached: false
        });
        
        server.on('error', (error) => {
            console.error('❌ Error al iniciar servidor:', error);
        });
        
        console.log('\n🎉 ¡Servidor iniciado con mejoras de sesión!');
        console.log('\n📋 Mejoras implementadas:');
        console.log('✅ Fix del problema de refresh después del login');
        console.log('✅ Timeout de sesión por inactividad (30 minutos)');
        console.log('✅ Advertencia a los 25 minutos');
        console.log('✅ Indicador visual del tiempo restante');
        console.log('✅ Opción para extender sesión manualmente');
        console.log('✅ Detección de actividad del usuario');
        
        console.log('\n🔍 Para probar:');
        console.log('1. Abre http://localhost:3000');
        console.log('2. Inicia sesión');
        console.log('3. Verifica que los menús funcionen inmediatamente');
        console.log('4. Observa el contador de tiempo en la esquina superior derecha');
        console.log('5. Deja el sistema inactivo para probar el timeout');
        
        console.log('\n⏰ Configuración de tiempo:');
        console.log('- Sesión total: 30 minutos');
        console.log('- Advertencia: 25 minutos');
        console.log('- Tiempo crítico (rojo): últimos 5 minutos');
        console.log('- Tiempo de advertencia (amarillo): últimos 10 minutos');
        
    }, 2000);
    
} catch (error) {
    console.error('❌ Error:', error.message);
}