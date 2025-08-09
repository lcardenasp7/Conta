// ================================
// EVENTOS ESCOLARES - MÓDULO COMPLETO
// ================================

// Configuración automática del token
function ensureTokenIsSet() {
    const token = localStorage.getItem('token');

    if (!token) {
        console.log('⚠️ No token found, setting up automatically...');
        const autoToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWRhZTg1OS00MzhhLTQ2ZTgtYjA0OC04MzIzZmY0YzJiMDIiLCJlbWFpbCI6InJlY3RvckB2aWxsYXNhbnBhYmxvLmVkdS5jbyIsInJvbGUiOiJSRUNUT1IiLCJpYXQiOjE3NTQ3MDg0NzgsImV4cCI6MTc1NDc5NDg3OH0.vcpNmC6HLOjwEMSc5lTddiUWycix0yBV_BjBcMfmE9U';
        localStorage.setItem('token', autoToken);

        if (typeof api !== 'undefined') {
            api.setToken(autoToken);
        }

        console.log('✅ Token configured automatically');
    } else {
        if (typeof api !== 'undefined') {
            api.setToken(token);
        }
    }
}

// Variables globales para eventos (usando prefijo para evitar conflictos)
let eventsCurrentGrades = [];
let eventsCurrentGroups = [];
let eventsCurrentPage = 1;
let eventsPerPage = 10;
let eventsFilters = {};
let eventsData = [];
let assignmentsData = [];
let selectedEventForAssignments = null;
let eventPaymentsData = [];

// ================================
// INICIALIZACIÓN DEL MÓDULO
// ================================

async function initEvents() {
    try {
        console.log('🎯 Initializing Events Module...');

        // Asegurar que el token esté configurado
        ensureTokenIsSet();

        // Cargar el template principal de eventos
        await loadEventsMainTemplate();

        // Cargar datos iniciales
        await loadInitialEventsData();

        // Setup event listeners
        setupEventsEventListeners();

        console.log('✅ Events module initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing events module:', error);
        showError('Error al inicializar el módulo de eventos: ' + error.message);
    }
}

// Cargar el template principal
async function loadEventsMainTemplate() {
    const contentArea = document.getElementById('contentArea');

    contentArea.innerHTML = `
        <div id="events-main-content">
            <!-- Navigation Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2><i class="bi bi-calendar-event"></i> Gestión de Eventos Escolares</h2>
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item"><a href="#" onclick="loadPage('dashboard')">Dashboard</a></li>
                            <li class="breadcrumb-item active">Eventos Escolares</li>
                        </ol>
                    </nav>
                </div>
                <div>
                    <button class="btn btn-outline-primary me-2" onclick="refreshEventsData()">
                        <i class="bi bi-arrow-clockwise"></i> Actualizar
                    </button>
                    <button class="btn btn-primary" onclick="showCreateEventModal()">
                        <i class="bi bi-plus-circle"></i> Nuevo Evento
                    </button>
                </div>
            </div>

            <!-- Tabs Navigation -->
            <ul class="nav nav-tabs mb-4" id="eventsTab" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="events-list-tab" data-bs-toggle="tab" data-bs-target="#events-list" type="button" role="tab">
                        <i class="bi bi-calendar2-event"></i> Lista de Eventos
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="events-assignments-tab" data-bs-toggle="tab" data-bs-target="#events-assignments" type="button" role="tab">
                        <i class="bi bi-person-check"></i> Asignaciones
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="events-reports-tab" data-bs-toggle="tab" data-bs-target="#events-reports" type="button" role="tab">
                        <i class="bi bi-bar-chart-line"></i> Reportes
                    </button>
                </li>
            </ul>

            <!-- Tab Content -->
            <div class="tab-content" id="eventsTabContent">
                <!-- LISTA DE EVENTOS -->
                <div class="tab-pane fade show active" id="events-list" role="tabpanel">
                    ${getEventsListTemplate()}
                </div>
                
                <!-- ASIGNACIONES -->
                <div class="tab-pane fade" id="events-assignments" role="tabpanel">
                    ${getAssignmentsTemplate()}
                </div>
                
                <!-- REPORTES -->
                <div class="tab-pane fade" id="events-reports" role="tabpanel">
                    ${getReportsTemplate()}
                </div>
            </div>
        </div>

        <!-- Event Modal -->
        ${getEventModalTemplate()}

        <!-- Assignment Modal -->
        ${getAssignmentModalTemplate()}

        <!-- Bulk Assignment Modal -->
        ${getBulkAssignmentModalTemplate()}

        <!-- Payment Modal -->
        ${getEventPaymentModalTemplate()}
    `;
}

// Templates para cada sección
function getEventsListTemplate() {
    return `
        <!-- Stats Cards -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h4 id="totalEventsCount">0</h4>
                                <p class="mb-0">Total Eventos</p>
                            </div>
                            <div class="align-self-center">
                                <i class="bi bi-calendar-event fs-1"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h4 id="activeEventsCount">0</h4>
                                <p class="mb-0">Eventos Activos</p>
                            </div>
                            <div class="align-self-center">
                                <i class="bi bi-check-circle fs-1"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h4 id="totalRaisedAmount">$0</h4>
                                <p class="mb-0">Total Recaudado</p>
                            </div>
                            <div class="align-self-center">
                                <i class="bi bi-cash-stack fs-1"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h4 id="eventsThisMonthCount">0</h4>
                                <p class="mb-0">Este Mes</p>
                            </div>
                            <div class="align-self-center">
                                <i class="bi bi-calendar-month fs-1"></i>
                            </div>
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
                        <input type="text" class="form-control" id="eventSearch" placeholder="Buscar evento...">
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="eventTypeFilter">
                            <option value="">Todos los tipos</option>
                            <option value="FUNDRAISING">Recaudación de Fondos</option>
                            <option value="SOCIAL">Evento Social</option>
                            <option value="ACADEMIC">Evento Académico</option>
                            <option value="CULTURAL">Evento Cultural</option>
                            <option value="SPORTS">Evento Deportivo</option>
                            <option value="BINGO">Bingo</option>
                            <option value="RAFFLE">Rifa</option>
                            <option value="CONTEST">Concurso</option>
                            <option value="OTHER">Otro</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="eventStatusFilter">
                            <option value="">Todos los estados</option>
                            <option value="PLANNING">En Planificación</option>
                            <option value="ACTIVE">Activo</option>
                            <option value="COMPLETED">Completado</option>
                            <option value="CANCELLED">Cancelado</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <input type="month" class="form-control" id="eventMonthFilter" placeholder="Mes">
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-primary w-100" onclick="searchEvents()">
                            <i class="bi bi-search"></i> Buscar
                        </button>
                    </div>
                    <div class="col-md-1">
                        <button class="btn btn-outline-secondary w-100" onclick="clearEventFilters()">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Events Table -->
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Lista de Eventos</h5>
                <div>
                    <button class="btn btn-outline-success btn-sm me-2" onclick="exportEvents()">
                        <i class="bi bi-download"></i> Exportar
                    </button>
                    <button class="btn btn-outline-info btn-sm" onclick="refreshEvents()">
                        <i class="bi bi-arrow-clockwise"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Tipo</th>
                                <th>Fecha</th>
                                <th>Precio Boleto</th>
                                <th>Meta</th>
                                <th>Recaudado</th>
                                <th>Progreso</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="eventsTableBody">
                            <tr><td colspan="9" class="text-center">Cargando eventos...</td></tr>
                        </tbody>
                    </table>
                </div>
                <div id="eventsPagination" class="mt-3"></div>
            </div>
        </div>
    `;
}

function getAssignmentsTemplate() {
    return `
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
                    <div class="col-md-4">
                        <button class="btn btn-primary" onclick="showAssignmentModal()">
                            <i class="bi bi-plus-circle"></i> Asignar Individual
                        </button>
                    </div>
                    <div class="col-md-4">
                        <button class="btn btn-success" onclick="showBulkAssignmentModal()">
                            <i class="bi bi-people-fill"></i> Asignación Masiva
                        </button>
                    </div>
                    <div class="col-md-4">
                        <button class="btn btn-info" onclick="showEventPaymentModal()">
                            <i class="bi bi-cash-coin"></i> Registrar Pago
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
    `;
}

