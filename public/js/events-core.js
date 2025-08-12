// ================================
// EVENTOS ESCOLARES - MÓDULO PRINCIPAL
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

// Variables globales para eventos
let eventsCurrentGrades = [];
let eventsCurrentGroups = [];
let eventsCurrentPage = 1;
let eventsPerPage = 10;
let eventsFilters = {};
let eventsData = [];

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
                    <button class="nav-link" id="events-assignments-tab" data-bs-toggle="tab" data-bs-target="#events-assignments" type="button" role="tab" onclick="initEventAssignments()">
                        <i class="bi bi-person-check"></i> Asignaciones
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="events-reports-tab" data-bs-toggle="tab" data-bs-target="#events-reports" type="button" role="tab" onclick="initEventReports()">
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
                    <div id="assignments-content">
                        <div class="text-center p-4">
                            <i class="bi bi-hourglass-split fs-1 text-muted"></i>
                            <p class="text-muted">Cargando módulo de asignaciones...</p>
                        </div>
                    </div>
                </div>
                
                <!-- REPORTES -->
                <div class="tab-pane fade" id="events-reports" role="tabpanel">
                    <div id="reports-content">
                        <div class="text-center p-4">
                            <i class="bi bi-hourglass-split fs-1 text-muted"></i>
                            <p class="text-muted">Cargando módulo de reportes...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Event Modal -->
        ${getEventModalTemplate()}
    `;
}

// Template para la lista de eventos
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
                            <option value="GRADUATION_FEE">Derecho de Grado</option>
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

// Modal Template para eventos
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
                                            <option value="GRADUATION_FEE">Derecho de Grado</option>
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
                            <div class="mb-3">
                                <label for="eventResponsible" class="form-label">Responsable</label>
                                <input type="text" class="form-control" id="eventResponsible" name="responsible">
                            </div>
                            <div class="mb-3">
                                <label for="eventStatus" class="form-label">Estado</label>
                                <select class="form-select" id="eventStatus" name="status">
                                    <option value="PLANNING">En Planificación</option>
                                    <option value="ACTIVE">Activo</option>
                                    <option value="COMPLETED">Completado</option>
                                    <option value="CANCELLED">Cancelado</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="saveEvent()">Guardar Evento</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ================================
// FUNCIONES PRINCIPALES DE EVENTOS
// ================================

// Cargar datos iniciales
async function loadInitialEventsData() {
    try {
        console.log('📊 Loading initial events data...');
        
        // Cargar grados y grupos
        await Promise.all([
            loadGradesAndGroups(),
            loadEvents()
        ]);
        
        console.log('✅ Initial data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading initial data:', error);
        showError('Error al cargar datos iniciales: ' + error.message);
    }
}

// Cargar grados y grupos
async function loadGradesAndGroups() {
    try {
        const [grades, groups] = await Promise.all([
            api.getGrades(),
            api.getGroups()
        ]);
        
        eventsCurrentGrades = grades;
        eventsCurrentGroups = groups;
        
        console.log('✅ Grades and groups loaded:', { grades: grades.length, groups: groups.length });
    } catch (error) {
        console.error('❌ Error loading grades and groups:', error);
        throw error;
    }
}

// Cargar eventos
async function loadEvents() {
    try {
        console.log('📅 Loading events...');
        
        const events = await api.getEvents();
        eventsData = events;
        
        updateEventsStats(events);
        renderEventsTable(events);
        
        console.log('✅ Events loaded:', events.length);
    } catch (error) {
        console.error('❌ Error loading events:', error);
        showError('Error al cargar eventos: ' + error.message);
    }
}

// Actualizar estadísticas
function updateEventsStats(events) {
    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.status === 'ACTIVE').length;
    const totalRaised = events.reduce((sum, e) => sum + (e.totalRaised || 0), 0);
    const thisMonth = new Date();
    const eventsThisMonth = events.filter(e => {
        const eventDate = new Date(e.eventDate);
        return eventDate.getMonth() === thisMonth.getMonth() && 
               eventDate.getFullYear() === thisMonth.getFullYear();
    }).length;

    document.getElementById('totalEventsCount').textContent = totalEvents;
    document.getElementById('activeEventsCount').textContent = activeEvents;
    document.getElementById('totalRaisedAmount').textContent = formatCurrency(totalRaised);
    document.getElementById('eventsThisMonthCount').textContent = eventsThisMonth;
}

// Renderizar tabla de eventos
function renderEventsTable(events) {
    const tbody = document.getElementById('eventsTableBody');
    
    if (!tbody) {
        console.error('❌ Events table body not found');
        return;
    }

    if (events.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    <i class="bi bi-calendar-x fs-1 text-muted"></i>
                    <p class="text-muted mt-2">No hay eventos registrados</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = events.map(event => `
        <tr>
            <td>
                <div class="fw-bold">${event.name}</div>
                <small class="text-muted">${event.description || 'Sin descripción'}</small>
            </td>
            <td>
                <span class="badge bg-secondary">${getEventTypeLabel(event.type)}</span>
            </td>
            <td>${formatDateTime(event.eventDate)}</td>
            <td>${formatCurrency(event.ticketPrice)}</td>
            <td>${formatCurrency(event.fundraisingGoal)}</td>
            <td>${formatCurrency(event.totalRaised || 0)}</td>
            <td>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${event.progress || 0}%" 
                         aria-valuenow="${event.progress || 0}" 
                         aria-valuemin="0" aria-valuemax="100">
                        ${event.progress || 0}%
                    </div>
                </div>
            </td>
            <td>
                <span class="badge ${getEventStatusClass(event.status)}">${getEventStatusLabel(event.status)}</span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewEvent('${event.id}')" title="Ver">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning" onclick="editEvent('${event.id}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteEvent('${event.id}')" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ================================
