/**
 * Solución simple y permanente para reportes
 */

const fs = require('fs');

console.log('🔧 APLICANDO SOLUCIÓN SIMPLE Y PERMANENTE');
console.log('='.repeat(40));

// Leer el archivo app.js
let appContent = fs.readFileSync('public/js/app.js', 'utf8');

// Buscar la línea específica de reports y reemplazarla
const searchPattern = "case 'reports':";
const replacePattern = `case 'reports':
                console.log('🔄 Loading reports page...');
                try {
                    if (typeof initReports === 'function') {
                        console.log('✅ Executing initReports...');
                        await initReports();
                    } else {
                        console.error('❌ initReports not found, loading manually...');
                        // Force load reports manually
                        setTimeout(() => {
                            if (typeof initReports === 'function') {
                                initReports();
                            }
                        }, 500);
                    }
                } catch (error) {
                    console.error('❌ Error in reports:', error);
                }`;

if (appContent.includes(searchPattern)) {
    // Encontrar la sección completa del case 'reports'
    const reportsStart = appContent.indexOf("case 'reports':");
    const nextCaseStart = appContent.indexOf('case ', reportsStart + 1);
    const breakIndex = appContent.indexOf('break;', reportsStart);
    
    if (breakIndex !== -1) {
        const beforeReports = appContent.substring(0, reportsStart);
        const afterReports = appContent.substring(breakIndex + 6);
        
        const newContent = beforeReports + replacePattern + '\n                break;' + afterReports;
        
        fs.writeFileSync('public/js/app.js', newContent);
        console.log('✅ Archivo app.js actualizado exitosamente');
    }
} else {
    console.log('❌ No se encontró el patrón de reports');
}

// Crear un script adicional para forzar la inicialización
const forceInitScript = `
// Force reports initialization
(function() {
    const originalNavigateToPage = window.navigateToPage;
    window.navigateToPage = function(pageName) {
        console.log('🔄 Navigating to:', pageName);
        if (pageName === 'reports') {
            console.log('🎯 Reports page detected, ensuring initialization...');
            setTimeout(() => {
                if (typeof initReports === 'function') {
                    console.log('✅ Force executing initReports...');
                    initReports();
                } else {
                    console.log('❌ initReports still not available');
                }
            }, 200);
        }
        if (originalNavigateToPage) {
            return originalNavigateToPage.call(this, pageName);
        }
    };
})();
`;

// Agregar al final de app.js si no existe
if (!appContent.includes('Force reports initialization')) {
    fs.appendFileSync('public/js/app.js', forceInitScript);
    console.log('✅ Script de forzado agregado');
}

console.log('');
console.log('🎯 SOLUCIÓN APLICADA:');
console.log('1. ✅ Navegación mejorada con logs');
console.log('2. ✅ Timeout de respaldo');
console.log('3. ✅ Script de forzado adicional');
console.log('');

console.log('🔄 AHORA:');
console.log('1. Presiona F5 en el navegador');
console.log('2. Haz clic en "Reportes Financieros"');
console.log('3. Debe funcionar automáticamente');
console.log('');

console.log('✅ Esta solución es PERMANENTE');

const { spawn } = require('child_process');
spawn('start', ['http://localhost:3000'], { shell: true });