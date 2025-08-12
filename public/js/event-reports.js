// ================================
// EVENTOS ESCOLARES - MÓDULO DE REPORTES
// ================================

// Variables globales para reportes
let reportsData = [];
let reportsCharts = {};

// ================================
// INICIALIZACIÓN DEL MÓDULO DE REPORTES
// ================================

async function initEventReports() {
    try {
        console.log('📊 Initializing Event Reports Module...');
        
        // Verificar si ya está inicializado
        const reportsContent = document.getElementById('reports-content');
        if (reportsContent && reportsContent.innerHTML.includes('reportEventSelect')) {
            console.log('✅ Event Reports already initialized');
            return;
        }
        
        // Verificar que las funciones de API estén disponibles
        if (!api || typeof api.getEvents !== 'function') {
            throw new Error('API module not properly loaded');
        }
        
        // Cargar el template de reportes (síncrono)
        loadReportsTemplate();
        
        // Cargar eventos para el selector (asíncrono en background)
        loadEventsForReports().catch(error => {
            console.warn('⚠️ Could not load events for reports:', error);
        });
        
        // Generar reporte inicial (asíncrono en background)
        generateEventReports().catch(error => {
            console.warn('⚠️ Could not generate initial reports:', error);
        });
        
        // Setup event listeners específicos
        setupReportsEventListeners();
        
        console.log('✅ Event Reports module initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing reports module:', error);
        
        // Mostrar error en la interfaz
        const reportsContent = document.getElementById('reports-content');
        if (reportsContent) {
            reportsContent.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                    <h3 class="mt-3">Error al Cargar Reportes</h3>
                    <p class="text-muted">No se pudo inicializar el módulo de reportes.</p>
                    <p class="text-muted"><small>Error: ${error.message}</small></p>
                    <button class="btn btn-primary" onclick="initEventReports()">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar
                    </button>
                </div>
            `;
        }
        
        showError('Error al inicializar el módulo de reportes: ' + error.message);
    }
}

// Cargar template de reportes
function loadReportsTemplate() {
    const reportsContent = document.getElementById('reports-content');
    
    if (!reportsContent) {
        console.error('❌ Reports content container not found');
        return;
    }

    reportsContent.innerHTML = `
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
                    <div class="col-md-2">
                        <label for="reportEventType" class="form-label">Tipo</label>
                        <select class="form-select" id="reportEventType">
                            <option value="">Todos los tipos</option>
                            <option value="FUNDRAISING">Recaudación</option>
                            <option value="SOCIAL">Social</option>
                            <option value="ACADEMIC">Académico</option>
                            <option value="CULTURAL">Cultural</option>
                            <option value="SPORTS">Deportivo</option>
                            <option value="BINGO">Bingo</option>
                            <option value="RAFFLE">Rifa</option>
                            <option value="GRADUATION_FEE">Derecho de Grado</option>
                            <option value="OTHER">Otro</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label for="reportStartDate" class="form-label">Fecha Inicio</label>
                        <input type="date" class="form-control" id="reportStartDate">
                    </div>
                    <div class="col-md-2">
                        <label for="reportEndDate" class="form-label">Fecha Fin</label>
                        <input type="date" class="form-control" id="reportEndDate">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">&nbsp;</label>
                        <div class="d-flex gap-2">
                            <button class="btn btn-primary flex-fill" onclick="generateEventReports()">
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

        <!-- Charts Row -->
        <div class="row mb-4">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">Recaudación por Evento</h6>
                        <div class="btn-group btn-group-sm" role="group">
                            <input type="radio" class="btn-check" name="chartType" id="chartBar" autocomplete="off" checked>
                            <label class="btn btn-outline-primary" for="chartBar">Barras</label>
                            
                            <input type="radio" class="btn-check" name="chartType" id="chartLine" autocomplete="off">
                            <label class="btn btn-outline-primary" for="chartLine">Línea</label>
                        </div>
                    </div>
                    <div class="card-body">
                        <canvas id="eventRevenueChart" height="100"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Distribución por Tipo</h6>
                    </div>
                    <div class="card-body">
                        <canvas id="eventTypesChart" height="200"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- Progress and Performance -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Cumplimiento de Metas</h6>
                    </div>
                    <div class="card-body">
                        <canvas id="goalCompletionChart" height="150"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Tendencia Mensual</h6>
                    </div>
                    <div class="card-body">
                        <canvas id="monthlyTrendChart" height="150"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- Top Performers -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Top 10 Estudiantes por Recaudación</h6>
                    </div>
                    <div class="card-body">
                        <div id="topStudentsTable" class="table-responsive">
                            <div class="text-center p-3">
                                <i class="bi bi-hourglass-split"></i>
                                <p class="text-muted mb-0">Generando reporte...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Top 5 Grados por Recaudación</h6>
                    </div>
                    <div class="card-body">
                        <div id="topGradesTable" class="table-responsive">
                            <div class="text-center p-3">
                                <i class="bi bi-hourglass-split"></i>
                                <p class="text-muted mb-0">Generando reporte...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Detailed Report Table -->
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Reporte Detallado</h5>
                <div>
                    <button class="btn btn-outline-success btn-sm me-2" onclick="exportDetailedReport()">
                        <i class="bi bi-file-excel"></i> Excel
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="exportDetailedReportPDF()">
                        <i class="bi bi-file-pdf"></i> PDF
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>Evento</th>
                                <th>Tipo</th>
                                <th>Fecha</th>
                                <th>Precio Boleto</th>
                                <th>Meta</th>
                                <th>Recaudado</th>
                                <th>% Cumplimiento</th>
                                <th>Estudiantes</th>
                                <th>Boletos Vendidos</th>
                                <th>Estado</th>
                                <th>Responsable</th>
                            </tr>
                        </thead>
                        <tbody id="reportTableBody">
                            <tr>
                                <td colspan="11" class="text-center py-4">
                                    <i class="bi bi-hourglass-split fs-1 text-muted"></i>
                                    <p class="text-muted mt-2">Generando reporte detallado...</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div id="reportPagination" class="mt-3"></div>
            </div>
        </div>
    `;
}

// ================================
// FUNCIONES PRINCIPALES DE REPORTES
// ================================

// Cargar eventos para reportes
async function loadEventsForReports() {
    try {
        const events = await api.getEvents();
        const select = document.getElementById('reportEventSelect');
        
        if (!select) return;

        select.innerHTML = '<option value="">Todos los eventos</option>' +
            events.map(event => `
                <option value="${event.id}">
                    ${event.name} - ${formatDateTime(event.eventDate)}
                </option>
            `).join('');

        console.log('✅ Events loaded for reports:', events.length);
    } catch (error) {
        console.error('❌ Error loading events for reports:', error);
        showError('Error al cargar eventos: ' + error.message);
    }
}

// Generar reportes de eventos
async function generateEventReports() {
    try {
        console.log('📊 Generating event reports...');
        
        // Mostrar indicador de carga
        showLoadingIndicators();
        
        // Obtener filtros
        const filters = getReportFilters();
        
        // Cargar datos
        let events, assignments, payments;
        
        try {
            events = await api.getEvents(filters);
        } catch (error) {
            console.error('Error loading events:', error);
            events = [];
        }
        
        // Usar fallback hasta que las rutas estén disponibles
        assignments = [];
        payments = [];
        
        try {
            // Intentar usar las nuevas rutas primero
            if (typeof api.getAllEventAssignments === 'function') {
                try {
                    assignments = await api.getAllEventAssignments(filters);
                } catch (routeError) {
                    console.warn('New assignments route not available, using fallback');
                    throw routeError;
                }
            } else {
                throw new Error('Function not available');
            }
        } catch (error) {
            // Fallback: get assignments from individual events
            console.log('📋 Using fallback method for assignments...');
            for (const event of events) {
                try {
                    const eventAssignments = await api.getEventAssignments(event.id);
                    assignments.push(...eventAssignments.map(a => ({ ...a, event })));
                } catch (e) {
                    console.warn(`Could not load assignments for event ${event.id}:`, e);
                }
            }
        }
        
        try {
            // Intentar usar las nuevas rutas primero
            if (typeof api.getAllEventPayments === 'function') {
                try {
                    payments = await api.getAllEventPayments(filters);
                } catch (routeError) {
                    console.warn('New payments route not available, using fallback');
                    throw routeError;
                }
            } else {
                throw new Error('Function not available');
            }
        } catch (error) {
            // Fallback: get payments from individual events
            console.log('💳 Using fallback method for payments...');
            for (const event of events) {
                try {
                    const eventPayments = await api.getEventPayments(event.id);
                    payments.push(...eventPayments.map(p => ({ ...p, event })));
                } catch (e) {
                    console.warn(`Could not load payments for event ${event.id}:`, e);
                }
            }
        }

        reportsData = { events, assignments, payments };

        // Generar estadísticas generales
        updateReportSummary(events, assignments, payments);

        // Generar gráficos
        await generateCharts(events, assignments, payments);

        // Generar tablas de top performers
        generateTopPerformers(assignments, payments);

        // Generar tabla detallada
        generateDetailedTable(events, assignments);

        console.log('✅ Event reports generated successfully');
    } catch (error) {
        console.error('❌ Error generating reports:', error);
        showError('Error al generar reportes: ' + error.message);
    }
}

// Obtener filtros del reporte
function getReportFilters() {
    return {
        eventId: document.getElementById('reportEventSelect')?.value || null,
        eventType: document.getElementById('reportEventType')?.value || null,
        startDate: document.getElementById('reportStartDate')?.value || null,
        endDate: document.getElementById('reportEndDate')?.value || null
    };
}

// Actualizar resumen del reporte
function updateReportSummary(events, assignments, payments) {
    const totalEvents = events.length;
    const totalRaised = events.reduce((sum, e) => sum + (e.totalRaised || 0), 0);
    const totalStudents = new Set(assignments.map(a => a.studentId)).size;
    const averageRaised = totalEvents > 0 ? totalRaised / totalEvents : 0;

    document.getElementById('reportTotalEvents').textContent = totalEvents;
    document.getElementById('reportTotalRaised').textContent = formatCurrency(totalRaised);
    document.getElementById('reportTotalStudents').textContent = totalStudents;
    document.getElementById('reportAverageRaised').textContent = formatCurrency(averageRaised);
}

// ================================
// GENERACIÓN DE GRÁFICOS
// ================================

// Generar todos los gráficos
async function generateCharts(events, assignments, payments) {
    try {
        // Verificar que Chart.js esté disponible
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not available, skipping chart generation');
            return;
        }
        
        // Destruir gráficos existentes
        destroyExistingCharts();

        // Generar gráficos
        await Promise.all([
            generateRevenueChart(events),
            generateTypesChart(events),
            generateGoalCompletionChart(events),
            generateMonthlyTrendChart(events)
        ]);

        // Setup chart type toggle
        setupChartTypeToggle(events);

    } catch (error) {
        console.error('❌ Error generating charts:', error);
        
        // Mostrar mensaje de error en los contenedores de gráficos
        const chartContainers = [
            'eventRevenueChart', 'eventTypesChart', 
            'goalCompletionChart', 'monthlyTrendChart'
        ];
        
        chartContainers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container && container.parentElement) {
                container.parentElement.innerHTML = `
                    <div class="text-center p-3">
                        <i class="bi bi-exclamation-triangle text-warning"></i>
                        <p class="text-muted mb-0">Error al generar gráfico</p>
                    </div>
                `;
            }
        });
    }
}

// Gráfico de recaudación por evento
function generateRevenueChart(events) {
    const ctx = document.getElementById('eventRevenueChart');
    if (!ctx) return;

    const data = events.slice(0, 10).map(event => ({
        label: event.name.length > 20 ? event.name.substring(0, 20) + '...' : event.name,
        value: event.totalRaised || 0,
        goal: event.fundraisingGoal || 0
    }));

    reportsCharts.revenue = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.label),
            datasets: [
                {
                    label: 'Recaudado',
                    data: data.map(d => d.value),
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Meta',
                    data: data.map(d => d.goal),
                    backgroundColor: 'rgba(255, 99, 132, 0.3)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    type: 'line'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Recaudación vs Meta por Evento'
                },
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Gráfico de tipos de eventos
function generateTypesChart(events) {
    const ctx = document.getElementById('eventTypesChart');
    if (!ctx) return;

    const typeCount = {};
    events.forEach(event => {
        typeCount[event.type] = (typeCount[event.type] || 0) + 1;
    });

    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];

    reportsCharts.types = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(typeCount).map(type => getEventTypeLabel(type)),
            datasets: [{
                data: Object.values(typeCount),
                backgroundColor: colors.slice(0, Object.keys(typeCount).length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Gráfico de cumplimiento de metas
function generateGoalCompletionChart(events) {
    const ctx = document.getElementById('goalCompletionChart');
    if (!ctx) return;

    const completionData = events
        .filter(e => e.fundraisingGoal > 0)
        .map(event => ({
            name: event.name.length > 15 ? event.name.substring(0, 15) + '...' : event.name,
            completion: Math.min(100, Math.round((event.totalRaised / event.fundraisingGoal) * 100))
        }))
        .slice(0, 8);

    reportsCharts.goalCompletion = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: completionData.map(d => d.name),
            datasets: [{
                label: '% Cumplimiento',
                data: completionData.map(d => d.completion),
                backgroundColor: completionData.map(d => 
                    d.completion >= 100 ? '#28a745' : 
                    d.completion >= 75 ? '#ffc107' : 
                    d.completion >= 50 ? '#fd7e14' : '#dc3545'
                ),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de tendencia mensual
function generateMonthlyTrendChart(events) {
    const ctx = document.getElementById('monthlyTrendChart');
    if (!ctx) return;

    // Agrupar eventos por mes
    const monthlyData = {};
    events.forEach(event => {
        const date = new Date(event.eventDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { count: 0, raised: 0 };
        }
        
        monthlyData[monthKey].count++;
        monthlyData[monthKey].raised += event.totalRaised || 0;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const last6Months = sortedMonths.slice(-6);

    reportsCharts.monthlyTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last6Months.map(month => {
                const [year, monthNum] = month.split('-');
                return new Date(year, monthNum - 1).toLocaleDateString('es-CO', { 
                    month: 'short', 
                    year: 'numeric' 
                });
            }),
            datasets: [
                {
                    label: 'Eventos',
                    data: last6Months.map(month => monthlyData[month].count),
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    yAxisID: 'y'
                },
                {
                    label: 'Recaudación',
                    data: last6Months.map(month => monthlyData[month].raised),
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Número de Eventos'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Recaudación ($)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// ================================
// TABLAS DE TOP PERFORMERS
// ================================

// Generar tablas de mejores performers
function generateTopPerformers(assignments, payments) {
    generateTopStudentsTable(assignments);
    generateTopGradesTable(assignments);
}

// Tabla de top estudiantes
function generateTopStudentsTable(assignments) {
    const studentStats = {};
    
    assignments.forEach(assignment => {
        const studentId = assignment.studentId;
        const studentName = `${assignment.student.firstName} ${assignment.student.lastName}`;
        const grade = assignment.student.grade?.name || 'N/A';
        
        if (!studentStats[studentId]) {
            studentStats[studentId] = {
                name: studentName,
                grade: grade,
                totalRaised: 0,
                ticketsSold: 0,
                events: 0
            };
        }
        
        studentStats[studentId].totalRaised += assignment.amountRaised || 0;
        studentStats[studentId].ticketsSold += assignment.ticketsSold || 0;
        studentStats[studentId].events++;
    });

    const topStudents = Object.values(studentStats)
        .sort((a, b) => b.totalRaised - a.totalRaised)
        .slice(0, 10);

    const container = document.getElementById('topStudentsTable');
    
    if (topStudents.length === 0) {
        container.innerHTML = `
            <div class="text-center p-3">
                <i class="bi bi-person-x text-muted"></i>
                <p class="text-muted mb-0">No hay datos de estudiantes</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <table class="table table-sm">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Estudiante</th>
                    <th>Grado</th>
                    <th>Recaudado</th>
                    <th>Boletos</th>
                </tr>
            </thead>
            <tbody>
                ${topStudents.map((student, index) => `
                    <tr>
                        <td>
                            <span class="badge ${index < 3 ? 'bg-warning' : 'bg-secondary'}">${index + 1}</span>
                        </td>
                        <td class="fw-bold">${student.name}</td>
                        <td>${student.grade}</td>
                        <td class="text-success fw-bold">${formatCurrency(student.totalRaised)}</td>
                        <td>${student.ticketsSold}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Tabla de top grados
function generateTopGradesTable(assignments) {
    const gradeStats = {};
    
    assignments.forEach(assignment => {
        const grade = assignment.student.grade?.name || 'N/A';
        
        if (!gradeStats[grade]) {
            gradeStats[grade] = {
                totalRaised: 0,
                students: new Set(),
                ticketsSold: 0
            };
        }
        
        gradeStats[grade].totalRaised += assignment.amountRaised || 0;
        gradeStats[grade].students.add(assignment.studentId);
        gradeStats[grade].ticketsSold += assignment.ticketsSold || 0;
    });

    const topGrades = Object.entries(gradeStats)
        .map(([grade, stats]) => ({
            grade,
            totalRaised: stats.totalRaised,
            studentCount: stats.students.size,
            ticketsSold: stats.ticketsSold,
            averagePerStudent: stats.students.size > 0 ? stats.totalRaised / stats.students.size : 0
        }))
        .sort((a, b) => b.totalRaised - a.totalRaised)
        .slice(0, 5);

    const container = document.getElementById('topGradesTable');
    
    if (topGrades.length === 0) {
        container.innerHTML = `
            <div class="text-center p-3">
                <i class="bi bi-mortarboard text-muted"></i>
                <p class="text-muted mb-0">No hay datos de grados</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <table class="table table-sm">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Grado</th>
                    <th>Recaudado</th>
                    <th>Estudiantes</th>
                    <th>Promedio</th>
                </tr>
            </thead>
            <tbody>
                ${topGrades.map((grade, index) => `
                    <tr>
                        <td>
                            <span class="badge ${index < 3 ? 'bg-success' : 'bg-secondary'}">${index + 1}</span>
                        </td>
                        <td class="fw-bold">${grade.grade}</td>
                        <td class="text-success fw-bold">${formatCurrency(grade.totalRaised)}</td>
                        <td>${grade.studentCount}</td>
                        <td>${formatCurrency(grade.averagePerStudent)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ================================
// TABLA DETALLADA
// ================================

// Generar tabla detallada
function generateDetailedTable(events, assignments) {
    const tbody = document.getElementById('reportTableBody');
    
    if (!tbody) return;

    if (events.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center py-4">
                    <i class="bi bi-calendar-x fs-1 text-muted"></i>
                    <p class="text-muted mt-2">No hay eventos que coincidan con los filtros</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = events.map(event => {
        const eventAssignments = assignments.filter(a => a.eventId === event.id);
        const studentsCount = eventAssignments.length;
        const ticketsSold = eventAssignments.reduce((sum, a) => sum + (a.ticketsSold || 0), 0);
        const progress = event.fundraisingGoal > 0 ? 
            Math.round((event.totalRaised / event.fundraisingGoal) * 100) : 0;

        return `
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
                <td class="fw-bold text-success">${formatCurrency(event.totalRaised || 0)}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="progress me-2" style="width: 60px; height: 20px;">
                            <div class="progress-bar ${progress >= 100 ? 'bg-success' : progress >= 75 ? 'bg-warning' : 'bg-danger'}" 
                                 role="progressbar" style="width: ${Math.min(progress, 100)}%">
                            </div>
                        </div>
                        <small>${progress}%</small>
                    </div>
                </td>
                <td class="text-center">${studentsCount}</td>
                <td class="text-center">${ticketsSold}</td>
                <td>
                    <span class="badge ${getEventStatusClass(event.status)}">${getEventStatusLabel(event.status)}</span>
                </td>
                <td>
                    <small>${event.responsible || event.user?.name || 'N/A'}</small>
                </td>
            </tr>
        `;
    }).join('');
}

// ================================
// FUNCIONES DE UTILIDAD
// ================================

// Mostrar indicadores de carga
function showLoadingIndicators() {
    const indicators = [
        'reportTotalEvents', 'reportTotalRaised', 
        'reportTotalStudents', 'reportAverageRaised'
    ];
    
    indicators.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<i class="bi bi-hourglass-split"></i>';
        }
    });
}

// Destruir gráficos existentes
function destroyExistingCharts() {
    Object.values(reportsCharts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    reportsCharts = {};
}

// Setup toggle de tipo de gráfico
function setupChartTypeToggle(events) {
    const chartTypeInputs = document.querySelectorAll('input[name="chartType"]');
    
    chartTypeInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked && reportsCharts.revenue) {
                reportsCharts.revenue.destroy();
                
                const newType = this.id === 'chartBar' ? 'bar' : 'line';
                generateRevenueChart(events, newType);
            }
        });
    });
}

// ================================
// FUNCIONES DE EXPORTACIÓN
// ================================

// Exportar reportes de eventos
function exportEventReports() {
    try {
        if (!reportsData.events || reportsData.events.length === 0) {
            showError('No hay datos para exportar');
            return;
        }

        // Preparar datos para exportación
        const exportData = reportsData.events.map(event => ({
            'Evento': event.name,
            'Tipo': getEventTypeLabel(event.type),
            'Fecha': formatDateTime(event.eventDate),
            'Precio Boleto': event.ticketPrice,
            'Meta': event.fundraisingGoal,
            'Recaudado': event.totalRaised || 0,
            'Progreso (%)': event.fundraisingGoal > 0 ? 
                Math.round((event.totalRaised / event.fundraisingGoal) * 100) : 0,
            'Estado': getEventStatusLabel(event.status),
            'Responsable': event.responsible || event.user?.name || 'N/A'
        }));

        // Crear y descargar CSV
        const csv = convertToCSV(exportData);
        downloadCSV(csv, `reporte_eventos_${new Date().toISOString().split('T')[0]}.csv`);
        
        showSuccess('Reporte exportado exitosamente');
    } catch (error) {
        console.error('❌ Error exporting reports:', error);
        showError('Error al exportar reporte: ' + error.message);
    }
}

// Exportar reporte detallado
function exportDetailedReport() {
    exportEventReports();
}

// Exportar reporte detallado en PDF
function exportDetailedReportPDF() {
    showInfo('Funcionalidad de exportación PDF en desarrollo');
}

// Convertir datos a CSV
function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') ? 
                    `"${value}"` : value;
            }).join(',')
        )
    ].join('\n');
    
    return csvContent;
}

// Descargar CSV
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Setup event listeners para reportes
function setupReportsEventListeners() {
    // Auto-generar reporte cuando cambien los filtros
    const filterElements = [
        'reportEventSelect', 'reportEventType', 
        'reportStartDate', 'reportEndDate'
    ];
    
    filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', debounce(generateEventReports, 500));
        }
    });
    
    console.log('✅ Reports event listeners setup');
}

// ================================
// FUNCIONES DE UTILIDAD COMPARTIDAS
// ================================

// Función debounce para evitar múltiples llamadas
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

// Funciones de formato (si no están disponibles globalmente)
if (typeof formatCurrency === 'undefined') {
    function formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount || 0);
    }
}

if (typeof formatDateTime === 'undefined') {
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
}

if (typeof getEventTypeLabel === 'undefined') {
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
}

if (typeof getEventStatusLabel === 'undefined') {
    function getEventStatusLabel(status) {
        const statuses = {
            'PLANNING': 'En Planificación',
            'ACTIVE': 'Activo',
            'COMPLETED': 'Completado',
            'CANCELLED': 'Cancelado'
        };
        return statuses[status] || status;
    }
}

if (typeof getEventStatusClass === 'undefined') {
    function getEventStatusClass(status) {
        const classes = {
            'PLANNING': 'bg-warning',
            'ACTIVE': 'bg-success',
            'COMPLETED': 'bg-info',
            'CANCELLED': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }
}

if (typeof showSuccess === 'undefined') {
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
}

if (typeof showError === 'undefined') {
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
}

if (typeof showInfo === 'undefined') {
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
}