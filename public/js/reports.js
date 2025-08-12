// Reports Management Module

let currentReport = null;
let reportChart = null;

// Initialize reports page
async function initReports() {
    try {
        console.log('📊 Initializing reports page...');
        showLoading();

        // Render reports content
        renderReportsContent();

        // Setup event listeners
        setupReportsEventListeners();

        hideLoading();
    } catch (error) {
        console.error('❌ Error initializing reports:', error);
        showError('Error al cargar la página de reportes');
        hideLoading();
    }
}

// Render reports page content
function renderReportsContent() {
    const contentArea = document.getElementById('contentArea');

    contentArea.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-graph-up"></i> Reportes Financieros</h2>
            <div class="btn-group">
                <button class="btn btn-outline-primary" onclick="showStudentAccountModal()">
                    <i class="bi bi-person-lines-fill"></i> Estado de Cuenta
                </button>
                <button class="btn btn-outline-warning" onclick="generateOverdueReport()">
                    <i class="bi bi-exclamation-triangle"></i> Cartera Vencida
                </button>
                <button class="btn btn-outline-info" onclick="showCashFlowModal()">
                    <i class="bi bi-cash-stack"></i> Flujo de Caja
                </button>
                <button class="btn btn-outline-success" onclick="showEventAnalysisModal()">
                    <i class="bi bi-calendar-event"></i> Análisis de Eventos
                </button>
            </div>
        </div>

        <!-- Report Filters -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3">
                        <label class="form-label">Fecha Desde</label>
                        <input type="date" class="form-control" id="reportStartDate">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Fecha Hasta</label>
                        <input type="date" class="form-control" id="reportEndDate">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Grado</label>
                        <select class="form-select" id="reportGradeFilter">
                            <option value="">Todos los grados</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Grupo</label>
                        <select class="form-select" id="reportGroupFilter">
                            <option value="">Todos los grupos</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <!-- Report Content Area -->
        <div class="card">
            <div class="card-body">
                <div id="reportContent">
                    <div class="text-center py-5">
                        <i class="bi bi-graph-up display-1 text-muted"></i>
                        <h4 class="text-muted mt-3">Selecciona un reporte para comenzar</h4>
                        <p class="text-muted">Usa los botones de arriba para generar reportes financieros</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load grades and groups for filters
    loadGradesForReports();
}

// Load grades for report filters
async function loadGradesForReports() {
    try {
        const grades = await API.request('GET', '/api/grades');
        const gradeSelect = document.getElementById('reportGradeFilter');
        
        grades.forEach(grade => {
            const option = document.createElement('option');
            option.value = grade.id;
            option.textContent = grade.name;
            gradeSelect.appendChild(option);
        });

        // Load groups when grade changes
        gradeSelect.addEventListener('change', loadGroupsForReports);

    } catch (error) {
        console.error('Error loading grades for reports:', error);
    }
}

// Load groups for report filters
async function loadGroupsForReports() {
    try {
        const gradeId = document.getElementById('reportGradeFilter').value;
        const groupSelect = document.getElementById('reportGroupFilter');
        
        // Clear existing options
        groupSelect.innerHTML = '<option value="">Todos los grupos</option>';

        if (gradeId) {
            const groups = await API.request('GET', `/api/groups?gradeId=${gradeId}`);
            groups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = group.name;
                groupSelect.appendChild(option);
            });
        }

    } catch (error) {
        console.error('Error loading groups for reports:', error);
    }
}

// Show student account modal
function showStudentAccountModal() {
    const modal = new bootstrap.Modal(document.getElementById('studentAccountModal') || createStudentAccountModal());
    modal.show();
}

