/**
 * Script para diagnosticar problemas con el dashboard financiero
 */

const fs = require('fs');
const path = require('path');

function debugFinancialDashboard() {
    console.log('🔍 Diagnosticando Dashboard Financiero...\n');

    // 1. Verificar que el archivo JavaScript existe y tiene contenido
    const jsPath = path.join(__dirname, '..', 'public', 'js', 'financial-dashboard.js');
    
    if (!fs.existsSync(jsPath)) {
        console.error('❌ Archivo financial-dashboard.js NO EXISTE');
        return;
    }

    const jsContent = fs.readFileSync(jsPath, 'utf8');
    console.log(`✅ Archivo financial-dashboard.js existe (${jsContent.length} caracteres)`);

    // 2. Verificar que tiene la función initFinancialDashboard
    if (jsContent.includes('function initFinancialDashboard')) {
        console.log('✅ Función initFinancialDashboard encontrada');
    } else {
        console.error('❌ Función initFinancialDashboard NO encontrada');
    }

    // 3. Verificar que se exporta globalmente
    if (jsContent.includes('window.initFinancialDashboard')) {
        console.log('✅ Función exportada globalmente');
    } else {
        console.error('❌ Función NO exportada globalmente');
        console.log('🔧 Agregando exportación global...');
        
        // Agregar la exportación si no existe
        if (!jsContent.includes('window.initFinancialDashboard')) {
            const updatedContent = jsContent + '\n\n// Exportar función globalmente\nwindow.initFinancialDashboard = initFinancialDashboard;';
            fs.writeFileSync(jsPath, updatedContent);
            console.log('✅ Exportación global agregada');
        }
    }

    // 4. Verificar sintaxis básica
    const syntaxChecks = [
        { name: 'Llaves balanceadas', check: (jsContent.match(/\{/g) || []).length === (jsContent.match(/\}/g) || []).length },
        { name: 'Paréntesis balanceados', check: (jsContent.match(/\(/g) || []).length === (jsContent.match(/\)/g) || []).length },
        { name: 'No errores obvios', check: !jsContent.includes('undefined') && !jsContent.includes('null.') }
    ];

    console.log('\n📋 Verificaciones de sintaxis:');
    syntaxChecks.forEach(({ name, check }) => {
        console.log(`   ${check ? '✅' : '❌'} ${name}`);
    });

    // 5. Verificar que el HTML incluye el script
    const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    if (htmlContent.includes('js/financial-dashboard.js')) {
        console.log('✅ Script incluido en HTML');
    } else {
        console.error('❌ Script NO incluido en HTML');
    }

    // 6. Verificar que app.js tiene el caso
    const appJsPath = path.join(__dirname, '..', 'public', 'js', 'app.js');
    const appJsContent = fs.readFileSync(appJsPath, 'utf8');
    
    if (appJsContent.includes("case 'financial-dashboard'")) {
        console.log('✅ Caso financial-dashboard en app.js');
    } else {
        console.error('❌ Caso financial-dashboard NO en app.js');
    }

    // 7. Verificar que el servidor tiene la ruta
    const serverPath = path.join(__dirname, '..', 'server.js');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    if (serverContent.includes('financial-dashboard.routes')) {
        console.log('✅ Ruta registrada en server.js');
    } else {
        console.error('❌ Ruta NO registrada en server.js');
    }

    // 8. Crear un archivo de prueba simple
    const testHtmlPath = path.join(__dirname, 'test-financial-dashboard.html');
    const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Dashboard Financiero</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div id="contentArea">Cargando...</div>
    
    <script>
        // Simular funciones globales necesarias
        window.showLoading = () => console.log('Loading...');
        window.hideLoading = () => console.log('Hide loading...');
        window.showError = (msg) => console.error('Error:', msg);
        window.API = {
            request: async (method, url) => {
                console.log('API Request:', method, url);
                return { summary: { totalIncome: 0, totalExpenses: 0, netCashFlow: 0, pendingAmount: 0, pendingCount: 0 }, period: { name: 'Test' }, income: { byCategory: {} }, expenses: { byCategory: {} }, trends: [], recentActivity: [], pending: { invoices: [] } };
            }
        };
    </script>
    <script src="../public/js/financial-dashboard.js"></script>
    
    <script>
        console.log('initFinancialDashboard available:', typeof initFinancialDashboard);
        if (typeof initFinancialDashboard === 'function') {
            console.log('✅ Función disponible, ejecutando...');
            initFinancialDashboard().then(() => {
                console.log('✅ Dashboard inicializado exitosamente');
            }).catch(error => {
                console.error('❌ Error inicializando dashboard:', error);
            });
        } else {
            console.error('❌ Función initFinancialDashboard no disponible');
        }
    </script>
</body>
</html>
    `;
    
    fs.writeFileSync(testHtmlPath, testHtml);
    console.log(`\n🧪 Archivo de prueba creado: ${testHtmlPath}`);
    console.log('💡 Abre este archivo en el navegador para probar la función directamente');

    console.log('\n📝 Resumen del diagnóstico completado');
    console.log('🔧 Si hay problemas, revisa los errores marcados arriba');
}

// Ejecutar diagnóstico
if (require.main === module) {
    debugFinancialDashboard();
}

module.exports = { debugFinancialDashboard };