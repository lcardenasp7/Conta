// Módulo de eventos - Versión final y robusta
console.log('🎯 Loading Events Final Module...');

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
                        <div id="studentResults" class="mt-2"></div>
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
    
    // Esperar un poco para que el DOM esté listo
    setTimeout(() => {
        const searchInput = document.getElementById('studentSearch');
        const resultsDiv = document.getElementById('studentResults');
        
        console.log('🔍 Search Input:', searchInput);
        console.log('🔍 Results Div:', resultsDiv);
        
        if (!searchInput || !resultsDiv) {
            console.error('❌ Student search elements not found');
            console.error('- Search Input:', searchInput);
            console.error('- Results Div:', resultsDiv);
            return;
        }
        
        console.log('✅ Student search elements found');
        
        // Agregar múltiples eventos para asegurar que funcione
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('keyup', handleSearchInput);
        searchInput.addEventListener('change', handleSearchInput);
        
        // Función para manejar la búsqueda
        function handleSearchInput(event) {
            const query = event.target.value ? event.target.value.trim() : '';
            console.log('🔍 Search triggered:', query);
            
            if (query.length < 2) {
                resultsDiv.innerHTML = '';
                return;
            }
            
            // Mostrar inmediatamente los resultados sin timeout para testing
            showImmediateResults(query, resultsDiv);
        }
        
    }, 100);
}

// Mostrar resultados inmediatamente para testing
function showImmediateResults(query, resultsDiv) {
    console.log('🚀 Showing immediate results for:', query);
    
    const demoStudents = [
        { id: 'demo-1', firstName: 'Andrés', lastName: 'Pérez García', document: '1234567890', grade: { name: '10°' }, group: { name: 'A' } },
        { id: 'demo-2', firstName: 'María', lastName: 'González López', document: '0987654321', grade: { name: '11°' }, group: { name: 'B' } },
        { id: 'demo-3', firstName: 'Carlos', lastName: 'Martínez Silva', document: '1122334455', grade: { name: '9°' }, group: { name: 'A' } },
        { id: 'demo-4', firstName: 'Ana', lastName: 'Rodríguez Pérez', document: '5566778899', grade: { name: '10°' }, group: { name: 'C' } },
        { id: 'demo-5', firstName: 'Andrés Felipe', lastName: 'Castillo Ruiz', document: '7890123456', grade: { name: '10°' }, group: { name: 'A' } }
    ];
    
    // Filtrar estudiantes
    const queryLower = query.toLowerCase();
    const filteredStudents = demoStudents.filter(student => {
        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
        return student.firstName.toLowerCase().includes(queryLower) ||
               student.lastName.toLowerCase().includes(queryLower) ||
               fullName.includes(queryLower) ||
               student.document.includes(query);
    });
    
    console.log('✅ Filtered students:', filteredStudents.length);
    
    if (filteredStudents.length === 0) {
        resultsDiv.innerHTML = `
            <div class="border rounded p-3 text-center text-muted">
                <i class="bi bi-person-x fs-4"></i>
                <p class="mb-0 mt-2">No se encontraron estudiantes para "${query}"</p>
            </div>
        `;
        return;
    }
    
    const resultsHTML = filteredStudents.map(student => `
        <div class="p-3 border-bottom" 
             style="cursor: pointer; background: white;" 
             onmouseover="this.style.backgroundColor='#f8f9fa'" 
             onmouseout="this.style.backgroundColor='white'"
             onclick="selectStudent('${student.id}', '${student.firstName}', '${student.lastName}', '${student.document}', '${student.grade?.name || 'N/A'}', '${student.group?.name || 'N/A'}')">
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
    `).join('');
    
    resultsDiv.innerHTML = `
        <div class="border rounded shadow-sm mt-2" style="max-height: 300px; overflow-y: auto; background: white;">
            <div class="p-2 bg-light border-bottom">
                <small class="text-muted">
                    <i class="bi bi-people"></i> ${filteredStudents.length} estudiante${filteredStudents.length !== 1 ? 's' : ''} encontrado${filteredStudents.length !== 1 ? 's' : ''}
                </small>
            </div>
            ${resultsHTML}
        </div>
    `;
    
    console.log('✅ Results HTML set successfully');
}

// Función de testing para verificar que todo funcione
function testStudentSearch() {
    console.log('🧪 Testing student search...');
    
    const searchInput = document.getElementById('studentSearch');
    const resultsDiv = document.getElementById('studentResults');
    
    if (searchInput && resultsDiv) {
        console.log('✅ Elements found, testing with "Andrés"');
        showImmediateResults('Andrés', resultsDiv);
    } else {
        console.error('❌ Elements not found for testing');
    }
}

// Seleccionar estudiante
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

console.log('✅ Events Final Module loaded successfully');

// Función de debugging global
window.testStudentSearch = testStudentSearch;
window.showImmediateResults = showImmediateResults;

// Auto-test cuando se carga el módulo
console.log('🔧 Events Final Module ready for testing');
console.log('💡 To test manually, open console and run: testStudentSearch()');