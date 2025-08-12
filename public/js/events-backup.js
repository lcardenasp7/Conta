// Backup del archivo events.js original
// Este archivo contiene una versión mínima funcional

// Variables globales para eventos
let eventsCurrentGrades = [];
let eventsCurrentGroups = [];
let eventsCurrentPage = 1;
let eventsPerPage = 10;
let eventsFilters = {};
let eventsData = [];
let assignmentsData = [];
let selectedEventForAssignments = null;
let eventPaymentsData = [];

// Función principal de inicialización
async function initEvents() {
    try {
        console.log('🎯 Initializing Events Module...');
        
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

            <!-- Content Area -->
            <div class="card">
                <div class="card-body">
                    <h5>Módulo de Eventos Cargado</h5>
                    <p>El módulo de eventos se ha cargado correctamente.</p>
                    <button class="btn btn-primary" onclick="showCreateEventModal()">Crear Evento</button>
                </div>
            </div>
        </div>
    `;
}

// Función para cargar datos iniciales
async function loadInitialEventsData() {
    try {
        console.log('🔄 Loading initial events data...');
        
        // Cargar grados y grupos reales
        await loadEventsGradesAndGroups();
        
        // Cargar datos demo de eventos
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
            }
        ];
        
        console.log('✅ Initial events data loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading initial events data:', error);
    }
}

// Función para cargar grados y grupos reales
async function loadEventsGradesAndGroups() {
    try {
        console.log('🔄 Loading grades and groups for events...');
        
        const [grades, groups] = await Promise.all([
            api.getGrades(),
            api.getGroups()
        ]);
        
        eventsCurrentGrades = grades || [];
        eventsCurrentGroups = groups || [];
        
        console.log(`✅ Loaded ${eventsCurrentGrades.length} grades and ${eventsCurrentGroups.length} groups`);
        
    } catch (error) {
        console.error('Error loading grades and groups:', error);
        // En caso de error, usar datos vacíos pero no fallar
        eventsCurrentGrades = [];
        eventsCurrentGroups = [];
        console.warn('⚠️ Using empty grades and groups data due to API error');
    }
}

// Función para mostrar modal de creación
function showCreateEventModal() {
    console.log('🎯 Opening create event modal...');
    
    // Generar opciones de grados
    const gradeOptions = eventsCurrentGrades.map(grade => 
        `<option value="${grade.id}">${grade.name} (${grade.level})</option>`
    ).join('');
    
    // Generar opciones de grupos agrupados por grado
    const groupsByGrade = {};
    eventsCurrentGroups.forEach(group => {
        const gradeName = eventsCurrentGrades.find(g => g.id === group.gradeId)?.name || 'Sin Grado';
        if (!groupsByGrade[gradeName]) {
            groupsByGrade[gradeName] = [];
        }
        groupsByGrade[gradeName].push(group);
    });
    
    const groupOptions = Object.keys(groupsByGrade).map(gradeName => `
        <optgroup label="${gradeName}">
            ${groupsByGrade[gradeName].map(group => 
                `<option value="${group.id}">${group.name} (Cap: ${group.capacity})</option>`
            ).join('')}
        </optgroup>
    `).join('');
    
    Swal.fire({
        title: 'Crear Nuevo Evento',
        html: `
            <div class="text-start">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Nombre del Evento *</label>
                            <input type="text" class="form-control" id="eventName" placeholder="Nombre del evento">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Tipo de Evento *</label>
                            <select class="form-select" id="eventType">
                                <option value="">Seleccionar tipo</option>
                                <option value="BINGO">Bingo</option>
                                <option value="RAFFLE">Rifa</option>
                                <option value="FUNDRAISING">Recaudación de Fondos</option>
                                <option value="CULTURAL">Evento Cultural</option>
                                <option value="SPORTS">Evento Deportivo</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Precio del Boleto *</label>
                            <div class="input-group">
                                <span class="input-group-text">$</span>
                                <input type="number" class="form-control" id="eventTicketPrice" value="5000" min="0">
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Meta de Recaudación *</label>
                            <div class="input-group">
                                <span class="input-group-text">$</span>
                                <input type="number" class="form-control" id="eventGoal" value="500000" min="0">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label class="form-label">Descripción</label>
                    <textarea class="form-control" id="eventDescription" rows="2" placeholder="Descripción del evento"></textarea>
                </div>
                
                <hr>
                <h6><i class="bi bi-people"></i> Asignación de Estudiantes</h6>
                
                <div class="mb-3">
                    <label class="form-label">Tipo de Asignación</label>
                    <select class="form-select" id="assignmentType" onchange="toggleAssignmentOptions()">
                        <option value="MANUAL">Manual (después del evento)</option>
                        <option value="BY_GRADE">Por Grado(s)</option>
                        <option value="BY_GROUP">Por Grupo(s)</option>
                        <option value="INDIVIDUAL">Individual</option>
                    </select>
                </div>
                
                <div id="gradeSelection" style="display: none;">
                    <div class="mb-3">
                        <label class="form-label">Grados Objetivo</label>
                        <select class="form-select" id="targetGrades" multiple size="4">
                            ${gradeOptions}
                        </select>
                        <small class="text-muted">Mantén Ctrl para seleccionar múltiples grados</small>
                    </div>
                </div>
                
                <div id="groupSelection" style="display: none;">
                    <div class="mb-3">
                        <label class="form-label">Grupos Objetivo</label>
                        <select class="form-select" id="targetGroups" multiple size="6">
                            ${groupOptions}
                        </select>
                        <small class="text-muted">Mantén Ctrl para seleccionar múltiples grupos</small>
                    </div>
                </div>
                
                <div id="individualSelection" style="display: none;">
                    <div class="mb-3">
                        <label class="form-label">Buscar Estudiante</label>
                        <input type="text" class="form-control" id="studentSearch" placeholder="Buscar por nombre o documento...">
                        <div id="studentResults" class="mt-2"></div>
                    </div>
                </div>
                
                <div id="assignmentInfo" class="alert alert-info" style="display: none;">
                    <i class="bi bi-info-circle"></i> Se asignarán boletos automáticamente a todos los estudiantes activos de los grados/grupos seleccionados.
                </div>
            </div>
        `,
        width: '800px',
        showCancelButton: true,
        confirmButtonText: 'Crear Evento',
        cancelButtonText: 'Cancelar',
        didOpen: () => {
            // Setup student search functionality
            setupStudentSearchInModal();
        },
        preConfirm: () => {
            const name = document.getElementById('eventName').value;
            const type = document.getElementById('eventType').value;
            const ticketPrice = document.getElementById('eventTicketPrice').value;
            const goal = document.getElementById('eventGoal').value;
            const description = document.getElementById('eventDescription').value;
            const assignmentType = document.getElementById('assignmentType').value;
            
            if (!name || !type || !ticketPrice || !goal) {
                Swal.showValidationMessage('Por favor complete todos los campos obligatorios');
                return false;
            }
            
            const eventData = {
                name,
                type,
                ticketPrice: parseFloat(ticketPrice),
                fundraisingGoal: parseFloat(goal),
                description,
                assignmentType
            };
            
            // Agregar datos de asignación según el tipo
            if (assignmentType === 'BY_GRADE') {
                const selectedGrades = Array.from(document.getElementById('targetGrades').selectedOptions)
                    .map(option => option.value);
                if (selectedGrades.length === 0) {
                    Swal.showValidationMessage('Debe seleccionar al menos un grado');
                    return false;
                }
                eventData.targetGrades = selectedGrades;
            } else if (assignmentType === 'BY_GROUP') {
                const selectedGroups = Array.from(document.getElementById('targetGroups').selectedOptions)
                    .map(option => option.value);
                if (selectedGroups.length === 0) {
                    Swal.showValidationMessage('Debe seleccionar al menos un grupo');
                    return false;
                }
                eventData.targetGroups = selectedGroups;
            }
            
            return eventData;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            console.log('Evento a crear:', result.value);
            createEventWithAssignments(result.value);
        }
    });
}

// Función para refrescar datos
async function refreshEventsData() {
    try {
        console.log('🔄 Refreshing events data...');
        await loadInitialEventsData();
        showSuccess('Datos actualizados exitosamente');
    } catch (error) {
        console.error('Error refreshing events data:', error);
        showError('Error al actualizar datos');
    }
}

// Setup event listeners básico
function setupEventsEventListeners() {
    console.log('🔧 Setting up event listeners...');
    // Event listeners básicos aquí
}

// Funciones auxiliares
function showSuccess(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: message,
            timer: 3000,
            showConfirmButton: false
        });
    } else {
        alert(message);
    }
}

function showError(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message
        });
    } else {
        alert('Error: ' + message);
    }
}

console.log('✅ Events module loaded successfully');
console.log('🔧 Available functions: initEvents(), showCreateEventModal(), refreshEventsData()');

// Función para alternar opciones de asignación
function toggleAssignmentOptions() {
    const assignmentType = document.getElementById('assignmentType').value;
    const gradeSelection = document.getElementById('gradeSelection');
    const groupSelection = document.getElementById('groupSelection');
    const individualSelection = document.getElementById('individualSelection');
    const assignmentInfo = document.getElementById('assignmentInfo');
    
    // Ocultar todas las opciones
    gradeSelection.style.display = 'none';
    groupSelection.style.display = 'none';
    individualSelection.style.display = 'none';
    assignmentInfo.style.display = 'none';
    
    // Mostrar la opción correspondiente
    switch (assignmentType) {
        case 'BY_GRADE':
            gradeSelection.style.display = 'block';
            assignmentInfo.style.display = 'block';
            break;
        case 'BY_GROUP':
            groupSelection.style.display = 'block';
            assignmentInfo.style.display = 'block';
            break;
        case 'INDIVIDUAL':
            individualSelection.style.display = 'block';
            break;
    }
}

// Función para configurar búsqueda de estudiantes en el modal
function setupStudentSearchInModal() {
    const searchInput = document.getElementById('studentSearch');
    const resultsDiv = document.getElementById('studentResults');
    
    if (!searchInput || !resultsDiv) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            resultsDiv.innerHTML = '';
            return;
        }
        
        searchTimeout = setTimeout(async () => {
            try {
                console.log('🔍 Searching students with query:', query);
                
                let students = [];
                try {
                    const response = await api.getStudents({ search: query, limit: 10, status: 'ACTIVE' });
                    students = response.students || response || [];
                } catch (apiError) {
                    console.log('ℹ️ Students API not available, using demo data:', apiError.message);
                    
                    // Datos demo para búsqueda de estudiantes
                    const demoStudents = [
                        { id: 'demo-student-1', firstName: 'Juan', lastName: 'Pérez', document: '1234567890', grade: { name: '10°' }, group: { name: 'A' }, status: 'ACTIVE' },
                        { id: 'demo-student-2', firstName: 'María', lastName: 'González', document: '0987654321', grade: { name: '11°' }, group: { name: 'B' }, status: 'ACTIVE' },
                        { id: 'demo-student-3', firstName: 'Carlos', lastName: 'López', document: '1122334455', grade: { name: '9°' }, group: { name: 'A' }, status: 'ACTIVE' },
                        { id: 'demo-student-4', firstName: 'Ana', lastName: 'Martínez', document: '5566778899', grade: { name: '10°' }, group: { name: 'B' }, status: 'ACTIVE' },
                        { id: 'demo-student-5', firstName: 'Luis', lastName: 'Rodríguez', document: '9988776655', grade: { name: '11°' }, group: { name: 'A' }, status: 'ACTIVE' }
                    ];
                    
                    students = demoStudents.filter(student => 
                        student.firstName.toLowerCase().includes(query.toLowerCase()) ||
                        student.lastName.toLowerCase().includes(query.toLowerCase()) ||
                        student.document.includes(query)
                    );
                }
                
                displayStudentSearchResults(students, resultsDiv);
                
            } catch (error) {
                console.error('Error searching students:', error);
                resultsDiv.innerHTML = '<div class="alert alert-danger">Error al buscar estudiantes</div>';
            }
        }, 300);
    });
}

// Función para mostrar resultados de búsqueda de estudiantes
function displayStudentSearchResults(students, container) {
    if (!students || students.length === 0) {
        container.innerHTML = '<div class="text-muted small"><i class="bi bi-search"></i> No se encontraron estudiantes</div>';
        return;
    }
    
    console.log(`📋 Displaying ${students.length} student search results`);
    
    container.innerHTML = `
        <div class="border rounded p-2" style="max-height: 200px; overflow-y: auto;">
            ${students.map(student => `
                <div class="d-flex justify-content-between align-items-center p-2 border-bottom student-result" 
                     style="cursor: pointer;" 
                     onclick="selectStudent('${student.id}', '${student.firstName} ${student.lastName}')">
                    <div>
                        <strong>${student.firstName} ${student.lastName}</strong><br>
                        <small class="text-muted">
                            <i class="bi bi-card-text"></i> ${student.document} | 
                            <i class="bi bi-mortarboard"></i> ${student.grade?.name || 'N/A'} - ${student.group?.name || 'N/A'}
                        </small>
                    </div>
                    <span class="badge bg-success">Activo</span>
                </div>
            `).join('')}
        </div>
    `;
}

// Función para seleccionar un estudiante
function selectStudent(studentId, studentName) {
    console.log('👤 Student selected:', { studentId, studentName });
    
    const searchInput = document.getElementById('studentSearch');
    const resultsDiv = document.getElementById('studentResults');
    
    if (searchInput) {
        searchInput.value = studentName;
        searchInput.setAttribute('data-student-id', studentId);
    }
    
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div class="alert alert-success">
                <i class="bi bi-check-circle"></i> Estudiante seleccionado: <strong>${studentName}</strong>
            </div>
        `;
    }
}

