#!/usr/bin/env node

/**
 * Script para verificar que el sistema esté listo para Railway
 * y que no se suban datos de prueba
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 VERIFICACIÓN PARA DESPLIEGUE EN RAILWAY');
console.log('==========================================\n');

const issues = [];
const warnings = [];
const recommendations = [];

// 1. Verificar archivos de configuración
console.log('📋 1. VERIFICANDO CONFIGURACIÓN...');

// Verificar package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Verificar scripts de producción
if (packageJson.scripts.start === 'node server.js') {
    console.log('✅ Script de inicio correcto');
} else {
    issues.push('❌ Script de inicio debe ser "node server.js"');
}

if (packageJson.scripts.build === 'prisma generate') {
    console.log('✅ Script de build correcto');
} else {
    warnings.push('⚠️ Script de build recomendado: "prisma generate"');
}

// Verificar dependencias críticas
const criticalDeps = ['@prisma/client', 'express', 'jsonwebtoken', 'bcryptjs'];
const missingDeps = criticalDeps.filter(dep => !packageJson.dependencies[dep]);
if (missingDeps.length === 0) {
    console.log('✅ Dependencias críticas presentes');
} else {
    issues.push(`❌ Dependencias faltantes: ${missingDeps.join(', ')}`);
}

// 2. Verificar archivos de seed
console.log('\n📋 2. VERIFICANDO DATOS DE INICIALIZACIÓN...');

// Verificar que existe el seed de producción
if (fs.existsSync('scripts/railway-production-seed.js')) {
    console.log('✅ Script de seed de producción encontrado');
    
    const seedContent = fs.readFileSync('scripts/railway-production-seed.js', 'utf8');
    
    // Verificar que no contiene datos de prueba
    const testDataPatterns = [
        /sample.*student/i,
        /test.*data/i,
        /datos.*prueba/i,
        /estudiante.*prueba/i,
        /mock.*data/i
    ];
    
    const hasTestData = testDataPatterns.some(pattern => pattern.test(seedContent));
    if (!hasTestData) {
        console.log('✅ Seed de producción no contiene datos de prueba');
    } else {
        warnings.push('⚠️ El seed de producción podría contener datos de prueba');
    }
    
    // Verificar que solo crea datos esenciales
    if (seedContent.includes('Solo datos esenciales para producción')) {
        console.log('✅ Seed configurado para datos esenciales únicamente');
    } else {
        warnings.push('⚠️ Verificar que el seed solo cree datos esenciales');
    }
    
} else {
    issues.push('❌ Script de seed de producción no encontrado');
}

// 3. Verificar que no se ejecuten scripts de datos de prueba
console.log('\n📋 3. VERIFICANDO SCRIPTS DE DATOS DE PRUEBA...');

const testDataScripts = [
    'scripts/create-sample-events.js',
    'scripts/create-sample-invoices.js',
    'scripts/create-sample-payments.js',
    'scripts/create-sample-students.js'
];

const existingTestScripts = testDataScripts.filter(script => fs.existsSync(script));
if (existingTestScripts.length > 0) {
    console.log(`⚠️ Scripts de datos de prueba encontrados: ${existingTestScripts.length}`);
    existingTestScripts.forEach(script => {
        console.log(`   - ${script}`);
    });
    warnings.push('⚠️ Asegurar que estos scripts NO se ejecuten en producción');
} else {
    console.log('✅ No se encontraron scripts de datos de prueba');
}

// 4. Verificar configuración de entorno
console.log('\n📋 4. VERIFICANDO CONFIGURACIÓN DE ENTORNO...');

// Verificar .env.example
if (fs.existsSync('.env.example')) {
    console.log('✅ Archivo .env.example encontrado');
    
    const envExample = fs.readFileSync('.env.example', 'utf8');
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV', 'PORT'];
    
    const missingVars = requiredVars.filter(varName => !envExample.includes(varName));
    if (missingVars.length === 0) {
        console.log('✅ Variables de entorno requeridas en .env.example');
    } else {
        warnings.push(`⚠️ Variables faltantes en .env.example: ${missingVars.join(', ')}`);
    }
} else {
    warnings.push('⚠️ Archivo .env.example no encontrado');
}

// 5. Verificar archivos de documentación
console.log('\n📋 5. VERIFICANDO DOCUMENTACIÓN...');

const docFiles = ['README.md', 'RAILWAY_DEPLOYMENT.md'];
const existingDocs = docFiles.filter(doc => fs.existsSync(doc));

if (existingDocs.length === docFiles.length) {
    console.log('✅ Documentación completa');
} else {
    const missingDocs = docFiles.filter(doc => !existingDocs.includes(doc));
    warnings.push(`⚠️ Documentación faltante: ${missingDocs.join(', ')}`);
}

// 6. Verificar estructura de archivos críticos
console.log('\n📋 6. VERIFICANDO ESTRUCTURA DE ARCHIVOS...');

const criticalFiles = [
    'server.js',
    'prisma/schema.prisma',
    'public/index.html',
    'public/js/app.js'
];

const missingFiles = criticalFiles.filter(file => !fs.existsSync(file));
if (missingFiles.length === 0) {
    console.log('✅ Archivos críticos presentes');
} else {
    issues.push(`❌ Archivos críticos faltantes: ${missingFiles.join(', ')}`);
}

// 7. Verificar que no hay archivos de desarrollo
console.log('\n📋 7. VERIFICANDO ARCHIVOS DE DESARROLLO...');

const devFiles = [
    '.env',
    'node_modules',
    '*.log',
    'debug.log',
    'error.log'
];

// Solo verificar .env (los otros son normales)
if (fs.existsSync('.env')) {
    warnings.push('⚠️ Archivo .env presente - asegurar que no se suba a Railway');
}

// 8. Verificar configuración de Railway
console.log('\n📋 8. VERIFICANDO CONFIGURACIÓN DE RAILWAY...');

if (fs.existsSync('scripts/railway-setup.js')) {
    console.log('✅ Script de configuración de Railway encontrado');
} else {
    warnings.push('⚠️ Script de configuración de Railway no encontrado');
}

// RESUMEN FINAL
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN DE VERIFICACIÓN');
console.log('='.repeat(50));

if (issues.length === 0) {
    console.log('🎉 ¡SISTEMA LISTO PARA RAILWAY!');
} else {
    console.log('❌ PROBLEMAS CRÍTICOS ENCONTRADOS:');
    issues.forEach(issue => console.log(`   ${issue}`));
}

if (warnings.length > 0) {
    console.log('\n⚠️ ADVERTENCIAS:');
    warnings.forEach(warning => console.log(`   ${warning}`));
}

// RECOMENDACIONES PARA RAILWAY
console.log('\n📋 PASOS PARA DESPLEGAR EN RAILWAY:');
console.log('==================================');
console.log('1. 🗄️ Crear servicio PostgreSQL en Railway');
console.log('2. 🔧 Configurar variables de entorno:');
console.log('   - NODE_ENV=production');
console.log('   - JWT_SECRET=villas-san-pablo-super-secret-key-2024-railway-production');
console.log('   - JWT_EXPIRES_IN=24h');
console.log('3. 🚀 Conectar repositorio GitHub');
console.log('4. 📦 Railway ejecutará automáticamente:');
console.log('   - npm install');
console.log('   - npm run build (prisma generate)');
console.log('   - npm start');
console.log('5. 🌱 Ejecutar seed de producción:');
console.log('   - Usar Railway CLI: railway run node scripts/railway-production-seed.js');
console.log('   - O configurar como comando post-deploy');

console.log('\n🔒 DATOS QUE SE CREARÁN EN PRODUCCIÓN:');
console.log('====================================');
console.log('✅ Institución Educativa Villas de San Pablo');
console.log('✅ Usuario rector: rector@villasanpablo.edu.co');
console.log('✅ Usuario auxiliar: contabilidad@villasanpablo.edu.co');
console.log('✅ Grados y grupos académicos');
console.log('✅ Plan de cuentas contable básico');
console.log('✅ Sistema de fondos institucionales');
console.log('❌ NO se crearán estudiantes de prueba');
console.log('❌ NO se crearán facturas de prueba');
console.log('❌ NO se crearán pagos de prueba');

console.log('\n📚 DESPUÉS DEL DESPLIEGUE:');
console.log('=========================');
console.log('1. 👥 Importar estudiantes reales usando el sistema');
console.log('2. 🎯 Crear eventos académicos reales');
console.log('3. 🧾 Comenzar a generar facturas reales');
console.log('4. 💳 Registrar pagos reales');

if (issues.length === 0) {
    console.log('\n🚀 ¡LISTO PARA RAILWAY! El sistema está preparado para producción.');
    process.exit(0);
} else {
    console.log('\n❌ CORREGIR PROBLEMAS ANTES DE DESPLEGAR');
    process.exit(1);
}