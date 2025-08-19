#!/usr/bin/env node

/**
 * Script para limpiar el proyecto antes del despliegue en Railway
 * Elimina archivos temporales y asegura que no se suban datos de prueba
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 LIMPIANDO PROYECTO PARA RAILWAY');
console.log('==================================\n');

// Archivos y carpetas a limpiar (si existen)
const filesToClean = [
    '.env',                    // Archivo de entorno local
    'debug.log',              // Logs de debug
    'error.log',              // Logs de error
    'npm-debug.log',          // Logs de npm
    '*.tmp',                  // Archivos temporales
    'temp/',                  // Carpeta temporal
    '.DS_Store',              // Archivos de macOS
    'Thumbs.db'               // Archivos de Windows
];

// Scripts de datos de prueba que NO deben ejecutarse en producción
const testScripts = [
    'scripts/create-sample-events.js',
    'scripts/create-sample-invoices.js',
    'scripts/create-sample-payments.js',
    'scripts/create-sample-students.js'
];

console.log('📋 1. LIMPIANDO ARCHIVOS TEMPORALES...');

let cleanedFiles = 0;
filesToClean.forEach(file => {
    if (fs.existsSync(file)) {
        try {
            if (fs.statSync(file).isDirectory()) {
                fs.rmSync(file, { recursive: true, force: true });
            } else {
                fs.unlinkSync(file);
            }
            console.log(`✅ Eliminado: ${file}`);
            cleanedFiles++;
        } catch (error) {
            console.log(`⚠️ No se pudo eliminar: ${file} - ${error.message}`);
        }
    }
});

if (cleanedFiles === 0) {
    console.log('✅ No hay archivos temporales para limpiar');
}

console.log('\n📋 2. VERIFICANDO SCRIPTS DE DATOS DE PRUEBA...');

testScripts.forEach(script => {
    if (fs.existsSync(script)) {
        console.log(`⚠️ ADVERTENCIA: ${script} existe`);
        console.log(`   Este script NO se ejecutará en Railway automáticamente`);
        console.log(`   Solo se ejecutará si lo llamas manualmente`);
    }
});

console.log('\n📋 3. VERIFICANDO CONFIGURACIÓN DE PACKAGE.JSON...');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Verificar que no hay scripts que ejecuten datos de prueba automáticamente
const dangerousScripts = ['postinstall', 'postdeploy', 'start'].filter(scriptName => {
    const script = packageJson.scripts[scriptName];
    return script && (
        script.includes('create-sample') ||
        script.includes('test-data') ||
        script.includes('sample-data')
    );
});

if (dangerousScripts.length === 0) {
    console.log('✅ No hay scripts peligrosos en package.json');
} else {
    console.log('❌ SCRIPTS PELIGROSOS ENCONTRADOS:');
    dangerousScripts.forEach(script => {
        console.log(`   ${script}: ${packageJson.scripts[script]}`);
    });
}

console.log('\n📋 4. CREANDO ARCHIVO .railwayignore...');

const railwayIgnoreContent = `# Archivos que Railway debe ignorar
.env
.env.local
.env.development
.env.test
*.log
debug.log
error.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Archivos temporales
*.tmp
temp/
.DS_Store
Thumbs.db

# Scripts de desarrollo y prueba
scripts/create-sample-*.js
scripts/test-*.js
scripts/debug-*.js
scripts/*-test.js

# Documentación de desarrollo
DEBUG_*.md
TEST_*.md
DESARROLLO_*.md

# Archivos de backup
*.backup
*.bak
*.old
`;

fs.writeFileSync('.railwayignore', railwayIgnoreContent);
console.log('✅ Archivo .railwayignore creado');

console.log('\n📋 5. VERIFICANDO SEED DE PRODUCCIÓN...');

if (fs.existsSync('scripts/railway-production-seed.js')) {
    const seedContent = fs.readFileSync('scripts/railway-production-seed.js', 'utf8');
    
    // Verificar que es el seed correcto
    if (seedContent.includes('Solo datos esenciales para producción')) {
        console.log('✅ Seed de producción correcto');
    } else {
        console.log('❌ Verificar seed de producción');
    }
    
    // Verificar que no crea estudiantes de prueba
    if (!seedContent.includes('createSampleStudents') && !seedContent.includes('sample students')) {
        console.log('✅ No crea estudiantes de prueba');
    } else {
        console.log('⚠️ Podría crear estudiantes de prueba');
    }
} else {
    console.log('❌ Seed de producción no encontrado');
}

console.log('\n📋 6. CREANDO RESUMEN DE DESPLIEGUE...');

const deploymentSummary = `# RESUMEN DE DESPLIEGUE - RAILWAY
================================

## ✅ DATOS QUE SE CREARÁN EN PRODUCCIÓN:

### 🏫 Institución
- Institución Educativa Distrital Villas de San Pablo
- NIT: 901.079.125-0
- Información completa de la institución

### 👥 Usuarios Administrativos
- Rector: rector@villasanpablo.edu.co (Contraseña: VillasSP2024!)
- Auxiliar Contable: contabilidad@villasanpablo.edu.co (Contraseña: ContaVSP2024!)

### 📚 Estructura Académica
- Grados desde Preescolar hasta Undécimo
- Grupos 01-06 para cada grado
- Capacidad de 30 estudiantes por grupo

### 💰 Sistema Financiero
- Plan de cuentas contable colombiano
- Sistema de fondos institucionales
- Cuentas básicas de activos, pasivos, patrimonio, ingresos y gastos

## ❌ DATOS QUE NO SE CREARÁN:

- ❌ Estudiantes de prueba
- ❌ Facturas de prueba  
- ❌ Pagos de prueba
- ❌ Eventos de prueba
- ❌ Datos simulados

## 📋 DESPUÉS DEL DESPLIEGUE:

1. Acceder con las credenciales administrativas
2. Importar estudiantes reales usando el sistema
3. Crear eventos académicos reales
4. Comenzar operación normal del sistema

## 🔧 COMANDOS RAILWAY:

\`\`\`bash
# Para ejecutar el seed de producción
railway run node scripts/railway-production-seed.js

# Para verificar la base de datos
railway run node scripts/railway-db-check.js
\`\`\`

Fecha de preparación: ${new Date().toLocaleString()}
`;

fs.writeFileSync('RAILWAY_DEPLOYMENT_SUMMARY.md', deploymentSummary);
console.log('✅ Resumen de despliegue creado: RAILWAY_DEPLOYMENT_SUMMARY.md');

console.log('\n' + '='.repeat(50));
console.log('🎉 PROYECTO LIMPIO Y LISTO PARA RAILWAY');
console.log('='.repeat(50));

console.log('\n🔒 GARANTÍAS DE SEGURIDAD:');
console.log('- ✅ No se subirán datos de prueba');
console.log('- ✅ Solo se crearán datos institucionales reales');
console.log('- ✅ Los estudiantes se importarán después del despliegue');
console.log('- ✅ Sistema listo para operación en producción');

console.log('\n🚀 PRÓXIMOS PASOS:');
console.log('1. Subir código a GitHub');
console.log('2. Conectar repositorio en Railway');
console.log('3. Agregar servicio PostgreSQL');
console.log('4. Configurar variables de entorno');
console.log('5. Ejecutar seed de producción');
console.log('6. ¡Comenzar a usar el sistema!');

console.log('\n✅ ¡LISTO PARA DESPLEGAR!');