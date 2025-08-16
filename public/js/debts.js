// Debts Management - ARCHIVO COMPLETO CORREGIDO

let currentDebts = [];
let currentDebtsPage = 1;
let totalDebtsPages = 1;
let currentDebtsFilters = {};

// Load debts data
async function loadDebts(page = 1, filters = {}) {
    try {
        showLoading();
        
        const params = {
            page,
            limit: 20,
            ...filters
        };
        
        const response = await api.getDebts(params);
        
        currentDebts = response.debts || [];
        currentDebtsPage = response.pagination?.page || 1;
        totalDebtsPages = response.pagination?.pages || 1;
        currentDebtsFilters = filters;
        
        updateDebtsTable();
        updateDebtsPagination();
        
    } catch (error) {
        console.error('Error loading debts:', error);
        
        // Show specific error message
        const tbody = document.getElementById('debtsTableBody');
        if (tbody) {
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                tbody.innerHTML = `<tr><td colspan="11" class="text-center text-warning">
                    <i class="bi bi-exclamation-triangle"></i> Sesión expirada. 
                    <button class="btn btn-sm btn-primary ms-2" onclick="location.reload()">Recargar página</button>
                </td></tr>`;
            } else {
                tbody.innerHTML = `<tr><td colspan="11" class="text-center text-danger">
                    Error al cargar deudas: ${error.message}
                    <button class="btn btn-sm btn-outline-primary ms-2" onclick="refreshDebts()">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar
                    </button>
                </td></tr>`;
            }
        }
        
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Update debts table
function updateDebtsTable() {
    const tbody = document.getElementById('debtsTableBody');
    if (!tbody) return;
    
    if (currentDebts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center">No se encontraron deudas</td></tr>';
        return;
    }
    
    tbody.innerHTML = currentDebts.map(debt => `
        <tr class="${debt.isOverdue ? 'table-warning' : ''}">
            <td>
                <strong>${debt.student?.firstName} ${debt.student?.lastName}</strong><br>
                <small class="text-muted">${debt.student?.document}</small>
            </td>
            <td>${debt.student?.grade?.name} ${debt.student?.group?.name}</td>
            <td>${debt.invoiceNumber}</td>
            <td>${getConceptText(debt.concept)}</td>
            <td>${formatCurrency(debt.total)}</td>
            <td>${formatCurrency(debt.totalPaid)}</td>
            <td>
                <strong class="${debt.isOverdue ? 'text-danger' : 'text-warning'}">
                    ${formatCurrency(debt.pendingAmount)}
                </strong>
            </td>
            <td>${formatDate(debt.dueDate)}</td>
            <td>
                ${debt.daysOverdue > 0 ? 
                    `<span class="badge bg-danger">${debt.daysOverdue} días</span>` : 
                    '<span class="badge bg-success">Al día</span>'
                }
            </td>
            <td>
                <small>
                    ${debt.student?.phone ? `📱 ${debt.student.phone}<br>` : ''}
                    ${debt.student?.guardianPhone ? `👨‍👩‍👧‍👦 ${debt.student.guardianPhone}` : ''}
                </small>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-success" onclick="createPaymentForDebt('${debt.id}')" title="Registrar Pago">
                        <i class="bi bi-cash-coin"></i>
                    </button>
                    <button class="btn btn-outline-primary" onclick="viewInvoice('${debt.id}')" title="Ver Factura">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-info" onclick="contactDebtor('${debt.student?.phone || debt.student?.guardianPhone}')" title="Contactar">
                        <i class="bi bi-telephone"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update pagination
function updateDebtsPagination() {
    const paginationContainer = document.getElementById('debtsPagination');
    if (!paginationContainer) return;
    
    paginationContainer.innerHTML = generatePagination(currentDebtsPage, totalDebtsPages, 'loadDebtsPage');
}

// Load specific page
function loadDebtsPage(page) {
    if (page >= 1 && page <= totalDebtsPages) {
        loadDebts(page, currentDebtsFilters);
    }
}

// Search debts
function searchDebts() {
    const gradeFilter = document.getElementById('debtGradeFilter')?.value || '';
    const groupFilter = document.getElementById('debtGroupFilter')?.value || '';
    const minAmount = document.getElementById('minAmountFilter')?.value || '';
    const daysOverdue = document.getElementById('daysOverdueFilter')?.value || '';
    
    const filters = {};
    if (gradeFilter) filters.gradeId = gradeFilter;
    if (groupFilter) filters.groupId = groupFilter;
    if (minAmount) filters.minAmount = minAmount;
    if (daysOverdue) filters.daysOverdue = daysOverdue;
    
    loadDebts(1, filters);
}

// Clear filters
function clearDebtFilters() {
    document.getElementById('debtGradeFilter').value = '';
    document.getElementById('debtGroupFilter').value = '';
    document.getElementById('minAmountFilter').value = '';
    document.getElementById('daysOverdueFilter').value = '';
    loadDebts(1, {});
}

// Load debt statistics
async function loadDebtStats() {
    try {
        const stats = await api.getDebtsStats();
        
        // Update stats cards
        if (document.getElementById('totalDebtors')) {
            document.getElementById('totalDebtors').textContent = stats.totalDebtors || 0;
        }
        if (document.getElementById('overdueDebtors')) {
            document.getElementById('overdueDebtors').textContent = stats.overdueDebtors || 0;
        }
        if (document.getElementById('totalDebtAmount')) {
            document.getElementById('totalDebtAmount').textContent = formatCurrency(stats.totalDebtAmount || 0);
        }
        if (document.getElementById('overdueDebtAmount')) {
            document.getElementById('overdueDebtAmount').textContent = formatCurrency(stats.overdueDebtAmount || 0);
        }
        
    } catch (error) {
        console.error('Error loading debt stats:', error);
    }
}

// ===================================================
// FUNCIONES COMPLETADAS - REEMPLAZAR LAS ANTERIORES
// ===================================================

// Create payment for specific debt - FUNCIÓN CORREGIDA
async function createPaymentForDebt(invoiceId) {
    try {
        showLoading();
        console.log('🔄 Creating payment for debt, invoice ID:', invoiceId);
        
        // Obtener información detallada de la factura
        const response = await api.getInvoice(invoiceId);
        
        // CORREGIR: Manejar la estructura de respuesta correcta
        const invoice = response.success ? response.invoice : response;
        
        if (!invoice) {
            throw new Error('Factura no encontrada');
        }
        
        console.log('📄 Invoice loaded:', invoice);
        
        // CORREGIR: Calcular monto pendiente correctamente y redondear
        const totalPaid = invoice.totalPaid || 0;
        const pendingAmount = Math.round((invoice.total || 0) - totalPaid);
        
        console.log('💰 Amounts calculated:', {
            total: invoice.total,
            totalPaid: totalPaid,
            pendingAmount: pendingAmount
        });
        
        if (pendingAmount <= 0) {
            showNotification('Esta factura ya está completamente pagada', 'warning');
            return;
        }
        
        // Crear modal de pago simplificado para deudas
        const modalHtml = `
            <div class="modal fade" id="debtPaymentModal" tabindex="-1" aria-labelledby="debtPaymentModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title" id="debtPaymentModalLabel">
                                <i class="bi bi-cash-coin me-2"></i>Registrar Pago de Deuda
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Información de la factura (solo lectura) -->
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <div class="card border-info">
                                        <div class="card-header bg-info text-white">
                                            <h6 class="mb-0"><i class="bi bi-receipt me-2"></i>Factura</h6>
                                        </div>
                                        <div class="card-body">
                                            <p class="mb-1"><strong>Número:</strong> ${invoice.invoiceNumber || 'N/A'}</p>
                                            <p class="mb-1"><strong>Concepto:</strong> ${getConceptText(invoice.concept)}</p>
                                            <p class="mb-1"><strong>Total:</strong> ${formatCurrency(invoice.total || 0)}</p>
                                            <p class="mb-0"><strong class="text-danger">Pendiente:</strong> ${formatCurrency(pendingAmount)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card border-primary">
                                        <div class="card-header bg-primary text-white">
                                            <h6 class="mb-0"><i class="bi bi-person me-2"></i>Cliente</h6>
                                        </div>
                                        <div class="card-body">
                                            ${invoice.student ? `
                                                <p class="mb-1"><strong>Estudiante:</strong> ${invoice.student.firstName} ${invoice.student.lastName}</p>
                                                <p class="mb-1"><strong>Documento:</strong> ${invoice.student.document}</p>
                                                <p class="mb-1"><strong>Grado:</strong> ${invoice.student.grade?.name || 'N/A'}</p>
                                                <p class="mb-0"><strong>Grupo:</strong> ${invoice.student.group?.name || 'N/A'}</p>
                                            ` : `
                                                <p class="mb-1"><strong>Cliente:</strong> ${invoice.clientName || 'Cliente externo'}</p>
                                                <p class="mb-1"><strong>Documento:</strong> ${invoice.clientDocument || 'N/A'}</p>
                                                <p class="mb-0"><strong>Tipo:</strong> Factura externa</p>
                                            `}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Formulario de pago -->
                            <form id="debtPaymentForm">
                                <input type="hidden" id="debtInvoiceId" value="${invoice.id}">
                                <input type="hidden" id="debtStudentId" value="${invoice.studentId || ''}">
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="debtPaymentAmount" class="form-label">
                                                <i class="bi bi-currency-dollar me-1"></i>Monto del Pago *
                                            </label>
                                            <input type="number" class="form-control" id="debtPaymentAmount" 
                                                   value="${pendingAmount}" max="${pendingAmount}" min="0.01" step="0.01" required>
                                            <div class="form-text">Máximo: ${formatCurrency(pendingAmount)}</div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="debtPaymentMethod" class="form-label">
                                                <i class="bi bi-credit-card me-1"></i>Método de Pago *
                                            </label>
                                            <select class="form-select" id="debtPaymentMethod" required>
                                                <option value="">Seleccionar método</option>
                                                <option value="CASH">Efectivo</option>
                                                <option value="BANK_TRANSFER">Transferencia Bancaria</option>
                                                <option value="CARD">Tarjeta</option>
                                                <option value="CHECK">Cheque</option>
                                                <option value="OTHER">Otro</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="debtPaymentReference" class="form-label">
                                                <i class="bi bi-hash me-1"></i>Referencia
                                            </label>
                                            <input type="text" class="form-control" id="debtPaymentReference" 
                                                   placeholder="Número de transacción, cheque, etc.">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="debtPaymentDate" class="form-label">
                                                <i class="bi bi-calendar me-1"></i>Fecha del Pago
                                            </label>
                                            <input type="date" class="form-control" id="debtPaymentDate" 
                                                   value="${new Date().toISOString().split('T')[0]}">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="debtPaymentObservations" class="form-label">
                                        <i class="bi bi-chat-text me-1"></i>Observaciones
                                    </label>
                                    <textarea class="form-control" id="debtPaymentObservations" rows="3" 
                                             placeholder="Observaciones adicionales del pago..."></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle me-1"></i>Cancelar
                            </button>
                            <button type="button" class="btn btn-success" onclick="saveDebtPayment()">
                                <i class="bi bi-check-circle me-1"></i>Registrar Pago
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal existente si existe
        const existingModal = document.getElementById('debtPaymentModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('debtPaymentModal'));
        modal.show();
        
        // Limpiar modal al cerrarse
        document.getElementById('debtPaymentModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
        
    } catch (error) {
        console.error('❌ Error loading invoice for payment:', error);
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Guardar pago de deuda - FUNCIÓN CORREGIDA
async function saveDebtPayment() {
    const form = document.getElementById('debtPaymentForm');
    if (!form) {
        showNotification('Formulario no encontrado', 'error');
        return;
    }
    
    // Validar campos requeridos manualmente
    const amount = document.getElementById('debtPaymentAmount').value;
    const method = document.getElementById('debtPaymentMethod').value;
    const invoiceId = document.getElementById('debtInvoiceId').value;
    
    if (!amount || !method || !invoiceId) {
        showNotification('Por favor complete todos los campos requeridos', 'error');
        return;
    }
    
    if (parseFloat(amount) <= 0) {
        showNotification('El monto debe ser mayor a 0', 'error');
        return;
    }
    
    // CORREGIR: Construir datos del pago correctamente con validación mejorada
    const paymentData = {
        invoiceId: invoiceId, // Asegurar que no sea "undefined"
        amount: Math.round(parseFloat(amount) * 100) / 100, // Redondear a 2 decimales
        method: method,
        reference: document.getElementById('debtPaymentReference').value?.trim() || null,
        observations: document.getElementById('debtPaymentObservations').value?.trim() || null
    };
    
    // CORREGIR: Solo agregar studentId si existe y no está vacío
    const studentId = document.getElementById('debtStudentId').value;
    if (studentId && studentId !== '' && studentId !== 'undefined' && studentId !== 'null') {
        paymentData.studentId = studentId;
    }
    
    // Validación adicional del monto
    if (paymentData.amount <= 0 || isNaN(paymentData.amount)) {
        showNotification('Monto inválido', 'error');
        return;
    }
    
    // Validación del invoiceId
    if (!paymentData.invoiceId || paymentData.invoiceId === 'undefined') {
        showNotification('ID de factura inválido', 'error');
        return;
    }
    
    try {
        showLoading();
        console.log('💰 Saving debt payment:', paymentData);
        console.log('🔍 Debugging payment data:');
        console.log('- Invoice ID:', paymentData.invoiceId, typeof paymentData.invoiceId);
        console.log('- Student ID:', paymentData.studentId, typeof paymentData.studentId);
        console.log('- Amount:', paymentData.amount, typeof paymentData.amount);
        console.log('- Method:', paymentData.method, typeof paymentData.method);
        
        // Crear el pago con manejo de errores mejorado
        const result = await api.createPayment(paymentData);
        
        console.log('✅ Payment created successfully:', result);
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('debtPaymentModal'));
        if (modal) {
            modal.hide();
        }
        
        // Mostrar notificación de éxito
        showNotification('Pago registrado exitosamente', 'success');
        
        // Refrescar datos de deudas después de un pequeño delay
        setTimeout(async () => {
            await refreshDebts();
        }, 500);
        
    } catch (error) {
        console.error('❌ Error saving debt payment:', error);
        console.error('❌ Full error details:', {
            message: error.message,
            stack: error.stack,
            paymentData: paymentData
        });
        
        // Manejo específico de errores
        let errorMessage = 'Error al crear pago';
        
        if (error.message.includes('validación')) {
            errorMessage = 'Error de validación: ' + error.message;
        } else if (error.message.includes('500')) {
            errorMessage = 'Error interno del servidor. Verifique los datos e intente nuevamente.';
        } else if (error.message.includes('400')) {
            errorMessage = 'Datos del pago inválidos. Verifique la información.';
        }
        
        showNotification(errorMessage, 'error');
        
        // No cerrar el modal para que el usuario pueda corregir
        
    } finally {
        hideLoading();
    }
}

// View invoice details - FUNCIÓN COMPLETADA
async function viewInvoice(invoiceId) {
    try {
        showLoading();
        console.log('👁️ Viewing invoice:', invoiceId);
        
        // Obtener información detallada de la factura
        const invoice = await api.getInvoice(invoiceId);
        
        if (!invoice) {
            throw new Error('Factura no encontrada');
        }
        
        console.log('📄 Invoice loaded for viewing:', invoice);
        
        // Calcular información adicional
        const totalPaid = invoice.totalPaid || 0;
        const pendingAmount = invoice.total - totalPaid;
        const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID';
        
        // Crear y mostrar modal de visualización
        const modalHtml = `
            <div class="modal fade" id="invoiceViewModal" tabindex="-1" aria-labelledby="invoiceViewModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="invoiceViewModalLabel">
                                <i class="bi bi-receipt me-2"></i>Factura ${invoice.invoiceNumber}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Estado de la factura -->
                            <div class="row mb-4">
                                <div class="col-12">
                                    <div class="alert ${isOverdue ? 'alert-danger' : pendingAmount > 0 ? 'alert-warning' : 'alert-success'} mb-3">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong><i class="bi bi-info-circle me-1"></i>Estado: ${getStatusText(invoice.status)}</strong>
                                                ${isOverdue ? '<span class="badge bg-danger ms-2">VENCIDA</span>' : ''}
                                            </div>
                                            <div>
                                                ${pendingAmount > 0 ? `<strong class="text-danger">Pendiente: ${formatCurrency(pendingAmount)}</strong>` : '<strong class="text-success">PAGADA COMPLETAMENTE</strong>'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Información general -->
                            <div class="row mb-4">
                                <div class="col-md-4">
                                    <div class="card border-info">
                                        <div class="card-header bg-info text-white">
                                            <h6 class="mb-0"><i class="bi bi-receipt me-2"></i>Información de Factura</h6>
                                        </div>
                                        <div class="card-body">
                                            <p class="mb-2"><strong>Número:</strong> ${invoice.invoiceNumber}</p>
                                            <p class="mb-2"><strong>Fecha:</strong> ${formatDate(invoice.date)}</p>
                                            <p class="mb-2"><strong>Vencimiento:</strong> ${formatDate(invoice.dueDate)}</p>
                                            <p class="mb-0"><strong>Concepto:</strong> ${getConceptText(invoice.concept)}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-4">
                                    <div class="card border-success">
                                        <div class="card-header bg-success text-white">
                                            <h6 class="mb-0"><i class="bi bi-person me-2"></i>Estudiante</h6>
                                        </div>
                                        <div class="card-body">
                                            <p class="mb-2"><strong>Nombre:</strong> ${invoice.student?.firstName} ${invoice.student?.lastName}</p>
                                            <p class="mb-2"><strong>Documento:</strong> ${invoice.student?.document}</p>
                                            <p class="mb-2"><strong>Grado:</strong> ${invoice.student?.grade?.name || 'N/A'}</p>
                                            <p class="mb-0"><strong>Grupo:</strong> ${invoice.student?.group?.name || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-4">
                                    <div class="card border-warning">
                                        <div class="card-header bg-warning text-dark">
                                            <h6 class="mb-0"><i class="bi bi-currency-dollar me-2"></i>Resumen Financiero</h6>
                                        </div>
                                        <div class="card-body">
                                            <p class="mb-2"><strong>Subtotal:</strong> ${formatCurrency(invoice.subtotal)}</p>
                                            <p class="mb-2"><strong>IVA:</strong> ${formatCurrency(invoice.tax || 0)}</p>
                                            <p class="mb-2"><strong>Total:</strong> ${formatCurrency(invoice.total)}</p>
                                            <p class="mb-2"><strong>Pagado:</strong> ${formatCurrency(totalPaid)}</p>
                                            <p class="mb-0"><strong class="${pendingAmount > 0 ? 'text-danger' : 'text-success'}">Pendiente:</strong> ${formatCurrency(pendingAmount)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Items de la factura -->
                            <div class="row mb-4">
                                <div class="col-12">
                                    <div class="card">
                                        <div class="card-header bg-dark text-white">
                                            <h6 class="mb-0"><i class="bi bi-list-ul me-2"></i>Detalle de Items</h6>
                                        </div>
                                        <div class="card-body p-0">
                                            <div class="table-responsive">
                                                <table class="table table-striped mb-0">
                                                    <thead class="table-dark">
                                                        <tr>
                                                            <th>Descripción</th>
                                                            <th class="text-center">Cantidad</th>
                                                            <th class="text-end">Precio Unit.</th>
                                                            <th class="text-end">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        ${invoice.items?.map(item => `
                                                            <tr>
                                                                <td>${item.description}</td>
                                                                <td class="text-center">${item.quantity}</td>
                                                                <td class="text-end">${formatCurrency(item.unitPrice)}</td>
                                                                <td class="text-end">${formatCurrency(item.total)}</td>
                                                            </tr>
                                                        `).join('') || '<tr><td colspan="4" class="text-center">No hay items</td></tr>'}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Historial de pagos -->
                            ${invoice.payments && invoice.payments.length > 0 ? `
                                <div class="row mb-4">
                                    <div class="col-12">
                                        <div class="card">
                                            <div class="card-header bg-success text-white">
                                                <h6 class="mb-0"><i class="bi bi-clock-history me-2"></i>Historial de Pagos</h6>
                                            </div>
                                            <div class="card-body p-0">
                                                <div class="table-responsive">
                                                    <table class="table table-striped mb-0">
                                                        <thead class="table-success">
                                                            <tr>
                                                                <th>Fecha</th>
                                                                <th>Monto</th>
                                                                <th>Método</th>
                                                                <th>Referencia</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            ${invoice.payments.map(payment => `
                                                                <tr>
                                                                    <td>${formatDate(payment.date)}</td>
                                                                    <td>${formatCurrency(payment.amount)}</td>
                                                                    <td>${getPaymentMethodText(payment.method)}</td>
                                                                    <td>${payment.reference || 'N/A'}</td>
                                                                </tr>
                                                            `).join('')}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                            
                            <!-- Observaciones -->
                            ${invoice.observations ? `
                                <div class="row">
                                    <div class="col-12">
                                        <div class="card">
                                            <div class="card-header bg-secondary text-white">
                                                <h6 class="mb-0"><i class="bi bi-chat-text me-2"></i>Observaciones</h6>
                                            </div>
                                            <div class="card-body">
                                                <p class="mb-0">${invoice.observations}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <div class="btn-group me-auto">
                                ${pendingAmount > 0 ? `
                                    <button type="button" class="btn btn-success" onclick="closeViewModalAndCreatePayment('${invoice.id}')">
                                        <i class="bi bi-cash-coin me-1"></i>Registrar Pago
                                    </button>
                                ` : ''}
                                ${(invoice.student?.phone || invoice.student?.guardianPhone) ? `
                                    <button type="button" class="btn btn-primary" onclick="contactDebtor('${invoice.student?.phone || invoice.student?.guardianPhone}')">
                                        <i class="bi bi-telephone me-1"></i>Contactar
                                    </button>
                                ` : ''}
                            </div>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle me-1"></i>Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal existente si existe
        const existingModal = document.getElementById('invoiceViewModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('invoiceViewModal'));
        modal.show();
        
        // Limpiar modal al cerrarse
        document.getElementById('invoiceViewModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
        
    } catch (error) {
        console.error('❌ Error loading invoice for view:', error);
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Función auxiliar para cerrar modal de vista y abrir modal de pago
function closeViewModalAndCreatePayment(invoiceId) {
    const viewModal = bootstrap.Modal.getInstance(document.getElementById('invoiceViewModal'));
    if (viewModal) {
        viewModal.hide();
    }
    
    // Abrir modal de pago después de cerrar el de vista
    setTimeout(() => {
        createPaymentForDebt(invoiceId);
    }, 300);
}

// Función auxiliar para obtener texto del estado
function getStatusText(status) {
    const statusMap = {
        'PENDING': 'Pendiente',
        'PARTIAL': 'Pago Parcial',
        'PAID': 'Pagada',
        'CANCELLED': 'Cancelada'
    };
    return statusMap[status] || status;
}

// Función auxiliar para obtener texto del método de pago
function getPaymentMethodText(method) {
    const methodMap = {
        'CASH': 'Efectivo',
        'BANK_TRANSFER': 'Transferencia',
        'CARD': 'Tarjeta',
        'CHECK': 'Cheque',
        'OTHER': 'Otro'
    };
    return methodMap[method] || method;
}

// ===================================================
// RESTO DE FUNCIONES ORIGINALES (SIN CAMBIOS)
// ===================================================

// Contact debtor
function contactDebtor(phone) {
    if (!phone) {
        showNotification('No hay número de teléfono disponible', 'warning');
        return;
    }
    
    // Create WhatsApp link
    const message = encodeURIComponent('Hola, nos comunicamos desde I.E.D. Villas de San Pablo para recordarle sobre el pago pendiente de su factura. ¿Podríamos coordinar el pago?');
    const whatsappUrl = `https://wa.me/57${phone.replace(/\D/g, '')}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
}

// Filter groups by grade for debts
async function filterDebtGroupsByGrade() {
    const gradeId = document.getElementById('debtGradeFilter')?.value;
    const groupFilter = document.getElementById('debtGroupFilter');

    if (!groupFilter) return;

    try {
        if (!gradeId) {
            // If no grade selected, show all groups
            const groups = await api.getGroups();
            groupFilter.innerHTML = '<option value="">Todos los grupos</option>' +
                groups.map(group => `<option value="${group.id}">${group.grade?.name || ''} - ${group.name}</option>`).join('');
        } else {
            // Filter groups by selected grade
            const groups = await api.getGroups({ gradeId });
            groupFilter.innerHTML = '<option value="">Todos los grupos</option>' +
                groups.map(group => `<option value="${group.id}">${group.name}</option>`).join('');
        }
        
        // Clear group filter selection and trigger search
        groupFilter.value = '';
        
    } catch (error) {
        console.error('Error filtering groups:', error);
    }
}

// Refresh debts data
async function refreshDebts() {
    try {
        showLoading();
        await loadDebts(1, {});
        await loadDebtStats();
        showNotification('Datos actualizados correctamente', 'success');
    } catch (error) {
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Export debts to CSV
function exportDebts() {
    if (currentDebts.length === 0) {
        showNotification('No hay deudas para exportar', 'warning');
        return;
    }
    
    const headers = ['Estudiante', 'Documento', 'Grado', 'Grupo', 'Factura', 'Concepto', 'Total', 'Pagado', 'Pendiente', 'Vencimiento', 'Días Vencido', 'Teléfono', 'Teléfono Acudiente'];
    const data = [headers];
    
    currentDebts.forEach(debt => {
        data.push([
            `${debt.student?.firstName} ${debt.student?.lastName}`,
            debt.student?.document || '',
            debt.student?.grade?.name || '',
            debt.student?.group?.name || '',
            debt.invoiceNumber,
            getConceptText(debt.concept),
            debt.total,
            debt.totalPaid,
            debt.pendingAmount,
            formatDate(debt.dueDate),
            debt.daysOverdue,
            debt.student?.phone || '',
            debt.student?.guardianPhone || ''
        ]);
    });
    
    exportToCSV(data, 'deudores.csv');
    showNotification('Deudores exportados exitosamente', 'success');
}

// Initialize debts page
function initDebts() {
    // Load initial data
    loadDebts();
    loadDebtStats();
    
    // Load grades and groups for filters
    loadGradesForDebts();
    loadGroupsForDebts();
    
    // Setup filter change handlers
    const gradeFilter = document.getElementById('debtGradeFilter');
    if (gradeFilter) {
        gradeFilter.addEventListener('change', filterDebtGroupsByGrade);
    }
    
    const groupFilter = document.getElementById('debtGroupFilter');
    if (groupFilter) {
        groupFilter.addEventListener('change', searchDebts);
    }
    
    const minAmountFilter = document.getElementById('minAmountFilter');
    if (minAmountFilter) {
        minAmountFilter.addEventListener('input', debounce(searchDebts, 500));
    }
    
    const daysOverdueFilter = document.getElementById('daysOverdueFilter');
    if (daysOverdueFilter) {
        daysOverdueFilter.addEventListener('change', searchDebts);
    }
}

// Load grades for debt filters
async function loadGradesForDebts() {
    try {
        const grades = await api.getGrades();
        const gradeFilter = document.getElementById('debtGradeFilter');
        
        if (gradeFilter) {
            gradeFilter.innerHTML = '<option value="">Todos los grados</option>' +
                grades.map(grade => `<option value="${grade.id}">${grade.name}</option>`).join('');
        }
        
    } catch (error) {
        console.error('Error loading grades for debts:', error);
    }
}

// Load groups for debt filters
async function loadGroupsForDebts() {
    try {
        const groups = await api.getGroups();
        const groupFilter = document.getElementById('debtGroupFilter');
        
        if (groupFilter) {
            groupFilter.innerHTML = '<option value="">Todos los grupos</option>' +
                groups.map(group => `<option value="${group.id}">${group.grade?.name || ''} - ${group.name}</option>`).join('');
        }
        
    } catch (error) {
        console.error('Error loading groups for debts:', error);
    }
}