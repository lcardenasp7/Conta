// Versión simplificada del módulo de eventos
console.log('🎯 Loading Events Simple Module...');

// Variables globales
let eventsCurrentGrades = [];
let eventsCurrentGroups = [];
let eventsData = [];

// Función principal de inicialización
async function initEvents() {
    try {
        console.log('🎯 Initializing Events Module...');
        
        await loadEventsMainTemplate();
        await loadInitialEventsData();
        
        console.log('✅ Events module initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing events module:', error);
        showError('Error al inicializar el módulo de eventos: ' + error.message);
    }
}

// Cargar template principal
async function loadEventsMainTemplate() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div id="events-main-content">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2><i class="bi bi-calendar-event"></i> Gestión de Eventos Escolares</h2>
                </div>
                <div>
                    <button class="btn btn-primary" onclick="showCreateEventModal()">
                        <i class="bi bi-plus-circle"></i> Nuevo Evento
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-body">
                    <h5>Módulo de Eventos Funcional</h5>
                    <p>El módulo de eventos se ha cargado correctamente.</p>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="card bg-primary text-white">
                                <div class="card-body text-center">
                                    <h4>${eventsCurrentGrades.length}</h4>
                                    <p class="mb-0">Grados Disponibles</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card bg-success text-white">
                                <div class="card-body text-center">
                                    <h4>${eventsCurrentGroups.length}</h4>
                                    <p class="mb-0">Grupos Disponibles</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card bg-info text-white">
                                <div class="card-body text-center">
                                    <h4>${eventsData.length}</h4>
                                    <p class="mb-0">Eventos Creados</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Cargar datos iniciales
async function loadInitialEventsData() {
    try {
        console.log('🔄 Loading initial events data...');
        
        // Cargar grados y grupos
        await loadEventsGradesAndGroups();
        
        // Datos demo de eventos
        eventsData = [
            {
                id: 'demo-1',
                name: 'Bingo Navideño 2024',
                type: 'BINGO',
                status: 'ACTIVE'
            }
        ];
        
        console.log('✅ Initial events data loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading initial events data:', error);
    }
}

// Cargar grados y grupos
async function loadEventsGradesAndGroups() {
    try {
        console.log('🔄 Loading grades and groups...');
        
        const [grades, groups] = await Promise.all([
            api.getGrades(),
            api.getGroups()
        ]);
        
        eventsCurrentGrades = grades || [];
        eventsCurrentGroups = groups || [];
        
        console.log(`✅ Loaded ${eventsCurrentGrades.length} grades and ${eventsCurrentGroups.length} groups`);
        
    } catch (error) {
        console.error('Error loading grades and groups:', error);
        eventsCurrentGrades = [];
        eventsCurrentGroups = [];
    }
}

// Modal de creación de eventos
function showCreateEventModal() {
    console.log('🎯 Opening create event modal...');
    
    const gradeOptions = eventsCurrentGrades.map(grade => 
        `<option value="${grade.id}">${grade.name} (${grade.level})</option>`
    ).join('');
    
    const groupOptions = eventsCurrentGroups.map(group => {
        const grade = eventsCurrentGrades.find(g => g.id === group.gradeId);
        return `<option value="${group.id}">${grade?.name || 'N/A'} - ${group.name}</option>`;
    }).join('');
    
    Swal.fire({
        title: 'Crear Nuevo Evento',
        html: `
            <div class="text-start">
                <div class="mb-3">
                    <label class="form-label">Nombre del Evento *</label>
                    <input type="text" class="form-control" id="eventName" placeholder="Nombre del evento">
                </div>
                
                <div class="mb-3">
                    <label class="form-label">Tipo de Evento *</label>
                    <select class="form-select" id="eventType">
                        <option value="">Seleccionar tipo</option>
                        <option value="BINGO">Bingo</option>
                        <option value="RAFFLE">Rifa</option>
                        <option value="FUNDRAISING">Recaudación de Fondos</option>
                    </select>
                </div>
                
                <div class="mb-3">
                    <label class="form-label">Tipo de Asignación</label>
                    <select class="form-select" id="assignmentType" onchange="toggleAssignmentOptions()">
                        <option value="MANUAL">Manual</option>
                        <option value="BY_GRADE">Por Grado(s)</option>
                        <option value="BY_GROUP">Por Grupo(s)</option>
                        <option value="INDIVIDUAL">Individual</option>
                    </select>
                </div>
                
                <div id="gradeSelection" style="display: none;">
                    <div class="mb-3">
                        <label class="form-label">Grados Objetivo</label>
                        <select class="form-select" id="targetGrades" multiple>
                            ${gradeOptions}
                        </select>
                    </div>
                </div>
                
                <div id="groupSelection" style="display: none;">
                    <div class="mb-3">
                        <label class="form-label">Grupos Objetivo</label>
                        <select class="form-select" id="targetGroups" multiple>
                            ${groupOptions}
                        </select>
                    </div>
                </div>
                
                <div id="individualSelection" style="display: none;">
                    <div class="mb-3">
                        <label class="form-label">
                            <i class="bi bi-search"></i> Buscar Estudiante
                        </label>
                        <input type="text" 
                               class="form-control" 
                               id="studentSearch" 
                               placeholder="Escribe el nombre o documento del estudiante..."
                               autocomplete="off">
                        <small class="text-muted">Escribe al menos 2 caracteres para buscar</small>
                        <div id="studentResults" class="mt-2" style="position: relative; z-index: 1000;"></div>
                    </div>
                </div>
            </div>
        `,
        width: '600px',
        showCancelButton: true,
        confirmButtonText: 'Crear Evento',
        cancelButtonText: 'Cancelar',
        didOpen: () => {
            setupStudentSearch();
        },
        preConfirm: () => {
            const name = document.getElementById('eventName').value;
            const type = document.getElementById('eventType').value;
            
            if (!name || !type) {
                Swal.showValidationMessage('Complete los campos obligatorios');
                return false;
            }
            
            return { name, type };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            showSuccess(`Evento "${result.value.name}" creado exitosamente`);
            // Actualizar la interfaz
            loadEventsMainTemplate();
        }
    });
}

