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
                    <button class="btn btn-outline-danger" onclick="deleteFund('${fund.id}', '${fund.name}')" title="Eliminar Fondo">
                        <i class="bi bi-trash"></i>
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

// Exportaciones movidas al final del archivo

// View fund details
async function viewFund(fundId) {
    try {
        showLoading();
        const fund = await api.getFund(fundId);
        showFundModal(fund, 'view');
    } catch (error) {
        console.error('Error loading fund details:', error);
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Edit fund
async function editFund(fundId) {
    try {
        showLoading();
        const fund = await api.getFund(fundId);
        showFundModal(fund, 'edit');
    } catch (error) {
        console.error('Error loading fund for editing:', error);
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// View fund transactions
async function viewFundTransactions(fundId) {
    try {
        showLoading();
        
        // Find fund name
        const fund = currentFunds.find(f => f.id === fundId);
        const fundName = fund ? fund.name : 'Fondo';
        
        // Get transactions
        const response = await api.getFundTransactions(fundId);
        const transactions = response.transactions || [];
        
        // Show transactions modal
        showFundTransactionsModal(fundId, fundName, transactions);
        
    } catch (error) {
        console.error('Error loading fund transactions:', error);
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Add fund income
function addFundIncome(fundId) {
    const fund = currentFunds.find(f => f.id === fundId);
    if (!fund) {
        showNotification('Fondo no encontrado', 'error');
        return;
    }
    
    showFundTransactionModal(fundId, fund.name, 'income');
}

// Add fund expense
function addFundExpense(fundId) {
    const fund = currentFunds.find(f => f.id === fundId);
    if (!fund) {
        showNotification('Fondo no encontrado', 'error');
        return;
    }
    
    showFundTransactionModal(fundId, fund.name, 'expense');
}

// Show fund transactions modal
function showFundTransactionsModal(fundId, fundName, transactions) {
    const modalHTML = `
        <div class="modal fade" id="fundTransactionsModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Transacciones - ${fundName}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th>Descripción</th>
                                        <th>Monto</th>
                                        <th>Usuario</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${transactions.length === 0 ? 
                                        '<tr><td colspan="5" class="text-center">No hay transacciones</td></tr>' :
                                        transactions.map(transaction => `
                                            <tr>
                                                <td>${formatDate(transaction.createdAt)}</td>
                                                <td>
                                                    <span class="badge ${transaction.type === 'INCOME' ? 'bg-success' : 'bg-danger'}">
                                                        ${transaction.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                                                    </span>
                                                </td>
                                                <td>${transaction.description}</td>
                                                <td class="${transaction.type === 'INCOME' ? 'text-success' : 'text-danger'}">
                                                    ${transaction.type === 'INCOME' ? '+' : '-'}${formatCurrency(Math.abs(transaction.amount))}
                                                </td>
                                                <td>${transaction.user?.name || 'Sistema'}</td>
                                            </tr>
                                        `).join('')
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('fundTransactionsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('fundTransactionsModal'));
    modal.show();
    
    // Clean up when modal is hidden
    document.getElementById('fundTransactionsModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Show fund transaction modal (for adding income/expense)
function showFundTransactionModal(fundId, fundName, type) {
    const isIncome = type === 'income';
    const modalTitle = isIncome ? 'Agregar Ingreso' : 'Agregar Gasto';
    const buttonClass = isIncome ? 'btn-success' : 'btn-danger';
    const buttonText = isIncome ? 'Agregar Ingreso' : 'Agregar Gasto';
    
    const modalHTML = `
        <div class="modal fade" id="fundTransactionModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${modalTitle} - ${fundName}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="fundTransactionForm">
                            <input type="hidden" id="transactionFundId" value="${fundId}">
                            <input type="hidden" id="transactionType" value="${type}">
                            
                            <div class="mb-3">
                                <label for="transactionAmount" class="form-label">Monto *</label>
                                <input type="number" class="form-control" id="transactionAmount" min="0.01" step="0.01" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="transactionDescription" class="form-label">Descripción *</label>
                                <textarea class="form-control" id="transactionDescription" rows="3" required></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label for="transactionCategory" class="form-label">Categoría</label>
                                <select class="form-select" id="transactionCategory">
                                    <option value="">Seleccionar categoría</option>
                                    ${isIncome ? `
                                        <option value="TUITION">Matrícula</option>
                                        <option value="MONTHLY">Mensualidad</option>
                                        <option value="EVENT">Evento</option>
                                        <option value="DONATION">Donación</option>
                                        <option value="OTHER">Otros</option>
                                    ` : `
                                        <option value="SUPPLIES">Suministros</option>
                                        <option value="MAINTENANCE">Mantenimiento</option>
                                        <option value="SERVICES">Servicios</option>
                                        <option value="EQUIPMENT">Equipos</option>
                                        <option value="OTHER">Otros</option>
                                    `}
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn ${buttonClass}" onclick="saveFundTransaction()">${buttonText}</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('fundTransactionModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('fundTransactionModal'));
    modal.show();
    
    // Clean up when modal is hidden
    document.getElementById('fundTransactionModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Save fund transaction
async function saveFundTransaction() {
    const form = document.getElementById('fundTransactionForm');
    if (!form || !validateForm(form)) {
        showNotification('Por favor complete todos los campos requeridos', 'error');
        return;
    }
    
    const fundId = document.getElementById('transactionFundId').value;
    const type = document.getElementById('transactionType').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const description = document.getElementById('transactionDescription').value;
    const category = document.getElementById('transactionCategory').value;
    
    const transactionData = {
        fundId,
        type: type === 'income' ? 'INCOME' : 'EXPENSE',
        amount: type === 'income' ? amount : -amount,
        description,
        category: category || 'OTHER'
    };
    
    try {
        showLoading();
        
        await api.createFundTransaction(transactionData);
        
        const actionText = type === 'income' ? 'Ingreso agregado' : 'Gasto agregado';
        showNotification(`${actionText} exitosamente`, 'success');
        
        // Close modal and reload data
        const modal = bootstrap.Modal.getInstance(document.getElementById('fundTransactionModal'));
        modal.hide();
        
        loadFunds(currentFundsPage, currentFundsFilters);
        
    } catch (error) {
        console.error('Error saving fund transaction:', error);
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Show transfer modal
function showTransferModal() {
    const modal = document.getElementById('transferModal');
    if (!modal) return;
    
    // Populate fund selectors
    const sourceFundSelect = document.getElementById('sourceFund');
    const targetFundSelect = document.getElementById('targetFund');
    
    if (sourceFundSelect && targetFundSelect) {
        const activeFunds = currentFunds.filter(fund => fund.isActive);
        const fundOptions = activeFunds.map(fund => 
            `<option value="${fund.id}">${fund.name} (${fund.code}) - ${formatCurrency(fund.currentBalance)}</option>`
        ).join('');
        
        sourceFundSelect.innerHTML = '<option value="">Seleccionar fondo origen</option>' + fundOptions;
        targetFundSelect.innerHTML = '<option value="">Seleccionar fondo destino</option>' + fundOptions;
    }
    
    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Process transfer
async function processTransfer() {
    const form = document.getElementById('transferForm');
    if (!form || !validateForm(form)) {
        showNotification('Por favor complete todos los campos requeridos', 'error');
        return;
    }
    
    const sourceFundId = document.getElementById('sourceFund').value;
    const targetFundId = document.getElementById('targetFund').value;
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const description = document.getElementById('transferDescription').value;
    
    if (sourceFundId === targetFundId) {
        showNotification('No se puede transferir a el mismo fondo', 'error');
        return;
    }
    
    const transferData = {
        sourceFundId,
        targetFundId,
        amount,
        description
    };
    
    try {
        showLoading();
        
        await api.createFundTransfer(transferData);
        showNotification('Transferencia realizada exitosamente', 'success');
        
        // Close modal and reload data
        const modal = bootstrap.Modal.getInstance(document.getElementById('transferModal'));
        modal.hide();
        
        loadFunds(currentFundsPage, currentFundsFilters);
        
    } catch (error) {
        console.error('Error processing transfer:', error);
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Show fund statistics modal
function showFundStatsModal() {
    showNotification('Función de estadísticas en desarrollo', 'info');
}

// Export funds
function exportFunds() {
    showNotification('Función de exportación en desarrollo', 'info');
}

// Exportaciones movidas al final del archivo
// Exportaciones movidas al final del archivo

// Delete fund
async function deleteFund(fundId, fundName) {
    // Verificar que el fondo existe en la lista actual
    const fund = currentFunds.find(f => f.id === fundId);
    if (!fund) {
        showNotification('Fondo no encontrado', 'error');
        return;
    }

    // Verificar si el fondo tiene saldo
    if (fund.currentBalance > 0) {
        showNotification('No se puede eliminar un fondo con saldo positivo. Transfiera el dinero a otro fondo primero.', 'error');
        return;
    }

    // Verificar si el fondo tiene transacciones
    if (fund.totalIncome > 0 || fund.totalExpenses > 0) {
        // Mostrar modal de confirmación especial para fondos con historial
        showDeleteFundWithHistoryModal(fundId, fundName, fund);
        return;
    }

    // Para fondos sin transacciones, mostrar confirmación simple
    showDeleteFundConfirmation(fundId, fundName, fund);
}

// Show delete fund confirmation modal
function showDeleteFundConfirmation(fundId, fundName, fund) {
    const hasTransactions = fund.totalIncome > 0 || fund.totalExpenses > 0;
    const warningMessage = hasTransactions 
        ? `<div class="alert alert-warning">
            <strong>⚠️ Advertencia:</strong> Este fondo tiene historial de transacciones:
            <ul class="mb-0 mt-2">
                <li>Total ingresos: ${formatCurrency(fund.totalIncome)}</li>
                <li>Total gastos: ${formatCurrency(fund.totalExpenses)}</li>
                <li>Saldo actual: ${formatCurrency(fund.currentBalance)}</li>
            </ul>
            <p class="mt-2 mb-0">Al eliminar el fondo, se perderá todo el historial de transacciones.</p>
           </div>`
        : `<div class="alert alert-info">
            <strong>ℹ️ Información:</strong> Este fondo no tiene transacciones registradas y se puede eliminar de forma segura.
           </div>`;

    const modalHTML = `
        <div class="modal fade" id="deleteFundModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">🗑️ Eliminar Fondo</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p><strong>¿Está seguro de que desea eliminar el fondo "${fundName}"?</strong></p>
                        
                        ${warningMessage}
                        
                        <div class="mt-3">
                            <p><strong>Información del fondo:</strong></p>
                            <ul>
                                <li><strong>Código:</strong> ${fund.code}</li>
                                <li><strong>Tipo:</strong> ${getFundTypeText(fund.type)}</li>
                                <li><strong>Estado:</strong> ${fund.isActive ? 'Activo' : 'Inactivo'}</li>
                                <li><strong>Saldo actual:</strong> ${formatCurrency(fund.currentBalance)}</li>
                            </ul>
                        </div>

                        <div class="alert alert-danger mt-3">
                            <strong>⚠️ Esta acción no se puede deshacer.</strong>
                        </div>

                        <div class="form-check mt-3">
                            <input class="form-check-input" type="checkbox" id="confirmDelete">
                            <label class="form-check-label" for="confirmDelete">
                                Confirmo que deseo eliminar este fondo permanentemente
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-danger" onclick="confirmDeleteFund('${fundId}', '${fundName}')" disabled id="confirmDeleteBtn">
                            <i class="bi bi-trash"></i> Eliminar Fondo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('deleteFundModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Setup checkbox handler
    const checkbox = document.getElementById('confirmDelete');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    checkbox.addEventListener('change', function() {
        confirmBtn.disabled = !this.checked;
    });

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('deleteFundModal'));
    modal.show();

    // Clean up when modal is hidden
    document.getElementById('deleteFundModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Confirm fund deletion
async function confirmDeleteFund(fundId, fundName) {
    const checkbox = document.getElementById('confirmDelete');
    if (!checkbox.checked) {
        showNotification('Debe confirmar la eliminación', 'error');
        return;
    }

    try {
        showLoading();

        // Call API to delete fund
        await api.deleteFund(fundId);
        
        showNotification(`Fondo "${fundName}" eliminado exitosamente`, 'success');

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteFundModal'));
        modal.hide();

        // Reload funds list
        loadFunds(currentFundsPage, currentFundsFilters);

    } catch (error) {
        console.error('Error deleting fund:', error);
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Show delete fund with history modal (for funds with transactions)
function showDeleteFundWithHistoryModal(fundId, fundName, fund) {
    const modalHTML = `
        <div class="modal fade" id="deleteFundHistoryModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">⚠️ Fondo con Historial de Transacciones</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning">
                            <h6><strong>No se puede eliminar este fondo</strong></h6>
                            <p>El fondo "${fundName}" tiene historial de transacciones y no puede ser eliminado directamente.</p>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <h6>📊 Resumen Financiero:</h6>
                                <ul>
                                    <li><strong>Total ingresos:</strong> ${formatCurrency(fund.totalIncome)}</li>
                                    <li><strong>Total gastos:</strong> ${formatCurrency(fund.totalExpenses)}</li>
                                    <li><strong>Saldo actual:</strong> ${formatCurrency(fund.currentBalance)}</li>
                                </ul>
                            </div>
                            <div class="col-md-6">
                                <h6>ℹ️ Información del Fondo:</h6>
                                <ul>
                                    <li><strong>Código:</strong> ${fund.code}</li>
                                    <li><strong>Tipo:</strong> ${getFundTypeText(fund.type)}</li>
                                    <li><strong>Estado:</strong> ${fund.isActive ? 'Activo' : 'Inactivo'}</li>
                                </ul>
                            </div>
                        </div>

                        <div class="alert alert-info mt-3">
                            <h6><strong>🔧 Opciones disponibles:</strong></h6>
                            <ol>
                                <li><strong>Si el saldo es positivo:</strong> Transfiera el dinero a otro fondo primero</li>
                                <li><strong>Desactivar el fondo:</strong> Puede desactivarlo para que no aparezca en las operaciones</li>
                                <li><strong>Contactar administrador:</strong> Para eliminación forzada (se perderá el historial)</li>
                            </ol>
                        </div>

                        ${fund.currentBalance > 0 ? `
                            <div class="alert alert-danger">
                                <strong>⚠️ Saldo pendiente:</strong> Este fondo tiene un saldo de ${formatCurrency(fund.currentBalance)}. 
                                Debe transferir este dinero a otro fondo antes de poder eliminarlo.
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        ${fund.currentBalance > 0 ? `
                            <button type="button" class="btn btn-primary" onclick="showTransferFromFund('${fundId}')">
                                <i class="bi bi-arrow-right"></i> Transferir Saldo
                            </button>
                            <button type="button" class="btn btn-warning" onclick="showBalanceAdjustmentModal('${fundId}', '${fundName}', ${fund.currentBalance})">
                                <i class="bi bi-gear"></i> Ajuste de Saldo
                            </button>
                        ` : ''}
                        <button type="button" class="btn btn-warning" onclick="toggleFundStatus('${fundId}', ${fund.isActive})">
                            <i class="bi bi-power"></i> ${fund.isActive ? 'Desactivar' : 'Activar'} Fondo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('deleteFundHistoryModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('deleteFundHistoryModal'));
    modal.show();

    // Clean up when modal is hidden
    document.getElementById('deleteFundHistoryModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Show transfer modal pre-filled with source fund
function showTransferFromFund(sourceFundId) {
    // Close the current modal first
    const currentModal = bootstrap.Modal.getInstance(document.getElementById('deleteFundHistoryModal'));
    if (currentModal) {
        currentModal.hide();
    }

    // Show transfer modal
    showTransferModal();

    // Pre-select the source fund
    setTimeout(() => {
        const sourceFundSelect = document.getElementById('sourceFund');
        if (sourceFundSelect) {
            sourceFundSelect.value = sourceFundId;
            // Trigger change event to update fund info
            sourceFundSelect.dispatchEvent(new Event('change'));
        }
    }, 100);
}

// Toggle fund active status
async function toggleFundStatus(fundId, currentStatus) {
    const fund = currentFunds.find(f => f.id === fundId);
    if (!fund) {
        showNotification('Fondo no encontrado', 'error');
        return;
    }

    const newStatus = !currentStatus;
    const action = newStatus ? 'activar' : 'desactivar';

    try {
        showLoading();

        // Update fund status
        await api.updateFund(fundId, { isActive: newStatus });
        
        showNotification(`Fondo ${action}do exitosamente`, 'success');

        // Close any open modals
        const modals = ['deleteFundHistoryModal', 'deleteFundModal'];
        modals.forEach(modalId => {
            const modalElement = document.getElementById(modalId);
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }
        });

        // Reload funds list
        loadFunds(currentFundsPage, currentFundsFilters);

    } catch (error) {
        console.error('Error updating fund status:', error);
        handleApiError(error);
    } finally {
        hideLoading();
    }
}// Adminis
trative balance adjustment
function showBalanceAdjustmentModal(fundId, fundName, currentBalance) {
    const modalHTML = `
        <div class="modal fade" id="balanceAdjustmentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">⚙️ Ajuste Administrativo de Saldo</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <strong>Fondo:</strong> ${fundName}<br>
                            <strong>Saldo actual:</strong> ${formatCurrency(currentBalance)}
                        </div>

                        <p><strong>Esta función permite ajustar el saldo del fondo por razones administrativas.</strong></p>

                        <form id="balanceAdjustmentForm">
                            <div class="mb-3">
                                <label for="adjustmentType" class="form-label">Tipo de Ajuste *</label>
                                <select class="form-select" id="adjustmentType" required>
                                    <option value="">Seleccionar tipo</option>
                                    <option value="ZERO_BALANCE">Poner saldo en cero</option>
                                    <option value="SPECIFIC_AMOUNT">Ajustar a monto específico</option>
                                    <option value="ADD_SUBTRACT">Sumar o restar monto</option>
                                </select>
                            </div>

                            <div class="mb-3" id="specificAmountDiv" style="display: none;">
                                <label for="specificAmount" class="form-label">Nuevo Saldo</label>
                                <input type="number" class="form-control" id="specificAmount" step="0.01">
                            </div>

                            <div class="mb-3" id="addSubtractDiv" style="display: none;">
                                <label for="adjustmentAmount" class="form-label">Monto del Ajuste</label>
                                <div class="input-group">
                                    <select class="form-select" id="adjustmentOperation" style="max-width: 100px;">
                                        <option value="add">Sumar</option>
                                        <option value="subtract">Restar</option>
                                    </select>
                                    <input type="number" class="form-control" id="adjustmentAmount" step="0.01" min="0">
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="adjustmentReason" class="form-label">Razón del Ajuste *</label>
                                <textarea class="form-control" id="adjustmentReason" rows="3" required 
                                    placeholder="Explique la razón del ajuste administrativo..."></textarea>
                            </div>

                            <div class="alert alert-warning">
                                <strong>⚠️ Advertencia:</strong> Este ajuste quedará registrado en el historial de transacciones del fondo.
                            </div>

                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="confirmAdjustment" required>
                                <label class="form-check-label" for="confirmAdjustment">
                                    Confirmo que tengo autorización para realizar este ajuste administrativo
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-warning" onclick="processBalanceAdjustment('${fundId}', '${fundName}', ${currentBalance})">
                            <i class="bi bi-gear"></i> Realizar Ajuste
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('balanceAdjustmentModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Setup form handlers
    const adjustmentType = document.getElementById('adjustmentType');
    const specificAmountDiv = document.getElementById('specificAmountDiv');
    const addSubtractDiv = document.getElementById('addSubtractDiv');

    adjustmentType.addEventListener('change', function() {
        specificAmountDiv.style.display = this.value === 'SPECIFIC_AMOUNT' ? 'block' : 'none';
        addSubtractDiv.style.display = this.value === 'ADD_SUBTRACT' ? 'block' : 'none';
        
        if (this.value === 'ZERO_BALANCE') {
            document.getElementById('adjustmentReason').value = 'Ajuste administrativo para poner saldo en cero antes de eliminar fondo';
        }
    });

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('balanceAdjustmentModal'));
    modal.show();

    // Clean up when modal is hidden
    document.getElementById('balanceAdjustmentModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Process balance adjustment
async function processBalanceAdjustment(fundId, fundName, currentBalance) {
    const form = document.getElementById('balanceAdjustmentForm');
    if (!form || !validateForm(form)) {
        showNotification('Por favor complete todos los campos requeridos', 'error');
        return;
    }

    const adjustmentType = document.getElementById('adjustmentType').value;
    const specificAmount = parseFloat(document.getElementById('specificAmount').value) || 0;
    const adjustmentAmount = parseFloat(document.getElementById('adjustmentAmount').value) || 0;
    const adjustmentOperation = document.getElementById('adjustmentOperation').value;
    const reason = document.getElementById('adjustmentReason').value;
    const confirmed = document.getElementById('confirmAdjustment').checked;

    if (!confirmed) {
        showNotification('Debe confirmar que tiene autorización para realizar este ajuste', 'error');
        return;
    }

    let newBalance = currentBalance;
    let transactionAmount = 0;
    let description = reason;

    // Calculate new balance and transaction amount
    switch (adjustmentType) {
        case 'ZERO_BALANCE':
            newBalance = 0;
            transactionAmount = -currentBalance;
            description = `Ajuste administrativo a saldo cero: ${reason}`;
            break;
        case 'SPECIFIC_AMOUNT':
            newBalance = specificAmount;
            transactionAmount = specificAmount - currentBalance;
            description = `Ajuste administrativo a ${formatCurrency(specificAmount)}: ${reason}`;
            break;
        case 'ADD_SUBTRACT':
            if (adjustmentOperation === 'add') {
                newBalance = currentBalance + adjustmentAmount;
                transactionAmount = adjustmentAmount;
                description = `Ajuste administrativo +${formatCurrency(adjustmentAmount)}: ${reason}`;
            } else {
                newBalance = currentBalance - adjustmentAmount;
                transactionAmount = -adjustmentAmount;
                description = `Ajuste administrativo -${formatCurrency(adjustmentAmount)}: ${reason}`;
            }
            break;
    }

    const transactionData = {
        fundId,
        type: transactionAmount >= 0 ? 'INCOME' : 'EXPENSE',
        amount: transactionAmount,
        description,
        category: 'ADMINISTRATIVE_ADJUSTMENT'
    };

    try {
        showLoading();

        await api.createFundTransaction(transactionData);
        
        showNotification(`Ajuste administrativo realizado exitosamente. Nuevo saldo: ${formatCurrency(newBalance)}`, 'success');

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('balanceAdjustmentModal'));
        modal.hide();

        // Reload funds list
        loadFunds(currentFundsPage, currentFundsFilters);

    } catch (error) {
        console.error('Error processing balance adjustment:', error);
        handleApiError(error);
    } finally {
        hideLoading();
    }
}// E
xport all functions for global access
window.initFunds = initFunds;
window.loadFunds = loadFunds;
window.showCreateFundModal = showCreateFundModal;
window.viewFund = viewFund;
window.editFund = editFund;
window.viewFundTransactions = viewFundTransactions;
window.addFundIncome = addFundIncome;
window.addFundExpense = addFundExpense;
window.showTransferModal = showTransferModal;
window.processTransfer = processTransfer;
window.showFundStatsModal = showFundStatsModal;
window.exportFunds = exportFunds;
window.deleteFund = deleteFund;
window.toggleFundStatus = toggleFundStatus;
window.showTransferFromFund = showTransferFromFund;
window.showBalanceAdjustmentModal = showBalanceAdjustmentModal;