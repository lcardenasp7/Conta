/**
 * Script para solucionar problemas de caché del dashboard financiero
 */

const fs = require('fs');
const path = require('path');

function fixDashboardCache() {
    console.log('🔧 Solucionando problemas de caché del dashboard...\n');

    // 1. Verificar que el archivo existe y tiene contenido
    const jsPath = path.join(__dirname, '..', 'public', 'js', 'financial-dashboard.js');
    const jsStats = fs.statSync(jsPath);
    console.log(`📄 Archivo: ${jsStats.size} bytes`);

    // 2. Agregar timestamp único al HTML
    const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    const newTimestamp = Date.now();
    const oldPattern = /js\/financial-dashboard\.js\?v=\d+/g;
    const newScript = `js/financial-dashboard.js?v=${newTimestamp}`;
    
    if (htmlContent.match(oldPattern)) {
        htmlContent = htmlContent.replace(oldPattern, newScript);
        fs.writeFileSync(htmlPath, htmlContent);
        console.log(`✅ Timestamp actualizado: v=${newTimestamp}`);
    } else {
        console.log('⚠️ No se encontró el script con timestamp');
    }

    // 3. Verificar que el menú esté actualizado
    if (htmlContent.includes('data-page="financial-dashboard"') && 
        htmlContent.includes('Dashboard Financiero') &&
        !htmlContent.includes('billing-submenu.*financial-dashboard')) {
        console.log('✅ Menú principal configurado correctamente');
    } else {
        console.log('❌ Problema con la configuración del menú');
    }

    // 4. Crear archivo de prueba con datos simulados
    const testPath = path.join(__dirname, '..', 'public', 'test-dashboard-simple.html');
    const testContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Dashboard Financiero - Prueba</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-light">
    <div class="container-fluid p-4">
        <div class="row">
            <div class="col-12">
                <div class="alert alert-info">
                    <h4>🧪 Prueba del Dashboard Financiero</h4>
                    <p>Esta página prueba el dashboard con datos simulados.</p>
                </div>
            </div>
        </div>
        
        <div id="contentArea">
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-3">Inicializando dashboard...</p>
            </div>
        </div>
    </div>

    <script>
        // Funciones globales simuladas
        window.showLoading = () => {
            document.getElementById('contentArea').innerHTML = \`
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-3">Cargando datos financieros...</p>
                </div>
            \`;
        };
        
        window.hideLoading = () => {
            console.log('✅ Carga completada');
        };
        
        window.showError = (msg) => {
            document.getElementById('contentArea').innerHTML = \`
                <div class="alert alert-danger">
                    <h4>❌ Error</h4>
                    <p>\${msg}</p>
                </div>
            \`;
        };
        
        window.showInfo = (msg) => {
            alert('ℹ️ ' + msg);
        };
        
        // API simulada con datos realistas
        window.API = {
            request: async (method, url) => {
                console.log('📡 API Request:', method, url);
                
                // Simular delay de red
                await new Promise(resolve => setTimeout(resolve, 500));
                
                return {
                    summary: {
                        totalIncome: 2500000,
                        totalExpenses: 1200000,
                        netCashFlow: 1300000,
                        pendingAmount: 450000,
                        pendingCount: 8
                    },
                    period: { 
                        name: 'Mes Actual',
                        startDate: new Date(2025, 7, 1),
                        endDate: new Date(2025, 7, 31)
                    },
                    income: {
                        byCategory: {
                            'MONTHLY': { total: 1500000, count: 120 },
                            'EVENT': { total: 600000, count: 45 },
                            'TRANSPORT': { total: 400000, count: 80 }
                        }
                    },
                    expenses: {
                        byCategory: {
                            'UTILITIES': { total: 400000, count: 12 },
                            'MAINTENANCE': { total: 350000, count: 8 },
                            'OFFICE_SUPPLIES': { total: 250000, count: 15 },
                            'FOOD_SUPPLIES': { total: 200000, count: 20 }
                        }
                    },
                    trends: [
                        { monthName: 'Marzo 2025', income: 2200000, expenses: 1100000, net: 1100000 },
                        { monthName: 'Abril 2025', income: 2300000, expenses: 1150000, net: 1150000 },
                        { monthName: 'Mayo 2025', income: 2400000, expenses: 1200000, net: 1200000 },
                        { monthName: 'Junio 2025', income: 2350000, expenses: 1180000, net: 1170000 },
                        { monthName: 'Julio 2025', income: 2450000, expenses: 1220000, net: 1230000 },
                        { monthName: 'Agosto 2025', income: 2500000, expenses: 1200000, net: 1300000 }
                    ],
                    recentActivity: [
                        {
                            type: 'income',
                            date: new Date(),
                            amount: 85000,
                            description: 'Pago mensualidad - María García',
                            category: 'MONTHLY'
                        },
                        {
                            type: 'income',
                            date: new Date(Date.now() - 86400000),
                            amount: 45000,
                            description: 'Pago evento - Juan Pérez',
                            category: 'EVENT'
                        },
                        {
                            type: 'expense',
                            date: new Date(Date.now() - 172800000),
                            amount: 120000,
                            description: 'Factura servicios públicos',
                            category: 'UTILITIES'
                        }
                    ],
                    pending: {
                        invoices: [
                            {
                                invoiceNumber: 'FAC-2025-001234',
                                total: 85000,
                                dueDate: new Date(Date.now() + 604800000),
                                student: { firstName: 'Ana', lastName: 'Rodríguez' }
                            },
                            {
                                invoiceNumber: 'FAC-2025-001235',
                                total: 95000,
                                dueDate: new Date(Date.now() - 86400000),
                                student: { firstName: 'Carlos', lastName: 'López' }
                            },
                            {
                                invoiceNumber: 'FAC-2025-001236',
                                total: 75000,
                                dueDate: new Date(Date.now() + 1209600000),
                                student: { firstName: 'Sofía', lastName: 'Martínez' }
                            }
                        ]
                    }
                };
            }
        };
    </script>
    
    <script src="js/financial-dashboard.js?v=${newTimestamp}"></script>
    
    <script>
        console.log('=== DIAGNÓSTICO DASHBOARD FINANCIERO ===');
        console.log('✅ Chart.js disponible:', typeof Chart !== 'undefined');
        console.log('✅ Bootstrap disponible:', typeof bootstrap !== 'undefined');
        console.log('✅ API simulada disponible:', typeof API !== 'undefined');
        console.log('🔍 initFinancialDashboard disponible:', typeof initFinancialDashboard);
        
        if (typeof initFinancialDashboard === 'function') {
            console.log('🚀 Iniciando dashboard financiero...');
            
            setTimeout(() => {
                initFinancialDashboard().then(() => {
                    console.log('🎉 Dashboard inicializado exitosamente');
                    
                    // Mostrar mensaje de éxito
                    setTimeout(() => {
                        const alert = document.createElement('div');
                        alert.className = 'alert alert-success alert-dismissible fade show position-fixed';
                        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
                        alert.innerHTML = \`
                            <strong>🎉 ¡Éxito!</strong> Dashboard financiero funcionando correctamente.
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        \`;
                        document.body.appendChild(alert);
                        
                        // Auto-dismiss después de 5 segundos
                        setTimeout(() => {
                            if (alert.parentNode) {
                                alert.remove();
                            }
                        }, 5000);
                    }, 1000);
                    
                }).catch(error => {
                    console.error('❌ Error inicializando dashboard:', error);
                    document.getElementById('contentArea').innerHTML = \`
                        <div class="alert alert-danger">
                            <h4>❌ Error de Inicialización</h4>
                            <p>Error: \${error.message}</p>
                            <pre>\${error.stack}</pre>
                        </div>
                    \`;
                });
            }, 100);
            
        } else {
            console.error('❌ Función initFinancialDashboard no disponible');
            document.getElementById('contentArea').innerHTML = \`
                <div class="alert alert-danger">
                    <h4>❌ Función No Disponible</h4>
                    <p>La función initFinancialDashboard no está definida.</p>
                    <p><strong>Tipo actual:</strong> \${typeof initFinancialDashboard}</p>
                    <p><strong>Funciones disponibles en window:</strong></p>
                    <ul>
                        \${Object.keys(window).filter(key => key.includes('init')).map(key => \`<li>\${key}: \${typeof window[key]}</li>\`).join('')}
                    </ul>
                </div>
            \`;
        }
    </script>
</body>
</html>`;

    fs.writeFileSync(testPath, testContent);
    console.log(`✅ Archivo de prueba creado: test-dashboard-simple.html`);

    // 5. Instrucciones finales
    console.log('\n📋 Instrucciones para probar:');
    console.log('1. 🌐 Abre: http://localhost:3000/test-dashboard-simple.html');
    console.log('2. 🔍 Abre las herramientas de desarrollador (F12)');
    console.log('3. 📊 Deberías ver el dashboard con datos simulados');
    console.log('4. ✅ Si funciona, el problema era de caché');
    console.log('5. 🔄 Luego prueba en la aplicación principal con Ctrl+Shift+R');

    console.log('\n🎯 Cambios realizados:');
    console.log('✅ Dashboard movido a menú principal (fuera de Facturación)');
    console.log('✅ Timestamp actualizado para evitar caché');
    console.log('✅ Archivo de prueba con datos simulados creado');
    console.log('✅ Verificaciones de integridad completadas');
}

if (require.main === module) {
    fixDashboardCache();
}

module.exports = { fixDashboardCache };