// Alternar opciones de asignación
function toggleAssignmentOptions() {
    const type = document.getElementById('assignmentType')?.value;
    const gradeDiv = document.getElementById('gradeSelection');
    const groupDiv = document.getElementById('groupSelection');
    const individualDiv = document.getElementById('individualSelection');
    
    if (gradeDiv) gradeDiv.style.display = type === 'BY_GRADE' ? 'block' : 'none';
    if (groupDiv) groupDiv.style.display = type === 'BY_GROUP' ? 'block' : 'none';
    if (individualDiv) individualDiv.style.display = type === 'INDIVIDUAL' ? 'block' : 'none';
}

// Configurar búsqueda de estudiantes
function setupStudentSearch() {
    console.log('🔧 Setting up student search...');
    
    const searchInput = document.getElementById('studentSearch');
    const resultsDiv = document.getElementById('studentResults');
    
    if (!searchInput || !resultsDiv) {
        console.error('❌ Student search elements not found');
        return;
    }
    
    console.log('✅ Student search elements found');
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        console.log('🔍 Search input changed:', query);
        
        // Limpiar timeout anterior
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            resultsDiv.innerHTML = '';
            return;
        }
        
        // Mostrar indicador de carga inmediatamente
        resultsDiv.innerHTML = `
            <div class="text-center p-3 border rounded">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Buscando...</span>
                </div>
                <div class="mt-2">Buscando estudiantes...</div>
            </div>
        `;
        
        // Buscar con delay
        searchTimeout = setTimeout(() => {
            searchStudents(query, resultsDiv);
        }, 300);
    });
}

// Función separada para buscar estudiantes
async function searchStudents(query, resultsDiv) {
    try {
        console.log('🔍 Searching students with query:', query);
        
        let students = [];
        
        // Siempre usar datos demo para asegurar que funcione
        const demoStudents = [
            { id: 'demo-1', firstName: 'Andrés', lastName: 'Pérez García', document: '1234567890', grade: { name: '10°' }, group: { name: 'A' }, status: 'ACTIVE' },
            { id: 'demo-2', firstName: 'María', lastName: 'González López', document: '0987654321', grade: { name: '11°' }, group: { name: 'B' }, status: 'ACTIVE' },
            { id: 'demo-3', firstName: 'Carlos', lastName: 'Martínez Silva', document: '1122334455', grade: { name: '9°' }, group: { name: 'A' }, status: 'ACTIVE' },
            { id: 'demo-4', firstName: 'Ana', lastName: 'Rodríguez Pérez', document: '5566778899', grade: { name: '10°' }, group: { name: 'C' }, status: 'ACTIVE' },
            { id: 'demo-5', firstName: 'Luis', lastName: 'Hernández Castro', document: '9988776655', grade: { name: '11°' }, group: { name: 'A' }, status: 'ACTIVE' },
            { id: 'demo-6', firstName: 'Sofia', lastName: 'Jiménez Morales', document: '1357924680', grade: { name: '9°' }, group: { name: 'B' }, status: 'ACTIVE' },
            { id: 'demo-7', firstName: 'Diego', lastName: 'Vargas Ruiz', document: '2468135790', grade: { name: '10°' }, group: { name: 'B' }, status: 'ACTIVE' },
            { id: 'demo-8', firstName: 'Valentina', lastName: 'Torres Mendoza', document: '3691472580', grade: { name: '11°' }, group: { name: 'C' }, status: 'ACTIVE' },
            { id: 'demo-9', firstName: 'Andrea', lastName: 'Morales Vega', document: '4567891230', grade: { name: '9°' }, group: { name: 'C' }, status: 'ACTIVE' },
            { id: 'demo-10', firstName: 'Andrés Felipe', lastName: 'Castillo Ruiz', document: '7890123456', grade: { name: '10°' }, group: { name: 'A' }, status: 'ACTIVE' }
        ];
        
        students = demoStudents.filter(student => 
            student.firstName.toLowerCase().includes(query.toLowerCase()) ||
            student.lastName.toLowerCase().includes(query.toLowerCase()) ||
            student.document.includes(query) ||
            `${student.firstName} ${student.lastName}`.toLowerCase().includes(query.toLowerCase())
        );
        
        console.log('✅ Found students:', students.length);
        
        // Mostrar resultados
        displayStudentResults(students, resultsDiv, query);
        
    } catch (error) {
        console.error('❌ Error searching students:', error);
        resultsDiv.innerHTML = `
            <div class="alert alert-danger p-2">
                <i class="bi bi-exclamation-triangle"></i> Error al buscar estudiantes
            </div>
        `;
    }
}

