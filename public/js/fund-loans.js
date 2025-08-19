// Fund Loans Management

let currentFundLoans = [];
let currentFundLoansPage = 1;
let totalFundLoansPages = 1;
let currentFundLoansFilters = {};

// Initialize fund loans page
async function initFundLoans() {
    try {
        console.log('🏦 Initializing fund loans page...');
        showLoading();

        // Render fund loans content
        renderFundLoansContent();

        // Load fund loans data
        await loadFundLoans();

        // Setup event listeners
        setupFundLoansEventListeners();

        hideLoading();
    } catch (error) {
        console.error('❌ Error initializing fund loans:', error);
        showError('Error al cargar la página de préstamos');
        hideLoading();
    }
}

// Render fund loans page content
function renderFundLoansContent() {
    const contentArea = document.getElementById('contentArea');

    contentArea.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-arrow-left-right"></i> Préstamos entre Fondos</h2>
            <div class="btn-group">
                <button class="btn btn-primary" onclick="showCreateLoanModal()">
                    <i class="bi bi-plus"></i> Solicitar Préstamo
                </button>
                <button class="btn btn-warning" onclick="showPendingApprovals()">
                    <i class="bi bi-clock"></i> Pendientes de Aprobación
                </button>
                <button class="btn btn-danger" onclick="showOverdueLoans()">
                    <i class="bi bi-exclamation-triangle"></i> Préstamos Vencidos
                </button>
            </div>
        </div>

        <!-- Loan Statistics Cards -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Total Préstamos</h6>
                                <h3 id="totalLoansCount">0</h3>
                            </div>
                            <i class="bi bi-arrow-left-right fs-1"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Monto Total</h6>
                                <h3 id="totalLoansAmount">$0</h3>
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
                                <h6 class="card-title">Pendientes</h6>
                                <h3 id="pendingLoansCount">0</h3>
                            </div>
                            <i class="bi bi-clock fs-1"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-danger text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Vencidos</h6>
                                <h3 id="overdueLoansCount">0</h3>
                            </div>
                            <i class="bi bi-exclamation-triangle fs-1"></i>
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
                        <input type="text" class="form-control" id="loanSearch" placeholder="Buscar por fondos o motivo...">
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="loanStatusFilter">
                            <option value="">Todos los estados</option>
                            <option value="PENDING">Pendiente</option>
                            <option value="APPROVED">Aprobado</option>
                            <option value="DISBURSED">Desembolsado</option>
                            <option value="REPAYING">Pagando</option>
                            <option value="FULLY_REPAID">Pagado</option>
                            <option value="OVERDUE">Vencido</option>
                            <option value="CANCELLED">Cancelado</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="loanFundFilter">
                            <option value="">Todos los fondos</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <input type="date" class="form-control" id="loanDateFrom" placeholder="Desde">
                    </div>
                    <div class="col-md-3">
                        <div class="btn-group w-100">
                            <button class="btn btn-outline-primary" onclick="searchFundLoans()">
                                <i class="bi bi-search"></i> Buscar
                            </button>
                            <button class="btn btn-outline-secondary" onclick="clearLoanFilters()">
                                <i class="bi bi-x-circle"></i> Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loans Table -->
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Lista de Préstamos</h5>
                <button class="btn btn-outline-success btn-sm" onclick="exportLoans()">
                    <i class="bi bi-download"></i> Exportar
                </button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Fondo Prestamista</th>
                                <th>Fondo Receptor</th>
                                <th>Monto</th>
                                <th>Pendiente</th>
                                <th>Fecha Límite</th>
                                <th>Estado</th>
                                <th>Solicitado por</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="fundLoansTableBody">
                            <tr>
                                <td colspan="9" class="text-center">Cargando préstamos...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card-footer">
                <nav>
                    <ul class="pagination justify-content-center mb-0" id="fundLoansPagination">
                    </ul>
                </nav>
            </div>
        </div>

        <!-- Loan Modal -->
        <div class="modal fade" id="loanModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="loanModalTitle">Solicitar Préstamo</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="loanForm">
                            <input type="hidden" id="loanId">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="lenderFund" class="form-label">Fondo Prestamista *</label>
                                        <select class="form-select" id="lenderFund" name="lenderFund" required>
                                            <option value="">Seleccionar fondo prestamista</option>
                                        </select>
                                        <div class="form-text" id="lenderFundInfo"></div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="borrowerFund" class="form-label">Fondo Receptor *</label>
                                        <select class="form-select" id="borrowerFund" name="borrowerFund" required>
                                            <option value="">Seleccionar fondo receptor</option>
                                        </select>
                                        <div class="form-text" id="borrowerFundInfo"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="loanAmount" class="form-label">Monto del Préstamo *</label>
                                        <input type="number" class="form-control" id="loanAmount" name="amount" min="0.01" step="0.01" required>
                                        <div class="form-text" id="loanAmountValidation"></div>
                        <div id="validationResult" class="mt-2"></div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="loanDueDate" class="form-label">Fecha Límite de Devolución *</label>
                                        <input type="date" class="form-control" id="loanDueDate" name="dueDate" required>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="loanReason" class="form-label">Motivo del Préstamo *</label>
                                <textarea class="form-control" id="loanReason" name="reason" rows="3" required placeholder="Explique detalladamente el motivo del préstamo..."></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="loanObservations" class="form-label">Observaciones</label>
                                <textarea class="form-control" id="loanObservations" name="observations" rows="2" placeholder="Observaciones adicionales (opcional)"></textarea>
                            </div>
                            
                            <!-- Loan validation info -->
                            <div id="loanValidationInfo" class="alert alert-info d-none">
                                <h6><i class="bi bi-info-circle"></i> Información del Préstamo</h6>
                                <div id="loanValidationDetails"></div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="saveLoanBtn" onclick="saveLoan()">Solicitar Préstamo</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loan Details Modal -->
        <div class="modal fade" id="loanDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detalles del Préstamo</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="loanDetailsContent">
                        <!-- Content will be loaded dynamically -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Load fund loans data
async function loadFundLoans(page = 1, filters = {}) {
    try {
        showLoading();
        
        const params = {
            page,
            limit: 20,
            ...filters
        };
        
        const response = await api.getFundLoans(params);
        
        currentFundLoans = response.loans || [];
        currentFundLoansPage = response.pagination?.page || 1;
        totalFundLoansPages = response.pagination?.pages || 1;
        currentFundLoansFilters = filters;
        
        updateFundLoansTable();
        updateFundLoansPagination();
        updateFundLoansStats();
        
        // Load funds for filters
        await loadFundsForFilters();
        
    } catch (error) {
        console.error('Error loading fund loans:', error);
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Update fund loans table
function updateFundLoansTable() {
    const tbody = document.getElementById('fundLoansTableBody');
    if (!tbody) return;
    
    if (currentFundLoans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No se encontraron préstamos</td></tr>';
        return;
    }
    
    tbody.innerHTML = currentFundLoans.map(loan => `
        <tr>
            <td>${formatDate(loan.requestDate)}</td>
            <td>
                <strong>${loan.lenderFund?.name}</strong><br>
                <small class="text-muted">${loan.lenderFund?.code}</small>
            </td>
            <td>
                <strong>${loan.borrowerFund?.name}</strong><br>
                <small class="text-muted">${loan.borrowerFund?.code}</small>
            </td>
            <td class="text-primary"><strong>${formatCurrency(loan.amount)}</strong></td>
            <td class="${loan.pendingAmount > 0 ? 'text-danger' : 'text-success'}">
                ${formatCurrency(loan.pendingAmount)}
            </td>
            <td class="${new Date(loan.dueDate) < new Date() && loan.pendingAmount > 0 ? 'text-danger' : ''}">
                ${formatDate(loan.dueDate)}
            </td>
            <td>${getLoanStatusBadge(loan.status)}</td>
            <td>
                <strong>${loan.requester?.name}</strong><br>
                <small class="text-muted">${formatDate(loan.requestDate)}</small>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewLoanDetails('${loan.id}')" title="Ver Detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${loan.status === 'PENDING' ? `
                        <button class="btn btn-outline-success" onclick="approveLoan('${loan.id}')" title="Aprobar">
                            <i class="bi bi-check-circle"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="rejectLoan('${loan.id}')" title="Rechazar">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    ` : ''}
                    ${loan.status === 'DISBURSED' || loan.status === 'REPAYING' ? `
                        <button class="btn btn-outline-info" onclick="addLoanPayment('${loan.id}')" title="Registrar Pago">
                            <i class="bi bi-cash"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Get loan status badge
function getLoanStatusBadge(status) {
    const badges = {
        'PENDING': '<span class="badge bg-warning">Pendiente</span>',
        'APPROVED': '<span class="badge bg-info">Aprobado</span>',
        'DISBURSED': '<span class="badge bg-primary">Desembolsado</span>',
        'REPAYING': '<span class="badge bg-secondary">Pagando</span>',
        'FULLY_REPAID': '<span class="badge bg-success">Pagado</span>',
        'OVERDUE': '<span class="badge bg-danger">Vencido</span>',
        'CANCELLED': '<span class="badge bg-dark">Cancelado</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

// Update fund loans statistics
function updateFundLoansStats() {
    const totalLoans = currentFundLoans.length;
    const totalAmount = currentFundLoans.reduce((sum, loan) => sum + loan.amount, 0);
    const pendingLoans = currentFundLoans.filter(loan => loan.status === 'PENDING').length;
    const overdueLoans = currentFundLoans.filter(loan => 
        loan.status !== 'FULLY_REPAID' && 
        loan.status !== 'CANCELLED' && 
        new Date(loan.dueDate) < new Date() && 
        loan.pendingAmount > 0
    ).length;
    
    document.getElementById('totalLoansCount').textContent = totalLoans;
    document.getElementById('totalLoansAmount').textContent = formatCurrency(totalAmount);
    document.getElementById('pendingLoansCount').textContent = pendingLoans;
    document.getElementById('overdueLoansCount').textContent = overdueLoans;
}

// Show create loan modal
function showCreateLoanModal() {
    showLoanModal(null, 'create');
}

// Show loan modal
async function showLoanModal(loan = null, mode = 'create') {
    const modal = document.getElementById('loanModal');
    const modalTitle = document.getElementById('loanModalTitle');
    const form = document.getElementById('loanForm');
    
    if (!modal || !modalTitle || !form) return;
    
    // Set modal title
    const titles = {
        create: 'Solicitar Préstamo',
        edit: 'Editar Préstamo',
        view: 'Ver Préstamo'
    };
    modalTitle.textContent = titles[mode];
    
    // Clear form
    form.reset();
    
    // Load available funds
    await loadFundsForLoan();
    
    // Set minimum due date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('loanDueDate').min = tomorrow.toISOString().split('T')[0];
    
    // Set form mode
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.disabled = mode === 'view';
        input.classList.remove('is-invalid');
    });
    
    // Hide/show buttons based on mode
    const saveBtn = document.getElementById('saveLoanBtn');
    if (saveBtn) {
        saveBtn.style.display = mode === 'view' ? 'none' : 'block';
    }
    
    // Fill form if editing or viewing
    if (loan && mode !== 'create') {
        document.getElementById('loanId').value = loan.id;
        document.getElementById('lenderFund').value = loan.lenderFundId;
        document.getElementById('borrowerFund').value = loan.borrowerFundId;
        document.getElementById('loanAmount').value = loan.amount;
        document.getElementById('loanDueDate').value = loan.dueDate.split('T')[0];
        document.getElementById('loanReason').value = loan.reason;
        document.getElementById('loanObservations').value = loan.observations || '';
    }
    
    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Load funds for loan selection
async function loadFundsForLoan() {
    try {
        const response = await api.getFunds({ isActive: 'true' });
        const funds = response.funds || [];
        
        const lenderSelect = document.getElementById('lenderFund');
        const borrowerSelect = document.getElementById('borrowerFund');
        
        const fundOptions = funds.map(fund => 
            `<option value="${fund.id}" data-balance="${fund.currentBalance}">
                ${fund.name} (${fund.code}) - ${formatCurrency(fund.currentBalance)}
            </option>`
        ).join('');
        
        lenderSelect.innerHTML = '<option value="">Seleccionar fondo prestamista</option>' + fundOptions;
        borrowerSelect.innerHTML = '<option value="">Seleccionar fondo receptor</option>' + fundOptions;
        
        // Add change listeners for validation
        lenderSelect.addEventListener('change', validateLoanAmount);
        borrowerSelect.addEventListener('change', validateLoanAmount);
        document.getElementById('loanAmount').addEventListener('input', validateLoanAmount);
        
    } catch (error) {
        console.error('Error loading funds for loan:', error);
    }
}


// Validate loan amount
async function validateLoanAmount() {
    try {
        const lenderFundId = document.getElementById('lenderFund')?.value;
        const borrowerFundId = document.getElementById('borrowerFund')?.value;
        const amount = parseFloat(document.getElementById('loanAmount')?.value || 0);
        
        const validationResult = document.getElementById('validationResult');
        
        // Si no existe el elemento, no hacer nada
        if (!validationResult) {
            console.log('⚠️ Elemento validationResult no encontrado');
            return;
        }
        
        if (!lenderFundId || !borrowerFundId || !amount) {
            validationResult.innerHTML = '';
            return;
        }
        
        if (lenderFundId === borrowerFundId) {
            validationResult.innerHTML = '<div class="alert alert-danger">No se puede prestar al mismo fondo</div>';
            return;
        }
        
        if (amount <= 0) {
            validationResult.innerHTML = '<div class="alert alert-danger">El monto debe ser mayor a cero</div>';
            return;
        }
        
        // Validación exitosa
        validationResult.innerHTML = `
            <div class="alert alert-success">
                <strong>✅ Validación exitosa</strong><br>
                Monto: ${formatCurrency(amount)}<br>
                ${amount >= 500000 ? '<small>⚠️ Requiere aprobación especial</small>' : ''}
            </div>
        `;
        
    } catch (error) {
        console.error('Error validating loan:', error);
        const validationResult = document.getElementById('validationResult');
        if (validationResult) {
            validationResult.innerHTML = '<div class="alert alert-info">Validación completada</div>';
        }
    }
}
function setupFundLoansEventListeners() {
    // Search with debounce
    const searchInput = document.getElementById('loanSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchFundLoans, 300));
    }
    
    // Filter change handlers
    ['loanStatusFilter', 'loanFundFilter', 'loanDateFrom'].forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', searchFundLoans);
        }
    });
    
    // Form submission
    const loanForm = document.getElementById('loanForm');
    if (loanForm) {
        loanForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveLoan();
        });
    }
}

// Search fund loans
function searchFundLoans() {
    const searchTerm = document.getElementById('loanSearch')?.value || '';
    const statusFilter = document.getElementById('loanStatusFilter')?.value || '';
    const fundFilter = document.getElementById('loanFundFilter')?.value || '';
    const dateFrom = document.getElementById('loanDateFrom')?.value || '';
    
    const filters = {};
    if (searchTerm) filters.search = searchTerm;
    if (statusFilter) filters.status = statusFilter;
    if (fundFilter) filters.fundId = fundFilter;
    if (dateFrom) filters.startDate = dateFrom;
    
    loadFundLoans(1, filters);
}

// Clear filters
function clearLoanFilters() {
    document.getElementById('loanSearch').value = '';
    document.getElementById('loanStatusFilter').value = '';
    document.getElementById('loanFundFilter').value = '';
    document.getElementById('loanDateFrom').value = '';
    loadFundLoans(1, {});
}

// Load funds for filters
async function loadFundsForFilters() {
    try {
        const response = await api.getFunds({ isActive: 'true' });
        const funds = response.funds || [];
        
        const fundFilter = document.getElementById('loanFundFilter');
        if (fundFilter) {
            const currentValue = fundFilter.value;
            fundFilter.innerHTML = '<option value="">Todos los fondos</option>' +
                funds.map(fund => 
                    `<option value="${fund.id}">${fund.name} (${fund.code})</option>`
                ).join('');
            fundFilter.value = currentValue;
        }
        
    } catch (error) {
        console.error('Error loading funds for filters:', error);
    }
}

// Export functions for global access
window.initFundLoans = initFundLoans;
window.loadFundLoans = loadFundLoans;
window.showCreateLoanModal = showCreateLoanModal;

// ==========================================
// FUNCIONES DE PAGINACIÓN Y NAVEGACIÓN
// ==========================================

// Update fund loans pagination
function updateFundLoansPagination() {
    const paginationContainer = document.getElementById('fundLoansPagination');
    if (!paginationContainer) return;

    let paginationHTML = '';
    
    if (totalFundLoansPages > 1) {
        paginationHTML = '<nav aria-label="Fund loans pagination"><ul class="pagination justify-content-center">';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${currentFundLoansPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changeFundLoansPage(${currentFundLoansPage - 1})" aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        `;
        
        // Page numbers
        for (let i = 1; i <= totalFundLoansPages; i++) {
            if (i === currentFundLoansPage) {
                paginationHTML += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
            } else {
                paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changeFundLoansPage(${i})">${i}</a></li>`;
            }
        }
        
        // Next button
        paginationHTML += `
            <li class="page-item ${currentFundLoansPage === totalFundLoansPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changeFundLoansPage(${currentFundLoansPage + 1})" aria-label="Next">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        `;
        
        paginationHTML += '</ul></nav>';
    }
    
    paginationContainer.innerHTML = paginationHTML;
}

// Change fund loans page
function changeFundLoansPage(page) {
    if (page < 1 || page > totalFundLoansPages || page === currentFundLoansPage) {
        return;
    }
    
    loadFundLoans(page, currentFundLoansFilters);
}

// Show pending approvals
function showPendingApprovals() {
    const filters = { status: 'PENDING' };
    loadFundLoans(1, filters);
    
    // Update filter UI
    const statusFilter = document.getElementById('loanStatusFilter');
    if (statusFilter) {
        statusFilter.value = 'PENDING';
    }
}

// Show overdue loans
function showOverdueLoans() {
    const filters = { status: 'OVERDUE' };
    loadFundLoans(1, filters);
    
    // Update filter UI
    const statusFilter = document.getElementById('loanStatusFilter');
    if (statusFilter) {
        statusFilter.value = 'OVERDUE';
    }
}

// ==========================================
// FUNCIONES DE UTILIDAD
// ==========================================

// Format currency for display
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Calculate days until due date
function getDaysUntilDue(dueDateString) {
    const dueDate = new Date(dueDateString);
    const today = new Date();
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Get loan priority based on due date
function getLoanPriority(dueDateString) {
    const daysUntilDue = getDaysUntilDue(dueDateString);
    
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue <= 7) return 'urgent';
    if (daysUntilDue <= 30) return 'warning';
    return 'normal';
}



// Save loan
async function saveLoan() {
    try {
        console.log('💾 Guardando préstamo...');
        
        // Obtener datos directamente de los elementos del formulario
        const lenderFundSelect = document.getElementById('lenderFund');
        const borrowerFundSelect = document.getElementById('borrowerFund');
        const amountInput = document.getElementById('loanAmount');
        const reasonInput = document.getElementById('loanReason');
        const dueDateInput = document.getElementById('loanDueDate');
        const observationsInput = document.getElementById('loanObservations');
        
        console.log('🔍 Elementos del formulario:', {
            lenderFund: lenderFundSelect?.value,
            borrowerFund: borrowerFundSelect?.value,
            amount: amountInput?.value,
            reason: reasonInput?.value,
            dueDate: dueDateInput?.value,
            observations: observationsInput?.value
        });
        
        const loanData = {
            lenderFundId: lenderFundSelect?.value,
            borrowerFundId: borrowerFundSelect?.value,
            amount: parseFloat(amountInput?.value || 0),
            reason: reasonInput?.value,
            dueDate: dueDateInput?.value,
            observations: observationsInput?.value || ''
        };
        
        console.log('📋 Datos del préstamo:', loanData);
        
        // Validaciones básicas
        if (!loanData.lenderFundId) {
            throw new Error('Debe seleccionar un fondo prestamista');
        }
        
        if (!loanData.borrowerFundId) {
            throw new Error('Debe seleccionar un fondo receptor');
        }
        
        if (!loanData.amount || loanData.amount <= 0) {
            throw new Error('Debe ingresar un monto válido mayor a cero');
        }
        
        if (!loanData.reason || loanData.reason.trim() === '') {
            throw new Error('Debe ingresar el motivo del préstamo');
        }
        
        if (loanData.lenderFundId === loanData.borrowerFundId) {
            throw new Error('No se puede prestar al mismo fondo');
        }
        
        showLoading();
        
        // Crear préstamo usando la API
        const response = await api.createLoan(loanData);
        
        if (response.success) {
            showSuccess('Préstamo creado exitosamente');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('loanModal'));
            if (modal) {
                modal.hide();
            }
            
            // Limpiar formulario
            if (lenderFundSelect) lenderFundSelect.value = '';
            if (borrowerFundSelect) borrowerFundSelect.value = '';
            if (amountInput) amountInput.value = '';
            if (reasonInput) reasonInput.value = '';
            if (dueDateInput) dueDateInput.value = '';
            if (observationsInput) observationsInput.value = '';
            
            // Recargar lista de préstamos
            await loadFundLoans();
            
        } else {
            throw new Error(response.error || 'Error al crear préstamo');
        }
        
    } catch (error) {
        console.error('Error saving loan:', error);
        showError(error.message || 'Error al guardar préstamo');
    } finally {
        hideLoading();
    }
}

// Hacer funciones disponibles globalmente
window.validateLoanAmount = validateLoanAmount;
window.saveLoan = saveLoan;
window.showCreateLoanModal = showCreateLoanModal;
window.loadFundLoans = loadFundLoans;


// ==========================================
// FUNCIONES DE ACCIONES DE PRÉSTAMOS
// ==========================================

// Aprobar préstamo
async function approveLoan(loanId) {
    try {
        console.log(`✅ Aprobando préstamo: ${loanId}`);
        
        const approvalNotes = prompt('Notas de aprobación (opcional):') || '';
        
        if (!confirm('¿Está seguro de que desea aprobar este préstamo?')) {
            return;
        }
        
        showLoading();
        
        const response = await api.approveLoan(loanId, approvalNotes);
        
        if (response.success) {
            showSuccess('Préstamo aprobado exitosamente');
            await loadFundLoans(); // Recargar lista
        } else {
            throw new Error(response.error || 'Error al aprobar préstamo');
        }
        
    } catch (error) {
        console.error('Error approving loan:', error);
        showError(error.message || 'Error al aprobar préstamo');
    } finally {
        hideLoading();
    }
}

// Rechazar préstamo
async function rejectLoan(loanId) {
    try {
        console.log(`❌ Rechazando préstamo: ${loanId}`);
        
        const rejectionReason = prompt('Razón del rechazo (requerida):');
        
        if (!rejectionReason || rejectionReason.trim() === '') {
            showError('La razón del rechazo es requerida');
            return;
        }
        
        if (!confirm('¿Está seguro de que desea rechazar este préstamo?')) {
            return;
        }
        
        showLoading();
        
        const response = await api.rejectLoan(loanId, rejectionReason);
        
        if (response.success) {
            showSuccess('Préstamo rechazado');
            await loadFundLoans(); // Recargar lista
        } else {
            throw new Error(response.error || 'Error al rechazar préstamo');
        }
        
    } catch (error) {
        console.error('Error rejecting loan:', error);
        showError(error.message || 'Error al rechazar préstamo');
    } finally {
        hideLoading();
    }
}

// Desembolsar préstamo
async function disburseLoan(loanId) {
    try {
        console.log(`💰 Desembolsando préstamo: ${loanId}`);
        
        const disbursementNotes = prompt('Notas de desembolso (opcional):') || '';
        
        if (!confirm('¿Está seguro de que desea desembolsar este préstamo?')) {
            return;
        }
        
        showLoading();
        
        const response = await api.disburseLoan(loanId, disbursementNotes);
        
        if (response.success) {
            showSuccess('Préstamo desembolsado exitosamente');
            await loadFundLoans(); // Recargar lista
        } else {
            throw new Error(response.error || 'Error al desembolsar préstamo');
        }
        
    } catch (error) {
        console.error('Error disbursing loan:', error);
        showError(error.message || 'Error al desembolsar préstamo');
    } finally {
        hideLoading();
    }
}


// Ver detalles del préstamo
async function viewLoanDetails(loanId) {
    try {
        console.log(`🔍 Viendo detalles del préstamo: ${loanId}`);
        
        showLoading();
        
        // Obtener detalles del préstamo desde el backend
        const response = await api.get(`/funds/loans/${loanId}`);
        
        if (response.success && response.loan) {
            const loan = response.loan;
            
            // Crear modal con detalles
            const modalHtml = `
                <div class="modal fade" id="loanDetailsModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Detalles del Préstamo #${loan.id}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6>Información General</h6>
                                        <p><strong>Estado:</strong> ${getLoanStatusBadge(loan.status)}</p>
                                        <p><strong>Monto:</strong> ${formatCurrency(loan.amount)}</p>
                                        <p><strong>Monto Pendiente:</strong> ${formatCurrency(loan.pendingAmount)}</p>
                                        <p><strong>Fecha de Solicitud:</strong> ${formatDate(loan.requestDate)}</p>
                                        <p><strong>Fecha Límite:</strong> ${formatDate(loan.dueDate)}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6>Fondos Involucrados</h6>
                                        <p><strong>Fondo Prestamista:</strong> ${loan.lenderFund.name} (${loan.lenderFund.code})</p>
                                        <p><strong>Fondo Receptor:</strong> ${loan.borrowerFund.name} (${loan.borrowerFund.code})</p>
                                    </div>
                                </div>
                                <div class="row mt-3">
                                    <div class="col-12">
                                        <h6>Motivo del Préstamo</h6>
                                        <p>${loan.reason}</p>
                                    </div>
                                </div>
                                ${loan.approver ? `
                                <div class="row mt-3">
                                    <div class="col-12">
                                        <h6>Información de Aprobación</h6>
                                        <p><strong>Aprobado por:</strong> ${loan.approver.name}</p>
                                        <p><strong>Fecha de Aprobación:</strong> ${formatDate(loan.approvedAt)}</p>
                                        ${loan.approvalNotes ? `<p><strong>Notas:</strong> ${loan.approvalNotes}</p>` : ''}
                                    </div>
                                </div>
                                ` : ''}
                                ${loan.rejectedBy ? `
                                <div class="row mt-3">
                                    <div class="col-12">
                                        <h6>Información de Rechazo</h6>
                                        <p><strong>Rechazado por:</strong> ${loan.rejectedBy.name}</p>
                                        <p><strong>Fecha de Rechazo:</strong> ${formatDate(loan.rejectedAt)}</p>
                                        <p><strong>Razón:</strong> ${loan.rejectionReason}</p>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remover modal existente si existe
            const existingModal = document.getElementById('loanDetailsModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Agregar modal al DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('loanDetailsModal'));
            modal.show();
            
        } else {
            throw new Error(response.error || 'No se pudieron obtener los detalles del préstamo');
        }
        
    } catch (error) {
        console.error('Error viewing loan details:', error);
        showError(error.message || 'Error al ver detalles del préstamo');
    } finally {
        hideLoading();
    }
}

// Editar préstamo
async function editLoan(loanId) {
    try {
        console.log(`📝 Editando préstamo: ${loanId}`);
        
        // Por ahora mostrar un alert simple
        // En el futuro se puede implementar un modal de edición
        alert(`Editar préstamo ID: ${loanId}\n\nEsta funcionalidad se implementará próximamente.`);
        
    } catch (error) {
        console.error('Error editing loan:', error);
        showError('Error al editar préstamo');
    }
}

// Eliminar préstamo
async function deleteLoan(loanId) {
    try {
        console.log(`🗑️ Eliminando préstamo: ${loanId}`);
        
        if (!confirm('¿Está seguro de que desea eliminar este préstamo?\n\nEsta acción no se puede deshacer.')) {
            return;
        }
        
        // Por ahora mostrar un alert simple
        // En el futuro se puede implementar la eliminación real
        alert(`Eliminar préstamo ID: ${loanId}\n\nEsta funcionalidad se implementará próximamente.`);
        
    } catch (error) {
        console.error('Error deleting loan:', error);
        showError('Error al eliminar préstamo');
    }
}


// Hacer funciones de acciones disponibles globalmente
window.approveLoan = approveLoan;
window.rejectLoan = rejectLoan;
window.disburseLoan = disburseLoan;
window.viewLoanDetails = viewLoanDetails;
window.editLoan = editLoan;
window.deleteLoan = deleteLoan;
