// Dashboard Management

let incomeExpenseChart = null;
let incomeDistributionChart = null;

// Load dashboard data
async function loadDashboard() {
    try {
        // Load dashboard statistics
        const stats = await api.getDashboardStats();
        updateDashboardStats(stats);
        
        // Load charts
        await loadDashboardCharts();
        
        // Load recent transactions
        await loadRecentTransactions();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        handleApiError(error);
    }
}

// Update dashboard statistics
function updateDashboardStats(stats) {
    // Update stat cards
    document.getElementById('totalStudents').textContent = stats.totalStudents || 0;
    document.getElementById('monthlyIncome').textContent = formatCurrency(stats.monthlyIncome || 0);
    document.getElementById('pendingInvoices').textContent = stats.totalInvoices || 0;
    document.getElementById('activeEvents').textContent = stats.totalEvents || 0;
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
    setInterval(() => {
        if (document.getElementById('dashboard-content') && 
            !document.getElementById('dashboard-content').classList.contains('d-none')) {
            loadDashboard();
        }
    }, 5 * 60 * 1000); // 5 minutes
}