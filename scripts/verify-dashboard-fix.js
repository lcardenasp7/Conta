/**
 * Script de verificación del dashboard financiero
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN DEL DASHBOARD FINANCIERO');
console.log('==========================================');

// Verificar archivos necesarios
const requiredFiles = [
    'public/js/financial-dashboard-simple.js',
    'public/test-dashboard-simple.html',
    'test-dashboard-quick.js'
];

console.log('\n📁 Verificando archivos...');
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} - Existe`);
    } else {
        console.log(`❌ ${file} - No encontrado`);
    }
});

// Verificar contenido del archivo principal
console.log('\n🔧 Verificando contenido del dashboard...');
try {
    const dashboardContent = fs.readFileSync('public/js/financial-dashboard-simple.js', 'utf8');
    
    const checks = [
        { name: 'Función initFinancialDashboard', pattern: /function initFinancialDashboard/ },
        { name: 'Verificación de contentArea', pattern: /getElementById\('contentArea'\)/ },
        { name: 'Manejo de errores', pattern: /try\s*{[\s\S]*catch/ },
        { name: 'Verificación de elementos DOM', pattern: /if\s*\(\s*!.*Element\s*\)/ },
        { name: 'Renderizado de gráficos', pattern: /new Chart\(/ },
        { name: 'Formateo de moneda', pattern: /formatCurrency/ }
    ];
    
    checks.forEach(check => {
        if (check.pattern.test(dashboardContent)) {
            console.log(`✅ ${check.name} - Implementado`);
        } else {
            console.log(`❌ ${check.name} - No encontrado`);
        }
    });
    
} catch (error) {
    console.log('❌ Error leyendo archivo del dashboard:', error.message);
}

// Verificar archivo de prueba
console.log('\n🧪 Verificando archivo de prueba...');
try {
    const testContent = fs.readFileSync('public/test-dashboard-simple.html', 'utf8');
    
    const testChecks = [
        { name: 'Carga Chart.js', pattern: /chart\.js/ },
        { name: 'Carga Bootstrap', pattern: /bootstrap/ },
        { name: 'API simulada', pattern: /window\.API/ },
        { name: 'Funciones de utilidad', pattern: /showLoading|showError|hideLoading/ },
        { name: 'Carga dashboard simplificado', pattern: /financial-dashboard-simple\.js/ },
        { name: 'Elemento contentArea', pattern: /id="contentArea"/ }
    ];
    
    testChecks.forEach(check => {
        if (check.pattern.test(testContent)) {
            console.log(`✅ ${check.name} - Configurado`);
        } else {
            console.log(`❌ ${check.name} - No encontrado`);
        }
    });
    
} catch (error) {
    console.log('❌ Error leyendo archivo de prueba:', error.message);
}

console.log('\n🚀 INSTRUCCIONES DE PRUEBA:');
console.log('1. Ejecutar: node test-dashboard-quick.js');
console.log('2. Abrir navegador en: http://localhost:3000');
console.log('3. Verificar que el dashboard carga sin errores');
console.log('4. Comprobar que los gráficos se renderizan correctamente');

console.log('\n📊 ESTADO DEL DASHBOARD:');
if (fs.existsSync('public/js/financial-dashboard-simple.js') && 
    fs.existsSync('public/test-dashboard-simple.html')) {
    console.log('✅ Dashboard listo para pruebas');
} else {
    console.log('❌ Faltan archivos necesarios');
}

console.log('\n🔧 Si hay problemas:');
console.log('- Verificar que Chart.js se carga correctamente');
console.log('- Comprobar la consola del navegador para errores');
console.log('- Asegurar que el elemento contentArea existe');
console.log('- Verificar que las funciones globales están definidas');

console.log('\n==========================================');
console.log('✅ Verificación completada');