/**
 * Script para corregir las verificaciones de elementos en el dashboard
 */

const fs = require('fs');
const path = require('path');

function fixDashboardElements() {
    console.log('🔧 Corrigiendo verificaciones de elementos...\n');

    const jsPath = path.join(__dirname, '..', 'public', 'js', 'financial-dashboard.js');
    let content = fs.readFileSync(jsPath, 'utf8');

    // Lista de funciones que necesitan verificación de elementos
    const fixes = [
        {
            name: 'renderIncomeChart',
            elementId: 'incomeChart',
            search: `function renderIncomeChart(incomeByCategory) {
    const ctx = document.getElementById('incomeChart').getContext('2d');`,
            replace: `function renderIncomeChart(incomeByCategory) {
    const canvas = document.getElementById('incomeChart');
    if (!canvas) {
        console.warn('⚠️ Elemento incomeChart no encontrado');
        return;
    }
    const ctx = canvas.getContext('2d');`
        },
        {
            name: 'renderExpenseChart',
            elementId: 'expenseChart',
            search: `function renderExpenseChart(expensesByCategory) {
    const ctx = document.getElementById('expenseChart').getContext('2d');`,
            replace: `function renderExpenseChart(expensesByCategory) {
    const canvas = document.getElementById('expenseChart');
    if (!canvas) {
        console.warn('⚠️ Elemento expenseChart no encontrado');
        return;
    }
    const ctx = canvas.getContext('2d');`
        },
        {
            name: 'renderTrendChart',
            elementId: 'trendChart',
            search: `function renderTrendChart(trends) {
    const ctx = document.getElementById('trendChart').getContext('2d');`,
            replace: `function renderTrendChart(trends) {
    const canvas = document.getElementById('trendChart');
    if (!canvas) {
        console.warn('⚠️ Elemento trendChart no encontrado');
        return;
    }
    const ctx = canvas.getContext('2d');`
        },
        {
            name: 'renderRecentTransactions',
            elementId: 'recentTransactions',
            search: `function renderRecentTransactions(transactions) {
    const container = document.getElementById('recentTransactions');
    
    if (!transactions || transactions.length === 0) {`,
            replace: `function renderRecentTransactions(transactions) {
    const container = document.getElementById('recentTransactions');
    
    if (!container) {
        console.warn('⚠️ Elemento recentTransactions no encontrado');
        return;
    }
    
    if (!transactions || transactions.length === 0) {`
        },
        {
            name: 'renderPendingInvoices',
            elementId: 'pendingInvoices',
            search: `function renderPendingInvoices(invoices) {
    const container = document.getElementById('pendingInvoices');
    
    if (!invoices || invoices.length === 0) {`,
            replace: `function renderPendingInvoices(invoices) {
    const container = document.getElementById('pendingInvoices');
    
    if (!container) {
        console.warn('⚠️ Elemento pendingInvoices no encontrado');
        return;
    }
    
    if (!invoices || invoices.length === 0) {`
        }
    ];

    let fixesApplied = 0;

    fixes.forEach(fix => {
        if (content.includes(fix.search)) {
            content = content.replace(fix.search, fix.replace);
            console.log(`✅ ${fix.name} corregida`);
            fixesApplied++;
        } else {
            console.log(`⚠️ ${fix.name} no encontrada o ya corregida`);
        }
    });

    // Escribir archivo corregido
    fs.writeFileSync(jsPath, content);

    console.log(`\n📊 Resumen:`);
    console.log(`✅ Correcciones aplicadas: ${fixesApplied}/${fixes.length}`);
    console.log(`📄 Archivo actualizado: ${jsPath}`);
    console.log(`📏 Tamaño: ${fs.statSync(jsPath).size} bytes`);

    // Crear nueva versión del archivo de prueba
    const timestamp = Date.now();
    const testPath = path.join(__dirname, '..', 'public', 'test-dashboard-fixed.html');
    
    const testContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Dashboard Financiero - Versión Corregida</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</head>
<body class="bg-light">
    <div class="container-fluid p-4">
        <div class="row">
            <div class="col-12">
                <div class="alert alert-success">
                    <h4>🔧 Dashboard Financiero - Versión Corregida</h4>
                    <p>Esta versión incluye verificaciones de elementos para evitar errores.</p>
                </div>
            </div>
        </div>
        
        <div id="contentArea">
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-3">Inicializando dashboard corregido...</p>
            </div>
        </div>
    </div>

    <script>
        // Funciones globales simuladas
        window.showLoading = () => {
            const contentArea = document.getElementById('contentArea');
            if (contentArea) {
                contentArea.innerHTML = \`
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-3">Cargando datos financieros...</p>
                    </div>
                \`;
            }
        };
        
        window.hideLoading = () => {
            console.log('✅ Carga completada');
        };
        
        window.showError = (msg) => {
            const contentArea = document.getElementById('contentArea');
            if (contentArea) {
                contentArea.innerHTML = \`
                    <div class="alert alert-danger">
                        <h4>❌ Error</h4>
                        <p>\${msg}</p>
                    </div>
                \`;
            }
        };
        
        window.showInfo = (msg) => {
            alert('ℹ️ ' + msg);
        };
        
        // API simulada con datos realistas
        window.API = {
            request: async (method, url) => {
                console.log('📡 API Request:', method, url);
                
                // Simular delay de red
                await new Promise(resolve => setTimeout(resolve, 300));
                
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
                            }
                        ]
                    }
                };
            }
        };
    </script>
    
    <script src="js/financial-dashboard.js?v=${timestamp}"></script>
    
    <script>
        console.log('=== DASHBOARD FINANCIERO CORREGIDO ===');
        console.log('✅ Chart.js disponible:', typeof Chart !== 'undefined');
        console.log('✅ Bootstrap disponible:', typeof bootstrap !== 'undefined');
        console.log('✅ API simulada disponible:', typeof API !== 'undefined');
        console.log('🔍 initFinancialDashboard disponible:', typeof initFinancialDashboard);
        
        if (typeof initFinancialDashboard === 'function') {
            console.log('🚀 Iniciando dashboard financiero corregido...');
            
            setTimeout(() => {
                initFinancialDashboard().then(() => {
                    console.log('🎉 Dashboard inicializado sin errores');
                    
                    // Mostrar mensaje de éxito
                    setTimeout(() => {
                        const alert = document.createElement('div');
                        alert.className = 'alert alert-success alert-dismissible fade show position-fixed';
                        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
                        alert.innerHTML = \`
                            <strong>🎉 ¡Perfecto!</strong> Dashboard funcionando sin errores.
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        \`;
                        document.body.appendChild(alert);
                        
                        setTimeout(() => {
                            if (alert.parentNode) {
                                alert.remove();
                            }
                        }, 5000);
                    }, 1000);
                    
                }).catch(error => {
                    console.error('❌ Error inicializando dashboard:', error);
                    const contentArea = document.getElementById('contentArea');
                    if (contentArea) {
                        contentArea.innerHTML = \`
                            <div class="alert alert-danger">
                                <h4>❌ Error de Inicialización</h4>
                                <p>Error: \${error.message}</p>
                            </div>
                        \`;
                    }
                });
            }, 100);
            
        } else {
            console.error('❌ Función initFinancialDashboard no disponible');
        }
    </script>
</body>
</html>`;

    fs.writeFileSync(testPath, testContent);
    console.log(`✅ Archivo de prueba corregido creado: test-dashboard-fixed.html`);

    console.log('\n📋 Instrucciones:');
    console.log('1. 🌐 Abre: http://localhost:3000/test-dashboard-fixed.html');
    console.log('2. 🔍 Deberías ver el dashboard sin errores');
    console.log('3. ✅ Si funciona, prueba en la aplicación principal');
    console.log('4. 🔄 Usa Ctrl+Shift+R para forzar recarga');
}

if (require.main === module) {
    fixDashboardElements();
}

module.exports = { fixDashboardElements };