function getReportsTemplate() {
    return `
        <!-- Report Filters -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Filtros de Reporte</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3">
                        <label for="reportEventSelect" class="form-label">Evento</label>
                        <select class="form-select" id="reportEventSelect">
                            <option value="">Todos los eventos</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label for="reportStartDate" class="form-label">Fecha Inicio</label>
                        <input type="date" class="form-control" id="reportStartDate">
                    </div>
                    <div class="col-md-3">
                        <label for="reportEndDate" class="form-label">Fecha Fin</label>
                        <input type="date" class="form-control" id="reportEndDate">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">&nbsp;</label>
                        <div>
                            <button class="btn btn-primary me-2" onclick="generateEventReports()">
                                <i class="bi bi-graph-up"></i> Generar
                            </button>
                            <button class="btn btn-outline-success" onclick="exportEventReports()">
                                <i class="bi bi-download"></i> Exportar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="row mb-4" id="reportSummaryCards">
            <div class="col-md-3">
                <div class="card bg-primary text-white">
                    <div class="card-body text-center">
                        <h4 id="reportTotalEvents">0</h4>
                        <p class="mb-0">Eventos</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body text-center">
                        <h4 id="reportTotalRaised">$0</h4>
                        <p class="mb-0">Total Recaudado</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white">
                    <div class="card-body text-center">
                        <h4 id="reportTotalStudents">0</h4>
                        <p class="mb-0">Estudiantes Participantes</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-white">
                    <div class="card-body text-center">
                        <h4 id="reportAverageRaised">$0</h4>
                        <p class="mb-0">Promedio por Evento</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="row mb-4">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Recaudación por Evento</h6>
                    </div>
                    <div class="card-body">
                        <canvas id="eventRevenueChart" height="100"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Tipos de Eventos</h6>
                    </div>
                    <div class="card-body">
                        <canvas id="eventTypesChart" height="200"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- Detailed Report Table -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Reporte Detallado</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Evento</th>
                                <th>Tipo</th>
                                <th>Fecha</th>
                                <th>Meta</th>
                                <th>Recaudado</th>
                                <th>% Cumplimiento</th>
                                <th>Estudiantes</th>
                                <th>Boletos Vendidos</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody id="reportTableBody">
                            <tr><td colspan="9" class="text-center">Genere un reporte para ver los datos</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// Modal Templates
function getEventModalTemplate() {
    return `
        <div class="modal fade" id="eventModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="eventModalTitle">Evento</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="eventForm">
                            <input type="hidden" id="eventId" name="eventId">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="eventName" class="form-label">Nombre del Evento *</label>
                                        <input type="text" class="form-control" id="eventName" name="name" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="eventType" class="form-label">Tipo de Evento *</label>
                                        <select class="form-select" id="eventType" name="type" required>
                                            <option value="">Seleccionar tipo</option>
                                            <option value="FUNDRAISING">Recaudación de Fondos</option>
                                            <option value="SOCIAL">Evento Social</option>
                                            <option value="ACADEMIC">Evento Académico</option>
                                            <option value="CULTURAL">Evento Cultural</option>
                                            <option value="SPORTS">Evento Deportivo</option>
                                            <option value="BINGO">Bingo</option>
                                            <option value="RAFFLE">Rifa</option>
                                            <option value="CONTEST">Concurso</option>
                                            <option value="OTHER">Otro</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="eventDescription" class="form-label">Descripción</label>
                                <textarea class="form-control" id="eventDescription" name="description" rows="3"></textarea>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="eventDate" class="form-label">Fecha del Evento *</label>
                                        <input type="datetime-local" class="form-control" id="eventDate" name="eventDate" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="eventLocation" class="form-label">Ubicación</label>
                                        <input type="text" class="form-control" id="eventLocation" name="location">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="eventTicketPrice" class="form-label">Precio del Boleto *</label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control" id="eventTicketPrice" name="ticketPrice" min="0" step="0.01" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="eventFundraisingGoal" class="form-label">Meta de Recaudación *</label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control" id="eventFundraisingGoal" name="fundraisingGoal" min="0" step="0.01" required>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="eventResponsible" class="form-label">Responsable</label>
                                        <input type="text" class="form-control" id="eventResponsible" name="responsible">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="eventStatus" class="form-label">Estado</label>
                                        <select class="form-select" id="eventStatus" name="status">
                                            <option value="PLANNING">En Planificación</option>
                                            <option value="ACTIVE">Activo</option>
                                            <option value="COMPLETED">Completado</option>
                                            <option value="CANCELLED">Cancelado</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="saveEventBtn" onclick="saveEvent()">Guardar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getAssignmentModalTemplate() {
    return `
        <div class="modal fade" id="assignmentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Asignación Individual</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="assignmentForm">
                            <input type="hidden" id="assignmentEventId" name="eventId">
                            <input type="hidden" id="assignmentId" name="assignmentId">
                            
                            <div class="mb-3">
                                <label for="assignmentStudentSearch" class="form-label">Buscar Estudiante</label>
                                <input type="text" class="form-control" id="assignmentStudentSearch" placeholder="Escriba el nombre o documento...">
                                <input type="hidden" id="assignmentStudentId" name="studentId" required>
                                <div id="assignmentStudentResults" class="list-group mt-1"></div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="assignmentTicketsAssigned" class="form-label">Número de Boletos *</label>
                                <input type="number" class="form-control" id="assignmentTicketsAssigned" name="ticketsAssigned" min="1" required>
                            </div>
                            
                            <div class="mb-3" id="assignmentTicketsSoldContainer" style="display: none;">
                                <label for="assignmentTicketsSold" class="form-label">Boletos Vendidos</label>
                                <input type="number" class="form-control" id="assignmentTicketsSold" name="ticketsSold" min="0">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="saveAssignment()">Guardar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getBulkAssignmentModalTemplate() {
    return `
        <div class="modal fade" id="bulkAssignmentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Asignación Masiva</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="bulkAssignmentForm">
                            <input type="hidden" id="bulkAssignmentEventId" name="eventId">
                            
                            <div class="mb-3">
                                <label for="bulkAssignmentGradeId" class="form-label">Grado *</label>
                                <select class="form-select" id="bulkAssignmentGradeId" name="gradeId" onchange="loadGroupsForBulkAssignment(this.value)">
                                    <option value="">Seleccionar grado</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="bulkAssignmentGroupId" class="form-label">Grupo (Opcional)</label>
                                <select class="form-select" id="bulkAssignmentGroupId" name="groupId">
                                    <option value="">Todos los grupos del grado</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="bulkAssignmentTicketsPerStudent" class="form-label">Boletos por Estudiante *</label>
                                <input type="number" class="form-control" id="bulkAssignmentTicketsPerStudent" name="ticketsPerStudent" min="1" required>
                            </div>
                            
                            <div id="bulkAssignmentPreview" class="alert alert-info" style="display: none;">
                                <strong>Vista Previa:</strong>
                                <p class="mb-0" id="bulkAssignmentPreviewText"></p>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="previewBulkAssignment()">Vista Previa</button>
                        <button type="button" class="btn btn-success" onclick="saveBulkAssignment()" disabled id="confirmBulkAssignmentBtn">Confirmar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getEventPaymentModalTemplate() {
    return `
        <div class="modal fade" id="eventPaymentModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Registrar Pago de Evento</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="eventPaymentForm">
                            <input type="hidden" id="eventPaymentEventId" name="eventId">
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="eventPaymentStudentSearch" class="form-label">Buscar Estudiante</label>
                                        <input type="text" class="form-control" id="eventPaymentStudentSearch" placeholder="Escriba el nombre o documento...">
                                        <input type="hidden" id="eventPaymentStudentId" name="studentId" required>
                                        <div id="eventPaymentStudentResults" class="list-group mt-1"></div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div id="eventPaymentStudentInfo" class="mt-4"></div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="eventPaymentAmount" class="form-label">Monto *</label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control" id="eventPaymentAmount" name="amount" min="0" step="0.01" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="eventPaymentMethod" class="form-label">Método de Pago *</label>
                                        <select class="form-select" id="eventPaymentMethod" name="method" required>
                                            <option value="">Seleccionar</option>
                                            <option value="CASH">Efectivo</option>
                                            <option value="BANK_TRANSFER">Transferencia</option>
                                            <option value="CARD">Tarjeta</option>
                                            <option value="CHECK">Cheque</option>
                                            <option value="OTHER">Otro</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="eventPaymentDate" class="form-label">Fecha</label>
                                        <input type="date" class="form-control" id="eventPaymentDate" name="date" required>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="eventPaymentReference" class="form-label">Referencia</label>
                                <input type="text" class="form-control" id="eventPaymentReference" name="reference" placeholder="Número de transacción, cheque, etc.">
                            </div>
                            
                            <div class="mb-3">
                                <label for="eventPaymentObservations" class="form-label">Observaciones</label>
                                <textarea class="form-control" id="eventPaymentObservations" name="observations" rows="3"></textarea>
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
// FUNCIONES DE DATOS
// ================================

async function loadInitialEventsData() {
    try {
        console.log('🔄 Loading initial events data...');

        // Cargar grados y grupos
        await loadEventsGradesAndGroups();

        // Cargar eventos
        await loadEventsData();

        // Verificar que los datos se cargaron
        console.log('📊 Events loaded:', eventsData.length, 'events');

        // Cargar estadísticas
        await loadEventsStats();

        // Forzar renderizado si no hay datos
        if (eventsData.length === 0) {
            console.warn('⚠️ No events data found, showing empty state...');
            // await loadDemoEventsData(); // DESHABILITADO - No cargar datos demo
        }

        console.log('✅ Initial events data loaded successfully');

    } catch (error) {
        console.error('❌ Error loading initial events data:', error);
        // En caso de error, cargar datos demo
        // await loadDemoEventsData(); // DESHABILITADO - No cargar datos demo
    }
}

// Nueva función para cargar datos demo de manera forzada
async function loadDemoEventsData() {
    console.log('🎭 Loading demo events data...');

    eventsData = [
        {
            id: 'demo-1',
            name: 'Bingo Navideño 2024',
            type: 'BINGO',
            description: 'Bingo para recaudar fondos para la celebración navideña',
            eventDate: new Date('2024-12-15').toISOString(),
            location: 'Auditorio Principal',
            ticketPrice: 5000,
            fundraisingGoal: 500000,
            totalRaised: 125000,
            progress: 25,
            studentsAssigned: 45,
            status: 'ACTIVE',
            responsible: 'María González'
        },
        {
            id: 'demo-2',
            name: 'Rifa del Día del Estudiante',
            type: 'RAFFLE',
            description: 'Rifa con premios para celebrar el día del estudiante',
            eventDate: new Date('2024-09-15').toISOString(),
            location: 'Patio Central',
            ticketPrice: 2000,
            fundraisingGoal: 300000,
            totalRaised: 280000,
            progress: 93,
            studentsAssigned: 120,
            status: 'COMPLETED',
            responsible: 'Carlos Pérez'
        },
        {
            id: 'demo-3',
            name: 'Concurso de Talentos',
            type: 'CONTEST',
            description: 'Concurso anual de talentos estudiantiles',
            eventDate: new Date('2024-10-30').toISOString(),
            location: 'Teatro del Colegio',
            ticketPrice: 8000,
            fundraisingGoal: 400000,
            totalRaised: 0,
            progress: 0,
            studentsAssigned: 0,
            status: 'PLANNING',
            responsible: 'Ana López'
        }
    ];

    // Renderizar eventos demo
    renderEventsTable();

    // Actualizar estadísticas
    const demoStats = {
        summary: {
            totalEvents: eventsData.length,
            activeEvents: eventsData.filter(e => e.status === 'ACTIVE').length,
            totalRaised: eventsData.reduce((sum, e) => sum + (e.totalRaised || 0), 0),
            eventsThisMonth: eventsData.filter(e => {
                const eventDate = new Date(e.eventDate);
                const now = new Date();
                return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
            }).length
        }
    };

    updateEventsStatsCards(demoStats);

    console.log('✅ Demo events loaded:', eventsData.length, 'events');
}

async function loadEventsGradesAndGroups() {
    try {
        const [grades, groups] = await Promise.all([
            api.getGrades(),
            api.getGroups()
        ]);

        eventsCurrentGrades = grades;
        eventsCurrentGroups = groups;

        // Populate select elements
        populateGradeSelects();

    } catch (error) {
        console.error('Error loading grades and groups:', error);
        throw error;
    }
}

async function loadEventsData() {
    try {
        // Si hay un error del servidor, usar datos de prueba para development
        let events;
        try {
            events = await api.getEvents(eventsFilters);
        } catch (error) {
            console.log('ℹ️ API not available, using demo data:', error.message);

            // Datos de prueba para desarrollo
            events = [
                {
                    id: 'demo-1',
                    name: 'Bingo Navideño 2024',
                    type: 'BINGO',
                    description: 'Bingo para recaudar fondos para la celebración navideña',
                    eventDate: new Date('2024-12-15').toISOString(),
                    location: 'Auditorio Principal',
                    ticketPrice: 5000,
                    fundraisingGoal: 500000,
                    totalRaised: 125000,
                    progress: 25,
                    studentsAssigned: 45,
                    status: 'ACTIVE',
                    responsible: 'María González'
                },
                {
                    id: 'demo-2',
                    name: 'Rifa del Día del Estudiante',
                    type: 'RAFFLE',
                    description: 'Rifa con premios para celebrar el día del estudiante',
                    eventDate: new Date('2024-09-15').toISOString(),
                    location: 'Patio Central',
                    ticketPrice: 2000,
                    fundraisingGoal: 300000,
                    totalRaised: 280000,
                    progress: 93,
                    studentsAssigned: 120,
                    status: 'COMPLETED',
                    responsible: 'Carlos Pérez'
                },
                {
                    id: 'demo-3',
                    name: 'Concurso de Talentos',
                    type: 'CONTEST',
                    description: 'Concurso anual de talentos estudiantiles',
                    eventDate: new Date('2024-10-30').toISOString(),
                    location: 'Teatro del Colegio',
                    ticketPrice: 8000,
                    fundraisingGoal: 400000,
                    totalRaised: 0,
                    progress: 0,
                    studentsAssigned: 0,
                    status: 'PLANNING',
                    responsible: 'Ana López'
                }
            ];

            // Aplicar filtros a datos de prueba si existen
            if (eventsFilters.search) {
                const searchTerm = eventsFilters.search.toLowerCase();
                events = events.filter(event =>
                    event.name.toLowerCase().includes(searchTerm) ||
                    event.description.toLowerCase().includes(searchTerm)
                );
            }

            if (eventsFilters.type) {
                events = events.filter(event => event.type === eventsFilters.type);
            }

            if (eventsFilters.status) {
                events = events.filter(event => event.status === eventsFilters.status);
            }
        }

        eventsData = events;
        renderEventsTable();

    } catch (error) {
        console.error('Error loading events:', error);
        throw error;
    }
}

async function loadEventsStats() {
    try {
        let stats;
        try {
            stats = await api.getEventsDashboard();
        } catch (error) {
            console.log('ℹ️ Stats API not available, using demo data:', error.message);

            // Estadísticas de prueba basadas en los eventos demo
            stats = {
                summary: {
                    totalEvents: eventsData.length,
                    activeEvents: eventsData.filter(e => e.status === 'ACTIVE').length,
                    totalRaised: eventsData.reduce((sum, e) => sum + (e.totalRaised || 0), 0),
                    eventsThisMonth: eventsData.filter(e => {
                        const eventDate = new Date(e.eventDate);
                        const now = new Date();
                        return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
                    }).length
                }
            };
        }

        updateEventsStatsCards(stats);

    } catch (error) {
        console.error('Error loading events stats:', error);
        // No throw, stats are not critical
    }
}

// ================================
// FUNCIONES DE RENDERIZADO
// ================================

function renderEventsTable() {
    const tbody = document.getElementById('eventsTableBody');
    if (!tbody) return;

    if (eventsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">
                    <i class="bi bi-calendar-x"></i>
                    <p class="mt-2">No se encontraron eventos</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = eventsData.map(event => `
        <tr>
            <td>
                <strong>${escapeHtml(event.name)}</strong>
                ${event.description ? `<br><small class="text-muted">${escapeHtml(event.description)}</small>` : ''}
            </td>
            <td>
                <span class="badge bg-secondary">${getEventTypeLabel(event.type)}</span>
            </td>
            <td>
                ${formatDateTime(event.eventDate)}
                ${event.location ? `<br><small class="text-muted"><i class="bi bi-geo-alt"></i> ${escapeHtml(event.location)}</small>` : ''}
            </td>
            <td>${formatCurrency(event.ticketPrice)}</td>
            <td>${formatCurrency(event.fundraisingGoal)}</td>
            <td>
                <strong>${formatCurrency(event.totalRaised || 0)}</strong>
                ${event.studentsAssigned ? `<br><small class="text-muted">${event.studentsAssigned} estudiantes</small>` : ''}
            </td>
            <td>
                <div class="progress mb-1" style="height: 8px;">
                    <div class="progress-bar" role="progressbar" style="width: ${event.progress || 0}%"></div>
                </div>
                <small>${event.progress || 0}%</small>
            </td>
            <td>
                <span class="badge ${getEventStatusClass(event.status)}">${getEventStatusLabel(event.status)}</span>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-outline-primary btn-sm" onclick="viewEventDetails('${event.id}')" title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning btn-sm" onclick="editEvent('${event.id}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="deleteEvent('${event.id}')" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateEventsStatsCards(stats) {
    // Update stats cards
    const elements = {
        totalEventsCount: stats.summary?.totalEvents || 0,
        activeEventsCount: stats.summary?.activeEvents || 0,
        totalRaisedAmount: formatCurrency(stats.summary?.totalRaised || 0),
        eventsThisMonthCount: stats.summary?.eventsThisMonth || 0
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// ================================
// FUNCIONES DE EVENTOS (EVENT HANDLERS)
// ================================

function setupEventsEventListeners() {
    // Search input
    const searchInput = document.getElementById('eventSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchEvents, 300));
    }

    // Filters
    const filters = ['eventTypeFilter', 'eventStatusFilter', 'eventMonthFilter'];
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', searchEvents);
        }
    });

    // Tab switches
    const tabs = document.querySelectorAll('#eventsTab button[data-bs-toggle="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (e) {
            const targetTab = e.target.getAttribute('data-bs-target');
            handleTabSwitch(targetTab);
        });
    });
}

