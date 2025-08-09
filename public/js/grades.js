// Global variables
let currentGrades = [];
let currentGroups = [];
let selectedGradeId = null;

// Initialize Grades page
async function initGrades() {
    try {
        console.log('🎓 Initializing grades page...');
        showLoading();
        
        // First render basic content
        renderBasicGradesContent();
        
        // Load grades data
        await loadGrades();
        
        // Now render complete content
        renderGradesContent();
        
        // Setup event listeners
        setupGradesEventListeners();
        
        hideLoading();
    } catch (error) {
        console.error('❌ Error initializing grades:', error);
        showError('Error al cargar la página de grados');
        hideLoading();
    }
}

// Render basic grades page content (loading state)
function renderBasicGradesContent() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-card-list"></i> Gestión de Grados y Grupos</h2>
        </div>

        <!-- Loading State -->
        <div class="card">
            <div class="card-body text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2 text-muted">Cargando datos...</p>
            </div>
        </div>
    `;
}

// Load grades and groups data
async function loadGrades() {
    try {
        console.log('🔄 Loading grades...');
        const grades = await api.get('/grades');
        currentGrades = grades || [];
        console.log('✅ Grades loaded:', currentGrades.length);
        
        // NO seleccionar ningún grado automáticamente
        selectedGradeId = null;
        currentGroups = [];
        
        // Re-render if we're on the grades page
        if (document.getElementById('gradesContainer')) {
            updateGradesCards();
        }
        
        return currentGrades;
    } catch (error) {
        console.error('❌ Error loading grades:', error);
        currentGrades = [];
        showError('Error al cargar grados: ' + error.message);
        return [];
    }
}

// Load groups for a specific grade
async function loadGroups(gradeId = null) {
    try {
        const queryParam = gradeId ? `?gradeId=${gradeId}` : '';
        console.log(`🔄 Fetching groups with URL: /groups${queryParam}`);
        
        const groups = await api.get(`/groups${queryParam}`);
        currentGroups = groups || [];
        
        // Update selectedGradeId if it was passed
        if (gradeId) {
            selectedGradeId = gradeId;
            console.log(`📝 selectedGradeId set to: ${selectedGradeId} (${getGradeName(selectedGradeId)})`);
        }
        
        console.log('✅ Groups loaded:', currentGroups.length);
        
        // Debug: Log first group structure
        if (currentGroups.length > 0) {
            console.log('🔍 First group structure:', JSON.stringify(currentGroups[0], null, 2));
        }
        
        // Re-render groups table if we're on the grades page
        if (document.getElementById('groupsTableContainer')) {
            updateGroupsTable();
        }
        
        return currentGroups;
    } catch (error) {
        console.error('❌ Error loading groups:', error);
        currentGroups = [];
        showError('Error al cargar grupos: ' + error.message);
        return [];
    }
}

// Render grades content
function renderGradesContent() {
    const contentArea = document.getElementById('contentArea');
    
    console.log('🎨 Rendering grades content with:', {
        grades: currentGrades.length,
        groups: currentGroups.length,
        selectedGrade: selectedGradeId
    });
    
    contentArea.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-card-list"></i> Gestión de Grados y Grupos</h2>
        </div>

        <!-- Grades Section -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0"><i class="bi bi-mortarboard"></i> Grados Académicos</h5>
                        <button class="btn btn-primary btn-sm" onclick="openGradeModal()">
                            <i class="bi bi-plus"></i> Nuevo Grado
                        </button>
                    </div>
                    <div class="card-body p-3">
                        <div class="grades-grid" id="gradesContainer">
                            ${renderGradesCards()}
                        </div>
                    </div>
                    
                    <style>
                        /* Grades Grid Layout */
                        .grades-grid {
                            display: grid;
                            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                            gap: 1rem;
                            margin: 0;
                        }
                        
                        /* Grade Item */
                        .grade-item {
                            background: white;
                            border: 2px solid #e9ecef;
                            border-radius: 12px;
                            padding: 1rem;
                            cursor: pointer;
                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                            position: relative;
                            overflow: hidden;
                        }
                        
                        .grade-item:hover {
                            border-color: #0d6efd;
                            box-shadow: 0 4px 20px rgba(13, 110, 253, 0.15);
                            transform: translateY(-2px);
                        }
                        
                        .grade-item.selected {
                            border-color: #0d6efd;
                            background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
                            box-shadow: 0 4px 20px rgba(13, 110, 253, 0.2);
                            transform: translateY(-2px);
                        }
                        
                        .grade-item.selected::before {
                            content: '';
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            height: 4px;
                            background: linear-gradient(90deg, #0d6efd, #6610f2);
                        }
                        
                        /* Grade Header */
                        .grade-header {
                            display: flex;
                            align-items: center;
                            gap: 0.75rem;
                            margin-bottom: 1rem;
                            position: relative;
                        }
                        
                        .grade-icon {
                            width: 40px;
                            height: 40px;
                            background: linear-gradient(135deg, #0d6efd, #6610f2);
                            border-radius: 10px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-size: 1.1rem;
                            box-shadow: 0 2px 8px rgba(13, 110, 253, 0.3);
                        }
                        
                        .grade-info {
                            flex: 1;
                        }
                        
                        .grade-name {
                            margin: 0;
                            font-weight: 600;
                            color: #212529;
                            font-size: 1.1rem;
                        }
                        
                        .grade-level {
                            color: #6c757d;
                            font-size: 0.8rem;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                        
                        .selected-indicator {
                            color: #0d6efd;
                            font-size: 1.2rem;
                        }
                        
                        /* Grade Stats */
                        .grade-stats {
                            display: flex;
                            align-items: center;
                            justify-content: space-around;
                            margin-bottom: 1rem;
                            padding: 0.75rem;
                            background: #f8f9fa;
                            border-radius: 8px;
                        }
                        
                        .stat-item {
                            text-align: center;
                            flex: 1;
                        }
                        
                        .stat-value {
                            display: block;
                            font-size: 1.25rem;
                            font-weight: 700;
                            color: #0d6efd;
                        }
                        
                        .stat-label {
                            font-size: 0.75rem;
                            color: #6c757d;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                        
                        .stat-divider {
                            width: 1px;
                            height: 30px;
                            background: #dee2e6;
                            margin: 0 0.5rem;
                        }
                        
                        /* Grade Actions */
                        .grade-actions {
                            display: flex;
                            gap: 0.5rem;
                            justify-content: center;
                            opacity: 0;
                            transition: opacity 0.2s ease;
                        }
                        
                        .grade-item:hover .grade-actions {
                            opacity: 1;
                        }
                        
                        .action-btn {
                            width: 32px;
                            height: 32px;
                            border: none;
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            font-size: 0.875rem;
                        }
                        
                        .action-btn.edit {
                            background: #e3f2fd;
                            color: #1976d2;
                        }
                        
                        .action-btn.edit:hover {
                            background: #1976d2;
                            color: white;
                        }
                        
                        .action-btn.delete {
                            background: #ffebee;
                            color: #d32f2f;
                        }
                        
                        .action-btn.delete:hover {
                            background: #d32f2f;
                            color: white;
                        }
                        
                        /* Groups Table Improvements */
                        .groups-header {
                            padding: 0.75rem 0;
                            border-bottom: 1px solid #e9ecef;
                            margin-bottom: 1rem;
                        }
                        
                        .empty-state-groups {
                            max-width: 350px;
                            margin: 0 auto;
                            padding: 2rem 0;
                        }
                        
                        .group-row:hover {
                            background-color: rgba(13, 110, 253, 0.04) !important;
                        }
                        
                        .group-badge {
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        }
                        
                        .table th {
                            font-size: 0.875rem;
                            color: #6c757d;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            padding: 0.75rem;
                            border-bottom: 2px solid #e9ecef;
                        }
                        
                        .table td {
                            padding: 1rem 0.75rem;
                            vertical-align: middle;
                            border-top: 1px solid #f1f3f4;
                        }
                        
                        /* Responsive */
                        @media (max-width: 768px) {
                            .grades-grid {
                                grid-template-columns: 1fr;
                                gap: 0.75rem;
                            }
                            
                            .grade-item {
                                padding: 0.75rem;
                            }
                            
                            .grade-actions {
                                opacity: 1;
                            }
                        }
                        
                        @media (max-width: 576px) {
                            .grade-header {
                                gap: 0.5rem;
                            }
                            
                            .grade-icon {
                                width: 36px;
                                height: 36px;
                            }
                            
                            .grade-stats {
                                padding: 0.5rem;
                            }
                        }
                    </style>
                </div>
            </div>
        </div>

        <!-- Groups Section -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">
                            <i class="bi bi-people"></i> 
                            Grupos${selectedGradeId ? ` - ${getGradeName(selectedGradeId)}` : ''}
                        </h5>
                        <button class="btn btn-success btn-sm" onclick="openGroupModal()" ${!selectedGradeId ? 'disabled' : ''}>
                            <i class="bi bi-plus"></i> Nuevo Grupo
                        </button>
                    </div>
                    <div class="card-body">
                        <div id="groupsTableContainer">
                            ${renderGroupsContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Grade Modal -->
        <div class="modal fade" id="gradeModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="gradeModalTitle">Nuevo Grado</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="gradeForm">
                            <input type="hidden" id="gradeId" name="gradeId">
                            <div class="mb-3">
                                <label for="gradeName" class="form-label">Nombre del Grado</label>
                                <input type="text" class="form-control" id="gradeName" name="name" required>
                                <div class="form-text">Ejemplo: Preescolar, Primero, Segundo, etc.</div>
                            </div>
                            <div class="mb-3">
                                <label for="gradeLevel" class="form-label">Nivel</label>
                                <select class="form-select" id="gradeLevel" name="level" required>
                                    <option value="">Seleccionar nivel</option>
                                    <option value="PRESCHOOL">Preescolar</option>
                                    <option value="PRIMARY">Primaria</option>
                                    <option value="SECONDARY">Secundaria</option>
                                    <option value="MEDIA">Media</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="gradeOrder" class="form-label">Orden</label>
                                <input type="number" class="form-control" id="gradeOrder" name="order" min="1" required>
                                <div class="form-text">Orden de presentación (1, 2, 3, etc.)</div>
                            </div>
                            <div class="mb-3">
                                <label for="gradeDescription" class="form-label">Descripción</label>
                                <textarea class="form-control" id="gradeDescription" name="description" rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="saveGrade()">Guardar</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Group Modal -->
        <div class="modal fade" id="groupModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="groupModalTitle">Nuevo Grupo</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="groupForm">
                            <input type="hidden" id="groupId" name="groupId">
                            <div class="mb-3">
                                <label for="groupGradeId" class="form-label">Grado</label>
                                <select class="form-select" id="groupGradeId" name="gradeId" required>
                                    <option value="">Seleccionar grado</option>
                                    ${currentGrades.map(grade => 
                                        `<option value="${grade.id}">${grade.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="groupName" class="form-label">Nombre del Grupo</label>
                                <input type="text" class="form-control" id="groupName" name="name" required>
                                <div class="form-text">Ejemplo: A, B, C, 01, 02, etc.</div>
                            </div>
                            <div class="mb-3">
                                <label for="groupCapacity" class="form-label">Capacidad Máxima</label>
                                <input type="number" class="form-control" id="groupCapacity" name="capacity" min="1" value="35" required>
                                <div class="form-text">Número máximo de estudiantes para este grupo</div>
                            </div>
                            <div class="mb-3">
                                <label for="groupTeacher" class="form-label">Docente Director</label>
                                <input type="text" class="form-control" id="groupTeacher" name="teacherName">
                            </div>
                            <div class="mb-3">
                                <label for="groupClassroom" class="form-label">Aula</label>
                                <input type="text" class="form-control" id="groupClassroom" name="classroom">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="saveGroup()">Guardar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render groups content (initial state)
function renderGroupsContent() {
    if (!selectedGradeId) {
        return `
            <div class="text-center text-muted py-5">
                <div class="empty-state-groups">
                    <div class="icon-placeholder mb-3">
                        <i class="bi bi-cursor-fill display-4 text-primary opacity-25"></i>
                    </div>
                    <h5 class="fw-semibold text-dark">Selecciona un grado</h5>
                    <p class="text-muted mb-0">Haz clic en cualquier grado de arriba para ver y gestionar sus grupos</p>
                </div>
            </div>
        `;
    }
    
    return renderGroupsTable();
}

// Render grades cards
function renderGradesCards() {
    if (currentGrades.length === 0) {
        return `
            <div class="col-12">
                <div class="text-center text-muted py-4">
                    <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                    <p class="mt-2">No hay grados registrados</p>
                    <button class="btn btn-primary" onclick="openGradeModal()">
                        <i class="bi bi-plus"></i> Crear Primer Grado
                    </button>
                </div>
            </div>
        `;
    }

    return currentGrades
        .sort((a, b) => a.order - b.order)
        .map(grade => {
            const studentsCount = grade._count?.students || 0;
            const groupsCount = grade._count?.groups || 0;
            
            return `
            <div class="grade-item ${selectedGradeId === grade.id ? 'selected' : ''}" onclick="selectGrade('${grade.id}')">
                <div class="grade-header">
                    <div class="grade-icon">
                        <i class="bi bi-mortarboard"></i>
                    </div>
                    <div class="grade-info">
                        <h6 class="grade-name">${grade.name}</h6>
                        <small class="grade-level">${getLevelName(grade.level)}</small>
                    </div>
                    ${selectedGradeId === grade.id ? '<i class="bi bi-check-circle-fill selected-indicator"></i>' : ''}
                </div>
                
                <div class="grade-stats">
                    <div class="stat-item">
                        <span class="stat-value">${studentsCount}</span>
                        <small class="stat-label">Estudiantes</small>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                        <span class="stat-value">${groupsCount}</span>
                        <small class="stat-label">Grupos</small>
                    </div>
                </div>
                
                <div class="grade-actions">
                    <button class="action-btn edit" onclick="event.stopPropagation(); editGrade('${grade.id}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="action-btn delete" onclick="event.stopPropagation(); deleteGrade('${grade.id}')" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
            `;
        }).join('');
}

// Render groups table
function renderGroupsTable() {
    if (currentGroups.length === 0) {
        return `
            <div class="text-center text-muted py-5">
                <div class="empty-state-groups">
                    <i class="bi bi-people display-4 text-info opacity-25"></i>
                    <h5 class="mt-3 fw-semibold text-dark">No hay grupos registrados</h5>
                    <p class="text-muted mb-4">Crea el primer grupo para organizar a los estudiantes de este grado</p>
                    <button class="btn btn-success btn-lg shadow-sm" onclick="openGroupModal()">
                        <i class="bi bi-plus-circle me-2"></i>Crear Primer Grupo
                    </button>
                </div>
            </div>
        `;
    }

    // Sort groups by name
    const sortedGroups = [...currentGroups].sort((a, b) => a.name.localeCompare(b.name));

    return `
        <div class="groups-header mb-4">
            <div class="d-flex justify-content-between align-items-center">
                <div class="groups-info">
                    <small class="text-muted d-flex align-items-center">
                        <i class="bi bi-info-circle me-1"></i>
                        <span class="fw-medium">${currentGroups.length}</span>&nbsp;
                        grupo${currentGroups.length !== 1 ? 's' : ''} en&nbsp;
                        <span class="fw-medium text-primary">${selectedGradeId ? getGradeName(selectedGradeId) : 'grado seleccionado'}</span>
                    </small>
                </div>
                <div class="groups-actions">
                    <button class="btn btn-outline-secondary btn-sm me-2" onclick="loadGroups(selectedGradeId)" title="Actualizar">
                        <i class="bi bi-arrow-clockwise"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th class="border-0 fw-semibold">
                            <i class="bi bi-hash text-muted me-1"></i>Grupo
                        </th>
                        <th class="border-0 fw-semibold">
                            <i class="bi bi-people text-muted me-1"></i>Estudiantes
                        </th>
                        <th class="border-0 fw-semibold">
                            <i class="bi bi-door-open text-muted me-1"></i>Capacidad
                        </th>
                        <th class="border-0 fw-semibold">
                            <i class="bi bi-person-badge text-muted me-1"></i>Docente
                        </th>
                        <th class="border-0 fw-semibold">
                            <i class="bi bi-geo-alt text-muted me-1"></i>Aula
                        </th>
                        <th class="border-0 fw-semibold text-center">
                            <i class="bi bi-gear text-muted me-1"></i>Acciones
                        </th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedGroups.map(group => {
                        // Usar el campo correcto de capacidad del backend
                        const studentsCount = group._count?.students || group.currentStudents || 0;
                        const capacity = group.capacity || 0; // Solo usar 'capacity'
                        const occupancyPercentage = capacity > 0 ? Math.round((studentsCount / capacity) * 100) : 0;
                        const available = capacity - studentsCount;
                        
                        let occupancyClass = 'success';
                        let occupancyIcon = 'check-circle';
                        if (occupancyPercentage >= 100) {
                            occupancyClass = 'danger';
                            occupancyIcon = 'exclamation-circle';
                        } else if (occupancyPercentage >= 90) {
                            occupancyClass = 'warning';
                            occupancyIcon = 'exclamation-triangle';
                        } else if (occupancyPercentage >= 75) {
                            occupancyClass = 'info';
                            occupancyIcon = 'info-circle';
                        }
                        
                        return `
                        <tr class="group-row" style="transition: background-color 0.2s ease;">
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="group-badge bg-primary text-white d-flex align-items-center justify-content-center me-3" 
                                         style="width: 40px; height: 40px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                                        ${group.name}
                                    </div>
                                    <div>
                                        <div class="fw-semibold text-dark">Grupo ${group.name}</div>
                                        <small class="text-muted">${group.grade?.name || getGradeName(group.gradeId) || 'N/A'}</small>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <span class="badge bg-${occupancyClass} me-2">
                                        <i class="bi bi-${occupancyIcon} me-1"></i>${studentsCount}
                                    </span>
                                    <div>
                                        <div class="fw-semibold text-${occupancyClass}">${occupancyPercentage}%</div>
                                        <small class="text-muted">ocupado</small>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div>
                                    <div class="fw-semibold text-dark">${capacity > 0 ? capacity : 'No definida'}</div>
                                    <small class="text-muted">
                                        ${capacity > 0 ? (
                                            available >= 0 ? 
                                            `<span class="text-success"><i class="bi bi-check-circle me-1"></i>${available} disponibles</span>` : 
                                            `<span class="text-danger"><i class="bi bi-exclamation-circle me-1"></i>${Math.abs(available)} exceso</span>`
                                        ) : '<span class="text-warning">Sin capacidad definida</span>'}
                                    </small>
                                </div>
                            </td>
                            <td>
                                ${group.teacherName ? 
                                    `<div class="text-dark">
                                        <i class="bi bi-person-check text-success me-2"></i>
                                        <span class="fw-medium">${group.teacherName}</span>
                                    </div>` : 
                                    `<span class="text-muted">
                                        <i class="bi bi-person-x me-2"></i>Sin asignar
                                    </span>`
                                }
                            </td>
                            <td>
                                ${group.classroom ? 
                                    `<div class="text-dark">
                                        <i class="bi bi-door-open text-primary me-2"></i>
                                        <span class="fw-medium">${group.classroom}</span>
                                    </div>` : 
                                    `<span class="text-muted">
                                        <i class="bi bi-question-circle me-2"></i>Sin asignar
                                    </span>`
                                }
                            </td>
                            <td>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary rounded-pill me-1" 
                                            onclick="editGroup('${group.id}')" 
                                            title="Editar grupo">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-outline-info rounded-pill me-1" 
                                            onclick="viewGroupStudents('${group.id}')" 
                                            title="Ver estudiantes">
                                        <i class="bi bi-people"></i>
                                    </button>
                                    <button class="btn btn-outline-danger rounded-pill" 
                                            onclick="deleteGroup('${group.id}')" 
                                            title="Eliminar grupo">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Update grades cards content
function updateGradesCards() {
    const container = document.getElementById('gradesContainer');
    if (container) {
        container.innerHTML = renderGradesCards();
        console.log('✅ Grades cards updated');
    } else {
        console.log('⚠️ Grades container not found');
    }
}

// Update groups table content
function updateGroupsTable() {
    const container = document.getElementById('groupsTableContainer');
    if (container) {
        container.innerHTML = renderGroupsTable();
        console.log('✅ Groups table updated');
    } else {
        console.log('⚠️ Groups table container not found');
    }
}

// Update grades header with selected grade info
function updateGradesHeader() {
    const header = document.querySelector('.card:last-child .card-header h5');
    if (header) {
        const gradeName = selectedGradeId ? getGradeName(selectedGradeId) : '';
        const newHeaderText = `
            <i class="bi bi-people"></i> 
            Grupos${gradeName ? ` - ${gradeName}` : ''}
        `;
        header.innerHTML = newHeaderText;
        console.log('🏷️ Header updated to:', `Grupos${gradeName ? ` - ${gradeName}` : ''}`);
    } else {
        console.log('❌ Header element not found');
    }
    
    // Update new group button
    const newGroupBtn = document.querySelector('.card:last-child .card-header button');
    if (newGroupBtn) {
        newGroupBtn.disabled = !selectedGradeId;
        console.log('🔘 Button updated, disabled:', !selectedGradeId);
    } else {
        console.log('❌ Button element not found');
    }
}

// Setup event listeners
function setupGradesEventListeners() {
    // Grade form submission
    const gradeForm = document.getElementById('gradeForm');
    if (gradeForm) {
        gradeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveGrade();
        });
    }

    // Group form submission
    const groupForm = document.getElementById('groupForm');
    if (groupForm) {
        groupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveGroup();
        });
    }
}

