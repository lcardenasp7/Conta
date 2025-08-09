// Invoices Management

let currentInvoices = [];
let currentInvoicesPage = 1;
let totalInvoicesPages = 1;
let currentInvoicesFilters = {};

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
            <td>${invoice.invoiceNumber}</td>
            <td>${formatDate(invoice.date)}</td>
            <td>${invoice.student?.firstName} ${invoice.student?.lastName}</td>
            <td>${getConceptText(invoice.concept)}</td>
            <td>${formatCurrency(invoice.total)}</td>
            <td>${formatDate(invoice.dueDate)}</td>
            <td>${getStatusBadge(invoice.status, 'invoice')}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewInvoice('${invoice.id}')" title="Ver">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning" onclick="editInvoice('${invoice.id}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-success" onclick="createPayment('${invoice.id}')" title="Registrar Pago">
                        <i class="bi bi-cash-coin"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteInvoice('${invoice.id}')" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update pagination
function updateInvoicesPagination() {
    const paginationContainer = document.getElementById('invoicesPagination');
    if (!paginationContainer) return;
    
    paginationContainer.innerHTML = generatePagination(currentInvoicesPage, totalInvoicesPages, 'loadInvoicesPage');
}

// Load specific page
function loadInvoicesPage(page) {
    if (page >= 1 && page <= totalInvoicesPages) {
        loadInvoices(page, currentInvoicesFilters);
    }
}

// Search invoices
function searchInvoices() {
    const searchTerm = document.getElementById('invoiceSearch')?.value || '';
    const statusFilter = document.getElementById('invoiceStatusFilter')?.value || '';
    const conceptFilter = document.getElementById('invoiceConceptFilter')?.value || '';
    
    const filters = {};
    if (searchTerm) filters.search = searchTerm;
    if (statusFilter) filters.status = statusFilter;
    if (conceptFilter) filters.concept = conceptFilter;
    
    loadInvoices(1, filters);
}

// Clear filters
function clearInvoiceFilters() {
    document.getElementById('invoiceSearch').value = '';
    document.getElementById('invoiceStatusFilter').value = '';
    document.getElementById('invoiceConceptFilter').value = '';
    loadInvoices(1, {});
}