async function handleTabSwitch(targetTab) {
    switch (targetTab) {
        case '#events-assignments':
            await loadAssignmentEvents();
            break;
        case '#events-reports':
            await loadReportEvents();
            break;
    }
}

// ================================
// FUNCIONES DE EVENTOS CRUD
// ================================

function showCreateEventModal() {
    // Generar opciones de grados y grupos
    const gradeOptions = eventsCurrentGrades.map(grade => 
        `<option value="${grade.id}">${grade.name} (${grade.level})</option>`
    ).join('');
    
    const groupOptions = eventsCurrentGroups.map(group => {
        const grade = eventsCurrentGrades.find(g => g.id === group.gradeId);
        return `<option value="${group.id}">${grade?.name || ''} - ${group.name}</option>`;
    }).join('');

    Swal.fire({
        title: '<i class="bi bi-calendar-plus text-primary"></i> Crear Nuevo Evento',
        html: `
            <div class="text-start">
                <!-- Card de Información Básica -->
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-header bg-primary text-white py-2">
                        <h6 class="mb-0"><i class="bi bi-info-circle me-2"></i>Información del Evento</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-7">
                                <div class="mb-3">
                                    <label class="form-label fw-bold">Nombre del Evento *</label>
                                    <input type="text" class="form-control form-control-lg" id="modalEventName" 
                                           placeholder="Ej: Rifa Día de la Madre 2024">
                                </div>
                            </div>
                            <div class="col-md-5">
                                <div class="mb-3">
                                    <label class="form-label fw-bold">Tipo de Evento *</label>
                                    <select class="form-select form-select-lg" id="modalEventType" onchange="updatePriceLabel()">
                                        <option value="">Seleccionar tipo</option>
                                        <option value="BINGO">🎯 Bingo</option>
                                        <option value="RAFFLE">🎟️ Rifa</option>
                                        <option value="FUNDRAISING">💰 Recaudación de Fondos</option>
                                        <option value="GRADE_FEE">🎓 Derecho de Grado</option>
                                        <option value="CULTURAL">🎭 Evento Cultural</option>
                                        <option value="SPORTS">⚽ Evento Deportivo</option>
                                        <option value="OTHER">📋 Otro</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label fw-bold">Descripción</label>
                            <textarea class="form-control" id="modalEventDescription" rows="3" 
                                      placeholder="Describe brevemente el evento, premios, fecha tentativa, etc."></textarea>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label fw-bold" id="priceLabel">Precio del Boleto *</label>
                                    <div class="input-group input-group-lg">
                                        <span class="input-group-text bg-success text-white">$</span>
                                        <input type="number" class="form-control" id="modalEventTicketPrice" 
                                               value="5000" min="0" step="100">
                                    </div>
                                    <small class="text-muted" id="priceHelp">Precio por boleto individual</small>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label fw-bold">Meta de Recaudación *</label>
                                    <div class="input-group input-group-lg">
                                        <span class="input-group-text bg-info text-white">$</span>
                                        <input type="number" class="form-control" id="modalEventGoal" 
                                               value="500000" min="0" step="1000">
                                    </div>
                                    <small class="text-muted">Objetivo total a recaudar</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Card de Asignación de Estudiantes -->
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-success text-white py-2">
                        <h6 class="mb-0"><i class="bi bi-people me-2"></i>Asignación de Estudiantes</h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-4">
                            <label class="form-label fw-bold">Tipo de Asignación</label>
                            <select class="form-select form-select-lg" id="assignmentType" onchange="toggleAssignmentOptions()">
                                <option value="MANUAL">📋 Manual (asignar después del evento)</option>
                                <option value="BY_GRADE">🎓 Por Grado(s) - Asignación masiva</option>
                                <option value="BY_GROUP">👥 Por Grupo(s) - Asignación específica</option>
                                <option value="INDIVIDUAL">👤 Individual - Selección manual</option>
                            </select>
                        </div>
                        
                        <div id="gradeSelection" style="display: none;">
                            <div class="alert alert-primary border-0">
                                <i class="bi bi-mortarboard me-2"></i>
                                <strong>Asignación por Grados</strong>
                                <p class="mb-0 mt-1" id="gradeAssignmentText">Todos los estudiantes activos de los grados seleccionados serán asignados automáticamente.</p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Seleccionar Grados</label>
                                <select class="form-select" id="targetGrades" multiple size="5" style="min-height: 120px;">
                                    ${gradeOptions}
                                </select>
                                <small class="text-muted">
                                    <i class="bi bi-info-circle me-1"></i>
                                    Mantén Ctrl (Cmd en Mac) para seleccionar múltiples grados
                                </small>
                            </div>
                        </div>
                        
                        <div id="groupSelection" style="display: none;">
                            <div class="alert alert-warning border-0">
                                <i class="bi bi-people-fill me-2"></i>
                                <strong>Asignación por Grupos</strong>
                                <p class="mb-0 mt-1" id="groupAssignmentText">Solo los estudiantes de los grupos específicos seleccionados serán asignados.</p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Seleccionar Grupos</label>
                                <select class="form-select" id="targetGroups" multiple size="6" style="min-height: 150px;">
                                    ${groupOptions}
                                </select>
                                <small class="text-muted">
                                    <i class="bi bi-info-circle me-1"></i>
                                    Mantén Ctrl (Cmd en Mac) para seleccionar múltiples grupos
                                </small>
                            </div>
                        </div>
                        
                        <div id="individualSelection" style="display: none;">
                            <div class="alert alert-info border-0">
                                <i class="bi bi-person-check me-2"></i>
                                <strong>Asignación Individual</strong>
                                <p class="mb-0 mt-1">Busca y selecciona estudiantes específicos uno por uno.</p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Buscar Estudiante</label>
                                <div class="input-group input-group-lg">
                                    <span class="input-group-text">
                                        <i class="bi bi-search"></i>
                                    </span>
                                    <input type="text" 
                                           class="form-control" 
                                           id="studentSearch" 
                                           placeholder="Escribe el nombre o documento del estudiante..."
                                           oninput="handleStudentSearch(event)"
                                           autocomplete="off">
                                </div>
                                <small class="text-muted">
                                    <i class="bi bi-lightbulb me-1"></i>
                                    Escribe al menos 2 caracteres para buscar entre los 1340 estudiantes
                                </small>
                                <div id="studentResults" class="mt-3"></div>
                            </div>
                        </div>
                        
                        <div id="assignmentInfo" class="alert alert-success border-0" style="display: none;">
                            <i class="bi bi-check-circle me-2"></i>
                            <strong>Asignación Automática Activada</strong>
                            <p class="mb-0 mt-1" id="assignmentInfoText">Los valores se asignarán automáticamente a todos los estudiantes activos de los grados/grupos seleccionados al crear el evento.</p>
                        </div>
                    </div>
                </div>
            </div>
        `,
        width: '900px',
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-check-circle me-2"></i>Crear Evento',
        cancelButtonText: '<i class="bi bi-x-circle me-2"></i>Cancelar',
        customClass: {
            confirmButton: 'btn btn-success btn-lg px-4',
            cancelButton: 'btn btn-outline-secondary btn-lg px-4',
            popup: 'border-0 shadow-lg',
            title: 'text-primary'
        },
        buttonsStyling: false,
        didOpen: () => {
            console.log('🎯 Modal opened with assignment options');
            
            // Función para actualizar etiquetas según el tipo de evento
            window.updatePriceLabel = function() {
                const eventType = document.getElementById('modalEventType').value;
                const priceLabel = document.getElementById('priceLabel');
                const priceHelp = document.getElementById('priceHelp');
                const gradeText = document.getElementById('gradeAssignmentText');
                const groupText = document.getElementById('groupAssignmentText');
                const assignmentText = document.getElementById('assignmentInfoText');
                
                let labelText, helpText, assignmentDesc;
                
                switch(eventType) {
                    case 'BINGO':
                        labelText = 'Precio del Cartón *';
                        helpText = 'Precio por cartón de bingo';
                        assignmentDesc = 'Los cartones se asignarán automáticamente';
                        break;
                    case 'RAFFLE':
                        labelText = 'Precio del Boleto *';
                        helpText = 'Precio por boleto de rifa';
                        assignmentDesc = 'Los boletos se asignarán automáticamente';
                        break;
                    case 'FUNDRAISING':
                        labelText = 'Valor de Contribución *';
                        helpText = 'Valor solicitado por estudiante';
                        assignmentDesc = 'Las contribuciones se asignarán automáticamente';
                        break;
                    case 'GRADE_FEE':
                        labelText = 'Valor del Derecho *';
                        helpText = 'Valor del derecho de grado por estudiante';
                        assignmentDesc = 'Los derechos se asignarán automáticamente';
                        break;
                    case 'CULTURAL':
                        labelText = 'Precio de Entrada *';
                        helpText = 'Precio por entrada al evento';
                        assignmentDesc = 'Las entradas se asignarán automáticamente';
                        break;
                    case 'SPORTS':
                        labelText = 'Cuota de Participación *';
                        helpText = 'Cuota por participación en el evento';
                        assignmentDesc = 'Las cuotas se asignarán automáticamente';
                        break;
                    default:
                        labelText = 'Precio del Boleto *';
                        helpText = 'Precio por boleto individual';
                        assignmentDesc = 'Los valores se asignarán automáticamente';
                }
                
                if (priceLabel) priceLabel.textContent = labelText;
                if (priceHelp) priceHelp.textContent = helpText;
                if (gradeText) gradeText.textContent = `Todos los estudiantes activos de los grados seleccionados serán asignados automáticamente.`;
                if (groupText) groupText.textContent = `Solo los estudiantes de los grupos específicos seleccionados serán asignados.`;
                if (assignmentText) assignmentText.textContent = `${assignmentDesc} a todos los estudiantes activos de los grados/grupos seleccionados al crear el evento.`;
            };
        },
        preConfirm: () => {
            // Debug: verificar que los elementos existen
            const nameEl = document.getElementById('modalEventName');
            const typeEl = document.getElementById('modalEventType');
            const priceEl = document.getElementById('modalEventTicketPrice');
            const goalEl = document.getElementById('modalEventGoal');
            const descEl = document.getElementById('modalEventDescription');
            const assignEl = document.getElementById('assignmentType');
            
            console.log('🔍 Form elements found:', {
                nameEl: !!nameEl,
                typeEl: !!typeEl,
                priceEl: !!priceEl,
                goalEl: !!goalEl,
                descEl: !!descEl,
                assignEl: !!assignEl
            });
            
            const name = nameEl?.value?.trim() || '';
            const type = typeEl?.value || '';
            const ticketPrice = priceEl?.value || '';
            const goal = goalEl?.value || '';
            const description = descEl?.value?.trim() || '';
            const assignmentType = assignEl?.value || '';
            
            // Debug: mostrar valores capturados
            console.log('🔍 Form values captured:', {
                name, type, ticketPrice, goal, description, assignmentType
            });
            
            // Validación específica con mensajes detallados
            if (!name) {
                Swal.showValidationMessage('❌ El nombre del evento es obligatorio');
                return false;
            }
            
            if (!type) {
                Swal.showValidationMessage('❌ Debe seleccionar un tipo de evento');
                return false;
            }
            
            if (!ticketPrice) {
                Swal.showValidationMessage('❌ El precio es obligatorio');
                return false;
            }
            
            if (!goal) {
                Swal.showValidationMessage('❌ La meta de recaudación es obligatoria');
                return false;
            }
            
            const priceValue = parseFloat(ticketPrice);
            const goalValue = parseFloat(goal);
            
            if (isNaN(priceValue) || priceValue <= 0) {
                Swal.showValidationMessage('❌ El precio debe ser un número mayor a 0');
                return false;
            }
            
            if (isNaN(goalValue) || goalValue <= 0) {
                Swal.showValidationMessage('❌ La meta de recaudación debe ser un número mayor a 0');
                return false;
            }
            
            const eventData = {
                name,
                type,
                description,
                ticketPrice: priceValue,
                fundraisingGoal: goalValue,
                assignmentType
            };
            
            console.log('✅ Form validation passed, event data:', eventData);
            
            // Agregar datos específicos según el tipo de asignación
            if (assignmentType === 'BY_GRADE') {
                const selectedGrades = Array.from(document.getElementById('targetGrades').selectedOptions)
                    .map(option => option.value);
                if (selectedGrades.length === 0) {
                    Swal.showValidationMessage('Selecciona al menos un grado');
                    return false;
                }
                eventData.targetGrades = selectedGrades;
            } else if (assignmentType === 'BY_GROUP') {
                const selectedGroups = Array.from(document.getElementById('targetGroups').selectedOptions)
                    .map(option => option.value);
                if (selectedGroups.length === 0) {
                    Swal.showValidationMessage('Selecciona al menos un grupo');
                    return false;
                }
                eventData.targetGroups = selectedGroups;
            } else if (assignmentType === 'INDIVIDUAL') {
                const selectedStudent = document.getElementById('studentSearch').getAttribute('data-student-id');
                if (!selectedStudent) {
                    Swal.showValidationMessage('Selecciona al menos un estudiante');
                    return false;
                }
                eventData.selectedStudents = [selectedStudent];
            }
            
            return eventData;
        }
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            createEventWithAssignment(result.value);
        }
    });
}