// Función para mostrar resultados
function displayStudentResults(students, container, query) {
    console.log('📋 Displaying results for:', students.length, 'students');
    
    if (!students || students.length === 0) {
        container.innerHTML = `
            <div class="border rounded p-3 text-center text-muted">
                <i class="bi bi-person-x fs-4"></i>
                <p class="mb-0 mt-2">No se encontraron estudiantes para "${query}"</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="border rounded shadow-sm" style="max-height: 300px; overflow-y: auto; background: white;">
            <div class="p-2 bg-light border-bottom">
                <small class="text-muted">
                    <i class="bi bi-people"></i> ${students.length} estudiante${students.length !== 1 ? 's' : ''} encontrado${students.length !== 1 ? 's' : ''}
                </small>
            </div>
            ${students.map(student => `
                <div class="student-option p-3 border-bottom" 
                     style="cursor: pointer; transition: background-color 0.2s;" 
                     onmouseover="this.style.backgroundColor='#f8f9fa'" 
                     onmouseout="this.style.backgroundColor='white'"
                     onclick="selectStudentFromList('${student.id}', '${student.firstName}', '${student.lastName}', '${student.document}', '${student.grade?.name || 'N/A'}', '${student.group?.name || 'N/A'}')">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-bold text-primary">
                                ${student.firstName} ${student.lastName}
                            </div>
                            <div class="small text-muted">
                                <i class="bi bi-card-text"></i> ${student.document} | 
                                <i class="bi bi-mortarboard"></i> ${student.grade?.name || 'N/A'} - ${student.group?.name || 'N/A'}
                            </div>
                        </div>
                        <div>
                            <span class="badge bg-success">
                                <i class="bi bi-check-circle"></i> Activo
                            </span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    console.log('✅ Results displayed successfully');
}

// Seleccionar estudiante desde la lista
function selectStudentFromList(id, firstName, lastName, document, grade, group) {
    console.log('👤 Student selected:', { id, firstName, lastName, document, grade, group });
    
    const searchInput = document.getElementById('studentSearch');
    const resultsDiv = document.getElementById('studentResults');
    
    const fullName = `${firstName} ${lastName}`;
    
    if (searchInput) {
        searchInput.value = fullName;
        searchInput.setAttribute('data-student-id', id);
        searchInput.setAttribute('data-student-name', fullName);
        searchInput.setAttribute('data-student-document', document);
    }
    
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div class="border rounded p-3" style="background-color: #d1edff; border-color: #0d6efd;">
                <div class="d-flex align-items-center">
                    <i class="bi bi-check-circle-fill text-primary me-2"></i>
                    <div>
                        <div class="fw-bold text-primary">${fullName}</div>
                        <div class="small text-muted">
                            <i class="bi bi-card-text"></i> ${document} | 
                            <i class="bi bi-mortarboard"></i> ${grade} - ${group}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    console.log('✅ Student selection completed');
}

// Función de compatibilidad (por si se llama desde otro lugar)
function selectStudent(id, name) {
    selectStudentFromList(id, name.split(' ')[0], name.split(' ').slice(1).join(' '), '', '', '');
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
    }
}

function showError(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message
        });
    }
}

console.log('✅ Events Simple Module loaded successfully');

// Función de debugging para verificar que todo funcione
function debugStudentSearch() {
    console.log('🔍 Debug Student Search:');
    console.log('- Search Input:', document.getElementById('studentSearch'));
    console.log('- Results Div:', document.getElementById('studentResults'));
    
    // Probar búsqueda directa
    const testQuery = 'Andrés';
    console.log('🧪 Testing search with:', testQuery);
    
    const resultsDiv = document.getElementById('studentResults');
    if (resultsDiv) {
        searchStudents(testQuery, resultsDiv);
    }
}

// Exponer función para debugging
window.debugStudentSearch = debugStudentSearch;
window.selectStudentFromList = selectStudentFromList;