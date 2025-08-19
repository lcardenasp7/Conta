// Dashboard Management

let incomeExpenseChart = null;
let incomeDistributionChart = null;
let dashboardUpdateInterval = null;

// Load dashboard data
async function loadDashboard() {
    try {
        showLoading(true);

        // Load dashboard statistics
        const stats = await api.getDashboardStats();
        updateDashboardStats(stats);

        // Load recent activities
        const activities = await api.getDashboardActivities();
        updateRecentActivities(activities);

        // Load charts
        await loadDashboardCharts();

    } catch (error) {
        console.error('Error loading dashboard:', error);
        handleApiError(error);
    } finally {
        showLoading(false);
    }
}

// Update dashboard statistics
function updateDashboardStats(stats) {
    if (!stats) return;

    // Estadísticas principales
    const summary = stats.summary || {};
    const income = stats.income || {};
    const expenses = stats.expenses || {};
    const balance = stats.balance || {};
    const debts = stats.debts || {};
    const metrics = stats.metrics || {};

    // Actualizar tarjetas principales
    updateStatCard('totalStudents', summary.activeStudents, summary.totalStudents);
    updateStatCard('monthlyIncome', formatCurrency(income.thisMonth), 'Este mes');
    updateStatCard('monthlyExpenses', formatCurrency(expenses.thisMonth), 'Este mes');
    updateStatCard('monthlyBalance', formatCurrency(balance.thisMonth),
        balance.thisMonth >= 0 ? 'Positivo' : 'Negativo');
    updateStatCard('pendingInvoices', summary.pendingInvoices, `${summary.overdueInvoices} vencidas`);
    updateStatCard('activeEvents', summary.activeEvents, `${summary.totalEvents} total`);

    // Actualizar métricas adicionales
    updateMetricCard('studentActivePercentage', metrics.studentActivePercentage, '%');
    updateMetricCard('invoicePaidPercentage', metrics.invoicePaidPercentage, '%');
    updateMetricCard('totalDebtAmount', formatCurrency(debts.totalAmount), `${debts.totalDebtors} deudores`);
    updateMetricCard('averageDebtPerStudent', formatCurrency(metrics.averageDebtPerStudent), 'Promedio');

    // Actualizar ingresos y egresos detallados
    updateFinancialDetails(income, expenses, balance);

    // Actualizar categorías
    updateIncomeCategories(income.categories || []);
    updateExpenseCategories(expenses.categories || []);
}

// Actualizar tarjeta de estadística
function updateStatCard(elementId, mainValue, subValue) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = mainValue || 0;

        // Actualizar subtexto si existe
        const subElement = element.parentElement.querySelector('.text-muted');
        if (subElement && subValue) {
            subElement.textContent = subValue;
        }
    }
}

// Actualizar tarjeta de métrica
function updateMetricCard(elementId, value, suffix) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = `${value || 0}${suffix || ''}`;
    }
}

// Actualizar detalles financieros
function updateFinancialDetails(income, expenses, balance) {
    const todayIncomeElement = document.getElementById('todayIncome');
    const yearIncomeElement = document.getElementById('yearIncome');
    const yearExpensesElement = document.getElementById('yearExpenses');
    const yearBalanceElement = document.getElementById('yearBalance');

    if (todayIncomeElement) todayIncomeElement.textContent = formatCurrency(income.today || 0);
    if (yearIncomeElement) yearIncomeElement.textContent = formatCurrency(income.thisYear || 0);
    if (yearExpensesElement) yearExpensesElement.textContent = formatCurrency(expenses.thisYear || 0);
    if (yearBalanceElement) {
        yearBalanceElement.textContent = formatCurrency(balance.thisYear || 0);
        yearBalanceElement.className = balance.thisYear >= 0 ? 'text-success' : 'text-danger';
    }
}

// Actualizar categorías de ingresos
function updateIncomeCategories(categories) {
    const container = document.getElementById('incomeCategories');
    if (!container) return;

    if (categories.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay ingresos este mes</p>';
        return;
    }

    container.innerHTML = categories.map(category => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="d-flex align-items-center">
                <div class="category-color me-2" style="background-color: ${category.color}; width: 12px; height: 12px; border-radius: 50%;"></div>
                <span>${category.name}</span>
            </div>
            <strong>${formatCurrency(category.amount)}</strong>
        </div>
    `).join('');
}

// Actualizar categorías de egresos
function updateExpenseCategories(categories) {
    const container = document.getElementById('expenseCategories');
    if (!container) return;

    if (categories.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay gastos este mes</p>';
        return;
    }

    container.innerHTML = categories.map(category => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="d-flex align-items-center">
                <div class="category-color me-2" style="background-color: ${category.color}; width: 12px; height: 12px; border-radius: 50%;"></div>
                <span>${category.name}</span>
            </div>
            <strong>${formatCurrency(category.amount)}</strong>
        </div>
    `).join('');
}

