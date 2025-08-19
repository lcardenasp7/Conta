#!/usr/bin/env node

/**
 * Test the balance endpoint that the dashboard uses
 */

const http = require('http');

console.log('🔍 Testing balance endpoint for dashboard...');

// Test the balance endpoint
const testBalanceEndpoint = () => {
    return new Promise((resolve, reject) => {
        const startDate = '2024-01-01';
        const endDate = '2024-12-31';
        const path = `/api/reports/balance?startDate=${startDate}&endDate=${endDate}`;
        
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
                console.log(`📊 Balance endpoint status: ${res.statusCode}`);
                
                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        console.log('✅ Balance endpoint working correctly');
                        console.log('📈 Response structure:', Object.keys(response));
                        if (response.summary) {
                            console.log('💰 Summary data available:', Object.keys(response.summary));
                        }
                        resolve(true);
                    } catch (error) {
                        console.log('⚠️ Response parsing error:', error.message);
                        console.log('📄 Raw response:', data);
                        resolve(false);
                    }
                } else {
                    console.log('❌ Balance endpoint error:', res.statusCode);
                    console.log('📄 Response:', data);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log('🔌 Connection error:', error.message);
            console.log('💡 Make sure the server is running on port 3000');
            resolve(false);
        });

        req.setTimeout(5000, () => {
            console.log('⏱️ Request timeout - server might be slow or not responding');
            req.destroy();
            resolve(false);
        });

        req.end();
    });
};

// Main test function
const runTest = async () => {
    console.log('🚀 Starting balance endpoint test...\n');
    
    const balanceWorking = await testBalanceEndpoint();
    
    console.log('\n📋 Test Results:');
    console.log('================');
    
    if (balanceWorking) {
        console.log('✅ Balance endpoint is working');
        console.log('💡 The financial dashboard should now load properly');
        console.log('🌐 Try accessing: http://localhost:3000');
        console.log('📊 Navigate to "Dashboard Financiero" section');
    } else {
        console.log('❌ Balance endpoint has issues');
        console.log('🔧 Check server logs for errors');
        console.log('🔄 Try restarting the server');
    }
    
    console.log('\n🎯 Next steps:');
    console.log('1. Open your browser and go to http://localhost:3000');
    console.log('2. Navigate to "Dashboard Financiero"');
    console.log('3. Check browser console - no more syntax errors should appear');
    console.log('4. The dashboard should load with financial data');
};

runTest().catch(console.error);