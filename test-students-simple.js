const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWRhZTg1OS00MzhhLTQ2ZTgtYjA0OC04MzIzZmY0YzJiMDIiLCJlbWFpbCI6InJlY3RvckB2aWxsYXNhbnBhYmxvLmVkdS5jbyIsInJvbGUiOiJSRUNUT1IiLCJpYXQiOjE3NTQ3MDg0NzgsImV4cCI6MTc1NDc5NDg3OH0.vcpNmC6HLOjwEMSc5lTddiUWycix0yBV_BjBcMfmE9U';

function testAPI(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
}

async function testStudentsAPI() {
    try {
        console.log('🧪 Testing students API...');
        
        const tests = [
            '/api/students?search=CARLOS&limit=5',
            '/api/students?search=carlos&limit=5',
            '/api/students?search=a&limit=10'
        ];
        
        for (const path of tests) {
            console.log(`\n📡 Testing: ${path}`);
            
            try {
                const result = await testAPI(path);
                
                if (result.status === 200) {
                    const students = result.data.students || [];
                    console.log(`✅ Success: Found ${students.length} students`);
                    if (students.length > 0) {
                        console.log('👥 First few:');
                        students.slice(0, 3).forEach(s => {
                            console.log(`  - ${s.firstName} ${s.lastName} (${s.document})`);
                        });
                    }
                } else {
                    console.log(`❌ Error ${result.status}:`, result.data);
                }
            } catch (error) {
                console.log(`❌ Request failed:`, error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ General error:', error.message);
    }
}

testStudentsAPI();