// Actualizar actividades recientes
function updateRecentActivities(activities) {
    if (!activities) return;

    updateRecentPayments(activities.recentPayments || []);
    updateRecentInvoices(activities.recentInvoices || []);
    updateUpcomingEvents(activities.upcomingEvents || []);
}

// Actualizar pagos recientes
function updateRecentPayments(payments) {
    const container = document.getElementById('recentPayments');
    if (!container) return;

    if (payments.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay pagos recientes</p>';
        return;
    }

    container.innerHTML = payments.map(payment => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <strong>${payment.student.firstName} ${payment.student.lastName}</strong>
                <br>
                <small class="text-muted">${formatDate(payment.date)}</small>
            </div>
            <div class="text-end">
                <span class="badge bg-success">${formatCurrency(payment.amount)}</span>
                <br>
                <small class="text-muted">${payment.method}</small>
            </div>
        </div>
    `).join('');
}

// Actualizar facturas recientes
function updateRecentInvoices(invoices) {
    const container = document.getElementById('recentInvoices');
    if (!container) return;

    if (invoices.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay facturas recientes</p>';
        return;
    }

    container.innerHTML = invoices.map(invoice => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <strong>${invoice.student.firstName} ${invoice.student.lastName}</strong>
                <br>
                <small class="text-muted">${invoice.invoiceNumber}</small>
            </div>
            <div class="text-end">
                <span class="badge bg-${getInvoiceStatusColor(invoice.status)}">${formatCurrency(invoice.total)}</span>
                <br>
                <small class="text-muted">${getInvoiceStatusText(invoice.status)}</small>
            </div>
        </div>
    `).join('');
}