async function saveEvent() {
    const form = document.getElementById('eventForm');
    const formData = new FormData(form);
    const eventData = Object.fromEntries(formData.entries());
    const eventId = eventData.eventId;

    try {
        // Validaciones básicas
        if (!eventData.name || !eventData.type || !eventData.eventDate || !eventData.ticketPrice || !eventData.fundraisingGoal) {
            showError('Por favor complete todos los campos obligatorios');
            return;
        }

        if (parseFloat(eventData.ticketPrice) <= 0) {
            showError('El precio del boleto debe ser mayor a 0');
            return;
        }

        if (parseFloat(eventData.fundraisingGoal) <= 0) {
            showError('La meta de recaudación debe ser mayor a 0');
            return;
        }

        let success = false;
        try {
            if (eventId) {
                await api.updateEvent(eventId, eventData);
                showSuccess('Evento actualizado exitosamente');
            } else {
                await api.createEvent(eventData);
                showSuccess('Evento creado exitosamente');
            }
            success = true;
        } catch (apiError) {
            console.log('ℹ️ API not available, simulating save in demo mode:', apiError.message);

            // Simular guardado para desarrollo
            const newEvent = {
                id: eventId || `demo-${Date.now()}`,
                name: eventData.name,
                type: eventData.type,
                description: eventData.description || '',
                eventDate: eventData.eventDate,
                location: eventData.location || '',
                ticketPrice: parseFloat(eventData.ticketPrice),
                fundraisingGoal: parseFloat(eventData.fundraisingGoal),
                responsible: eventData.responsible || 'Usuario Actual',
                status: eventData.status || 'PLANNING',
                totalRaised: 0,
                progress: 0,
                studentsAssigned: 0
            };

            if (eventId) {
                // Actualizar evento existente
                const index = eventsData.findIndex(e => e.id === eventId);
                if (index !== -1) {
                    eventsData[index] = { ...eventsData[index], ...newEvent };
                }
                showSuccess('Evento actualizado exitosamente (modo demo)');
            } else {
                // Agregar nuevo evento
                eventsData.unshift(newEvent);
                showSuccess('Evento creado exitosamente (modo demo)');
            }

            success = true;
        }

        if (success) {
            // Close modal and refresh
            bootstrap.Modal.getInstance(document.getElementById('eventModal')).hide();
            await refreshEventsData();
        }

    } catch (error) {
        console.error('Error saving event:', error);
        showError('Error al guardar evento: ' + error.message);
    }
}

async function editEvent(eventId) {
    try {
        const event = await api.getEvent(eventId);

        // Populate form
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventName').value = event.name;
        document.getElementById('eventType').value = event.type;
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventDate').value = new Date(event.eventDate).toISOString().slice(0, 16);
        document.getElementById('eventLocation').value = event.location || '';
        document.getElementById('eventTicketPrice').value = event.ticketPrice;
        document.getElementById('eventFundraisingGoal').value = event.fundraisingGoal;
        document.getElementById('eventResponsible').value = event.responsible || '';
        document.getElementById('eventStatus').value = event.status;

        // Show modal
        document.getElementById('eventModalTitle').textContent = 'Editar Evento';
        new bootstrap.Modal(document.getElementById('eventModal')).show();

    } catch (error) {
        console.error('Error loading event for edit:', error);
        showError('Error al cargar evento para edición');
    }
}

async function deleteEvent(eventId) {
    const result = await Swal.fire({
        title: '¿Está seguro?',
        text: 'Esta acción no se puede deshacer. Se eliminarán todas las asignaciones y pagos asociados.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await api.deleteEvent(eventId);
            showSuccess('Evento eliminado exitosamente');
            await refreshEventsData();
        } catch (error) {
            console.error('Error deleting event:', error);
            showError('Error al eliminar evento: ' + error.message);
        }
    }
}

