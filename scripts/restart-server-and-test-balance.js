#!/usr/bin/env node

/**
 * Restart server and test the balance endpoint
 */

const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🔄 Restarting server to test dashboard fix...');

// Function to kill existing node processes
const killExistingProcesses = () => {
    return new Promise((resolve) => {
        exec('taskkill /F /IM node.exe', (error) => {
            // Don't worry about errors - might not have any processes running
            console.log('🛑 Cleared any existing node processes');
            resolve();
        });
    });
};

// Function to start the server
const startServer = () => {
    return new Promise((resolve, reject) => {
        console.log('🚀 Starting server...');
        
        const server = spawn('node', ['server.js'], {
            cwd: path.join(__dirname, '..'),
            stdio: 'pipe'
        });
        
        let serverReady = false;
        
        server.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('📟 Server:', output.trim());
            
            // Look for server ready indicators
            if (output.includes('Server running') || output.includes('listening') || output.includes('3000')) {
                if (!serverReady) {
                    serverReady = true;
                    console.log('✅ Server appears to be ready');
                    resolve(server);
                }
            }
        });
        
        server.stderr.on('data', (data) => {
            console.log('⚠️ Server error:', data.toString().trim());
        });
        
        server.on('error', (error) => {
            console.error('❌ Failed to start server:', error.message);
            reject(error);
        });
        
        // Timeout if server doesn't start
        setTimeout(() => {
            if (!serverReady) {
                console.log('✅ Server should be ready now (timeout reached)');
                resolve(server);
            }
        }, 5000);
    });
};

// Function to test the balance endpoint
const testBalance = () => {
    return new Promise((resolve) => {
        console.log('🧪 Testing balance endpoint...');
        
        const testProcess = spawn('node', ['scripts/test-balance-endpoint-fix.js'], {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit'
        });
        
        testProcess.on('close', (code) => {
            resolve(code === 0);
        });
    });
};

// Main execution
const main = async () => {
    try {
        // Step 1: Kill existing processes
        await killExistingProcesses();
        
        // Step 2: Wait a moment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 3: Start server
        const server = await startServer();
        
        // Step 4: Wait for server to fully initialize
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Step 5: Test the balance endpoint
        const testPassed = await testBalance();
        
        console.log('\n🎯 Summary:');
        console.log('===========');
        
        if (testPassed) {
            console.log('✅ Server restarted successfully');
            console.log('✅ Balance endpoint is working');
            console.log('✅ Financial dashboard should be fixed');
            console.log('\n🌐 Open http://localhost:3000 and test the Dashboard Financiero');
        } else {
            console.log('❌ Some issues detected');
            console.log('🔧 Check the server logs above for details');
        }
        
        console.log('\n💡 Server is running in the background');
        console.log('🛑 Press Ctrl+C to stop the server when done testing');
        
        // Keep the process alive to maintain the server
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down server...');
            server.kill();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Error during restart and test:', error.message);
        process.exit(1);
    }
};

main();