// FUNCIONES DE EVENTOS
// ================================

// Mostrar modal de crear evento
function showCreateEventModal() {
    document.getElementById('eventModalTitle').textContent = 'Crear Nuevo Evento';
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    
    // Establecer fecha por defecto (mañana)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('eventDate').value = tomorrow.toISOString().slice(0, 16);
    
    const modal = new bootstrap.Modal(document.getElementById('eventModal'));
    modal.show();
}

// Guardar evento
async function saveEvent() {
    try {
        const form = document.getElementById('eventForm');
        const formData = new FormData(form);
        
        const eventData = {
            name: formData.get('name'),
            type: formData.get('type'),
            description: formData.get('description'),
            eventDate: formData.get('eventDate'),
            location: formData.get('location'),
            ticketPrice: parseFloat(formData.get('ticketPrice')),
            fundraisingGoal: parseFloat(formData.get('fundraisingGoal')),
            responsible: formData.get('responsible'),
            status: formData.get('status') || 'PLANNING'
        };

        const eventId = document.getElementById('eventId').value;
        
        let result;
        if (eventId) {
            result = await api.updateEvent(eventId, eventData);
            showSuccess('Evento actualizado exitosamente');
        } else {
            result = await api.createEvent(eventData);
            showSuccess('Evento creado exitosamente');
        }

        // Cerrar modal y recargar datos
        bootstrap.Modal.getInstance(document.getElementById('eventModal')).hide();
        await loadEvents();
        
    } catch (error) {
        console.error('❌ Error saving event:', error);
        showError('Error al guardar evento: ' + error.message);
    }
}

// Ver evento
async function viewEvent(eventId) {
    try {
        const event = await api.getEvent(eventId);
        // Implementar vista detallada del evento
        console.log('View event:', event);
    } catch (error) {
        console.error('❌ Error viewing event:', error);
        showError('Error al ver evento: ' + error.message);
    }
}

