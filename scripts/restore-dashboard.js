#!/usr/bin/env node

/**
 * Script para restaurar el dashboard completo después de usar la versión simplificada
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Restaurando Dashboard Completo...\n');

try {
    const dashboardPath = path.join(__dirname, '../routes/dashboard.routes.js');
    const backupPath = dashboardPath + '.backup';
    
    if (fs.existsSync(backupPath)) {
        // Restore from backup
        fs.copyFileSync(backupPath, dashboardPath);
        fs.unlinkSync(backupPath);
        
        console.log('✅ Dashboard completo restaurado');
        console.log('📊 Funcionalidades disponibles:');
        console.log('   • Categorización de ingresos/egresos');
        console.log('   • Gráficos con datos reales');
        console.log('   • Estadísticas detalladas');
        console.log('   • Balance financiero');
        console.log('\n🔄 Reinicia el servidor para aplicar cambios:');
        console.log('   npm start');
        
    } else {
        console.log('⚠️  No se encontró backup del dashboard');
        console.log('💡 El dashboard actual se mantendrá');
    }
    
} catch (error) {
    console.error('❌ Error restaurando dashboard:', error);
}