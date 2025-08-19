// Payments Management

let currentPayments = [];
let currentPaymentsPage = 1;
let totalPaymentsPages = 1;
let currentPaymentsFilters = {};

// Load payments data
async function loadPayments(page = 1, filters = {}) {
    try {
        showLoading();
        
        const params = {
            page,
            limit: 20,
            ...filters
        };
        
        const response = await api.getPayments(params);
        
        currentPayments = response.payments || [];
        currentPaymentsPage = response.pagination?.page || 1;
        totalPaymentsPages = response.pagination?.pages || 1;
        currentPaymentsFilters = filters;
        
        updatePaymentsTable();
        updatePaymentsPagination();
        
    } catch (error) {
        console.error('Error loading payments:', error);
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Update payments table
function updatePaymentsTable() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;
    
    if (currentPayments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No se encontraron pagos</td></tr>';
        return;
    }
    
    tbody.innerHTML = currentPayments.map(payment => `
        <tr>
            <td>${payment.paymentNumber}</td>
            <td>${formatDate(payment.date)}</td>
            <td>${payment.student?.firstName} ${payment.student?.lastName}</td>
            <td>${payment.invoice?.invoiceNumber || 'N/A'}</td>
            <td>${formatCurrency(payment.amount)}</td>
            <td>${getPaymentMethodText(payment.method)}</td>
            <td>${getStatusBadge(payment.status, 'payment')}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewPayment('${payment.id}')" title="Ver">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning" onclick="editPayment('${payment.id}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    ${payment.status === 'COMPLETED' ? 
                        `<button class="btn btn-outline-danger" onclick="cancelPayment('${payment.id}')" title="Cancelar">
                            <i class="bi bi-x-circle"></i>
                        </button>` : ''
                    }
                </div>
            </td>
        </tr>
    `).join('');
}

// Update pagination
function updatePaymentsPagination() {
    const paginationContainer = document.getElementById('paymentsPagination');
    if (!paginationContainer) return;
    
    paginationContainer.innerHTML = generatePagination(currentPaymentsPage, totalPaymentsPages, 'loadPaymentsPage');
}

// Load specific page
function loadPaymentsPage(page) {
    if (page >= 1 && page <= totalPaymentsPages) {
        loadPayments(page, currentPaymentsFilters);
    }
}

// Search payments
function searchPayments() {
    const searchTerm = document.getElementById('paymentSearch')?.value || '';
    const statusFilter = document.getElementById('paymentStatusFilter')?.value || '';
    const methodFilter = document.getElementById('paymentMethodFilter')?.value || '';
    const startDate = document.getElementById('paymentStartDate')?.value || '';
    const endDate = document.getElementById('paymentEndDate')?.value || '';
    
    const filters = {};
    if (searchTerm) filters.search = searchTerm;
    if (statusFilter) filters.status = statusFilter;
    if (methodFilter) filters.method = methodFilter;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    loadPayments(1, filters);
}

// Clear filters
function clearPaymentFilters() {
    document.getElementById('paymentSearch').value = '';
    document.getElementById('paymentStatusFilter').value = '';
    document.getElementById('paymentMethodFilter').value = '';
    document.getElementById('paymentStartDate').value = '';
    document.getElementById('paymentEndDate').value = '';
    loadPayments(1, {});
}

// View payment details
async function viewPayment(paymentId) {
    try {
        showLoading();
        const payment = await api.getPayment(paymentId);
        showPaymentModal(payment, 'view');
    } catch (error) {
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Edit payment
async function editPayment(paymentId) {
    try {
        showLoading();
        const payment = await api.getPayment(paymentId);
        showPaymentModal(payment, 'edit');
    } catch (error) {
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Cancel payment
async function cancelPayment(paymentId) {
    const payment = currentPayments.find(p => p.id === paymentId);
    if (!payment) return;
    
    const { value: reason } = await Swal.fire({
        title: '¿Cancelar pago?',
        text: `¿Está seguro de que desea cancelar el pago ${payment.paymentNumber}?`,
        input: 'textarea',
        inputLabel: 'Motivo de cancelación',
        inputPlaceholder: 'Ingrese el motivo de la cancelación...',
        inputValidator: (value) => {
            if (!value) {
                return 'Debe ingresar un motivo para la cancelación';
            }
        },
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No cancelar',
        confirmButtonColor: '#d33'
    });
    
    if (reason) {
        try {
            showLoading();
            await api.cancelPayment(paymentId, reason);
            showNotification('Pago cancelado exitosamente', 'success');
            loadPayments(currentPaymentsPage, currentPaymentsFilters);
        } catch (error) {
            handleApiError(error);
        } finally {
            hideLoading();
        }
    }
}

// Show payment modal
function showPaymentModal(payment = null, mode = 'create') {
    const modal = document.getElementById('paymentModal');
    const modalTitle = document.getElementById('paymentModalTitle');
    const form = document.getElementById('paymentForm');
    
    if (!modal || !modalTitle || !form) return;
    
    // Set modal title
    const titles = {
        create: 'Registrar Pago',
        edit: 'Editar Pago',
        view: 'Ver Pago'
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
    const saveBtn = document.getElementById('savePaymentBtn');
    if (saveBtn) {
        saveBtn.style.display = mode === 'view' ? 'none' : 'block';
    }
    
    // Fill form if editing or viewing
    if (payment && mode !== 'create') {
        document.getElementById('paymentId').value = payment.id;
        document.getElementById('paymentStudentId').value = payment.studentId;
        document.getElementById('paymentInvoiceId').value = payment.invoiceId || '';
        document.getElementById('paymentAmount').value = payment.amount;
        document.getElementById('paymentMethod').value = payment.method;
        document.getElementById('paymentReference').value = payment.reference || '';
        document.getElementById('paymentObservations').value = payment.observations || '';
        
        // Show student and invoice info
        if (payment.student) {
            document.getElementById('paymentStudentInfo').innerHTML = `
                <strong>${payment.student.firstName} ${payment.student.lastName}</strong><br>
                <small class="text-muted">${payment.student.document}</small>
            `;
        }
        
        if (payment.invoice) {
            document.getElementById('paymentInvoiceInfo').innerHTML = `
                <strong>${payment.invoice.invoiceNumber}</strong><br>
                <small class="text-muted">Total: ${formatCurrency(payment.invoice.total)}</small>
            `;
        }
    } else {
        // Set current date
        document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    }
    
    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Save payment with fund selection
async function savePayment() {
    const form = document.getElementById('paymentForm');
    if (!form || !validateForm(form)) {
        showNotification('Por favor complete todos los campos requeridos', 'error');
        return;
    }
    
    const formData = new FormData(form);
    const paymentData = Object.fromEntries(formData.entries());
    
    // Convert amount to number
    paymentData.amount = parseFloat(paymentData.amount);
    
    // Remove empty invoiceId
    if (!paymentData.invoiceId) {
        delete paymentData.invoiceId;
    }
    
    const paymentId = paymentData.paymentId;
    delete paymentData.paymentId;
    
    // Si es un pago nuevo, mostrar selector de fondos para trazabilidad
    if (!paymentId && paymentData.amount > 0) {
        try {
            // Mostrar selector de fondos para determinar a qué fondo va el dinero
            await showFundSelectorForPayment(paymentData);
        } catch (error) {
            console.error('Error con selector de fondos:', error);
            // Continuar sin selector de fondos si hay error
            await processPaymentWithoutFunds(paymentData, paymentId);
        }
    } else {
        // Para ediciones, procesar normalmente
        await processPaymentWithoutFunds(paymentData, paymentId);
    }
}

// Mostrar selector de fondos para pagos
async function showFundSelectorForPayment(paymentData) {
    return new Promise((resolve, reject) => {
        try {
            // Verificar si el selector de fondos está disponible
            if (typeof getFundSelector !== 'function') {
                console.warn('FundSelector no disponible, procesando pago sin selector');
                processPaymentWithoutFunds(paymentData, null).then(resolve).catch(reject);
                return;
            }
            
            // Obtener instancia del selector de fondos
            const fundSelector = getFundSelector();
            
            // Obtener nombre del estudiante
            const studentName = document.getElementById('studentSearchPayment')?.value || 'Cliente';
            
            // Configurar el selector para pagos (ingresos)
            fundSelector.show({
                totalAmount: paymentData.amount,
                invoiceData: {
                    concept: paymentData.concept || 'MONTHLY',
                    studentId: paymentData.studentId,
                    studentName: studentName,
                    invoiceId: paymentData.invoiceId,
                    type: 'OUTGOING' // Es una factura emitida (ingreso para nosotros)
                },
                onConfirm: async (fundSelections) => {
                    try {
                        // Procesar el pago con la información de fondos
                        await processPaymentWithFunds(paymentData, fundSelections);
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

// Procesar pago con información de fondos
async function processPaymentWithFunds(paymentData, fundSelections) {
    try {
        showLoading();
        
        // Crear el pago principal
        const result = await api.createPayment(paymentData);
        
        // Obtener nombre del estudiante del campo de búsqueda
        const studentName = document.getElementById('studentSearchPayment')?.value || 'Cliente';
        
        // Registrar las transacciones en los fondos seleccionados
        for (const selection of fundSelections) {
            await api.post(`/funds/${selection.fundId}/income`, {
                amount: selection.amount,
                description: `Pago recibido: ${studentName} - ${getConceptText(paymentData.concept || 'OTHER')}`,
                reference: result.paymentNumber,
                paymentId: result.id,
                invoiceId: paymentData.invoiceId
            });
        }
        
        showNotification('Pago registrado exitosamente con trazabilidad de fondos', 'success');
        
        // Notificar cambios para actualizar dashboard
        if (typeof window.notifyPaymentMade === 'function') {
            window.notifyPaymentMade({
                paymentId: result.id,
                amount: paymentData.amount,
                fundSelections: fundSelections
            });
        }
        
        // Cerrar modal y recargar datos
        const modal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
        modal.hide();
        
        loadPayments(currentPaymentsPage, currentPaymentsFilters);
        
    } catch (error) {
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Procesar pago sin fondos (fallback)
async function processPaymentWithoutFunds(paymentData, paymentId) {
    try {
        showLoading();
        
        if (paymentId) {
            // Update existing payment
            await api.updatePayment(paymentId, paymentData);
            showNotification('Pago actualizado exitosamente', 'success');
        } else {
            // Create new payment
            const result = await api.createPayment(paymentData);
            showNotification('Pago registrado exitosamente', 'success');

            // Notificar cambio financiero para actualizar dashboard
            if (typeof window.notifyFinancialChange === 'function') {
                window.notifyFinancialChange('payment_created', {
                    paymentId: result.id,
                    amount: paymentData.amount,
                    concept: paymentData.concept || 'OTHER',
                    invoiceId: paymentData.invoiceId,
                    timestamp: new Date()
                });
            }

            // Actualizar dashboard financiero si está disponible
            if (typeof window.updateFinancialDashboard === 'function') {
                setTimeout(() => {
                    window.updateFinancialDashboard('Pago registrado');
                }, 500);
            }
        }
        
        // Close modal and reload data
        const modal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
        modal.hide();
        
        loadPayments(currentPaymentsPage, currentPaymentsFilters);
        
    } catch (error) {
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Student search for payment
let paymentStudentSearchTimeout;
async function searchStudentForPayment() {
    const searchTerm = document.getElementById('studentSearchPayment')?.value;
    if (!searchTerm || searchTerm.length < 2) {
        document.getElementById('studentSearchResultsPayment').innerHTML = '';
        return;
    }
    
    clearTimeout(paymentStudentSearchTimeout);
    paymentStudentSearchTimeout = setTimeout(async () => {
        try {
            const response = await api.getStudents({ search: searchTerm, limit: 10 });
            const students = response.students || [];
            
            const resultsHtml = students.map(student => `
                <div class="list-group-item list-group-item-action" onclick="selectStudentForPayment('${student.id}', '${student.firstName} ${student.lastName}')">
                    <div class="d-flex justify-content-between">
                        <div>
                            <strong>${student.firstName} ${student.lastName}</strong>
                            <small class="text-muted d-block">${student.document} - ${student.grade?.name} ${student.group?.name}</small>
                        </div>
                    </div>
                </div>
            `).join('');
            
            document.getElementById('studentSearchResultsPayment').innerHTML = resultsHtml;
            
        } catch (error) {
            console.error('Error searching students:', error);
        }
    }, 300);
}

// Select student for payment
async function selectStudentForPayment(studentId, studentName) {
    document.getElementById('paymentStudentId').value = studentId;
    document.getElementById('studentSearchPayment').value = studentName;
    document.getElementById('studentSearchResultsPayment').innerHTML = '';
    
    // Show student info
    document.getElementById('paymentStudentInfo').innerHTML = `
        <strong>${studentName}</strong><br>
        <small class="text-muted">Cargando información...</small>
    `;
    
    // Load student's pending invoices
    try {
        const response = await api.getInvoices({ studentId, status: 'PENDING' });
        const invoices = response.invoices || [];
        
        const invoiceSelect = document.getElementById('paymentInvoiceId');
        if (invoiceSelect) {
            invoiceSelect.innerHTML = '<option value="">Sin factura asociada</option>' +
                invoices.map(invoice => 
                    `<option value="${invoice.id}">${invoice.invoiceNumber} - ${formatCurrency(invoice.total)}</option>`
                ).join('');
        }
        
    } catch (error) {
        console.error('Error loading student invoices:', error);
    }
}

// Load invoice details when selected
async function loadInvoiceDetails() {
    const invoiceId = document.getElementById('paymentInvoiceId')?.value;
    if (!invoiceId) {
        document.getElementById('paymentInvoiceInfo').innerHTML = '';
        return;
    }
    
    try {
        const invoice = await api.getInvoice(invoiceId);
        document.getElementById('paymentInvoiceInfo').innerHTML = `
            <strong>${invoice.invoiceNumber}</strong><br>
            <small class="text-muted">Total: ${formatCurrency(invoice.total)} | Concepto: ${getConceptText(invoice.concept)}</small>
        `;
        
        // Suggest the invoice total as payment amount
        const amountInput = document.getElementById('paymentAmount');
        if (amountInput && !amountInput.value) {
            amountInput.value = invoice.total;
        }
        
    } catch (error) {
        console.error('Error loading invoice details:', error);
    }
}

// Load payment statistics
async function loadPaymentStats() {
    try {
        const stats = await api.getPaymentStats();
        
        // Update stats cards if they exist
        if (document.getElementById('totalPaymentsCount')) {
            document.getElementById('totalPaymentsCount').textContent = stats.totalPayments || 0;
        }
        if (document.getElementById('todayPaymentsCount')) {
            document.getElementById('todayPaymentsCount').textContent = stats.todayPayments || 0;
        }
        if (document.getElementById('monthPaymentsCount')) {
            document.getElementById('monthPaymentsCount').textContent = stats.monthPayments || 0;
        }
        if (document.getElementById('totalPaymentsAmount')) {
            document.getElementById('totalPaymentsAmount').textContent = formatCurrency(stats.totalAmount || 0);
        }
        if (document.getElementById('todayPaymentsAmount')) {
            document.getElementById('todayPaymentsAmount').textContent = formatCurrency(stats.todayAmount || 0);
        }
        if (document.getElementById('monthPaymentsAmount')) {
            document.getElementById('monthPaymentsAmount').textContent = formatCurrency(stats.monthAmount || 0);
        }
        
    } catch (error) {
        console.error('Error loading payment stats:', error);
    }
}

// Export payments to CSV
function exportPayments() {
    if (currentPayments.length === 0) {
        showNotification('No hay pagos para exportar', 'warning');
        return;
    }
    
    const headers = ['Número', 'Fecha', 'Estudiante', 'Factura', 'Monto', 'Método', 'Estado'];
    const data = [headers];
    
    currentPayments.forEach(payment => {
        data.push([
            payment.paymentNumber,
            formatDate(payment.date),
            `${payment.student?.firstName} ${payment.student?.lastName}`,
            payment.invoice?.invoiceNumber || 'N/A',
            payment.amount,
            getPaymentMethodText(payment.method),
            payment.status
        ]);
    });
    
    exportToCSV(data, 'pagos.csv');
    showNotification('Pagos exportados exitosamente', 'success');
}

// Initialize payments page
function initPayments() {
    // Load initial data
    loadPayments();
    loadPaymentStats();
    
    // Setup search with debounce
    const searchInput = document.getElementById('paymentSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchPayments, 300));
    }
    
    // Setup filter change handlers
    const statusFilter = document.getElementById('paymentStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', searchPayments);
    }
    
    const methodFilter = document.getElementById('paymentMethodFilter');
    if (methodFilter) {
        methodFilter.addEventListener('change', searchPayments);
    }
    
    const startDateFilter = document.getElementById('paymentStartDate');
    if (startDateFilter) {
        startDateFilter.addEventListener('change', searchPayments);
    }
    
    const endDateFilter = document.getElementById('paymentEndDate');
    if (endDateFilter) {
        endDateFilter.addEventListener('change', searchPayments);
    }
    
    // Setup student search
    const studentSearchInput = document.getElementById('studentSearchPayment');
    if (studentSearchInput) {
        studentSearchInput.addEventListener('input', searchStudentForPayment);
    }
    
    // Setup invoice selection
    const invoiceSelect = document.getElementById('paymentInvoiceId');
    if (invoiceSelect) {
        invoiceSelect.addEventListener('change', loadInvoiceDetails);
    }
    
    // Setup form submission
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            savePayment();
        });
    }
}

// Show create payment modal
function showCreatePaymentModal() {
    showPaymentModal(null, 'create');
}

// Get concept text for display
function getConceptText(concept) {
    const concepts = {
        'TUITION': 'Matrícula',
        'MONTHLY': 'Mensualidad',
        'EVENT': 'Evento',
        'UNIFORM': 'Uniforme',
        'BOOKS': 'Libros',
        'TRANSPORT': 'Transporte',
        'CAFETERIA': 'Cafetería',
        'OTHER': 'Otros'
    };
    return concepts[concept] || concept;
}