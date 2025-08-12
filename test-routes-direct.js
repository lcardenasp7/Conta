// Test script to verify routes are working
const fetch = require('node-fetch');

async function testRoutes() {
    const baseUrl = 'http://localhost:3000/api';
    
    // Test routes
    const routes = [
        '/events',
        '/events/assignments/all',
        '/events/payments/all',
        '/students',
        '/grades',
        '/groups'
    ];
    
    console.log('🧪 Testing API routes...\n');
    
    for (const route of routes) {
        try {
            const response = await fetch(`${baseUrl}${route}`, {
                headers: {
                    'Authorization': 'Bearer test-token' // This might fail but we'll see the route response
                }
            });
            
            console.log(`${route}: ${response.status} ${response.statusText}`);
            
            if (response.status === 404) {
                console.log(`❌ Route not found: ${route}`);
            } else if (response.status === 401) {
                console.log(`✅ Route exists but requires auth: ${route}`);
            } else {
                console.log(`✅ Route accessible: ${route}`);
            }
            
        } catch (error) {
            console.log(`❌ Error testing ${route}:`, error.message);
        }
    }
}

testRoutes().catch(console.error);