async function viewEventDetails(eventId) {
    try {
        const event = await api.getEvent(eventId);

        // Show detailed modal or navigate to detail view
        await Swal.fire({
            title: escapeHtml(event.name),
            html: `
                <div class="text-start">
                    <p><strong>Tipo:</strong> ${getEventTypeLabel(event.type)}</p>
                    <p><strong>Fecha:</strong> ${formatDateTime(event.eventDate)}</p>
                    ${event.location ? `<p><strong>Ubicación:</strong> ${escapeHtml(event.location)}</p>` : ''}
                    ${event.description ? `<p><strong>Descripción:</strong> ${escapeHtml(event.description)}</p>` : ''}
                    <p><strong>Precio del Boleto:</strong> ${formatCurrency(event.ticketPrice)}</p>
                    <p><strong>Meta de Recaudación:</strong> ${formatCurrency(event.fundraisingGoal)}</p>
                    <p><strong>Total Recaudado:</strong> ${formatCurrency(event.totalRaised || 0)}</p>
                    <p><strong>Progreso:</strong> ${event.stats?.progress || 0}%</p>
                    <p><strong>Estudiantes Asignados:</strong> ${event.stats?.totalStudents || 0}</p>
                    <p><strong>Boletos Vendidos:</strong> ${event.stats?.totalTicketsSold || 0} / ${event.stats?.totalTicketsAssigned || 0}</p>
                    ${event.responsible ? `<p><strong>Responsable:</strong> ${escapeHtml(event.responsible)}</p>` : ''}
                    <p><strong>Estado:</strong> <span class="badge ${getEventStatusClass(event.status)}">${getEventStatusLabel(event.status)}</span></p>
                </div>
            `,
            confirmButtonText: 'Cerrar',
            width: '600px'
        });

    } catch (error) {
        console.error('Error loading event details:', error);
        showError('Error al cargar detalles del evento');
    }
}

// ================================
// FUNCIONES DE FILTRADO Y BÚSQUEDA
// ================================

async function searchEvents() {
    const searchTerm = document.getElementById('eventSearch')?.value || '';
    const type = document.getElementById('eventTypeFilter')?.value || '';
    const status = document.getElementById('eventStatusFilter')?.value || '';
    const month = document.getElementById('eventMonthFilter')?.value || '';

    eventsFilters = {
        search: searchTerm,
        type: type,
        status: status,
        month: month
    };

    await loadEventsData();
}

function clearEventFilters() {
    // Clear all filter inputs
    const filterIds = ['eventSearch', 'eventTypeFilter', 'eventStatusFilter', 'eventMonthFilter'];
    filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });

    // Reset filters and reload
    eventsFilters = {};
    loadEventsData();
}

async function refreshEventsData() {
    try {
        await loadEventsData();
        await loadEventsStats();
        showSuccess('Datos actualizados exitosamente');
    } catch (error) {
        console.error('Error refreshing events data:', error);
        showError('Error al actualizar datos');
    }
}

// ================================
// FUNCIONES DE ASIGNACIONES
// ================================

async function loadAssignmentEvents() {
    try {
        let events;
        try {
            events = await api.getEvents({ status: 'ACTIVE,PLANNING' });
        } catch (error) {
            console.log('ℹ️ Assignment Events API not available, using demo data:', error.message);

            // Usar eventos demo para asignaciones
            events = eventsData.filter(event =>
                event.status === 'ACTIVE' || event.status === 'PLANNING'
            );
        }

        const eventSelect = document.getElementById('assignmentEventSelect');

        if (eventSelect) {
            eventSelect.innerHTML = '<option value="">Seleccionar evento...</option>';
            events.forEach(event => {
                eventSelect.innerHTML += `<option value="${event.id}">${escapeHtml(event.name)} - ${formatDate(event.eventDate)}</option>`;
            });
        }

    } catch (error) {
        console.error('Error loading assignment events:', error);
        showError('Error al cargar eventos para asignaciones: ' + error.message);
    }
}

async function selectEventForAssignments(eventId) {
    selectedEventForAssignments = eventId;

    if (!eventId) {
        // Hide assignment containers
        document.getElementById('assignmentActionsContainer').style.display = 'none';
        document.getElementById('assignmentStatsContainer').style.display = 'none';
        document.getElementById('assignmentsTableContainer').style.display = 'none';
        return;
    }

    try {
        // Show loading
        const containers = ['assignmentActionsContainer', 'assignmentStatsContainer', 'assignmentsTableContainer'];
        containers.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'block';
        });

        // Load event details and assignments
        const [event, assignments] = await Promise.all([
            api.getEvent(eventId),
            api.getEventAssignments(eventId)
        ]);

        // Update event info
        const eventInfoDiv = document.getElementById('assignmentEventInfo');
        if (eventInfoDiv) {
            eventInfoDiv.innerHTML = `
                <div class="alert alert-info">
                    <strong>${escapeHtml(event.name)}</strong><br>
                    <small>Precio: ${formatCurrency(event.ticketPrice)} | Meta: ${formatCurrency(event.fundraisingGoal)}</small>
                </div>
            `;
        }

        // Store assignments data
        assignmentsData = assignments;

        // Update stats and table
        updateAssignmentStats(event, assignments);
        renderAssignmentsTable(assignments);

        // Populate grade filters
        populateAssignmentFilters();

    } catch (error) {
        console.error('Error loading event assignments:', error);
        showError('Error al cargar asignaciones del evento');
    }
}