// Select grade
async function selectGrade(gradeId) {
    console.log(`🎯 Selecting grade: ${gradeId}`);
    
    // Update selected grade ID FIRST
    selectedGradeId = gradeId;
    console.log(`📝 selectedGradeId updated to: ${selectedGradeId}`);
    console.log(`📝 Grade name: ${getGradeName(selectedGradeId)}`);
    
    // Update UI to show selected grade (re-render cards with new selection)
    updateGradesCards();
    
    // Load groups for selected grade
    console.log(`🔄 Loading groups for grade: ${gradeId}`);
    await loadGroups(gradeId);
    
    // Update the groups section AFTER loading groups
    console.log('🔄 Updating header and table...');
    updateGradesHeader();
    updateGroupsTable();
    console.log('✅ Header and table update completed');
}

// Open grade modal
function openGradeModal(gradeId = null) {
    const modal = new bootstrap.Modal(document.getElementById('gradeModal'));
    const form = document.getElementById('gradeForm');
    const title = document.getElementById('gradeModalTitle');
    
    form.reset();
    
    if (gradeId) {
        // Edit mode
        const grade = currentGrades.find(g => g.id === gradeId);
        if (grade) {
            title.textContent = 'Editar Grado';
            document.getElementById('gradeId').value = grade.id;
            document.getElementById('gradeName').value = grade.name;
            document.getElementById('gradeLevel').value = grade.level;
            document.getElementById('gradeOrder').value = grade.order;
            document.getElementById('gradeDescription').value = grade.description || '';
        }
    } else {
        // Create mode
        title.textContent = 'Nuevo Grado';
        document.getElementById('gradeId').value = '';
    }
    
    modal.show();
}

