// Funds Management

let currentFunds = [];
let currentFundsPage = 1;
let totalFundsPages = 1;
let currentFundsFilters = {};

// Initialize funds page
async function initFunds() {
    try {
        console.log('💰 Initializing funds page...');
        showLoading();

        // Render funds content
        renderFundsContent();

        // Load funds data
        await loadFunds();

        // Setup event listeners
        setupFundsEventListeners();

        hideLoading();
    } catch (error) {
        console.error('❌ Error initializing funds:', error);
        showError('Error al cargar la página de fondos');
        hideLoading();
    }
}

// Render funds page content
function renderFundsContent() {
    const contentArea = document.getElementById('contentArea');

    contentArea.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-bank"></i> Gestión de Fondos</h2>
            <div class="btn-group">
                <button class="btn btn-primary" onclick="showCreateFundModal()">
                    <i class="bi bi-plus"></i> Crear Fondo
                </button>
                <button class="btn btn-success" onclick="showTransferModal()">
                    <i class="bi bi-arrow-left-right"></i> Transferir
                </button>
                <button class="btn btn-info" onclick="showFundStatsModal()">
                    <i class="bi bi-graph-up"></i> Estadísticas
                </button>
            </div>
        </div>

        <!-- Fund Statistics Cards -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Total Fondos</h6>
                                <h3 id="totalFundsCount">0</h3>
                            </div>
                            <i class="bi bi-wallet2 fs-1"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Saldo Total</h6>
                                <h3 id="totalFundsBalance">$0</h3>
                            </div>
                            <i class="bi bi-cash-stack fs-1"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Fondos con Alertas</h6>
                                <h3 id="fundsWithAlerts">0</h3>
                            </div>
                            <i class="bi bi-exclamation-triangle fs-1"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Préstamos Activos</h6>
                                <h3 id="activeLoansCount">0</h3>
                            </div>
                            <i class="bi bi-arrow-left-right fs-1"></i>
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
                        <input type="text" class="form-control" id="fundSearch" placeholder="Buscar por nombre o código...">
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="fundTypeFilter">
                            <option value="">Todos los tipos</option>
                            <option value="EVENTS">Eventos</option>
                            <option value="TUITION">Matrículas</option>
                            <option value="MONTHLY_FEES">Mensualidades</option>
                            <option value="OPERATIONAL">Operacional</option>
                            <option value="EXTERNAL">Externo</option>
                            <option value="EMERGENCY">Emergencia</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="fundStatusFilter">
                            <option value="">Todos los estados</option>
                            <option value="true">Activos</option>
                            <option value="false">Inactivos</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="fundYearFilter">
                            <option value="">Todos los años</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <div class="btn-group w-100">
                            <button class="btn btn-outline-primary" onclick="searchFunds()">
                                <i class="bi bi-search"></i> Buscar
                            </button>
                            <button class="btn btn-outline-secondary" onclick="clearFundFilters()">
                                <i class="bi bi-x-circle"></i> Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Funds Table -->
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Lista de Fondos</h5>
                <button class="btn btn-outline-success btn-sm" onclick="exportFunds()">
                    <i class="bi bi-download"></i> Exportar
                </button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Tipo</th>
                                <th>Saldo Actual</th>
                                <th>Total Ingresos</th>
                                <th>Total Gastos</th>
                                <th>Estado</th>
                                <th>Alertas</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="fundsTableBody">
                            <tr>
                                <td colspan="9" class="text-center">Cargando fondos...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card-footer">
                <nav>
                    <ul class="pagination justify-content-center mb-0" id="fundsPagination">
                    </ul>
                </nav>
            </div>
        </div>

        <!-- Fund Modal -->
        <div class="modal fade" id="fundModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="fundModalTitle">Crear Fondo</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="fundForm">
                            <input type="hidden" id="fundId" name="fundId">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="fundName" class="form-label">Nombre *</label>
                                        <input type="text" class="form-control" id="fundName" name="name" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="fundCode" class="form-label">Código *</label>
                                        <input type="text" class="form-control" id="fundCode" name="code" required>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="fundType" class="form-label">Tipo *</label>
                                        <select class="form-select" id="fundType" name="type" required>
                                            <option value="">Seleccionar tipo</option>
                                            <option value="EVENTS">Eventos</option>
                                            <option value="TUITION">Matrículas</option>
                                            <option value="MONTHLY_FEES">Mensualidades</option>
                                            <option value="OPERATIONAL">Operacional</option>
                                            <option value="EXTERNAL">Externo</option>
                                            <option value="EMERGENCY">Emergencia</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="fundAcademicYear" class="form-label">Año Académico</label>
                                        <input type="number" class="form-control" id="fundAcademicYear" name="academicYear" value="${new Date().getFullYear()}">
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="fundDescription" class="form-label">Descripción</label>
                                <textarea class="form-control" id="fundDescription" name="description" rows="3"></textarea>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="fundInitialBalance" class="form-label">Saldo Inicial</label>
                                        <input type="number" class="form-control" id="fundInitialBalance" name="initialBalance" min="0" step="0.01" value="0">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="fundAlertLevel1" class="form-label">Alerta Nivel 1 (%)</label>
                                        <input type="number" class="form-control" id="fundAlertLevel1" name="alertLevel1" min="0" max="100" value="70">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="fundAlertLevel2" class="form-label">Alerta Nivel 2 (%)</label>
                                        <input type="number" class="form-control" id="fundAlertLevel2" name="alertLevel2" min="0" max="100" value="85">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="fundAlertLevel3" class="form-label">Alerta Nivel 3 (%)</label>
                                        <input type="number" class="form-control" id="fundAlertLevel3" name="alertLevel3" min="0" max="100" value="95">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3 form-check">
                                        <input type="checkbox" class="form-check-input" id="fundIsActive" name="isActive" checked>
                                        <label class="form-check-label" for="fundIsActive">
                                            Fondo Activo
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="saveFundBtn" onclick="saveFund()">Guardar</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Transfer Modal -->
        <div class="modal fade" id="transferModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Transferir entre Fondos</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="transferForm">
                            <div class="mb-3">
                                <label for="sourceFund" class="form-label">Fondo Origen *</label>
                                <select class="form-select" id="sourceFund" required>
                                    <option value="">Seleccionar fondo origen</option>
                                </select>
                                <div class="form-text" id="sourceFundInfo"></div>
                            </div>
                            <div class="mb-3">
                                <label for="targetFund" class="form-label">Fondo Destino *</label>
                                <select class="form-select" id="targetFund" required>
                                    <option value="">Seleccionar fondo destino</option>
                                </select>
                                <div class="form-text" id="targetFundInfo"></div>
                            </div>
                            <div class="mb-3">
                                <label for="transferAmount" class="form-label">Monto *</label>
                                <input type="number" class="form-control" id="transferAmount" min="0.01" step="0.01" required>
                            </div>
                            <div class="mb-3">
                                <label for="transferDescription" class="form-label">Descripción *</label>
                                <textarea class="form-control" id="transferDescription" rows="3" required></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-success" onclick="processTransfer()">Transferir</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Load funds data
async function loadFunds(page = 1, filters = {}) {
    try {
        showLoading();
        
        const params = {
            page,
            limit: 20,
            includeStats: 'true',
            ...filters
        };
        
        const response = await api.getFunds(params);
        
        currentFunds = response.funds || [];
        currentFundsPage = response.pagination?.page || 1;
        totalFundsPages = response.pagination?.pages || 1;
        currentFundsFilters = filters;
        
        updateFundsTable();
        updateFundsPagination();
        updateFundsStats();
        
    } catch (error) {
        console.error('Error loading funds:', error);
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Update funds table
function updateFundsTable() {
    const tbody = document.getElementById('fundsTableBody');
    if (!tbody) return;
    
    if (currentFunds.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No se encontraron fondos</td></tr>';
        return;
    }
    
    tbody.innerHTML = currentFunds.map(fund => `
        <tr>
            <td><strong>${fund.code}</strong></td>
            <td>${fund.name}</td>
            <td>${getFundTypeText(fund.type)}</td>
            <td class="${fund.currentBalance >= 0 ? 'text-success' : 'text-danger'}">
                ${formatCurrency(fund.currentBalance)}
            </td>
            <td class="text-success">${formatCurrency(fund.totalIncome)}</td>
            <td class="text-danger">${formatCurrency(fund.totalExpenses)}</td>
            <td>
                <span class="badge ${fund.isActive ? 'bg-success' : 'bg-secondary'}">
                    ${fund.isActive ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                ${fund.statistics?.activeAlertsCount > 0 ? 
                    `<span class="badge bg-warning">${fund.statistics.activeAlertsCount}</span>` : 
                    '<span class="text-muted">Sin alertas</span>'
                }
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewFund('${fund.id}')" title="Ver">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning" onclick="editFund('${fund.id}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-info" onclick="viewFundTransactions('${fund.id}')" title="Transacciones">
                        <i class="bi bi-list-ul"></i>
                    </button>
                    <button class="btn btn-outline-success" onclick="addFundIncome('${fund.id}')" title="Agregar Ingreso">
                        <i class="bi bi-plus-circle"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="addFundExpense('${fund.id}')" title="Agregar Gasto">
                        <i class="bi bi-dash-circle"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update funds pagination
function updateFundsPagination() {
    const paginationContainer = document.getElementById('fundsPagination');
    if (!paginationContainer) return;
    
    if (totalFundsPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (currentFundsPage > 1) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="loadFundsPage(${currentFundsPage - 1})">Anterior</a></li>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalFundsPages; i++) {
        if (i === currentFundsPage) {
            paginationHTML += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
        } else {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="loadFundsPage(${i})">${i}</a></li>`;
        }
    }
    
    // Next button
    if (currentFundsPage < totalFundsPages) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="loadFundsPage(${currentFundsPage + 1})">Siguiente</a></li>`;
    }
    
    paginationContainer.innerHTML = paginationHTML;
}

// Load specific funds page
function loadFundsPage(page) {
    if (page >= 1 && page <= totalFundsPages) {
        loadFunds(page, currentFundsFilters);
    }
}

// Update funds statistics
function updateFundsStats() {
    const totalFunds = currentFunds.length;
    const totalBalance = currentFunds.reduce((sum, fund) => sum + fund.currentBalance, 0);
    const fundsWithAlerts = currentFunds.filter(fund => fund.statistics?.activeAlertsCount > 0).length;
    const activeLoans = currentFunds.reduce((sum, fund) => sum + (fund.statistics?.totalLoans || 0), 0);
    
    document.getElementById('totalFundsCount').textContent = totalFunds;
    document.getElementById('totalFundsBalance').textContent = formatCurrency(totalBalance);
    document.getElementById('fundsWithAlerts').textContent = fundsWithAlerts;
    document.getElementById('activeLoansCount').textContent = activeLoans;
}

// Get fund type text
function getFundTypeText(type) {
    const types = {
        'EVENTS': 'Eventos',
        'TUITION': 'Matrículas',
        'MONTHLY_FEES': 'Mensualidades',
        'OPERATIONAL': 'Operacional',
        'EXTERNAL': 'Externo',
        'EMERGENCY': 'Emergencia'
    };
    return types[type] || type;
}

// Show create fund modal
function showCreateFundModal() {
    showFundModal(null, 'create');
}

// Show fund modal
function showFundModal(fund = null, mode = 'create') {
    const modal = document.getElementById('fundModal');
    const modalTitle = document.getElementById('fundModalTitle');
    const form = document.getElementById('fundForm');
    
    if (!modal || !modalTitle || !form) return;
    
    // Set modal title
    const titles = {
        create: 'Crear Fondo',
        edit: 'Editar Fondo',
        view: 'Ver Fondo'
    };
    modalTitle.textContent = titles[mode];
    
    // Clear form
    form.reset();
    
    // Set form mode
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.disabled = mode === 'view';
        input.classList.remove('is-invalid');
    });
    
    // Hide/show buttons based on mode
    const saveBtn = document.getElementById('saveFundBtn');
    if (saveBtn) {
        saveBtn.style.display = mode === 'view' ? 'none' : 'block';
    }
    
    // Fill form if editing or viewing
    if (fund && mode !== 'create') {
        document.getElementById('fundId').value = fund.id;
        document.getElementById('fundName').value = fund.name;
        document.getElementById('fundCode').value = fund.code;
        document.getElementById('fundType').value = fund.type;
        document.getElementById('fundDescription').value = fund.description || '';
        document.getElementById('fundAcademicYear').value = fund.academicYear || new Date().getFullYear();
        document.getElementById('fundInitialBalance').value = fund.initialBalance;
        document.getElementById('fundAlertLevel1').value = fund.alertLevel1;
        document.getElementById('fundAlertLevel2').value = fund.alertLevel2;
        document.getElementById('fundAlertLevel3').value = fund.alertLevel3;
        document.getElementById('fundIsActive').checked = fund.isActive;
    }
    
    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Save fund
async function saveFund() {
    const form = document.getElementById('fundForm');
    if (!form || !validateForm(form)) {
        showNotification('Por favor complete todos los campos requeridos', 'error');
        return;
    }
    
    const formData = new FormData(form);
    const fundData = Object.fromEntries(formData.entries());
    
    // Convert numbers
    fundData.academicYear = parseInt(fundData.academicYear);
    fundData.initialBalance = parseFloat(fundData.initialBalance);
    fundData.alertLevel1 = parseFloat(fundData.alertLevel1);
    fundData.alertLevel2 = parseFloat(fundData.alertLevel2);
    fundData.alertLevel3 = parseFloat(fundData.alertLevel3);
    fundData.isActive = document.getElementById('fundIsActive').checked;
    
    try {
        showLoading();
        
        const fundId = fundData.fundId;
        delete fundData.fundId;
        
        if (fundId) {
            // Update existing fund
            await api.updateFund(fundId, fundData);
            showNotification('Fondo actualizado exitosamente', 'success');
        } else {
            // Create new fund
            await api.createFund(fundData);
            showNotification('Fondo creado exitosamente', 'success');
        }
        
        // Close modal and reload data
        const modal = bootstrap.Modal.getInstance(document.getElementById('fundModal'));
        modal.hide();
        
        loadFunds(currentFundsPage, currentFundsFilters);
        
    } catch (error) {
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Setup event listeners
function setupFundsEventListeners() {
    // Search with debounce
    const searchInput = document.getElementById('fundSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchFunds, 300));
    }
    
    // Filter change handlers
    ['fundTypeFilter', 'fundStatusFilter', 'fundYearFilter'].forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', searchFunds);
        }
    });
    
    // Form submission
    const fundForm = document.getElementById('fundForm');
    if (fundForm) {
        fundForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveFund();
        });
    }
}

// Search funds
function searchFunds() {
    const searchTerm = document.getElementById('fundSearch')?.value || '';
    const typeFilter = document.getElementById('fundTypeFilter')?.value || '';
    const statusFilter = document.getElementById('fundStatusFilter')?.value || '';
    const yearFilter = document.getElementById('fundYearFilter')?.value || '';
    
    const filters = {};
    if (searchTerm) filters.search = searchTerm;
    if (typeFilter) filters.type = typeFilter;
    if (statusFilter) filters.isActive = statusFilter;
    if (yearFilter) filters.academicYear = yearFilter;
    
    loadFunds(1, filters);
}

// Clear filters
function clearFundFilters() {
    document.getElementById('fundSearch').value = '';
    document.getElementById('fundTypeFilter').value = '';
    document.getElementById('fundStatusFilter').value = '';
    document.getElementById('fundYearFilter').value = '';
    loadFunds(1, {});
}

// Export functions for global access
window.initFunds = initFunds;
window.loadFunds = loadFunds;
window.showCreateFundModal = showCreateFundModal;