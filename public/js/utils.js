// Utility Functions

// Show loading spinner
function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'block';
}

// Hide loading spinner
function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

// Show notification
function showNotification(message, type = 'success') {
    Swal.fire({
        icon: type,
        title: type === 'success' ? '¡Éxito!' : type === 'error' ? '¡Error!' : '¡Información!',
        text: message,
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
    });
}

// Show confirmation dialog
async function showConfirmation(title, text, confirmText = 'Sí, continuar') {
    const result = await Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancelar'
    });
    
    return result.isConfirmed;
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format datetime
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get status badge HTML
function getStatusBadge(status, type = 'invoice') {
    const statusConfig = {
        invoice: {
            'PENDING': { class: 'bg-warning', text: 'Pendiente' },
            'PAID': { class: 'bg-success', text: 'Pagada' },
            'PARTIAL': { class: 'bg-info', text: 'Pago Parcial' },
            'OVERDUE': { class: 'bg-danger', text: 'Vencida' },
            'CANCELLED': { class: 'bg-secondary', text: 'Anulada' }
        },
        payment: {
            'PENDING': { class: 'bg-warning', text: 'Pendiente' },
            'COMPLETED': { class: 'bg-success', text: 'Completado' },
            'CANCELLED': { class: 'bg-danger', text: 'Cancelado' },
            'REFUNDED': { class: 'bg-info', text: 'Reembolsado' }
        },
        student: {
            'ACTIVE': { class: 'bg-success', text: 'Activo' },
            'INACTIVE': { class: 'bg-secondary', text: 'Inactivo' },
            'GRADUATED': { class: 'bg-primary', text: 'Graduado' },
            'TRANSFERRED': { class: 'bg-info', text: 'Trasladado' },
            'SUSPENDED': { class: 'bg-danger', text: 'Suspendido' }
        }
    };

    const config = statusConfig[type][status] || { class: 'bg-secondary', text: status };
    return `<span class="badge ${config.class}">${config.text}</span>`;
}

// Get concept text
function getConceptText(concept) {
    const concepts = {
        'TUITION': 'Matrícula',
        'MONTHLY': 'Mensualidad',
        'EVENT': 'Evento Escolar',
        'UNIFORM': 'Uniforme',
        'BOOKS': 'Libros',
        'TRANSPORT': 'Transporte',
        'CAFETERIA': 'Cafetería',
        'OTHER': 'Otro'
    };
    return concepts[concept] || concept;
}

// Get payment method text
function getPaymentMethodText(method) {
    const methods = {
        'CASH': 'Efectivo',
        'BANK_TRANSFER': 'Transferencia',
        'CARD': 'Tarjeta',
        'CHECK': 'Cheque',
        'OTHER': 'Otro'
    };
    return methods[method] || method;
}

// Debounce function
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

// Validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate Colombian document
function isValidDocument(document) {
    return /^\d{6,11}$/.test(document);
}

// Generate pagination HTML
function generatePagination(currentPage, totalPages, onPageClick) {
    if (totalPages <= 1) return '';

    let html = '<nav><ul class="pagination justify-content-center">';
    
    // Previous button
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="${onPageClick}(${currentPage - 1})" aria-label="Anterior">
            <span aria-hidden="true">&laquo;</span>
        </a>
    </li>`;

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        html += `<li class="page-item"><a class="page-link" href="#" onclick="${onPageClick}(1)">1</a></li>`;
        if (startPage > 2) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
            <a class="page-link" href="#" onclick="${onPageClick}(${i})">${i}</a>
        </li>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
        html += `<li class="page-item"><a class="page-link" href="#" onclick="${onPageClick}(${totalPages})">${totalPages}</a></li>`;
    }

    // Next button
    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="${onPageClick}(${currentPage + 1})" aria-label="Siguiente">
            <span aria-hidden="true">&raquo;</span>
        </a>
    </li>`;

    html += '</ul></nav>';
    return html;
}

// Export to CSV
function exportToCSV(data, filename) {
    const csvContent = "data:text/csv;charset=utf-8," 
        + data.map(row => row.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Print element
function printElement(elementId) {
    const element = document.getElementById(elementId);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Imprimir</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { font-family: Arial, sans-serif; }
                    @media print {
                        .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body>
                ${element.innerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Local storage helpers
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function getFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

// Form validation helpers
function validateForm(formElement) {
    const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

// Clear form
function clearForm(formElement) {
    const inputs = formElement.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;
        } else {
            input.value = '';
        }
        input.classList.remove('is-invalid', 'is-valid');
    });
}

// Handle API errors
function handleApiError(error) {
    console.error('API Error:', error);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        showNotification('Sesión expirada. Por favor, inicie sesión nuevamente.', 'error');
        logout();
        return;
    }
    
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
        showNotification('No tiene permisos para realizar esta acción.', 'error');
        return;
    }
    
    if (error.message.includes('404') || error.message.includes('Not Found')) {
        showNotification('Recurso no encontrado.', 'error');
        return;
    }
    
    showNotification(error.message || 'Ha ocurrido un error inesperado.', 'error');
}