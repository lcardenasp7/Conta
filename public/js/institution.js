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
        const logoPreviewSmall = document.getElementById('logoPreviewSmall');
        const logoPlaceholder = document.getElementById('logoPlaceholder');
        const logoActions = document.getElementById('logoActions');

        if (logoPreview) {
            logoPreview.src = data.logo;
            logoPreview.style.display = 'block';
        }
        if (logoPreviewSmall) {
            logoPreviewSmall.src = data.logo;
            logoPreviewSmall.style.display = 'block';
        }
        if (logoPlaceholder) logoPlaceholder.style.display = 'none';
        if (logoActions) logoActions.style.display = 'block';
    }

    // Update preview
    updateInstitutionPreview(data);
}

// Set form value helper
function setFormValue(fieldName, value) {
    const field = document.getElementById('institution' + fieldName.charAt(0).toUpperCase() + fieldName.slice(1));
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
async function handleLogoUpload(event) {
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
    
    try {
        showLoading(true);
        
        // Crear FormData para el upload
        const formData = new FormData();
        formData.append('logo', file);
        
        // Subir logo usando fetch directo
        const token = localStorage.getItem('token');
        const response = await fetch('/api/institution/logo', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Mostrar preview
        const preview = document.getElementById('logoPreview');
        const previewSmall = document.getElementById('logoPreviewSmall');
        const placeholder = document.getElementById('logoPlaceholder');
        const actions = document.getElementById('logoActions');

        if (preview) {
            preview.src = result.logoPath;
            preview.style.display = 'block';
        }
        if (previewSmall) {
            previewSmall.src = result.logoPath;
            previewSmall.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
        if (actions) actions.style.display = 'block';
        
        // Actualizar datos institucionales
        if (institutionData) {
            institutionData.logo = result.logoPath;
        }
        
        showNotification('Logo cargado exitosamente', 'success');
        
        // Actualizar logo en toda la aplicación
        updateInstitutionLogo(result.logoPath);
        
    } catch (error) {
        console.error('Error uploading logo:', error);
        showNotification('Error al cargar el logo: ' + error.message, 'error');
        event.target.value = '';
    } finally {
        showLoading(false);
    }
}

// Update logo throughout the application
function updateInstitutionLogo(logoPath) {
    // Update all logo elements in the app
    document.querySelectorAll('.institution-logo').forEach(element => {
        element.src = logoPath;
        element.style.display = 'block';
    });
    
    // Update sidebar logo if exists
    const sidebarLogo = document.querySelector('.sidebar-logo');
    if (sidebarLogo) {
        sidebarLogo.src = logoPath;
        sidebarLogo.style.display = 'block';
    }
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

// Save institution data
async function saveInstitutionData() {
    const form = document.getElementById('institutionForm');
    if (!form) return;

    try {
        showLoading(true);

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Validate required fields
        const requiredFields = ['name', 'nit', 'address', 'city', 'phone', 'email'];
        const missingFields = requiredFields.filter(field => !data[field]);

        if (missingFields.length > 0) {
            throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
        }

        // Validate email format
        if (data.email && !isValidEmail(data.email)) {
            throw new Error('Formato de email inválido');
        }

        const result = await api.updateInstitution(data);
        institutionData = result;

        showNotification('Configuración institucional guardada exitosamente', 'success');
        updateInstitutionPreview(result);

    } catch (error) {
        console.error('Error saving institution:', error);
        showNotification(error.message || 'Error al guardar configuración', 'error');
    } finally {
        showLoading(false);
    }
}

// Delete logo
async function deleteLogo() {
    if (!confirm('¿Está seguro de que desea eliminar el logo?')) {
        return;
    }

    try {
        showLoading(true);

        await api.deleteLogo();

        // Clear logo preview
        const logoPreview = document.getElementById('logoPreview');
        const logoPlaceholder = document.getElementById('logoPlaceholder');
        const logoActions = document.getElementById('logoActions');

        if (logoPreview) {
            logoPreview.style.display = 'none';
            logoPreview.src = '';
        }
        if (logoPlaceholder) logoPlaceholder.style.display = 'block';
        if (logoActions) logoActions.style.display = 'none';

        // Update institution data
        if (institutionData) {
            institutionData.logo = null;
        }

        showNotification('Logo eliminado exitosamente', 'success');

    } catch (error) {
        console.error('Error deleting logo:', error);
        showNotification('Error al eliminar el logo: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Update institution preview
function updateInstitutionPreview(data) {
    const previewName = document.getElementById('previewName');
    const previewNit = document.getElementById('previewNit');

    if (previewName) previewName.textContent = data.name || 'Nombre de la Institución';
    if (previewNit) previewNit.textContent = `NIT: ${data.nit || '000000000-0'}`;
}

// Export functions for global use
window.institutionManager = {
    init: initInstitution,
    load: loadInstitutionData,
    getData: getInstitutionData,
    update: updateInstitutionDisplay
};

// Show logo history
async function showLogoHistory() {
    try {
        showLoading(true);
        
        const response = await fetch('/api/institution/logo/history', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener historial');
        }

        const data = await response.json();
        
        if (data.backups.length === 0) {
            showNotification('No hay logos anteriores guardados', 'info');
            return;
        }

        // Create modal content
        const backupsHtml = data.backups.map(backup => `
            <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                <div>
                    <strong>${backup.createdAt.toLocaleString()}</strong><br>
                    <small class="text-muted">${backup.sizeFormatted}</small>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="previewLogo('${backup.path}')">
                        <i class="bi bi-eye"></i> Ver
                    </button>
                    <button class="btn btn-sm btn-success" onclick="restoreLogo('${backup.filename}')">
                        <i class="bi bi-arrow-clockwise"></i> Restaurar
                    </button>
                </div>
            </div>
        `).join('');

        await Swal.fire({
            title: 'Historial de Logos',
            html: `
                <div class="text-start">
                    <p class="text-muted mb-3">Logos anteriores guardados automáticamente:</p>
                    ${backupsHtml}
                </div>
            `,
            width: '600px',
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Cerrar'
        });

    } catch (error) {
        console.error('Error showing logo history:', error);
        showNotification('Error al mostrar historial: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Preview logo
function previewLogo(logoPath) {
    Swal.fire({
        title: 'Vista Previa del Logo',
        imageUrl: logoPath,
        imageWidth: 300,
        imageHeight: 300,
        imageAlt: 'Logo anterior',
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Cerrar'
    });
}

// Restore logo
async function restoreLogo(filename) {
    const result = await Swal.fire({
        title: '¿Restaurar este logo?',
        text: 'El logo actual será reemplazado por este logo anterior',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, restaurar',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
        showLoading(true);

        const response = await fetch(`/api/institution/logo/restore/${filename}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al restaurar logo');
        }

        const data = await response.json();
        
        // Update preview
        const logoPreview = document.getElementById('logoPreview');
        const logoPreviewSmall = document.getElementById('logoPreviewSmall');
        
        if (logoPreview) {
            logoPreview.src = data.logoPath + '?t=' + Date.now(); // Cache bust
            logoPreview.style.display = 'block';
        }
        if (logoPreviewSmall) {
            logoPreviewSmall.src = data.logoPath + '?t=' + Date.now();
            logoPreviewSmall.style.display = 'block';
        }

        showNotification('Logo restaurado exitosamente', 'success');
        
        // Close any open modals
        Swal.close();

    } catch (error) {
        console.error('Error restoring logo:', error);
        showNotification('Error al restaurar logo: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Export individual functions for global access
window.initInstitution = initInstitution;
window.saveInstitutionData = saveInstitutionData;
window.deleteLogo = deleteLogo;
window.resetInstitutionForm = resetInstitutionForm;
window.showLogoHistory = showLogoHistory;
window.previewLogo = previewLogo;
window.restoreLogo = restoreLogo;