// View invoice details
async function viewInvoice(invoiceId) {
    try {
        showLoading();
        const invoice = await api.getInvoice(invoiceId);
        showInvoiceModal(invoice, 'view');
    } catch (error) {
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Edit invoice
async function editInvoice(invoiceId) {
    try {
        showLoading();
        const invoice = await api.getInvoice(invoiceId);
        showInvoiceModal(invoice, 'edit');
    } catch (error) {
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Delete invoice
async function deleteInvoice(invoiceId) {
    const invoice = currentInvoices.find(i => i.id === invoiceId);
    if (!invoice) return;
    
    const confirmed = await showConfirmation(
        '¿Eliminar factura?',
        `¿Está seguro de que desea eliminar la factura ${invoice.invoiceNumber}?`,
        'Sí, eliminar'
    );
    
    if (confirmed) {
        try {
            showLoading();
            await api.deleteInvoice(invoiceId);
            showNotification('Factura eliminada exitosamente', 'success');
            loadInvoices(currentInvoicesPage, currentInvoicesFilters);
        } catch (error) {
            handleApiError(error);
        } finally {
            hideLoading();
        }
    }
}

// Show invoice modal
function showInvoiceModal(invoice = null, mode = 'create') {
    const modal = document.getElementById('invoiceModal');
    const modalTitle = document.getElementById('invoiceModalTitle');
    const form = document.getElementById('invoiceForm');
    
    if (!modal || !modalTitle || !form) return;
    
    // Set modal title
    const titles = {
        create: 'Crear Factura',
        edit: 'Editar Factura',
        view: 'Ver Factura'
    };
    modalTitle.textContent = titles[mode];
    
    // Clear form
    form.reset();
    clearInvoiceItems();
    
    // Set form mode
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.disabled = mode === 'view';
        input.classList.remove('is-invalid');
    });
    
    // Hide/show buttons based on mode
    const saveBtn = document.getElementById('saveInvoiceBtn');
    if (saveBtn) {
        saveBtn.style.display = mode === 'view' ? 'none' : 'block';
    }
    
    // Fill form if editing or viewing
    if (invoice && mode !== 'create') {
        document.getElementById('invoiceId').value = invoice.id;
        document.getElementById('studentId').value = invoice.studentId;
        document.getElementById('concept').value = invoice.concept;
        document.getElementById('dueDate').value = invoice.dueDate?.split('T')[0];
        document.getElementById('observations').value = invoice.observations || '';
        
        // Load invoice items
        if (invoice.items) {
            invoice.items.forEach(item => {
                addInvoiceItem(item);
            });
        }
        
        updateInvoiceTotals();
    } else {
        // Set default due date (30 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        document.getElementById('dueDate').value = dueDate.toISOString().split('T')[0];
        
        // Add one empty item
        addInvoiceItem();
    }
    
    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Add invoice item
function addInvoiceItem(item = null) {
    const itemsContainer = document.getElementById('invoiceItems');
    if (!itemsContainer) return;
    
    const itemIndex = itemsContainer.children.length;
    
    const itemHtml = `
        <div class="invoice-item border rounded p-3 mb-3">
            <div class="row">
                <div class="col-md-4">
                    <label class="form-label">Descripción</label>
                    <input type="text" class="form-control" name="items[${itemIndex}][description]" 
                           value="${item?.description || ''}" required>
                </div>
                <div class="col-md-2">
                    <label class="form-label">Cantidad</label>
                    <input type="number" class="form-control" name="items[${itemIndex}][quantity]" 
                           value="${item?.quantity || 1}" min="1" required onchange="updateInvoiceTotals()">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Precio Unitario</label>
                    <input type="number" class="form-control" name="items[${itemIndex}][unitPrice]" 
                           value="${item?.unitPrice || 0}" min="0" step="0.01" required onchange="updateInvoiceTotals()">
                </div>
                <div class="col-md-2">
                    <label class="form-label">Total</label>
                    <input type="text" class="form-control item-total" readonly value="${formatCurrency(item?.total || 0)}">
                </div>
                <div class="col-md-1 d-flex align-items-end">
                    <button type="button" class="btn btn-outline-danger" onclick="removeInvoiceItem(this)">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    itemsContainer.insertAdjacentHTML('beforeend', itemHtml);
    updateInvoiceTotals();
}

// Remove invoice item
function removeInvoiceItem(button) {
    const item = button.closest('.invoice-item');
    if (item) {
        item.remove();
        updateInvoiceTotals();
    }
}

// Clear invoice items
function clearInvoiceItems() {
    const itemsContainer = document.getElementById('invoiceItems');
    if (itemsContainer) {
        itemsContainer.innerHTML = '';
    }
}

// Update invoice totals
function updateInvoiceTotals() {
    const items = document.querySelectorAll('.invoice-item');
    let subtotal = 0;
    
    items.forEach(item => {
        const quantity = parseFloat(item.querySelector('input[name*="[quantity]"]')?.value || 0);
        const unitPrice = parseFloat(item.querySelector('input[name*="[unitPrice]"]')?.value || 0);
        const total = quantity * unitPrice;
        
        // Update item total display
        const totalInput = item.querySelector('.item-total');
        if (totalInput) {
            totalInput.value = formatCurrency(total);
        }
        
        subtotal += total;
    });
    
    // Educational services are exempt from VAT
    const tax = 0;
    const total = subtotal + tax;
    
    // Update totals display
    document.getElementById('invoiceSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('invoiceTax').textContent = formatCurrency(tax);
    document.getElementById('invoiceTotal').textContent = formatCurrency(total);
}

// Save invoice
async function saveInvoice() {
    const form = document.getElementById('invoiceForm');
    if (!form || !validateForm(form)) {
        showNotification('Por favor complete todos los campos requeridos', 'error');
        return;
    }
    
    const formData = new FormData(form);
    const invoiceData = {
        studentId: formData.get('studentId'),
        concept: formData.get('concept'),
        dueDate: formData.get('dueDate'),
        observations: formData.get('observations'),
        items: []
    };
    
    // Collect items
    const items = document.querySelectorAll('.invoice-item');
    items.forEach((item, index) => {
        const description = item.querySelector('input[name*="[description]"]')?.value;
        const quantity = parseInt(item.querySelector('input[name*="[quantity]"]')?.value || 0);
        const unitPrice = parseFloat(item.querySelector('input[name*="[unitPrice]"]')?.value || 0);
        
        if (description && quantity > 0 && unitPrice >= 0) {
            invoiceData.items.push({
                description,
                quantity,
                unitPrice
            });
        }
    });
    
    if (invoiceData.items.length === 0) {
        showNotification('Debe agregar al menos un item a la factura', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const invoiceId = formData.get('invoiceId');
        
        if (invoiceId) {
            // Update existing invoice
            await api.updateInvoice(invoiceId, invoiceData);
            showNotification('Factura actualizada exitosamente', 'success');
        } else {
            // Create new invoice
            await api.createInvoice(invoiceData);
            showNotification('Factura creada exitosamente', 'success');
        }
        
        // Close modal and reload data
        const modal = bootstrap.Modal.getInstance(document.getElementById('invoiceModal'));
        modal.hide();
        
        loadInvoices(currentInvoicesPage, currentInvoicesFilters);
        
    } catch (error) {
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Student search for invoice
let studentSearchTimeout;
async function searchStudentForInvoice() {
    const searchTerm = document.getElementById('studentSearch')?.value;
    if (!searchTerm || searchTerm.length < 2) {
        document.getElementById('studentSearchResults').innerHTML = '';
        return;
    }
    
    clearTimeout(studentSearchTimeout);
    studentSearchTimeout = setTimeout(async () => {
        try {
            const response = await api.getStudents({ search: searchTerm, limit: 10 });
            const students = response.students || [];
            
            const resultsHtml = students.map(student => `
                <div class="list-group-item list-group-item-action" onclick="selectStudentForInvoice('${student.id}', '${student.firstName} ${student.lastName}')">
                    <div class="d-flex justify-content-between">
                        <div>
                            <strong>${student.firstName} ${student.lastName}</strong>
                            <small class="text-muted d-block">${student.document} - ${student.grade?.name} ${student.group?.name}</small>
                        </div>
                    </div>
                </div>
            `).join('');
            
            document.getElementById('studentSearchResults').innerHTML = resultsHtml;
            
        } catch (error) {
            console.error('Error searching students:', error);
        }
    }, 300);
}

// Select student for invoice
function selectStudentForInvoice(studentId, studentName) {
    document.getElementById('studentId').value = studentId;
    document.getElementById('studentSearch').value = studentName;
    document.getElementById('studentSearchResults').innerHTML = '';
}

// Create payment from invoice
function createPayment(invoiceId) {
    // This would open the payment modal with the invoice pre-selected
    // Implementation depends on the payment modal structure
    showNotification('Función de crear pago en desarrollo', 'info');
}

// Show bulk invoice modal
async function showBulkInvoiceModal() {
    const modal = document.getElementById('bulkInvoiceModal');
    if (modal) {
        // Load grades for bulk invoice
        try {
            const grades = await api.getGrades();
            const gradeSelect = modal.querySelector('#bulkGradeId');
            if (gradeSelect) {
                gradeSelect.innerHTML = '<option value="">Seleccionar grado</option>' +
                    grades.map(grade => `<option value="${grade.id}">${grade.name}</option>`).join('');
            }
        } catch (error) {
            console.error('Error loading grades:', error);
        }
        
        // Set default due date (30 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const dueDateInput = modal.querySelector('#bulkDueDate');
        if (dueDateInput) {
            dueDateInput.value = dueDate.toISOString().split('T')[0];
        }
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

// Create bulk invoices
async function createBulkInvoices() {
    const form = document.getElementById('bulkInvoiceForm');
    if (!form || !validateForm(form)) {
        showNotification('Por favor complete todos los campos requeridos', 'error');
        return;
    }
    
    const formData = new FormData(form);
    const bulkData = {
        gradeId: formData.get('gradeId'),
        concept: formData.get('concept'),
        description: formData.get('description'),
        amount: parseFloat(formData.get('amount')),
        dueDate: formData.get('dueDate')
    };
    
    const confirmed = await showConfirmation(
        '¿Crear facturas masivas?',
        `¿Está seguro de crear facturas para todos los estudiantes del grado seleccionado?`,
        'Sí, crear facturas'
    );
    
    if (confirmed) {
        try {
            showLoading();
            const result = await api.createBulkInvoices(bulkData);
            showNotification(`${result.message}`, 'success');
            
            // Close modal and reload data
            const modal = bootstrap.Modal.getInstance(document.getElementById('bulkInvoiceModal'));
            modal.hide();
            
            loadInvoices(currentInvoicesPage, currentInvoicesFilters);
            
        } catch (error) {
            handleApiError(error);
        } finally {
            hideLoading();
        }
    }
}

// Export invoices to CSV
function exportInvoices() {
    if (currentInvoices.length === 0) {
        showNotification('No hay facturas para exportar', 'warning');
        return;
    }
    
    const headers = ['Número', 'Fecha', 'Estudiante', 'Concepto', 'Total', 'Vencimiento', 'Estado'];
    const data = [headers];
    
    currentInvoices.forEach(invoice => {
        data.push([
            invoice.invoiceNumber,
            formatDate(invoice.date),
            `${invoice.student?.firstName} ${invoice.student?.lastName}`,
            getConceptText(invoice.concept),
            invoice.total,
            formatDate(invoice.dueDate),
            invoice.status
        ]);
    });
    
    exportToCSV(data, 'facturas.csv');
    showNotification('Facturas exportadas exitosamente', 'success');
}

// Initialize invoices page
function initInvoices() {
    // Load initial data
    loadInvoices();
    
    // Setup search with debounce
    const searchInput = document.getElementById('invoiceSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchInvoices, 300));
    }
    
    // Setup filter change handlers
    const statusFilter = document.getElementById('invoiceStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', searchInvoices);
    }
    
    const conceptFilter = document.getElementById('invoiceConceptFilter');
    if (conceptFilter) {
        conceptFilter.addEventListener('change', searchInvoices);
    }
    
    // Setup student search
    const studentSearchInput = document.getElementById('studentSearch');
    if (studentSearchInput) {
        studentSearchInput.addEventListener('input', searchStudentForInvoice);
    }
    
    // Setup form submissions
    const invoiceForm = document.getElementById('invoiceForm');
    if (invoiceForm) {
        invoiceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveInvoice();
        });
    }
    
    const bulkInvoiceForm = document.getElementById('bulkInvoiceForm');
    if (bulkInvoiceForm) {
        bulkInvoiceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            createBulkInvoices();
        });
    }
}

// Show create invoice modal
function showCreateInvoiceModal() {
    showInvoiceModal(null, 'create');
}