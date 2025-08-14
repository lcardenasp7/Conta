/**
 * Financial Dashboard Module - Versión Final Ultra-Simplificada
 * Esta versión debe funcionar sin problemas
 */

let currentPeriod = 'current-month';
let dashboardData = null;
let isLoading = false;

// Inicializar dashboard financiero
async function initFinancialDashboard() {
    console.log('💰 Inicializando dashboard financiero FINAL...');
    
    try {
        if (isLoading) {
            console.log('⚠️ Ya se está cargando');
            return;
        }
        
        isLoading = true;
        
        // Mostrar loading
        if (typeof showLoading === 'function') {
            showLoading();
        }

        // Renderizar contenido
        renderDashboardContent();

        // Cargar datos
        await loadDashboardData();

        // Configurar listeners
        setupEventListeners();

        // Ocultar loading
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
        
        isLoading = false;
        console.log('✅ Dashboard financiero FINAL inicializado');

    } catch (error) {
        console.error('❌ Error inicializando dashboard FINAL:', error);
        isLoading = false;
        
        if (typeof showError === 'function') {
            showError('Error al cargar el dashboard: ' + error.message);
        }
        
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
    }
}

// Renderizar contenido del dashboard
function renderDashboardContent() {
    const contentArea = document.getElementById('contentArea');
    
    if (!contentArea) {
        throw new Error('contentArea no encontrado');
    }

    contentArea.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-cash-stack"></i> Dashboard Financiero</h2>
            <div class="btn-group">
                <button class="btn btn-outline-primary" onclick="exportReport()">
                    <i class="bi bi-download"></i> Exportar
                </button>
                <button class="btn btn-outline-success" onclick="showBalance()">
                    <i class="bi bi-calculator"></i> Balance
                </button>
            </div>
        </div>

        <!-- Período -->
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
                        <button class="btn btn-primary" onclick="refreshDashboard()">
                            <i class="bi bi-arrow-clockwise"></i> Actualizar
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Resumen -->
        <div class="row mb-4" id="summaryCards">
            <div class="col-12 text-center py-4">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2">Cargando resumen financiero...</p>
            </div>
        </div>

        <!-- Gráficos -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="bi bi-graph-up text-success"></i> Ingresos</h5>
                    </div>
                    <div class="card-body" style="height: 300px;">
                        <canvas id="incomeChart"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="bi bi-graph-down text-danger"></i> Gastos</h5>
                    </div>
                    <div class="card-body" style="height: 300px;">
                        <canvas id="expenseChart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tendencias -->
        <div class="card mb-4">
            <div class="card-header">
                <h5><i class="bi bi-graph-up-arrow"></i> Tendencias</h5>
            </div>
            <div class="card-body" style="height: 250px;">
                <canvas id="trendChart"></canvas>
            </div>
        </div>

        <!-- Listas -->
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="bi bi-clock-history"></i> Actividad Reciente</h5>
                    </div>
                    <div class="card-body">
                        <div id="recentActivity">
                            <div class="text-center py-3">
                                <div class="spinner-border spinner-border-sm"></div>
                                <span class="ms-2">Cargando...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="bi bi-exclamation-triangle text-warning"></i> Facturas Pendientes</h5>
                    </div>
                    <div class="card-body">
                        <div id="pendingInvoices">
                            <div class="text-center py-3">
                                <div class="spinner-border spinner-border-sm"></div>
                                <span class="ms-2">Cargando...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Cargar datos del dashboard
async function loadDashboardData() {
    console.log('📊 Cargando datos del dashboard...');
    
    try {
        // Verificar que api existe
        if (typeof api === 'undefined') {
            throw new Error('API no está disponible');
        }

        // Hacer llamada a la API
        console.log('🌐 Llamando a la API...');
        const response = await api.get('/financial-dashboard/overview?period=' + currentPeriod);
        
        console.log('📄 Respuesta recibida:', response);
        dashboardData = response;

        // Renderizar cada sección
        console.log('🔄 Renderizando secciones...');
        renderSummary(response.summary, response.period);
        renderCharts(response);
        renderLists(response);

        console.log('✅ Datos cargados exitosamente');

    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        
        // Mostrar error en el resumen
        const summaryCards = document.getElementById('summaryCards');
        if (summaryCards) {
            summaryCards.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <h5>❌ Error al cargar datos</h5>
                        <p>${error.message}</p>
                        <button class="btn btn-outline-danger" onclick="refreshDashboard()">
                            <i class="bi bi-arrow-clockwise"></i> Reintentar
                        </button>
                    </div>
                </div>
            `;
        }
        
        throw error;
    }
}

// Renderizar resumen
function renderSummary(summary, period) {
    console.log('📊 Renderizando resumen...');
    
    const summaryCards = document.getElementById('summaryCards');
    if (!summaryCards) return;

    try {
        const netClass = summary.netCashFlow >= 0 ? 'text-success' : 'text-danger';
        const netIcon = summary.netCashFlow >= 0 ? 'bi-arrow-up' : 'bi-arrow-down';

        summaryCards.innerHTML = `
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6>Ingresos</h6>
                                <h4>$${formatNumber(summary.totalIncome)}</h4>
                                <small>${period.name || 'Período'}</small>
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
                                <h6>Gastos</h6>
                                <h4>$${formatNumber(summary.totalExpenses)}</h4>
                                <small>${period.name || 'Período'}</small>
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
                                <h6>Flujo Neto</h6>
                                <h4 class="${netClass}">$${formatNumber(Math.abs(summary.netCashFlow))}</h4>
                                <small>${summary.netCashFlow >= 0 ? 'Positivo' : 'Negativo'}</small>
                            </div>
                            <i class="bi ${netIcon}-circle fs-1 opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-dark">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6>Pendientes</h6>
                                <h4>$${formatNumber(summary.pendingAmount)}</h4>
                                <small>${summary.pendingCount} facturas</small>
                            </div>
                            <i class="bi bi-clock-history fs-1 opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        console.log('✅ Resumen renderizado');
    } catch (error) {
        console.error('❌ Error renderizando resumen:', error);
        summaryCards.innerHTML = '<div class="col-12"><div class="alert alert-danger">Error en resumen</div></div>';
    }
}

// Renderizar gráficos
function renderCharts(data) {
    console.log('📈 Renderizando gráficos...');
    
    try {
        // Gráfico de ingresos
        renderSimpleChart('incomeChart', data.income.byCategory, 'Ingresos', 'green');
        
        // Gráfico de gastos
        renderSimpleChart('expenseChart', data.expenses.byCategory, 'Gastos', 'red');
        
        // Gráfico de tendencias
        renderTrendChart(data.trends);
        
        console.log('✅ Gráficos renderizados');
    } catch (error) {
        console.error('❌ Error renderizando gráficos:', error);
    }
}

// Renderizar gráfico simple
function renderSimpleChart(canvasId, categoryData, title, colorBase) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    try {
        const ctx = canvas.getContext('2d');
        
        if (!categoryData || Object.keys(categoryData).length === 0) {
            // Mostrar mensaje de sin datos
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('Sin datos disponibles', canvas.width / 2, canvas.height / 2);
            return;
        }

        const categories = Object.keys(categoryData);
        const amounts = categories.map(cat => categoryData[cat].total || 0);
        const colors = generateSimpleColors(categories.length, colorBase);

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.map(cat => getCategoryName(cat)),
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
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.label + ': $' + formatNumber(context.parsed);
                            }
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error(`❌ Error en gráfico ${canvasId}:`, error);
    }
}