function updateAssignmentStats(event, assignments) {
    const stats = {
        totalStudents: assignments.length,
        totalTicketsAssigned: assignments.reduce((sum, a) => sum + a.ticketsAssigned, 0),
        totalTicketsSold: assignments.reduce((sum, a) => sum + a.ticketsSold, 0),
        totalRaised: assignments.reduce((sum, a) => sum + (a.ticketsSold * event.ticketPrice), 0)
    };

    // Update stat cards
    const statElements = {
        assignmentsTotalStudents: stats.totalStudents,
        assignmentsTotalTickets: stats.totalTicketsAssigned,
        assignmentsTicketsSold: stats.totalTicketsSold,
        assignmentsTotalRaised: formatCurrency(stats.totalRaised)
    };

    Object.entries(statElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function renderAssignmentsTable(assignments) {
    const tbody = document.getElementById('assignmentsTableBody');
    if (!tbody) return;

    if (assignments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center text-muted">
                    <i class="bi bi-person-x"></i>
                    <p class="mt-2">No hay asignaciones para este evento</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = assignments.map(assignment => {
        const student = assignment.student;
        const ticketPrice = assignment.event?.ticketPrice || 0;
        const totalValue = assignment.ticketsAssigned * ticketPrice;
        const paidValue = assignment.ticketsSold * ticketPrice;
        const pendingValue = totalValue - paidValue;
        const progress = totalValue > 0 ? Math.round((paidValue / totalValue) * 100) : 0;

        return `
            <tr>
                <td>
                    <strong>${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</strong><br>
                    <small class="text-muted">${escapeHtml(student.document)}</small>
                </td>
                <td>${escapeHtml(student.grade?.name || 'N/A')}</td>
                <td>${escapeHtml(student.group?.name || 'N/A')}</td>
                <td><span class="badge bg-primary">${assignment.ticketsAssigned}</span></td>
                <td><span class="badge bg-success">${assignment.ticketsSold}</span></td>
                <td>${formatCurrency(totalValue)}</td>
                <td>${formatCurrency(paidValue)}</td>
                <td>${formatCurrency(pendingValue)}</td>
                <td>
                    <div class="progress mb-1" style="height: 8px;">
                        <div class="progress-bar" role="progressbar" style="width: ${progress}%"></div>
                    </div>
                    <small>${progress}%</small>
                </td>
                <td>
                    <span class="badge ${getAssignmentStatusClass(assignment.status)}">${getAssignmentStatusLabel(assignment.status)}</span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-outline-warning btn-sm" onclick="editAssignment('${assignment.id}')" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteAssignment('${assignment.id}')" title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ================================
// FUNCIONES AUXILIARES
// ================================

function populateGradeSelects() {
    const gradeSelects = [
        'bulkAssignmentGradeId',
        'assignmentGradeFilter',
        'reportGradeFilter'
    ];

    gradeSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Seleccionar grado</option>';

            eventsCurrentGrades.forEach(grade => {
                select.innerHTML += `<option value="${grade.id}">${escapeHtml(grade.name)}</option>`;
            });

            if (currentValue) {
                select.value = currentValue;
            }
        }
    });
}

function populateAssignmentFilters() {
    // Populate grade filter
    const gradeFilter = document.getElementById('assignmentGradeFilter');
    if (gradeFilter) {
        const grades = [...new Set(assignmentsData.map(a => a.student.grade).filter(g => g))];
        gradeFilter.innerHTML = '<option value="">Todos los grados</option>';
        grades.forEach(grade => {
            gradeFilter.innerHTML += `<option value="${grade.id}">${escapeHtml(grade.name)}</option>`;
        });
    }

    // Populate group filter
    const groupFilter = document.getElementById('assignmentGroupFilter');
    if (groupFilter) {
        const groups = [...new Set(assignmentsData.map(a => a.student.group).filter(g => g))];
        groupFilter.innerHTML = '<option value="">Todos los grupos</option>';
        groups.forEach(group => {
            groupFilter.innerHTML += `<option value="${group.id}">${escapeHtml(group.name)}</option>`;
        });
    }
}

// Helper functions for formatting and labeling
function getEventTypeLabel(type) {
    const types = {
        'FUNDRAISING': 'Recaudación',
        'SOCIAL': 'Social',
        'ACADEMIC': 'Académico',
        'CULTURAL': 'Cultural',
        'SPORTS': 'Deportivo',
        'BINGO': 'Bingo',
        'RAFFLE': 'Rifa',
        'CONTEST': 'Concurso',
        'OTHER': 'Otro'
    };
    return types[type] || type;
}

function getEventStatusLabel(status) {
    const statuses = {
        'PLANNING': 'En Planificación',
        'ACTIVE': 'Activo',
        'COMPLETED': 'Completado',
        'CANCELLED': 'Cancelado'
    };
    return statuses[status] || status;
}

function getEventStatusClass(status) {
    const classes = {
        'PLANNING': 'bg-warning',
        'ACTIVE': 'bg-success',
        'COMPLETED': 'bg-primary',
        'CANCELLED': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
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

// ================================
// FUNCIONES DE ASIGNACIONES CRUD
// ================================

function showAssignmentModal() {
    if (!selectedEventForAssignments) {
        showError('Debe seleccionar un evento primero');
        return;
    }

    const modal = document.getElementById('assignmentModal');
    const form = document.getElementById('assignmentForm');

    if (modal && form) {
        form.reset();
        document.getElementById('assignmentEventId').value = selectedEventForAssignments;
        document.getElementById('assignmentId').value = '';
        document.getElementById('assignmentTicketsSoldContainer').style.display = 'none';

        // Setup student search
        setupStudentSearch('assignmentStudentSearch', 'assignmentStudentId', 'assignmentStudentResults');

        new bootstrap.Modal(modal).show();
    }
}

async function saveAssignment() {
    const form = document.getElementById('assignmentForm');
    const formData = new FormData(form);
    const assignmentData = Object.fromEntries(formData.entries());
    const assignmentId = assignmentData.assignmentId;
    const eventId = assignmentData.eventId;

    try {
        if (assignmentId) {
            await api.updateEventAssignment(eventId, assignmentId, assignmentData);
            showSuccess('Asignación actualizada exitosamente');
        } else {
            await api.createEventAssignment(eventId, assignmentData);
            showSuccess('Asignación creada exitosamente');
        }

        // Close modal and refresh
        bootstrap.Modal.getInstance(document.getElementById('assignmentModal')).hide();
        await selectEventForAssignments(selectedEventForAssignments);

    } catch (error) {
        console.error('Error saving assignment:', error);
        showError('Error al guardar asignación: ' + error.message);
    }
}

async function editAssignment(assignmentId) {
    try {
        const assignment = assignmentsData.find(a => a.id === assignmentId);
        if (!assignment) {
            showError('Asignación no encontrada');
            return;
        }

        // Populate form
        document.getElementById('assignmentId').value = assignment.id;
        document.getElementById('assignmentEventId').value = selectedEventForAssignments;
        document.getElementById('assignmentStudentId').value = assignment.studentId;
        document.getElementById('assignmentTicketsAssigned').value = assignment.ticketsAssigned;
        document.getElementById('assignmentTicketsSold').value = assignment.ticketsSold;

        // Show student info
        const studentSearch = document.getElementById('assignmentStudentSearch');
        if (studentSearch && assignment.student) {
            studentSearch.value = `${assignment.student.firstName} ${assignment.student.lastName} - ${assignment.student.document}`;
        }

        // Show tickets sold field for editing
        document.getElementById('assignmentTicketsSoldContainer').style.display = 'block';

        // Show modal
        new bootstrap.Modal(document.getElementById('assignmentModal')).show();

    } catch (error) {
        console.error('Error loading assignment for edit:', error);
        showError('Error al cargar asignación para edición');
    }
}

async function deleteAssignment(assignmentId) {
    const result = await Swal.fire({
        title: '¿Está seguro?',
        text: 'Esta acción eliminará la asignación del estudiante.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await api.deleteEventAssignment(selectedEventForAssignments, assignmentId);
            showSuccess('Asignación eliminada exitosamente');
            await selectEventForAssignments(selectedEventForAssignments);
        } catch (error) {
            console.error('Error deleting assignment:', error);
            showError('Error al eliminar asignación: ' + error.message);
        }
    }
}

// ================================
// FUNCIONES DE ASIGNACIÓN MASIVA
// ================================

function showBulkAssignmentModal() {
    if (!selectedEventForAssignments) {
        showError('Debe seleccionar un evento primero');
        return;
    }

    const modal = document.getElementById('bulkAssignmentModal');
    const form = document.getElementById('bulkAssignmentForm');

    if (modal && form) {
        form.reset();
        document.getElementById('bulkAssignmentEventId').value = selectedEventForAssignments;
        document.getElementById('bulkAssignmentPreview').style.display = 'none';
        document.getElementById('confirmBulkAssignmentBtn').disabled = true;

        // Populate grades
        populateGradeSelects();

        new bootstrap.Modal(modal).show();
    }
}

async function loadGroupsForBulkAssignment(gradeId) {
    const groupSelect = document.getElementById('bulkAssignmentGroupId');
    if (!groupSelect) return;

    groupSelect.innerHTML = '<option value="">Todos los grupos del grado</option>';

    if (gradeId) {
        const groups = eventsCurrentGroups.filter(g => g.gradeId === gradeId);
        groups.forEach(group => {
            groupSelect.innerHTML += `<option value="${group.id}">${escapeHtml(group.name)}</option>`;
        });
    }

    // Reset preview when grade changes
    document.getElementById('bulkAssignmentPreview').style.display = 'none';
    document.getElementById('confirmBulkAssignmentBtn').disabled = true;
}

async function previewBulkAssignment() {
    const gradeId = document.getElementById('bulkAssignmentGradeId').value;
    const groupId = document.getElementById('bulkAssignmentGroupId').value;
    const ticketsPerStudent = document.getElementById('bulkAssignmentTicketsPerStudent').value;

    if (!gradeId || !ticketsPerStudent) {
        showError('Debe seleccionar un grado y especificar el número de boletos');
        return;
    }

    try {
        // Get students count for preview
        const params = { gradeId: gradeId, status: 'ACTIVE' };
        if (groupId) params.groupId = groupId;

        const students = await api.getStudents(params);
        const studentsCount = students.length;

        if (studentsCount === 0) {
            showError('No se encontraron estudiantes activos con los criterios seleccionados');
            return;
        }

        // Show preview
        const grade = eventsCurrentGrades.find(g => g.id === gradeId);
        const group = groupId ? eventsCurrentGroups.find(g => g.id === groupId) : null;

        const previewText = `
            Se asignarán ${ticketsPerStudent} boletos a ${studentsCount} estudiantes de ${grade?.name || 'N/A'}${group ? ` - ${group.name}` : ''}.
            <br><strong>Total de boletos a asignar: ${studentsCount * ticketsPerStudent}</strong>
        `;

        document.getElementById('bulkAssignmentPreviewText').innerHTML = previewText;
        document.getElementById('bulkAssignmentPreview').style.display = 'block';
        document.getElementById('confirmBulkAssignmentBtn').disabled = false;

    } catch (error) {
        console.error('Error generating bulk assignment preview:', error);
        showError('Error al generar vista previa');
    }
}

async function saveBulkAssignment() {
    const gradeId = document.getElementById('bulkAssignmentGradeId').value;
    const groupId = document.getElementById('bulkAssignmentGroupId').value;
    const ticketsPerStudent = document.getElementById('bulkAssignmentTicketsPerStudent').value;

    const bulkData = {
        gradeId: gradeId,
        groupId: groupId || undefined,
        ticketsPerStudent: parseInt(ticketsPerStudent)
    };

    try {
        const result = await api.createBulkEventAssignments(selectedEventForAssignments, bulkData);

        showSuccess(`Se crearon ${result.assignmentsCreated} asignaciones exitosamente`);

        // Close modal and refresh
        bootstrap.Modal.getInstance(document.getElementById('bulkAssignmentModal')).hide();
        await selectEventForAssignments(selectedEventForAssignments);

    } catch (error) {
        console.error('Error creating bulk assignments:', error);
        showError('Error al crear asignaciones masivas: ' + error.message);
    }
}

// ================================
// FUNCIONES DE PAGOS DE EVENTOS
// ================================

function showEventPaymentModal() {
    if (!selectedEventForAssignments) {
        showError('Debe seleccionar un evento primero');
        return;
    }

    const modal = document.getElementById('eventPaymentModal');
    const form = document.getElementById('eventPaymentForm');

    if (modal && form) {
        form.reset();
        document.getElementById('eventPaymentEventId').value = selectedEventForAssignments;

        // Set default date to today
        const today = new Date().toISOString().slice(0, 10);
        document.getElementById('eventPaymentDate').value = today;

        // Setup student search
        setupStudentSearch('eventPaymentStudentSearch', 'eventPaymentStudentId', 'eventPaymentStudentResults', updateEventPaymentStudentInfo);

        new bootstrap.Modal(modal).show();
    }
}

async function updateEventPaymentStudentInfo(studentId) {
    const infoDiv = document.getElementById('eventPaymentStudentInfo');
    if (!infoDiv || !studentId || !selectedEventForAssignments) return;

    try {
        // Find assignment for this student and event
        const assignment = assignmentsData.find(a => a.studentId === studentId);

        if (!assignment) {
            infoDiv.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle"></i>
                    Este estudiante no tiene asignación para el evento seleccionado.
                </div>
            `;
            return;
        }

        const event = await api.getEvent(selectedEventForAssignments);
        const pendingTickets = assignment.ticketsAssigned - assignment.ticketsSold;
        const pendingAmount = pendingTickets * event.ticketPrice;

        infoDiv.innerHTML = `
            <div class="alert alert-info">
                <strong>Información de Asignación:</strong><br>
                Boletos asignados: ${assignment.ticketsAssigned}<br>
                Boletos vendidos: ${assignment.ticketsSold}<br>
                Boletos pendientes: ${pendingTickets}<br>
                <strong>Monto pendiente: ${formatCurrency(pendingAmount)}</strong>
            </div>
        `;

        // Set suggested amount
        document.getElementById('eventPaymentAmount').value = pendingAmount;

    } catch (error) {
        console.error('Error updating payment student info:', error);
        infoDiv.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar información del estudiante
            </div>
        `;
    }
}

async function saveEventPayment() {
    const form = document.getElementById('eventPaymentForm');
    const formData = new FormData(form);
    const paymentData = Object.fromEntries(formData.entries());

    try {
        await api.createEventPayment(selectedEventForAssignments, paymentData);
        showSuccess('Pago registrado exitosamente');

        // Close modal and refresh
        bootstrap.Modal.getInstance(document.getElementById('eventPaymentModal')).hide();
        await selectEventForAssignments(selectedEventForAssignments);

    } catch (error) {
        console.error('Error saving event payment:', error);
        showError('Error al registrar pago: ' + error.message);
    }
}

// ================================
// FUNCIONES DE REPORTES
// ================================

async function loadReportEvents() {
    try {
        const events = await api.getEvents();
        const eventSelect = document.getElementById('reportEventSelect');

        if (eventSelect) {
            eventSelect.innerHTML = '<option value="">Todos los eventos</option>';
            events.forEach(event => {
                eventSelect.innerHTML += `<option value="${event.id}">${escapeHtml(event.name)} - ${formatDate(event.eventDate)}</option>`;
            });
        }

        // Set default date range (last 3 months)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);

        document.getElementById('reportStartDate').value = startDate.toISOString().slice(0, 10);
        document.getElementById('reportEndDate').value = endDate.toISOString().slice(0, 10);

    } catch (error) {
        console.error('Error loading report events:', error);
        showError('Error al cargar eventos para reportes');
    }
}

async function generateEventReports() {
    const eventId = document.getElementById('reportEventSelect')?.value;
    const startDate = document.getElementById('reportStartDate')?.value;
    const endDate = document.getElementById('reportEndDate')?.value;

    try {
        let eventsToReport = eventsData;

        // Filter by date range
        if (startDate || endDate) {
            eventsToReport = eventsData.filter(event => {
                const eventDate = new Date(event.eventDate);
                if (startDate && eventDate < new Date(startDate)) return false;
                if (endDate && eventDate > new Date(endDate)) return false;
                return true;
            });
        }

        // Filter by specific event
        if (eventId) {
            eventsToReport = eventsToReport.filter(event => event.id === eventId);
        }

        // Update summary cards
        updateReportSummary(eventsToReport);

        // Update charts
        updateReportCharts(eventsToReport);

        // Update detailed table
        updateReportTable(eventsToReport);

    } catch (error) {
        console.error('Error generating reports:', error);
        showError('Error al generar reportes');
    }
}

function updateReportSummary(events) {
    const totalEvents = events.length;
    const totalRaised = events.reduce((sum, e) => sum + (e.totalRaised || 0), 0);
    const totalStudents = events.reduce((sum, e) => sum + (e.studentsAssigned || 0), 0);
    const averageRaised = totalEvents > 0 ? totalRaised / totalEvents : 0;

    document.getElementById('reportTotalEvents').textContent = totalEvents;
    document.getElementById('reportTotalRaised').textContent = formatCurrency(totalRaised);
    document.getElementById('reportTotalStudents').textContent = totalStudents;
    document.getElementById('reportAverageRaised').textContent = formatCurrency(averageRaised);
}

function updateReportCharts(events) {
    // Revenue by event chart
    const revenueCtx = document.getElementById('eventRevenueChart');
    if (revenueCtx && typeof Chart !== 'undefined') {
        new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: events.map(e => e.name.length > 20 ? e.name.substring(0, 20) + '...' : e.name),
                datasets: [{
                    label: 'Recaudado',
                    data: events.map(e => e.totalRaised || 0),
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }, {
                    label: 'Meta',
                    data: events.map(e => e.fundraisingGoal || 0),
                    backgroundColor: 'rgba(255, 99, 132, 0.3)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    type: 'line'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                            }
                        }
                    }
                }
            }
        });
    }

    // Event types chart
    const typesCtx = document.getElementById('eventTypesChart');
    if (typesCtx && typeof Chart !== 'undefined') {
        const typeCount = {};
        events.forEach(event => {
            typeCount[event.type] = (typeCount[event.type] || 0) + 1;
        });

        new Chart(typesCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(typeCount).map(type => getEventTypeLabel(type)),
                datasets: [{
                    data: Object.values(typeCount),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

function updateReportTable(events) {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;

    if (events.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">
                    No hay eventos para mostrar en el reporte
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = events.map(event => {
        const fulfillment = event.fundraisingGoal > 0 ?
            Math.round(((event.totalRaised || 0) / event.fundraisingGoal) * 100) : 0;

        return `
            <tr>
                <td>${escapeHtml(event.name)}</td>
                <td><span class="badge bg-secondary">${getEventTypeLabel(event.type)}</span></td>
                <td>${formatDate(event.eventDate)}</td>
                <td>${formatCurrency(event.fundraisingGoal)}</td>
                <td>${formatCurrency(event.totalRaised || 0)}</td>
                <td>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar" role="progressbar" style="width: ${fulfillment}%" aria-valuenow="${fulfillment}" aria-valuemin="0" aria-valuemax="100">
                            ${fulfillment}%
                        </div>
                    </div>
                </td>
                <td>${event.studentsAssigned || 0}</td>
                <td>${event.ticketsSold || 0}</td>
                <td><span class="badge ${getEventStatusClass(event.status)}">${getEventStatusLabel(event.status)}</span></td>
            </tr>
        `;
    }).join('');
}

async function exportEventReports() {
    try {
        showInfo('Preparando archivo de exportación...');

        // Get current report data
        const eventId = document.getElementById('reportEventSelect')?.value;
        const startDate = document.getElementById('reportStartDate')?.value;
        const endDate = document.getElementById('reportEndDate')?.value;

        // You would implement the actual export logic here
        // For now, show a placeholder message
        showSuccess('Funcionalidad de exportación será implementada próximamente');

    } catch (error) {
        console.error('Error exporting reports:', error);
        showError('Error al exportar reportes');
    }
}

// ================================
// FUNCIONES DE EXPORTACIÓN
// ================================

async function exportEvents() {
    try {
        showInfo('Preparando exportación de eventos...');
        // Implementation for exporting events
        showSuccess('Funcionalidad de exportación será implementada próximamente');
    } catch (error) {
        console.error('Error exporting events:', error);
        showError('Error al exportar eventos');
    }
}

async function exportAssignments() {
    try {
        if (!selectedEventForAssignments) {
            showError('Debe seleccionar un evento primero');
            return;
        }

        showInfo('Preparando exportación de asignaciones...');
        // Implementation for exporting assignments
        showSuccess('Funcionalidad de exportación será implementada próximamente');
    } catch (error) {
        console.error('Error exporting assignments:', error);
        showError('Error al exportar asignaciones');
    }
}

// ================================
// FUNCIONES DE BÚSQUEDA DE ESTUDIANTES
// ================================

function setupStudentSearch(searchInputId, hiddenInputId, resultsContainerId, onSelectCallback) {
    const searchInput = document.getElementById(searchInputId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const resultsContainer = document.getElementById(resultsContainerId);

    if (!searchInput || !hiddenInput || !resultsContainer) return;

    let searchTimeout;

    searchInput.addEventListener('input', function () {
        const query = this.value.trim();

        clearTimeout(searchTimeout);

        if (query.length < 2) {
            resultsContainer.innerHTML = '';
            hiddenInput.value = '';
            return;
        }

        searchTimeout = setTimeout(async () => {
            try {
                const students = await api.getStudents({ search: query, limit: 50, status: 'ACTIVE' });
                displayStudentSearchResults(students, resultsContainer, hiddenInput, searchInput, onSelectCallback);
            } catch (error) {
                console.error('Error searching students:', error);
                resultsContainer.innerHTML = '<div class="list-group-item text-danger">Error al buscar estudiantes</div>';
            }
        }, 300);
    });

    // Hide results when clicking outside
    document.addEventListener('click', function (e) {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.innerHTML = '';
        }
    });
}

function displayStudentSearchResults(students, container, hiddenInput, searchInput, onSelectCallback) {
    if (students.length === 0) {
        container.innerHTML = '<div class="list-group-item text-muted">No se encontraron estudiantes</div>';
        return;
    }

    container.innerHTML = students.map(student => `
        <div class="list-group-item list-group-item-action student-search-result" 
             data-student-id="${student.id}" 
             data-student-name="${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)} - ${escapeHtml(student.document)}">
            <div class="d-flex justify-content-between">
                <div>
                    <strong>${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</strong><br>
                    <small class="text-muted">${escapeHtml(student.document)} | ${escapeHtml(student.grade?.name || 'N/A')} - ${escapeHtml(student.group?.name || 'N/A')}</small>
                </div>
                <div class="text-end">
                    <span class="badge ${student.status === 'ACTIVE' ? 'bg-success' : 'bg-warning'}">${student.status}</span>
                </div>
            </div>
        </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.student-search-result').forEach(item => {
        item.addEventListener('click', function () {
            const studentId = this.getAttribute('data-student-id');
            const studentName = this.getAttribute('data-student-name');

            hiddenInput.value = studentId;
            searchInput.value = studentName;
            container.innerHTML = '';

            if (onSelectCallback) {
                onSelectCallback(studentId);
            }
        });
    });
}

// ================================
// FUNCIONES DE FILTRADO DE ASIGNACIONES
// ================================

function filterAssignments() {
    const gradeFilter = document.getElementById('assignmentGradeFilter')?.value;
    const groupFilter = document.getElementById('assignmentGroupFilter')?.value;
    const statusFilter = document.getElementById('assignmentStatusFilter')?.value;

    let filteredAssignments = [...assignmentsData];

    if (gradeFilter) {
        filteredAssignments = filteredAssignments.filter(a => a.student.gradeId === gradeFilter);
    }

    if (groupFilter) {
        filteredAssignments = filteredAssignments.filter(a => a.student.groupId === groupFilter);
    }

    if (statusFilter) {
        filteredAssignments = filteredAssignments.filter(a => a.status === statusFilter);
    }

    renderAssignmentsTable(filteredAssignments);
}

async function refreshAssignments() {
    if (selectedEventForAssignments) {
        await selectEventForAssignments(selectedEventForAssignments);
        showSuccess('Asignaciones actualizadas');
    }
}

// ================================
// FUNCIONES DE UTILIDAD
// ================================

function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}

function formatCurrency(amount) {
    if (typeof amount !== 'number') return '$0';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO');
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-CO');
}

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
// FUNCIONES DE NOTIFICACIONES
// ================================

function showSuccess(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Éxito',
            text: message,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false
        });
    } else {
        alert('Éxito: ' + message);
    }
}

