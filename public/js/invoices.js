// Invoices Management

let currentInvoices = [];
let currentInvoicesPage = 1;
let totalInvoicesPages = 1;
let currentInvoicesFilters = {};

// Initialize invoices page
async function initInvoices() {
    try {
        console.log('📄 Initializing invoices page...');
        showLoading();

        // Render invoices content
        renderInvoicesContent();

        // Load invoices data
        await loadInvoices();

        // Setup event listeners
        setupInvoicesEventListeners();

        hideLoading();
    } catch (error) {
        console.error('❌ Error initializing invoices:', error);
        showError('Error al cargar la página de facturas');
        hideLoading();
    }
}

// Render invoices page content
function renderInvoicesContent() {
    const contentArea = document.getElementById('contentArea');

    contentArea.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-file-earmark-text"></i> Gestión de Facturas</h2>
            <div class="btn-group">
                <button class="btn btn-primary" onclick="showCreateStudentInvoiceModal()">
                    <i class="bi bi-plus"></i> Factura Estudiante
                </button>
                <button class="btn btn-success" onclick="showCreateExternalInvoiceModal()">
                    <i class="bi bi-plus"></i> Factura Externa
                </button>
                <button class="btn btn-warning" onclick="showCreateSupplierInvoiceModal()">
                    <i class="bi bi-plus"></i> Factura Proveedor
                </button>
            </div>
        </div>

        <!-- Invoice Type Tabs -->
        <ul class="nav nav-tabs mb-4" id="invoiceTypeTabs">
            <li class="nav-item">
                <a class="nav-link active" id="outgoing-tab" data-bs-toggle="tab" href="#outgoing" onclick="switchInvoiceType('OUTGOING')">
                    <i class="bi bi-arrow-up-circle"></i> Facturas Emitidas
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="incoming-tab" data-bs-toggle="tab" href="#incoming" onclick="switchInvoiceType('INCOMING')">
                    <i class="bi bi-arrow-down-circle"></i> Facturas Recibidas
                </a>
            </li>
        </ul>

        <!-- Filters -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3">
                        <input type="text" class="form-control" id="invoiceSearch" placeholder="Buscar por número o cliente...">
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="invoiceStatusFilter">
                            <option value="">Todos los estados</option>
                            <option value="PENDING">Pendiente</option>
                            <option value="PAID">Pagada</option>
                            <option value="PARTIAL">Parcial</option>
                            <option value="OVERDUE">Vencida</option>
                            <option value="CANCELLED">Cancelada</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="invoiceConceptFilter">
                            <option value="">Todos los conceptos</option>
                            <option value="TUITION">Matrícula</option>
                            <option value="MONTHLY">Mensualidad</option>
                            <option value="EVENT">Evento</option>
                            <option value="UNIFORM">Uniforme</option>
                            <option value="BOOKS">Libros</option>
                            <option value="TRANSPORT">Transporte</option>
                            <option value="CAFETERIA">Cafetería</option>
                            <option value="OTHER">Otro</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <input type="date" class="form-control" id="invoiceDateFrom" placeholder="Desde">
                    </div>
                    <div class="col-md-2">
                        <input type="date" class="form-control" id="invoiceDateTo" placeholder="Hasta">
                    </div>
                    <div class="col-md-1">
                        <button class="btn btn-outline-primary w-100" onclick="searchInvoices()">
                            <i class="bi bi-search"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Invoices Table -->
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Concepto</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Vencimiento</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="invoicesTableBody">
                            <tr>
                                <td colspan="8" class="text-center">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Cargando...</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <nav aria-label="Invoices pagination">
                    <ul class="pagination justify-content-center" id="invoicesPagination">
                    </ul>
                </nav>
            </div>
        </div>
    `;
}

// Load invoices data
async function loadInvoices(page = 1, filters = {}) {
    try {
        showLoading();

        const params = {
            page,
            limit: 20,
            ...filters
        };

        const response = await api.getInvoices(params);

        currentInvoices = response.invoices || [];
        currentInvoicesPage = response.pagination?.page || 1;
        totalInvoicesPages = response.pagination?.pages || 1;
        currentInvoicesFilters = filters;

        updateInvoicesTable();
        updateInvoicesPagination();

    } catch (error) {
        console.error('Error loading invoices:', error);
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Update invoices table
function updateInvoicesTable() {
    const tbody = document.getElementById('invoicesTableBody');
    if (!tbody) return;

    if (currentInvoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No se encontraron facturas</td></tr>';
        return;
    }

    tbody.innerHTML = currentInvoices.map(invoice => `
        <tr>
            <td><strong>${invoice.invoiceNumber}</strong></td>
            <td>${formatDate(invoice.date)}</td>
            <td>
                ${invoice.student ?
            `${invoice.student.firstName} ${invoice.student.lastName}` :
            (invoice.clientName || 'Cliente Externo')
        }
            </td>
            <td>
                <span class="badge bg-info">${getConceptText(invoice.concept)}</span>
            </td>
            <td class="text-end"><strong>$${formatCurrency(invoice.total)}</strong></td>
            <td>
                <span class="badge ${getInvoiceStatusClass(invoice.status)}">${getInvoiceStatusText(invoice.status)}</span>
            </td>
            <td>${formatDate(invoice.dueDate)}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewInvoice('${invoice.id}')" title="Ver">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-success" onclick="downloadInvoice('${invoice.id}')" title="Descargar">
                        <i class="bi bi-download"></i>
                    </button>
                    ${invoice.status === 'PENDING' || invoice.status === 'PARTIAL' ? `
                        <button class="btn btn-outline-warning" onclick="editInvoice('${invoice.id}')" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                    ` : ''}
                    ${invoice.status !== 'CANCELLED' ? `
                        <button class="btn btn-outline-danger" onclick="cancelInvoice('${invoice.id}')" title="Cancelar">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Show create external invoice modal
async function showCreateExternalInvoiceModal() {
    try {
        const result = await Swal.fire({
            title: 'Nueva Factura Externa',
            html: `
                <div class="text-start">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="externalClientName" class="form-label">Nombre del Cliente:</label>
                                <input type="text" class="form-control" id="externalClientName" required>
                            </div>
                            <div class="mb-3">
                                <label for="externalClientDocument" class="form-label">Documento/NIT:</label>
                                <input type="text" class="form-control" id="externalClientDocument" required>
                            </div>
                            <div class="mb-3">
                                <label for="externalClientEmail" class="form-label">Email (opcional):</label>
                                <input type="email" class="form-control" id="externalClientEmail">
                            </div>
                            <div class="mb-3">
                                <label for="externalClientPhone" class="form-label">Teléfono (opcional):</label>
                                <input type="tel" class="form-control" id="externalClientPhone">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="externalInvoiceConcept" class="form-label">Concepto:</label>
                                <select class="form-select" id="externalInvoiceConcept" required>
                                    <option value="">Seleccionar concepto</option>
                                    <option value="UNIFORM">Uniforme</option>
                                    <option value="BOOKS">Libros</option>
                                    <option value="TRANSPORT">Transporte</option>
                                    <option value="CAFETERIA">Cafetería</option>
                                    <option value="OTHER">Otro</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="externalInvoiceDueDate" class="form-label">Fecha de Vencimiento:</label>
                                <input type="date" class="form-control" id="externalInvoiceDueDate" required>
                            </div>
                            <div class="mb-3">
                                <label for="externalInvoiceObservations" class="form-label">Observaciones:</label>
                                <textarea class="form-control" id="externalInvoiceObservations" rows="2"></textarea>
                            </div>
                        </div>
                    </div>
                    
                    <hr>
                    <h6>Items de la Factura:</h6>
                    <div id="externalInvoiceItems">
                        <div class="row invoice-item mb-2">
                            <div class="col-md-5">
                                <input type="text" class="form-control item-description" placeholder="Descripción" required>
                            </div>
                            <div class="col-md-2">
                                <input type="number" class="form-control item-quantity" placeholder="Cant." min="1" value="1" required>
                            </div>
                            <div class="col-md-3">
                                <input type="number" class="form-control item-price" placeholder="Precio Unit." min="0" step="0.01" required>
                            </div>
                            <div class="col-md-2">
                                <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeInvoiceItem(this)">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-outline-primary btn-sm" onclick="addInvoiceItem()">
                        <i class="bi bi-plus"></i> Agregar Item
                    </button>
                    
                    <div class="alert alert-info mt-3">
                        <strong>Total: $<span id="externalInvoiceTotal">0.00</span></strong>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Crear Factura',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745',
            width: '900px',
            didOpen: () => {
                // Set default due date (30 days from now)
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 30);
                document.getElementById('externalInvoiceDueDate').value = dueDate.toISOString().split('T')[0];

                // Add event listeners for total calculation
                updateExternalInvoiceTotal();
                document.getElementById('externalInvoiceItems').addEventListener('input', updateExternalInvoiceTotal);
            },
            preConfirm: () => {
                const clientName = document.getElementById('externalClientName').value;
                const clientDocument = document.getElementById('externalClientDocument').value;
                const concept = document.getElementById('externalInvoiceConcept').value;
                const dueDate = document.getElementById('externalInvoiceDueDate').value;

                if (!clientName || !clientDocument || !concept || !dueDate) {
                    Swal.showValidationMessage('Todos los campos obligatorios deben ser completados');
                    return false;
                }

                const items = [];
                document.querySelectorAll('.invoice-item').forEach(item => {
                    const description = item.querySelector('.item-description').value;
                    const quantity = parseInt(item.querySelector('.item-quantity').value);
                    const price = parseFloat(item.querySelector('.item-price').value);

                    if (description && quantity && price) {
                        items.push({ description, quantity, unitPrice: price });
                    }
                });

                if (items.length === 0) {
                    Swal.showValidationMessage('Debe agregar al menos un item a la factura');
                    return false;
                }

                return {
                    clientName,
                    clientDocument,
                    clientEmail: document.getElementById('externalClientEmail').value,
                    clientPhone: document.getElementById('externalClientPhone').value,
                    concept,
                    dueDate,
                    observations: document.getElementById('externalInvoiceObservations').value,
                    items
                };
            }
        });

        if (result.isConfirmed) {
            showLoading();

            // Create external invoice
            const invoiceData = {
                ...result.value,
                isExternal: true
            };

            await api.createExternalInvoice(invoiceData);

            showSuccess('Factura externa creada exitosamente');

            // Reload invoices
            await loadInvoices();

            hideLoading();
        }
    } catch (error) {
        console.error('❌ Error creating external invoice:', error);
        showError('Error al crear factura externa: ' + error.message);
        hideLoading();
    }
}

