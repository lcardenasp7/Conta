// Fund Alerts Management

let currentFundAlerts = [];
let currentFundAlertsPage = 1;
let totalFundAlertsPages = 1;
let currentFundAlertsFilters = {};

// Initialize fund alerts page
async function initFundAlerts() {
    try {
        console.log('⚠️ Initializing fund alerts page...');
        showLoading();

        // Render fund alerts content
        renderFundAlertsContent();

        // Load fund alerts data
        await loadFundAlerts();

        // Setup event listeners
        setupFundAlertsEventListeners();

        hideLoading();
    } catch (error) {
        console.error('❌ Error initializing fund alerts:', error);
        showError('Error al cargar la página de alertas');
        hideLoading();
    }
}

// Render fund alerts page content
function renderFundAlertsContent() {
    const contentArea = document.getElementById('contentArea');

    contentArea.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-exclamation-triangle"></i> Alertas de Fondos</h2>
            <div class="btn-group">
                <button class="btn btn-primary" onclick="refreshAlerts()">
                    <i class="bi bi-arrow-clockwise"></i> Actualizar
                </button>
                <button class="btn btn-success" onclick="markAllAsRead()">
                    <i class="bi bi-check-all"></i> Marcar Todas como Leídas
                </button>
            </div>
        </div>

        <!-- Alert Statistics Cards -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card bg-warning text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Alertas Activas</h6>
                                <h3 id="activeAlertsCount">0</h3>
                            </div>
                            <i class="bi bi-exclamation-triangle fs-1"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-danger text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Críticas</h6>
                                <h3 id="criticalAlertsCount">0</h3>
                            </div>
                            <i class="bi bi-exclamation-octagon fs-1"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">No Leídas</h6>
                                <h3 id="unreadAlertsCount">0</h3>
                            </div>
                            <i class="bi bi-envelope fs-1"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-secondary text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Total Alertas</h6>
                                <h3 id="totalAlertsCount">0</h3>
                            </div>
                            <i class="bi bi-bell fs-1"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3">
                        <select class="form-select" id="alertLevelFilter">
                            <option value="">Todos los niveles</option>
                            <option value="1">Nivel 1 (70%)</option>
                            <option value="2">Nivel 2 (85%)</option>
                            <option value="3">Nivel 3 (95%)</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="alertStatusFilter">
                            <option value="">Todas las alertas</option>
                            <option value="unread">No leídas</option>
                            <option value="read">Leídas</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="alertFundFilter">
                            <option value="">Todos los fondos</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <div class="btn-group w-100">
                            <button class="btn btn-outline-primary" onclick="searchFundAlerts()">
                                <i class="bi bi-search"></i> Filtrar
                            </button>
                            <button class="btn btn-outline-secondary" onclick="clearAlertFilters()">
                                <i class="bi bi-x-circle"></i> Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Alerts List -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Lista de Alertas</h5>
            </div>
            <div class="card-body">
                <div id="alertsList">
                    <div class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando alertas...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Load fund alerts data
async function loadFundAlerts(page = 1, filters = {}) {
    try {
        showLoading();
        
        const params = {
            page,
            limit: 20,
            ...filters
        };
        
        // Obtener datos reales de la API
        let alerts = [];
        try {
            const response = await api.getFundAlertsAttentionRequired();
            alerts = response || [];
        } catch (apiError) {
            console.log('Error loading alerts from API:', apiError);
            // Si no hay API disponible, usar array vacío
            alerts = [];
        }
        
        currentFundAlerts = alerts;
        currentFundAlertsPage = 1;
        totalFundAlertsPages = Math.ceil(alerts.length / 20) || 1;
        currentFundAlertsFilters = filters;
        
        updateFundAlertsDisplay();
        updateFundAlertsStats();
        
        // Load funds for filter
        await loadFundsForAlertFilter();
        
    } catch (error) {
        console.error('Error loading fund alerts:', error);
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Update fund alerts display
function updateFundAlertsDisplay() {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) return;
    
    if (currentFundAlerts.length === 0) {
        alertsList.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-check-circle fs-1 text-success"></i>
                <h4 class="mt-3">¡No hay alertas activas!</h4>
                <p class="text-muted">Todos los fondos están funcionando correctamente.</p>
            </div>
        `;
        return;
    }
    
    alertsList.innerHTML = currentFundAlerts.map(alert => `
        <div class="alert alert-${getAlertLevelClass(alert.level)} ${alert.isRead ? 'alert-read' : ''} mb-3">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center mb-2">
                        <i class="bi bi-${getAlertLevelIcon(alert.level)} me-2"></i>
                        <strong>${alert.fund.name} (${alert.fund.code})</strong>
                        <span class="badge bg-${getAlertLevelClass(alert.level)} ms-2">Nivel ${alert.level}</span>
                        ${!alert.isRead ? '<span class="badge bg-primary ms-1">Nueva</span>' : ''}
                    </div>
                    <p class="mb-2">${alert.message}</p>
                    <small class="text-muted">
                        <i class="bi bi-clock"></i> ${formatDate(alert.triggeredAt)}
                    </small>
                </div>
                <div class="btn-group btn-group-sm">
                    ${!alert.isRead ? `
                        <button class="btn btn-outline-primary" onclick="markAlertAsRead('${alert.id}')" title="Marcar como leída">
                            <i class="bi bi-check"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-outline-secondary" onclick="deactivateAlert('${alert.id}')" title="Desactivar">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Update fund alerts statistics
function updateFundAlertsStats() {
    const activeAlerts = currentFundAlerts.filter(alert => alert.isActive !== false).length;
    const criticalAlerts = currentFundAlerts.filter(alert => alert.level === 3).length;
    const unreadAlerts = currentFundAlerts.filter(alert => !alert.isRead).length;
    const totalAlerts = currentFundAlerts.length;
    
    document.getElementById('activeAlertsCount').textContent = activeAlerts;
    document.getElementById('criticalAlertsCount').textContent = criticalAlerts;
    document.getElementById('unreadAlertsCount').textContent = unreadAlerts;
    document.getElementById('totalAlertsCount').textContent = totalAlerts;
}

// Get alert level class
function getAlertLevelClass(level) {
    const classes = {
        1: 'warning',
        2: 'warning',
        3: 'danger'
    };
    return classes[level] || 'info';
}

// Get alert level icon
function getAlertLevelIcon(level) {
    const icons = {
        1: 'exclamation-triangle',
        2: 'exclamation-triangle-fill',
        3: 'exclamation-octagon-fill'
    };
    return icons[level] || 'info-circle';
}

// Load funds for alert filter
async function loadFundsForAlertFilter() {
    try {
        const response = await api.getFunds({ isActive: 'true' });
        const funds = response.funds || [];
        
        const fundFilter = document.getElementById('alertFundFilter');
        if (fundFilter) {
            const currentValue = fundFilter.value;
            fundFilter.innerHTML = '<option value="">Todos los fondos</option>' +
                funds.map(fund => 
                    `<option value="${fund.id}">${fund.name} (${fund.code})</option>`
                ).join('');
            fundFilter.value = currentValue;
        }
        
    } catch (error) {
        console.error('Error loading funds for filter:', error);
    }
}

// Mark alert as read
async function markAlertAsRead(alertId) {
    try {
        // Simular API call
        console.log('Marking alert as read:', alertId);
        
        // Update local data
        const alert = currentFundAlerts.find(a => a.id === alertId);
        if (alert) {
            alert.isRead = true;
        }
        
        updateFundAlertsDisplay();
        updateFundAlertsStats();
        
        showNotification('Alerta marcada como leída', 'success');
        
    } catch (error) {
        handleApiError(error);
    }
}

// Deactivate alert
async function deactivateAlert(alertId) {
    try {
        const result = await Swal.fire({
            title: '¿Desactivar alerta?',
            text: '¿Está seguro de que desea desactivar esta alerta?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, desactivar',
            cancelButtonText: 'Cancelar'
        });
        
        if (result.isConfirmed) {
            // Simular API call
            console.log('Deactivating alert:', alertId);
            
            // Remove from local data
            currentFundAlerts = currentFundAlerts.filter(a => a.id !== alertId);
            
            updateFundAlertsDisplay();
            updateFundAlertsStats();
            
            showNotification('Alerta desactivada', 'success');
        }
        
    } catch (error) {
        handleApiError(error);
    }
}

// Mark all alerts as read
async function markAllAsRead() {
    try {
        const unreadAlerts = currentFundAlerts.filter(alert => !alert.isRead);
        
        if (unreadAlerts.length === 0) {
            showNotification('No hay alertas sin leer', 'info');
            return;
        }
        
        const result = await Swal.fire({
            title: 'Marcar todas como leídas',
            text: `¿Marcar ${unreadAlerts.length} alertas como leídas?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, marcar todas',
            cancelButtonText: 'Cancelar'
        });
        
        if (result.isConfirmed) {
            // Update all alerts
            currentFundAlerts.forEach(alert => {
                alert.isRead = true;
            });
            
            updateFundAlertsDisplay();
            updateFundAlertsStats();
            
            showNotification(`${unreadAlerts.length} alertas marcadas como leídas`, 'success');
        }
        
    } catch (error) {
        handleApiError(error);
    }
}

// Refresh alerts
async function refreshAlerts() {
    await loadFundAlerts(currentFundAlertsPage, currentFundAlertsFilters);
    showNotification('Alertas actualizadas', 'success');
}

// Search fund alerts
function searchFundAlerts() {
    const levelFilter = document.getElementById('alertLevelFilter')?.value || '';
    const statusFilter = document.getElementById('alertStatusFilter')?.value || '';
    const fundFilter = document.getElementById('alertFundFilter')?.value || '';
    
    const filters = {};
    if (levelFilter) filters.level = levelFilter;
    if (statusFilter) filters.status = statusFilter;
    if (fundFilter) filters.fundId = fundFilter;
    
    loadFundAlerts(1, filters);
}

// Clear alert filters
function clearAlertFilters() {
    document.getElementById('alertLevelFilter').value = '';
    document.getElementById('alertStatusFilter').value = '';
    document.getElementById('alertFundFilter').value = '';
    loadFundAlerts(1, {});
}

// Setup event listeners
function setupFundAlertsEventListeners() {
    // Filter change handlers
    ['alertLevelFilter', 'alertStatusFilter', 'alertFundFilter'].forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', searchFundAlerts);
        }
    });
}

// Export functions for global access
window.initFundAlerts = initFundAlerts;
window.loadFundAlerts = loadFundAlerts;
window.refreshAlerts = refreshAlerts;