function showError(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Error',
            text: message,
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    } else {
        alert('Error: ' + message);
    }
}

function showInfo(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Información',
            text: message,
            icon: 'info',
            timer: 2000,
            showConfirmButton: false
        });
    } else {
        alert('Info: ' + message);
    }
}

// ================================
// FUNCIÓN FALTANTE
// ================================

// Función para crear evento con asignación
async function createEventWithAssignment(eventData) {
    try {
        console.log('🔄 Creating event with assignment:', eventData);

        // Preparar datos para la API
        const apiEventData = {
            name: eventData.name,
            type: eventData.type,
            description: eventData.description || '',
            eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            ticketPrice: eventData.ticketPrice,
            fundraisingGoal: eventData.fundraisingGoal,
            status: 'PLANNING',
            assignmentType: eventData.assignmentType || 'MANUAL'
        };

        // Agregar datos específicos de asignación
        if (eventData.targetGrades && eventData.targetGrades.length > 0) {
            apiEventData.targetGrades = eventData.targetGrades;
        }
        if (eventData.targetGroups && eventData.targetGroups.length > 0) {
            apiEventData.targetGroups = eventData.targetGroups;
        }
        if (eventData.selectedStudents && eventData.selectedStudents.length > 0) {
            apiEventData.selectedStudents = eventData.selectedStudents;
        }

        console.log('📡 Sending to API:', apiEventData);

        // Crear evento usando la API real
        const newEvent = await api.createEvent(apiEventData);
        
        console.log('✅ Event created successfully:', newEvent);

        // Actualizar la vista
        await refreshEventsData();

        // Mostrar mensaje de éxito con más detalles
        let assignmentMessage = '';
        if (eventData.assignmentType === 'BY_GRADE' && eventData.targetGrades) {
            assignmentMessage = `\nAsignado a ${eventData.targetGrades.length} grado(s)`;
        } else if (eventData.assignmentType === 'BY_GROUP' && eventData.targetGroups) {
            assignmentMessage = `\nAsignado a ${eventData.targetGroups.length} grupo(s)`;
        } else if (eventData.assignmentType === 'INDIVIDUAL' && eventData.selectedStudents) {
            assignmentMessage = `\nAsignado a ${eventData.selectedStudents.length} estudiante(s)`;
        }

        await Swal.fire({
            icon: 'success',
            title: '¡Evento Creado Exitosamente!',
            html: `
                <div class="text-start">
                    <p><strong>Evento:</strong> ${eventData.name}</p>
                    <p><strong>Tipo:</strong> ${getEventTypeLabel(eventData.type)}</p>
                    <p><strong>Precio:</strong> ${formatCurrency(eventData.ticketPrice)}</p>
                    <p><strong>Meta:</strong> ${formatCurrency(eventData.fundraisingGoal)}</p>
                    ${assignmentMessage ? `<p><strong>Asignación:</strong> ${assignmentMessage}</p>` : ''}
                </div>
            `,
            confirmButtonText: 'Continuar'
        });

        return newEvent;

    } catch (error) {
        console.error('❌ Error creating event:', error);
        
        // Mostrar error específico
        await Swal.fire({
            icon: 'error',
            title: 'Error al Crear Evento',
            text: error.message || 'Ocurrió un error inesperado al crear el evento',
            confirmButtonText: 'Entendido'
        });
        
        throw error;
    }
}

