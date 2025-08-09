// Debts Management

let currentDebts = [];
let currentDebtsPage = 1;
let totalDebtsPages = 1;
let currentDebtsFilters = {};

// Load debts data
async function loadDebts(page = 1, filters = {}) {
    try {
        showLoading();
        
        const params = {
            page,
            limit: 20,
            ...filters
        };
        
        const response = await api.getDebts(params);
        
        currentDebts = response.debts || [];
        currentDebtsPage = response.pagination?.page || 1;
        totalDebtsPages = response.pagination?.pages || 1;
        currentDebtsFilters = filters;
        
        updateDebtsTable();
        updateDebtsPagination();
        
    } catch (error) {
        console.error('Error loading debts:', error);
        
        // Show specific error message
        const tbody = document.getElementById('debtsTableBody');
        if (tbody) {
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                tbody.innerHTML = `<tr><td colspan="11" class="text-center text-warning">
                    <i class="bi bi-exclamation-triangle"></i> Sesión expirada. 
                    <button class="btn btn-sm btn-primary ms-2" onclick="location.reload()">Recargar página</button>
                </td></tr>`;
            } else {
                tbody.innerHTML = `<tr><td colspan="11" class="text-center text-danger">
                    Error al cargar deudas: ${error.message}
                    <button class="btn btn-sm btn-outline-primary ms-2" onclick="refreshDebts()">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar
                    </button>
                </td></tr>`;
            }
        }
        
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Update debts table
function updateDebtsTable() {
    const tbody = document.getElementById('debtsTableBody');
    if (!tbody) return;
    
    if (currentDebts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center">No se encontraron deudas</td></tr>';
        return;
    }
    
    tbody.innerHTML = currentDebts.map(debt => `
        <tr class="${debt.isOverdue ? 'table-warning' : ''}">
            <td>
                <strong>${debt.student?.firstName} ${debt.student?.lastName}</strong><br>
                <small class="text-muted">${debt.student?.document}</small>
            </td>
            <td>${debt.student?.grade?.name} ${debt.student?.group?.name}</td>
            <td>${debt.invoiceNumber}</td>
            <td>${getConceptText(debt.concept)}</td>
            <td>${formatCurrency(debt.total)}</td>
            <td>${formatCurrency(debt.totalPaid)}</td>
            <td>
                <strong class="${debt.isOverdue ? 'text-danger' : 'text-warning'}">
                    ${formatCurrency(debt.pendingAmount)}
                </strong>
            </td>
            <td>${formatDate(debt.dueDate)}</td>
            <td>
                ${debt.daysOverdue > 0 ? 
                    `<span class="badge bg-danger">${debt.daysOverdue} días</span>` : 
                    '<span class="badge bg-success">Al día</span>'
                }
            </td>
            <td>
                <small>
                    ${debt.student?.phone ? `📱 ${debt.student.phone}<br>` : ''}
                    ${debt.student?.guardianPhone ? `👨‍👩‍👧‍👦 ${debt.student.guardianPhone}` : ''}
                </small>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-success" onclick="createPaymentForDebt('${debt.id}')" title="Registrar Pago">
                        <i class="bi bi-cash-coin"></i>
                    </button>
                    <button class="btn btn-outline-primary" onclick="viewInvoice('${debt.id}')" title="Ver Factura">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-info" onclick="contactDebtor('${debt.student?.phone || debt.student?.guardianPhone}')" title="Contactar">
                        <i class="bi bi-telephone"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update pagination
function updateDebtsPagination() {
    const paginationContainer = document.getElementById('debtsPagination');
    if (!paginationContainer) return;
    
    paginationContainer.innerHTML = generatePagination(currentDebtsPage, totalDebtsPages, 'loadDebtsPage');
}

// Load specific page
function loadDebtsPage(page) {
    if (page >= 1 && page <= totalDebtsPages) {
        loadDebts(page, currentDebtsFilters);
    }
}

// Search debts
function searchDebts() {
    const gradeFilter = document.getElementById('debtGradeFilter')?.value || '';
    const groupFilter = document.getElementById('debtGroupFilter')?.value || '';
    const minAmount = document.getElementById('minAmountFilter')?.value || '';
    const daysOverdue = document.getElementById('daysOverdueFilter')?.value || '';
    
    const filters = {};
    if (gradeFilter) filters.gradeId = gradeFilter;
    if (groupFilter) filters.groupId = groupFilter;
    if (minAmount) filters.minAmount = minAmount;
    if (daysOverdue) filters.daysOverdue = daysOverdue;
    
    loadDebts(1, filters);
}

// Clear filters
function clearDebtFilters() {
    document.getElementById('debtGradeFilter').value = '';
    document.getElementById('debtGroupFilter').value = '';
    document.getElementById('minAmountFilter').value = '';
    document.getElementById('daysOverdueFilter').value = '';
    loadDebts(1, {});
}

// Load debt statistics
async function loadDebtStats() {
    try {
        const stats = await api.getDebtsStats();
        
        // Update stats cards
        if (document.getElementById('totalDebtors')) {
            document.getElementById('totalDebtors').textContent = stats.totalDebtors || 0;
        }
        if (document.getElementById('overdueDebtors')) {
            document.getElementById('overdueDebtors').textContent = stats.overdueDebtors || 0;
        }
        if (document.getElementById('totalDebtAmount')) {
            document.getElementById('totalDebtAmount').textContent = formatCurrency(stats.totalDebtAmount || 0);
        }
        if (document.getElementById('overdueDebtAmount')) {
            document.getElementById('overdueDebtAmount').textContent = formatCurrency(stats.overdueDebtAmount || 0);
        }
        
    } catch (error) {
        console.error('Error loading debt stats:', error);
    }
}

// Create payment for specific debt
function createPaymentForDebt(invoiceId) {
    // This would open the payment modal with the invoice pre-selected
    // For now, show a notification
    showNotification('Función de crear pago desde deuda en desarrollo', 'info');
}

// View invoice details
function viewInvoice(invoiceId) {
    // This would open the invoice modal in view mode
    showNotification('Función de ver factura en desarrollo', 'info');
}

// Contact debtor
function contactDebtor(phone) {
    if (!phone) {
        showNotification('No hay número de teléfono disponible', 'warning');
        return;
    }
    
    // Create WhatsApp link
    const message = encodeURIComponent('Hola, nos comunicamos desde I.E.D. Villas de San Pablo para recordarle sobre el pago pendiente de su factura. ¿Podríamos coordinar el pago?');
    const whatsappUrl = `https://wa.me/57${phone.replace(/\D/g, '')}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
}

// Filter groups by grade for debts
async function filterDebtGroupsByGrade() {
    const gradeId = document.getElementById('debtGradeFilter')?.value;
    const groupFilter = document.getElementById('debtGroupFilter');

    if (!groupFilter) return;

    try {
        if (!gradeId) {
            // If no grade selected, show all groups
            const groups = await api.getGroups();
            groupFilter.innerHTML = '<option value="">Todos los grupos</option>' +
                groups.map(group => `<option value="${group.id}">${group.grade?.name || ''} - ${group.name}</option>`).join('');
        } else {
            // Filter groups by selected grade
            const groups = await api.getGroups({ gradeId });
            groupFilter.innerHTML = '<option value="">Todos los grupos</option>' +
                groups.map(group => `<option value="${group.id}">${group.name}</option>`).join('');
        }
        
        // Clear group filter selection and trigger search
        groupFilter.value = '';
        
    } catch (error) {
        console.error('Error filtering groups:', error);
    }
}

// Refresh debts data
async function refreshDebts() {
    try {
        showLoading();
        await loadDebts(1, {});
        await loadDebtStats();
        showNotification('Datos actualizados correctamente', 'success');
    } catch (error) {
        handleApiError(error);
    } finally {
        hideLoading();
    }
}

// Export debts to CSV
function exportDebts() {
    if (currentDebts.length === 0) {
        showNotification('No hay deudas para exportar', 'warning');
        return;
    }
    
    const headers = ['Estudiante', 'Documento', 'Grado', 'Grupo', 'Factura', 'Concepto', 'Total', 'Pagado', 'Pendiente', 'Vencimiento', 'Días Vencido', 'Teléfono', 'Teléfono Acudiente'];
    const data = [headers];
    
    currentDebts.forEach(debt => {
        data.push([
            `${debt.student?.firstName} ${debt.student?.lastName}`,
            debt.student?.document || '',
            debt.student?.grade?.name || '',
            debt.student?.group?.name || '',
            debt.invoiceNumber,
            getConceptText(debt.concept),
            debt.total,
            debt.totalPaid,
            debt.pendingAmount,
            formatDate(debt.dueDate),
            debt.daysOverdue,
            debt.student?.phone || '',
            debt.student?.guardianPhone || ''
        ]);
    });
    
    exportToCSV(data, 'deudores.csv');
    showNotification('Deudores exportados exitosamente', 'success');
}

// Initialize debts page
function initDebts() {
    // Load initial data
    loadDebts();
    loadDebtStats();
    
    // Load grades and groups for filters
    loadGradesForDebts();
    loadGroupsForDebts();
    
    // Setup filter change handlers
    const gradeFilter = document.getElementById('debtGradeFilter');
    if (gradeFilter) {
        gradeFilter.addEventListener('change', filterDebtGroupsByGrade);
    }
    
    const groupFilter = document.getElementById('debtGroupFilter');
    if (groupFilter) {
        groupFilter.addEventListener('change', searchDebts);
    }
    
    const minAmountFilter = document.getElementById('minAmountFilter');
    if (minAmountFilter) {
        minAmountFilter.addEventListener('input', debounce(searchDebts, 500));
    }
    
    const daysOverdueFilter = document.getElementById('daysOverdueFilter');
    if (daysOverdueFilter) {
        daysOverdueFilter.addEventListener('change', searchDebts);
    }
}

// Load grades for debt filters
async function loadGradesForDebts() {
    try {
        const grades = await api.getGrades();
        const gradeFilter = document.getElementById('debtGradeFilter');
        
        if (gradeFilter) {
            gradeFilter.innerHTML = '<option value="">Todos los grados</option>' +
                grades.map(grade => `<option value="${grade.id}">${grade.name}</option>`).join('');
        }
        
    } catch (error) {
        console.error('Error loading grades for debts:', error);
    }
}

// Load groups for debt filters
async function loadGroupsForDebts() {
    try {
        const groups = await api.getGroups();
        const groupFilter = document.getElementById('debtGroupFilter');
        
        if (groupFilter) {
            groupFilter.innerHTML = '<option value="">Todos los grupos</option>' +
                groups.map(group => `<option value="${group.id}">${group.grade?.name || ''} - ${group.name}</option>`).join('');
        }
        
    } catch (error) {
        console.error('Error loading groups for debts:', error);
    }
}