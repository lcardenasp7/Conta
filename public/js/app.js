// Main Application Controller

let currentAppPage = 'dashboard';

// Page templates
const pageTemplates = {
    dashboard: `
        <div id="dashboard-content">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Dashboard</h2>
                <button class="btn btn-outline-primary" onclick="refreshDashboard()">
                    <i class="bi bi-arrow-clockwise"></i> Actualizar
                </button>
            </div>
            
            <!-- Stats Cards -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h4 id="totalStudents">0</h4>
                                    <p class="mb-0">Estudiantes</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="bi bi-people fs-1"></i>
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
                                    <h4 id="monthlyIncome">$0</h4>
                                    <p class="mb-0">Ingresos del Mes</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="bi bi-cash-coin fs-1"></i>
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
                                    <h4 id="pendingInvoices">0</h4>
                                    <p class="mb-0">Facturas Pendientes</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="bi bi-file-earmark-text fs-1"></i>
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
                                    <h4 id="activeEvents">0</h4>
                                    <p class="mb-0">Eventos Activos</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="bi bi-calendar-event fs-1"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Charts -->
            <div class="row mb-4">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Ingresos vs Gastos</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="incomeExpenseChart" height="100"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Distribución de Ingresos</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="incomeDistributionChart" height="200"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Recent Transactions -->
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Transacciones Recientes</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Descripción</th>
                                    <th>Tipo</th>
                                    <th>Monto</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody id="recentTransactions">
                                <tr><td colspan="5" class="text-center">Cargando...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    students: `
        <div id="students-content">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Gestión de Estudiantes</h2>
                <button class="btn btn-primary" onclick="showCreateStudentModal()">
                    <i class="bi bi-plus-circle"></i> Nuevo Estudiante
                </button>
            </div>
            
            <!-- Filters -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3">
                            <input type="text" class="form-control" id="studentSearch" placeholder="Buscar estudiante...">
                        </div>
                        <div class="col-md-2">
                            <select class="form-select" id="gradeFilter">
                                <option value="">Todos los grados</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select" id="groupFilter">
                                <option value="">Todos los grupos</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="statusFilter">
                                <option value="">Todos los estados</option>
                                <option value="ACTIVE">Activo</option>
                                <option value="INACTIVE">Inactivo</option>
                                <option value="GRADUATED">Graduado</option>
                                <option value="TRANSFERRED">Trasladado</option>
                                <option value="SUSPENDED">Suspendido</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-outline-secondary w-100" onclick="clearStudentFilters()">
                                <i class="bi bi-x-circle"></i> Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Students Table -->
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Lista de Estudiantes</h5>
                    <button class="btn btn-outline-success btn-sm" onclick="exportStudents()">
                        <i class="bi bi-download"></i> Exportar
                    </button>
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
                                <tr><td colspan="8" class="text-center">Cargando...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div id="studentsPagination"></div>
                </div>
            </div>
        </div>
    `,
    
    invoices: `
        <div id="invoices-content">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Gestión de Facturas</h2>
                <div>
                    <button class="btn btn-outline-primary me-2" onclick="showBulkInvoiceModal()">
                        <i class="bi bi-files"></i> Facturación Masiva
                    </button>
                    <button class="btn btn-primary" onclick="showCreateInvoiceModal()">
                        <i class="bi bi-plus-circle"></i> Nueva Factura
                    </button>
                </div>
            </div>
            
            <!-- Filters -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <input type="text" class="form-control" id="invoiceSearch" placeholder="Buscar factura...">
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="invoiceStatusFilter">
                                <option value="">Todos los estados</option>
                                <option value="PENDING">Pendiente</option>
                                <option value="PAID">Pagada</option>
                                <option value="PARTIAL">Pago Parcial</option>
                                <option value="OVERDUE">Vencida</option>
                                <option value="CANCELLED">Anulada</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="invoiceConceptFilter">
                                <option value="">Todos los conceptos</option>
                                <option value="TUITION">Matrícula</option>
                                <option value="MONTHLY">Mensualidad</option>
                                <option value="EVENT">Evento Escolar</option>
                                <option value="UNIFORM">Uniforme</option>
                                <option value="BOOKS">Libros</option>
                                <option value="TRANSPORT">Transporte</option>
                                <option value="CAFETERIA">Cafetería</option>
                                <option value="OTHER">Otro</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-outline-secondary w-100" onclick="clearInvoiceFilters()">
                                <i class="bi bi-x-circle"></i> Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Invoices Table -->
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Lista de Facturas</h5>
                    <button class="btn btn-outline-success btn-sm" onclick="exportInvoices()">
                        <i class="bi bi-download"></i> Exportar
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Número</th>
                                    <th>Fecha</th>
                                    <th>Estudiante</th>
                                    <th>Concepto</th>
                                    <th>Total</th>
                                    <th>Vencimiento</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="invoicesTableBody">
                                <tr><td colspan="8" class="text-center">Cargando...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div id="invoicesPagination"></div>
                </div>
            </div>
        </div>
    `,
    
    debts: `
        <div id="debts-content">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Control de Deudas</h2>
                <div>
                    <button class="btn btn-outline-primary me-2" onclick="refreshDebts()">
                        <i class="bi bi-arrow-clockwise"></i> Actualizar
                    </button>
                    <button class="btn btn-outline-success" onclick="exportDebts()">
                        <i class="bi bi-download"></i> Exportar Deudores
                    </button>
                </div>
            </div>
            
            <!-- Stats Cards -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h4 id="totalDebtors">0</h4>
                                    <p class="mb-0">Total Deudores</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="bi bi-people-fill fs-1"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-danger text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h4 id="overdueDebtors">0</h4>
                                    <p class="mb-0">Deudores Vencidos</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="bi bi-exclamation-triangle fs-1"></i>
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
                                    <h4 id="totalDebtAmount">$0</h4>
                                    <p class="mb-0">Total Deuda</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="bi bi-currency-dollar fs-1"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-dark text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h4 id="overdueDebtAmount">$0</h4>
                                    <p class="mb-0">Deuda Vencida</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="bi bi-clock-history fs-1"></i>
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
                        <div class="col-md-2">
                            <select class="form-select" id="debtGradeFilter">
                                <option value="">Todos los grados</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select" id="debtGroupFilter">
                                <option value="">Todos los grupos</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <input type="number" class="form-control" id="minAmountFilter" placeholder="Monto mínimo" min="0">
                        </div>
                        <div class="col-md-2">
                            <select class="form-select" id="daysOverdueFilter">
                                <option value="0">Todas las deudas</option>
                                <option value="1">Vencidas (1+ días)</option>
                                <option value="7">Vencidas (7+ días)</option>
                                <option value="30">Vencidas (30+ días)</option>
                                <option value="60">Vencidas (60+ días)</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-primary w-100" onclick="searchDebts()">
                                <i class="bi bi-search"></i> Buscar
                            </button>
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-outline-secondary w-100" onclick="clearDebtFilters()">
                                <i class="bi bi-x-circle"></i> Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Debts Table -->
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Lista de Deudores</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Estudiante</th>
                                    <th>Grado</th>
                                    <th>Factura</th>
                                    <th>Concepto</th>
                                    <th>Total</th>
                                    <th>Pagado</th>
                                    <th>Pendiente</th>
                                    <th>Vencimiento</th>
                                    <th>Días Vencido</th>
                                    <th>Contacto</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="debtsTableBody">
                                <tr><td colspan="11" class="text-center">Cargando...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div id="debtsPagination"></div>
                </div>
            </div>
        </div>
    `,
    
    payments: `
        <div id="payments-content">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Gestión de Pagos</h2>
                <button class="btn btn-primary" onclick="showCreatePaymentModal()">
                    <i class="bi bi-plus-circle"></i> Registrar Pago
                </button>
            </div>
            
            <!-- Stats Cards -->
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h4 id="totalPaymentsCount">0</h4>
                                    <p class="mb-0">Total Pagos</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="bi bi-cash-stack fs-1"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h4 id="todayPaymentsCount">0</h4>
                                    <p class="mb-0">Pagos Hoy</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="bi bi-calendar-check fs-1"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h4 id="monthPaymentsAmount">$0</h4>
                                    <p class="mb-0">Ingresos del Mes</p>
                                </div>
                                <div class="align-self-center">
                                    <i class="bi bi-graph-up fs-1"></i>
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
                            <input type="text" class="form-control" id="paymentSearch" placeholder="Buscar pago...">
                        </div>
                        <div class="col-md-2">
                            <select class="form-select" id="paymentStatusFilter">
                                <option value="">Todos los estados</option>
                                <option value="PENDING">Pendiente</option>
                                <option value="COMPLETED">Completado</option>
                                <option value="CANCELLED">Cancelado</option>
                                <option value="REFUNDED">Reembolsado</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select" id="paymentMethodFilter">
                                <option value="">Todos los métodos</option>
                                <option value="CASH">Efectivo</option>
                                <option value="BANK_TRANSFER">Transferencia</option>
                                <option value="CARD">Tarjeta</option>
                                <option value="CHECK">Cheque</option>
                                <option value="OTHER">Otro</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <input type="date" class="form-control" id="paymentStartDate" placeholder="Fecha inicio">
                        </div>
                        <div class="col-md-2">
                            <input type="date" class="form-control" id="paymentEndDate" placeholder="Fecha fin">
                        </div>
                        <div class="col-md-1">
                            <button class="btn btn-outline-secondary w-100" onclick="clearPaymentFilters()">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Payments Table -->
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Lista de Pagos</h5>
                    <button class="btn btn-outline-success btn-sm" onclick="exportPayments()">
                        <i class="bi bi-download"></i> Exportar
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Número</th>
                                    <th>Fecha</th>
                                    <th>Estudiante</th>
                                    <th>Factura</th>
                                    <th>Monto</th>
                                    <th>Método</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="paymentsTableBody">
                                <tr><td colspan="8" class="text-center">Cargando...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div id="paymentsPagination"></div>
                </div>
            </div>
        </div>
    `,
    grades: `
        <div id="grades-content">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2><i class="bi bi-mortarboard"></i> Gestión de Grados y Grupos</h2>
                <div>
                    <button class="btn btn-outline-primary me-2" onclick="refreshGrades()">
                        <i class="bi bi-arrow-clockwise"></i> Actualizar
                    </button>
                    <button class="btn btn-primary" onclick="openGradeModal()">
                        <i class="bi bi-plus"></i> Nuevo Grado
                    </button>
                </div>
            </div>
            
            <!-- Grades Section -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0"><i class="bi bi-card-list"></i> Grados Académicos</h5>
                </div>
                <div class="card-body">
                    <div class="row" id="gradesContainer">
                        <div class="col-12 text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Cargando grados...</span>
                            </div>
                            <p class="mt-2 text-muted">Cargando grados...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Groups Section -->
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="bi bi-people"></i> Grupos</h5>
                    <button class="btn btn-success btn-sm" onclick="openGroupModal()" disabled>
                        <i class="bi bi-plus"></i> Nuevo Grupo
                    </button>
                </div>
                <div class="card-body">
                    <div id="groupsContainer">
                        <div class="text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Cargando grupos...</span>
                            </div>
                            <p class="mt-2 text-muted">Cargando grupos...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    'financial-dashboard': `
        <div id="financial-dashboard-content">
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Inicializando dashboard financiero...</span>
                </div>
                <p class="mt-3">Cargando dashboard financiero...</p>
            </div>
        </div> bi-plus"></i> Nuevo Grupo
                    </button>
                </div>
                <div class="card-body">
                    <div id="groupsContainer">
                        <div class="text-center text-muted py-4">
                            <i class="bi bi-info-circle fs-1"></i>
                            <p class="mt-2">Selecciona un grado para ver sus grupos</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    institution: `
        <div class="container-fluid">
            <!-- Institution Configuration Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2><i class="bi bi-building"></i> Configuración Institucional</h2>
                <div class="btn-group">
                    <button class="btn btn-primary" onclick="saveInstitutionData()" id="saveInstitutionBtn">
                        <i class="bi bi-save"></i> Guardar Cambios
                    </button>
                    <button class="btn btn-outline-secondary" onclick="resetInstitutionForm()" id="resetInstitutionBtn">
                        <i class="bi bi-arrow-clockwise"></i> Restablecer
                    </button>
                </div>
            </div>

            <!-- Institution Form -->
            <div class="row">
                <div class="col-lg-8">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="bi bi-info-circle"></i> Información Institucional</h5>
                        </div>
                        <div class="card-body">
                            <form id="institutionForm">
                                <!-- Basic Information -->
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="institutionName" class="form-label">Nombre de la Institución *</label>
                                        <input type="text" class="form-control" id="institutionName" name="name" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="institutionNit" class="form-label">NIT *</label>
                                        <input type="text" class="form-control" id="institutionNit" name="nit" required placeholder="000000000-0">
                                    </div>
                                </div>

                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="institutionDane" class="form-label">Código DANE</label>
                                        <input type="text" class="form-control" id="institutionDane" name="dane" placeholder="000000000000">
                                    </div>
                                    <div class="col-md-6">
                                        <label for="institutionResolution" class="form-label">Resolución DIAN</label>
                                        <input type="text" class="form-control" id="institutionResolution" name="resolution" placeholder="Resolución No. 000">
                                    </div>
                                </div>

                                <!-- Location -->
                                <h6 class="text-primary mb-3"><i class="bi bi-geo-alt"></i> Ubicación</h6>
                                <div class="row mb-3">
                                    <div class="col-md-12">
                                        <label for="institutionAddress" class="form-label">Dirección *</label>
                                        <input type="text" class="form-control" id="institutionAddress" name="address" required>
                                    </div>
                                </div>

                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label for="institutionCity" class="form-label">Ciudad *</label>
                                        <input type="text" class="form-control" id="institutionCity" name="city" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="institutionState" class="form-label">Departamento</label>
                                        <input type="text" class="form-control" id="institutionState" name="state">
                                    </div>
                                    <div class="col-md-4">
                                        <label for="institutionLocality" class="form-label">Localidad</label>
                                        <input type="text" class="form-control" id="institutionLocality" name="locality">
                                    </div>
                                </div>

                                <!-- Contact -->
                                <h6 class="text-primary mb-3"><i class="bi bi-telephone"></i> Contacto</h6>
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="institutionPhone" class="form-label">Teléfono *</label>
                                        <input type="tel" class="form-control" id="institutionPhone" name="phone" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="institutionEmail" class="form-label">Email *</label>
                                        <input type="email" class="form-control" id="institutionEmail" name="email" required>
                                    </div>
                                </div>

                                <!-- Academic Information -->
                                <h6 class="text-primary mb-3"><i class="bi bi-mortarboard"></i> Información Académica</h6>
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="institutionLevels" class="form-label">Niveles Educativos</label>
                                        <input type="text" class="form-control" id="institutionLevels" name="levels" placeholder="Preescolar, Básica, Media">
                                    </div>
                                    <div class="col-md-6">
                                        <label for="institutionTitle" class="form-label">Título que Otorga</label>
                                        <input type="text" class="form-control" id="institutionTitle" name="title" placeholder="Bachiller Académico">
                                    </div>
                                </div>

                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="institutionCalendar" class="form-label">Calendario</label>
                                        <select class="form-select" id="institutionCalendar" name="calendar">
                                            <option value="">Seleccionar</option>
                                            <option value="A">Calendario A</option>
                                            <option value="B">Calendario B</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="institutionSchedule" class="form-label">Jornada</label>
                                        <select class="form-select" id="institutionSchedule" name="schedule">
                                            <option value="">Seleccionar</option>
                                            <option value="Mañana">Mañana</option>
                                            <option value="Tarde">Tarde</option>
                                            <option value="Noche">Noche</option>
                                            <option value="Completa">Completa</option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Logo Section -->
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="bi bi-image"></i> Logo Institucional</h5>
                        </div>
                        <div class="card-body text-center">
                            <!-- Logo Preview -->
                            <div class="mb-3">
                                <img id="logoPreview" src="" alt="Logo Institucional" class="img-fluid rounded border" style="max-height: 200px; display: none;">
                                <div id="logoPlaceholder" class="border rounded d-flex align-items-center justify-content-center" style="height: 200px; background-color: #f8f9fa;">
                                    <div class="text-muted">
                                        <i class="bi bi-image fs-1"></i>
                                        <p class="mt-2">Sin logo</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Logo Upload -->
                            <div class="mb-3">
                                <input type="file" class="form-control" id="logoInput" accept="image/*" style="display: none;">
                                <button type="button" class="btn btn-primary" onclick="document.getElementById('logoInput').click()">
                                    <i class="bi bi-upload"></i> Cargar Logo
                                </button>
                            </div>

                            <!-- Logo Actions -->
                            <div class="d-grid gap-2" id="logoActions" style="display: none;">
                                <button type="button" class="btn btn-outline-info btn-sm" onclick="showLogoHistory()">
                                    <i class="bi bi-clock-history"></i> Historial
                                </button>
                                <button type="button" class="btn btn-outline-danger btn-sm" onclick="deleteLogo()">
                                    <i class="bi bi-trash"></i> Eliminar Logo
                                </button>
                            </div>

                            <!-- Logo Info -->
                            <small class="text-muted">
                                Formatos: JPG, PNG, GIF<br>
                                Tamaño máximo: 2MB
                            </small>
                        </div>
                    </div>

                    <!-- Preview Card -->
                    <div class="card mt-3">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="bi bi-eye"></i> Vista Previa</h6>
                        </div>
                        <div class="card-body">
                            <div class="text-center">
                                <img id="logoPreviewSmall" src="" alt="Logo" class="mb-2" style="max-height: 50px; display: none;">
                                <h6 id="previewName" class="mb-1">Nombre de la Institución</h6>
                                <small id="previewNit" class="text-muted">NIT: 000000000-0</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Loading Indicator -->
            <div id="institutionLoading" class="text-center py-4" style="display: none;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2 text-muted">Cargando configuración institucional...</p>
            </div>
        </div>
    `
};

// Load page content
async function loadPage(pageName) {
    const contentArea = document.getElementById('contentArea');
    const pageTitle = document.getElementById('pageTitle');
    
    if (!contentArea || !pageTitle) return;
    
    // Clear any hash from URL
    if (window.location.hash) {
        history.replaceState(null, null, window.location.pathname + window.location.search);
    }
    
    // Update active menu item
    updateActiveMenuItem(pageName);
    
    // Update page title
    const pageTitles = {
        dashboard: 'Dashboard',
        students: 'Gestión de Estudiantes',
        grades: 'Grados y Grupos',
        invoices: 'Gestión de Facturas',
        payments: 'Gestión de Pagos',
        debts: 'Control de Deudas',
        events: 'Gestión de Eventos',
        'event-assignments': 'Asignaciones de Eventos',
        'event-reports': 'Reportes de Eventos',
        'financial-dashboard': 'Dashboard Financiero',
        funds: 'Gestión de Fondos',
        'fund-loans': 'Préstamos entre Fondos',
        'fund-alerts': 'Alertas de Fondos',
        reports: 'Reportes',
        users: 'Gestión de Usuarios',
        institution: 'Configuración Institucional'
    };
    
    pageTitle.textContent = pageTitles[pageName] || 'Sistema de Gestión';
    
    // Load page template or initialize custom pages
    if (pageTemplates[pageName]) {
        contentArea.innerHTML = pageTemplates[pageName];
        currentAppPage = pageName;
        
        // Initialize page-specific functionality
        await initializePage(pageName);
    } else if (pageName === 'events' || pageName === 'event-assignments' || pageName === 'event-reports') {
        // Handle events pages specially
        currentAppPage = pageName;
        await initializePage(pageName);
    } else if (pageName === 'funds' || pageName === 'fund-loans' || pageName === 'fund-alerts') {
        // Handle funds pages specially
        currentAppPage = pageName;
        await initializePage(pageName);
    } else {
        // Special handling for reports page
        if (pageName === 'reports') {
            console.log('🔄 Loading reports page directly...');
            if (typeof initReports === 'function') {
                await initReports();
            } else {
                // Force load reports content
                contentArea.innerHTML = `
                    <div class="container-fluid">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h2><i class="bi bi-graph-up text-primary"></i> Reportes Financieros</h2>
                            <div class="btn-group">
                                <button class="btn btn-primary" onclick="if(typeof showStudentReport === 'function') showStudentReport()">
                                    <i class="bi bi-person-lines-fill"></i> Estado de Cuenta
                                </button>
                                <button class="btn btn-warning" onclick="if(typeof showOverdueReport === 'function') showOverdueReport()">
                                    <i class="bi bi-exclamation-triangle"></i> Cartera Vencida
                                </button>
                                <button class="btn btn-info" onclick="if(typeof showCashFlowReport === 'function') showCashFlowReport()">
                                    <i class="bi bi-cash-stack"></i> Flujo de Caja
                                </button>
                                <button class="btn btn-success" onclick="if(typeof showEventReport === 'function') showEventReport()">
                                    <i class="bi bi-calendar-event"></i> Análisis de Eventos
                                </button>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-body">
                                <div class="text-center py-5">
                                    <i class="bi bi-graph-up display-1 text-primary mb-3"></i>
                                    <h3 class="text-primary">Sistema de Reportes Financieros</h3>
                                    <p class="text-muted mb-4">Sistema operativo - Selecciona un reporte para comenzar</p>
                                    <div class="alert alert-success">
                                        <h6><i class="bi bi-check-circle"></i> Sistema Funcionando</h6>
                                        <p class="mb-0">Los reportes financieros están completamente operativos.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                // Try to load the functions after a delay
                setTimeout(() => {
                    if (typeof initReports === 'function') {
                        initReports();
                    }
                }, 100);
            }
        } else {
            contentArea.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-tools fs-1 text-muted"></i>
                    <h3 class="mt-3">Página en Desarrollo</h3>
                    <p class="text-muted">Esta funcionalidad estará disponible próximamente.</p>
                </div>
            `;
        }
    }
}

// Update active menu item
function updateActiveMenuItem(pageName) {
    // Remove active class from all menu items
    document.querySelectorAll('.menu-item, .submenu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to current page
    const activeItem = document.querySelector(`[data-page="${pageName}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
        
        // If it's a submenu item, also show the parent submenu
        const submenu = activeItem.closest('.submenu');
        if (submenu) {
            submenu.style.display = 'block';
            const parentMenuItem = submenu.previousElementSibling;
            if (parentMenuItem) {
                const arrow = parentMenuItem.querySelector('.submenu-arrow');
                if (arrow) {
                    arrow.classList.add('rotated');
                }
            }
        }
    }
}

