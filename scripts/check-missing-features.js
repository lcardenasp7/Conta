#!/usr/bin/env node

/**
 * Script para verificar funcionalidades faltantes del sistema
 * Uso: node scripts/check-missing-features.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function checkMissingFeatures() {
    console.log('🔍 Verificando funcionalidades del sistema...\n');
    
    const checks = [];
    let missingFeatures = 0;
    let implementedFeatures = 0;
    
    // 1. Verificar rutas del backend
    console.log('🛣️  Verificando rutas del backend...');
    
    const routeFiles = [
        'routes/auth.routes.js',
        'routes/student.routes.js',
        'routes/grade.routes.js',
        'routes/group.routes.js',
        'routes/event.routes.js',
        'routes/invoice.routes.js',
        'routes/payment.routes.js',
        'routes/dashboard.routes.js',
        'routes/institution.routes.js',
        'routes/password-reset.routes.js'
    ];
    
    for (const routeFile of routeFiles) {
        if (fs.existsSync(routeFile)) {
            console.log(`✅ ${routeFile}`);
            implementedFeatures++;
        } else {
            console.log(`❌ ${routeFile} - FALTANTE`);
            checks.push({ type: 'missing', message: `Ruta faltante: ${routeFile}` });
            missingFeatures++;
        }
    }
    
    // 2. Verificar archivos del frontend
    console.log('\n🎨 Verificando archivos del frontend...');
    
    const frontendFiles = [
        'public/js/auth.js',
        'public/js/students.js',
        'public/js/grades.js',
        'public/js/events.js',
        'public/js/invoices.js',
        'public/js/payments.js',
        'public/js/dashboard.js',
        'public/js/institution.js',
        'public/js/api.js',
        'public/reset-password.html'
    ];
    
    for (const frontendFile of frontendFiles) {
        if (fs.existsSync(frontendFile)) {
            console.log(`✅ ${frontendFile}`);
            implementedFeatures++;
        } else {
            console.log(`❌ ${frontendFile} - FALTANTE`);
            checks.push({ type: 'missing', message: `Archivo frontend faltante: ${frontendFile}` });
            missingFeatures++;
        }
    }
    
    // 3. Verificar servicios
    console.log('\n🔧 Verificando servicios...');
    
    const serviceFiles = [
        'services/email.service.js',
        'services/invoice-generator.service.js'
    ];
    
    for (const serviceFile of serviceFiles) {
        if (fs.existsSync(serviceFile)) {
            console.log(`✅ ${serviceFile}`);
            implementedFeatures++;
        } else {
            console.log(`❌ ${serviceFile} - FALTANTE`);
            checks.push({ type: 'missing', message: `Servicio faltante: ${serviceFile}` });
            missingFeatures++;
        }
    }
    
    // 4. Verificar base de datos
    console.log('\n💾 Verificando base de datos...');
    
    try {
        await prisma.$connect();
        console.log('✅ Conexión a base de datos');
        implementedFeatures++;
        
        // Verificar tablas principales
        const tables = [
            { name: 'User', model: prisma.user },
            { name: 'Student', model: prisma.student },
            { name: 'Grade', model: prisma.grade },
            { name: 'Group', model: prisma.group },
            { name: 'Event', model: prisma.event },
            { name: 'Invoice', model: prisma.invoice },
            { name: 'Payment', model: prisma.payment },
            { name: 'Institution', model: prisma.institution }
        ];
        
        for (const table of tables) {
            try {
                await table.model.findFirst();
                console.log(`✅ Tabla ${table.name}`);
                implementedFeatures++;
            } catch (error) {
                console.log(`❌ Tabla ${table.name} - ERROR: ${error.message}`);
                checks.push({ type: 'missing', message: `Tabla ${table.name} no accesible` });
                missingFeatures++;
            }
        }
        
    } catch (error) {
        console.log(`❌ Conexión a base de datos - ERROR: ${error.message}`);
        checks.push({ type: 'critical', message: 'No se puede conectar a la base de datos' });
        missingFeatures++;
    }
    
    // 5. Verificar funcionalidades específicas
    console.log('\n⚙️  Verificando funcionalidades específicas...');
    
    const functionalities = [
        {
            name: 'Autenticación JWT',
            check: () => process.env.JWT_SECRET && process.env.JWT_SECRET.length > 32
        },
        {
            name: 'Reset de contraseña',
            check: () => fs.existsSync('routes/password-reset.routes.js') && fs.existsSync('public/reset-password.html')
        },
        {
            name: 'Generación de facturas',
            check: () => fs.existsSync('services/invoice-generator.service.js')
        },
        {
            name: 'Dashboard con estadísticas',
            check: () => fs.existsSync('routes/dashboard.routes.js') && fs.existsSync('public/js/dashboard.js')
        },
        {
            name: 'Gestión de eventos',
            check: () => fs.existsSync('routes/event.routes.js') && fs.existsSync('public/js/events.js')
        },
        {
            name: 'Sistema de pagos',
            check: () => fs.existsSync('routes/payment.routes.js') && fs.existsSync('public/js/payments.js')
        },
        {
            name: 'Configuración institucional',
            check: () => fs.existsSync('routes/institution.routes.js') && fs.existsSync('public/js/institution.js')
        }
    ];
    
    for (const functionality of functionalities) {
        if (functionality.check()) {
            console.log(`✅ ${functionality.name}`);
            implementedFeatures++;
        } else {
            console.log(`❌ ${functionality.name} - INCOMPLETA`);
            checks.push({ type: 'missing', message: `Funcionalidad incompleta: ${functionality.name}` });
            missingFeatures++;
        }
    }
    
    // 6. Verificar datos de prueba
    console.log('\n📊 Verificando datos del sistema...');
    
    try {
        const [
            userCount,
            studentCount,
            gradeCount,
            groupCount,
            eventCount,
            invoiceCount,
            paymentCount,
            institutionCount
        ] = await Promise.all([
            prisma.user.count(),
            prisma.student.count(),
            prisma.grade.count(),
            prisma.group.count(),
            prisma.event.count(),
            prisma.invoice.count(),
            prisma.payment.count(),
            prisma.institution.count()
        ]);
        
        const dataChecks = [
            { name: 'Usuarios', count: userCount, min: 1 },
            { name: 'Estudiantes', count: studentCount, min: 100 },
            { name: 'Grados', count: gradeCount, min: 5 },
            { name: 'Grupos', count: groupCount, min: 10 },
            { name: 'Eventos', count: eventCount, min: 0 },
            { name: 'Facturas', count: invoiceCount, min: 0 },
            { name: 'Pagos', count: paymentCount, min: 0 },
            { name: 'Configuración institucional', count: institutionCount, min: 0 }
        ];
        
        for (const dataCheck of dataChecks) {
            if (dataCheck.count >= dataCheck.min) {
                console.log(`✅ ${dataCheck.name}: ${dataCheck.count.toLocaleString()}`);
                implementedFeatures++;
            } else {
                console.log(`⚠️  ${dataCheck.name}: ${dataCheck.count} (mínimo recomendado: ${dataCheck.min})`);
                checks.push({ type: 'warning', message: `Pocos datos: ${dataCheck.name}` });
            }
        }
        
    } catch (error) {
        console.log(`❌ Error verificando datos: ${error.message}`);
        checks.push({ type: 'missing', message: 'No se pueden verificar los datos' });
        missingFeatures++;
    }
    
    // 7. Verificar configuración de producción
    console.log('\n🚀 Verificando configuración de producción...');
    
    const prodChecks = [
        { name: 'JWT_SECRET seguro', check: () => process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 64 },
        { name: 'DATABASE_URL configurada', check: () => !!process.env.DATABASE_URL },
        { name: 'Configuración de email', check: () => process.env.SMTP_USER || process.env.SENDGRID_API_KEY },
        { name: 'Scripts de optimización', check: () => fs.existsSync('scripts/optimize-database.js') },
        { name: 'Scripts de verificación', check: () => fs.existsSync('scripts/production-check.js') }
    ];
    
    for (const prodCheck of prodChecks) {
        if (prodCheck.check()) {
            console.log(`✅ ${prodCheck.name}`);
            implementedFeatures++;
        } else {
            console.log(`⚠️  ${prodCheck.name} - NO CONFIGURADO`);
            checks.push({ type: 'warning', message: `Configuración faltante: ${prodCheck.name}` });
        }
    }
    
    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📋 RESUMEN DE FUNCIONALIDADES');
    console.log('='.repeat(60));
    
    const totalFeatures = implementedFeatures + missingFeatures;
    const completionPercentage = totalFeatures > 0 ? Math.round((implementedFeatures / totalFeatures) * 100) : 0;
    
    console.log(`✅ Funcionalidades implementadas: ${implementedFeatures}`);
    console.log(`❌ Funcionalidades faltantes: ${missingFeatures}`);
    console.log(`📊 Porcentaje de completitud: ${completionPercentage}%`);
    
    if (missingFeatures === 0) {
        console.log('\n🎉 ¡EXCELENTE! Todas las funcionalidades están implementadas');
    } else {
        console.log('\n📝 FUNCIONALIDADES FALTANTES O INCOMPLETAS:');
        checks.filter(c => c.type === 'missing').forEach(check => {
            console.log(`   ❌ ${check.message}`);
        });
        
        const warnings = checks.filter(c => c.type === 'warning');
        if (warnings.length > 0) {
            console.log('\n⚠️  ADVERTENCIAS:');
            warnings.forEach(check => {
                console.log(`   ⚠️  ${check.message}`);
            });
        }
    }
    
    // Recomendaciones
    console.log('\n💡 PRÓXIMOS PASOS RECOMENDADOS:');
    
    if (missingFeatures > 0) {
        console.log('   1. Completar funcionalidades faltantes');
        console.log('   2. Ejecutar pruebas de integración');
        console.log('   3. Configurar variables de producción');
    } else {
        console.log('   1. Ejecutar pruebas de carga');
        console.log('   2. Configurar monitoreo');
        console.log('   3. Preparar deployment a producción');
    }
    
    console.log('   4. Documentar funcionalidades nuevas');
    console.log('   5. Capacitar usuarios finales');
    
    return {
        implementedFeatures,
        missingFeatures,
        completionPercentage,
        checks
    };
}

// Ejecutar si se llama directamente
if (require.main === module) {
    checkMissingFeatures()
        .then((result) => {
            console.log('\n🏁 Verificación completada');
            process.exit(result.missingFeatures > 0 ? 1 : 0);
        })
        .catch((error) => {
            console.error('\n💥 Error durante la verificación:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}

module.exports = { checkMissingFeatures };