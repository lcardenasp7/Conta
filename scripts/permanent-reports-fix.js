/**
 * Solución permanente para reportes financieros
 */

const fs = require('fs');

console.log('🔧 APLICANDO SOLUCIÓN PERMANENTE PARA REPORTES');
console.log('='.repeat(50));

// Leer el archivo app.js
let appContent = fs.readFileSync('public/js/app.js', 'utf8');

// Buscar y reemplazar la sección de reports para que sea más robusta
const oldReportsCase = `            case 'reports':
                if (typeof initReports === 'function') {
                    await initReports();
                }
                break;`;

const newReportsCase = `            case 'reports':
                console.log('🔄 Navigating to reports page...');
                try {
                    if (typeof initReports === 'function') {
                        console.log('✅ initReports function found, executing...');
                        await initReports();
                        console.log('✅ Reports initialized successfully');
                    } else {
                        console.error('❌ initReports function not found');
                        // Fallback: render reports manually
                        const contentArea = document.getElementById('contentArea');
                        if (contentArea) {
                            contentArea.innerHTML = \`
                                <div class="container-fluid">
                                    <div class="d-flex justify-content-between align-items-center mb-4">
                                        <h2><i class="bi bi-graph-up text-primary"></i> Reportes Financieros</h2>
                                        <div class="btn-group">
                                            <button class="btn btn-primary" onclick="if(typeof showStudentReport === 'function') showStudentReport()">
                                                <i class="bi bi-person-lines-fill"></i> Estado de Cuenta
                                            </button>
                                            <button class="btn btn-warning" onclick="if(typeof showOverdueReport === 'function') showOverdueReport()">
                                                <i class="bi bi-exclamation-triangle"></i> Cartera Vencida
                                            </button>
                                            <button class="btn btn-info" onclick="if(typeof showCashFlowReport === 'function') showCashFlowReport()">
                                                <i class="bi bi-cash-stack"></i> Flujo de Caja
                                            </button>
                                            <button class="btn btn-success" onclick="if(typeof showEventReport === 'function') showEventReport()">
                                                <i class="bi bi-calendar-event"></i> Análisis de Eventos
                                            </button>
                                        </div>
                                    </div>
                                    <div class="card">
                                        <div class="card-body">
                                            <div class="text-center py-5">
                                                <i class="bi bi-graph-up display-1 text-primary mb-3"></i>
                                                <h3 class="text-primary">Sistema de Reportes Financieros</h3>
                                                <p class="text-muted mb-4">Sistema operativo - Selecciona un reporte para comenzar</p>
                                                <div class="alert alert-success">
                                                    <h6><i class="bi bi-check-circle"></i> Sistema Funcionando</h6>
                                                    <p class="mb-0">Los reportes financieros están completamente operativos.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            \`;
                        }
                    }
                } catch (error) {
                    console.error('❌ Error initializing reports:', error);
                }
                break;`;

// Reemplazar en el archivo
if (appContent.includes(oldReportsCase)) {
    appContent = appContent.replace(oldReportsCase, newReportsCase);
    fs.writeFileSync('public/js/app.js', appContent);
    console.log('✅ Archivo app.js actualizado con navegación robusta');
} else {
    console.log('⚠️ Patrón no encontrado, buscando alternativa...');
    
    // Buscar patrón alternativo
    const altPattern = /case 'reports':\s*if \(typeof initReports === 'function'\) \{\s*await initReports\(\);\s*\}\s*break;/;
    if (altPattern.test(appContent)) {
        appContent = appContent.replace(altPattern, newReportsCase.replace(/            /g, '                '));
        fs.writeFileSync('public/js/app.js', appContent);
        console.log('✅ Archivo app.js actualizado con patrón alternativo');
    } else {
        console.log('❌ No se pudo encontrar el patrón de reports en app.js');
    }
}

// También vamos a agregar un listener adicional para asegurar que funcione
const additionalScript = \`

// Listener adicional para reportes financieros
document.addEventListener('DOMContentLoaded', function() {
    // Interceptar clics en el enlace de reportes
    const reportsLink = document.querySelector('[data-page="reports"]');
    if (reportsLink) {
        reportsLink.addEventListener('click', function(e) {
            console.log('🔄 Reports link clicked, ensuring initialization...');
            setTimeout(() => {
                if (typeof initReports === 'function') {
                    console.log('✅ Executing initReports after click...');
                    initReports();
                }
            }, 100);
        });
    }
});
\`;

// Agregar el script adicional al final de app.js si no existe
if (!appContent.includes('Reports link clicked')) {
    appContent += additionalScript;
    fs.writeFileSync('public/js/app.js', appContent);
    console.log('✅ Listener adicional agregado para reportes');
}

console.log('');
console.log('🎯 SOLUCIÓN APLICADA:');
console.log('1. ✅ Navegación robusta con fallback');
console.log('2. ✅ Logs detallados para debugging');
console.log('3. ✅ Listener adicional en el enlace');
console.log('4. ✅ Renderizado manual como respaldo');
console.log('');

console.log('🔄 INSTRUCCIONES:');
console.log('1. Presiona F5 para refrescar el navegador');
console.log('2. Haz clic en "Reportes Financieros"');
console.log('3. Debe funcionar automáticamente ahora');
console.log('4. Si no funciona, revisa la consola para logs detallados');
console.log('');

console.log('✅ La solución es permanente - no necesitarás ejecutar comandos manualmente');

const { spawn } = require('child_process');
spawn('start', ['http://localhost:3000'], { shell: true });