// Open group modal
function openGroupModal(groupId = null) {
    const modal = new bootstrap.Modal(document.getElementById('groupModal'));
    const form = document.getElementById('groupForm');
    const title = document.getElementById('groupModalTitle');
    
    form.reset();
    
    if (groupId) {
        // Edit mode
        const group = currentGroups.find(g => g.id === groupId);
        if (group) {
            console.log('📝 Editing group:', group);
            
            title.textContent = 'Editar Grupo';
            document.getElementById('groupId').value = group.id;
            document.getElementById('groupGradeId').value = group.gradeId;
            document.getElementById('groupName').value = group.name || '';
            
            // Usar solo el campo 'capacity' del backend
            const capacity = group.capacity || 35;
            const currentStudents = group._count?.students || group.currentStudents || 0;
            
            document.getElementById('groupCapacity').value = capacity;
            console.log('📝 Setting capacity to:', capacity);
            
            // Actualizar el texto de ayuda para mostrar limitaciones
            const capacityField = document.getElementById('groupCapacity');
            const helpText = capacityField.nextElementSibling;
            if (currentStudents > 0) {
                capacityField.min = currentStudents;
                helpText.innerHTML = `Número máximo de estudiantes para este grupo. <strong>Mínimo requerido: ${currentStudents}</strong> (estudiantes actuales)`;
                helpText.classList.add('text-warning');
            } else {
                capacityField.min = 1;
                helpText.innerHTML = 'Número máximo de estudiantes para este grupo';
                helpText.classList.remove('text-warning');
            }
            
            document.getElementById('groupTeacher').value = group.teacherName || '';
            document.getElementById('groupClassroom').value = group.classroom || '';
        }
    } else {
        // Create mode
        title.textContent = 'Nuevo Grupo';
        document.getElementById('groupId').value = '';
        document.getElementById('groupCapacity').value = 35; // Valor por defecto
        
        // Resetear el texto de ayuda
        const capacityField = document.getElementById('groupCapacity');
        const helpText = capacityField.nextElementSibling;
        capacityField.min = 1;
        helpText.innerHTML = 'Número máximo de estudiantes para este grupo';
        helpText.classList.remove('text-warning');
        
        if (selectedGradeId) {
            document.getElementById('groupGradeId').value = selectedGradeId;
        }
    }
    
    modal.show();
}

