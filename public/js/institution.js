/**
 * Institution Management
 * Gestión de configuración institucional
 */

let institutionData = null;

// Initialize institution management
function initInstitution() {
    loadInstitutionData();
    bindInstitutionEvents();
}

// Load institution data
async function loadInstitutionData() {
    try {
        showLoading(true);
        
        institutionData = await api.getInstitution();
        
        if (institutionData) {
            populateInstitutionForm(institutionData);
        } else {
            // Si no hay datos, mostrar formulario vacío
            console.log('No hay datos institucionales, mostrando formulario vacío');
        }
        
    } catch (error) {
        console.error('Error loading institution data:', error);
        
        if (error.status === 404) {
            // No hay datos institucionales aún
            showNotification('No hay configuración institucional. Complete el formulario.', 'info');
        } else {
            handleApiError(error);
        }
    } finally {
        showLoading(false);
    }
}

// Populate institution form
function populateInstitutionForm(data) {
    const form = document.getElementById('institutionForm');
    if (!form) return;
    
    // Información básica
    setFormValue('name', data.name);
    setFormValue('nit', data.nit);
    setFormValue('dane', data.dane);
    
    // Ubicación
    setFormValue('address', data.address);
    setFormValue('city', data.city);
    setFormValue('state', data.state);
    setFormValue('locality', data.locality);
    
    // Contacto
    setFormValue('phone', data.phone);
    setFormValue('email', data.email);
    
    // Información académica
    setFormValue('resolution', data.resolution);
    setFormValue('levels', data.levels);
    setFormValue('title', data.title);
    setFormValue('calendar', data.calendar);
    setFormValue('schedule', data.schedule);
    
    // Logo (si existe)
    if (data.logo) {
        const logoPreview = document.getElementById('logoPreview');
        if (logoPreview) {
            logoPreview.src = data.logo;
            logoPreview.style.display = 'block';
        }
    }
}

// Set form value helper
function setFormValue(fieldName, value) {
    const field = document.getElementById(fieldName);
    if (field && value !== null && value !== undefined) {
        field.value = value;
    }
}

// Bind institution events
function bindInstitutionEvents() {
    // Form submission
    const form = document.getElementById('institutionForm');
    if (form) {
        form.addEventListener('submit', handleInstitutionSubmit);
    }
    
    // Logo upload
    const logoInput = document.getElementById('logoInput');
    if (logoInput) {
        logoInput.addEventListener('change', handleLogoUpload);
    }
    
    // Reset form
    const resetBtn = document.getElementById('resetInstitutionForm');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetInstitutionForm);
    }
}

// Handle institution form submission
async function handleInstitutionSubmit(event) {
    event.preventDefault();
    
    try {
        showLoading(true);
        
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        // Validar campos requeridos
        const requiredFields = ['name', 'nit', 'address', 'city', 'phone', 'email'];
        const missingFields = requiredFields.filter(field => !data[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
        }
        
        // Validar formato de email
        if (data.email && !isValidEmail(data.email)) {
            throw new Error('Formato de email inválido');
        }
        
        // Validar NIT
        if (data.nit && !isValidNIT(data.nit)) {
            throw new Error('Formato de NIT inválido');
        }
        
        const result = await api.updateInstitution(data);
        
        institutionData = result;
        
        showNotification('Configuración institucional actualizada exitosamente', 'success');
        
        // Actualizar vista si es necesario
        updateInstitutionDisplay(result);
        
    } catch (error) {
        console.error('Error updating institution:', error);
        showNotification(error.message || 'Error al actualizar configuración', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle logo upload
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('Solo se permiten archivos de imagen (JPG, PNG, GIF)', 'error');
        event.target.value = '';
        return;
    }
    
    // Validar tamaño (máximo 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
        showNotification('El archivo es demasiado grande. Máximo 2MB', 'error');
        event.target.value = '';
        return;
    }
    
    // Mostrar preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('logoPreview');
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}

// Reset institution form
function resetInstitutionForm() {
    if (confirm('¿Está seguro de que desea restablecer el formulario?')) {
        const form = document.getElementById('institutionForm');
        if (form) {
            form.reset();
            
            // Limpiar preview del logo
            const logoPreview = document.getElementById('logoPreview');
            if (logoPreview) {
                logoPreview.style.display = 'none';
                logoPreview.src = '';
            }
            
            // Recargar datos originales si existen
            if (institutionData) {
                populateInstitutionForm(institutionData);
            }
        }
    }
}

// Update institution display in other parts of the app
function updateInstitutionDisplay(data) {
    // Actualizar nombre en sidebar si existe
    const sidebarTitle = document.querySelector('.sidebar-title');
    if (sidebarTitle && data.name) {
        // Usar nombre corto para el sidebar
        const shortName = data.name.length > 20 
            ? data.name.substring(0, 20) + '...' 
            : data.name;
        sidebarTitle.textContent = shortName;
    }
    
    // Actualizar título de la página
    if (data.name) {
        document.title = `${data.name} - Sistema de Gestión`;
    }
    
    // Actualizar otros elementos que muestren info institucional
    updateInstitutionElements(data);
}

// Update institution elements throughout the app
function updateInstitutionElements(data) {
    // Actualizar elementos con clase 'institution-name'
    document.querySelectorAll('.institution-name').forEach(element => {
        element.textContent = data.name || 'Institución Educativa';
    });
    
    // Actualizar elementos con clase 'institution-nit'
    document.querySelectorAll('.institution-nit').forEach(element => {
        element.textContent = data.nit || '';
    });
    
    // Actualizar elementos con clase 'institution-address'
    document.querySelectorAll('.institution-address').forEach(element => {
        element.textContent = data.address || '';
    });
    
    // Actualizar elementos con clase 'institution-phone'
    document.querySelectorAll('.institution-phone').forEach(element => {
        element.textContent = data.phone || '';
    });
    
    // Actualizar elementos con clase 'institution-email'
    document.querySelectorAll('.institution-email').forEach(element => {
        element.textContent = data.email || '';
    });
}

// Validation helpers
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidNIT(nit) {
    // Validación básica de NIT colombiano
    const nitRegex = /^\d{9}-\d{1}$/;
    return nitRegex.test(nit);
}

// Get institution data for other modules
function getInstitutionData() {
    return institutionData;
}

// Export functions for global use
window.institutionManager = {
    init: initInstitution,
    load: loadInstitutionData,
    getData: getInstitutionData,
    update: updateInstitutionDisplay
};