// Actualizar eventos próximos
function updateUpcomingEvents(events) {
    const container = document.getElementById('upcomingEvents');
    if (!container) return;

    if (events.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay eventos próximos</p>';
        return;
    }

    container.innerHTML = events.map(event => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <strong>${event.name}</strong>
                <br>
                <small class="text-muted">${event.type}</small>
            </div>
            <div class="text-end">
                <small class="text-muted">${formatDate(event.eventDate)}</small>
                <br>
                <span class="badge bg-${getEventStatusColor(event.status)}">${getEventStatusText(event.status)}</span>
            </div>
        </div>
    `).join('');
}

// Funciones auxiliares para estados
function getInvoiceStatusColor(status) {
    const colors = {
        'PENDING': 'warning',
        'PAID': 'success',
        'PARTIAL': 'info',
        'OVERDUE': 'danger',
        'CANCELLED': 'secondary'
    };
    return colors[status] || 'secondary';
}

function getInvoiceStatusText(status) {
    const texts = {
        'PENDING': 'Pendiente',
        'PAID': 'Pagada',
        'PARTIAL': 'Parcial',
        'OVERDUE': 'Vencida',
        'CANCELLED': 'Cancelada'
    };
    return texts[status] || status;
}

function getEventStatusColor(status) {
    const colors = {
        'PLANNING': 'info',
        'ACTIVE': 'success',
        'COMPLETED': 'secondary',
        'CANCELLED': 'danger'
    };
    return colors[status] || 'secondary';
}

function getEventStatusText(status) {
    const texts = {
        'PLANNING': 'Planeando',
        'ACTIVE': 'Activo',
        'COMPLETED': 'Completado',
        'CANCELLED': 'Cancelado'
    };
    return texts[status] || status;
}

// Load dashboard charts
async function loadDashboardCharts() {
    try {
        // Destroy all existing charts first
        destroyAllCharts();
        
        // Small delay to ensure charts are destroyed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Load income vs expense chart
        await loadIncomeExpenseChart();

        // Load income distribution chart
        await loadIncomeDistributionChart();

    } catch (error) {
        console.error('Error loading charts:', error);
    }
}

// Destroy all existing charts
function destroyAllCharts() {
    if (window.incomeExpenseChart) {
        window.incomeExpenseChart.destroy();
        window.incomeExpenseChart = null;
    }
    
    if (window.incomeDistributionChart) {
        window.incomeDistributionChart.destroy();
        window.incomeDistributionChart = null;
    }
    
    // Clear any Chart.js instances from the registry
    Object.keys(Chart.instances).forEach(key => {
        Chart.instances[key].destroy();
    });
}

// Load income vs expense chart
async function loadIncomeExpenseChart() {
    const ctx = document.getElementById('incomeExpenseChart');
    if (!ctx) return;

    // Destroy existing chart more thoroughly
    if (window.incomeExpenseChart) {
        window.incomeExpenseChart.destroy();
        window.incomeExpenseChart = null;
    }
    
    // Clear the canvas
    ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);

    try {
        // Try to get real data from API
        const response = await api.getDashboardChartData('monthly-income-expense');
        const chartData = response;

        const data = {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Ingresos',
                    data: chartData.income,
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Gastos',
                    data: chartData.expenses,
                    backgroundColor: 'rgba(231, 76, 60, 0.2)',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        };

        window.incomeExpenseChart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Ingresos vs Gastos Mensuales'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    } catch (error) {
        console.error('Error loading income/expense chart:', error);
        // Fallback to sample data
        loadSampleIncomeExpenseChart(ctx);
    }
}

// Fallback chart with sample data
function loadSampleIncomeExpenseChart(ctx) {
    // Destroy existing chart if it exists
    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
        incomeExpenseChart = null;
    }
    
    const data = {
        labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
        datasets: [
            {
                label: 'Ingresos',
                data: [1200000, 1350000, 1100000, 1450000, 1300000, 1500000],
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            },
            {
                label: 'Gastos',
                data: [800000, 900000, 750000, 950000, 850000, 1000000],
                backgroundColor: 'rgba(231, 76, 60, 0.2)',
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }
        ]
    };

    incomeExpenseChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Ingresos vs Gastos Mensuales (Datos de Ejemplo)'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Load income distribution chart
async function loadIncomeDistributionChart() {
    const ctx = document.getElementById('incomeDistributionChart');
    if (!ctx) return;

    // Destroy existing chart more thoroughly
    if (window.incomeDistributionChart) {
        window.incomeDistributionChart.destroy();
        window.incomeDistributionChart = null;
    }
    
    // Clear the canvas
    ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);

    try {
        // Get current dashboard stats to use income categories
        const stats = await api.getDashboardStats();
        const categories = stats.income?.categories || [];

        if (categories.length === 0) {
            // Show empty state
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }

        const data = {
            labels: categories.map(cat => cat.name),
            datasets: [{
                data: categories.map(cat => cat.amount),
                backgroundColor: categories.map(cat => cat.color + 'CC'), // Add transparency
                borderColor: categories.map(cat => cat.color),
                borderWidth: 2
            }]
        };

        window.incomeDistributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: 'Distribución de Ingresos por Categoría'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = formatCurrency(context.parsed);
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading income distribution chart:', error);
        // Fallback to sample data
        loadSampleIncomeDistributionChart(ctx);
    }
}

// Fallback chart with sample data
function loadSampleIncomeDistributionChart(ctx) {
    const data = {
        labels: ['Matrículas', 'Mensualidades', 'Eventos', 'Uniformes', 'Otros'],
        datasets: [{
            data: [30, 45, 15, 7, 3],
            backgroundColor: [
                'rgba(52, 152, 219, 0.8)',
                'rgba(46, 204, 113, 0.8)',
                'rgba(155, 89, 182, 0.8)',
                'rgba(241, 196, 15, 0.8)',
                'rgba(231, 76, 60, 0.8)'
            ],
            borderColor: [
                'rgba(52, 152, 219, 1)',
                'rgba(46, 204, 113, 1)',
                'rgba(155, 89, 182, 1)',
                'rgba(241, 196, 15, 1)',
                'rgba(231, 76, 60, 1)'
            ],
            borderWidth: 2
        }]
    };

    window.incomeDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: 'Distribución de Ingresos (Datos de Ejemplo)'
                }
            }
        }
    });
}

// Load recent transactions
async function loadRecentTransactions() {
    try {
        // Sample data - replace with real API call
        const transactions = [
            {
                date: new Date().toISOString(),
                description: 'Pago mensualidad - Juan Pérez',
                type: 'Ingreso',
                amount: 150000,
                status: 'COMPLETED'
            },
            {
                date: new Date(Date.now() - 86400000).toISOString(),
                description: 'Matrícula - María García',
                type: 'Ingreso',
                amount: 200000,
                status: 'COMPLETED'
            },
            {
                date: new Date(Date.now() - 172800000).toISOString(),
                description: 'Compra materiales',
                type: 'Gasto',
                amount: 75000,
                status: 'COMPLETED'
            },
            {
                date: new Date(Date.now() - 259200000).toISOString(),
                description: 'Evento escolar - Carlos López',
                type: 'Ingreso',
                amount: 50000,
                status: 'PENDING'
            }
        ];

        updateRecentTransactions(transactions);

    } catch (error) {
        console.error('Error loading recent transactions:', error);
    }
}

// Update recent transactions table
function updateRecentTransactions(transactions) {
    const tbody = document.getElementById('recentTransactions');
    if (!tbody) return;

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay transacciones recientes</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(transaction => `
        <tr>
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.description}</td>
            <td>
                <span class="badge ${transaction.type === 'Ingreso' ? 'bg-success' : 'bg-danger'}">
                    ${transaction.type}
                </span>
            </td>
            <td>${formatCurrency(transaction.amount)}</td>
            <td>${getStatusBadge(transaction.status, 'payment')}</td>
        </tr>
    `).join('');
}

// Refresh dashboard data
async function refreshDashboard() {
    showLoading();
    try {
        await loadDashboard();
        showNotification('Dashboard actualizado', 'success');
    } catch (error) {
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Export dashboard data
function exportDashboardData() {
    // Implementation for exporting dashboard data
    showNotification('Función de exportación en desarrollo', 'info');
}

// Dashboard initialization
function initDashboard() {
    // Load dashboard data when page loads
    loadDashboard();

    // Setup refresh button if exists
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshDashboard);
    }

    // Setup export button if exists
    const exportBtn = document.getElementById('exportDashboard');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportDashboardData);
    }

    // Auto-refresh every 5 minutes
    dashboardUpdateInterval = setInterval(() => {
        if (document.getElementById('dashboard-content') &&
            !document.getElementById('dashboard-content').classList.contains('d-none')) {
            loadDashboard();
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Real-time dashboard updates
function updateDashboardRealTime() {
    // Only update if dashboard is visible
    if (document.getElementById('dashboard-content') &&
        !document.getElementById('dashboard-content').classList.contains('d-none')) {
        loadDashboard();
    }
}

// Trigger dashboard update after payment
function notifyPaymentMade(paymentData) {
    console.log('💰 Payment notification received:', paymentData);

    // Update dashboard immediately
    updateDashboardRealTime();

    // Show notification
    if (typeof showSuccess === 'function') {
        showSuccess(`Pago registrado: $${formatCurrency(paymentData.amount)}`);
    }
}

// Trigger dashboard update after invoice generation
function notifyInvoiceGenerated(invoiceData) {
    console.log('📄 Invoice notification received:', invoiceData);

    // Update dashboard immediately
    updateDashboardRealTime();

    // Show notification
    if (typeof showSuccess === 'function') {
        showSuccess(`Factura generada: ${invoiceData.invoiceNumber}`);
    }
}

// Stop dashboard updates (cleanup)
function stopDashboardUpdates() {
    if (dashboardUpdateInterval) {
        clearInterval(dashboardUpdateInterval);
        dashboardUpdateInterval = null;
    }
}

// Export functions for global access
// Get category text for income
function getCategoryText(concept) {
    const categories = {
        'TUITION': 'Matrícula',
        'MONTHLY': 'Mensualidad',
        'EVENT': 'Evento',
        'UNIFORM': 'Uniforme',
        'BOOKS': 'Libros',
        'TRANSPORT': 'Transporte',
        'CAFETERIA': 'Cafetería',
        'OTHER': 'Otros'
    };
    return categories[concept] || concept;
}

// Get category text for expenses
function getExpenseCategoryText(concept) {
    const categories = {
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
    return categories[concept] || concept;
}

// Trigger dashboard update after expense (incoming invoice)
function notifyExpenseRecorded(expenseData) {
    console.log('💸 Expense notification received:', expenseData);

    // Update dashboard immediately
    updateDashboardRealTime();

    // Show notification with category information
    const categoryText = getExpenseCategoryText(expenseData.concept || 'OTHER');
    if (typeof showSuccess === 'function') {
        showSuccess(`Gasto registrado: ${formatCurrency(expenseData.amount)} - ${categoryText}`);
    }
}

window.loadDashboard = loadDashboard;
window.refreshDashboard = refreshDashboard;
window.exportDashboard = exportDashboardData;
window.initDashboard = initDashboard;
window.updateDashboardRealTime = updateDashboardRealTime;
window.notifyPaymentMade = notifyPaymentMade;
window.notifyInvoiceGenerated = notifyInvoiceGenerated;
window.notifyExpenseRecorded = notifyExpenseRecorded;
window.stopDashboardUpdates = stopDashboardUpdates;