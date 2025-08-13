#!/usr/bin/env node

/**
 * Script para diagnosticar problemas en la página de institución
 */

console.log('🔍 Diagnóstico de la Página de Institución\n');

const fs = require('fs');
const path = require('path');

// Check required files
const requiredFiles = [
    'public/js/institution.js',
    'public/js/api.js',
    'public/js/app.js',
    'public/index.html',
    'routes/institution.routes.js',
    'public/uploads'
];

console.log('📁 Verificando archivos requeridos...');
requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - FALTANTE`);
    }
});

// Check if institution.js is loaded in index.html
console.log('\n📜 Verificando carga de scripts...');
const indexPath = path.join(__dirname, '..', 'public', 'index.html');
if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    if (indexContent.includes('js/institution.js')) {
        console.log('✅ institution.js está cargado en index.html');
    } else {
        console.log('❌ institution.js NO está cargado en index.html');
    }
    
    if (indexContent.includes('js/api.js')) {
        console.log('✅ api.js está cargado en index.html');
    } else {
        console.log('❌ api.js NO está cargado en index.html');
    }
}

// Check institution template in app.js
console.log('\n🎨 Verificando template de institución...');
const appPath = path.join(__dirname, '..', 'public', 'js', 'app.js');
if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, 'utf8');
    
    if (appContent.includes('institution:')) {
        console.log('✅ Template de institución definido en app.js');
    } else {
        console.log('❌ Template de institución NO definido en app.js');
    }
    
    if (appContent.includes("case 'institution':")) {
        console.log('✅ Caso de institución en initializePage');
    } else {
        console.log('❌ Caso de institución NO en initializePage');
    }
}

// Check API endpoints
console.log('\n🌐 Verificando endpoints de API...');
const routesPath = path.join(__dirname, '..', 'routes', 'institution.routes.js');
if (fs.existsSync(routesPath)) {
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    
    const endpoints = [
        "router.get('/', authenticateToken",
        "router.post('/', authenticateToken",
        "router.post('/logo', authenticateToken",
        "router.delete('/logo', authenticateToken",
        "router.get('/logo'"
    ];
    
    endpoints.forEach(endpoint => {
        if (routesContent.includes(endpoint)) {
            console.log(`✅ ${endpoint.split(',')[0]})`);
        } else {
            console.log(`❌ ${endpoint.split(',')[0]}) - FALTANTE`);
        }
    });
}

// Check server.js for route registration
console.log('\n🖥️  Verificando registro de rutas...');
const serverPath = path.join(__dirname, '..', 'server.js');
if (fs.existsSync(serverPath)) {
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    if (serverContent.includes("/api/institution")) {
        console.log('✅ Ruta /api/institution registrada en server.js');
    } else {
        console.log('❌ Ruta /api/institution NO registrada en server.js');
    }
}

// Check uploads directory
console.log('\n📁 Verificando directorio de uploads...');
const uploadsPath = path.join(__dirname, '..', 'public', 'uploads');
if (fs.existsSync(uploadsPath)) {
    console.log('✅ Directorio public/uploads existe');
    
    // Check permissions (basic check)
    try {
        const testFile = path.join(uploadsPath, 'test.txt');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        console.log('✅ Directorio public/uploads tiene permisos de escritura');
    } catch (error) {
        console.log('❌ Directorio public/uploads SIN permisos de escritura');
    }
} else {
    console.log('❌ Directorio public/uploads NO existe');
    console.log('   Ejecuta: mkdir public/uploads');
}

console.log('\n🎯 Resumen del diagnóstico:');
console.log('   Si todos los elementos están ✅, la página debería funcionar');
console.log('   Si hay elementos ❌, revisa los archivos correspondientes');

console.log('\n🚀 Para probar la funcionalidad:');
console.log('   1. Asegúrate de que el servidor esté ejecutándose');
console.log('   2. Ve a http://localhost:3000');
console.log('   3. Inicia sesión');
console.log('   4. Ve a Configuración → Institución');
console.log('   5. Deberías ver el formulario completo');

console.log('\n🔧 Si hay problemas:');
console.log('   • Reinicia el servidor: npm start');
console.log('   • Recarga la página: F5');
console.log('   • Revisa la consola del navegador: F12');
console.log('   • Ejecuta: node scripts/test-institution-api.js <token>');