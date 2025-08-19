/**
 * REINICIO Y PRUEBA FINAL DE PRÉSTAMOS ENTRE FONDOS
 */

const { spawn } = require('child_process');
const http = require('http');

console.log('🔄 REINICIANDO SERVIDOR Y PROBANDO PRÉSTAMOS...');

// 1. Matar procesos Node.js existentes
const killProcess = spawn('taskkill', ['/F', '/IM', 'node.exe'], { shell: true });

killProcess.on('close', (code) => {
  console.log('🛑 Procesos Node.js terminados');
  
  // 2. Esperar un momento y luego iniciar el servidor
  setTimeout(() => {
    console.log('🚀 Iniciando servidor...');
    
    const server = spawn('npm', ['start'], { 
      shell: true,
      stdio: 'pipe'
    });

    let serverReady = false;

    server.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      if (output.includes('Server running on port 3000') && !serverReady) {
        serverReady = true;
        console.log('✅ Servidor iniciado correctamente');
        
        // 3. Probar el endpoint después de que el servidor esté listo
        setTimeout(() => {
          testLoansEndpoint();
        }, 2000);
      }
    });

    server.stderr.on('data', (data) => {
      console.error('Error del servidor:', data.toString());
    });

  }, 2000);
});

function testLoansEndpoint() {
  console.log('🧪 PROBANDO ENDPOINT /api/funds/loans...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/funds/loans?page=1&limit=20',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`📊 Status: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        console.log('✅ ÉXITO - Endpoint funcionando correctamente');
        console.log(`📋 Préstamos obtenidos: ${response.loans?.length || 0}`);
        console.log('🎯 SOLUCIÓN COMPLETADA');
        console.log('');
        console.log('🔗 Ahora puedes ir a:');
        console.log('   http://localhost:3000');
        console.log('   → Iniciar sesión');
        console.log('   → Gestión de Fondos');
        console.log('   → Préstamos entre Fondos');
      } else {
        console.log('❌ Error:', data);
        console.log('🔧 Verifica que el servidor esté funcionando correctamente');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error conectando al servidor:', error.message);
    console.log('⏳ El servidor puede estar iniciando aún, espera unos segundos más');
  });

  req.end();
}

// Manejar cierre del script
process.on('SIGINT', () => {
  console.log('\n🛑 Script interrumpido');
  process.exit(0);
});