// Renderizar gráfico de tendencias
function renderTrendChart(trends) {
    const canvas = document.getElementById('trendChart');
    if (!canvas || !trends || trends.length === 0) return;

    try {
        const ctx = canvas.getContext('2d');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: trends.map(t => t.monthName || 'Mes'),
                datasets: [
                    {
                        label: 'Ingresos',
                        data: trends.map(t => t.income || 0),
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Gastos',
                        data: trends.map(t => t.expenses || 0),
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
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '$' + formatNumber(value);
                            }
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Error en gráfico de tendencias:', error);
    }
}

// Renderizar listas
function renderLists(data) {
    console.log('📋 Renderizando listas...');
    
    try {
        // Actividad reciente
        const recentActivity = document.getElementById('recentActivity');
        if (recentActivity && data.recentActivity) {
            if (data.recentActivity.length === 0) {
                recentActivity.innerHTML = '<p class="text-muted text-center">No hay actividad reciente</p>';
            } else {
                recentActivity.innerHTML = data.recentActivity.slice(0, 5).map(activity => {
                    const isIncome = activity.type === 'income';
                    const iconClass = isIncome ? 'bi-arrow-up-circle text-success' : 'bi-arrow-down-circle text-danger';
                    const amountClass = isIncome ? 'text-success' : 'text-danger';
                    const sign = isIncome ? '+' : '-';

                    return `
                        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                            <div class="d-flex align-items-center">
                                <i class="bi ${iconClass} me-2"></i>
                                <div>
                                    <div class="fw-medium">${activity.description}</div>
                                    <small class="text-muted">${getCategoryName(activity.category)}</small>
                                </div>
                            </div>
                            <div class="text-end">
                                <div class="fw-bold ${amountClass}">${sign}$${formatNumber(activity.amount)}</div>
                                <small class="text-muted">${formatDate(activity.date)}</small>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // Facturas pendientes
        const pendingInvoices = document.getElementById('pendingInvoices');
        if (pendingInvoices && data.pending && data.pending.invoices) {
            if (data.pending.invoices.length === 0) {
                pendingInvoices.innerHTML = '<p class="text-muted text-center">No hay facturas pendientes</p>';
            } else {
                pendingInvoices.innerHTML = data.pending.invoices.slice(0, 5).map(invoice => {
                    const isOverdue = new Date(invoice.dueDate) < new Date();
                    const statusClass = isOverdue ? 'text-danger' : 'text-warning';
                    const statusText = isOverdue ? 'Vencida' : 'Pendiente';

                    return `
                        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                            <div>
                                <div class="fw-medium">${invoice.invoiceNumber}</div>
                                <small class="text-muted">
                                    ${invoice.student ? invoice.student.firstName + ' ' + invoice.student.lastName : 'Cliente'}
                                </small>
                            </div>
                            <div class="text-end">
                                <div class="fw-bold">$${formatNumber(invoice.total)}</div>
                                <small class="${statusClass}">${statusText}</small>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
        
        console.log('✅ Listas renderizadas');
    } catch (error) {
        console.error('❌ Error renderizando listas:', error);
    }
}

// Configurar event listeners
function setupEventListeners() {
    console.log('🔧 Configurando event listeners...');
    
    try {
        const periodSelect = document.getElementById('periodSelect');
        if (periodSelect) {
            periodSelect.addEventListener('change', function (e) {
                currentPeriod = e.target.value;
                refreshDashboard();
            });
        }
        
        console.log('✅ Event listeners configurados');
    } catch (error) {
        console.error('❌ Error configurando listeners:', error);
    }
}

// Funciones auxiliares
function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return new Intl.NumberFormat('es-CO').format(Math.round(num));
}

function formatDate(date) {
    if (!date) return 'N/A';
    try {
        return new Date(date).toLocaleDateString('es-CO');
    } catch (error) {
        return 'N/A';
    }
}

function getCategoryName(category) {
    const names = {
        'TUITION': 'Matrícula',
        'MONTHLY': 'Mensualidad',
        'EVENT': 'Eventos',
        'UNIFORM': 'Uniformes',
        'BOOKS': 'Libros',
        'TRANSPORT': 'Transporte',
        'CAFETERIA': 'Cafetería',
        'GRADUATION_FEE': 'Derecho de Grado',
        'OFFICE_SUPPLIES': 'Útiles de Oficina',
        'MAINTENANCE': 'Mantenimiento',
        'UTILITIES': 'Servicios Públicos',
        'CLEANING_SUPPLIES': 'Insumos de Aseo',
        'OTHER': 'Otros'
    };
    return names[category] || category;
}

function generateSimpleColors(count, baseColor) {
    const colors = [];
    const baseHue = baseColor === 'red' ? 0 : baseColor === 'green' ? 120 : 240;

    for (let i = 0; i < count; i++) {
        const hue = (baseHue + (i * 360 / count)) % 360;
        colors.push(`hsl(${hue}, 70%, 60%)`);
    }

    return colors;
}

// Funciones globales
function refreshDashboard() {
    console.log('🔄 Refrescando dashboard...');
    if (!isLoading) {
        loadDashboardData();
    }
}

function exportReport() {
    alert('Función de exportación en desarrollo');
}

function showBalance() {
    alert('Modal de balance en desarrollo');
}

// Exponer funciones globalmente
window.initFinancialDashboard = initFinancialDashboard;
window.refreshDashboard = refreshDashboard;
window.exportReport = exportReport;
window.showBalance = showBalance;

console.log('✅ Financial Dashboard FINAL cargado');