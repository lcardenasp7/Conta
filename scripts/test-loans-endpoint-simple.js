/**
 * PRUEBA SIMPLE DEL ENDPOINT DE PRÉSTAMOS
 */

const http = require('http');

console.log('🧪 PROBANDO ENDPOINT /api/funds/loans...');
console.log('⚠️  ASEGÚRATE DE QUE EL SERVIDOR ESTÉ CORRIENDO (npm start)');

function testEndpoint() {
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
      console.log(`📊 Status Code: ${res.statusCode}`);
      console.log(`📋 Response Headers:`, res.headers);
      
      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          console.log('✅ ÉXITO - Endpoint funcionando correctamente');
          console.log(`📋 Préstamos obtenidos: ${response.loans?.length || 0}`);
          console.log('📄 Datos:', JSON.stringify(response, null, 2));
        } catch (e) {
          console.log('✅ Respuesta recibida pero no es JSON válido:', data);
        }
      } else {
        console.log('❌ Error Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error conectando al servidor:', error.message);
    console.log('🔧 Verifica que el servidor esté corriendo en puerto 3000');
    console.log('📋 Ejecuta: npm start');
  });

  req.end();
}

// Probar inmediatamente
testEndpoint();

// Probar cada 5 segundos hasta que funcione
const interval = setInterval(() => {
  console.log('\n🔄 Reintentando...');
  testEndpoint();
}, 5000);

// Detener después de 30 segundos
setTimeout(() => {
  clearInterval(interval);
  console.log('\n⏰ Tiempo agotado. Verifica manualmente el servidor.');
  process.exit(0);
}, 30000);