// Editar evento
async function editEvent(eventId) {
    try {
        const event = await api.getEvent(eventId);
        
        document.getElementById('eventModalTitle').textContent = 'Editar Evento';
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
        
        const modal = new bootstrap.Modal(document.getElementById('eventModal'));
        modal.show();
        
    } catch (error) {
        console.error('❌ Error editing event:', error);
        showError('Error al editar evento: ' + error.message);
    }
}

// Eliminar evento
async function deleteEvent(eventId) {
    try {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            await api.deleteEvent(eventId);
            showSuccess('Evento eliminado exitosamente');
            await loadEvents();
        }
    } catch (error) {
        console.error('❌ Error deleting event:', error);
        showError('Error al eliminar evento: ' + error.message);
    }
}

// ================================
// FUNCIONES DE BÚSQUEDA Y FILTROS
// ================================

function searchEvents() {
    const search = document.getElementById('eventSearch').value.toLowerCase();
    const typeFilter = document.getElementById('eventTypeFilter').value;
    const statusFilter = document.getElementById('eventStatusFilter').value;
    const monthFilter = document.getElementById('eventMonthFilter').value;

    let filteredEvents = eventsData;

    if (search) {
        filteredEvents = filteredEvents.filter(event => 
            event.name.toLowerCase().includes(search) ||
            (event.description && event.description.toLowerCase().includes(search))
        );
    }

    if (typeFilter) {
        filteredEvents = filteredEvents.filter(event => event.type === typeFilter);
    }

    if (statusFilter) {
        filteredEvents = filteredEvents.filter(event => event.status === statusFilter);
    }

    if (monthFilter) {
        const [year, month] = monthFilter.split('-');
        filteredEvents = filteredEvents.filter(event => {
            const eventDate = new Date(event.eventDate);
            return eventDate.getFullYear() == year && 
                   (eventDate.getMonth() + 1) == month;
        });
    }

    renderEventsTable(filteredEvents);
}

function clearEventFilters() {
    document.getElementById('eventSearch').value = '';
    document.getElementById('eventTypeFilter').value = '';
    document.getElementById('eventStatusFilter').value = '';
    document.getElementById('eventMonthFilter').value = '';
    
    renderEventsTable(eventsData);
}

// ================================
// FUNCIONES DE UTILIDAD
// ================================

function refreshEventsData() {
    return loadEvents();
}

function refreshEvents() {
    return loadEvents();
}

function exportEvents() {
    // Implementar exportación de eventos
    console.log('Export events functionality');
}

// Setup event listeners
function setupEventsEventListeners() {
    // Búsqueda en tiempo real
    const searchInput = document.getElementById('eventSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchEvents, 300));
    }
}

// ================================
// FUNCIONES DE FORMATO Y UTILIDAD
// ================================

function getEventTypeLabel(type) {
    const types = {
        'FUNDRAISING': 'Recaudación',
        'SOCIAL': 'Social',
        'ACADEMIC': 'Académico',
        'CULTURAL': 'Cultural',
        'SPORTS': 'Deportivo',
        'BINGO': 'Bingo',
        'RAFFLE': 'Rifa',
        'GRADUATION_FEE': 'Derecho de Grado',
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
        'COMPLETED': 'bg-info',
        'CANCELLED': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount || 0);
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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

function showSuccess(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Éxito',
            text: message,
            icon: 'success',
            timer: 2000,
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
// EXPORTAR FUNCIONES GLOBALMENTE
// ================================

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
    window.initEvents = initEvents;
    window.showCreateEventModal = showCreateEventModal;
    window.saveEvent = saveEvent;
    window.editEvent = editEvent;
    window.deleteEvent = deleteEvent;
    window.viewEvent = viewEvent;
    window.searchEvents = searchEvents;
    window.clearEventFilters = clearEventFilters;
    window.refreshEventsData = refreshEventsData;
    window.refreshEvents = refreshEvents;
    window.exportEvents = exportEvents;
    
    console.log('✅ Events core functions exported globally');
}