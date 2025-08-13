// Students Management

let currentStudents = [];
let currentStudentsPage = 1;
let totalStudentsPages = 1;
let currentStudentsFilters = {};
let availableGrades = [];
let availableGroups = [];

// Initialize Students page
async function initStudents() {
    try {
        console.log('🎓 Initializing students page...');
        showLoading();
        
        // First render basic content
        renderBasicStudentsContent();
        
        // Load initial data using students-specific functions
        await Promise.all([
            loadGradesForStudents(),
            loadGroupsForStudents()
        ]);
        
        // Now render complete content with loaded data
        renderStudentsContent();
        
        // Load students data
        await loadStudents();
        
        // Setup event listeners
        setupStudentsEventListeners();
        
        hideLoading();
    } catch (error) {
        console.error('❌ Error initializing students:', error);
        showError('Error al cargar la página de estudiantes');
        hideLoading();
    }
}

// Render basic students page content (loading state)
function renderBasicStudentsContent() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-people"></i> Gestión de Estudiantes</h2>
            <button class="btn btn-primary" onclick="showCreateStudentModal()">
                <i class="bi bi-plus"></i> Nuevo Estudiante
            </button>
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

// Render students page content
function renderStudentsContent() {
    const contentArea = document.getElementById('contentArea');
    
    console.log('🎨 Rendering students content with:', {
        grades: availableGrades.length,
        groups: availableGroups.length
    });
    
    contentArea.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-people"></i> Gestión de Estudiantes</h2>
            <button class="btn btn-primary" onclick="showCreateStudentModal()">
                <i class="bi bi-plus"></i> Nuevo Estudiante
            </button>
        </div>

        <!-- Filters Section -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-3">
                        <label for="studentSearch" class="form-label">Buscar</label>
                        <input type="text" class="form-control" id="studentSearch" placeholder="Nombre, apellido o documento...">
                    </div>
                    <div class="col-md-2">
                        <label for="gradeFilter" class="form-label">Grado</label>
                        <select class="form-select" id="gradeFilter">
                            <option value="">Todos los grados</option>
                            ${availableGrades.map(grade => 
                                `<option value="${grade.id}">${grade.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label for="groupFilter" class="form-label">Grupo</label>
                        <select class="form-select" id="groupFilter">
                            <option value="">Todos los grupos</option>
                            ${availableGroups.map(group => 
                                `<option value="${group.id}">${group.grade?.name || ''} - ${group.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label for="statusFilter" class="form-label">Estado</label>
                        <select class="form-select" id="statusFilter">
                            <option value="">Todos los estados</option>
                            <option value="ACTIVE">Activo</option>
                            <option value="INACTIVE">Inactivo</option>
                            <option value="GRADUATED">Graduado</option>
                            <option value="TRANSFERRED">Trasladado</option>
                            <option value="SUSPENDED">Suspendido</option>
                        </select>
                    </div>
                    <div class="col-md-3 d-flex align-items-end gap-2">
                        <button class="btn btn-outline-secondary" onclick="clearStudentFilters()">
                            <i class="bi bi-x-circle"></i> Limpiar
                        </button>
                        <button class="btn btn-outline-success" onclick="exportStudents()">
                            <i class="bi bi-download"></i> Exportar
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Students Table -->
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Lista de Estudiantes</h5>
                <small class="text-muted" id="studentsCount">0 estudiantes</small>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Documento</th>
                                <th>Nombre Completo</th>
                                <th>Grado</th>
                                <th>Grupo</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="studentsTableBody">
                            <tr>
                                <td colspan="8" class="text-center">
                                    <div class="py-4">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">Cargando...</span>
                                        </div>
                                        <p class="mt-2 text-muted">Cargando estudiantes...</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <nav aria-label="Students pagination" class="mt-3">
                    <ul class="pagination justify-content-center" id="studentsPagination">
                        <!-- Pagination will be rendered here -->
                    </ul>
                </nav>
            </div>
        </div>
    `;
}

// Load students data
async function loadStudents(page = 1, filters = {}) {
    try {
        console.log('🔄 Loading students...', { page, filters });

        const params = {
            page,
            limit: 20,
            ...filters
        };

        console.log('📤 API request params:', params);
        const response = await api.getStudents(params);
        console.log('📥 API response:', response);

        currentStudents = response.students || [];
        currentStudentsPage = response.pagination?.page || 1;
        totalStudentsPages = response.pagination?.pages || 1;
        currentStudentsFilters = filters;

        console.log('✅ Students loaded:', {
            count: currentStudents.length,
            page: currentStudentsPage,
            totalPages: totalStudentsPages
        });

        updateStudentsTable();
        updatePagination();
        updateStudentsCount();

    } catch (error) {
        console.error('❌ Error loading students:', error);
        showError(error.message || 'Error al cargar estudiantes');
    }
}

// Update students table
function updateStudentsTable() {
    console.log('📊 Updating students table...', { count: currentStudents.length });
    
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) {
        console.error('❌ studentsTableBody element not found');
        return;
    }

    if (currentStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="bi bi-inbox" style="font-size: 3rem; color: #6c757d;"></i>
                    <p class="mt-2 text-muted">No se encontraron estudiantes</p>
                </td>
            </tr>
        `;
        console.log('ℹ️ No students to display');
        return;
    }

    tbody.innerHTML = currentStudents.map(student => `
        <tr>
            <td><strong>${student.document}</strong></td>
            <td>${student.firstName} ${student.lastName}</td>
            <td>
                ${student.grade?.name ? 
                    `<span class="badge bg-primary">${student.grade.name}</span>` : 
                    '<span class="text-muted">N/A</span>'
                }
            </td>
            <td>
                ${student.group?.name ? 
                    `<span class="badge bg-secondary">${student.group.name}</span>` : 
                    '<span class="text-muted">N/A</span>'
                }
            </td>
            <td>${student.email || '<span class="text-muted">N/A</span>'}</td>
            <td>${student.phone || '<span class="text-muted">N/A</span>'}</td>
            <td>${getStatusBadge(student.status, 'student')}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewStudent('${student.id}')" title="Ver">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-info" onclick="showStudentEventsModal('${student.id}')" title="Eventos">
                        <i class="bi bi-calendar-event"></i>
                    </button>
                    <button class="btn btn-outline-warning" onclick="editStudent('${student.id}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteStudent('${student.id}')" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    console.log('✅ Students table updated successfully');
}

// Update students count
function updateStudentsCount() {
    const countElement = document.getElementById('studentsCount');
    if (countElement) {
        const total = currentStudents.length;
        const start = (currentStudentsPage - 1) * 20 + 1;
        const end = Math.min(start + total - 1, start + 19);
        
        if (total > 0) {
            countElement.textContent = `Mostrando ${start}-${end} de ${total} estudiantes`;
        } else {
            countElement.textContent = '0 estudiantes';
        }
    }
}

// Update pagination
function updatePagination() {
    const paginationContainer = document.getElementById('studentsPagination');
    if (!paginationContainer) return;

    if (totalStudentsPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHtml = '';
    
    // Previous button
    paginationHtml += `
        <li class="page-item ${currentStudentsPage === 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="loadStudentsPage(${currentStudentsPage - 1})" ${currentStudentsPage === 1 ? 'disabled' : ''}>
                <i class="bi bi-chevron-left"></i>
            </button>
        </li>
    `;
    
    // Page numbers
    const startPage = Math.max(1, currentStudentsPage - 2);
    const endPage = Math.min(totalStudentsPages, currentStudentsPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <li class="page-item ${i === currentStudentsPage ? 'active' : ''}">
                <button class="page-link" onclick="loadStudentsPage(${i})">${i}</button>
            </li>
        `;
    }
    
    // Next button
    paginationHtml += `
        <li class="page-item ${currentStudentsPage === totalStudentsPages ? 'disabled' : ''}">
            <button class="page-link" onclick="loadStudentsPage(${currentStudentsPage + 1})" ${currentStudentsPage === totalStudentsPages ? 'disabled' : ''}>
                <i class="bi bi-chevron-right"></i>
            </button>
        </li>
    `;
    
    paginationContainer.innerHTML = paginationHtml;
}

// Load specific page
function loadStudentsPage(page) {
    if (page >= 1 && page <= totalStudentsPages) {
        loadStudents(page, currentStudentsFilters);
    }
}

// Setup event listeners
function setupStudentsEventListeners() {
    // Search with debounce
    const searchInput = document.getElementById('studentSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchStudents, 300));
    }

    // Filter change handlers
    const gradeFilter = document.getElementById('gradeFilter');
    if (gradeFilter) {
        gradeFilter.addEventListener('change', filterGroupsByGradeFilter);
    }

    const groupFilter = document.getElementById('groupFilter');
    if (groupFilter) {
        groupFilter.addEventListener('change', searchStudents);
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', searchStudents);
    }
}

// Search students
function searchStudents() {
    const searchTerm = document.getElementById('studentSearch')?.value || '';
    const gradeFilter = document.getElementById('gradeFilter')?.value || '';
    const groupFilter = document.getElementById('groupFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';

    const filters = {};
    if (searchTerm.trim()) filters.search = searchTerm.trim();
    if (gradeFilter) filters.gradeId = gradeFilter;
    if (groupFilter) filters.groupId = groupFilter;
    if (statusFilter) filters.status = statusFilter;

    console.log('🔍 Searching students with filters:', filters);
    loadStudents(1, filters);
}

// Clear filters
function clearStudentFilters() {
    const searchInput = document.getElementById('studentSearch');
    const gradeFilter = document.getElementById('gradeFilter');
    const groupFilter = document.getElementById('groupFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) searchInput.value = '';
    if (gradeFilter) gradeFilter.value = '';
    if (groupFilter) groupFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    
    loadStudents(1, {});
}

// Load grades for students (independent function)
async function loadGradesForStudents() {
    try {
        console.log('📚 [Students] Loading grades...');
        const grades = await api.get('/grades');
        availableGrades = grades || [];
        console.log('✅ [Students] Grades loaded:', availableGrades.length, availableGrades);
        return availableGrades;
    } catch (error) {
        console.error('❌ [Students] Error loading grades:', error);
        availableGrades = [];
        return [];
    }
}

// Load groups for students (independent function)
async function loadGroupsForStudents() {
    try {
        console.log('👥 [Students] Loading groups...');
        const groups = await api.get('/groups');
        availableGroups = groups || [];
        console.log('✅ [Students] Groups loaded:', availableGroups.length, availableGroups);
        return availableGroups;
    } catch (error) {
        console.error('❌ [Students] Error loading groups:', error);
        availableGroups = [];
        return [];
    }
}

// Filter groups by grade in filter
async function filterGroupsByGradeFilter() {
    const gradeId = document.getElementById('gradeFilter')?.value;
    const groupFilter = document.getElementById('groupFilter');

    if (!groupFilter) return;

    try {
        if (!gradeId) {
            // If no grade selected, show all groups
            groupFilter.innerHTML = '<option value="">Todos los grupos</option>' +
                availableGroups.map(group => 
                    `<option value="${group.id}">${group.grade?.name || ''} - ${group.name}</option>`
                ).join('');
        } else {
            // Filter groups by selected grade
            const filteredGroups = availableGroups.filter(group => group.gradeId === gradeId);
            groupFilter.innerHTML = '<option value="">Todos los grupos</option>' +
                filteredGroups.map(group => 
                    `<option value="${group.id}">${group.name}</option>`
                ).join('');
        }

        // Clear group filter selection and trigger search
        groupFilter.value = '';
        searchStudents();

    } catch (error) {
        console.error('❌ Error filtering groups:', error);
    }
}

// View student details
async function viewStudent(studentId) {
    try {
        showLoading();
        const student = await api.getStudent(studentId);
        showStudentModal(student, 'view');
    } catch (error) {
        showError(error.message || 'Error al cargar estudiante');
    } finally {
        hideLoading();
    }
}

// Edit student
async function editStudent(studentId) {
    try {
        showLoading();
        const student = await api.getStudent(studentId);
        showStudentModal(student, 'edit');
    } catch (error) {
        showError(error.message || 'Error al cargar estudiante');
    } finally {
        hideLoading();
    }
}

// Delete student
async function deleteStudent(studentId) {
    const student = currentStudents.find(s => s.id === studentId);
    if (!student) return;

    const result = await Swal.fire({
        title: '¿Eliminar estudiante?',
        text: `¿Está seguro de que desea eliminar al estudiante ${student.firstName} ${student.lastName}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            showLoading();
            await api.deleteStudent(studentId);
            showSuccess('Estudiante eliminado exitosamente');
            loadStudents(currentStudentsPage, currentStudentsFilters);
        } catch (error) {
            showError(error.message || 'Error al eliminar estudiante');
        } finally {
            hideLoading();
        }
    }
}

// Show student modal
function showStudentModal(student = null, mode = 'create') {
    const modal = document.getElementById('studentModal');
    const modalTitle = document.getElementById('studentModalTitle');
    const form = document.getElementById('studentForm');

    if (!modal || !modalTitle || !form) {
        console.error('❌ Student modal elements not found');
        return;
    }

    // Set modal title
    const titles = {
        create: 'Crear Estudiante',
        edit: 'Editar Estudiante',
        view: 'Ver Estudiante'
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
    const saveBtn = document.getElementById('saveStudentBtn');
    if (saveBtn) {
        saveBtn.style.display = mode === 'view' ? 'none' : 'block';
    }

    // Load grades and groups in modal
    loadGradesInModal();

    // Fill form if editing or viewing
    if (student && mode !== 'create') {
        setTimeout(() => {
            fillStudentForm(student);
        }, 100);
    }
    
    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Fill student form
function fillStudentForm(student) {
    document.getElementById('editStudentId').value = student.id;
    document.getElementById('documentType').value = student.documentType;
    document.getElementById('document').value = student.document;
    document.getElementById('firstName').value = student.firstName;
    document.getElementById('lastName').value = student.lastName;
    document.getElementById('birthDate').value = student.birthDate?.split('T')[0];
    document.getElementById('gender').value = student.gender;
    document.getElementById('studentEmail').value = student.email || '';
    document.getElementById('phone').value = student.phone || '';
    document.getElementById('address').value = student.address;
    document.getElementById('gradeId').value = student.gradeId;
    document.getElementById('guardianName').value = student.guardianName || '';
    document.getElementById('guardianPhone').value = student.guardianPhone || '';
    document.getElementById('guardianEmail').value = student.guardianEmail || '';
    document.getElementById('status').value = student.status;
    
    // Load groups for the selected grade and then set the group value
    setTimeout(async () => {
        await filterGroupsByGradeInModal();
        document.getElementById('groupId').value = student.groupId;
    }, 100);
}

// Load grades in modal (independent function)
function loadGradesInModal() {
    const gradeSelect = document.getElementById('gradeId');
    if (gradeSelect && availableGrades.length > 0) {
        gradeSelect.innerHTML = '<option value="">Seleccionar grado</option>' +
            availableGrades.map(grade => `<option value="${grade.id}">${grade.name}</option>`).join('');
        
        // Setup grade change handler
        gradeSelect.addEventListener('change', filterGroupsByGradeInModal);
    }
}

// Filter groups by grade in modal
async function filterGroupsByGradeInModal() {
    const gradeId = document.getElementById('gradeId')?.value;
    const groupSelect = document.getElementById('groupId');

    if (!groupSelect) return;

    try {
        if (!gradeId) {
            groupSelect.innerHTML = '<option value="">Primero seleccione un grado</option>';
        } else {
            const filteredGroups = availableGroups.filter(group => group.gradeId === gradeId);
            groupSelect.innerHTML = '<option value="">Seleccionar grupo</option>' +
                filteredGroups.map(group => `<option value="${group.id}">${group.name}</option>`).join('');
        }
        
        groupSelect.value = '';
    } catch (error) {
        console.error('❌ Error filtering groups by grade in modal:', error);
        groupSelect.innerHTML = '<option value="">Error al cargar grupos</option>';
    }
}

// Save student
async function saveStudent() {
    const form = document.getElementById('studentForm');
    if (!form) {
        showError('Formulario no encontrado');
        return;
    }

    // Basic validation
    const requiredFields = ['documentType', 'document', 'firstName', 'lastName', 'birthDate', 'gender', 'address', 'gradeId', 'groupId'];
    const missingFields = requiredFields.filter(field => !form[field]?.value?.trim());
    
    if (missingFields.length > 0) {
        showError('Por favor complete todos los campos requeridos');
        return;
    }

    const formData = new FormData(form);
    const studentData = {};
    
    // Process form data
    for (let [key, value] of formData.entries()) {
        if (value.trim()) {
            studentData[key] = value.trim();
        }
    }

    // Convert birthDate to ISO string
    if (studentData.birthDate) {
        studentData.birthDate = new Date(studentData.birthDate).toISOString();
    }

    try {
        showLoading();

        const studentId = studentData.editStudentId || studentData.studentId;
        delete studentData.editStudentId;
        delete studentData.studentId;

        console.log('💾 Saving student data:', studentData);

        if (studentId) {
            await api.updateStudent(studentId, studentData);
            showSuccess('Estudiante actualizado exitosamente');
        } else {
            await api.createStudent(studentData);
            showSuccess('Estudiante creado exitosamente');
        }

        // Close modal and reload data
        const modal = bootstrap.Modal.getInstance(document.getElementById('studentModal'));
        modal.hide();

        loadStudents(currentStudentsPage, currentStudentsFilters);

    } catch (error) {
        console.error('❌ Student save error:', error);
        showError(error.message || 'Error al guardar estudiante');
    } finally {
        hideLoading();
    }
}

// Export students to CSV
function exportStudents() {
    if (currentStudents.length === 0) {
        showWarning('No hay estudiantes para exportar');
        return;
    }

    const headers = ['Documento', 'Nombres', 'Apellidos', 'Grado', 'Grupo', 'Email', 'Teléfono', 'Estado'];
    const csvContent = [
        headers.join(','),
        ...currentStudents.map(student => [
            student.document,
            student.firstName,
            student.lastName,
            student.grade?.name || '',
            student.group?.name || '',
            student.email || '',
            student.phone || '',
            student.status
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `estudiantes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess('Estudiantes exportados exitosamente');
}

// Show create student modal
function showCreateStudentModal() {
    showStudentModal(null, 'create');
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

// ================================
// STUDENT EVENTS MANAGEMENT
// ================================

// Show student events modal
async function showStudentEventsModal(studentId) {
    try {
        showLoading();
        
        // Get student data
        const student = currentStudents.find(s => s.id === studentId);
        if (!student) {
            showError('Estudiante no encontrado');
            return;
        }

        // Get student event assignments
        const response = await api.get(`/events/assignments/student/${studentId}`);
        const assignments = response.assignments || [];

        // Get student payments for events
        const paymentsResponse = await api.get(`/payments?studentId=${studentId}`);
        const allPayments = paymentsResponse.payments || [];
        const payments = allPayments.filter(payment => payment.eventId);

        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="studentEventsModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-calendar-event"></i> 
                                Eventos - ${student.firstName} ${student.lastName}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6><i class="bi bi-ticket"></i> Asignaciones de Eventos</h6>
                                    <div class="table-responsive">
                                        <table class="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Evento</th>
                                                    <th>Boletos</th>
                                                    <th>Valor</th>
                                                    <th>Pagado</th>
                                                    <th>Pendiente</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${assignments.map(assignment => {
                                                    const pending = (assignment.ticketsAssigned - assignment.ticketsSold) * assignment.event.ticketPrice;
                                                    const paid = assignment.ticketsSold * assignment.event.ticketPrice;
                                                    return `
                                                        <tr>
                                                            <td><strong>${assignment.event.name}</strong></td>
                                                            <td>
                                                                <span class="badge bg-primary">${assignment.ticketsAssigned}</span>
                                                                <small class="text-muted">(${assignment.ticketsSold} vendidos)</small>
                                                            </td>
                                                            <td>$${formatCurrency(assignment.ticketsAssigned * assignment.event.ticketPrice)}</td>
                                                            <td class="text-success">$${formatCurrency(paid)}</td>
                                                            <td class="text-danger">$${formatCurrency(pending)}</td>
                                                            <td>
                                                                ${pending > 0 ? `
                                                                    <div class="btn-group btn-group-sm">
                                                                        <button class="btn btn-success" onclick="quickPaymentFromStudent('${assignment.id}', ${pending})">
                                                                            <i class="bi bi-cash"></i> Pagar Todo
                                                                        </button>
                                                                        <button class="btn btn-outline-success" onclick="partialPaymentFromStudent('${assignment.id}', ${pending})">
                                                                            <i class="bi bi-cash-coin"></i> Parcial
                                                                        </button>
                                                                    </div>
                                                                ` : '<span class="text-success">✓ Completo</span>'}
                                                            </td>
                                                        </tr>
                                                    `;
                                                }).join('') || '<tr><td colspan="6" class="text-center text-muted">No hay asignaciones de eventos</td></tr>'}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="bi bi-cash-stack"></i> Historial de Pagos</h6>
                                    <div class="table-responsive">
                                        <table class="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Fecha</th>
                                                    <th>Evento</th>
                                                    <th>Monto</th>
                                                    <th>Método</th>
                                                    <th>Estado</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${payments.map(payment => `
                                                    <tr>
                                                        <td>${new Date(payment.date).toLocaleDateString()}</td>
                                                        <td>${payment.event?.name || 'N/A'}</td>
                                                        <td class="text-success">$${formatCurrency(payment.amount)}</td>
                                                        <td><span class="badge bg-secondary">${payment.method}</span></td>
                                                        <td>
                                                            <span class="badge ${payment.status === 'COMPLETED' ? 'bg-success' : payment.status === 'CANCELLED' ? 'bg-danger' : 'bg-warning'}">
                                                                ${payment.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            ${payment.status === 'COMPLETED' ? `
                                                                <button class="btn btn-sm btn-outline-danger" onclick="cancelPayment('${payment.id}')" title="Cancelar Pago">
                                                                    <i class="bi bi-x-circle"></i>
                                                                </button>
                                                            ` : ''}
                                                        </td>
                                                    </tr>
                                                `).join('') || '<tr><td colspan="6" class="text-center text-muted">No hay pagos registrados</td></tr>'}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" onclick="generateStudentInvoice('${studentId}')">
                                <i class="bi bi-file-earmark-text"></i> Generar Factura
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('studentEventsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal with accessibility support
        const modalElement = document.getElementById('studentEventsModal');
        
        // Enhance accessibility if the helper is available
        if (typeof enhanceModalAccessibility === 'function') {
            enhanceModalAccessibility(modalElement);
        }
        
        // Show modal using accessible method if available
        if (typeof showAccessibleModal === 'function') {
            showAccessibleModal(modalElement);
        } else {
            modalElement.removeAttribute('aria-hidden');
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }

        hideLoading();
    } catch (error) {
        console.error('❌ Error loading student events:', error);
        showError('Error al cargar eventos del estudiante');
        hideLoading();
    }
}

// Quick payment from student events modal
async function quickPaymentFromStudent(assignmentId, amount) {
    try {
        const result = await Swal.fire({
            title: 'Pago Rápido',
            html: `
                <div class="text-start">
                    <p><strong>Monto a pagar:</strong> $${formatCurrency(amount)}</p>
                    <hr>
                    <div class="mb-3">
                        <label for="quickPaymentMethodStudent" class="form-label">Método de Pago:</label>
                        <select class="form-select" id="quickPaymentMethodStudent">
                            <option value="CASH">Efectivo</option>
                            <option value="BANK_TRANSFER">Transferencia</option>
                            <option value="CARD">Tarjeta</option>
                            <option value="OTHER">Otro</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="quickPaymentReferenceStudent" class="form-label">Referencia (opcional):</label>
                        <input type="text" class="form-control" id="quickPaymentReferenceStudent" placeholder="Número de transacción, etc.">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Procesar Pago',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745',
            preConfirm: () => {
                const method = document.getElementById('quickPaymentMethodStudent').value;
                const reference = document.getElementById('quickPaymentReferenceStudent').value;
                
                if (!method) {
                    Swal.showValidationMessage('Debe seleccionar un método de pago');
                    return false;
                }
                
                return { method, reference };
            }
        });

        if (result.isConfirmed) {
            showLoading();
            
            // Get assignment details
            const assignmentResponse = await api.get(`/events/assignments/${assignmentId}`);
            const assignment = assignmentResponse.assignment;
            
            // Create payment
            const paymentData = {
                studentId: assignment.studentId,
                eventId: assignment.eventId,
                amount: amount,
                method: result.value.method,
                reference: result.value.reference,
                concept: `Pago evento: ${assignment.event.name}`
            };

            await api.post('/payments', paymentData);
            
            // Update assignment
            const ticketsToSell = Math.floor(amount / assignment.event.ticketPrice);
            await api.put(`/events/assignments/${assignmentId}`, {
                ticketsSold: assignment.ticketsSold + ticketsToSell
            });

            showSuccess('Pago procesado exitosamente');
            
            // Notify dashboard of payment
            if (typeof notifyPaymentMade === 'function') {
                notifyPaymentMade({
                    amount: amount,
                    studentName: `${student.firstName} ${student.lastName}`,
                    concept: `Pago evento: ${assignment.event.name}`
                });
            }
            
            // Refresh the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('studentEventsModal'));
            modal.hide();
            setTimeout(() => showStudentEventsModal(assignment.studentId), 500);
            
            hideLoading();
        }
    } catch (error) {
        console.error('❌ Error processing payment:', error);
        showError('Error al procesar el pago: ' + error.message);
        hideLoading();
    }
}

// Partial payment from student events modal
async function partialPaymentFromStudent(assignmentId, maxAmount) {
    try {
        const result = await Swal.fire({
            title: 'Pago Parcial',
            html: `
                <div class="text-start">
                    <p><strong>Monto máximo:</strong> $${formatCurrency(maxAmount)}</p>
                    <hr>
                    <div class="mb-3">
                        <label for="partialPaymentAmount" class="form-label">Monto a pagar:</label>
                        <input type="number" class="form-control" id="partialPaymentAmount" 
                               min="0.01" max="${maxAmount}" step="0.01" placeholder="0.00">
                    </div>
                    <div class="mb-3">
                        <label for="partialPaymentMethod" class="form-label">Método de Pago:</label>
                        <select class="form-select" id="partialPaymentMethod">
                            <option value="CASH">Efectivo</option>
                            <option value="BANK_TRANSFER">Transferencia</option>
                            <option value="CARD">Tarjeta</option>
                            <option value="OTHER">Otro</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="partialPaymentReference" class="form-label">Referencia (opcional):</label>
                        <input type="text" class="form-control" id="partialPaymentReference" placeholder="Número de transacción, etc.">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Procesar Pago',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745',
            preConfirm: () => {
                const amount = parseFloat(document.getElementById('partialPaymentAmount').value);
                const method = document.getElementById('partialPaymentMethod').value;
                const reference = document.getElementById('partialPaymentReference').value;
                
                if (!amount || amount <= 0) {
                    Swal.showValidationMessage('Debe ingresar un monto válido');
                    return false;
                }
                
                if (amount > maxAmount) {
                    Swal.showValidationMessage(`El monto no puede ser mayor a $${formatCurrency(maxAmount)}`);
                    return false;
                }
                
                if (!method) {
                    Swal.showValidationMessage('Debe seleccionar un método de pago');
                    return false;
                }
                
                return { amount, method, reference };
            }
        });

        if (result.isConfirmed) {
            showLoading();
            
            // Get assignment details
            const assignmentResponse = await api.get(`/events/assignments/${assignmentId}`);
            const assignment = assignmentResponse.assignment;
            
            // Create payment
            const paymentData = {
                studentId: assignment.studentId,
                eventId: assignment.eventId,
                amount: result.value.amount,
                method: result.value.method,
                reference: result.value.reference,
                concept: `Pago parcial evento: ${assignment.event.name}`
            };

            await api.post('/payments', paymentData);
            
            // Update assignment (calculate tickets sold based on payment)
            const ticketPrice = assignment.event.ticketPrice;
            const ticketsToSell = Math.floor(result.value.amount / ticketPrice);
            
            if (ticketsToSell > 0) {
                await api.put(`/events/assignments/${assignmentId}`, {
                    ticketsSold: assignment.ticketsSold + ticketsToSell
                });
            }

            showSuccess('Pago parcial procesado exitosamente');
            
            // Notify dashboard of payment
            if (typeof notifyPaymentMade === 'function') {
                notifyPaymentMade({
                    amount: result.value.amount,
                    studentName: `${student.firstName} ${student.lastName}`,
                    concept: `Pago parcial evento: ${assignment.event.name}`
                });
            }
            
            // Refresh the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('studentEventsModal'));
            modal.hide();
            setTimeout(() => showStudentEventsModal(assignment.studentId), 500);
            
            hideLoading();
        }
    } catch (error) {
        console.error('❌ Error processing partial payment:', error);
        showError('Error al procesar el pago parcial: ' + error.message);
        hideLoading();
    }
}

// Cancel payment
async function cancelPayment(paymentId) {
    try {
        const result = await Swal.fire({
            title: '¿Cancelar Pago?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No',
            confirmButtonColor: '#dc3545'
        });

        if (result.isConfirmed) {
            showLoading();
            
            await api.patch(`/payments/${paymentId}/cancel`, {
                reason: 'Cancelado desde gestión de estudiantes'
            });
            
            showSuccess('Pago cancelado exitosamente');
            
            // Refresh the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('studentEventsModal'));
            const studentId = modal._element.querySelector('[onclick*="showStudentEventsModal"]')?.onclick?.toString().match(/'([^']+)'/)?.[1];
            if (studentId) {
                modal.hide();
                setTimeout(() => showStudentEventsModal(studentId), 500);
            }
            
            hideLoading();
        }
    } catch (error) {
        console.error('❌ Error canceling payment:', error);
        showError('Error al cancelar el pago: ' + error.message);
        hideLoading();
    }
}

// Generate invoice for student
async function generateStudentInvoice(studentId) {
    try {
        showLoading();
        
        // Get student data
        const student = currentStudents.find(s => s.id === studentId);
        if (!student) {
            showError('Estudiante no encontrado');
            return;
        }

        // Get pending assignments
        const response = await api.get(`/events/assignments/student/${studentId}`);
        const assignments = response.assignments || [];
        const pendingAssignments = assignments.filter(assignment => {
            const pending = assignment.ticketsAssigned - assignment.ticketsSold;
            return pending > 0;
        });

        if (pendingAssignments.length === 0) {
            showWarning('El estudiante no tiene pagos pendientes para generar factura');
            hideLoading();
            return;
        }

        // Show invoice generation modal
        const result = await Swal.fire({
            title: 'Generar Factura',
            html: `
                <div class="text-start">
                    <p><strong>Estudiante:</strong> ${student.firstName} ${student.lastName}</p>
                    <p><strong>Documento:</strong> ${student.document}</p>
                    <hr>
                    <h6>Conceptos a facturar:</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Evento</th>
                                    <th>Cantidad</th>
                                    <th>Valor Unit.</th>
                                    <th>Total</th>
                                    <th>Incluir</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pendingAssignments.map(assignment => {
                                    const pending = assignment.ticketsAssigned - assignment.ticketsSold;
                                    const total = pending * assignment.event.ticketPrice;
                                    return `
                                        <tr>
                                            <td>${assignment.event.name}</td>
                                            <td>${pending}</td>
                                            <td>$${formatCurrency(assignment.event.ticketPrice)}</td>
                                            <td>$${formatCurrency(total)}</td>
                                            <td>
                                                <input type="checkbox" class="form-check-input invoice-item" 
                                                       value="${assignment.id}" checked 
                                                       data-amount="${total}">
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    <hr>
                    <div class="mb-3">
                        <label for="invoiceObservations" class="form-label">Observaciones (opcional):</label>
                        <textarea class="form-control" id="invoiceObservations" rows="2" 
                                  placeholder="Observaciones adicionales para la factura"></textarea>
                    </div>
                    <div class="alert alert-info">
                        <strong>Total a facturar:</strong> $<span id="invoiceTotal">0</span>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Generar Factura',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745',
            width: '800px',
            didOpen: () => {
                // Calculate total when checkboxes change
                const updateTotal = () => {
                    const checkboxes = document.querySelectorAll('.invoice-item:checked');
                    let total = 0;
                    checkboxes.forEach(cb => {
                        total += parseFloat(cb.dataset.amount);
                    });
                    document.getElementById('invoiceTotal').textContent = formatCurrency(total);
                };
                
                // Initial calculation
                updateTotal();
                
                // Add event listeners
                document.querySelectorAll('.invoice-item').forEach(cb => {
                    cb.addEventListener('change', updateTotal);
                });
            },
            preConfirm: () => {
                const selectedItems = Array.from(document.querySelectorAll('.invoice-item:checked'));
                const observations = document.getElementById('invoiceObservations').value;
                
                if (selectedItems.length === 0) {
                    Swal.showValidationMessage('Debe seleccionar al menos un concepto para facturar');
                    return false;
                }
                
                return {
                    assignmentIds: selectedItems.map(cb => cb.value),
                    observations
                };
            }
        });

        if (result.isConfirmed) {
            // Create invoice
            const invoiceData = {
                studentId: studentId,
                concept: 'Factura por eventos escolares',
                observations: result.value.observations,
                assignmentIds: result.value.assignmentIds
            };

            const invoiceResponse = await api.createStudentInvoice(invoiceData);
            
            showSuccess('Factura generada exitosamente');
            
            // Notify dashboard of invoice generation
            if (typeof notifyInvoiceGenerated === 'function') {
                notifyInvoiceGenerated({
                    invoiceNumber: invoiceResponse.invoice.invoiceNumber,
                    studentName: `${student.firstName} ${student.lastName}`,
                    amount: invoiceResponse.invoice.total
                });
            }
            
            // Refresh the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('studentEventsModal'));
            modal.hide();
            setTimeout(() => showStudentEventsModal(studentId), 500);
        }
        
        hideLoading();
    } catch (error) {
        console.error('❌ Error generating invoice:', error);
        showError('Error al generar factura: ' + error.message);
        hideLoading();
    }
}

// Export functions for global access
window.initStudents = initStudents;
window.showCreateStudentModal = showCreateStudentModal;
window.showStudentModal = showStudentModal;
window.saveStudent = saveStudent;
window.editStudent = editStudent;
window.viewStudent = viewStudent;
window.deleteStudent = deleteStudent;
window.searchStudents = searchStudents;
window.clearStudentFilters = clearStudentFilters;
window.loadStudentsPage = loadStudentsPage;
window.exportStudents = exportStudents;
window.showStudentEventsModal = showStudentEventsModal;
window.quickPaymentFromStudent = quickPaymentFromStudent;
window.partialPaymentFromStudent = partialPaymentFromStudent;
window.cancelPayment = cancelPayment;
window.generateStudentInvoice = generateStudentInvoice;