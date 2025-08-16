// ================================
// EVENTOS ESCOLARES - MÓDULO DE ASIGNACIONES
// ================================

// Variables globales para asignaciones
let assignmentsData = [];
let selectedEventForAssignments = null;
let assignmentsCurrentStudents = [];

// ================================
// INICIALIZACIÓN DEL MÓDULO DE ASIGNACIONES
// ================================

async function initEventAssignments() {
    try {
        console.log('🎯 Initializing Event Assignments Module...');

        // Verificar si ya está inicializado
        const assignmentsContent = document.getElementById('assignments-content');
        if (assignmentsContent && assignmentsContent.innerHTML.includes('assignmentEventSelect')) {
            console.log('✅ Event Assignments already initialized');
            return;
        }

        // Cargar el template de asignaciones (síncrono)
        loadAssignmentsTemplate();

        // Cargar eventos para el selector (asíncrono en background)
        loadEventsForAssignments().catch(error => {
            console.warn('⚠️ Could not load events for assignments:', error);
        });

        // Setup event listeners específicos
        setupAssignmentsEventListeners();

        console.log('✅ Event Assignments module initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing assignments module:', error);
        showError('Error al inicializar el módulo de asignaciones: ' + error.message);
    }
}

// Cargar template de asignaciones
function loadAssignmentsTemplate() {
    const assignmentsContent = document.getElementById('assignments-content');

    if (!assignmentsContent) {
        console.error('❌ Assignments content container not found');
        return;
    }

    assignmentsContent.innerHTML = `
        <!-- Event Selection -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Seleccionar Evento</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <select class="form-select" id="assignmentEventSelect" onchange="selectEventForAssignments(this.value)">
                            <option value="">Seleccionar evento...</option>
                        </select>
                    </div>
                    <div class="col-md-6" id="assignmentEventInfo">
                        <div class="text-muted">
                            <i class="bi bi-info-circle"></i> Selecciona un evento para ver y gestionar las asignaciones
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Assignment Actions -->
        <div id="assignmentActionsContainer" class="card mb-4" style="display: none;">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3">
                        <button class="btn btn-primary w-100" onclick="showAssignmentModal()">
                            <i class="bi bi-plus-circle"></i> Asignar Individual
                        </button>
                    </div>
                    <div class="col-md-3">
                        <button class="btn btn-success w-100" onclick="showBulkAssignmentModal()">
                            <i class="bi bi-people-fill"></i> Asignación Masiva
                        </button>
                    </div>
                    <div class="col-md-3">
                        <button class="btn btn-info w-100" onclick="showEventPaymentModal()">
                            <i class="bi bi-cash-coin"></i> Registrar Pago
                        </button>
                    </div>
                    <div class="col-md-3">
                        <button class="btn btn-outline-secondary w-100" onclick="exportAssignments()">
                            <i class="bi bi-download"></i> Exportar
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Assignments Stats -->
        <div id="assignmentStatsContainer" style="display: none;">
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center">
                            <h4 id="assignmentsTotalStudents">0</h4>
                            <p class="mb-0">Estudiantes</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body text-center">
                            <h4 id="assignmentsTotalTickets">0</h4>
                            <p class="mb-0">Boletos Asignados</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body text-center">
                            <h4 id="assignmentsTicketsSold">0</h4>
                            <p class="mb-0">Boletos Vendidos</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center">
                            <h4 id="assignmentsTotalRaised">$0</h4>
                            <p class="mb-0">Recaudado</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Assignments Table -->
        <div id="assignmentsTableContainer" class="card" style="display: none;">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Asignaciones del Evento</h5>
                <div>
                    <button class="btn btn-outline-success btn-sm me-2" onclick="exportAssignments()">
                        <i class="bi bi-download"></i> Exportar
                    </button>
                    <button class="btn btn-outline-primary btn-sm" onclick="refreshAssignments()">
                        <i class="bi bi-arrow-clockwise"></i> Actualizar
                    </button>
                </div>
            </div>
            <div class="card-body">
                <!-- Filters -->
                <div class="row mb-3">
                    <div class="col-md-3">
                        <select class="form-select form-select-sm" id="assignmentGradeFilter">
                            <option value="">Todos los grados</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select form-select-sm" id="assignmentGroupFilter">
                            <option value="">Todos los grupos</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select form-select-sm" id="assignmentStatusFilter">
                            <option value="">Todos los estados</option>
                            <option value="PENDING">Pendiente</option>
                            <option value="PARTIAL">Pago Parcial</option>
                            <option value="COMPLETED">Completado</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <button class="btn btn-primary btn-sm w-100" onclick="filterAssignments()">
                            <i class="bi bi-filter"></i> Filtrar
                        </button>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-hover table-sm">
                        <thead>
                            <tr>
                                <th>Estudiante</th>
                                <th>Grado</th>
                                <th>Grupo</th>
                                <th>Boletos Asignados</th>
                                <th>Boletos Vendidos</th>
                                <th>Valor Total</th>
                                <th>Pagado</th>
                                <th>Pendiente</th>
                                <th>Progreso</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="assignmentsTableBody">
                            <tr><td colspan="11" class="text-center">Selecciona un evento para ver asignaciones</td></tr>
                        </tbody>
                    </table>
                </div>
                <div id="assignmentsPagination" class="mt-3"></div>
            </div>
        </div>

        <!-- Assignment Modal -->
        ${getAssignmentModalTemplate()}

        <!-- Bulk Assignment Modal -->
        ${getBulkAssignmentModalTemplate()}

        <!-- Payment Modal -->
        ${getEventPaymentModalTemplate()}

        <!-- Payment History Modal -->
        ${getPaymentHistoryModalTemplate()}
    `;
}

// ================================
// TEMPLATES DE MODALES
// ================================

