// Script para reiniciar el servidor y verificar las rutas

const { exec } = require('child_process');
const path = require('path');

console.log('🔄 Restarting server to load new routes...');

// Función para ejecutar comandos
const runCommand = (command, description) => {
    return new Promise((resolve, reject) => {
        console.log(`\n📋 ${description}`);
        console.log(`💻 Running: ${command}`);
        
        exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Error: ${error.message}`);
                reject(error);
                return;
            }
            
            if (stderr) {
                console.warn(`⚠️ Warning: ${stderr}`);
            }
            
            if (stdout) {
                console.log(`✅ Output: ${stdout}`);
            }
            
            resolve(stdout);
        });
    });
};

// Función principal
async function restartServer() {
    try {
        // Verificar que estamos en el directorio correcto
        console.log('📁 Current directory:', __dirname);
        
        // Verificar archivos importantes
        const fs = require('fs');
        const importantFiles = [
            'server.js',
            'routes/event.routes.js',
            'package.json'
        ];
        
        console.log('\n📋 Checking important files:');
        importantFiles.forEach(file => {
            if (fs.existsSync(path.join(__dirname, file))) {
                console.log(`✅ ${file} exists`);
            } else {
                console.log(`❌ ${file} missing`);
            }
        });
        
        // Verificar las nuevas rutas en el archivo
        const eventRoutesPath = path.join(__dirname, 'routes/event.routes.js');
        if (fs.existsSync(eventRoutesPath)) {
            const content = fs.readFileSync(eventRoutesPath, 'utf8');
            if (content.includes('/assignments/all') && content.includes('/payments/all')) {
                console.log('✅ New routes found in event.routes.js');
            } else {
                console.log('❌ New routes not found in event.routes.js');
            }
        }
        
        console.log('\n🚀 Server should be restarted manually or automatically by your development environment');
        console.log('📝 New routes added:');
        console.log('   - GET /api/events/assignments/all');
        console.log('   - GET /api/events/payments/all');
        
        console.log('\n🧪 To test the routes after restart, run in browser console:');
        console.log('   testRoutes()');
        
    } catch (error) {
        console.error('❌ Error during restart process:', error);
    }
}

// Ejecutar
restartServer();