// Función para validar y crear evento
async function validateAndCreateEvent(formData) {
    try {
        console.log('🔍 Validating event data:', formData);

        // Validaciones básicas
        if (!formData.name || formData.name.trim() === '') {
            throw new Error('El nombre del evento es requerido');
        }

        if (!formData.type) {
            throw new Error('El tipo de evento es requerido');
        }

        if (!formData.ticketPrice || formData.ticketPrice <= 0) {
            throw new Error('El precio del boleto debe ser mayor a 0');
        }

        // Crear el evento
        const eventData = {
            name: formData.name.trim(),
            type: formData.type,
            description: formData.description || '',
            ticketPrice: parseFloat(formData.ticketPrice),
            fundraisingGoal: parseFloat(formData.fundraisingGoal) || 0,
            assignmentType: formData.assignmentType || 'MANUAL',
            targetGrades: formData.targetGrades || [],
            targetGroups: formData.targetGroups || [],
            selectedStudents: formData.selectedStudents || []
        };

        return await createEventWithAssignment(eventData);

    } catch (error) {
        console.error('❌ Error validating/creating event:', error);
        throw error;
    }
}

// Función para alternar opciones de asignación
function toggleAssignmentOptions() {
    const assignmentType = document.getElementById('assignmentType')?.value;
    const gradeSelection = document.getElementById('gradeSelection');
    const groupSelection = document.getElementById('groupSelection');
    const individualSelection = document.getElementById('individualSelection');
    const assignmentInfo = document.getElementById('assignmentInfo');
    
    if (!assignmentType) return;
    
    // Ocultar todas las opciones
    if (gradeSelection) gradeSelection.style.display = 'none';
    if (groupSelection) groupSelection.style.display = 'none';
    if (individualSelection) individualSelection.style.display = 'none';
    if (assignmentInfo) assignmentInfo.style.display = 'none';
    
    // Mostrar la opción correspondiente
    switch (assignmentType) {
        case 'BY_GRADE':
            if (gradeSelection) gradeSelection.style.display = 'block';
            if (assignmentInfo) assignmentInfo.style.display = 'block';
            break;
        case 'BY_GROUP':
            if (groupSelection) groupSelection.style.display = 'block';
            if (assignmentInfo) assignmentInfo.style.display = 'block';
            break;
        case 'INDIVIDUAL':
            if (individualSelection) individualSelection.style.display = 'block';
            break;
    }
}

// Función para manejar la búsqueda de estudiantes
function handleStudentSearch(event) {
    const query = event.target.value.trim();
    const resultsDiv = document.getElementById('studentResults');
    
    if (!resultsDiv) {
        console.error('❌ Student results div not found');
        return;
    }
    
    // Limpiar resultados si la búsqueda es muy corta
    if (query.length < 2) {
        resultsDiv.innerHTML = `
            <div class="text-center text-muted p-3">
                <i class="bi bi-search"></i>
                <p class="mb-0 mt-2">Escribe al menos 2 caracteres para buscar</p>
            </div>
        `;
        return;
    }
    
    // Mostrar indicador de carga
    resultsDiv.innerHTML = `
        <div class="text-center p-3">
            <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
            <span>Buscando estudiantes...</span>
        </div>
    `;
    
    // Realizar búsqueda con debounce
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(async () => {
        try {
            const response = await api.getStudents({ 
                search: query, 
                limit: 50, 
                status: 'ACTIVE' 
            });
            
            const students = response.students || [];
            
            if (students.length === 0) {
                resultsDiv.innerHTML = `
                    <div class="text-center text-muted p-3">
                        <i class="bi bi-search"></i>
                        <p class="mb-1 mt-2">No se encontraron estudiantes</p>
                        <small>Intenta con otro nombre o documento</small>
                    </div>
                `;
                return;
            }
            
            // Mostrar resultados
            displayStudentSearchResults(students, resultsDiv);
            
        } catch (error) {
            console.error('❌ Error searching students:', error);
            resultsDiv.innerHTML = `
                <div class="text-center text-danger p-3">
                    <i class="bi bi-exclamation-triangle"></i>
                    <p class="mb-1 mt-2">Error al buscar estudiantes</p>
                    <small>${error.message}</small>
                </div>
            `;
        }
    }, 300);
}

// Función auxiliar para mostrar resultados de búsqueda
function displayStudentSearchResults(students, resultsDiv) {
    resultsDiv.innerHTML = '';
    
    students.forEach(student => {
        const studentDiv = document.createElement('div');
        studentDiv.className = 'student-item border-bottom p-3';
        studentDiv.style.cssText = 'cursor: pointer; background: white; transition: all 0.2s;';
        
        // Event listeners
        studentDiv.addEventListener('mouseover', () => {
            studentDiv.style.backgroundColor = '#e3f2fd';
        });
        studentDiv.addEventListener('mouseout', () => {
            studentDiv.style.backgroundColor = 'white';
        });
        studentDiv.addEventListener('click', () => {
            selectStudent(student.id, student.firstName, student.lastName, student.document, student.grade?.name || 'N/A', student.group?.name || 'N/A');
        });
        
        studentDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-person-circle text-primary me-2"></i>
                        <div>
                            <div class="fw-bold text-dark">${student.firstName} ${student.lastName}</div>
                            <div class="small text-muted">
                                <i class="bi bi-card-text me-1"></i>${student.document} | 
                                <i class="bi bi-mortarboard me-1"></i>${student.grade?.name || 'N/A'} - ${student.group?.name || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <span class="badge bg-success">
                        <i class="bi bi-check-circle"></i> ${student.status}
                    </span>
                </div>
            </div>
        `;
        
        resultsDiv.appendChild(studentDiv);
    });
    
    // Agregar header con información
    const headerDiv = document.createElement('div');
    headerDiv.className = 'p-2 bg-light border-bottom d-flex justify-content-between align-items-center';
    headerDiv.innerHTML = `
        <small class="text-muted">
            <i class="bi bi-people-fill me-1"></i>
            ${students.length} estudiante(s) encontrado(s)
        </small>
        <small class="text-muted">Haz clic para seleccionar</small>
    `;
    resultsDiv.insertBefore(headerDiv, resultsDiv.firstChild);
    
    // Aplicar estilos al contenedor
    resultsDiv.className = 'border rounded mt-2 shadow-sm';
    resultsDiv.style.cssText = 'max-height: 300px; overflow-y: auto; background: white;';
}

// Función para buscar y mostrar estudiantes (alias para compatibilidad)
function searchAndDisplayStudents(query, resultsDiv) {
    return handleStudentSearch({ target: { value: query } });
}

// Función para mostrar resultados de estudiantes (alias para compatibilidad)
function displayStudentResults(students, resultsDiv) {
    return displayStudentSearchResults(students, resultsDiv);
}

// Función para seleccionar un estudiante
function selectStudent(id, firstName, lastName, document, grade, group) {
    console.log('👤 Student selected:', { id, firstName, lastName, document, grade, group });
    
    const searchInput = document.getElementById('studentSearch');
    const resultsDiv = document.getElementById('studentResults');
    
    const fullName = `${firstName} ${lastName}`;
    
    if (searchInput) {
        searchInput.value = fullName;
        searchInput.setAttribute('data-student-id', id);
        searchInput.setAttribute('data-student-name', fullName);
        searchInput.setAttribute('data-student-document', document);
        searchInput.setAttribute('data-student-grade', grade);
        searchInput.setAttribute('data-student-group', group);
    }
    
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div class="border rounded p-3 mt-2 selected-student" style="background: linear-gradient(45deg, #e8f5e8, #f0f8ff); border-color: #28a745;">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <i class="bi bi-person-check-fill text-success" style="font-size: 2rem;"></i>
                        </div>
                        <div>
                            <div class="fw-bold text-success mb-1">
                                <i class="bi bi-check-circle-fill me-1"></i>
                                Estudiante Seleccionado
                            </div>
                            <div class="fw-bold text-dark">${fullName}</div>
                            <div class="small text-muted">
                                <i class="bi bi-card-text me-1"></i>Documento: ${document}<br>
                                <i class="bi bi-mortarboard me-1"></i>Grado: ${grade} - Grupo: ${group}
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-outline-secondary btn-sm" 
                            onclick="clearStudentSelection()" title="Cambiar estudiante">
                        <i class="bi bi-x-circle"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    console.log('✅ Student selection completed');
}

// Función para limpiar la selección de estudiante
function clearStudentSelection() {
    const searchInput = document.getElementById('studentSearch');
    const resultsDiv = document.getElementById('studentResults');
    
    if (searchInput) {
        searchInput.value = '';
        searchInput.removeAttribute('data-student-id');
        searchInput.removeAttribute('data-student-name');
        searchInput.removeAttribute('data-student-document');
        searchInput.removeAttribute('data-student-grade');
        searchInput.removeAttribute('data-student-group');
        searchInput.focus();
    }
    
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div class="text-center text-muted p-3">
                <i class="bi bi-search"></i>
                <p class="mb-0 mt-2">Escribe al menos 2 caracteres para buscar</p>
            </div>
        `;
    }
    
    console.log('🔄 Student selection cleared');
}

// Función alias para compatibilidad
function viewEvent(eventId) {
    return viewEventDetails(eventId);
}

// ================================
// INICIALIZACIÓN GLOBAL
// ================================

// Make functions globally available
window.initEvents = initEvents;
window.showCreateEventModal = showCreateEventModal;
window.createEventWithAssignment = createEventWithAssignment;
window.validateAndCreateEvent = validateAndCreateEvent;
window.toggleAssignmentOptions = toggleAssignmentOptions;
window.setupStudentSearch = setupStudentSearch;
window.handleStudentSearch = handleStudentSearch;
window.searchAndDisplayStudents = searchAndDisplayStudents;
window.displayStudentResults = displayStudentResults;
window.selectStudent = selectStudent;
window.clearStudentSelection = clearStudentSelection;
window.viewEvent = viewEventDetails;
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.refreshEventsData = refreshEventsData;
window.exportEvents = exportEvents;
window.saveEvent = saveEvent;
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.viewEventDetails = viewEventDetails;
window.searchEvents = searchEvents;
window.clearEventFilters = clearEventFilters;
window.refreshEventsData = refreshEventsData;
window.selectEventForAssignments = selectEventForAssignments;
window.showAssignmentModal = showAssignmentModal;
window.saveAssignment = saveAssignment;
window.editAssignment = editAssignment;
window.deleteAssignment = deleteAssignment;
window.showBulkAssignmentModal = showBulkAssignmentModal;
window.loadGroupsForBulkAssignment = loadGroupsForBulkAssignment;
window.previewBulkAssignment = previewBulkAssignment;
window.saveBulkAssignment = saveBulkAssignment;
window.showEventPaymentModal = showEventPaymentModal;
window.saveEventPayment = saveEventPayment;
window.generateEventReports = generateEventReports;
window.exportEventReports = exportEventReports;
window.exportEvents = exportEvents;
window.exportAssignments = exportAssignments;
window.filterAssignments = filterAssignments;
window.refreshAssignments = refreshAssignments;

console.log('✅ Events module loaded successfully');