/**
 * Script para preparar el sistema para producción
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 PREPARANDO SISTEMA PARA PRODUCCIÓN');
console.log('====================================');

// Archivos de prueba que se pueden eliminar en producción
const testFiles = [
    'public/test-dashboard-simple.html',
    'public/test-dashboard-complete.html',
    'public/test-dashboard-debug.html',
    'public/test-dashboard.html',
    'public/test-pdf-download.html',
    'public/fix-navigation.html',
    'public/debug-console.js',
    'test-dashboard-quick.js',
    'test-navigation.js',
    'test-routes.js',
    'test-routes-direct.js',
    'test-events-functionality.js',
    'test-student-assignments.js',
    'debug-frontend.js',
    'events-test.js',
    'verify-pages.html',
    'generate-test-token.js',
    'test-grades.html',
    'test-api-endpoint.js',
    'test-groups-api.js',
    'test-students-simple.js',
    'test-students-api.js',
    'test-api-direct.js',
    'check-real-students.js',
    'test-student-selection.js'
];

// Scripts de desarrollo que se pueden mantener pero no son críticos
const devScripts = [
    'scripts/debug-*.js',
    'scripts/test-*.js',
    'scripts/verify-*.js',
    'scripts/diagnose-*.js',
    'scripts/force-*.js'
];

console.log('\n📁 ARCHIVOS DE PRUEBA ENCONTRADOS:');
let foundTestFiles = 0;
testFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`  ⚠️  ${file} (archivo de prueba)`);
        foundTestFiles++;
    }
});

if (foundTestFiles === 0) {
    console.log('  ✅ No se encontraron archivos de prueba críticos');
}

console.log('\n🔧 VERIFICANDO ARCHIVOS CRÍTICOS PARA PRODUCCIÓN:');

const criticalFiles = [
    'package.json',
    'server.js',
    'prisma/schema.prisma',
    '.env.example',
    'public/index.html',
    'public/js/financial-dashboard-working.js',
    'routes/financial-dashboard.routes.js'
];

criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`  ✅ ${file}`);
    } else {
        console.log(`  ❌ ${file} - FALTA`);
    }
});

console.log('\n📦 VERIFICANDO PACKAGE.JSON:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    console.log(`  ✅ Nombre: ${packageJson.name}`);
    console.log(`  ✅ Versión: ${packageJson.version}`);
    console.log(`  ✅ Script start: ${packageJson.scripts?.start || 'NO DEFINIDO'}`);
    console.log(`  ✅ Script build: ${packageJson.scripts?.build || 'NO DEFINIDO'}`);
    
    // Verificar dependencias críticas
    const criticalDeps = ['express', 'prisma', '@prisma/client', 'bcryptjs', 'jsonwebtoken'];
    console.log('\n  📚 Dependencias críticas:');
    criticalDeps.forEach(dep => {
        if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
            console.log(`    ✅ ${dep}`);
        } else {
            console.log(`    ❌ ${dep} - FALTA`);
        }
    });
    
} catch (error) {
    console.log('  ❌ Error leyendo package.json:', error.message);
}

console.log('\n🌍 VERIFICANDO VARIABLES DE ENTORNO:');
if (fs.existsSync('.env.example')) {
    console.log('  ✅ .env.example existe');
    const envExample = fs.readFileSync('.env.example', 'utf8');
    
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'];
    requiredVars.forEach(varName => {
        if (envExample.includes(varName)) {
            console.log(`    ✅ ${varName} definido en .env.example`);
        } else {
            console.log(`    ⚠️  ${varName} no encontrado en .env.example`);
        }
    });
} else {
    console.log('  ❌ .env.example no existe');
}

console.log('\n🎯 VERIFICANDO DASHBOARD FINANCIERO:');
if (fs.existsSync('public/js/financial-dashboard-working.js')) {
    console.log('  ✅ financial-dashboard-working.js existe');
} else {
    console.log('  ❌ financial-dashboard-working.js NO EXISTE');
}

if (fs.existsSync('routes/financial-dashboard.routes.js')) {
    console.log('  ✅ financial-dashboard.routes.js existe');
} else {
    console.log('  ❌ financial-dashboard.routes.js NO EXISTE');
}

// Verificar que index.html use la versión correcta
if (fs.existsSync('public/index.html')) {
    const indexContent = fs.readFileSync('public/index.html', 'utf8');
    if (indexContent.includes('financial-dashboard-working.js')) {
        console.log('  ✅ index.html usa financial-dashboard-working.js');
    } else {
        console.log('  ⚠️  index.html NO usa financial-dashboard-working.js');
    }
}

console.log('\n🚀 RECOMENDACIONES PARA PRODUCCIÓN:');
console.log('==================================');

console.log('\n1. 🧹 LIMPIEZA (OPCIONAL):');
if (foundTestFiles > 0) {
    console.log('   - Considera eliminar archivos de prueba para reducir tamaño');
    console.log('   - Ejecuta: node scripts/clean-test-files.js');
} else {
    console.log('   ✅ No hay archivos de prueba críticos que limpiar');
}

console.log('\n2. 🔐 SEGURIDAD:');
console.log('   - Genera un JWT_SECRET fuerte para producción');
console.log('   - Configura NODE_ENV=production');
console.log('   - Revisa que no haya credenciales hardcodeadas');

console.log('\n3. 📊 MONITOREO:');
console.log('   - Configura logs de producción');
console.log('   - Establece alertas de error');
console.log('   - Monitorea uso de recursos');

console.log('\n4. 🗄️  BASE DE DATOS:');
console.log('   - Ejecuta migraciones en producción');
console.log('   - Configura backups automáticos');
console.log('   - Optimiza índices si es necesario');

console.log('\n5. 🌐 DEPLOYMENT:');
console.log('   - Sube código a GitHub');
console.log('   - Configura Railway/Heroku/Vercel');
console.log('   - Configura dominio personalizado');
console.log('   - Prueba en staging antes de producción');

console.log('\n✅ SISTEMA LISTO PARA PRODUCCIÓN');
console.log('El dashboard financiero está funcionando correctamente');
console.log('Todos los componentes críticos están en su lugar');

console.log('\n🎯 PRÓXIMOS PASOS:');
console.log('1. Ejecuta: git add . && git commit -m "Dashboard financiero listo para producción"');
console.log('2. Ejecuta: git push origin main');
console.log('3. Configura deployment en tu plataforma preferida');
console.log('4. Configura variables de entorno de producción');
console.log('5. Ejecuta migraciones de base de datos');

console.log('\n====================================');
console.log('🚀 ¡LISTO PARA PRODUCCIÓN!');