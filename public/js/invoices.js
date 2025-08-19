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

        // Create modals
        createSupplierInvoiceModal();
        // External invoice modal uses SweetAlert, no need to create

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
                    <button class="btn btn-outline-primary" onclick="viewInvoiceDetails('${invoice.id}')" title="Ver Detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-success" onclick="downloadInvoice('${invoice.id}')" title="Descargar PDF">
                        <i class="bi bi-download"></i>
                    </button>
                    ${invoice.status === 'PENDING' ? `
                        <button class="btn btn-outline-warning" onclick="editInvoiceModal('${invoice.id}')" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="cancelInvoiceModal('${invoice.id}')" title="Cancelar">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    ` : ''}
                    ${invoice.status === 'PAID' ? `
                        <button class="btn btn-outline-danger" onclick="voidInvoiceModal('${invoice.id}')" title="Anular Factura">
                            <i class="bi bi-exclamation-triangle"></i>
                        </button>
                    ` : ''}
                    ${invoice.status === 'PARTIAL' ? `
                        <button class="btn btn-outline-info" onclick="viewPaymentsModal('${invoice.id}')" title="Ver Pagos">
                            <i class="bi bi-credit-card"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="cancelInvoiceModal('${invoice.id}')" title="Cancelar">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    ` : ''}
                    ${invoice.status === 'CANCELLED' ? `
                        <span class="badge bg-secondary">Cancelada</span>
                    ` : ''}
                    ${invoice.status === 'VOIDED' ? `
                        <span class="badge bg-danger">Anulada</span>
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
                                <label for="externalInvoiceFund" class="form-label">💰 Fondo para el Pago:</label>
                                <select class="form-select" id="externalInvoiceFund" required>
                                    <option value="">Cargando fondos...</option>
                                </select>
                                <small class="form-text text-muted">Selecciona de qué fondo se cobrará esta factura</small>
                            </div>
                            <div id="externalFundBalanceInfo" class="alert alert-info d-none mb-3">
                                <small><strong>Saldo disponible:</strong> <span id="externalSelectedFundBalance">$0</span></small>
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
            didOpen: async () => {
                // Set default due date (30 days from now)
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 30);
                document.getElementById('externalInvoiceDueDate').value = dueDate.toISOString().split('T')[0];

                // Add event listeners for total calculation
                updateExternalInvoiceTotal();
                document.getElementById('externalInvoiceItems').addEventListener('input', updateExternalInvoiceTotal);

                // Load funds for external invoice
                await loadFundsForExternalInvoice();
            },
            preConfirm: () => {
                const clientName = document.getElementById('externalClientName').value;
                const clientDocument = document.getElementById('externalClientDocument').value;
                const concept = document.getElementById('externalInvoiceConcept').value;
                const dueDate = document.getElementById('externalInvoiceDueDate').value;
                const fundId = document.getElementById('externalInvoiceFund').value;

                if (!clientName || !clientDocument || !concept || !dueDate || !fundId) {
                    Swal.showValidationMessage('Todos los campos obligatorios deben ser completados, incluyendo el fondo');
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
                    fundId,
                    items
                };
            }
        });

        if (result.isConfirmed) {
            showLoading();

            // Calculate total from items
            const total = result.value.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
            
            // Create external invoice
            const invoiceData = {
                ...result.value,
                isExternal: true,
                type: 'OUTGOING',
                subtotal: total,
                tax: 0,
                total: total
            };

            // Procesar factura externa con fondo seleccionado
            console.log('💾 Procesando factura externa con fondo:', invoiceData.fundId);
            await processExternalInvoiceWithSelectedFund(invoiceData, invoiceData.fundId);

            // Dashboard notification is handled in processExternalInvoiceWithSelectedFund

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

async function downloadInvoice(invoiceId) {
    try {
        console.log('📥 Iniciando descarga de factura:', invoiceId);
        showLoading();

        // Descargar PDF de la factura
        const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }

        // Verificar que la respuesta es un PDF
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/pdf')) {
            throw new Error('La respuesta no es un archivo PDF válido');
        }

        // Crear blob y descargar
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Crear elemento de descarga
        const a = document.createElement('a');
        a.href = url;
        a.download = `Factura_${invoiceId}.pdf`;
        a.style.display = 'none';
        
        // Agregar al DOM, hacer click y remover
        document.body.appendChild(a);
        a.click();
        
        // Limpiar después de un breve delay
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            if (document.body.contains(a)) {
                document.body.removeChild(a);
            }
        }, 100);

        showSuccess('Factura descargada exitosamente');
        console.log('✅ Factura descargada exitosamente');

    } catch (error) {
        console.error('❌ Error downloading invoice:', error);
        showError('Error al descargar la factura: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ================================
// NUEVAS FUNCIONALIDADES: VER, EDITAR, CANCELAR
// ================================

// Ver detalles completos de la factura
async function viewInvoiceDetails(invoiceId) {
    try {
        console.log('👁️ Viewing invoice details:', invoiceId);
        showLoading();

        const response = await fetch(`/api/invoices/${invoiceId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        const invoice = data.invoice || data;

        // Mostrar modal con detalles completos
        await Swal.fire({
            title: `<i class="bi bi-file-earmark-text"></i> ${invoice.invoiceNumber}`,
            html: `
                <div class="text-start" style="font-size: 0.9em;">
                    <div class="row mb-2">
                        <div class="col-6">
                            <strong class="text-primary">Cliente:</strong> ${invoice.student ? 
                                `${invoice.student.firstName} ${invoice.student.lastName}` : 
                                (invoice.clientName || 'Cliente Externo')}<br>
                            <strong>Doc:</strong> ${invoice.student?.document || invoice.clientDocument || 'N/A'}<br>
                            ${invoice.student ? `<strong>Grado:</strong> ${invoice.student.grade?.name || 'N/A'} - ${invoice.student.group?.name || 'N/A'}` : ''}
                        </div>
                        <div class="col-6">
                            <strong class="text-success">Estado:</strong> 
                            <span class="badge ${getInvoiceStatusClass(invoice.status)}">${getInvoiceStatusText(invoice.status)}</span><br>
                            <strong>Concepto:</strong> <span class="badge bg-info">${getConceptText(invoice.concept)}</span><br>
                            <strong>Vence:</strong> ${invoice.formattedDates?.dueDate || formatDate(invoice.dueDate)}
                        </div>
                    </div>

                    <div class="table-responsive mb-2">
                        <table class="table table-sm table-bordered">
                            <thead class="table-light">
                                <tr style="font-size: 0.8em;">
                                    <th>Descripción</th>
                                    <th width="60">Cant.</th>
                                    <th width="80">P. Unit.</th>
                                    <th width="80">Total</th>
                                </tr>
                            </thead>
                            <tbody style="font-size: 0.8em;">
                                ${invoice.items.map(item => `
                                    <tr>
                                        <td>${item.description}</td>
                                        <td class="text-center">${item.quantity}</td>
                                        <td class="text-end">${formatCurrency(item.unitPrice)}</td>
                                        <td class="text-end">${formatCurrency(item.total)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="row mb-2">
                        <div class="col-6">
                            <div class="bg-light p-2 rounded">
                                <strong>Subtotal:</strong> ${formatCurrency(invoice.subtotal)}<br>
                                <strong>IVA:</strong> ${formatCurrency(invoice.tax || 0)}<br>
                                <strong class="text-primary">Total:</strong> <strong class="text-primary">${formatCurrency(invoice.total)}</strong>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="bg-light p-2 rounded">
                                <strong class="text-success">Pagado:</strong> ${formatCurrency(invoice.totalPaid || 0)}<br>
                                <strong class="text-danger">Pendiente:</strong> ${formatCurrency(invoice.pendingAmount || invoice.total)}<br>
                                ${invoice.payments && invoice.payments.length > 0 ? `<small class="text-muted">${invoice.payments.length} pago(s)</small>` : '<small class="text-muted">Sin pagos</small>'}
                            </div>
                        </div>
                    </div>

                    ${invoice.observations ? `
                        <div class="alert alert-info py-1 mb-2" style="font-size: 0.8em;">
                            <strong>Observaciones:</strong> ${invoice.observations}
                        </div>
                    ` : ''}

                    <div class="d-flex justify-content-center gap-2">
                        <button class="btn btn-success btn-sm" onclick="downloadInvoice('${invoice.id}')">
                            <i class="bi bi-download"></i> PDF
                        </button>
                        ${invoice.status === 'PENDING' ? `
                            <button class="btn btn-warning btn-sm" onclick="Swal.close(); editInvoiceModal('${invoice.id}')">
                                <i class="bi bi-pencil"></i> Editar
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="Swal.close(); cancelInvoiceModal('${invoice.id}')">
                                <i class="bi bi-x-circle"></i> Cancelar
                            </button>
                        ` : ''}
                    </div>
                </div>
            `,
            width: '600px',
            showConfirmButton: false,
            showCloseButton: true
        });

        console.log('✅ Invoice details displayed successfully');

    } catch (error) {
        console.error('❌ Error viewing invoice details:', error);
        showError('Error al cargar los detalles de la factura: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Modal para editar factura
async function editInvoiceModal(invoiceId) {
    try {
        console.log('✏️ Opening edit modal for invoice:', invoiceId);
        showLoading();

        // Obtener datos actuales de la factura
        const response = await fetch(`/api/invoices/${invoiceId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        const invoice = data.invoice || data;

        // Verificar permisos
        if (!invoice.permissions?.canEdit) {
            showError('No se puede editar esta factura');
            return;
        }

        hideLoading();

        const result = await Swal.fire({
            title: `<i class="bi bi-pencil"></i> Editar Factura ${invoice.invoiceNumber}`,
            html: `
                <div class="text-start">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle"></i> Solo se pueden editar facturas pendientes sin pagos asociados.
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Fecha de Vencimiento:</label>
                            <input type="date" class="form-control" id="editDueDate" value="${invoice.dueDate.split('T')[0]}">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Concepto:</label>
                            <select class="form-select" id="editConcept">
                                <option value="TUITION" ${invoice.concept === 'TUITION' ? 'selected' : ''}>Matrícula</option>
                                <option value="MONTHLY" ${invoice.concept === 'MONTHLY' ? 'selected' : ''}>Mensualidad</option>
                                <option value="EVENT" ${invoice.concept === 'EVENT' ? 'selected' : ''}>Evento</option>
                                <option value="UNIFORM" ${invoice.concept === 'UNIFORM' ? 'selected' : ''}>Uniforme</option>
                                <option value="BOOKS" ${invoice.concept === 'BOOKS' ? 'selected' : ''}>Libros</option>
                                <option value="TRANSPORT" ${invoice.concept === 'TRANSPORT' ? 'selected' : ''}>Transporte</option>
                                <option value="CAFETERIA" ${invoice.concept === 'CAFETERIA' ? 'selected' : ''}>Cafetería</option>
                                <option value="OTHER" ${invoice.concept === 'OTHER' ? 'selected' : ''}>Otro</option>
                            </select>
                        </div>
                    </div>

                    <h6>Items de la Factura:</h6>
                    <div id="editInvoiceItems">
                        ${invoice.items.map((item, index) => `
                            <div class="row mb-2 edit-invoice-item">
                                <div class="col-md-5">
                                    <input type="text" class="form-control item-description" placeholder="Descripción" value="${item.description}" required>
                                </div>
                                <div class="col-md-2">
                                    <input type="number" class="form-control item-quantity" placeholder="Cant." min="1" value="${item.quantity}" required>
                                </div>
                                <div class="col-md-3">
                                    <input type="number" class="form-control item-price" placeholder="Precio Unit." min="0" step="0.01" value="${item.unitPrice}" required>
                                </div>
                                <div class="col-md-2">
                                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeEditInvoiceItem(this)">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <button type="button" class="btn btn-outline-primary btn-sm mb-3" onclick="addEditInvoiceItem()">
                        <i class="bi bi-plus"></i> Agregar Item
                    </button>

                    <div class="mb-3">
                        <label class="form-label">Observaciones:</label>
                        <textarea class="form-control" id="editObservations" rows="3">${invoice.observations || ''}</textarea>
                    </div>

                    <div class="text-end">
                        <strong>Total: <span id="editInvoiceTotal">${formatCurrency(invoice.total)}</span></strong>
                    </div>
                </div>
            `,
            width: '80%',
            showCancelButton: true,
            confirmButtonText: '<i class="bi bi-save"></i> Guardar Cambios',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745',
            preConfirm: () => {
                return saveInvoiceChanges(invoiceId);
            },
            didOpen: () => {
                // Setup event listeners for total calculation
                document.addEventListener('input', function (e) {
                    if (e.target.matches('#editInvoiceItems .item-quantity, #editInvoiceItems .item-price')) {
                        updateEditInvoiceTotal();
                    }
                });
                updateEditInvoiceTotal();
            }
        });

        if (result.isConfirmed) {
            showSuccess('Factura actualizada exitosamente');
            await loadInvoices(); // Recargar lista
            
            // Notificar cambio financiero para actualizar dashboard
            notifyFinancialChange('invoice_edited', {
                invoiceId: invoiceId,
                timestamp: new Date()
            });
            
            // Actualizar dashboard financiero si está disponible
            await updateFinancialDashboard('Factura editada');
        }

    } catch (error) {
        console.error('❌ Error opening edit modal:', error);
        showError('Error al abrir el editor de factura: ' + error.message);
        hideLoading();
    }
}

// Modal para cancelar factura
async function cancelInvoiceModal(invoiceId) {
    try {
        console.log('❌ Opening cancel modal for invoice:', invoiceId);

        const result = await Swal.fire({
            title: '<i class="bi bi-exclamation-triangle text-warning"></i> Cancelar Factura',
            html: `
                <div class="text-start">
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle"></i> 
                        <strong>¿Está seguro de que desea cancelar esta factura?</strong>
                    </div>
                    <p>Esta acción no se puede deshacer. La factura quedará marcada como cancelada.</p>
                    
                    <div class="mb-3">
                        <label class="form-label">Motivo de cancelación:</label>
                        <textarea class="form-control" id="cancelReason" rows="3" placeholder="Ingrese el motivo de la cancelación..." required></textarea>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '<i class="bi bi-x-circle"></i> Sí, Cancelar Factura',
            cancelButtonText: 'No, Mantener Factura',
            confirmButtonColor: '#dc3545',
            preConfirm: () => {
                const reason = document.getElementById('cancelReason').value.trim();
                if (!reason) {
                    Swal.showValidationMessage('Debe ingresar un motivo para la cancelación');
                    return false;
                }
                return reason;
            }
        });

        if (result.isConfirmed) {
            showLoading();

            const response = await fetch(`/api/invoices/${invoiceId}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reason: result.value
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            showSuccess('Factura cancelada exitosamente');
            await loadInvoices(); // Recargar lista
            
            // Notificar cambio financiero para actualizar dashboard
            notifyFinancialChange('invoice_cancelled', {
                invoiceId: invoiceId,
                reason: result.value,
                timestamp: new Date()
            });
            
            // Actualizar dashboard financiero si está disponible
            await updateFinancialDashboard('Factura cancelada');
            
            console.log('✅ Invoice cancelled successfully');
        }

    } catch (error) {
        console.error('❌ Error cancelling invoice:', error);
        showError('Error al cancelar la factura: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Funciones auxiliares para edición
function addEditInvoiceItem() {
    const container = document.getElementById('editInvoiceItems');
    const newItem = document.createElement('div');
    newItem.className = 'row mb-2 edit-invoice-item';
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
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeEditInvoiceItem(this)">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    container.appendChild(newItem);
    updateEditInvoiceTotal();
}

function removeEditInvoiceItem(button) {
    const items = document.querySelectorAll('.edit-invoice-item');
    if (items.length > 1) {
        button.closest('.edit-invoice-item').remove();
        updateEditInvoiceTotal();
    }
}

function updateEditInvoiceTotal() {
    let total = 0;
    document.querySelectorAll('.edit-invoice-item').forEach(item => {
        const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        total += quantity * price;
    });

    const totalElement = document.getElementById('editInvoiceTotal');
    if (totalElement) {
        totalElement.textContent = formatCurrency(total);
    }
}

async function saveInvoiceChanges(invoiceId) {
    try {
        console.log('💾 Saving invoice changes for:', invoiceId);
        
        // Recopilar datos del formulario
        const dueDate = document.getElementById('editDueDate')?.value;
        const concept = document.getElementById('editConcept')?.value;
        const observations = document.getElementById('editObservations')?.value;

        console.log('📋 Form data:', { dueDate, concept, observations });

        // Validar datos básicos
        if (!dueDate) {
            Swal.showValidationMessage('La fecha de vencimiento es requerida');
            return false;
        }

        if (!concept) {
            Swal.showValidationMessage('El concepto es requerido');
            return false;
        }

        // Recopilar items
        const items = [];
        const itemElements = document.querySelectorAll('.edit-invoice-item');
        
        console.log('📦 Processing items:', itemElements.length);
        
        itemElements.forEach((item, index) => {
            const description = item.querySelector('.item-description')?.value?.trim();
            const quantityValue = item.querySelector('.item-quantity')?.value;
            const priceValue = item.querySelector('.item-price')?.value;

            console.log(`📦 Item ${index + 1}:`, { description, quantityValue, priceValue });

            if (description && quantityValue && priceValue) {
                const quantity = parseInt(quantityValue);
                const unitPrice = parseFloat(priceValue);

                if (quantity > 0 && unitPrice >= 0) {
                    items.push({
                        description,
                        quantity,
                        unitPrice
                    });
                } else {
                    console.warn(`⚠️ Invalid item ${index + 1}: quantity=${quantity}, price=${unitPrice}`);
                }
            } else {
                console.warn(`⚠️ Incomplete item ${index + 1}:`, { description, quantityValue, priceValue });
            }
        });

        console.log('📦 Final items:', items);

        if (items.length === 0) {
            Swal.showValidationMessage('Debe agregar al menos un item válido a la factura');
            return false;
        }

        // Preparar datos para enviar
        const updateData = {
            dueDate,
            concept,
            observations: observations || '',
            items
        };

        console.log('📤 Sending update data:', updateData);

        // Enviar actualización
        const response = await fetch(`/api/invoices/${invoiceId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        console.log('📥 Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Server error:', errorData);
            throw new Error(errorData.error || errorData.details || `Error HTTP: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Update successful:', result);

        return true;

    } catch (error) {
        console.error('❌ Error saving invoice changes:', error);
        Swal.showValidationMessage('Error al guardar los cambios: ' + error.message);
        return false;
    }
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

// ================================
// ACTUALIZACIÓN DEL DASHBOARD FINANCIERO
// ================================

// Función para actualizar el dashboard financiero después de cambios en facturas
async function updateFinancialDashboard(action = 'Cambio en factura') {
    try {
        console.log('📊 Actualizando dashboard financiero después de:', action);
        
        // Verificar si la función del dashboard está disponible
        if (typeof window.loadFinancialOverview === 'function') {
            console.log('🔄 Recargando datos del dashboard financiero...');
            await window.loadFinancialOverview();
            console.log('✅ Dashboard financiero actualizado');
        } else if (typeof window.loadDashboardData === 'function') {
            // Función alternativa del dashboard
            console.log('🔄 Recargando datos del dashboard (método alternativo)...');
            await window.loadDashboardData();
            console.log('✅ Dashboard actualizado');
        } else {
            console.log('ℹ️ Dashboard financiero no está cargado actualmente');
        }
        
        // También actualizar estadísticas generales si están disponibles
        if (typeof window.updateDashboardStats === 'function') {
            await window.updateDashboardStats();
        }
        
    } catch (error) {
        console.warn('⚠️ No se pudo actualizar el dashboard financiero:', error.message);
        // No mostrar error al usuario ya que es una funcionalidad secundaria
    }
}

// Función para notificar cambios financieros a otros módulos
function notifyFinancialChange(type, data) {
    // Emitir evento personalizado para que otros módulos puedan escuchar
    const event = new CustomEvent('financialDataChanged', {
        detail: {
            type: type, // 'invoice_cancelled', 'invoice_edited', 'payment_created', etc.
            data: data,
            timestamp: new Date()
        }
    });
    
    document.dispatchEvent(event);
    console.log('📢 Evento financiero emitido:', type);
}

// Función para cerrar el modal de factura de proveedor y limpiar formulario
function closeSupplierInvoiceModal() {
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('supplierInvoiceModal'));
    if (modal) {
        modal.hide();
    }

    // Limpiar formulario
    console.log('📋 Obteniendo formulario...');
        const form = document.getElementById('supplierInvoiceForm');
        console.log('📋 Formulario encontrado:', !!form);
    if (form) {
        form.reset();
    }

    // Resetear items de la factura
    const itemsContainer = document.getElementById('supplierInvoiceItems');
    if (itemsContainer) {
        itemsContainer.innerHTML = `
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
    }
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
// Nuevas funcionalidades
window.viewInvoiceDetails = viewInvoiceDetails;
window.editInvoiceModal = editInvoiceModal;
window.cancelInvoiceModal = cancelInvoiceModal;
window.addEditInvoiceItem = addEditInvoiceItem;
window.removeEditInvoiceItem = removeEditInvoiceItem;
window.updateEditInvoiceTotal = updateEditInvoiceTotal;
// Funciones de actualización del dashboard
window.updateFinancialDashboard = updateFinancialDashboard;
window.notifyFinancialChange = notifyFinancialChange;

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
    console.log('📄 Mostrando modal de factura de proveedor...');
    
    const modalElement = document.getElementById('supplierInvoiceModal');
    if (!modalElement) {
        console.error('❌ Modal de factura de proveedor no encontrado');
        return;
    }
    
    const modal = new bootstrap.Modal(modalElement);
    
    // Limpiar formulario
    document.getElementById('supplierInvoiceForm').reset();
    document.getElementById('supplierInvoiceTotal').textContent = '$0';
    
    // Resetear items
    const itemsContainer = document.getElementById('supplierInvoiceItems');
    itemsContainer.innerHTML = `
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
    
    // Ocultar información de saldo
    const balanceInfo = document.getElementById('fundBalanceInfo');
    if (balanceInfo) {
        balanceInfo.classList.add('d-none');
    }
    
    // Remove aria-hidden before showing to prevent accessibility issues
    modalElement.removeAttribute('aria-hidden');
    
    // Cargar fondos disponibles
    loadFundsForSupplierInvoice();
    
    modal.show();
}

// Cargar fondos disponibles para facturas de proveedor
async function loadFundsForSupplierInvoice() {
    try {
        const fundSelect = document.getElementById('supplierInvoiceFund');
        if (!fundSelect) return;
        
        console.log('📋 Cargando fondos para factura de proveedor...');
        
        // Obtener fondos activos
        const response = await api.getFunds({ isActive: 'true' });
        const funds = response.funds || [];
        
        // Limpiar opciones
        fundSelect.innerHTML = '<option value="">Seleccionar fondo</option>';
        
        // Agregar fondos
        funds.forEach(fund => {
            const option = document.createElement('option');
            option.value = fund.id;
            option.textContent = `${fund.name} (${fund.code}) - ${formatCurrency(fund.currentBalance)}`;
            option.dataset.balance = fund.currentBalance;
            fundSelect.appendChild(option);
        });
        
        // Agregar listener para mostrar saldo
        fundSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const balanceInfo = document.getElementById('fundBalanceInfo');
            const balanceSpan = document.getElementById('selectedFundBalance');
            
            if (selectedOption.dataset.balance) {
                balanceSpan.textContent = formatCurrency(selectedOption.dataset.balance);
                balanceInfo.classList.remove('d-none');
            } else {
                balanceInfo.classList.add('d-none');
            }
        });
        
        console.log(`✅ Cargados ${funds.length} fondos`);
        
    } catch (error) {
        console.error('❌ Error cargando fondos:', error);
        const fundSelect = document.getElementById('supplierInvoiceFund');
        if (fundSelect) {
            fundSelect.innerHTML = '<option value="">Error cargando fondos</option>';
        }
    }
}

// Cargar fondos disponibles para facturas externas
async function loadFundsForExternalInvoice() {
    try {
        const fundSelect = document.getElementById('externalInvoiceFund');
        if (!fundSelect) return;
        
        console.log('📋 Cargando fondos para factura externa...');
        
        // Obtener fondos activos
        const response = await api.getFunds({ isActive: 'true' });
        const funds = response.funds || [];
        
        // Limpiar opciones
        fundSelect.innerHTML = '<option value="">Seleccionar fondo</option>';
        
        // Agregar fondos
        funds.forEach(fund => {
            const option = document.createElement('option');
            option.value = fund.id;
            option.textContent = `${fund.name} (${fund.code}) - ${formatCurrency(fund.currentBalance)}`;
            option.dataset.balance = fund.currentBalance;
            fundSelect.appendChild(option);
        });
        
        // Agregar listener para mostrar saldo
        fundSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const balanceInfo = document.getElementById('externalFundBalanceInfo');
            const balanceSpan = document.getElementById('externalSelectedFundBalance');
            
            if (selectedOption.dataset.balance) {
                balanceSpan.textContent = formatCurrency(selectedOption.dataset.balance);
                balanceInfo.classList.remove('d-none');
            } else {
                balanceInfo.classList.add('d-none');
            }
        });
        
        console.log(`✅ Cargados ${funds.length} fondos para factura externa`);
        
    } catch (error) {
        console.error('❌ Error cargando fondos para factura externa:', error);
        const fundSelect = document.getElementById('externalInvoiceFund');
        if (fundSelect) {
            fundSelect.innerHTML = '<option value="">Error cargando fondos</option>';
        }
    }
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

                            <div class="card mb-3">
                                <div class="card-header">
                                    <h6 class="mb-0">💰 Selección de Fondos</h6>
                                </div>
                                <div class="card-body">
                                    <div class="mb-3">
                                        <label class="form-label">Fondo para el Pago *</label>
                                        <select class="form-select" id="supplierInvoiceFund" required>
                                            <option value="">Cargando fondos...</option>
                                        </select>
                                        <div class="form-text">Selecciona de qué fondo se pagará esta factura</div>
                                    </div>
                                    <div id="fundBalanceInfo" class="alert alert-info d-none">
                                        <small><strong>Saldo disponible:</strong> <span id="selectedFundBalance">$0</span></small>
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
                        <button type="button" class="btn btn-primary" id="saveSupplierInvoiceBtn">
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

    
    
    // Agregar event listener al botón de guardar
    const saveBtn = document.getElementById('saveSupplierInvoiceBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            console.log('🔘 Botón de guardar clickeado');
            saveSupplierInvoice();
        });
        console.log('✅ Event listener agregado al botón de guardar');
    }
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
    console.log('🔍 INICIANDO saveSupplierInvoice...');
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

        // Obtener el fondo seleccionado
        console.log('💰 Verificando fondo seleccionado...');
        const selectedFundId = document.getElementById('supplierInvoiceFund').value;
        console.log('💰 Fondo seleccionado:', selectedFundId);
        if (!selectedFundId) {
            showError('Debe seleccionar un fondo para el pago');
            hideLoading();
            return;
        }
        
        // Procesar la factura con el fondo seleccionado
        await processSupplierInvoiceWithSelectedFund(invoiceData, selectedFundId);
        hideLoading();

    } catch (error) {
        console.error('Error saving supplier invoice:', error);
        showError('Error al guardar la factura de proveedor');
        hideLoading();
    }
}

// Mostrar selector de fondos para facturas de proveedor
function showFundSelectorForSupplierInvoice(invoiceData) {
    try {
        // Verificar si el selector de fondos está disponible
        if (typeof getFundSelector !== 'function') {
            console.warn('FundSelector no disponible, procesando factura sin selector');
            processSupplierInvoiceWithoutFunds(invoiceData);
            return;
        }
            
        console.log('🎯 Mostrando selector de fondos para factura de proveedor');
        
        // Obtener instancia del selector de fondos
        const fundSelector = getFundSelector();
        
        // Configurar el selector para gastos
        fundSelector.show({
            totalAmount: invoiceData.total,
            invoiceData: {
                concept: invoiceData.concept,
                supplierName: invoiceData.supplierName,
                type: 'INCOMING' // Es una factura recibida (gasto para nosotros)
            },
            onConfirm: async (fundSelections) => {
                try {
                    console.log('✅ Fondos seleccionados:', fundSelections);
                    // Procesar la factura con la información de fondos
                    await processSupplierInvoiceWithFunds(invoiceData, fundSelections);
                } catch (error) {
                    console.error('❌ Error procesando factura con fondos:', error);
                    showError('Error al procesar la factura con fondos');
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Error mostrando selector de fondos:', error);
        // Fallback: procesar sin selector de fondos
        processSupplierInvoiceWithoutFunds(invoiceData);
    }
}

// Procesar factura de proveedor con fondo seleccionado
async function processSupplierInvoiceWithSelectedFund(invoiceData, fundId) {
    try {
        showLoading();
        
        console.log('💾 Creando factura de proveedor...', invoiceData);
        
        // Crear la factura principal
        const response = await api.post('/invoices', invoiceData);
        
        console.log('✅ Factura creada:', response);
        
        // Registrar el gasto en el fondo seleccionado
        console.log('💰 Registrando gasto en fondo:', fundId);
        await api.post(`/funds/${fundId}/expense`, {
            amount: invoiceData.total,
            description: `Factura proveedor: ${invoiceData.supplierName} - ${getSupplierConceptText(invoiceData.concept)}`,
            reference: response.invoiceNumber,
            invoiceId: response.id
        });

        showSuccess('Factura de proveedor registrada exitosamente con trazabilidad de fondos');

        // Notificar cambios para actualizar dashboard
        if (typeof window.notifyExpenseRecorded === 'function') {
            window.notifyExpenseRecorded({
                invoiceId: response.id,
                amount: invoiceData.total,
                concept: invoiceData.concept,
                fundId: fundId
            });
        }

        // Cerrar modal y limpiar formulario
        closeSupplierInvoiceModal();
        
        // Recargar facturas
        await loadInvoices();
        
    } catch (error) {
        console.error('Error saving supplier invoice with fund:', error);
        showError('Error al guardar la factura de proveedor');
    } finally {
        hideLoading();
    }
}

// Procesar factura externa con fondo seleccionado
async function processExternalInvoiceWithSelectedFund(invoiceData, fundId) {
    try {
        showLoading();
        
        console.log('💾 Creando factura externa...', invoiceData);
        
        // Validar datos antes de enviar
        if (!invoiceData.clientName || !invoiceData.clientDocument || !invoiceData.concept) {
            throw new Error('Faltan datos obligatorios de la factura');
        }
        
        if (!invoiceData.items || invoiceData.items.length === 0) {
            throw new Error('La factura debe tener al menos un item');
        }
        
        // Crear la factura principal (usar endpoint específico para facturas externas)
        const response = await api.post('/invoices/external', invoiceData);
        
        console.log('✅ Factura externa creada:', response);
        
        // Registrar el ingreso en el fondo seleccionado
        console.log('💰 Registrando ingreso en fondo:', fundId);
        await api.post(`/funds/${fundId}/income`, {
            amount: invoiceData.total,
            description: `Factura externa: ${invoiceData.clientName} - ${getConceptText(invoiceData.concept)}`,
            reference: response.invoiceNumber,
            invoiceId: response.id
        });

        showSuccess('Factura externa registrada exitosamente con trazabilidad de fondos');

        // Notificar cambios para actualizar dashboard
        if (typeof window.notifyIncomeRecorded === 'function') {
            window.notifyIncomeRecorded({
                invoiceId: response.id,
                amount: invoiceData.total,
                concept: invoiceData.concept,
                fundId: fundId
            });
        }

        // Recargar facturas
        await loadInvoices();
        
    } catch (error) {
        console.error('Error saving external invoice with fund:', error);
        showError('Error al guardar la factura externa');
    } finally {
        hideLoading();
    }
}

// Procesar factura de proveedor sin selector de fondos (fallback)
async function processSupplierInvoiceWithoutFunds(invoiceData) {
    try {
        showLoading();
        
        // Crear la factura sin trazabilidad de fondos
        const response = await API.request('POST', '/api/invoices', invoiceData);
        
        showSuccess('Factura de proveedor registrada exitosamente');
        
        // Cerrar modal y limpiar formulario
        closeSupplierInvoiceModal();
        
        // Recargar facturas
        await loadInvoices();
        
    } catch (error) {
        console.error('Error saving supplier invoice without funds:', error);
        showError('Error al guardar la factura de proveedor');
    } finally {
        hideLoading();
    }
}

// Procesar factura de proveedor con información de fondos
async function processSupplierInvoiceWithFunds(invoiceData, fundSelections) {
    try {
        // Crear la factura principal
        const response = await API.request('POST', '/api/invoices', invoiceData);
        
        // Registrar las transacciones en los fondos seleccionados (gastos)
        for (const selection of fundSelections) {
            await api.post(`/funds/${selection.fundId}/expense`, {
                amount: selection.amount,
                description: `Factura proveedor: ${invoiceData.supplierName} - ${getSupplierConceptText(invoiceData.concept)}`,
                reference: response.invoiceNumber,
                invoiceId: response.id
            });
        }

        showSuccess('Factura de proveedor registrada exitosamente con trazabilidad de fondos');

        // Notificar cambios para actualizar dashboard
        if (typeof window.notifyExpenseRecorded === 'function') {
            window.notifyExpenseRecorded({
                invoiceId: response.id,
                amount: invoiceData.total,
                concept: invoiceData.concept,
                fundSelections: fundSelections
            });
        }

        // Cerrar modal y limpiar formulario
        closeSupplierInvoiceModal();

        // Reload invoices
        await loadInvoices();

        hideLoading();

    } catch (error) {
        console.error('Error saving supplier invoice:', error);
        showError('Error al guardar la factura de proveedor');
        hideLoading();
    }
}

// Procesar factura de proveedor sin selector de fondos (fallback)
async function processSupplierInvoiceWithoutFunds(invoiceData) {
    try {
        // Crear la factura principal
        const response = await API.request('POST', '/api/invoices', invoiceData);

        showSuccess('Factura de proveedor registrada exitosamente');

        // Close modal and refresh list
        const modal = bootstrap.Modal.getInstance(document.getElementById('supplierInvoiceModal'));
        modal.hide();

        // Reset form
        const form = document.getElementById('supplierInvoiceForm');
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

    } catch (error) {
        console.error('Error saving supplier invoice without funds:', error);
        showError('Error al guardar la factura de proveedor');
    }
}

// Mostrar selector de fondos para facturas externas
async function showFundSelectorForExternalInvoice(invoiceData) {
    return new Promise((resolve, reject) => {
        try {
            // Verificar si el selector de fondos está disponible
            if (typeof getFundSelector !== 'function') {
                console.warn('FundSelector no disponible, procesando factura sin selector');
                processExternalInvoiceWithoutFunds(invoiceData).then(resolve).catch(reject);
                return;
            }
            
            // Obtener instancia del selector de fondos
            const fundSelector = getFundSelector();
            
            // Configurar el selector para ingresos
            fundSelector.show({
                totalAmount: invoiceData.total,
                invoiceData: {
                    concept: invoiceData.concept,
                    clientName: invoiceData.clientName,
                    type: 'OUTGOING' // Es una factura emitida (ingreso para nosotros)
                },
                onConfirm: async (fundSelections) => {
                    try {
                        // Procesar la factura con la información de fondos
                        await processExternalInvoiceWithFunds(invoiceData, fundSelections);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

// Procesar factura externa con información de fondos
async function processExternalInvoiceWithFunds(invoiceData, fundSelections) {
    try {
        // Crear la factura principal
        const invoiceResult = await api.createExternalInvoice(invoiceData);
        
        // Registrar las transacciones en los fondos seleccionados (ingresos)
        for (const selection of fundSelections) {
            await api.post(`/funds/${selection.fundId}/income`, {
                amount: selection.amount,
                description: `Factura externa: ${invoiceData.clientName} - ${getConceptText(invoiceData.concept)}`,
                reference: invoiceResult.invoice?.invoiceNumber || 'N/A',
                invoiceId: invoiceResult.invoice?.id
            });
        }

        showSuccess('Factura externa creada exitosamente con trazabilidad de fondos');

        // Notify dashboard of new invoice
        if (typeof notifyInvoiceGenerated === 'function') {
            notifyInvoiceGenerated({
                invoiceNumber: invoiceResult.invoice?.invoiceNumber || 'N/A',
                concept: invoiceData.concept || 'OTHER',
                fundSelections: fundSelections
            });
        }

        // Reload invoices
        await loadInvoices();

    } catch (error) {
        console.error('Error processing external invoice with funds:', error);
        showError('Error al procesar la factura externa');
    }
}

// Procesar factura externa sin selector de fondos (fallback)
async function processExternalInvoiceWithoutFunds(invoiceData) {
    try {
        // Crear la factura principal
        const invoiceResult = await api.createExternalInvoice(invoiceData);

        showSuccess('Factura externa creada exitosamente');

        // Notify dashboard of new invoice
        if (typeof notifyInvoiceGenerated === 'function') {
            notifyInvoiceGenerated({
                invoiceNumber: invoiceResult.invoice?.invoiceNumber || 'N/A',
                concept: invoiceData.concept || 'OTHER'
            });
        }

        // Reload invoices
        await loadInvoices();

    } catch (error) {
        console.error('Error saving external invoice without funds:', error);
        showError('Error al crear la factura externa');
    }
}

// Get supplier concept text for display
function getSupplierConceptText(concept) {
    const concepts = {
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
    return concepts[concept] || concept;
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
// Función de prueba para el botón de guardar
function testSupplierInvoiceButton() {
    console.log('🧪 PROBANDO BOTÓN DE FACTURA DE PROVEEDOR');
    const modal = document.getElementById('supplierInvoiceModal');
    const button = document.getElementById('saveSupplierInvoiceBtn');
    const form = document.getElementById('supplierInvoiceForm');
    
    console.log('Modal encontrado:', !!modal);
    console.log('Botón encontrado:', !!button);
    console.log('Formulario encontrado:', !!form);
    console.log('Función saveSupplierInvoice disponible:', typeof window.saveSupplierInvoice);
    
    if (button) {
        console.log('Simulando click en el botón...');
        button.click();
    }
}

window.testSupplierInvoiceButton = testSupplierInvoiceButton;

// Función de prueba para datos de factura externa
function testExternalInvoiceData() {
    console.log('🧪 PROBANDO DATOS DE FACTURA EXTERNA');
    
    const testData = {
        clientName: "Cliente Test",
        clientDocument: "12345678",
        clientEmail: "test@test.com",
        concept: "UNIFORM",
        dueDate: "2025-09-17",
        observations: "Test",
        fundId: "test-fund-id",
        items: [
            {
                description: "Producto test",
                quantity: 1,
                unitPrice: 50000
            }
        ],
        isExternal: true,
        type: 'OUTGOING',
        subtotal: 50000,
        tax: 0,
        total: 50000
    };
    
    console.log('Datos de prueba:', testData);
    
    // Validar estructura
    const requiredFields = ['clientName', 'clientDocument', 'concept', 'items', 'total'];
    const missingFields = requiredFields.filter(field => !testData[field]);
    
    if (missingFields.length > 0) {
        console.log('❌ Campos faltantes:', missingFields);
    } else {
        console.log('✅ Todos los campos requeridos presentes');
    }
    
    // Validar items
    if (testData.items && testData.items.length > 0) {
        const itemFields = ['description', 'quantity', 'unitPrice'];
        testData.items.forEach((item, index) => {
            const missingItemFields = itemFields.filter(field => !item[field]);
            if (missingItemFields.length > 0) {
                console.log(`❌ Item ${index + 1} campos faltantes:`, missingItemFields);
            } else {
                console.log(`✅ Item ${index + 1} válido`);
            }
        });
    }
    
    return testData;
}

window.testExternalInvoiceData = testExternalInvoiceData;