function getAssignmentModalTemplate() {
    return `
        <div class="modal fade" id="assignmentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Asignar Boletos a Estudiante</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="assignmentForm">
                            <div class="mb-3">
                                <label for="assignmentStudentSearch" class="form-label">Buscar Estudiante</label>
                                <input type="text" class="form-control" id="assignmentStudentSearch" 
                                       placeholder="Escriba el nombre o documento del estudiante..."
                                       oninput="searchStudentsForAssignment(this.value)">
                                <div id="assignmentStudentResults" class="mt-2"></div>
                                <input type="hidden" id="selectedStudentId" name="studentId">
                            </div>
                            <div class="mb-3">
                                <label for="ticketsAssigned" class="form-label">Número de Boletos</label>
                                <input type="number" class="form-control" id="ticketsAssigned" name="ticketsAssigned" 
                                       min="1" max="100" value="1" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Información del Estudiante Seleccionado</label>
                                <div id="selectedStudentInfo" class="p-3 bg-light rounded">
                                    <p class="text-muted mb-0">Ningún estudiante seleccionado</p>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="saveAssignment()">Asignar Boletos</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getBulkAssignmentModalTemplate() {
    return `
        <div class="modal fade" id="bulkAssignmentModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Asignación Masiva de Boletos</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="bulkAssignmentForm">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="bulkAssignmentType" class="form-label">Tipo de Asignación</label>
                                    <select class="form-select" id="bulkAssignmentType" onchange="toggleBulkAssignmentOptions()">
                                        <option value="">Seleccionar tipo</option>
                                        <option value="BY_GRADE">Por Grado</option>
                                        <option value="BY_GROUP">Por Grupo</option>
                                        <option value="MIXED">Grados y Grupos Específicos</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label for="bulkTicketsPerStudent" class="form-label">Boletos por Estudiante</label>
                                    <input type="number" class="form-control" id="bulkTicketsPerStudent" 
                                           min="1" max="100" value="1" required>
                                </div>
                            </div>

                            <!-- Grade Selection -->
                            <div id="bulkGradeSelection" style="display: none;">
                                <div class="mb-3">
                                    <label class="form-label">Seleccionar Grados</label>
                                    <div id="bulkGradeCheckboxes" class="row">
                                        <!-- Checkboxes will be populated here -->
                                    </div>
                                </div>
                            </div>

                            <!-- Group Selection -->
                            <div id="bulkGroupSelection" style="display: none;">
                                <div class="mb-3">
                                    <label class="form-label">Seleccionar Grupos</label>
                                    <div id="bulkGroupCheckboxes" class="row">
                                        <!-- Checkboxes will be populated here -->
                                    </div>
                                </div>
                            </div>

                            <!-- Mixed Selection -->
                            <div id="bulkMixedSelection" style="display: none;">
                                <div class="row">
                                    <div class="col-md-6">
                                        <label class="form-label">Grados</label>
                                        <div id="bulkMixedGradeCheckboxes">
                                            <!-- Checkboxes will be populated here -->
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Grupos</label>
                                        <div id="bulkMixedGroupCheckboxes">
                                            <!-- Checkboxes will be populated here -->
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Preview -->
                            <div id="bulkAssignmentPreview" class="mt-3" style="display: none;">
                                <div class="alert alert-info">
                                    <h6>Vista Previa de la Asignación</h6>
                                    <div id="bulkPreviewContent"></div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-info me-2" onclick="previewBulkAssignment()">Vista Previa</button>
                        <button type="button" class="btn btn-success" onclick="saveBulkAssignment()">Asignar Masivamente</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getPaymentHistoryModalTemplate() {
    return `
        <div class="modal fade" id="paymentHistoryModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="paymentHistoryModalTitle">Historial de Pagos del Evento</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <h6 id="paymentHistoryStudentInfo"></h6>
                            <p id="paymentHistoryEventInfo" class="text-muted"></p>
                        </div>
                        <div class="d-flex justify-content-end mb-3">
                            <button id="exportPaymentHistory" class="btn btn-sm btn-outline-success">
                                <i class="bi bi-download"></i> Exportar a CSV
                            </button>
                        </div>
                        <div class="table-responsive">
                            <table id="paymentHistoryTable" class="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>ID Pago</th>
                                        <th>Fecha</th>
                                        <th>Monto Pagado</th>
                                        <th>Método</th>
                                        <th>Referencia</th>
                                        <th>Observaciones</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="paymentHistoryTableBody">
                                    <!-- History rows will be populated here -->
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
}

function getEventPaymentModalTemplate() {
    return `
        <div class="modal fade" id="eventPaymentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Registrar Pago de Evento</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="eventPaymentForm">
                            <!-- Búsqueda de Estudiante -->
                            <div class="mb-3">
                                <label for="paymentStudentSearch" class="form-label">Buscar Estudiante *</label>
                                <input type="text" class="form-control" id="paymentStudentSearch" 
                                       placeholder="Escriba el nombre o documento del estudiante..."
                                       oninput="searchStudentsForPayment(this.value)" required>
                                <div id="paymentStudentResults" class="mt-2"></div>
                                <input type="hidden" id="paymentSelectedStudentId" name="studentId">
                            </div>

                            <!-- Información del Estudiante y Asignación -->
                            <div id="paymentStudentInfo" class="mb-3" style="display: none;">
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <h6 class="card-title">Información del Estudiante</h6>
                                        <div id="paymentStudentDetails"></div>
                                        <hr>
                                        <h6>Asignación del Evento</h6>
                                        <div id="paymentAssignmentDetails"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="paymentAmount" class="form-label">Monto *</label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control" id="paymentAmount" name="amount" 
                                                   min="0" step="0.01" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="paymentMethod" class="form-label">Método de Pago *</label>
                                        <select class="form-select" id="paymentMethod" name="method" required>
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
                                        <label for="paymentDate" class="form-label">Fecha</label>
                                        <input type="date" class="form-control" id="paymentDate" name="date">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="paymentReference" class="form-label">Referencia</label>
                                        <input type="text" class="form-control" id="paymentReference" name="reference" 
                                               placeholder="Número de transacción, cheque, etc.">
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="paymentObservations" class="form-label">Observaciones</label>
                                <textarea class="form-control" id="paymentObservations" name="observations" rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="saveEventPayment()">Registrar Pago</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ================================
// FUNCIONES PRINCIPALES DE ASIGNACIONES
// ================================

async function loadEventsForAssignments() {
    try {
        const events = await api.getEvents();
        const select = document.getElementById('assignmentEventSelect');

        if (!select) return;

        const availableEvents = events.filter(e =>
            e.status === 'ACTIVE' || e.status === 'PLANNING'
        );

        select.innerHTML = '<option value="">Seleccionar evento...</option>' +
            availableEvents.map(event => `
                <option value="${event.id}">
                    ${event.name} - ${formatCurrency(event.ticketPrice)} 
                    (${getEventStatusLabel(event.status)})
                </option>
            `).join('');

        console.log('✅ Events loaded for assignments:', availableEvents.length);
    } catch (error) {
        console.error('❌ Error loading events for assignments:', error);
        showError('Error al cargar eventos: ' + error.message);
    }
}

async function selectEventForAssignments(eventId) {
    try {
        if (!eventId) {
            hideAssignmentContainers();
            return;
        }

        console.log('🎯 Selecting event for assignments:', eventId);

        const event = await api.getEvent(eventId);
        selectedEventForAssignments = event;

        updateEventInfo(event);
        await loadEventAssignments(eventId);
        showAssignmentContainers();
        await loadAssignmentFilters();

        console.log('✅ Event selected for assignments:', event.name);
    } catch (error) {
        console.error('❌ Error selecting event for assignments:', error);
        showError('Error al seleccionar evento: ' + error.message);
    }
}

function updateEventInfo(event) {
    const infoContainer = document.getElementById('assignmentEventInfo');

    if (!infoContainer) return;

    infoContainer.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="me-3">
                <span class="badge ${getEventStatusClass(event.status)}">${getEventStatusLabel(event.status)}</span>
            </div>
            <div>
                <strong>${event.name}</strong><br>
                <small class="text-muted">
                    Precio: ${formatCurrency(event.ticketPrice)} | 
                    Meta: ${formatCurrency(event.fundraisingGoal)} |
                    Fecha: ${formatDateTime(event.eventDate)}
                </small>
            </div>
        </div>
    `;
}

async function loadEventAssignments(eventId) {
    try {
        console.log('📋 Loading event assignments for:', eventId);

        // CORREGIDO: Mostrar indicador de carga en la tabla
        const tbody = document.getElementById('assignmentsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <p class="mt-2 text-muted">Cargando asignaciones...</p>
                    </td>
                </tr>
            `;
        }

        const assignments = await api.getEventAssignments(eventId);
        assignmentsData = assignments;

        updateAssignmentsStats(assignments);
        renderAssignmentsTable(assignments);

        console.log('✅ Event assignments loaded:', assignments.length);
    } catch (error) {
        console.error('❌ Error loading event assignments:', error);

        // CORREGIDO: Mostrar error en la tabla si no se pueden cargar las asignaciones
        const tbody = document.getElementById('assignmentsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center py-4 text-danger">
                        <i class="bi bi-exclamation-circle fs-1"></i>
                        <p class="mt-2">Error al cargar asignaciones: ${error.message}</p>
                        <button class="btn btn-outline-primary btn-sm" onclick="loadEventAssignments('${eventId}')">
                            <i class="bi bi-arrow-clockwise"></i> Reintentar
                        </button>
                    </td>
                </tr>
            `;
        }

        showError('Error al cargar asignaciones: ' + error.message);
    }
}

function updateAssignmentsStats(assignments) {
    const totalStudents = assignments.length;
    const totalTickets = assignments.reduce((sum, a) => sum + a.ticketsAssigned, 0);
    const ticketsSold = assignments.reduce((sum, a) => sum + (a.ticketsSold || 0), 0);
    const totalRaised = assignments.reduce((sum, a) => sum + (a.amountRaised || 0), 0);

    document.getElementById('assignmentsTotalStudents').textContent = totalStudents;
    document.getElementById('assignmentsTotalTickets').textContent = totalTickets;
    document.getElementById('assignmentsTicketsSold').textContent = ticketsSold;
    document.getElementById('assignmentsTotalRaised').textContent = formatCurrency(totalRaised);
}

function renderAssignmentsTable(assignments) {
    const tbody = document.getElementById('assignmentsTableBody');

    if (!tbody) {
        console.error('❌ Assignments table body not found');
        return;
    }

    if (assignments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center py-4">
                    <i class="bi bi-person-x fs-1 text-muted"></i>
                    <p class="text-muted mt-2">No hay asignaciones para este evento</p>
                    <button class="btn btn-primary btn-sm" onclick="showBulkAssignmentModal()">
                        <i class="bi bi-plus-circle"></i> Crear Asignaciones
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = assignments.map(assignment => {
        const student = assignment.student;
        const ticketPrice = selectedEventForAssignments?.ticketPrice || 0;
        const totalValue = assignment.ticketsAssigned * ticketPrice;
        const paidValue = (assignment.amountRaised || 0);
        const pendingValue = totalValue - paidValue;
        const progress = totalValue > 0 ? Math.round((paidValue / totalValue) * 100) : 0;

        let status = 'PENDING';
        if (paidValue >= totalValue) {
            status = 'COMPLETED';
        } else if (paidValue > 0) {
            status = 'PARTIAL';
        }

        return `
            <tr>
                <td>
                    <div class="fw-bold">${student.firstName} ${student.lastName}</div>
                    <small class="text-muted">${student.document}</small>
                </td>
                <td>${student.grade?.name || 'N/A'}</td>
                <td>${student.group?.name || 'N/A'}</td>
                <td class="text-center">
                    <span class="badge bg-info">${assignment.ticketsAssigned}</span>
                </td>
                <td class="text-center">
                    <span class="badge bg-success">${assignment.ticketsSold || 0}</span>
                </td>
                <td>${formatCurrency(totalValue)}</td>
                <td class="text-success">${formatCurrency(paidValue)}</td>
                <td class="text-danger">${formatCurrency(pendingValue)}</td>
                <td>
                    <div class="progress" style="height: 20px; min-width: 80px;">
                        <div class="progress-bar ${progress === 100 ? 'bg-success' : progress > 0 ? 'bg-warning' : 'bg-danger'}" 
                             role="progressbar" style="width: ${progress}%" 
                             aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                            ${progress}%
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge ${getAssignmentStatusClass(status)}">${getAssignmentStatusLabel(status)}</span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editAssignment('${assignment.id}')" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="quickPayment('${assignment.id}')" title="Pago">
                            <i class="bi bi-cash"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="showPaymentHistory('${assignment.eventId}', '${assignment.studentId}')" title="Historial de Pagos">
                            <i class="bi bi-clock-history"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="unassignStudentFromEvent('${assignment.id}')" title="Desasignar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ================================
// FUNCIONES DE MODALES
// ================================

function showAssignmentModal() {
    if (!selectedEventForAssignments) {
        showError('Debe seleccionar un evento primero');
        return;
    }

    document.getElementById('assignmentForm').reset();
    document.getElementById('selectedStudentId').value = '';
    document.getElementById('assignmentStudentResults').innerHTML = '';
    document.getElementById('selectedStudentInfo').innerHTML = '<p class="text-muted mb-0">Ningún estudiante seleccionado</p>';

    const modal = new bootstrap.Modal(document.getElementById('assignmentModal'));
    modal.show();
}

async function showBulkAssignmentModal() {
    if (!selectedEventForAssignments) {
        showError('Debe seleccionar un evento primero');
        return;
    }

    document.getElementById('bulkAssignmentForm').reset();
    await loadGradesAndGroupsForBulkAssignment();

    const modal = new bootstrap.Modal(document.getElementById('bulkAssignmentModal'));
    modal.show();
}

function showEventPaymentModal() {
    if (!selectedEventForAssignments) {
        showError('Debe seleccionar un evento primero');
        return;
    }

    document.getElementById('eventPaymentForm').reset();
    document.getElementById('paymentSelectedStudentId').value = '';
    document.getElementById('paymentStudentResults').innerHTML = '';
    document.getElementById('paymentStudentInfo').style.display = 'none';
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];

    const modal = new bootstrap.Modal(document.getElementById('eventPaymentModal'));
    modal.show();
}

// ================================
// FUNCIONES DE BÚSQUEDA DE ESTUDIANTES
// ================================

async function searchStudentsForAssignment(query) {
    const resultsDiv = document.getElementById('assignmentStudentResults');

    if (!resultsDiv) return;

    if (query.length < 2) {
        resultsDiv.innerHTML = `
            <div class="text-center text-muted p-3">
                <i class="bi bi-search"></i>
                <p class="mb-0 mt-2">Escribe al menos 2 caracteres para buscar estudiantes</p>
            </div>
        `;
        return;
    }

    try {
        resultsDiv.innerHTML = `
            <div class="text-center p-3">
                <div class="spinner-border spinner-border-sm" role="status">
                    <span class="visually-hidden">Buscando...</span>
                </div>
                <p class="mb-0 mt-2">Buscando estudiantes...</p>
            </div>
        `;

        console.log('🔍 Searching students with query:', query);
        const students = await api.searchStudents(query);

        if (!Array.isArray(students)) {
            throw new Error('No se pudieron cargar los estudiantes');
        }

        const availableStudents = students.filter(student =>
            student && student.id && !assignmentsData.some(assignment => assignment.studentId === student.id)
        );

        if (availableStudents.length === 0) {
            resultsDiv.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle"></i>
                    <strong>No hay estudiantes disponibles</strong><br>
                    <small>Todos los estudiantes encontrados ya tienen asignación en este evento</small>
                </div>
            `;
            return;
        }

        const studentsWithInfo = await Promise.all(
            availableStudents.slice(0, 10).map(async (student) => {
                try {
                    const studentInfo = await api.getStudent(student.id);
                    return {
                        ...student,
                        ...studentInfo,
                        hasDebt: false,
                        otherEvents: 0
                    };
                } catch (error) {
                    console.warn('Could not load additional info for student:', student.id);
                    return student;
                }
            })
        );

        resultsDiv.innerHTML = `
            <div class="list-group">
                ${studentsWithInfo.map(student => `
                    <div class="list-group-item list-group-item-action student-result" 
                         onclick="selectStudentForAssignment('${student.id}', '${student.firstName}', '${student.lastName}', '${student.document}', '${student.grade?.name || 'N/A'}', '${student.group?.name || 'N/A'}')" 
                         style="cursor: pointer;">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <h6 class="mb-1">${student.firstName} ${student.lastName}</h6>
                                <p class="mb-1">
                                    <small class="text-muted">
                                        <i class="bi bi-card-text"></i> ${student.document} | 
                                        <i class="bi bi-mortarboard"></i> ${student.grade?.name || 'N/A'} - ${student.group?.name || 'N/A'}
                                    </small>
                                </p>
                                <div class="d-flex gap-3">
                                    <small class="text-info">
                                        <i class="bi bi-person"></i> Disponible para asignación
                                    </small>
                                    ${student.email ? `
                                        <small class="text-muted">
                                            <i class="bi bi-envelope"></i> ${student.email}
                                        </small>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="text-end">
                                <i class="bi bi-chevron-right text-muted"></i>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ${studentsWithInfo.length === 10 ? `
                <div class="text-center mt-2">
                    <small class="text-muted">Mostrando los primeros 10 resultados. Refina tu búsqueda para ver más.</small>
                </div>
            ` : ''}
        `;

    } catch (error) {
        console.error('❌ Error searching students:', error);
        resultsDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-circle"></i>
                <strong>Error al buscar estudiantes</strong><br>
                <small>${error.message}</small>
            </div>
        `;
    }
}

async function selectStudentForAssignment(studentId, firstName, lastName, documentNumber, grade, group) {
    if (typeof document === 'undefined' || !document.getElementById) {
        console.error('❌ Document object not available');
        return;
    }

    const selectedStudentIdEl = document.getElementById('selectedStudentId');
    const assignmentStudentSearchEl = document.getElementById('assignmentStudentSearch');
    const assignmentStudentResultsEl = document.getElementById('assignmentStudentResults');
    const selectedStudentInfoEl = document.getElementById('selectedStudentInfo');

    if (!selectedStudentIdEl || !assignmentStudentSearchEl || !assignmentStudentResultsEl || !selectedStudentInfoEl) {
        console.error('❌ Required DOM elements not found');
        return;
    }

    selectedStudentIdEl.value = studentId;
    assignmentStudentSearchEl.value = `${firstName} ${lastName}`;
    assignmentStudentResultsEl.innerHTML = '';

    selectedStudentInfoEl.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h6 class="card-title">${firstName} ${lastName}</h6>
                <div class="row">
                    <div class="col-md-6">
                        <small class="text-muted">Documento:</small><br>
                        <strong>${documentNumber}</strong>
                    </div>
                    <div class="col-md-6">
                        <small class="text-muted">Grado - Grupo:</small><br>
                        <strong>${grade} - ${group}</strong>
                    </div>
                </div>
                <div class="mt-2">
                    <div class="spinner-border spinner-border-sm" role="status">
                        <span class="visually-hidden">Cargando información adicional...</span>
                    </div>
                    <small class="text-muted ms-2">Cargando información contable...</small>
                </div>
            </div>
        </div>
    `;

    try {
        const [studentDetails, otherAssignments] = await Promise.all([
            api.getStudent(studentId).catch(() => null),
            api.getStudentEventAssignments ? api.getStudentEventAssignments(studentId).catch(() => []) : Promise.resolve([])
        ]);

        const otherEvents = otherAssignments.filter(assign => assign.eventId !== selectedEventForAssignments?.id);

        selectedStudentInfoEl.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h6 class="card-title">${firstName} ${lastName}</h6>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <small class="text-muted">Documento:</small><br>
                            <strong>${documentNumber}</strong>
                        </div>
                        <div class="col-md-6">
                            <small class="text-muted">Grado - Grupo:</small><br>
                            <strong>${grade} - ${group}</strong>
                        </div>
                    </div>

                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="text-center p-2 border rounded">
                                <div class="h5 mb-1 text-info">${otherEvents.length}</div>
                                <small class="text-muted">Otros Eventos</small>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="text-center p-2 border rounded">
                                <div class="h5 mb-1 text-success">
                                    <i class="bi bi-check-circle"></i>
                                </div>
                                <small class="text-muted">Disponible</small>
                            </div>
                        </div>
                    </div>

                    ${otherEvents.length > 0 ? `
                        <div class="mt-2">
                            <small class="text-muted">Eventos asignados:</small>
                            <div class="mt-1">
                                ${otherEvents.slice(0, 3).map(assign => `
                                    <span class="badge bg-light text-dark me-1">${assign.event?.name || 'Evento'}</span>
                                `).join('')}
                                ${otherEvents.length > 3 ? `<small class="text-muted">+${otherEvents.length - 3} más</small>` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error loading student additional info:', error);
    }
}

async function searchStudentsForPayment(query) {
    const resultsDiv = document.getElementById('paymentStudentResults');

    if (!resultsDiv) return;

    if (query.length < 2) {
        resultsDiv.innerHTML = '';
        document.getElementById('paymentStudentInfo').style.display = 'none';
        return;
    }

    try {
        const allStudents = await api.searchStudents(query);

        const studentsWithAssignment = allStudents.filter(student => {
            return assignmentsData.some(assignment => assignment.studentId === student.id);
        }).map(student => {
            const assignment = assignmentsData.find(a => a.studentId === student.id);
            return {
                ...assignment,
                student: student
            };
        });

        if (studentsWithAssignment.length === 0) {
            if (allStudents.length > 0) {
                resultsDiv.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle"></i>
                        Se encontraron ${allStudents.length} estudiante(s), pero ninguno tiene asignación en este evento.
                        <br><small>Puedes crear una asignación primero desde la pestaña de Asignaciones.</small>
                    </div>
                    ${allStudents.map(student => `
                        <div class="card mb-2 student-result-no-assignment" style="opacity: 0.6;">
                            <div class="card-body py-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>${student.firstName} ${student.lastName}</strong>
                                        <br><small class="text-muted">${student.document}</small>
                                    </div>
                                    <div class="text-end">
                                        <small class="text-muted">
                                            ${student.grade?.name || 'N/A'} - ${student.group?.name || 'N/A'}<br>
                                            <span class="text-warning">Sin asignación</span>
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                `;
            } else {
                resultsDiv.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle"></i>
                        No se encontraron estudiantes que coincidan con la búsqueda
                    </div>
                `;
            }
            return;
        }

        resultsDiv.innerHTML = studentsWithAssignment.map(assignment => {
            const student = assignment.student;
            const ticketPrice = selectedEventForAssignments?.ticketPrice || 0;
            const totalValue = assignment.ticketsAssigned * ticketPrice;
            const paidValue = assignment.amountRaised || 0;
            const pendingAmount = totalValue - paidValue;

            return `
                <div class="card mb-2 student-result" onclick="selectStudentForPayment('${assignment.id}', '${student.id}', '${student.firstName}', '${student.lastName}', '${student.document}', '${student.grade?.name || 'N/A'}', '${student.group?.name || 'N/A'}', ${assignment.ticketsAssigned}, ${assignment.ticketsSold || 0}, ${pendingAmount})" 
                     style="cursor: pointer;">
                    <div class="card-body py-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${student.firstName} ${student.lastName}</strong>
                                <br><small class="text-muted">${student.document}</small>
                            </div>
                            <div class="text-end">
                                <small class="text-muted">
                                    ${student.grade?.name || 'N/A'} - ${student.group?.name || 'N/A'}<br>
                                    Pendiente: ${formatCurrency(pendingAmount)}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('❌ Error searching students for payment:', error);
        resultsDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-circle"></i>
                Error al buscar estudiantes: ${error.message}
            </div>
        `;
    }
}

function selectStudentForPayment(assignmentId, studentId, firstName, lastName, document, grade, group, ticketsAssigned, ticketsSold, pendingAmount) {
    document.getElementById('paymentSelectedStudentId').value = studentId;
    document.getElementById('paymentStudentSearch').value = `${firstName} ${lastName}`;
    document.getElementById('paymentStudentResults').innerHTML = '';

    document.getElementById('paymentStudentDetails').innerHTML = `
        <p class="mb-1"><strong>${firstName} ${lastName}</strong></p>
        <p class="mb-1"><small>Documento: ${document}</small></p>
        <p class="mb-0"><small>Grado: ${grade} - Grupo: ${group}</small></p>
    `;

    document.getElementById('paymentAssignmentDetails').innerHTML = `
        <div class="row">
            <div class="col-6">
                <small class="text-muted">Boletos Asignados:</small><br>
                <strong>${ticketsAssigned}</strong>
            </div>
            <div class="col-6">
                <small class="text-muted">Boletos Vendidos:</small><br>
                <strong>${ticketsSold}</strong>
            </div>
        </div>
        <div class="row mt-2">
            <div class="col-6">
                <small class="text-muted">Boletos Pendientes:</small><br>
                <strong class="text-warning">${ticketsAssigned - ticketsSold}</strong>
            </div>
            <div class="col-6">
                <small class="text-muted">Monto Pendiente:</small><br>
                <strong class="text-danger">${formatCurrency(pendingAmount)}</strong>
            </div>
        </div>
        <div class="mt-2">
            <small class="text-info">
                Puedes registrar pagos parciales. El monto no debe superar el pendiente.
            </small>
        </div>
    `;

    const paymentAmountInput = document.getElementById('paymentAmount');
    if (paymentAmountInput) {
        paymentAmountInput.value = pendingAmount;
        paymentAmountInput.max = pendingAmount > 0 ? pendingAmount : '';
    }

    document.getElementById('paymentStudentInfo').style.display = 'block';
}

// ================================
// FUNCIONES DE GUARDADO
// ================================

async function saveAssignment() {
    try {
        const studentId = document.getElementById('selectedStudentId').value;
        const ticketsAssigned = parseInt(document.getElementById('ticketsAssigned').value);

        if (!studentId) {
            showError('Debe seleccionar un estudiante');
            return;
        }

        if (!ticketsAssigned || ticketsAssigned < 1) {
            showError('Debe especificar un número válido de boletos');
            return;
        }

        const assignmentData = {
            studentId,
            ticketsAssigned
        };

        await api.createEventAssignment(selectedEventForAssignments.id, assignmentData);

        showSuccess('Asignación creada exitosamente');

        bootstrap.Modal.getInstance(document.getElementById('assignmentModal')).hide();
        await loadEventAssignments(selectedEventForAssignments.id);

    } catch (error) {
        console.error('❌ Error saving assignment:', error);
        showError('Error al guardar asignación: ' + error.message);
    }
}

async function saveEventPayment() {
    try {
        const studentId = document.getElementById('paymentSelectedStudentId').value;
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const method = document.getElementById('paymentMethod').value;
        const reference = document.getElementById('paymentReference').value;
        const observations = document.getElementById('paymentObservations').value;

        if (!studentId) {
            showError('Debe seleccionar un estudiante');
            return;
        }

        if (!amount || amount <= 0) {
            showError('Debe especificar un monto válido');
            return;
        }

        const assignment = assignmentsData.find(a => a.studentId === studentId);
        if (assignment) {
            const ticketPrice = selectedEventForAssignments?.ticketPrice || 0;
            const totalValue = assignment.ticketsAssigned * ticketPrice;
            const pendingValue = totalValue - (assignment.amountRaised || 0);
            if (amount > pendingValue) {
                showError('El monto no puede ser mayor al pendiente');
                return;
            }
        }

        if (!method) {
            showError('Debe seleccionar un método de pago');
            return;
        }

        const paymentData = {
            studentId,
            amount,
            method,
            reference,
            observations
        };

        await api.createEventPayment(selectedEventForAssignments.id, paymentData);

        showSuccess('Pago registrado exitosamente');

        bootstrap.Modal.getInstance(document.getElementById('eventPaymentModal')).hide();

        // CORREGIDO: Actualizar datos y dashboard financiero
        await Promise.all([
            loadEventAssignments(selectedEventForAssignments.id),
            updateFinancialDashboardAfterPayment()
        ]);

    } catch (error) {
        console.error('❌ Error saving payment:', error);
        showError('Error al registrar pago: ' + error.message);
    }
}

// CORREGIDO: Función para actualizar dashboard financiero después de registrar pago
async function updateFinancialDashboardAfterPayment() {
    try {
        console.log('💰 Actualizando dashboard financiero después del pago...');

        // Verificar si existe la función de actualización del dashboard
        if (typeof window.refreshDashboard === 'function') {
            await window.refreshDashboard();
            console.log('✅ Dashboard principal actualizado');
        }

        // Solo actualizar dashboard financiero si estamos en esa página
        if (typeof window.loadFinancialOverview === 'function') {
            // Verificar si los elementos del dashboard financiero existen
            const financialElements = document.querySelector('#financialSummary, #incomeChart, #expenseChart');
            if (financialElements) {
                await window.loadFinancialOverview();
                console.log('✅ Dashboard financiero actualizado');
            } else {
                console.log('ℹ️ Dashboard financiero no está en la página actual, omitiendo actualización');
            }
        }

        // Disparar evento personalizado para otros módulos
        const paymentEvent = new CustomEvent('paymentRegistered', {
            detail: {
                eventId: selectedEventForAssignments?.id,
                timestamp: new Date().toISOString()
            }
        });
        window.dispatchEvent(paymentEvent);

    } catch (error) {
        console.warn('⚠️ Error actualizando dashboard financiero:', error);
        // No bloquear el flujo principal si falla la actualización del dashboard
    }
}

async function quickPayment(assignmentId) {
    try {
        console.log('💳 Quick payment for assignment:', assignmentId);

        const assignment = assignmentsData.find(a => a.id === assignmentId);
        if (!assignment) {
            showError('Asignación no encontrada');
            return;
        }

        const student = assignment.student;
        const ticketPrice = selectedEventForAssignments?.ticketPrice || 0;
        const totalValue = assignment.ticketsAssigned * ticketPrice;
        const paidValue = assignment.amountRaised || 0;
        const pendingAmount = totalValue - paidValue;

        if (pendingAmount <= 0) {
            showInfo('Esta asignación ya está completamente pagada');
            return;
        }

        const result = await Swal.fire({
            title: 'Registrar Pago',
            html: `
                <div class="text-start">
                    <div class="mb-3">
                        <strong>Estudiante:</strong> ${student.firstName} ${student.lastName}<br>
                        <strong>Documento:</strong> ${student.document}<br>
                        <strong>Grado:</strong> ${student.grade?.name || 'N/A'} - ${student.group?.name || 'N/A'}
                    </div>
                    
                    <div class="alert alert-info">
                        <div class="row">
                            <div class="col-6">
                                <small>Boletos Asignados:</small><br>
                                <strong>${assignment.ticketsAssigned}</strong>
                            </div>
                            <div class="col-6">
                                <small>Ya Pagado:</small><br>
                                <strong class="text-success">${formatCurrency(paidValue)}</strong>
                            </div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-6">
                                <small>Monto Total:</small><br>
                                <strong>${formatCurrency(totalValue)}</strong>
                            </div>
                            <div class="col-6">
                                <small>Monto Pendiente:</small><br>
                                <strong class="text-danger">${formatCurrency(pendingAmount)}</strong>
                            </div>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="quickPaymentType" class="form-label">Tipo de Pago:</label>
                        <select class="form-select" id="quickPaymentType" onchange="toggleQuickPaymentAmount()">
                            <option value="FULL">Pago Completo (${formatCurrency(pendingAmount)})</option>
                            <option value="PARTIAL">Pago Parcial</option>
                        </select>
                    </div>

                    <div class="mb-3" id="quickPaymentAmountContainer" style="display: none;">
                        <label for="quickPaymentAmount" class="form-label">Monto a Pagar:</label>
                        <div class="input-group">
                            <span class="input-group-text">$</span>
                            <input type="number" class="form-control" id="quickPaymentAmount" 
                                   min="0" max="${pendingAmount}" step="0.01" placeholder="Ingrese el monto">
                        </div>
                        <small class="text-muted">Máximo: ${formatCurrency(pendingAmount)}</small>
                    </div>

                    <div class="mb-3">
                        <label for="quickPaymentMethod" class="form-label">Método de Pago:</label>
                        <select class="form-select" id="quickPaymentMethod">
                            <option value="CASH">Efectivo</option>
                            <option value="BANK_TRANSFER">Transferencia</option>
                            <option value="CARD">Tarjeta</option>
                            <option value="CHECK">Cheque</option>
                            <option value="OTHER">Otro</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label for="quickPaymentReference" class="form-label">Referencia (opcional):</label>
                        <input type="text" class="form-control" id="quickPaymentReference" 
                               placeholder="Número de transacción, cheque, etc.">
                    </div>

                    <div class="mb-3">
                        <label for="quickPaymentObservations" class="form-label">Observaciones (opcional):</label>
                        <textarea class="form-control" id="quickPaymentObservations" rows="2" 
                                  placeholder="Notas adicionales sobre el pago"></textarea>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Registrar Pago',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745',
            width: '600px',
            didOpen: () => {
                window.toggleQuickPaymentAmount = function () {
                    const type = document.getElementById('quickPaymentType').value;
                    const container = document.getElementById('quickPaymentAmountContainer');
                    if (type === 'PARTIAL') {
                        container.style.display = 'block';
                        document.getElementById('quickPaymentAmount').required = true;
                    } else {
                        container.style.display = 'none';
                        document.getElementById('quickPaymentAmount').required = false;
                    }
                };
            },
            preConfirm: () => {
                const paymentType = document.getElementById('quickPaymentType').value;
                const method = document.getElementById('quickPaymentMethod').value;
                const reference = document.getElementById('quickPaymentReference').value;
                const observations = document.getElementById('quickPaymentObservations').value;

                let amount;
                if (paymentType === 'FULL') {
                    amount = pendingAmount;
                } else {
                    amount = parseFloat(document.getElementById('quickPaymentAmount').value);
                    if (!amount || amount <= 0) {
                        Swal.showValidationMessage('Ingrese un monto válido para el pago parcial');
                        return false;
                    }
                    if (amount > pendingAmount) {
                        Swal.showValidationMessage('El monto no puede ser mayor al pendiente');
                        return false;
                    }
                }

                if (!method) {
                    Swal.showValidationMessage('Seleccione un método de pago');
                    return false;
                }

                return {
                    amount: amount,
                    method: method,
                    reference: reference,
                    observations: observations || (paymentType === 'FULL' ? 'Pago completo' : 'Pago parcial')
                };
            }
        });

        if (result.isConfirmed && result.value) {
            const paymentData = {
                amount: result.value.amount,
                method: result.value.method,
                reference: result.value.reference,
                observations: result.value.observations,
                date: new Date().toISOString()
            };

            console.log('💰 Processing payment:', paymentData);
            await api.addPartialPayment(assignment.eventId, assignment.studentId, paymentData);

            showSuccess(`Pago de ${formatCurrency(result.value.amount)} registrado exitosamente`);
            await loadEventAssignments(selectedEventForAssignments.id);
        }
    } catch (error) {
        console.error('Error en el pago rápido:', error);
        showError('No se pudo registrar el pago: ' + error.message);
    }
}

// ========================================
// FUNCIONES DE HISTORIAL DE PAGOS
// ========================================

async function showPaymentHistory(eventId, studentId) {
    try {
        console.log(`🔍 Fetching payment history for event ${eventId} and student ${studentId}`);

        // CORREGIDO: Cerrar modal anterior si existe antes de abrir uno nuevo
        const existingModal = bootstrap.Modal.getInstance(document.getElementById('paymentHistoryModal'));
        if (existingModal) {
            existingModal.hide();
            // Esperar a que se cierre completamente
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        const modal = new bootstrap.Modal(document.getElementById('paymentHistoryModal'), {
            backdrop: 'static', // CORREGIDO: Prevenir cierre accidental
            keyboard: true
        });

        const modalTitle = document.getElementById('paymentHistoryModalTitle');
        const historyTableBody = document.getElementById('paymentHistoryTableBody');

        // Mostrar loading state
        modalTitle.textContent = 'Cargando historial de pagos...';
        historyTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-2 text-muted">Cargando historial de pagos...</p>
                </td>
            </tr>
        `;

        modal.show();

        // Cargar datos en paralelo
        const [history, student, event] = await Promise.all([
            api.getPaymentHistory(eventId, studentId),
            api.getStudent(studentId),
            Promise.resolve(selectedEventForAssignments)
        ]);

        if (!student || !event) {
            throw new Error('No se pudo cargar la información del estudiante o del evento.');
        }

        // Actualizar información del modal
        modalTitle.textContent = `Historial de Pagos - ${student.firstName} ${student.lastName}`;
        document.getElementById('paymentHistoryStudentInfo').textContent =
            `Estudiante: ${student.firstName} ${student.lastName} (${student.document})`;
        document.getElementById('paymentHistoryEventInfo').textContent =
            `Evento: ${event.name} - Precio por boleto: ${formatCurrency(event.ticketPrice)}`;

        // CORREGIDO: Configurar botón de exportación sin duplicar event listeners
        const exportButton = document.getElementById('exportPaymentHistory');
        if (exportButton) {
            // Remover listeners anteriores
            const newExportButton = exportButton.cloneNode(true);
            exportButton.parentNode.replaceChild(newExportButton, exportButton);

            // Agregar nuevo listener
            newExportButton.addEventListener('click', () => {
                console.log('📥 Exporting payment history...');
                exportPaymentHistoryToCSV(student, event, history);
            });
        }

        // Renderizar tabla de historial
        if (history.length === 0) {
            historyTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="bi bi-folder-x fs-1 text-muted"></i>
                        <p class="mt-2">No hay pagos registrados para este estudiante en este evento.</p>
                        <button class="btn btn-primary btn-sm" onclick="quickPayment('${getAssignmentIdByStudentId(studentId)}')">
                            <i class="bi bi-plus-circle"></i> Registrar Primer Pago
                        </button>
                    </td>
                </tr>
            `;
        } else {
            historyTableBody.innerHTML = history.map((payment, index) => {
                return `
                    <tr id="payment-row-${payment.id}">
                        <td><small class="text-muted">${payment.id}</small></td>
                        <td>${formatDateTime(payment.date)}</td>
                        <td><strong class="text-success">${formatCurrency(payment.amount)}</strong></td>
                        <td>
                            <span class="badge bg-secondary">${getPaymentMethodLabel(payment.method)}</span>
                        </td>
                        <td>${payment.reference || '<span class="text-muted">N/A</span>'}</td>
                        <td><small>${payment.observations || '<span class="text-muted">Sin observaciones</span>'}</small></td>
                        <td>
                            <button class="btn btn-sm btn-outline-danger" 
                                    onclick="deletePaymentFromHistory('${payment.id}', '${eventId}', '${studentId}')" 
                                    title="Eliminar Pago"
                                    data-payment-id="${payment.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        console.log(`✅ Payment history loaded successfully: ${history.length} payments`);

    } catch (error) {
        console.error('❌ Error showing payment history:', error);

        // CORREGIDO: Cerrar modal y mostrar error
        const modal = bootstrap.Modal.getInstance(document.getElementById('paymentHistoryModal'));
        if (modal) {
            modal.hide();
        }

        setTimeout(() => {
            Swal.fire({
                title: 'Error',
                text: 'Error al mostrar el historial de pagos: ' + error.message,
                icon: 'error',
                confirmButtonText: 'Entendido'
            });
        }, 300);
    }
}

function getAssignmentIdByStudentId(studentId) {
    const assignment = assignmentsData.find(a => a.studentId === studentId);
    return assignment ? assignment.id : null;
}

function getPaymentMethodLabel(method) {
    const methods = {
        'CASH': 'Efectivo',
        'BANK_TRANSFER': 'Transferencia',
        'CARD': 'Tarjeta',
        'CHECK': 'Cheque',
        'OTHER': 'Otro'
    };
    return methods[method] || method || 'No especificado';
}

// CORREGIDA: Función para obtener ID de asignación por ID de estudiante
function getAssignmentIdByStudentId(studentId) {
    if (!studentId || !Array.isArray(assignmentsData)) {
        console.warn('Invalid studentId or assignmentsData not available');
        return null;
    }

    const assignment = assignmentsData.find(a => a.studentId === studentId);
    return assignment ? assignment.id : null;
}

// CORREGIDA: Función para formatear fecha y hora de manera segura
function formatDateTime(dateString) {
    if (!dateString) return 'Fecha no disponible';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Fecha inválida';
        }

        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Error en fecha';
    }
}

// CORREGIDA: Función para formatear moneda de manera segura
function formatCurrency(amount) {
    if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
    }

    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// CORREGIDA: Función para mostrar mensajes de éxito
function showSuccess(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: '¡Éxito!',
            text: message,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    } else {
        console.log('✅ SUCCESS:', message);
        alert('Éxito: ' + message);
    }
}

// CORREGIDA: Función para mostrar mensajes de error
function showError(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Error',
            text: message,
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
    } else {
        console.error('❌ ERROR:', message);
        alert('Error: ' + message);
    }
}

// CORREGIDA: Función para mostrar mensajes informativos
function showInfo(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Información',
            text: message,
            icon: 'info',
            confirmButtonText: 'Entendido'
        });
    } else {
        console.log('ℹ️ INFO:', message);
        alert('Info: ' + message);
    }
}

async function deletePaymentFromHistory(paymentId, eventId, studentId) {
    try {
        console.log(`🗑️ Attempting to delete payment ${paymentId}`);

        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción eliminará el pago permanentemente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            allowOutsideClick: true,  // CORREGIDO: Permitir cerrar clickeando fuera
            allowEscapeKey: true,     // CORREGIDO: Permitir cerrar con ESC
            showLoaderOnConfirm: true, // CORREGIDO: Mostrar loader durante la operación
            preConfirm: async () => {
                try {
                    // Eliminar el pago
                    const deleteResult = await api.deletePayment(paymentId);
                    console.log('✅ Payment deletion result:', deleteResult);
                    return deleteResult;
                } catch (error) {
                    console.error('❌ Error in preConfirm:', error);
                    Swal.showValidationMessage(`Error: ${error.message}`);
                    return false;
                }
            }
        });

        if (result.isConfirmed && result.value) {
            // Mostrar mensaje de éxito
            await Swal.fire({
                title: '¡Eliminado!',
                text: 'El pago ha sido eliminado exitosamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });

            console.log('🔄 Refreshing payment history and assignments...');

            // CORREGIDO: Forzar limpieza de caché y recarga completa
            try {
                // Limpiar cualquier caché local
                if (window.assignmentsData) {
                    window.assignmentsData = [];
                }

                // Recargar datos en paralelo para mejor rendimiento
                await Promise.all([
                    showPaymentHistory(eventId, studentId),
                    loadEventAssignments(eventId),
                    updateFinancialDashboardAfterPayment() // Actualizar dashboard financiero
                ]);

                // Forzar actualización de estadísticas
                if (selectedEventForAssignments) {
                    const updatedAssignments = await api.getEventAssignments(eventId);
                    updateAssignmentsStats(updatedAssignments);
                }

                console.log('✅ Data refreshed successfully');
            } catch (refreshError) {
                console.error('❌ Error refreshing data:', refreshError);
                // Mostrar error pero no bloquear el flujo
                showError('Los datos se eliminaron correctamente, pero hubo un problema al actualizar la vista. Refresca la página si es necesario.');
            }

        } else if (result.dismiss) {
            console.log('ℹ️ Payment deletion cancelled by user');
        }

    } catch (error) {
        console.error('❌ Unexpected error in deletePaymentFromHistory:', error);

        // CORREGIDO: Cerrar cualquier modal abierto antes de mostrar error
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modal => {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            }
        });

        // Mostrar error después de un breve delay para permitir que se cierren los modales
        setTimeout(() => {
            Swal.fire({
                title: 'Error',
                text: 'Error al eliminar el pago: ' + error.message,
                icon: 'error',
                confirmButtonText: 'Entendido'
            });
        }, 300);
    }
}

function exportPaymentHistoryToCSV(student, event, history) {
    try {
        console.log('📥 Starting CSV export...');

        let csvContent = "data:text/csv;charset=utf-8,";

        const headers = [
            'ID Pago',
            'Fecha',
            'Monto Pagado',
            'Método',
            'Referencia',
            'Observaciones'
        ];
        csvContent += headers.map(h => `"${h}"`).join(',') + '\r\n';

        // Información del estudiante y evento
        csvContent += `"Estudiante","${student.firstName} ${student.lastName}","Documento","${student.document}","Evento","${event.name}"\r\n`;
        csvContent += `"","","","","",""\r\n`; // Línea vacía

        // Datos de pagos
        if (history.length > 0) {
            history.forEach(payment => {
                const row = [
                    payment.id || '',
                    formatDateTime(payment.date) || '',
                    payment.amount || 0,
                    getPaymentMethodLabel(payment.method) || '',
                    payment.reference || '',
                    payment.observations || ''
                ];
                csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\r\n';
            });
        } else {
            csvContent += `"Sin pagos registrados","","","","",""\r\n`;
        }

        // CORREGIDO: Crear y descargar archivo con mejor manejo de errores
        try {
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);

            const fileName = `HistorialPagos_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_${student.firstName}_${student.lastName}_${new Date().toISOString().split('T')[0]}.csv`;
            link.setAttribute("download", fileName);

            // CORREGIDO: Agregar al DOM temporalmente para asegurar la descarga
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('✅ CSV export completed:', fileName);

            // Mostrar confirmación
            Swal.fire({
                title: '¡Exportado!',
                text: 'El historial de pagos ha sido exportado exitosamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

        } catch (downloadError) {
            console.error('❌ Error during file download:', downloadError);
            throw new Error('Error al descargar el archivo');
        }

    } catch (error) {
        console.error('❌ Error exporting payment history:', error);
        Swal.fire({
            title: 'Error de Exportación',
            text: 'Error al exportar el historial: ' + error.message,
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
    }
}

// ================================
// FUNCIONES DE UTILIDAD
// ================================

function hideAssignmentContainers() {
    document.getElementById('assignmentActionsContainer').style.display = 'none';
    document.getElementById('assignmentStatsContainer').style.display = 'none';
    document.getElementById('assignmentsTableContainer').style.display = 'none';
}

function showAssignmentContainers() {
    document.getElementById('assignmentActionsContainer').style.display = 'block';
    document.getElementById('assignmentStatsContainer').style.display = 'block';
    document.getElementById('assignmentsTableContainer').style.display = 'block';
}

function getAssignmentStatusLabel(status) {
    const statuses = {
        'PENDING': 'Pendiente',
        'PARTIAL': 'Pago Parcial',
        'COMPLETED': 'Completado'
    };
    return statuses[status] || status;
}

function getAssignmentStatusClass(status) {
    const classes = {
        'PENDING': 'bg-warning',
        'PARTIAL': 'bg-info',
        'COMPLETED': 'bg-success'
    };
    return classes[status] || 'bg-secondary';
}

function refreshAssignments() {
    if (selectedEventForAssignments) {
        return loadEventAssignments(selectedEventForAssignments.id);
    }
}

function exportAssignments() {
    console.log('Export assignments functionality');
}

function setupAssignmentsEventListeners() {
    const gradeFilter = document.getElementById('assignmentGradeFilter');
    const groupFilter = document.getElementById('assignmentGroupFilter');
    const statusFilter = document.getElementById('assignmentStatusFilter');

    if (gradeFilter) {
        gradeFilter.addEventListener('change', filterAssignments);
    }

    if (groupFilter) {
        groupFilter.addEventListener('change', filterAssignments);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', filterAssignments);
    }

    console.log('✅ Assignment event listeners setup');
}

async function loadAssignmentFilters() {
    try {
        const gradeFilter = document.getElementById('assignmentGradeFilter');
        const groupFilter = document.getElementById('assignmentGroupFilter');

        if (gradeFilter && eventsCurrentGrades) {
            gradeFilter.innerHTML = '<option value="">Todos los grados</option>' +
                eventsCurrentGrades.map(grade => `
                    <option value="${grade.id}">${grade.name}</option>
                `).join('');
        }

        if (groupFilter && eventsCurrentGroups) {
            groupFilter.innerHTML = '<option value="">Todos los grupos</option>' +
                eventsCurrentGroups.map(group => `
                    <option value="${group.id}">${group.name} (${group.grade?.name || 'N/A'})</option>
                `).join('');
        }
    } catch (error) {
        console.error('❌ Error loading assignment filters:', error);
    }
}

function filterAssignments() {
    const gradeFilter = document.getElementById('assignmentGradeFilter')?.value;
    const groupFilter = document.getElementById('assignmentGroupFilter')?.value;
    const statusFilter = document.getElementById('assignmentStatusFilter')?.value;

    console.log('🔍 Filtering assignments:', { gradeFilter, groupFilter, statusFilter });

    if (!selectedEventForAssignments) {
        return;
    }

    loadEventAssignments(selectedEventForAssignments.id, {
        gradeId: gradeFilter || undefined,
        groupId: groupFilter || undefined,
        status: statusFilter || undefined
    });
}

function toggleBulkAssignmentOptions() {
    const assignmentType = document.getElementById('bulkAssignmentType')?.value;
    const gradeSelection = document.getElementById('bulkGradeSelection');
    const groupSelection = document.getElementById('bulkGroupSelection');
    const mixedSelection = document.getElementById('bulkMixedSelection');
    const previewContainer = document.getElementById('bulkAssignmentPreview');

    if (gradeSelection) gradeSelection.style.display = 'none';
    if (groupSelection) groupSelection.style.display = 'none';
    if (mixedSelection) mixedSelection.style.display = 'none';
    if (previewContainer) previewContainer.style.display = 'none';

    switch (assignmentType) {
        case 'BY_GRADE':
            if (gradeSelection) gradeSelection.style.display = 'block';
            break;
        case 'BY_GROUP':
            if (groupSelection) groupSelection.style.display = 'block';
            break;
        case 'MIXED':
            if (mixedSelection) mixedSelection.style.display = 'block';
            break;
        default:
            break;
    }

    console.log('✅ Bulk assignment options toggled for type:', assignmentType);
}

function previewBulkAssignment() {
    const assignmentType = document.getElementById('bulkAssignmentType')?.value;
    const ticketsPerStudent = parseInt(document.getElementById('bulkTicketsPerStudent')?.value) || 1;
    const previewContainer = document.getElementById('bulkAssignmentPreview');
    const previewContent = document.getElementById('bulkPreviewContent');

    if (!assignmentType) {
        showError('Selecciona un tipo de asignación');
        return;
    }

    if (!previewContainer || !previewContent) {
        console.error('Preview containers not found');
        return;
    }

    let selectedItems = [];
    let previewText = '';

    try {
        switch (assignmentType) {
            case 'BY_GRADE':
                const selectedGrades = Array.from(document.querySelectorAll('#bulkGradeCheckboxes input:checked'))
                    .map(cb => ({ id: cb.value, name: cb.nextElementSibling.textContent }));
                selectedItems = selectedGrades;
                previewText = `Se asignarán ${ticketsPerStudent} boleto(s) a todos los estudiantes de ${selectedGrades.length} grado(s)`;
                break;

            case 'BY_GROUP':
                const selectedGroups = Array.from(document.querySelectorAll('#bulkGroupCheckboxes input:checked'))
                    .map(cb => ({ id: cb.value, name: cb.nextElementSibling.textContent }));
                selectedItems = selectedGroups;
                previewText = `Se asignarán ${ticketsPerStudent} boleto(s) a todos los estudiantes de ${selectedGroups.length} grupo(s)`;
                break;

            case 'MIXED':
                const mixedGrades = Array.from(document.querySelectorAll('#bulkMixedGradeCheckboxes input:checked'))
                    .map(cb => ({ id: cb.value, name: cb.nextElementSibling.textContent, type: 'grade' }));
                const mixedGroups = Array.from(document.querySelectorAll('#bulkMixedGroupCheckboxes input:checked'))
                    .map(cb => ({ id: cb.value, name: cb.nextElementSibling.textContent, type: 'group' }));
                selectedItems = [...mixedGrades, ...mixedGroups];
                previewText = `Se asignarán ${ticketsPerStudent} boleto(s) a estudiantes de ${mixedGrades.length} grado(s) y ${mixedGroups.length} grupo(s)`;
                break;
        }

        if (selectedItems.length === 0) {
            showError('Selecciona al menos un grado o grupo');
            return;
        }

        previewContent.innerHTML = `
            <p><strong>${previewText}</strong></p>
            <div class="mt-2">
                <small class="text-muted">Elementos seleccionados:</small>
                <div class="mt-1">
                    ${selectedItems.map(item => `
                        <span class="badge bg-light text-dark me-1">${item.name}</span>
                    `).join('')}
                </div>
            </div>
            <div class="mt-2">
                <small class="text-info">
                    <i class="bi bi-info-circle"></i>
                    Precio por boleto: ${formatCurrency(selectedEventForAssignments?.ticketPrice || 0)}
                </small>
            </div>
        `;

        previewContainer.style.display = 'block';

    } catch (error) {
        console.error('Error generating preview:', error);
        showError('Error al generar vista previa');
    }
}

async function saveBulkAssignment() {
    try {
        const assignmentType = document.getElementById('bulkAssignmentType')?.value;
        const ticketsPerStudent = parseInt(document.getElementById('bulkTicketsPerStudent')?.value) || 1;

        if (!assignmentType) {
            showError('Selecciona un tipo de asignación');
            return;
        }

        if (!selectedEventForAssignments) {
            showError('No hay evento seleccionado');
            return;
        }

        let selectedGradeIds = [];
        let selectedGroupIds = [];

        switch (assignmentType) {
            case 'BY_GRADE':
                selectedGradeIds = Array.from(document.querySelectorAll('#bulkGradeCheckboxes input:checked'))
                    .map(cb => cb.value);
                break;

            case 'BY_GROUP':
                selectedGroupIds = Array.from(document.querySelectorAll('#bulkGroupCheckboxes input:checked'))
                    .map(cb => cb.value);
                break;

            case 'MIXED':
                selectedGradeIds = Array.from(document.querySelectorAll('#bulkMixedGradeCheckboxes input:checked'))
                    .map(cb => cb.value);
                selectedGroupIds = Array.from(document.querySelectorAll('#bulkMixedGroupCheckboxes input:checked'))
                    .map(cb => cb.value);
                break;
        }

        if (selectedGradeIds.length === 0 && selectedGroupIds.length === 0) {
            showError('Selecciona al menos un grado o grupo');
            return;
        }

        const assignmentData = {
            gradeIds: selectedGradeIds,
            groupIds: selectedGroupIds,
            ticketsPerStudent: ticketsPerStudent
        };

        console.log('📤 Sending bulk assignment:', assignmentData);

        const result = await api.createBulkEventAssignment(selectedEventForAssignments.id, assignmentData);

        showSuccess(`Asignación masiva completada: ${result.assignmentsCreated} asignaciones creadas`);

        bootstrap.Modal.getInstance(document.getElementById('bulkAssignmentModal')).hide();
        await loadEventAssignments(selectedEventForAssignments.id);

    } catch (error) {
        console.error('❌ Error saving bulk assignment:', error);
        showError('Error al guardar asignación masiva: ' + error.message);
    }
}

async function editAssignment(assignmentId) {
    try {
        console.log('✏️ Editing assignment:', assignmentId);

        const assignment = assignmentsData.find(a => a.id === assignmentId);

        if (!assignment) {
            showError('Asignación no encontrada');
            return;
        }

        const student = assignment.student;

        document.getElementById('assignmentStudentSearch').value = `${student.firstName} ${student.lastName}`;
        document.getElementById('selectedStudentId').value = student.id;
        document.getElementById('ticketsAssigned').value = assignment.ticketsAssigned;

        document.getElementById('selectedStudentInfo').innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h6 class="card-title">${student.firstName} ${student.lastName}</h6>
                    <div class="row">
                        <div class="col-md-6">
                            <small class="text-muted">Documento:</small><br>
                            <strong>${student.document}</strong>
                        </div>
                        <div class="col-md-6">
                            <small class="text-muted">Grado - Grupo:</small><br>
                            <strong>${student.grade?.name || 'N/A'} - ${student.group?.name || 'N/A'}</strong>
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-md-6">
                            <small class="text-muted">Boletos Vendidos:</small><br>
                            <strong class="text-success">${assignment.ticketsSold || 0}</strong>
                        </div>
                        <div class="col-md-6">
                            <small class="text-muted">Monto Recaudado:</small><br>
                            <strong class="text-success">${formatCurrency(assignment.amountRaised || 0)}</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.querySelector('#assignmentModal .modal-title').textContent = 'Editar Asignación';

        let assignmentIdInput = document.getElementById('editingAssignmentId');
        if (!assignmentIdInput) {
            assignmentIdInput = document.createElement('input');
            assignmentIdInput.type = 'hidden';
            assignmentIdInput.id = 'editingAssignmentId';
            document.getElementById('assignmentForm').appendChild(assignmentIdInput);
        }
        assignmentIdInput.value = assignmentId;

        const modal = new bootstrap.Modal(document.getElementById('assignmentModal'));
        modal.show();

    } catch (error) {
        console.error('❌ Error editing assignment:', error);
        showError('Error al editar asignación: ' + error.message);
    }
}

async function unassignStudentFromEvent(assignmentId) {
    try {
        console.log('🗑️ Unassigning student from event:', assignmentId);

        const assignment = assignmentsData.find(a => a.id === assignmentId);
        if (!assignment) {
            showError('Asignación no encontrada');
            return;
        }

        const student = assignment.student;
        const hasPaidAmount = assignment.amountRaised > 0;

        let confirmationConfig = {
            title: '¿Desasignar estudiante?',
            text: `Se eliminará la asignación de ${student.firstName} ${student.lastName}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, desasignar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545'
        };

        if (hasPaidAmount) {
            confirmationConfig = {
                title: '⚠️ Atención',
                html: `
                    <div class="text-start">
                        <p>El estudiante <strong>${student.firstName} ${student.lastName}</strong> ya tiene pagos registrados por un total de <strong>${formatCurrency(assignment.amountRaised)}</strong>.</p>
                        <p>¿Estás seguro de que quieres desasignar este estudiante?</p>
                        <p class="text-danger"><small>Los pagos registrados se mantendrán en el historial.</small></p>
                    </div>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, desasignar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#dc3545'
            };
        }

        const result = await Swal.fire(confirmationConfig);

        if (result.isConfirmed) {
            await api.deleteEventAssignment(selectedEventForAssignments.id, assignmentId);
            showSuccess('Estudiante desasignado exitosamente');
            await loadEventAssignments(selectedEventForAssignments.id);
        }

    } catch (error) {
        console.error('❌ Error unassigning student:', error);
        showError('Error al desasignar estudiante: ' + error.message);
    }
}

async function loadGradesAndGroupsForBulkAssignment() {
    try {
        console.log('📋 Loading grades and groups for bulk assignment');

        const [grades, groups] = await Promise.all([
            api.getGrades(),
            api.getGroups()
        ]);

        const bulkGradeCheckboxes = document.getElementById('bulkGradeCheckboxes');
        const bulkMixedGradeCheckboxes = document.getElementById('bulkMixedGradeCheckboxes');

        if (bulkGradeCheckboxes && bulkMixedGradeCheckboxes) {
            const gradeCheckboxHTML = grades.map(grade => `
                <div class="col-md-6 mb-2">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="${grade.id}" id="grade_${grade.id}">
                        <label class="form-check-label" for="grade_${grade.id}">
                            ${grade.name}
                        </label>
                    </div>
                </div>
            `).join('');

            bulkGradeCheckboxes.innerHTML = gradeCheckboxHTML;
            bulkMixedGradeCheckboxes.innerHTML = gradeCheckboxHTML.replace(/grade_/g, 'mixed_grade_');
        }

        const bulkGroupCheckboxes = document.getElementById('bulkGroupCheckboxes');
        const bulkMixedGroupCheckboxes = document.getElementById('bulkMixedGroupCheckboxes');

        if (bulkGroupCheckboxes && bulkMixedGroupCheckboxes) {
            const groupCheckboxHTML = groups.map(group => `
                <div class="col-md-6 mb-2">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="${group.id}" id="group_${group.id}">
                        <label class="form-check-label" for="group_${group.id}">
                            ${group.name} (${group.grade?.name || 'Sin grado'})
                        </label>
                    </div>
                </div>
            `).join('');

            bulkGroupCheckboxes.innerHTML = groupCheckboxHTML;
            bulkMixedGroupCheckboxes.innerHTML = groupCheckboxHTML.replace(/group_/g, 'mixed_group_');
        }

        console.log('✅ Grades and groups loaded for bulk assignment');
    } catch (error) {
        console.error('❌ Error loading grades and groups:', error);
        showError('Error al cargar grados y grupos: ' + error.message);
    }
}

// Exponer funciones globalmente
window.initEventAssignments = initEventAssignments;
window.selectEventForAssignments = selectEventForAssignments;
window.showAssignmentModal = showAssignmentModal;
window.showBulkAssignmentModal = showBulkAssignmentModal;
window.showEventPaymentModal = showEventPaymentModal;
window.searchStudentsForAssignment = searchStudentsForAssignment;
window.selectStudentForAssignment = selectStudentForAssignment;
window.searchStudentsForPayment = searchStudentsForPayment;
window.selectStudentForPayment = selectStudentForPayment;
window.saveAssignment = saveAssignment;
window.saveEventPayment = saveEventPayment;
window.saveBulkAssignment = saveBulkAssignment;
window.quickPayment = quickPayment;
window.editAssignment = editAssignment;
window.unassignStudentFromEvent = unassignStudentFromEvent;
window.showPaymentHistory = showPaymentHistory;
window.deletePaymentFromHistory = deletePaymentFromHistory;
window.refreshAssignments = refreshAssignments;
window.exportAssignments = exportAssignments;
window.filterAssignments = filterAssignments;
window.toggleBulkAssignmentOptions = toggleBulkAssignmentOptions;
window.previewBulkAssignment = previewBulkAssignment;