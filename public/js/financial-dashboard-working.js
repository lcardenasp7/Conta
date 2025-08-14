/**
 * Financial Dashboard Module - Versión Final Funcional
 * Versión simplificada que funciona sin problemas
 */

let currentPeriod = 'current-month';
let dashboardData = null;
let incomeChart = null;
let expenseChart = null;
let trendChart = null;
let isLoading = false;

// Inicializar dashboard financiero
async function initFinancialDashboard() {
    try {
        console.log('💰 Inicializando dashboard financiero...');
        
        if (isLoading) {
            console.log('⚠️ Dashboard ya se está cargando');
            return;
        }
        
        isLoading = true;
        showLoading();

        // Renderizar contenido del dashboard
        renderFinancialDashboardContent();

        // Cargar datos iniciales
        await loadFinancialOverview();

        // Configurar event listeners
        setupFinancialDashboardEventListeners();

        hideLoading();
        isLoading = false;
        console.log('✅ Dashboard financiero inicializado');

    } catch (error) {
        console.error('❌ Error inicializando dashboard financiero:', error);
        showError('Error al cargar el dashboard financiero: ' + error.message);
        hideLoading();
        isLoading = false;
    }
}

// Renderizar contenido del dashboard
function renderFinancialDashboardContent() {
    const contentArea = document.getElementById('contentArea');
    
    if (!contentArea) {
        throw new Error('Elemento contentArea no encontrado');
    }

    contentArea.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-cash-stack"></i> Dashboard Financiero</h2>
            <div class="btn-group">
                <button class="btn btn-outline-primary" onclick="exportFinancialReport()">
                    <i class="bi bi-download"></i> Exportar
                </button>
                <button class="btn btn-outline-success" onclick="showBalanceModal()">
                    <i class="bi bi-calculator"></i> Balance
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
            <div class="col-12 text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando resumen financiero...</p>
            </div>
        </div>

        <!-- Gráficos -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h5><i class="bi bi-graph-up text-success"></i> Ingresos por Categoría</h5>
                    </div>
                    <div class="card-body" style="position: relative; height: 300px;">
                        <canvas id="incomeChart" style="max-height: 250px;"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h5><i class="bi bi-graph-down text-danger"></i> Gastos por Categoría</h5>
                    </div>
                    <div class="card-body" style="position: relative; height: 300px;">
                        <canvas id="expenseChart" style="max-height: 250px;"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tendencias -->
        <div class="card mb-4">
            <div class="card-header">
                <h5><i class="bi bi-graph-up-arrow"></i> Tendencias Mensuales</h5>
            </div>
            <div class="card-body" style="position: relative; height: 250px;">
                <canvas id="trendChart" style="max-height: 200px;"></canvas>
            </div>
        </div>

        <!-- Actividad Reciente -->
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="bi bi-clock-history"></i> Actividad Reciente</h5>
                    </div>
                    <div class="card-body">
                        <div id="recentTransactions">
                            <div class="text-center">
                                <div class="spinner-border spinner-border-sm" role="status"></div>
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
                            <div class="text-center">
                                <div class="spinner-border spinner-border-sm" role="status"></div>
                                <span class="ms-2">Cargando...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Configurar event listeners
function setupFinancialDashboardEventListeners() {
    try {
        const periodSelect = document.getElementById('periodSelect');
        if (periodSelect) {
            periodSelect.addEventListener('change', function (e) {
                currentPeriod = e.target.value;
                loadFinancialOverview();
            });
            console.log('✅ Event listeners configurados');
        }
    } catch (error) {
        console.error('❌ Error configurando event listeners:', error);
    }
}

// Cargar overview financiero - VERSIÓN SIMPLIFICADA
async function loadFinancialOverview() {
    if (isLoading) {
        console.log('⚠️ Ya se está cargando el overview');
        return;
    }
    
    try {
        isLoading = true;
        console.log('📊 Cargando overview financiero para período:', currentPeriod);

        const response = await api.get('/financial-dashboard/overview?period=' + currentPeriod);
        dashboardData = response;

        console.log('📄 Datos recibidos:', response);

        // Renderizar componentes uno por uno
        console.log('🔄 Renderizando resumen...');
        renderFinancialSummary(response.summary, response.period);
        
        console.log('🔄 Renderizando gráficos...');
        renderIncomeChart(response.income.byCategory);
        renderExpenseChart(response.expenses.byCategory);
        renderTrendChart(response.trends);
        
        console.log('🔄 Renderizando listas...');
        renderRecentTransactions(response.recentActivity);
        renderPendingInvoices(response.pending.invoices);

        console.log('✅ Overview financiero cargado exitosamente');

    } catch (error) {
        console.error('❌ Error cargando overview financiero:', error);
        showError('Error al cargar los datos financieros: ' + error.message);
    } finally {
        isLoading = false;
    }
}

// Renderizar resumen financiero - SIMPLIFICADO
function renderFinancialSummary(summary, period) {
    const summaryContainer = document.getElementById('financialSummary');
    
    if (!summaryContainer) {
        console.error('❌ Elemento financialSummary no encontrado');
        return;
    }

    try {
        const netCashFlowClass = summary.netCashFlow >= 0 ? 'text-success' : 'text-danger';
        const netCashFlowIcon = summary.netCashFlow >= 0 ? 'bi-arrow-up' : 'bi-arrow-down';

        summaryContainer.innerHTML = `
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="card-title">Ingresos</h6>
                                <h4 class="mb-0">$${formatCurrency(summary.totalIncome)}</h4>
                                <small>${period.name || 'Período actual'}</small>
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
                                <h4 class="mb-0">$${formatCurrency(summary.totalExpenses)}</h4>
                                <small>${period.name || 'Período actual'}</small>
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
                                <h4 class="mb-0 ${netCashFlowClass}">$${formatCurrency(Math.abs(summary.netCashFlow))}</h4>
                                <small>${summary.netCashFlow >= 0 ? 'Positivo' : 'Negativo'}</small>
                            </div>
                            <i class="bi ${netCashFlowIcon}-circle fs-1 opacity-75"></i>
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
                                <h4 class="mb-0">$${formatCurrency(summary.pendingAmount)}</h4>
                                <small>${summary.pendingCount} facturas</small>
                            </div>
                            <i class="bi bi-clock-history fs-1 opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        console.log('✅ Resumen financiero renderizado');
    } catch (error) {
        console.error('❌ Error renderizando resumen financiero:', error);
        summaryContainer.innerHTML = '<div class="col-12"><div class="alert alert-danger">Error cargando resumen</div></div>';
    }
}

// Renderizar gráfico de ingresos - SIMPLIFICADO
function renderIncomeChart(incomeByCategory) {
    const chartElement = document.getElementById('incomeChart');
    if (!chartElement) {
        console.error('❌ Elemento incomeChart no encontrado');
        return;
    }

    try {
        // Destruir gráfico anterior
        if (incomeChart && typeof incomeChart.destroy === 'function') {
            incomeChart.destroy();
            incomeChart = null;
        }

        const ctx = chartElement.getContext('2d');
        
        // Verificar datos
        if (!incomeByCategory || Object.keys(incomeByCategory).length === 0) {
            console.log('⚠️ No hay datos de ingresos');
            renderEmptyChart(ctx, 'Sin datos de ingresos');
            return;
        }

        const categories = Object.keys(incomeByCategory);
        const amounts = categories.map(cat => {
            const categoryData = incomeByCategory[cat];
            return (categoryData && typeof categoryData.total === 'number') ? categoryData.total : 0;
        });
        
        const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
        if (totalAmount === 0) {
            renderEmptyChart(ctx, 'Sin ingresos en el período');
            return;
        }

        const colors = generateColors(categories.length);

        incomeChart = new Chart(ctx, {
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
                                const percentage = ((context.parsed / totalAmount) * 100).toFixed(1);
                                return context.label + ': $' + formatCurrency(context.parsed) + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
        
        console.log('✅ Gráfico de ingresos renderizado');
    } catch (error) {
        console.error('❌ Error renderizando gráfico de ingresos:', error);
    }
}

// Renderizar gráfico de gastos - SIMPLIFICADO
function renderExpenseChart(expensesByCategory) {
    const chartElement = document.getElementById('expenseChart');
    if (!chartElement) {
        console.error('❌ Elemento expenseChart no encontrado');
        return;
    }

    try {
        // Destruir gráfico anterior
        if (expenseChart && typeof expenseChart.destroy === 'function') {
            expenseChart.destroy();
            expenseChart = null;
        }

        const ctx = chartElement.getContext('2d');
        
        // Verificar datos
        if (!expensesByCategory || Object.keys(expensesByCategory).length === 0) {
            console.log('⚠️ No hay datos de gastos');
            renderEmptyChart(ctx, 'Sin datos de gastos');
            return;
        }

        const categories = Object.keys(expensesByCategory);
        const amounts = categories.map(cat => {
            const categoryData = expensesByCategory[cat];
            return (categoryData && typeof categoryData.total === 'number') ? categoryData.total : 0;
        });
        
        const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
        if (totalAmount === 0) {
            renderEmptyChart(ctx, 'Sin gastos en el período');
            return;
        }

        const colors = generateColors(categories.length, 'red');

        expenseChart = new Chart(ctx, {
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
                                const percentage = ((context.parsed / totalAmount) * 100).toFixed(1);
                                return context.label + ': $' + formatCurrency(context.parsed) + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
        
        console.log('✅ Gráfico de gastos renderizado');
    } catch (error) {
        console.error('❌ Error renderizando gráfico de gastos:', error);
    }
}

// Renderizar gráfico de tendencias - SIMPLIFICADO
function renderTrendChart(trends) {
    const chartElement = document.getElementById('trendChart');
    if (!chartElement) {
        console.error('❌ Elemento trendChart no encontrado');
        return;
    }

    try {
        // Destruir gráfico anterior
        if (trendChart && typeof trendChart.destroy === 'function') {
            trendChart.destroy();
            trendChart = null;
        }

        const ctx = chartElement.getContext('2d');
        
        // Verificar datos
        if (!trends || !Array.isArray(trends) || trends.length === 0) {
            console.log('⚠️ No hay datos de tendencias');
            renderEmptyChart(ctx, 'Sin datos de tendencias');
            return;
        }

        trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trends.map(t => t.monthName || 'Mes'),
                datasets: [
                    {
                        label: 'Ingresos',
                        data: trends.map(t => t.income || 0),
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Gastos',
                        data: trends.map(t => t.expenses || 0),
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Flujo Neto',
                        data: trends.map(t => t.net || 0),
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.dataset.label + ': $' + formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '$' + formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
        
        console.log('✅ Gráfico de tendencias renderizado');
    } catch (error) {
        console.error('❌ Error renderizando gráfico de tendencias:', error);
    }
}

// Función auxiliar para renderizar gráficos vacíos
function renderEmptyChart(ctx, message) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = '16px Arial';
    ctx.fillStyle = '#6c757d';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, ctx.canvas.width / 2, ctx.canvas.height / 2);
}

// Renderizar transacciones recientes - SIMPLIFICADO
function renderRecentTransactions(transactions) {
    const container = document.getElementById('recentTransactions');
    
    if (!container) {
        console.error('❌ Elemento recentTransactions no encontrado');
        return;
    }

    try {
        if (!transactions || transactions.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No hay transacciones recientes</p>';
            return;
        }

        container.innerHTML = transactions.slice(0, 5).map(transaction => {
            const isIncome = transaction.type === 'income';
            const iconClass = isIncome ? 'bi-arrow-up-circle text-success' : 'bi-arrow-down-circle text-danger';
            const amountClass = isIncome ? 'text-success' : 'text-danger';
            const sign = isIncome ? '+' : '-';

            return `
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div class="d-flex align-items-center">
                        <i class="bi ${iconClass} me-2"></i>
                        <div>
                            <div class="fw-medium">${transaction.description}</div>
                            <small class="text-muted">${getCategoryName(transaction.category)}</small>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold ${amountClass}">${sign}$${formatCurrency(transaction.amount)}</div>
                        <small class="text-muted">${formatDate(transaction.date)}</small>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('✅ Transacciones recientes renderizadas');
    } catch (error) {
        console.error('❌ Error renderizando transacciones:', error);
        container.innerHTML = '<div class="alert alert-warning">Error cargando transacciones</div>';
    }
}

// Renderizar facturas pendientes - SIMPLIFICADO
function renderPendingInvoices(invoices) {
    const container = document.getElementById('pendingInvoices');
    
    if (!container) {
        console.error('❌ Elemento pendingInvoices no encontrado');
        return;
    }

    try {
        if (!invoices || invoices.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No hay facturas pendientes</p>';
            return;
        }

        container.innerHTML = invoices.slice(0, 5).map(invoice => {
            const isOverdue = new Date(invoice.dueDate) < new Date();
            const statusClass = isOverdue ? 'text-danger' : 'text-warning';
            const statusText = isOverdue ? 'Vencida' : 'Pendiente';

            return `
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                        <div class="fw-medium">${invoice.invoiceNumber}</div>
                        <small class="text-muted">
                            ${invoice.student ? invoice.student.firstName + ' ' + invoice.student.lastName : 'Cliente Externo'}
                        </small>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold">$${formatCurrency(invoice.total)}</div>
                        <small class="${statusClass}">${statusText}</small>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('✅ Facturas pendientes renderizadas');
    } catch (error) {
        console.error('❌ Error renderizando facturas pendientes:', error);
        container.innerHTML = '<div class="alert alert-warning">Error cargando facturas</div>';
    }
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
        'GRADUATION_FEE': 'Derecho de Grado',
        'OFFICE_SUPPLIES': 'Útiles de Oficina',
        'MAINTENANCE': 'Mantenimiento',
        'UTILITIES': 'Servicios Públicos',
        'PROFESSIONAL_SERVICES': 'Servicios Profesionales',
        'EQUIPMENT': 'Equipos',
        'CLEANING_SUPPLIES': 'Insumos de Aseo',
        'FOOD_SUPPLIES': 'Insumos de Cafetería',
        'EDUCATIONAL_MATERIALS': 'Material Educativo',
        'TECHNOLOGY': 'Tecnología',
        'INSURANCE': 'Seguros',
        'RENT': 'Arrendamiento',
        'OTHER': 'Otros'
    };
    return names[category] || category;
}

function generateColors(count, baseColor) {
    const colors = [];
    const baseHue = baseColor === 'red' ? 0 : baseColor === 'green' ? 120 : 240;

    for (let i = 0; i < count; i++) {
        const hue = (baseHue + (i * 360 / count)) % 360;
        colors.push(`hsl(${hue}, 70%, 60%)`);
    }

    return colors;
}

function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return '0';
    }
    return new Intl.NumberFormat('es-CO').format(Math.round(amount));
}

function formatDate(date) {
    if (!date) return 'Fecha no disponible';
    try {
        return new Date(date).toLocaleDateString('es-CO');
    } catch (error) {
        return 'Fecha inválida';
    }
}

// Funciones placeholder
function exportFinancialReport() {
    if (typeof showInfo === 'function') {
        showInfo('Función de exportación en desarrollo');
    } else {
        alert('Función de exportación en desarrollo');
    }
}

function showBalanceModal() {
    if (typeof showInfo === 'function') {
        showInfo('Modal de balance personalizado en desarrollo');
    } else {
        alert('Modal de balance personalizado en desarrollo');
    }
}

// Exponer funciones globalmente
window.initFinancialDashboard = initFinancialDashboard;
window.loadFinancialOverview = loadFinancialOverview;
window.exportFinancialReport = exportFinancialReport;
window.showBalanceModal = showBalanceModal;

console.log('✅ Financial Dashboard Working cargado correctamente');