// Initialize page-specific functionality
async function initializePage(pageName) {
    try {
        switch (pageName) {
            case 'dashboard':
                if (typeof initDashboard === 'function') {
                    await initDashboard();
                }
                break;
            case 'students':
                if (typeof initStudents === 'function') {
                    await initStudents();
                }
                break;
            case 'grades':
                if (typeof initGrades === 'function') {
                    await initGrades();
                }
                break;
            case 'invoices':
                if (typeof initInvoices === 'function') {
                    await initInvoices();
                }
                break;
            case 'payments':
                if (typeof initPayments === 'function') {
                    await initPayments();
                }
                break;
            case 'debts':
                if (typeof initDebts === 'function') {
                    await initDebts();
                }
                break;
            case 'reports':
                console.log('🔄 Loading reports page...');
                try {
                    if (typeof initReports === 'function') {
                        console.log('✅ Executing initReports...');
                        await initReports();
                    } else {
                        console.error('❌ initReports not found, loading manually...');
                        // Force load reports manually
                        setTimeout(() => {
                            if (typeof initReports === 'function') {
                                initReports();
                            }
                        }, 500);
                    }
                } catch (error) {
                    console.error('❌ Error in reports:', error);
                }
                break;
            case 'financial-dashboard':
                if (typeof initFinancialDashboard === 'function') {
                    await initFinancialDashboard();
                } else {
                    console.error('Financial Dashboard module not loaded');
                    document.getElementById('contentArea').innerHTML = `
                        <div class="text-center py-5">
                            <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                            <h3 class="mt-3">Dashboard Financiero no disponible</h3>
                            <p class="text-muted">El módulo de dashboard financiero no se ha cargado correctamente.</p>
                            <button class="btn btn-primary" onclick="location.reload()">
                                <i class="bi bi-arrow-clockwise"></i> Recargar Página
                            </button>
                        </div>
                    `;
                }
                break;
            case 'funds':
                if (typeof initFunds === 'function') {
                    await initFunds();
                } else {
                    console.error('Funds module not loaded');
                    document.getElementById('contentArea').innerHTML = `
                        <div class="text-center py-5">
                            <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                            <h3 class="mt-3">Gestión de Fondos no disponible</h3>
                            <p class="text-muted">El módulo de gestión de fondos no se ha cargado correctamente.</p>
                            <button class="btn btn-primary" onclick="location.reload()">
                                <i class="bi bi-arrow-clockwise"></i> Recargar Página
                            </button>
                        </div>
                    `;
                }
                break;
            case 'fund-loans':
                if (typeof initFundLoans === 'function') {
                    await initFundLoans();
                } else {
                    console.error('Fund Loans module not loaded');
                    document.getElementById('contentArea').innerHTML = `
                        <div class="text-center py-5">
                            <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                            <h3 class="mt-3">Préstamos entre Fondos no disponible</h3>
                            <p class="text-muted">El módulo de préstamos entre fondos no se ha cargado correctamente.</p>
                            <button class="btn btn-primary" onclick="location.reload()">
                                <i class="bi bi-arrow-clockwise"></i> Recargar Página
                            </button>
                        </div>
                    `;
                }
                break;
            case 'fund-alerts':
                if (typeof initFundAlerts === 'function') {
                    await initFundAlerts();
                } else {
                    console.error('Fund Alerts module not loaded');
                    document.getElementById('contentArea').innerHTML = `
                        <div class="text-center py-5">
                            <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                            <h3 class="mt-3">Alertas de Fondos no disponible</h3>
                            <p class="text-muted">El módulo de alertas de fondos no se ha cargado correctamente.</p>
                            <button class="btn btn-primary" onclick="location.reload()">
                                <i class="bi bi-arrow-clockwise"></i> Recargar Página
                            </button>
                        </div>
                    `;
                }
                break;
            case 'fund-alerts':
                // Página simple de alertas de fondos
                document.getElementById('contentArea').innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2><i class="bi bi-exclamation-triangle"></i> Alertas de Fondos</h2>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <div class="text-center py-5">
                                <i class="bi bi-bell fs-1 text-info"></i>
                                <h3 class="mt-3">Sistema de Alertas</h3>
                                <p class="text-muted">Las alertas de fondos se muestran automáticamente en el dashboard principal cuando se activan.</p>
                                <p class="text-muted">Las alertas se generan cuando:</p>
                                <ul class="list-unstyled">
                                    <li>• Un fondo alcanza el 70% de uso (Alerta Nivel 1)</li>
                                    <li>• Un fondo alcanza el 85% de uso (Alerta Nivel 2)</li>
                                    <li>• Un fondo alcanza el 95% de uso (Alerta Nivel 3)</li>
                                    <li>• Un préstamo está próximo a vencer</li>
                                    <li>• Un préstamo está vencido</li>
                                </ul>
                                <button class="btn btn-primary" onclick="navigateTo('dashboard')">
                                    <i class="bi bi-speedometer2"></i> Ver Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                break;
            case 'institution':
                if (typeof initInstitution === 'function') {
                    await initInstitution();
                } else {
                    console.error('Institution module not loaded');
                }
                break;
            case 'events':
                if (typeof initEvents === 'function') {
                    await initEvents();
                } else {
                    console.error('Events module not loaded - initEvents function not found');
                    document.getElementById('contentArea').innerHTML = `
                        <div class="text-center py-5">
                            <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                            <h3 class="mt-3">Módulo de Eventos no disponible</h3>
                            <p class="text-muted">El archivo js/events.js no se ha cargado correctamente.</p>
                            <button class="btn btn-primary" onclick="location.reload()">
                                <i class="bi bi-arrow-clockwise"></i> Recargar Página
                            </button>
                        </div>
                    `;
                }
                break;
            case 'event-assignments':
                // Load events page and switch to assignments tab
                console.log('🔄 Loading event-assignments page...');
                console.log('initEvents available:', typeof initEvents);
                
                if (typeof initEvents === 'function') {
                    console.log('✅ Initializing events module...');
                    await initEvents();
                    console.log('✅ Events module initialized, switching to assignments tab...');
                    // Switch to assignments tab after initialization
                    switchToEventsTab('assignments');
                } else {
                    console.error('❌ initEvents function not available');
                    document.getElementById('contentArea').innerHTML = `
                        <div class="text-center py-5">
                            <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                            <h3 class="mt-3">Módulo de Eventos no disponible</h3>
                            <p class="text-muted">Para gestionar asignaciones, necesitas el módulo de eventos.</p>
                            <p class="text-muted"><small>initEvents type: ${typeof initEvents}</small></p>
                            <button class="btn btn-primary" onclick="location.reload()">
                                <i class="bi bi-arrow-clockwise"></i> Recargar Página
                            </button>
                        </div>
                    `;
                }
                break;
            case 'event-reports':
                // Load events page and switch to reports tab
                console.log('🔄 Loading event-reports page...');
                console.log('initEvents available:', typeof initEvents);
                
                if (typeof initEvents === 'function') {
                    console.log('✅ Initializing events module...');
                    await initEvents();
                    console.log('✅ Events module initialized, switching to reports tab...');
                    // Switch to reports tab after initialization
                    switchToEventsTab('reports');
                } else {
                    console.error('❌ initEvents function not available');
                    document.getElementById('contentArea').innerHTML = `
                        <div class="text-center py-5">
                            <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                            <h3 class="mt-3">Módulo de Eventos no disponible</h3>
                            <p class="text-muted">Para ver reportes de eventos, necesitas el módulo de eventos.</p>
                            <p class="text-muted"><small>initEvents type: ${typeof initEvents}</small></p>
                            <button class="btn btn-primary" onclick="location.reload()">
                                <i class="bi bi-arrow-clockwise"></i> Recargar Página
                            </button>
                        </div>
                    `;
                }
                break;
            default:
                console.log(`No initialization function found for page: ${pageName}`);
        }
    } catch (error) {
        console.error(`Error initializing page ${pageName}:`, error);
        document.getElementById('contentArea').innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-exclamation-circle fs-1 text-danger"></i>
                <h3 class="mt-3">Error al cargar la página</h3>
                <p class="text-muted">Ha ocurrido un error al inicializar esta sección.</p>
                <button class="btn btn-primary" onclick="loadPage('dashboard')">
                    <i class="bi bi-house"></i> Ir al Dashboard
                </button>
            </div>
        `;
    }
}

// Toggle submenu
function toggleSubmenu(submenuId) {
    const submenu = document.getElementById(`${submenuId}-submenu`);
    const arrow = document.querySelector(`[onclick="toggleSubmenu('${submenuId}')"] .submenu-arrow`);
    
    if (submenu && arrow) {
        if (submenu.style.display === 'block') {
            submenu.style.display = 'none';
            arrow.classList.remove('rotated');
        } else {
            submenu.style.display = 'block';
            arrow.classList.add('rotated');
        }
    }
}

// Toggle sidebar (for mobile)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

// Initialize app
function initApp() {
    // Setup menu item click handlers
    document.querySelectorAll('[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = item.getAttribute('data-page');
            loadPage(pageName);
        });
    });
    
    // Load initial page
    loadPage('dashboard');
    
    // Setup responsive sidebar
    if (window.innerWidth < 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.add('collapsed');
        }
    }
}

// Switch to specific events tab
function switchToEventsTab(tabName) {
    // Función para intentar el cambio de tab
    const attemptTabSwitch = (attempt = 1, maxAttempts = 10) => {
        let tabId, tabTarget;
        
        switch (tabName) {
            case 'assignments':
                tabId = 'events-assignments-tab';
                tabTarget = '#events-assignments';
                break;
            case 'reports':
                tabId = 'events-reports-tab';
                tabTarget = '#events-reports';
                break;
            default:
                tabId = 'events-list-tab';
                tabTarget = '#events-list';
        }
        
        // Verificar si los elementos existen
        const targetTab = document.getElementById(tabId);
        const targetPane = document.querySelector(tabTarget);
        
        if (targetTab && targetPane) {
            // Remove active class from all tabs
            const allTabs = document.querySelectorAll('#eventsTab .nav-link');
            const allPanes = document.querySelectorAll('#eventsTabContent .tab-pane');
            
            allTabs.forEach(tab => {
                tab.classList.remove('active');
                tab.setAttribute('aria-selected', 'false');
            });
            
            allPanes.forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            
            // Activate target tab
            targetTab.classList.add('active');
            targetTab.setAttribute('aria-selected', 'true');
            targetPane.classList.add('show', 'active');
            
            // Initialize the corresponding module immediately
            if (tabName === 'assignments' && typeof initEventAssignments === 'function') {
                initEventAssignments();
            } else if (tabName === 'reports' && typeof initEventReports === 'function') {
                initEventReports();
            }
            
            console.log(`✅ Switched to events ${tabName} tab (attempt ${attempt})`);
        } else if (attempt < maxAttempts) {
            // Si los elementos no existen, intentar de nuevo en 50ms
            console.log(`⏳ Tab elements not ready, retrying... (attempt ${attempt}/${maxAttempts})`);
            setTimeout(() => attemptTabSwitch(attempt + 1, maxAttempts), 50);
        } else {
            console.warn(`⚠️ Could not find tab elements for ${tabName} after ${maxAttempts} attempts`);
        }
    };
    
    // Intentar inmediatamente, luego con pequeños delays si es necesario
    attemptTabSwitch();
}

// Make functions globally available
window.loadPage = loadPage;
window.toggleSubmenu = toggleSubmenu;
window.toggleSidebar = toggleSidebar;
window.switchToEventsTab = switchToEventsTab;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Prevent hash navigation globally
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href="#"]');
        if (link) {
            e.preventDefault();
            // Let the onclick handler manage navigation
            return false;
        }
    });
    
    // Clear hash on page load
    if (window.location.hash) {
        history.replaceState(null, null, window.location.pathname + window.location.search);
    }
    
    // Wait for auth to initialize first
    setTimeout(() => {
        if (isAuthenticated()) {
            initApp();
        }
    }, 100);
});
// Force reports initialization
(function() {
    const originalNavigateToPage = window.navigateToPage;
    window.navigateToPage = function(pageName) {
        console.log('🔄 Navigating to:', pageName);
        if (pageName === 'reports') {
            console.log('🎯 Reports page detected, ensuring initialization...');
            setTimeout(() => {
                if (typeof initReports === 'function') {
                    console.log('✅ Force executing initReports...');
                    initReports();
                } else {
                    console.log('❌ initReports still not available');
                }
            }, 200);
        }
        if (originalNavigateToPage) {
            return originalNavigateToPage.call(this, pageName);
        }
    };
})();
