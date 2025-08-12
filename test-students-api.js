const fetch = require('node-fetch');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWRhZTg1OS00MzhhLTQ2ZTgtYjA0OC04MzIzZmY0YzJiMDIiLCJlbWFpbCI6InJlY3RvckB2aWxsYXNhbnBhYmxvLmVkdS5jbyIsInJvbGUiOiJSRUNUT1IiLCJpYXQiOjE3NTQ3MDg0NzgsImV4cCI6MTc1NDc5NDg3OH0.vcpNmC6HLOjwEMSc5lTddiUWycix0yBV_BjBcMfmE9U';

async function testStudentsAPI() {
    try {
        console.log('🧪 Testing students API...');
        
        const tests = [
            'search=CARLOS&limit=5',
            'search=carlos&limit=5', 
            'search=a&limit=10',
            'search=EDWIN&limit=5'
        ];
        
        for (const params of tests) {
            console.log(`\n📡 Testing: /api/students?${params}`);
            
            const response = await fetch(`http://localhost:3000/api/students?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log(`✅ Success: Found ${data.students?.length || 0} students`);
                if (data.students && data.students.length > 0) {
                    console.log('👥 First few:');
                    data.students.slice(0, 3).forEach(s => {
                        console.log(`  - ${s.firstName} ${s.lastName} (${s.document})`);
                    });
                }
            } else {
                console.log(`❌ Error ${response.status}:`, data);
            }
        }
        
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

testStudentsAPI();