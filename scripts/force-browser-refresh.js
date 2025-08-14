/**
 * Script para forzar la actualización del navegador
 * Agrega un timestamp a los archivos JS para evitar caché
 */

const fs = require('fs');
const path = require('path');

function forceBrowserRefresh() {
    console.log('🔄 Forzando actualización del navegador...\n');

    // 1. Leer el archivo HTML
    const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // 2. Agregar timestamp a los scripts para evitar caché
    const timestamp = Date.now();
    
    // Buscar y reemplazar la línea del financial-dashboard.js
    const oldScript = 'src="js/financial-dashboard.js"';
    const newScript = `src="js/financial-dashboard.js?v=${timestamp}"`;
    
    if (htmlContent.includes(oldScript)) {
        htmlContent = htmlContent.replace(oldScript, newScript);
        fs.writeFileSync(htmlPath, htmlContent);
        console.log('✅ Timestamp agregado al script financial-dashboard.js');
    } else {
        console.log('⚠️ Script financial-dashboard.js no encontrado en HTML');
    }

    // 3. Verificar que la función esté exportada
    const jsPath = path.join(__dirname, '..', 'public', 'js', 'financial-dashboard.js');
    let jsContent = fs.readFileSync(jsPath, 'utf8');
    
    if (!jsContent.includes('window.initFinancialDashboard = initFinancialDashboard;')) {
        jsContent += '\n\n// Exportar función globalmente\nwindow.initFinancialDashboard = initFinancialDashboard;\n';
        fs.writeFileSync(jsPath, jsContent);
        console.log('✅ Exportación global agregada');
    } else {
        console.log('✅ Función ya exportada globalmente');
    }

    // 4. Crear un archivo de prueba directo
    const testPath = path.join(__dirname, '..', 'public', 'test-dashboard.html');
    const testContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Dashboard Financiero</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body>
    <div class="container-fluid">
        <div id="contentArea">
            <div class="text-center py-5">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-3">Cargando Dashboard Financiero...</p>
            </div>
        </div>
    </div>

    <script>
        // Simular funciones globales necesarias
        window.showLoading = () => {
            console.log('Loading...');
            document.getElementById('contentArea').innerHTML = '<div class="text-center py-5"><div class="spinner-border" role="status"></div><p class="mt-3">Cargando...</p></div>';
        };
        
        window.hideLoading = () => {
            console.log('Hide loading...');
        };
        
        window.showError = (msg) => {
            console.error('Error:', msg);
            document.getElementById('contentArea').innerHTML = \`<div class="alert alert-danger">\${msg}</div>\`;
        };
        
        window.showInfo = (msg) => {
            console.log('Info:', msg);
            alert(msg);
        };
        
        window.API = {
            request: async (method, url) => {
                console.log('API Request:', method, url);
                // Simular respuesta
                return {
                    summary: {
                        totalIncome: 1500000,
                        totalExpenses: 800000,
                        netCashFlow: 700000,
                        pendingAmount: 300000,
                        pendingCount: 5
                    },
                    period: { name: 'Mes Actual' },
                    income: {
                        byCategory: {
                            'MONTHLY': { total: 800000 },
                            'EVENT': { total: 400000 },
                            'TRANSPORT': { total: 300000 }
                        }
                    },
                    expenses: {
                        byCategory: {
                            'UTILITIES': { total: 300000 },
                            'MAINTENANCE': { total: 250000 },
                            'SUPPLIES': { total: 250000 }
                        }
                    },
                    trends: [
                        { monthName: 'Enero', income: 1200000, expenses: 600000, net: 600000 },
                        { monthName: 'Febrero', income: 1300000, expenses: 700000, net: 600000 },
                        { monthName: 'Marzo', income: 1500000, expenses: 800000, net: 700000 }
                    ],
                    recentActivity: [
                        {
                            type: 'income',
                            date: new Date(),
                            amount: 50000,
                            description: 'Pago de Juan Pérez',
                            category: 'MONTHLY'
                        }
                    ],
                    pending: {
                        invoices: [
                            {
                                invoiceNumber: 'FAC-2025-001',
                                total: 100000,
                                dueDate: new Date(),
                                student: { firstName: 'María', lastName: 'García' }
                            }
                        ]
                    }
                };
            }
        };
    </script>
    
    <script src="js/financial-dashboard.js?v=${timestamp}"></script>
    
    <script>
        console.log('=== DIAGNÓSTICO DASHBOARD FINANCIERO ===');
        console.log('initFinancialDashboard disponible:', typeof initFinancialDashboard);
        console.log('Chart disponible:', typeof Chart);
        console.log('bootstrap disponible:', typeof bootstrap);
        
        if (typeof initFinancialDashboard === 'function') {
            console.log('✅ Función disponible, ejecutando...');
            initFinancialDashboard().then(() => {
                console.log('✅ Dashboard inicializado exitosamente');
            }).catch(error => {
                console.error('❌ Error inicializando dashboard:', error);
            });
        } else {
            console.error('❌ Función initFinancialDashboard no disponible');
            document.getElementById('contentArea').innerHTML = \`
                <div class="alert alert-danger">
                    <h4>Error: Función no disponible</h4>
                    <p>La función initFinancialDashboard no está disponible.</p>
                    <p>Tipo actual: \${typeof initFinancialDashboard}</p>
                </div>
            \`;
        }
    </script>
</body>
</html>
    `;
    
    fs.writeFileSync(testPath, testContent);
    console.log(`✅ Archivo de prueba creado: ${testPath}`);

    console.log('\n📋 Instrucciones:');
    console.log('1. Abre http://localhost:3000/test-dashboard.html en tu navegador');
    console.log('2. Abre las herramientas de desarrollador (F12)');
    console.log('3. Ve a la consola para ver los mensajes de diagnóstico');
    console.log('4. Si funciona ahí, el problema es de caché en la aplicación principal');
    console.log('5. Usa Ctrl+Shift+R para forzar recarga sin caché');

    console.log('\n🔄 Cambios realizados:');
    console.log('✅ Timestamp agregado para evitar caché');
    console.log('✅ Función exportada globalmente');
    console.log('✅ Archivo de prueba independiente creado');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    forceBrowserRefresh();
}

module.exports = { forceBrowserRefresh };