// Add invoice item
function addInvoiceItem() {
    const container = document.getElementById('externalInvoiceItems');
    const newItem = document.createElement('div');
    newItem.className = 'row invoice-item mb-2';
    newItem.innerHTML = `
        <div class="col-md-5">
            <input type="text" class="form-control item-description" placeholder="Descripción" required>
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control item-quantity" placeholder="Cant." min="1" value="1" required>
        </div>
        <div class="col-md-3">
            <input type="number" class="form-control item-price" placeholder="Precio Unit." min="0" step="0.01" required>
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeInvoiceItem(this)">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    container.appendChild(newItem);
    updateExternalInvoiceTotal();
}

// Remove invoice item
function removeInvoiceItem(button) {
    const items = document.querySelectorAll('.invoice-item');
    if (items.length > 1) {
        button.closest('.invoice-item').remove();
        updateExternalInvoiceTotal();
    }
}

// Update external invoice total
function updateExternalInvoiceTotal() {
    let total = 0;
    document.querySelectorAll('.invoice-item').forEach(item => {
        const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        total += quantity * price;
    });

    const totalElement = document.getElementById('externalInvoiceTotal');
    if (totalElement) {
        totalElement.textContent = formatCurrency(total);
    }
}

// Helper functions
function getConceptText(concept) {
    const concepts = {
        'TUITION': 'Matrícula',
        'MONTHLY': 'Mensualidad',
        'EVENT': 'Evento',
        'UNIFORM': 'Uniforme',
        'BOOKS': 'Libros',
        'TRANSPORT': 'Transporte',
        'CAFETERIA': 'Cafetería',
        'OTHER': 'Otro'
    };
    return concepts[concept] || concept;
}

function getInvoiceStatusClass(status) {
    const classes = {
        'PENDING': 'bg-warning',
        'PAID': 'bg-success',
        'PARTIAL': 'bg-info',
        'OVERDUE': 'bg-danger',
        'CANCELLED': 'bg-secondary'
    };
    return classes[status] || 'bg-secondary';
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

// Setup event listeners
function setupInvoicesEventListeners() {
    const searchInput = document.getElementById('invoiceSearch');
    const statusFilter = document.getElementById('invoiceStatusFilter');
    const conceptFilter = document.getElementById('invoiceConceptFilter');
    const dateFromFilter = document.getElementById('invoiceDateFrom');
    const dateToFilter = document.getElementById('invoiceDateTo');

    if (searchInput) searchInput.addEventListener('input', debounce(searchInvoices, 300));
    if (statusFilter) statusFilter.addEventListener('change', searchInvoices);
    if (conceptFilter) conceptFilter.addEventListener('change', searchInvoices);
    if (dateFromFilter) dateFromFilter.addEventListener('change', searchInvoices);
    if (dateToFilter) dateToFilter.addEventListener('change', searchInvoices);
}

// Search invoices
function searchInvoices() {
    const filters = {
        search: document.getElementById('invoiceSearch')?.value || '',
        status: document.getElementById('invoiceStatusFilter')?.value || '',
        concept: document.getElementById('invoiceConceptFilter')?.value || '',
        startDate: document.getElementById('invoiceDateFrom')?.value || '',
        endDate: document.getElementById('invoiceDateTo')?.value || ''
    };

    loadInvoices(1, filters);
}

// Pagination and other functions
function updateInvoicesPagination() {
    const pagination = document.getElementById('invoicesPagination');
    if (!pagination) return;

    let paginationHtml = '';

    // Previous button
    if (currentInvoicesPage > 1) {
        paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="loadInvoicesPage(${currentInvoicesPage - 1})">Anterior</a></li>`;
    }

    // Page numbers
    for (let i = Math.max(1, currentInvoicesPage - 2); i <= Math.min(totalInvoicesPages, currentInvoicesPage + 2); i++) {
        paginationHtml += `<li class="page-item ${i === currentInvoicesPage ? 'active' : ''}">
            <a class="page-link" href="#" onclick="loadInvoicesPage(${i})">${i}</a>
        </li>`;
    }

    // Next button
    if (currentInvoicesPage < totalInvoicesPages) {
        paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="loadInvoicesPage(${currentInvoicesPage + 1})">Siguiente</a></li>`;
    }

    pagination.innerHTML = paginationHtml;
}

function loadInvoicesPage(page) {
    loadInvoices(page, currentInvoicesFilters);
}

// Placeholder functions for invoice actions
function viewInvoice(invoiceId) {
    console.log('View invoice:', invoiceId);
    showNotification('Función de vista en desarrollo', 'info');
}

function downloadInvoice(invoiceId) {
    console.log('Download invoice:', invoiceId);
    showNotification('Función de descarga en desarrollo', 'info');
}

function editInvoice(invoiceId) {
    console.log('Edit invoice:', invoiceId);
    showNotification('Función de edición en desarrollo', 'info');
}

function cancelInvoice(invoiceId) {
    console.log('Cancel invoice:', invoiceId);
    showNotification('Función de cancelación en desarrollo', 'info');
}

function showCreateStudentInvoiceModal() {
    showNotification('Use el modal de eventos del estudiante para generar facturas', 'info');
}

// Utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for global access
window.initInvoices = initInvoices;
window.loadInvoices = loadInvoices;
window.showCreateExternalInvoiceModal = showCreateExternalInvoiceModal;
window.showCreateStudentInvoiceModal = showCreateStudentInvoiceModal;
window.addInvoiceItem = addInvoiceItem;
window.removeInvoiceItem = removeInvoiceItem;
window.searchInvoices = searchInvoices;
window.loadInvoicesPage = loadInvoicesPage;
window.viewInvoice = viewInvoice;
window.downloadInvoice = downloadInvoice;
window.editInvoice = editInvoice;
window.cancelInvoice = cancelInvoice;

// ================================
// SUPPLIER INVOICES (INCOMING)
// ================================

let currentInvoiceType = 'OUTGOING'; // Default to outgoing invoices

// Switch between invoice types
function switchInvoiceType(type) {
    currentInvoiceType = type;
    currentInvoicesFilters.type = type;
    loadInvoices(1, currentInvoicesFilters);

    // Update UI
    const outgoingTab = document.getElementById('outgoing-tab');
    const incomingTab = document.getElementById('incoming-tab');

    if (type === 'OUTGOING') {
        outgoingTab.classList.add('active');
        incomingTab.classList.remove('active');
    } else {
        incomingTab.classList.add('active');
        outgoingTab.classList.remove('active');
    }
}

// Show create supplier invoice modal
function showCreateSupplierInvoiceModal() {
    const modalElement = document.getElementById('supplierInvoiceModal') || createSupplierInvoiceModal();
    const modal = new bootstrap.Modal(modalElement);

    // Handle accessibility properly
    modalElement.addEventListener('shown.bs.modal', function () {
        // Remove aria-hidden when modal is shown
        modalElement.removeAttribute('aria-hidden');
        // Focus on first input for better accessibility
        const firstInput = modalElement.querySelector('input:not([type="hidden"])');
        if (firstInput) {
            firstInput.focus();
        }
    });

    modalElement.addEventListener('hidden.bs.modal', function () {
        // Add aria-hidden back when modal is hidden
        modalElement.setAttribute('aria-hidden', 'true');
    });

    modal.show();
}

// Create supplier invoice modal
function createSupplierInvoiceModal() {
    const modalHtml = `
        <div class="modal fade" id="supplierInvoiceModal" tabindex="-1" aria-labelledby="supplierInvoiceModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="supplierInvoiceModalLabel">
                            <i class="bi bi-receipt"></i> Registrar Factura de Proveedor
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <form id="supplierInvoiceForm">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Número de Factura *</label>
                                    <input type="text" class="form-control" id="supplierInvoiceNumber" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Fecha de Factura *</label>
                                    <input type="date" class="form-control" id="supplierInvoiceDate" required>
                                </div>
                            </div>

                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Fecha de Vencimiento *</label>
                                    <input type="date" class="form-control" id="supplierInvoiceDueDate" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Concepto *</label>
                                    <select class="form-select" id="supplierInvoiceConcept" required>
                                        <option value="">Seleccionar concepto</option>
                                        <option value="OFFICE_SUPPLIES">Útiles de Oficina</option>
                                        <option value="MAINTENANCE">Mantenimiento</option>
                                        <option value="UTILITIES">Servicios Públicos</option>
                                        <option value="PROFESSIONAL_SERVICES">Servicios Profesionales</option>
                                        <option value="EQUIPMENT">Equipos</option>
                                        <option value="CLEANING_SUPPLIES">Insumos de Aseo</option>
                                        <option value="FOOD_SUPPLIES">Insumos de Cafetería</option>
                                        <option value="EDUCATIONAL_MATERIALS">Material Educativo</option>
                                        <option value="TECHNOLOGY">Tecnología</option>
                                        <option value="INSURANCE">Seguros</option>
                                        <option value="RENT">Arrendamiento</option>
                                        <option value="OTHER">Otro</option>
                                    </select>
                                </div>
                            </div>

                            <div class="card mb-3">
                                <div class="card-header">
                                    <h6 class="mb-0">Información del Proveedor</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label class="form-label">Nombre del Proveedor *</label>
                                            <input type="text" class="form-control" id="supplierName" required>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">NIT/Documento</label>
                                            <input type="text" class="form-control" id="supplierDocument">
                                        </div>
                                    </div>
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label class="form-label">Email</label>
                                            <input type="email" class="form-control" id="supplierEmail">
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Teléfono</label>
                                            <input type="text" class="form-control" id="supplierPhone">
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Dirección</label>
                                        <input type="text" class="form-control" id="supplierAddress">
                                    </div>
                                </div>
                            </div>

                            <div class="card mb-3">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0">Detalles de la Factura</h6>
                                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="addSupplierInvoiceItem()">
                                        <i class="bi bi-plus"></i> Agregar Item
                                    </button>
                                </div>
                                <div class="card-body">
                                    <div id="supplierInvoiceItems">
                                        <div class="row mb-2 supplier-invoice-item">
                                            <div class="col-md-5">
                                                <input type="text" class="form-control item-description" placeholder="Descripción" required>
                                            </div>
                                            <div class="col-md-2">
                                                <input type="number" class="form-control item-quantity" placeholder="Cant." min="1" value="1" required>
                                            </div>
                                            <div class="col-md-3">
                                                <input type="number" class="form-control item-price" placeholder="Precio Unit." min="0" step="0.01" required>
                                            </div>
                                            <div class="col-md-2">
                                                <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeSupplierInvoiceItem(this)">
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row mt-3">
                                        <div class="col-md-8"></div>
                                        <div class="col-md-4">
                                            <div class="d-flex justify-content-between">
                                                <strong>Total: </strong>
                                                <strong id="supplierInvoiceTotal">$0</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Observaciones</label>
                                <textarea class="form-control" id="supplierInvoiceObservations" rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="saveSupplierInvoice()">
                            <i class="bi bi-save"></i> Guardar Factura
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Setup event listeners for total calculation
    document.addEventListener('input', function (e) {
        if (e.target.matches('#supplierInvoiceItems .item-quantity, #supplierInvoiceItems .item-price')) {
            updateSupplierInvoiceTotal();
        }
    });

    return document.getElementById('supplierInvoiceModal');
}

