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
    const debts = stats.debts || {};
    const metrics = stats.metrics || {};
    
    // Actualizar tarjetas principales
    updateStatCard('totalStudents', summary.activeStudents, summary.totalStudents);
    updateStatCard('monthlyIncome', formatCurrency(income.thisMonth), 'Este mes');
    updateStatCard('pendingInvoices', summary.pendingInvoices, `${summary.overdueInvoices} vencidas`);
    updateStatCard('activeEvents', summary.activeEvents, `${summary.totalEvents} total`);
    
    // Actualizar métricas adicionales
    updateMetricCard('studentActivePercentage', metrics.studentActivePercentage, '%');
    updateMetricCard('invoicePaidPercentage', metrics.invoicePaidPercentage, '%');
    updateMetricCard('totalDebtAmount', formatCurrency(debts.totalAmount), `${debts.totalDebtors} deudores`);
    updateMetricCard('averageDebtPerStudent', formatCurrency(metrics.averageDebtPerStudent), 'Promedio');
    
    // Actualizar ingresos detallados
    updateIncomeDetails(income);
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

// Actualizar detalles de ingresos
function updateIncomeDetails(income) {
    const todayElement = document.getElementById('todayIncome');
    const yearElement = document.getElementById('yearIncome');
    
    if (todayElement) todayElement.textContent = formatCurrency(income.today || 0);
    if (yearElement) yearElement.textContent = formatCurrency(income.thisYear || 0);
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
        // Load income vs expense chart
        await loadIncomeExpenseChart();
        
        // Load income distribution chart
        await loadIncomeDistributionChart();
        
    } catch (error) {
        console.error('Error loading charts:', error);
    }
}

// Load income vs expense chart
async function loadIncomeExpenseChart() {
    const ctx = document.getElementById('incomeExpenseChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }
    
    // Sample data - replace with real API call
    const data = {
        labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
        datasets: [
            {
                label: 'Ingresos',
                data: [1200000, 1350000, 1100000, 1450000, 1300000, 1500000],
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 2,
                fill: true
            },
            {
                label: 'Gastos',
                data: [800000, 900000, 750000, 950000, 850000, 1000000],
                backgroundColor: 'rgba(231, 76, 60, 0.2)',
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 2,
                fill: true
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
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
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
    
    // Destroy existing chart
    if (incomeDistributionChart) {
        incomeDistributionChart.destroy();
    }
    
    // Sample data - replace with real API call
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
    
    incomeDistributionChart = new Chart(ctx, {
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
                    display: false
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
window.loadDashboard = loadDashboard;
window.refreshDashboard = refreshDashboard;
window.exportDashboard = exportDashboardData;
window.initDashboard = initDashboard;
window.updateDashboardRealTime = updateDashboardRealTime;
window.notifyPaymentMade = notifyPaymentMade;
window.notifyInvoiceGenerated = notifyInvoiceGenerated;
window.stopDashboardUpdates = stopDashboardUpdates;