// Función para crear evento con asignaciones
async function createEventWithAssignments(eventData) {
    try {
        console.log('🔄 Creating event with assignments:', eventData);
        
        // Simular creación del evento
        const newEvent = {
            id: `demo-${Date.now()}`,
            name: eventData.name,
            type: eventData.type,
            description: eventData.description || '',
            eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +1 semana
            ticketPrice: eventData.ticketPrice,
            fundraisingGoal: eventData.fundraisingGoal,
            totalRaised: 0,
            progress: 0,
            status: 'PLANNING',
            responsible: 'Usuario Actual',
            assignmentType: eventData.assignmentType
        };
        
        // Agregar el evento a la lista
        eventsData.unshift(newEvent);
        
        // Simular asignaciones según el tipo
        let assignmentMessage = '';
        if (eventData.assignmentType === 'BY_GRADE' && eventData.targetGrades) {
            const gradeNames = eventData.targetGrades.map(gradeId => {
                const grade = eventsCurrentGrades.find(g => g.id === gradeId);
                return grade ? grade.name : gradeId;
            }).join(', ');
            assignmentMessage = `Se asignarán boletos automáticamente a todos los estudiantes de: ${gradeNames}`;
        } else if (eventData.assignmentType === 'BY_GROUP' && eventData.targetGroups) {
            const groupNames = eventData.targetGroups.map(groupId => {
                const group = eventsCurrentGroups.find(g => g.id === groupId);
                const grade = group ? eventsCurrentGrades.find(gr => gr.id === group.gradeId) : null;
                return group ? `${grade?.name || ''} - ${group.name}` : groupId;
            }).join(', ');
            assignmentMessage = `Se asignarán boletos automáticamente a todos los estudiantes de: ${groupNames}`;
        } else if (eventData.assignmentType === 'INDIVIDUAL') {
            assignmentMessage = 'Podrás asignar boletos individualmente desde la pestaña de Asignaciones';
        } else {
            assignmentMessage = 'Podrás configurar las asignaciones más tarde desde la pestaña de Asignaciones';
        }
        
        // Mostrar mensaje de éxito
        await Swal.fire({
            icon: 'success',
            title: 'Evento Creado Exitosamente',
            html: `
                <div class="text-start">
                    <p><strong>Evento:</strong> ${eventData.name}</p>
                    <p><strong>Tipo:</strong> ${getEventTypeLabel(eventData.type)}</p>
                    <p><strong>Precio del Boleto:</strong> $${eventData.ticketPrice.toLocaleString()}</p>
                    <p><strong>Meta:</strong> $${eventData.fundraisingGoal.toLocaleString()}</p>
                    <hr>
                    <p class="text-info"><i class="bi bi-info-circle"></i> ${assignmentMessage}</p>
                </div>
            `,
            confirmButtonText: 'Continuar'
        });
        
        console.log('✅ Event created successfully with assignments');
        
    } catch (error) {
        console.error('❌ Error creating event with assignments:', error);
        showError('Error al crear evento: ' + error.message);
    }
}

// Función para obtener etiqueta del tipo de evento
function getEventTypeLabel(type) {
    const types = {
        'FUNDRAISING': 'Recaudación de Fondos',
        'SOCIAL': 'Evento Social',
        'ACADEMIC': 'Evento Académico',
        'CULTURAL': 'Evento Cultural',
        'SPORTS': 'Evento Deportivo',
        'BINGO': 'Bingo',
        'RAFFLE': 'Rifa',
        'CONTEST': 'Concurso',
        'OTHER': 'Otro'
    };
    return types[type] || type;
}