// Add supplier invoice item
function addSupplierInvoiceItem() {
    const container = document.getElementById('supplierInvoiceItems');
    const newItem = document.createElement('div');
    newItem.className = 'row mb-2 supplier-invoice-item';
    newItem.innerHTML = `
        <div class="col-md-5">
            <input type="text" class="form-control item-description" placeholder="Descripción" required>
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control item-quantity" placeholder="Cant." min="1" value="1" required>
        </div>
        <div class="col-md-3">
            <input type="number" class="form-control item-price" placeholder="Precio Unit." min="0" step="0.01" required>
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeSupplierInvoiceItem(this)">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    container.appendChild(newItem);
    updateSupplierInvoiceTotal();
}

// Remove supplier invoice item
function removeSupplierInvoiceItem(button) {
    const items = document.querySelectorAll('.supplier-invoice-item');
    if (items.length > 1) {
        button.closest('.supplier-invoice-item').remove();
        updateSupplierInvoiceTotal();
    }
}

// Update supplier invoice total
function updateSupplierInvoiceTotal() {
    let total = 0;
    document.querySelectorAll('.supplier-invoice-item').forEach(item => {
        const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        total += quantity * price;
    });

    const totalElement = document.getElementById('supplierInvoiceTotal');
    if (totalElement) {
        totalElement.textContent = formatCurrency(total);
    }
}

// Save supplier invoice
async function saveSupplierInvoice() {
    try {
        const form = document.getElementById('supplierInvoiceForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        showLoading();

        // Collect invoice items
        const items = [];
        document.querySelectorAll('.supplier-invoice-item').forEach(item => {
            const description = item.querySelector('.item-description').value;
            const quantity = parseInt(item.querySelector('.item-quantity').value);
            const unitPrice = parseFloat(item.querySelector('.item-price').value);

            if (description && quantity && unitPrice) {
                items.push({
                    description,
                    quantity,
                    unitPrice,
                    total: quantity * unitPrice
                });
            }
        });

        if (items.length === 0) {
            showError('Debe agregar al menos un item a la factura');
            hideLoading();
            return;
        }

        const total = items.reduce((sum, item) => sum + item.total, 0);

        const invoiceData = {
            type: 'INCOMING',
            invoiceNumber: document.getElementById('supplierInvoiceNumber').value,
            date: document.getElementById('supplierInvoiceDate').value,
            dueDate: document.getElementById('supplierInvoiceDueDate').value,
            concept: document.getElementById('supplierInvoiceConcept').value,
            supplierName: document.getElementById('supplierName').value,
            supplierDocument: document.getElementById('supplierDocument').value,
            supplierEmail: document.getElementById('supplierEmail').value,
            supplierPhone: document.getElementById('supplierPhone').value,
            supplierAddress: document.getElementById('supplierAddress').value,
            observations: document.getElementById('supplierInvoiceObservations').value,
            subtotal: total,
            tax: 0, // Can be calculated based on tax rules
            total: total,
            items: items
        };

        const response = await API.request('POST', '/api/invoices', invoiceData);

        showSuccess('Factura de proveedor registrada exitosamente');

        // Close modal and refresh list
        const modal = bootstrap.Modal.getInstance(document.getElementById('supplierInvoiceModal'));
        modal.hide();

        // Reset form
        form.reset();
        document.getElementById('supplierInvoiceItems').innerHTML = `
            <div class="row mb-2 supplier-invoice-item">
                <div class="col-md-5">
                    <input type="text" class="form-control item-description" placeholder="Descripción" required>
                </div>
                <div class="col-md-2">
                    <input type="number" class="form-control item-quantity" placeholder="Cant." min="1" value="1" required>
                </div>
                <div class="col-md-3">
                    <input type="number" class="form-control item-price" placeholder="Precio Unit." min="0" step="0.01" required>
                </div>
                <div class="col-md-2">
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeSupplierInvoiceItem(this)">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;

        // Reload invoices
        await loadInvoices();

        hideLoading();

    } catch (error) {
        console.error('Error saving supplier invoice:', error);
        showError('Error al guardar la factura de proveedor');
        hideLoading();
    }
}

// Update concept text function to include supplier concepts
function getConceptText(concept) {
    const concepts = {
        // Outgoing invoice concepts
        'TUITION': 'Matrícula',
        'MONTHLY': 'Mensualidad',
        'EVENT': 'Evento',
        'UNIFORM': 'Uniforme',
        'BOOKS': 'Libros',
        'TRANSPORT': 'Transporte',
        'CAFETERIA': 'Cafetería',

        // Incoming invoice concepts (supplier)
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

        'OTHER': 'Otro'
    };
    return concepts[concept] || concept;
}
// 
// Export supplier invoice functions
window.switchInvoiceType = switchInvoiceType;
window.showCreateSupplierInvoiceModal = showCreateSupplierInvoiceModal;
window.addSupplierInvoiceItem = addSupplierInvoiceItem;
window.removeSupplierInvoiceItem = removeSupplierInvoiceItem;
window.updateSupplierInvoiceTotal = updateSupplierInvoiceTotal;
window.saveSupplierInvoice = saveSupplierInvoice;