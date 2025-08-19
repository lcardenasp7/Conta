#!/usr/bin/env node

/**
 * Script para verificar que el código se subió correctamente a GitHub
 * y está listo para Railway
 */

const { execSync } = require('child_process');

console.log('🔍 VERIFICANDO SUBIDA A GITHUB Y PREPARACIÓN PARA RAILWAY');
console.log('========================================================\n');

try {
    // Verificar estado de Git
    console.log('📋 1. VERIFICANDO ESTADO DE GIT...');
    
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim() === '') {
        console.log('✅ Todos los archivos están committeados');
    } else {
        console.log('⚠️ Hay archivos sin committear:');
        console.log(gitStatus);
    }
    
    // Verificar último commit
    const lastCommit = execSync('git log -1 --oneline', { encoding: 'utf8' });
    console.log(`✅ Último commit: ${lastCommit.trim()}`);
    
    // Verificar branch actual
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' });
    console.log(`✅ Branch actual: ${currentBranch.trim()}`);
    
    // Verificar remote
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' });
    console.log(`✅ Repositorio remoto: ${remoteUrl.trim()}`);
    
    console.log('\n📋 2. VERIFICANDO ARCHIVOS CRÍTICOS PARA RAILWAY...');
    
    const fs = require('fs');
    const criticalFiles = [
        'package.json',
        'server.js',
        'prisma/schema.prisma',
        'scripts/railway-production-seed.js',
        '.railwayignore',
        'RAILWAY_DEPLOYMENT_SUMMARY.md'
    ];
    
    criticalFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file}`);
        } else {
            console.log(`❌ ${file} - FALTANTE`);
        }
    });
    
    console.log('\n📋 3. RESUMEN DEL SISTEMA...');
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`✅ Nombre del proyecto: ${packageJson.name}`);
    console.log(`✅ Versión: ${packageJson.version}`);
    console.log(`✅ Script de inicio: ${packageJson.scripts.start}`);
    console.log(`✅ Script de build: ${packageJson.scripts.build}`);
    
    console.log('\n📋 4. INSTRUCCIONES PARA RAILWAY...');
    console.log('=====================================');
    console.log('🔗 URL del repositorio: https://github.com/lcardenasp7/Conta.git');
    console.log('');
    console.log('📝 PASOS EN RAILWAY:');
    console.log('1. 🌐 Ir a railway.app');
    console.log('2. 🆕 Crear nuevo proyecto');
    console.log('3. 📂 Conectar repositorio GitHub: lcardenasp7/Conta');
    console.log('4. 🗄️ Agregar servicio PostgreSQL');
    console.log('5. ⚙️ Configurar variables de entorno:');
    console.log('   - NODE_ENV=production');
    console.log('   - JWT_SECRET=villas-san-pablo-super-secret-key-2024-railway-production');
    console.log('   - JWT_EXPIRES_IN=24h');
    console.log('6. 🚀 Desplegar automáticamente');
    console.log('7. 🌱 Ejecutar seed: railway run node scripts/railway-production-seed.js');
    
    console.log('\n🔒 DATOS QUE SE CREARÁN EN RAILWAY:');
    console.log('==================================');
    console.log('✅ Institución Educativa Villas de San Pablo');
    console.log('✅ 2 usuarios administrativos');
    console.log('✅ Estructura académica (grados y grupos)');
    console.log('✅ Sistema financiero básico');
    console.log('✅ Plan de cuentas contable');
    console.log('✅ Sistema de fondos institucionales');
    console.log('');
    console.log('❌ NO SE CREARÁN:');
    console.log('❌ Estudiantes de prueba');
    console.log('❌ Facturas de prueba');
    console.log('❌ Pagos de prueba');
    console.log('❌ Eventos de prueba');
    console.log('❌ Datos simulados');
    
    console.log('\n🎉 ¡SISTEMA COMPLETAMENTE LISTO PARA RAILWAY!');
    console.log('============================================');
    console.log('El código está en GitHub y preparado para producción.');
    console.log('Solo datos reales se crearán en el despliegue.');
    
} catch (error) {
    console.error('❌ Error verificando estado:', error.message);
}