// Save grade
async function saveGrade() {
    try {
        const form = document.getElementById('gradeForm');
        const formData = new FormData(form);
        const gradeId = formData.get('gradeId');
        
        const gradeData = {
            name: formData.get('name'),
            level: formData.get('level'),
            order: parseInt(formData.get('order')),
            description: formData.get('description')
        };

        if (gradeId) {
            // Update existing grade
            await api.put(`/grades/${gradeId}`, gradeData);
            showSuccess('Grado actualizado exitosamente');
        } else {
            // Create new grade
            await api.post('/grades', gradeData);
            showSuccess('Grado creado exitosamente');
        }

        // Close modal and reload data
        bootstrap.Modal.getInstance(document.getElementById('gradeModal')).hide();
        await loadGrades();
        renderGradesContent();

    } catch (error) {
        console.error('Error saving grade:', error);
        showError(error.message || 'Error al guardar grado');
    }
}

// Save group
async function saveGroup() {
    try {
        const form = document.getElementById('groupForm');
        const formData = new FormData(form);
        const groupId = formData.get('groupId');
        
        // Validar campos requeridos
        const gradeId = formData.get('gradeId');
        const name = formData.get('name');
        let capacity = formData.get('capacity');
        const teacherName = formData.get('teacherName');
        const classroom = formData.get('classroom');
        
        console.log('📝 Form data received:', {
            groupId,
            gradeId,
            name,
            capacity,
            teacherName,
            classroom,
            allFormData: Object.fromEntries(formData)
        });
        
        if (!gradeId) {
            showError('Debe seleccionar un grado');
            return;
        }
        
        if (!name || name.trim() === '') {
            showError('Debe ingresar un nombre para el grupo');
            return;
        }
        
        // Convertir capacidad a número y validar
        capacity = parseInt(capacity) || 35;
        if (capacity <= 0) {
            showError('La capacidad debe ser mayor a 0');
            return;
        }
        
        // Validación adicional para grupos existentes
        if (groupId) {
            const currentGroup = currentGroups.find(g => g.id === groupId);
            if (currentGroup) {
                const currentStudents = currentGroup._count?.students || currentGroup.currentStudents || 0;
                console.log('🔍 Current students vs new capacity:', currentStudents, 'vs', capacity);
                if (capacity < currentStudents) {
                    showError(`La capacidad no puede ser menor al número actual de estudiantes (${currentStudents}). Debe ser al menos ${currentStudents}.`);
                    return;
                }
            }
        }
        
        // Preparar datos para enviar - SOLO campos que el backend espera
        const groupData = {
            gradeId: String(gradeId), // Asegurar que sea string
            name: String(name.trim()), // Asegurar que sea string
            capacity: Number(capacity) // Asegurar que sea number
        };
        
        // Solo agregar campos opcionales si tienen valor válido
        if (teacherName && teacherName.trim() !== '') {
            groupData.teacherName = String(teacherName.trim());
        }
        
        if (classroom && classroom.trim() !== '') {
            groupData.classroom = String(classroom.trim());
        }

        console.log('💾 Saving group data (typed):', groupData);
        console.log('🎯 Sending to endpoint:', groupId ? `PUT /groups/${groupId}` : 'POST /groups');
        
        // Debug: verificar tipos y valores
        console.log('🔍 Data types check:', {
            gradeId: { value: groupData.gradeId, type: typeof groupData.gradeId, isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(groupData.gradeId) },
            name: { value: groupData.name, type: typeof groupData.name, length: groupData.name.length },
            capacity: { value: groupData.capacity, type: typeof groupData.capacity, isInt: Number.isInteger(groupData.capacity) },
            teacherName: { value: groupData.teacherName, type: typeof groupData.teacherName },
            classroom: { value: groupData.classroom, type: typeof groupData.classroom }
        });
        
        // Debug: verificar el JSON que se va a enviar
        console.log('📤 JSON to send:', JSON.stringify(groupData, null, 2));

        if (groupId) {
            // Update existing group
            await api.put(`/groups/${groupId}`, groupData);
            showSuccess('Grupo actualizado exitosamente');
        } else {
            // Create new group
            await api.post('/groups', groupData);
            showSuccess('Grupo creado exitosamente');
        }

        // Close modal and reload data
        const modal = bootstrap.Modal.getInstance(document.getElementById('groupModal'));
        if (modal) {
            modal.hide();
        }
        
        await loadGroups(selectedGradeId);

    } catch (error) {
        console.error('❌ Error saving group:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            response: error.response,
            status: error.status,
            statusText: error.statusText
        });
        
        // Intentar obtener más detalles del error si está disponible
        if (error.response) {
            console.error('❌ Response data:', error.response.data);
            console.error('❌ Response status:', error.response.status);
            console.error('❌ Response headers:', error.response.headers);
        }
        
        // Mostrar mensaje más específico para errores de capacidad
        const errorMessage = error.message || 'Error al guardar grupo';
        if (errorMessage.includes('capacidad no puede ser menor')) {
            showError(errorMessage);
        } else {
            showError(errorMessage);
        }
    }
}

