/**
 * PRUEBA DIRECTA DE RUTAS DE FONDOS
 */

const http = require('http');

console.log('🧪 PROBANDO RUTAS DE FONDOS DIRECTAMENTE...');
console.log('⚠️  ASEGÚRATE DE QUE EL SERVIDOR ESTÉ CORRIENDO');

function testRoute(path, description) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Probando ${description}: ${path}`);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
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
          try {
            const response = JSON.parse(data);
            console.log(`✅ ${description} - FUNCIONANDO`);
            console.log(`📄 Respuesta:`, JSON.stringify(response, null, 2));
          } catch (e) {
            console.log(`✅ ${description} - Respuesta recibida:`, data);
          }
        } else {
          console.log(`❌ ${description} - Error ${res.statusCode}:`, data);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ${description} - Error de conexión:`, error.message);
      resolve();
    });

    req.end();
  });
}

async function runTests() {
  // Probar ruta de prueba
  await testRoute('/api/funds/test', 'Ruta de prueba');
  
  // Probar ruta de préstamos
  await testRoute('/api/funds/loans', 'Ruta de préstamos');
  
  // Probar con parámetros
  await testRoute('/api/funds/loans?page=1&limit=20', 'Ruta de préstamos con parámetros');
  
  console.log('\n🎯 PRUEBAS COMPLETADAS');
  console.log('Si las rutas funcionan, el problema está en el frontend o autenticación');
  console.log('Si no funcionan, hay un problema en el servidor');
}

runTests();