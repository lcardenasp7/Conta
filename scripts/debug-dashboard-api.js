/**
 * Script para debuggear la API del dashboard financiero
 */

const fetch = require('node-fetch');

async function testFinancialDashboardAPI() {
    console.log('🔍 DEBUGGING API DEL DASHBOARD FINANCIERO');
    console.log('=========================================');

    const baseURL = 'http://localhost:3000';
    
    try {
        // Test 1: Verificar que el servidor responde
        console.log('\n1. 🌐 Verificando servidor...');
        const healthResponse = await fetch(`${baseURL}/api/health`);
        if (healthResponse.ok) {
            console.log('✅ Servidor respondiendo correctamente');
        } else {
            console.log('❌ Servidor no responde correctamente');
            return;
        }

        // Test 2: Verificar endpoint del dashboard financiero (sin auth)
        console.log('\n2. 📊 Probando endpoint del dashboard financiero...');
        const dashboardResponse = await fetch(`${baseURL}/api/financial-dashboard/overview?period=current-month`);
        
        console.log('Status:', dashboardResponse.status);
        console.log('Status Text:', dashboardResponse.statusText);
        
        if (dashboardResponse.status === 401) {
            console.log('⚠️ Endpoint requiere autenticación (esperado)');
            console.log('✅ Endpoint existe y está protegido correctamente');
        } else if (dashboardResponse.ok) {
            const data = await dashboardResponse.json();
            console.log('✅ Endpoint responde correctamente');
            console.log('📄 Datos recibidos:', JSON.stringify(data, null, 2));
        } else {
            console.log('❌ Error en endpoint:', dashboardResponse.status);
            const errorText = await dashboardResponse.text();
            console.log('Error details:', errorText);
        }

        // Test 3: Verificar rutas registradas
        console.log('\n3. 🛣️ Verificando rutas registradas...');
        console.log('Ruta esperada: /api/financial-dashboard/overview');
        
        // Test 4: Verificar datos de prueba en la base de datos
        console.log('\n4. 💾 Recomendaciones para datos de prueba:');
        console.log('- Crear algunos pagos de prueba');
        console.log('- Crear algunas facturas de prueba');
        console.log('- Verificar que hay estudiantes en la base de datos');

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error.message);
    }

    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('1. Verificar que el usuario esté autenticado en el navegador');
    console.log('2. Revisar la consola del navegador para errores específicos');
    console.log('3. Verificar que hay datos en la base de datos');
    console.log('4. Comprobar que las rutas del dashboard estén registradas');
}

// Función para crear datos de prueba
async function createTestData() {
    console.log('\n🧪 CREANDO DATOS DE PRUEBA');
    console.log('==========================');
    
    console.log('Para crear datos de prueba, ejecuta estos comandos en la consola del navegador:');
    console.log('');
    console.log('// Crear un pago de prueba');
    console.log('api.post("/payments", {');
    console.log('  studentId: 1, // ID de un estudiante existente');
    console.log('  amount: 150000,');
    console.log('  method: "CASH",');
    console.log('  date: new Date().toISOString(),');
    console.log('  reference: "PAGO-TEST-001"');
    console.log('});');
    console.log('');
    console.log('// Crear una factura de prueba');
    console.log('api.post("/invoices", {');
    console.log('  studentId: 1,');
    console.log('  concept: "MONTHLY",');
    console.log('  total: 180000,');
    console.log('  dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),');
    console.log('  items: [{ description: "Mensualidad", quantity: 1, unitPrice: 180000, total: 180000 }]');
    console.log('});');
}

// Ejecutar tests
testFinancialDashboardAPI().then(() => {
    createTestData();
});