// Edit grade
function editGrade(gradeId) {
    openGradeModal(gradeId);
}

// Edit group
function editGroup(groupId) {
    openGroupModal(groupId);
}

// Delete grade
async function deleteGrade(gradeId) {
    const grade = currentGrades.find(g => g.id === gradeId);
    if (!grade) return;

    const result = await Swal.fire({
        title: '¿Eliminar grado?',
        text: `¿Estás seguro de eliminar el grado "${grade.name}"? Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await api.delete(`/grades/${gradeId}`);
            showSuccess('Grado eliminado exitosamente');
            
            // Reset selected grade if it was deleted
            if (selectedGradeId === gradeId) {
                selectedGradeId = null;
                currentGroups = [];
            }
            
            await loadGrades();
            renderGradesContent();
        } catch (error) {
            console.error('Error deleting grade:', error);
            showError(error.message || 'Error al eliminar grado');
        }
    }
}

// Delete group
async function deleteGroup(groupId) {
    const group = currentGroups.find(g => g.id === groupId);
    if (!group) return;

    const result = await Swal.fire({
        title: '¿Eliminar grupo?',
        text: `¿Estás seguro de eliminar el grupo "${group.name}"? Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await api.delete(`/groups/${groupId}`);
            showSuccess('Grupo eliminado exitosamente');
            await loadGroups(selectedGradeId);
        } catch (error) {
            console.error('Error deleting group:', error);
            showError(error.message || 'Error al eliminar grupo');
        }
    }
}

