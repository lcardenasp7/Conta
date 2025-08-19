#!/usr/bin/env node

/**
 * Restart server and test dashboard fix
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Restarting server to apply dashboard fixes...');

// Kill any existing server processes
const killProcess = spawn('taskkill', ['/F', '/IM', 'node.exe'], { stdio: 'inherit' });

killProcess.on('close', (code) => {
    console.log('🛑 Previous server processes terminated');
    
    // Wait a moment then start the server
    setTimeout(() => {
        console.log('🚀 Starting server with fixed dashboard...');
        
        const server = spawn('node', ['server.js'], {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
        
        server.on('error', (error) => {
            console.error('❌ Error starting server:', error.message);
        });
        
        // Give the server time to start
        setTimeout(() => {
            console.log('\n✅ Server should be running now!');
            console.log('🌐 Open http://localhost:3000 in your browser');
            console.log('📊 Navigate to "Dashboard Financiero" to test the fix');
            console.log('💡 The syntax error should be resolved and the dashboard should load properly');
            console.log('\n🔍 Check the browser console - you should no longer see:');
            console.log('   "Uncaught SyntaxError: Invalid or unexpected token"');
        }, 3000);
        
    }, 2000);
});