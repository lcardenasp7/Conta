#!/usr/bin/env node

/**
 * Script para verificar que el sistema esté listo para producción
 * Uso: node scripts/production-check.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runProductionCheck() {
    console.log('🔍 Verificando configuración para producción...\n');
    
    const checks = [];
    let criticalIssues = 0;
    let warnings = 0;
    
    // 1. Verificar variables de entorno críticas
    console.log('🔐 Verificando variables de entorno...');
    
    const requiredEnvVars = [
        { name: 'JWT_SECRET', critical: true },
        { name: 'DATABASE_URL', critical: true },
        { name: 'NODE_ENV', critical: false },
        { name: 'SMTP_USER', critical: false },
        { name: 'SMTP_PASS', critical: false }
    ];
    
    for (const envVar of requiredEnvVars) {
        const value = process.env[envVar.name];
        if (!value) {
            const issue = `❌ ${envVar.name} no está configurada`;
            console.log(issue);
            checks.push({ type: envVar.critical ? 'critical' : 'warning', message: issue });
            if (envVar.critical) criticalIssues++;
            else warnings++;
        } else {
            console.log(`✅ ${envVar.name} configurada`);
            
            // Verificaciones específicas
            if (envVar.name === 'JWT_SECRET') {
                if (value === 'your-secret-key-change-in-production' || value.length < 32) {
                    const issue = `⚠️  JWT_SECRET no es seguro para producción (muy corto o valor por defecto)`;
                    console.log(issue);
                    checks.push({ type: 'critical', message: issue });
                    criticalIssues++;
                }
            }
        }
    }
    
    // 2. Verificar conexión a base de datos
    console.log('\n💾 Verificando base de datos...');
    try {
        await prisma.$connect();
        console.log('✅ Conexión a base de datos exitosa');
        
        // Verificar que hay datos básicos
        const userCount = await prisma.user.count();
        const studentCount = await prisma.student.count();
        
        if (userCount === 0) {
            const issue = '⚠️  No hay usuarios en la base de datos';
            console.log(issue);
            checks.push({ type: 'warning', message: issue });
            warnings++;
        } else {
            console.log(`✅ ${userCount} usuarios encontrados`);
        }
        
        if (studentCount === 0) {
            const issue = '⚠️  No hay estudiantes en la base de datos';
            console.log(issue);
            checks.push({ type: 'warning', message: issue });
            warnings++;
        } else {
            console.log(`✅ ${studentCount} estudiantes encontrados`);
        }
        
    } catch (error) {
        const issue = `❌ Error de conexión a base de datos: ${error.message}`;
        console.log(issue);
        checks.push({ type: 'critical', message: issue });
        criticalIssues++;
    }
    
    // 3. Verificar archivos críticos
    console.log('\n📁 Verificando archivos críticos...');
    
    const criticalFiles = [
        'package.json',
        'server.js',
        'prisma/schema.prisma',
        'middleware/auth.middleware.js'
    ];
    
    for (const file of criticalFiles) {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} existe`);
        } else {
            const issue = `❌ Archivo crítico faltante: ${file}`;
            console.log(issue);
            checks.push({ type: 'critical', message: issue });
            criticalIssues++;
        }
    }
    
    // 4. Verificar configuración de package.json
    console.log('\n📦 Verificando package.json...');
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        if (packageJson.scripts && packageJson.scripts.start) {
            console.log('✅ Script de inicio configurado');
        } else {
            const issue = '❌ Script de inicio no configurado en package.json';
            console.log(issue);
            checks.push({ type: 'critical', message: issue });
            criticalIssues++;
        }
        
        // Verificar dependencias críticas
        const criticalDeps = ['express', 'prisma', '@prisma/client', 'jsonwebtoken'];
        for (const dep of criticalDeps) {
            if (packageJson.dependencies && packageJson.dependencies[dep]) {
                console.log(`✅ Dependencia ${dep} presente`);
            } else {
                const issue = `❌ Dependencia crítica faltante: ${dep}`;
                console.log(issue);
                checks.push({ type: 'critical', message: issue });
                criticalIssues++;
            }
        }
        
    } catch (error) {
        const issue = `❌ Error leyendo package.json: ${error.message}`;
        console.log(issue);
        checks.push({ type: 'critical', message: issue });
        criticalIssues++;
    }
    
    // 5. Verificar configuración de Railway
    console.log('\n🚂 Verificando configuración de Railway...');
    
    const railwayFiles = ['railway.json', 'nixpacks.toml', 'Procfile'];
    let railwayConfigFound = false;
    
    for (const file of railwayFiles) {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} configurado`);
            railwayConfigFound = true;
        }
    }
    
    if (!railwayConfigFound) {
        const issue = '⚠️  No se encontraron archivos de configuración de Railway';
        console.log(issue);
        checks.push({ type: 'warning', message: issue });
        warnings++;
    }
    
    // 6. Verificar configuración de seguridad
    console.log('\n🛡️  Verificando configuración de seguridad...');
    
    // Verificar que no hay archivos sensibles
    const sensitiveFiles = ['.env', 'node_modules'];
    const gitignoreExists = fs.existsSync('.gitignore');
    
    if (gitignoreExists) {
        console.log('✅ .gitignore existe');
        const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
        
        for (const file of sensitiveFiles) {
            if (gitignoreContent.includes(file)) {
                console.log(`✅ ${file} está en .gitignore`);
            } else {
                const issue = `⚠️  ${file} no está en .gitignore`;
                console.log(issue);
                checks.push({ type: 'warning', message: issue });
                warnings++;
            }
        }
    } else {
        const issue = '⚠️  .gitignore no existe';
        console.log(issue);
        checks.push({ type: 'warning', message: issue });
        warnings++;
    }
    
    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📋 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(60));
    
    if (criticalIssues === 0 && warnings === 0) {
        console.log('🎉 ¡PERFECTO! El sistema está listo para producción');
        console.log('✅ Todas las verificaciones pasaron exitosamente');
    } else {
        console.log(`❌ Problemas críticos: ${criticalIssues}`);
        console.log(`⚠️  Advertencias: ${warnings}`);
        
        if (criticalIssues > 0) {
            console.log('\n🚨 PROBLEMAS CRÍTICOS QUE DEBEN RESOLVERSE:');
            checks.filter(c => c.type === 'critical').forEach(check => {
                console.log(`   ${check.message}`);
            });
        }
        
        if (warnings > 0) {
            console.log('\n⚠️  ADVERTENCIAS (RECOMENDADO RESOLVER):');
            checks.filter(c => c.type === 'warning').forEach(check => {
                console.log(`   ${check.message}`);
            });
        }
        
        if (criticalIssues > 0) {
            console.log('\n❌ NO DESPLEGAR A PRODUCCIÓN hasta resolver problemas críticos');
            process.exit(1);
        } else {
            console.log('\n✅ Puede desplegarse a producción, pero revise las advertencias');
        }
    }
    
    console.log('\n📚 Para resolver problemas:');
    console.log('   - JWT_SECRET: node scripts/generate-jwt-secret.js');
    console.log('   - Base de datos: node scripts/optimize-database.js');
    console.log('   - Documentación: ver DEPLOYMENT.md');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runProductionCheck()
        .then(() => {
            console.log('\n🏁 Verificación completada');
        })
        .catch((error) => {
            console.error('\n💥 Error durante la verificación:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}

module.exports = { runProductionCheck };