// Create student account modal
function createStudentAccountModal() {
    const modalHtml = `
        <div class="modal fade" id="studentAccountModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-person-lines-fill"></i> Estado de Cuenta por Estudiante
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Buscar Estudiante</label>
                            <input type="text" class="form-control" id="studentSearchInput" 
                                   placeholder="Buscar por nombre o documento...">
                            <div id="studentSearchResults" class="mt-2"></div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <label class="form-label">Fecha Desde</label>
                                <input type="date" class="form-control" id="accountStartDate">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Fecha Hasta</label>
                                <input type="date" class="form-control" id="accountEndDate">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="generateStudentAccount()" disabled id="generateAccountBtn">
                            <i class="bi bi-file-earmark-text"></i> Generar Reporte
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Setup student search
    const searchInput = document.getElementById('studentSearchInput');
    searchInput.addEventListener('input', debounce(searchStudentsForReport, 300));

    return document.getElementById('studentAccountModal');
}

// Search students for report
async function searchStudentsForReport() {
    const query = document.getElementById('studentSearchInput').value;
    const resultsDiv = document.getElementById('studentSearchResults');
    const generateBtn = document.getElementById('generateAccountBtn');

    if (query.length < 2) {
        resultsDiv.innerHTML = '';
        generateBtn.disabled = true;
        return;
    }

    try {
        const students = await API.request('GET', `/api/students?search=${encodeURIComponent(query)}&limit=10`);
        
        if (students.data && students.data.length > 0) {
            resultsDiv.innerHTML = students.data.map(student => `
                <div class="student-result p-2 border rounded mb-1 cursor-pointer" 
                     onclick="selectStudentForReport('${student.id}', '${student.firstName} ${student.lastName}')">
                    <strong>${student.firstName} ${student.lastName}</strong>
                    <small class="text-muted d-block">
                        ${student.document} - ${student.grade?.name} ${student.group?.name}
                    </small>
                </div>
            `).join('');
        } else {
            resultsDiv.innerHTML = '<div class="text-muted p-2">No se encontraron estudiantes</div>';
        }

    } catch (error) {
        console.error('Error searching students:', error);
        resultsDiv.innerHTML = '<div class="text-danger p-2">Error en la búsqueda</div>';
    }
}

// Select student for report
function selectStudentForReport(studentId, studentName) {
    document.getElementById('studentSearchInput').value = studentName;
    document.getElementById('studentSearchInput').dataset.studentId = studentId;
    document.getElementById('studentSearchResults').innerHTML = '';
    document.getElementById('generateAccountBtn').disabled = false;
}

// Generate student account report
async function generateStudentAccount() {
    try {
        const studentId = document.getElementById('studentSearchInput').dataset.studentId;
        const startDate = document.getElementById('accountStartDate').value;
        const endDate = document.getElementById('accountEndDate').value;

        if (!studentId) {
            showError('Por favor selecciona un estudiante');
            return;
        }

        showLoading();

        let url = `/api/reports/student-account/${studentId}`;
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (params.toString()) url += `?${params.toString()}`;

        const reportData = await API.request('GET', url);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('studentAccountModal'));
        modal.hide();

        // Display report
        displayStudentAccountReport(reportData);
        
        hideLoading();

    } catch (error) {
        console.error('Error generating student account:', error);
        showError('Error al generar el reporte');
        hideLoading();
    }
}

// Display student account report
function displayStudentAccountReport(data) {
    const reportContent = document.getElementById('reportContent');
    
    reportContent.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="bi bi-person-lines-fill"></i> Estado de Cuenta - ${data.student.firstName} ${data.student.lastName}</h4>
            <div class="btn-group">
                <button class="btn btn-outline-success btn-sm" onclick="exportStudentAccountToExcel()">
                    <i class="bi bi-file-earmark-excel"></i> Excel
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="exportStudentAccountToPDF()">
                    <i class="bi bi-file-earmark-pdf"></i> PDF
                </button>
                <button class="btn btn-outline-primary btn-sm" onclick="printStudentAccount()">
                    <i class="bi bi-printer"></i> Imprimir
                </button>
            </div>
        </div>

        <!-- Student Info -->
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0">Información del Estudiante</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3">
                        <strong>Documento:</strong><br>
                        ${data.student.document}
                    </div>
                    <div class="col-md-3">
                        <strong>Grado:</strong><br>
                        ${data.student.grade} ${data.student.group}
                    </div>
                    <div class="col-md-3">
                        <strong>Email:</strong><br>
                        ${data.student.email || 'No registrado'}
                    </div>
                    <div class="col-md-3">
                        <strong>Teléfono:</strong><br>
                        ${data.student.phone || 'No registrado'}
                    </div>
                </div>
            </div>
        </div>

        <!-- Summary -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title text-primary">${formatCurrency(data.summary.totalInvoiced)}</h5>
                        <p class="card-text">Total Facturado</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title text-success">${formatCurrency(data.summary.totalPaid)}</h5>
                        <p class="card-text">Total Pagado</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title text-warning">${formatCurrency(data.summary.totalEventAssignments)}</h5>
                        <p class="card-text">Eventos Asignados</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title text-danger">${formatCurrency(data.summary.grandTotalPending)}</h5>
                        <p class="card-text">Total Pendiente</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Invoices -->
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0">Facturas</h6>
            </div>
            <div class="card-body">
                ${data.invoices.length > 0 ? `
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Número</th>
                                    <th>Fecha</th>
                                    <th>Vencimiento</th>
                                    <th>Concepto</th>
                                    <th>Total</th>
                                    <th>Pagado</th>
                                    <th>Pendiente</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.invoices.map(invoice => `
                                    <tr>
                                        <td>${invoice.invoiceNumber}</td>
                                        <td>${formatDate(invoice.date)}</td>
                                        <td>${formatDate(invoice.dueDate)}</td>
                                        <td>${getConceptText(invoice.concept)}</td>
                                        <td>${formatCurrency(invoice.total)}</td>
                                        <td>${formatCurrency(invoice.paidAmount)}</td>
                                        <td>${formatCurrency(invoice.total - invoice.paidAmount)}</td>
                                        <td><span class="badge ${getInvoiceStatusClass(invoice.status)}">${getInvoiceStatusText(invoice.status)}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="text-muted">No hay facturas registradas</p>'}
            </div>
        </div>

        <!-- Event Assignments -->
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0">Eventos Asignados</h6>
            </div>
            <div class="card-body">
                ${data.eventAssignments.length > 0 ? `
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Evento</th>
                                    <th>Fecha</th>
                                    <th>Boletos</th>
                                    <th>Precio Unit.</th>
                                    <th>Total Asignado</th>
                                    <th>Recaudado</th>
                                    <th>Pendiente</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.eventAssignments.map(assignment => `
                                    <tr>
                                        <td>${assignment.eventName}</td>
                                        <td>${formatDate(assignment.eventDate)}</td>
                                        <td>${assignment.ticketsAssigned}</td>
                                        <td>${formatCurrency(assignment.ticketPrice)}</td>
                                        <td>${formatCurrency(assignment.totalAssigned)}</td>
                                        <td>${formatCurrency(assignment.amountRaised)}</td>
                                        <td>${formatCurrency(assignment.pending)}</td>
                                        <td><span class="badge bg-${assignment.status === 'COMPLETED' ? 'success' : 'warning'}">${assignment.status}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="text-muted">No hay eventos asignados</p>'}
            </div>
        </div>

        <!-- Payments -->
        <div class="card">
            <div class="card-header">
                <h6 class="mb-0">Historial de Pagos</h6>
            </div>
            <div class="card-body">
                ${data.payments.length > 0 ? `
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Número</th>
                                    <th>Fecha</th>
                                    <th>Monto</th>
                                    <th>Método</th>
                                    <th>Referencia</th>
                                    <th>Factura/Evento</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.payments.map(payment => `
                                    <tr>
                                        <td>${payment.paymentNumber}</td>
                                        <td>${formatDate(payment.date)}</td>
                                        <td>${formatCurrency(payment.amount)}</td>
                                        <td>${payment.method}</td>
                                        <td>${payment.reference || '-'}</td>
                                        <td>${payment.invoiceNumber || payment.eventName || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="text-muted">No hay pagos registrados</p>'}
            </div>
        </div>
    `;

    // Store current report data for export
    currentReport = {
        type: 'student-account',
        data: data
    };
}

// Setup event listeners
function setupReportsEventListeners() {
    // Date filters
    const startDate = document.getElementById('reportStartDate');
    const endDate = document.getElementById('reportEndDate');
    
    if (startDate) startDate.addEventListener('change', updateReportFilters);
    if (endDate) endDate.addEventListener('change', updateReportFilters);
}

// Update report filters
function updateReportFilters() {
    // This function can be used to refresh current report with new filters
    console.log('Report filters updated');
}

// Export functions (placeholders for now)
function exportStudentAccountToExcel() {
    if (!currentReport || currentReport.type !== 'student-account') {
        showError('No hay reporte para exportar');
        return;
    }
    
    // TODO: Implement Excel export
    showNotification('Funcionalidad de exportación a Excel en desarrollo', 'info');
}

function exportStudentAccountToPDF() {
    if (!currentReport || currentReport.type !== 'student-account') {
        showError('No hay reporte para exportar');
        return;
    }
    
    // TODO: Implement PDF export
    showNotification('Funcionalidad de exportación a PDF en desarrollo', 'info');
}

function printStudentAccount() {
    if (!currentReport || currentReport.type !== 'student-account') {
        showError('No hay reporte para imprimir');
        return;
    }
    
    window.print();
}

// Generate overdue payments report
async function generateOverdueReport() {
    try {
        showLoading();
        
        const reportData = await API.request('GET', '/api/reports/overdue-payments');
        displayOverdueReport(reportData);
        
        hideLoading();
        
    } catch (error) {
        console.error('Error generating overdue report:', error);
        showError('Error al generar el reporte de cartera vencida');
        hideLoading();
    }
}

// Display overdue report
function displayOverdueReport(data) {
    const reportContent = document.getElementById('reportContent');
    
    reportContent.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="bi bi-exclamation-triangle text-warning"></i> Reporte de Cartera Vencida</h4>
            <div class="btn-group">
                <button class="btn btn-outline-success btn-sm" onclick="exportOverdueToExcel()">
                    <i class="bi bi-file-earmark-excel"></i> Excel
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="exportOverdueToPDF()">
                    <i class="bi bi-file-earmark-pdf"></i> PDF
                </button>
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title text-danger">${data.summary.totalOverdueInvoices}</h5>
                        <p class="card-text">Facturas Vencidas</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title text-danger">${formatCurrency(data.summary.totalOverdueAmount)}</h5>
                        <p class="card-text">Monto Total Vencido</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title text-warning">${data.summary.averageDaysOverdue}</h5>
                        <p class="card-text">Días Promedio Vencidos</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Overdue Invoices Table -->
        <div class="card">
            <div class="card-header">
                <h6 class="mb-0">Detalle de Facturas Vencidas</h6>
            </div>
            <div class="card-body">
                ${data.overdueInvoices.length > 0 ? `
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Factura</th>
                                    <th>Estudiante</th>
                                    <th>Grado</th>
                                    <th>Concepto</th>
                                    <th>Vencimiento</th>
                                    <th>Días Vencidos</th>
                                    <th>Total</th>
                                    <th>Pagado</th>
                                    <th>Pendiente</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.overdueInvoices.map(invoice => `
                                    <tr class="${invoice.daysOverdue > 60 ? 'table-danger' : invoice.daysOverdue > 30 ? 'table-warning' : ''}">
                                        <td>${invoice.invoiceNumber}</td>
                                        <td>
                                            <strong>${invoice.studentName}</strong><br>
                                            <small class="text-muted">${invoice.studentDocument}</small>
                                        </td>
                                        <td>${invoice.grade} ${invoice.group}</td>
                                        <td>${getConceptText(invoice.concept)}</td>
                                        <td>${formatDate(invoice.dueDate)}</td>
                                        <td>
                                            <span class="badge ${invoice.daysOverdue > 60 ? 'bg-danger' : invoice.daysOverdue > 30 ? 'bg-warning' : 'bg-secondary'}">
                                                ${invoice.daysOverdue} días
                                            </span>
                                        </td>
                                        <td>${formatCurrency(invoice.totalAmount)}</td>
                                        <td>${formatCurrency(invoice.paidAmount)}</td>
                                        <td><strong>${formatCurrency(invoice.pendingAmount)}</strong></td>
                                        <td><span class="badge ${getInvoiceStatusClass(invoice.status)}">${getInvoiceStatusText(invoice.status)}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="text-muted">No hay facturas vencidas</p>'}
            </div>
        </div>
    `;

    // Store current report data for export
    currentReport = {
        type: 'overdue-payments',
        data: data
    };
}

// Placeholder functions for other reports
function showCashFlowModal() {
    showNotification('Reporte de flujo de caja en desarrollo', 'info');
}

function showEventAnalysisModal() {
    showNotification('Análisis de eventos en desarrollo', 'info');
}

function exportOverdueToExcel() {
    showNotification('Exportación a Excel en desarrollo', 'info');
}

function exportOverdueToPDF() {
    showNotification('Exportación a PDF en desarrollo', 'info');
}

// Helper functions
function getConceptText(concept) {
    const concepts = {
        'TUITION': 'Matrícula',
        'MONTHLY': 'Mensualidad',
        'EVENT': 'Evento',
        'UNIFORM': 'Uniforme',
        'BOOKS': 'Libros',
        'TRANSPORT': 'Transporte',
        'CAFETERIA': 'Cafetería',
        'OTHER': 'Otro'
    };
    return concepts[concept] || concept;
}

function getInvoiceStatusClass(status) {
    const classes = {
        'PENDING': 'bg-warning',
        'PAID': 'bg-success',
        'PARTIAL': 'bg-info',
        'OVERDUE': 'bg-danger',
        'CANCELLED': 'bg-secondary'
    };
    return classes[status] || 'bg-secondary';
}

function getInvoiceStatusText(status) {
    const texts = {
        'PENDING': 'Pendiente',
        'PAID': 'Pagada',
        'PARTIAL': 'Parcial',
        'OVERDUE': 'Vencida',
        'CANCELLED': 'Cancelada'
    };
    return texts[status] || status;
}

// Export functions to global scope
window.initReports = initReports;
window.showStudentAccountModal = showStudentAccountModal;
window.generateOverdueReport = generateOverdueReport;
window.showCashFlowModal = showCashFlowModal;
window.showEventAnalysisModal = showEventAnalysisModal;
window.selectStudentForReport = selectStudentForReport;
window.generateStudentAccount = generateStudentAccount;
window.exportStudentAccountToExcel = exportStudentAccountToExcel;
window.exportStudentAccountToPDF = exportStudentAccountToPDF;
window.printStudentAccount = printStudentAccount;
window.exportOverdueToExcel = exportOverdueToExcel;
window.exportOverdueToPDF = exportOverdueToPDF;