// View group students
function viewGroupStudents(groupId) {
    const group = currentGroups.find(g => g.id === groupId);
    if (!group) return;
    
    // Switch to students page with group filter
    loadPage('students', { groupId: groupId, groupName: group.name });
}

// Helper functions
function getLevelName(level) {
    const levels = {
        'PRESCHOOL': 'Preescolar',
        'PRIMARY': 'Primaria',
        'SECONDARY': 'Secundaria',
        'MEDIA': 'Media'
    };
    return levels[level] || level;
}

function getGradeName(gradeId) {
    const grade = currentGrades.find(g => g.id === gradeId);
    return grade ? grade.name : 'Desconocido';
}

// Notification functions (fallback if utils.js not available)
function showSuccess(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: message,
            timer: 3000,
            showConfirmButton: false
        });
    } else {
        alert('✅ ' + message);
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
        alert('❌ ' + message);
    }
}

function showWarning(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: message
        });
    } else {
        alert('⚠️ ' + message);
    }
}

function showLoading() {
    // Implementar según tu sistema de loading
    console.log('🔄 Loading...');
}

function hideLoading() {
    // Implementar según tu sistema de loading
    console.log('✅ Loading finished');
}

// Export functions for global access
window.initGrades = initGrades;
window.openGradeModal = openGradeModal;
window.openGroupModal = openGroupModal;
window.saveGrade = saveGrade;
window.saveGroup = saveGroup;
window.editGrade = editGrade;
window.editGroup = editGroup;
window.deleteGrade = deleteGrade;
window.deleteGroup = deleteGroup;
window.selectGrade = selectGrade;
window.viewGroupStudents = viewGroupStudents;