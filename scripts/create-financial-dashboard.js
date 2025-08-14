/**
 * Script para crear el archivo financial-dashboard.js
 */

const fs = require('fs');
const path = require('path');

const dashboardCode = `/**
 * Financial Dashboard Module
 * Sistema completo de dashboard financiero
 */

let currentPeriod = 'current-month';
let dashboardData = null;
let incomeChart = null;
let expenseChart = null;
let trendChart = null;

// Inicializar dashboard financiero
async function initFinancialDashboard() {
    try {
        console.log('💰 Inicializando dashboard financiero...');
        showLoading();

        // Renderizar contenido del dashboard
        renderFinancialDashboardContent();

        // Cargar datos iniciales
        await loadFinancialOverview();

        // Configurar event listeners
        setupFinancialDashboardEventListeners();

        hideLoading();
        console.log('✅ Dashboard financiero inicializado');

    } catch (error) {
        console.error('❌ Error inicializando dashboard financiero:', error);
        showError('Error al cargar el dashboard financiero');
        hideLoading();
    }
}

// Renderizar contenido del dashboard
function renderFinancialDashboardContent() {
    const contentArea = document.getElementById('contentArea');

    contentArea.innerHTML = \`
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-cash-stack"></i> Dashboard Financiero</h2>
            <div class="btn-group">
                <button class="btn btn-outline-primary" onclick="exportFinancialReport()">
                    <i class="bi bi-download"></i> Exportar
                </button>
                <button class="btn btn-outline-success" onclick="showBalanceModal()">
                    <i class="bi bi-calculator"></i> Balance Personalizado
                </button>
            </div>
        </div>

        <!-- Filtros de Período -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <label class="form-label">Período</label>
                        <select class="form-select" id="periodSelect">
                            <option value="current-month">Mes Actual</option>
                            <option value="last-month">Mes Anterior</option>
                            <option value="last-30-days">Últimos 30 Días</option>
                            <option value="current-year">Año Actual</option>
                        </select>
                    </div>
                    <div class="col-md-6 text-end">
                        <button class="btn btn-primary" onclick="loadFinancialOverview()">
                            <i class="bi bi-arrow-clockwise"></i> Actualizar
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Resumen Financiero -->
        <div class="row mb-4" id="financialSummary">
            <!-- Se llena dinámicamente -->
        </div>

        <!-- Gráficos y Análisis -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h5><i class="bi bi-graph-up text-success"></i> Ingresos por Categoría</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="incomeChart" height="300"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h5><i class="bi bi-graph-down text-danger"></i> Gastos por Categoría</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="expenseChart" height="300"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tendencias Mensuales -->
        <div class="card mb-4">
            <div class="card-header">
                <h5><i class="bi bi-graph-up-arrow"></i> Tendencias Mensuales</h5>
            </div>
            <div class="card-body">
                <canvas id="trendChart" height="200"></canvas>
            </div>
        </div>

        <!-- Transacciones Recientes y Facturas Pendientes -->
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5><i class="bi bi-clock-history"></i> Actividad Reciente</h5>
                        <button class="btn btn-sm btn-outline-primary" onclick="showAllTransactions()">
                            Ver Todo
                        </button>
                    </div>
                    <div class="card-body">
                        <div id="recentTransactions">
                            <!-- Se llena dinámicamente -->
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5><i class="bi bi-exclamation-triangle text-warning"></i> Facturas Pendientes</h5>
                        <button class="btn btn-sm btn-outline-warning" onclick="showAllPendingInvoices()">
                            Ver Todo
                        </button>
                    </div>
                    <div class="card-body">
                        <div id="pendingInvoices">
                            <!-- Se llena dinámicamente -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    \`;
}

// Configurar event listeners
function setupFinancialDashboardEventListeners() {
    document.getElementById('periodSelect').addEventListener('change', function(e) {
        currentPeriod = e.target.value;
        loadFinancialOverview();
    });
}

// Cargar overview financiero
async function loadFinancialOverview() {
    try {
        showLoading();
        console.log('📊 Cargando overview financiero para período: ' + currentPeriod);

        const response = await API.request('GET', '/api/financial-dashboard/overview?period=' + currentPeriod);
        dashboardData = response;

        renderFinancialSummary(response.summary, response.period);
        renderIncomeChart(response.income.byCategory);
        renderExpenseChart(response.expenses.byCategory);
        renderTrendChart(response.trends);
        renderRecentTransactions(response.recentActivity);
        renderPendingInvoices(response.pending.invoices);

        hideLoading();
        console.log('✅ Overview financiero cargado exitosamente');

    } catch (error) {
        console.error('❌ Error cargando overview financiero:', error);
        showError('Error al cargar los datos financieros');
        hideLoading();
    }
}

// Renderizar resumen financiero
function renderFinancialSummary(summary, period) {
    const summaryContainer = document.getElementById('financialSummary');
    
    const netCashFlowClass = summary.netCashFlow >= 0 ? 'text-success' : 'text-danger';
    const netCashFlowIcon = summary.netCashFlow >= 0 ? 'bi-arrow-up' : 'bi-arrow-down';

    summaryContainer.innerHTML = \`
        <div class="col-md-3">
            <div class="card bg-success text-white">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="card-title">Ingresos</h6>
                            <h4 class="mb-0">$\${formatCurrency(summary.totalIncome)}</h4>
                            <small>\${period.name}</small>
                        </div>
                        <i class="bi bi-arrow-up-circle fs-1 opacity-75"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card bg-danger text-white">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="card-title">Gastos</h6>
                            <h4 class="mb-0">$\${formatCurrency(summary.totalExpenses)}</h4>
                            <small>\${period.name}</small>
                        </div>
                        <i class="bi bi-arrow-down-circle fs-1 opacity-75"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card bg-primary text-white">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="card-title">Flujo Neto</h6>
                            <h4 class="mb-0 \${netCashFlowClass}">$\${formatCurrency(Math.abs(summary.netCashFlow))}</h4>
                            <small>\${summary.netCashFlow >= 0 ? 'Positivo' : 'Negativo'}</small>
                        </div>
                        <i class="bi \${netCashFlowIcon}-circle fs-1 opacity-75"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card bg-warning text-dark">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="card-title">Pendientes</h6>
                            <h4 class="mb-0">$\${formatCurrency(summary.pendingAmount)}</h4>
                            <small>\${summary.pendingCount} facturas</small>
                        </div>
                        <i class="bi bi-clock-history fs-1 opacity-75"></i>
                    </div>
                </div>
            </div>
        </div>
    \`;
}

// Renderizar gráfico de ingresos
function renderIncomeChart(incomeByCategory) {
    const ctx = document.getElementById('incomeChart').getContext('2d');
    
    if (incomeChart) {
        incomeChart.destroy();
    }

    const categories = Object.keys(incomeByCategory);
    const amounts = categories.map(function(cat) { return incomeByCategory[cat].total; });
    const colors = generateColors(categories.length);

    incomeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.map(function(cat) { return getCategoryName(cat); }),
            datasets: [{
                data: amounts,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Renderizar gráfico de gastos
function renderExpenseChart(expensesByCategory) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    if (expenseChart) {
        expenseChart.destroy();
    }

    const categories = Object.keys(expensesByCategory);
    const amounts = categories.map(function(cat) { return expensesByCategory[cat].total; });
    const colors = generateColors(categories.length, 'red');

    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.map(function(cat) { return getCategoryName(cat); }),
            datasets: [{
                data: amounts,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Renderizar gráfico de tendencias
function renderTrendChart(trends) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    if (trendChart) {
        trendChart.destroy();
    }

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trends.map(function(t) { return t.monthName; }),
            datasets: [
                {
                    label: 'Ingresos',
                    data: trends.map(function(t) { return t.income; }),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Gastos',
                    data: trends.map(function(t) { return t.expenses; }),
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Renderizar transacciones recientes
function renderRecentTransactions(transactions) {
    const container = document.getElementById('recentTransactions');
    
    if (!transactions || transactions.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No hay transacciones recientes</p>';
        return;
    }

    container.innerHTML = transactions.map(function(transaction) {
        const isIncome = transaction.type === 'income';
        const iconClass = isIncome ? 'bi-arrow-up-circle text-success' : 'bi-arrow-down-circle text-danger';
        const amountClass = isIncome ? 'text-success' : 'text-danger';
        const sign = isIncome ? '+' : '-';

        return \`
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div class="d-flex align-items-center">
                    <i class="bi \${iconClass} me-2"></i>
                    <div>
                        <div class="fw-medium">\${transaction.description}</div>
                        <small class="text-muted">\${getCategoryName(transaction.category)}</small>
                    </div>
                </div>
                <div class="text-end">
                    <div class="fw-bold \${amountClass}">\${sign}$\${formatCurrency(transaction.amount)}</div>
                    <small class="text-muted">\${formatDate(transaction.date)}</small>
                </div>
            </div>
        \`;
    }).join('');
}

// Renderizar facturas pendientes
function renderPendingInvoices(invoices) {
    const container = document.getElementById('pendingInvoices');
    
    if (!invoices || invoices.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No hay facturas pendientes</p>';
        return;
    }

    container.innerHTML = invoices.map(function(invoice) {
        const isOverdue = new Date(invoice.dueDate) < new Date();
        const statusClass = isOverdue ? 'text-danger' : 'text-warning';
        const statusText = isOverdue ? 'Vencida' : 'Pendiente';

        return \`
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div>
                    <div class="fw-medium">\${invoice.invoiceNumber}</div>
                    <small class="text-muted">
                        \${invoice.student ? invoice.student.firstName + ' ' + invoice.student.lastName : 'Cliente Externo'}
                    </small>
                </div>
                <div class="text-end">
                    <div class="fw-bold">$\${formatCurrency(invoice.total)}</div>
                    <small class="\${statusClass}">\${statusText}</small>
                </div>
            </div>
        \`;
    }).join('');
}

// Funciones auxiliares
function getCategoryName(category) {
    const names = {
        'TUITION': 'Matrícula',
        'MONTHLY': 'Mensualidad',
        'EVENT': 'Eventos',
        'UNIFORM': 'Uniformes',
        'BOOKS': 'Libros',
        'TRANSPORT': 'Transporte',
        'CAFETERIA': 'Cafetería',
        'OTHER': 'Otros'
    };
    return names[category] || category;
}

function generateColors(count, baseColor) {
    const colors = [];
    const baseHue = baseColor === 'red' ? 0 : 240;
    
    for (let i = 0; i < count; i++) {
        const hue = (baseHue + (i * 360 / count)) % 360;
        colors.push('hsl(' + hue + ', 70%, 60%)');
    }
    
    return colors;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO').format(amount);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('es-CO');
}

// Funciones placeholder
function exportFinancialReport() {
    showInfo('Función de exportación en desarrollo');
}

function showBalanceModal() {
    showInfo('Modal de balance personalizado en desarrollo');
}

function showAllTransactions() {
    showInfo('Vista de todas las transacciones en desarrollo');
}

function showAllPendingInvoices() {
    showInfo('Vista de todas las facturas pendientes en desarrollo');
}

// Exponer función globalmente
window.initFinancialDashboard = initFinancialDashboard;
`;

function createFinancialDashboard() {
    const filePath = path.join(__dirname, '..', 'public', 'js', 'financial-dashboard.js');
    
    try {
        fs.writeFileSync(filePath, dashboardCode, 'utf8');
        console.log('✅ Archivo financial-dashboard.js creado exitosamente');
        console.log('📊 Tamaño:', fs.statSync(filePath).size, 'bytes');
        
        // Verificar que se escribió correctamente
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('initFinancialDashboard')) {
            console.log('✅ Función initFinancialDashboard encontrada');
        } else {
            console.error('❌ Función initFinancialDashboard NO encontrada');
        }
        
        if (content.includes('window.initFinancialDashboard')) {
            console.log('✅ Función exportada globalmente');
        } else {
            console.error('❌ Función NO exportada globalmente');
        }
        
    } catch (error) {
        console.error('❌ Error creando archivo:', error);
    }
}

if (require.main === module) {
    createFinancialDashboard();
}

module.exports = { createFinancialDashboard };