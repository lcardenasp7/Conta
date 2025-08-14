/**
 * Script para limpiar archivos de prueba antes de producción
 */

const fs = require('fs');

console.log('🧹 LIMPIANDO ARCHIVOS DE PRUEBA PARA PRODUCCIÓN');
console.log('===============================================');

// Archivos de prueba que se pueden eliminar
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

let deletedCount = 0;
let totalSize = 0;

console.log('\n📁 Eliminando archivos de prueba...');

testFiles.forEach(file => {
    if (fs.existsSync(file)) {
        try {
            const stats = fs.statSync(file);
            totalSize += stats.size;
            fs.unlinkSync(file);
            console.log(`  ✅ Eliminado: ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
            deletedCount++;
        } catch (error) {
            console.log(`  ❌ Error eliminando ${file}: ${error.message}`);
        }
    }
});

console.log(`\n📊 RESUMEN DE LIMPIEZA:`);
console.log(`  🗑️  Archivos eliminados: ${deletedCount}`);
console.log(`  💾 Espacio liberado: ${(totalSize / 1024).toFixed(1)} KB`);

if (deletedCount === 0) {
    console.log('  ℹ️  No se encontraron archivos de prueba para eliminar');
}

console.log('\n✅ LIMPIEZA COMPLETADA');
console.log('El sistema está más limpio para producción');

console.log('\n🎯 PRÓXIMO PASO:');
console.log('Ejecuta: git add . && git commit -m "Limpieza de archivos de prueba para producción"');