// Script para probar las rutas de pagos en la consola del navegador
// Ejecutar después de reiniciar el servidor

console.log('🧪 Testing Payment Routes...');

// Función para probar las rutas de pagos
async function testPaymentRoutes() {
    try {
        console.log('📋 Testing payment endpoints...');
        
        // Test 1: Obtener todos los pagos
        console.log('1️⃣ Testing GET /api/payments...');
        const response1 = await fetch('/api/payments', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response1.ok) {
            const payments = await response1.json();
            console.log('✅ GET /api/payments - Success:', payments.payments?.length || 0, 'payments found');
        } else {
            console.log('❌ GET /api/payments - Failed:', response1.status, response1.statusText);
        }
        
        // Test 2: Obtener pagos de un evento específico
        console.log('2️⃣ Testing GET /api/events/:id/payments...');
        const eventId = '502cc82b-1deb-4101-92a8-4e87614e9e35'; // ID del evento actual
        const response2 = await fetch(`/api/events/${eventId}/payments`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response2.ok) {
            const eventPayments = await response2.json();
            console.log('✅ GET /api/events/:id/payments - Success:', eventPayments.length, 'payments found');
            
            // Test 3: Probar DELETE con un pago real (si existe)
            if (eventPayments.length > 0) {
                const testPaymentId = eventPayments[0].id;
                console.log('3️⃣ Testing DELETE /api/payments/:id availability...');
                
                // Solo verificar que la ruta existe (no eliminar realmente)
                const response3 = await fetch(`/api/payments/${testPaymentId}`, {
                    method: 'OPTIONS',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('✅ DELETE endpoint check - Status:', response3.status);
                console.log('💡 Payment ID for testing:', testPaymentId);
            }
        } else {
            console.log('❌ GET /api/events/:id/payments - Failed:', response2.status, response2.statusText);
        }
        
        console.log('\n🎉 Route testing completed!');
        console.log('💡 Now try deleting a payment through the UI');
        
    } catch (error) {
        console.error('❌ Error testing routes:', error);
    }
}

// Función para verificar el estado del servidor
async function checkServerStatus() {
    try {
        const response = await fetch('/api/payments', {
            method: 'HEAD',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok || response.status === 401) {
            console.log('✅ Server is running and payment routes are loaded');
            return true;
        } else {
            console.log('❌ Server or routes not ready:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ Server not reachable:', error.message);
        return false;
    }
}

// Ejecutar pruebas
console.log('🔍 Checking server status...');
checkServerStatus().then(isReady => {
    if (isReady) {
        testPaymentRoutes();
    } else {
        console.log('⚠️ Server not ready. Please restart the server and try again.');
    }
});

// Exponer funciones para uso manual
window.testPaymentRoutes = testPaymentRoutes;
window.checkServerStatus = checkServerStatus;

console.log('\n💡 Available functions:');
console.log('- testPaymentRoutes() - Test all payment endpoints');
console.log('- checkServerStatus() - Check if server is ready');