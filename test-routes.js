// Script para probar las rutas de eventos

const testRoutes = async () => {
    const baseUrl = 'http://localhost:3000/api';
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    console.log('🧪 Testing Event Routes...');
    
    // Test basic events route
    try {
        const eventsResponse = await fetch(`${baseUrl}/events`, { headers });
        console.log('✅ /api/events:', eventsResponse.status);
    } catch (error) {
        console.error('❌ /api/events:', error.message);
    }

    // Test assignments/all route
    try {
        const assignmentsResponse = await fetch(`${baseUrl}/events/assignments/all`, { headers });
        console.log('✅ /api/events/assignments/all:', assignmentsResponse.status);
        
        if (assignmentsResponse.ok) {
            const data = await assignmentsResponse.json();
            console.log('📊 Assignments data:', data.length, 'records');
        } else {
            const error = await assignmentsResponse.text();
            console.error('❌ Assignments error:', error);
        }
    } catch (error) {
        console.error('❌ /api/events/assignments/all:', error.message);
    }

    // Test payments/all route
    try {
        const paymentsResponse = await fetch(`${baseUrl}/events/payments/all`, { headers });
        console.log('✅ /api/events/payments/all:', paymentsResponse.status);
        
        if (paymentsResponse.ok) {
            const data = await paymentsResponse.json();
            console.log('📊 Payments data:', data.length, 'records');
        } else {
            const error = await paymentsResponse.text();
            console.error('❌ Payments error:', error);
        }
    } catch (error) {
        console.error('❌ /api/events/payments/all:', error.message);
    }
};

// Ejecutar pruebas
if (typeof window !== 'undefined') {
    window.testRoutes = testRoutes;
    console.log('💡 Run testRoutes() in console to test the routes');
} else {
    testRoutes();
}