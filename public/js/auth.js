// Authentication Management

// Check if user is authenticated
function isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return token && user;
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Login function
async function login(email, password) {
    try {
        const response = await api.login(email, password);
        
        if (response.token && response.user) {
            // Store token and user data
            api.setToken(response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            
            // NUEVO: Iniciar timer de inactividad
            resetInactivityTimer();
            
            // Show success message
            showNotification('¡Bienvenido al sistema!', 'success');
            
            // Redirect to dashboard
            showDashboard();
            
            return true;
        } else {
            throw new Error('Respuesta de login inválida');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'Error al iniciar sesión', 'error');
        return false;
    }
}

// Logout function
async function logout() {
    try {
        // Call logout endpoint if available
        if (api.token) {
            await api.logout().catch(() => {
                // Ignore logout API errors
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // NUEVO: Limpiar timers
        clearTimeout(inactivityTimer);
        clearInterval(sessionDisplayTimer);
        
        // Ocultar indicador de sesión
        const sessionIndicator = document.getElementById('sessionIndicator');
        if (sessionIndicator) {
            sessionIndicator.classList.add('d-none');
        }
        
        // Clear local storage
        api.removeToken();
        localStorage.removeItem('user');
        
        // Show login screen
        showLogin();
        
        showNotification('Sesión cerrada correctamente', 'info');
    }
}

// Show login screen
function showLogin() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('mainContainer').classList.add('d-none');
    
    // Clear any existing form data
    document.getElementById('loginForm').reset();
}

// Show dashboard
function showDashboard() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContainer').classList.remove('d-none');
    
    // Clear any hash from URL
    if (window.location.hash) {
        history.replaceState(null, null, window.location.pathname + window.location.search);
    }
    
    // Update user name in navbar
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.name;
    }
    
    // NUEVO: Forzar actualización de la interfaz con múltiples intentos
    let attempts = 0;
    const maxAttempts = 3;
    
    const enableNavigationWithRetry = () => {
        attempts++;
        console.log(`🔧 Intento ${attempts} de activar navegación...`);
        
        // Activar menús y botones
        enableNavigation();
        
        // Verificar si la navegación está funcionando
        const testElement = document.querySelector('.menu-item[data-page]');
        if (testElement && testElement.style.pointerEvents !== 'none' && attempts < maxAttempts) {
            console.log('✅ Navegación activada correctamente');
        } else if (attempts < maxAttempts) {
            console.log('⚠️ Reintentando activación de navegación...');
            setTimeout(enableNavigationWithRetry, 200);
            return;
        }
        
        // Load dashboard content
        if (typeof loadPage === 'function') {
            loadPage('dashboard');
        }
        
        // Forzar re-render de elementos
        document.body.style.display = 'none';
        document.body.offsetHeight; // Trigger reflow
        document.body.style.display = '';
        
        console.log('🎉 Dashboard cargado y navegación activada');
    };
    
    setTimeout(enableNavigationWithRetry, 100);
}

// Initialize authentication
function initAuth() {
    // Check if user is already authenticated
    if (isAuthenticated()) {
        showDashboard();
    } else {
        showLogin();
    }
    
    // Setup login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                showNotification('Por favor complete todos los campos', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showNotification('Por favor ingrese un email válido', 'error');
                return;
            }
            
            await login(email, password);
        });
    }
}

// Check user permissions
function hasPermission(permission) {
    const user = getCurrentUser();
    if (!user) return false;
    
    // Define role permissions
    const rolePermissions = {
        'RECTOR': ['*'], // All permissions
        'ADMIN': ['*'], // All permissions
        'SECRETARY': ['students', 'invoices', 'payments', 'events'],
        'TEACHER': ['students', 'events'],
        'AUXILIARY_ACCOUNTANT': ['invoices', 'payments'],
        'ACCOUNTANT': ['invoices', 'payments', 'accounting', 'reports']
    };
    
    const userPermissions = rolePermissions[user.role] || [];
    
    // Check if user has all permissions or specific permission
    return userPermissions.includes('*') || userPermissions.includes(permission);
}

// Require permission for actions
function requirePermission(permission, callback) {
    if (hasPermission(permission)) {
        callback();
    } else {
        showNotification('No tiene permisos para realizar esta acción', 'error');
    }
}

// NUEVO: Activar navegación después del login
function enableNavigation() {
    console.log('🔧 Activando navegación...');
    
    // Activar todos los enlaces de navegación
    const navLinks = document.querySelectorAll('.nav-link, .navbar-nav a, .btn, .menu-item, .submenu-item');
    navLinks.forEach(link => {
        link.style.pointerEvents = 'auto';
        link.classList.remove('disabled');
        link.removeAttribute('disabled');
    });
    
    // Activar menús desplegables
    const dropdowns = document.querySelectorAll('.dropdown-toggle');
    dropdowns.forEach(dropdown => {
        dropdown.removeAttribute('disabled');
        dropdown.style.pointerEvents = 'auto';
    });
    
    // Activar elementos del sidebar
    const sidebarElements = document.querySelectorAll('.sidebar .menu-item, .sidebar .submenu-item');
    sidebarElements.forEach(element => {
        element.style.pointerEvents = 'auto';
        element.classList.remove('disabled');
        element.removeAttribute('disabled');
    });
    
    // Re-establecer event listeners de navegación
    setupNavigationEventListeners();
    
    // Forzar actualización de Bootstrap components
    if (typeof bootstrap !== 'undefined') {
        // Re-inicializar tooltips y popovers
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    console.log('✅ Navegación activada');
}

// NUEVO: Re-establecer event listeners de navegación
function setupNavigationEventListeners() {
    // Event listeners para elementos del menú
    const menuItems = document.querySelectorAll('[data-page]');
    menuItems.forEach(item => {
        // Remover listeners existentes
        item.removeEventListener('click', handleMenuClick);
        // Agregar nuevos listeners
        item.addEventListener('click', handleMenuClick);
    });
}

// NUEVO: Manejar clicks del menú
function handleMenuClick(e) {
    e.preventDefault();
    const pageName = e.currentTarget.getAttribute('data-page');
    if (pageName && typeof loadPage === 'function') {
        loadPage(pageName);
    }
}

// NUEVO: Sistema de timeout por inactividad
let inactivityTimer;
let sessionDisplayTimer;
let sessionStartTime;
let sessionTimeout = 30 * 60 * 1000; // 30 minutos en milisegundos
let warningTimeout = 25 * 60 * 1000; // 25 minutos para mostrar advertencia

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    
    if (isAuthenticated()) {
        // NUEVO: Reiniciar tiempo de sesión
        sessionStartTime = Date.now();
        updateSessionDisplay();
        
        // Timer para mostrar advertencia
        setTimeout(() => {
            if (isAuthenticated()) {
                showSessionWarning();
            }
        }, warningTimeout);
        
        // Timer para cerrar sesión
        inactivityTimer = setTimeout(() => {
            if (isAuthenticated()) {
                showNotification('Sesión cerrada por inactividad', 'warning');
                logout();
            }
        }, sessionTimeout);
    }
}

// NUEVO: Actualizar display del tiempo de sesión
function updateSessionDisplay() {
    const sessionIndicator = document.getElementById('sessionIndicator');
    const sessionTimer = document.getElementById('sessionTimer');
    
    if (!sessionIndicator || !sessionTimer || !isAuthenticated()) {
        return;
    }
    
    // Mostrar indicador
    sessionIndicator.classList.remove('d-none');
    
    // Limpiar timer anterior
    clearInterval(sessionDisplayTimer);
    
    // Actualizar cada segundo
    sessionDisplayTimer = setInterval(() => {
        if (!isAuthenticated()) {
            clearInterval(sessionDisplayTimer);
            sessionIndicator.classList.add('d-none');
            return;
        }
        
        const elapsed = Date.now() - sessionStartTime;
        const remaining = Math.max(0, sessionTimeout - elapsed);
        
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        sessionTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Cambiar color según tiempo restante
        if (remaining < 5 * 60 * 1000) { // Menos de 5 minutos
            sessionTimer.className = 'text-danger fw-bold';
        } else if (remaining < 10 * 60 * 1000) { // Menos de 10 minutos
            sessionTimer.className = 'text-warning';
        } else {
            sessionTimer.className = 'text-muted';
        }
        
        if (remaining <= 0) {
            clearInterval(sessionDisplayTimer);
        }
    }, 1000);
}

// NUEVO: Extender sesión manualmente
function extendSession() {
    if (isAuthenticated()) {
        resetInactivityTimer();
        showNotification('Sesión extendida por 30 minutos más', 'success');
    }
}

// NUEVO: Mostrar advertencia de sesión
function showSessionWarning() {
    const remainingTime = Math.ceil((sessionTimeout - warningTimeout) / 1000 / 60); // minutos restantes
    
    if (confirm(`Su sesión expirará en ${remainingTime} minutos por inactividad. ¿Desea continuar?`)) {
        // Usuario quiere continuar, reiniciar timer
        resetInactivityTimer();
        showNotification('Sesión extendida', 'success');
    } else {
        // Usuario no responde o cancela, cerrar sesión
        logout();
    }
}

// NUEVO: Detectar actividad del usuario
function setupActivityDetection() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
        document.addEventListener(event, () => {
            if (isAuthenticated()) {
                resetInactivityTimer();
            }
        }, true);
    });
}

// Auto-logout on token expiration
function setupAutoLogout() {
    // Check token validity every 5 minutes
    setInterval(async () => {
        if (isAuthenticated()) {
            try {
                // Try to make a simple API call to check if token is still valid
                await api.getDashboardStats();
            } catch (error) {
                if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                    showNotification('Su sesión ha expirado', 'warning');
                    logout();
                }
            }
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    setupAutoLogout();
    setupActivityDetection(); // NUEVO: Detectar actividad del usuario
    
    // NUEVO: Iniciar timer de inactividad si ya está autenticado
    if (isAuthenticated()) {
        resetInactivityTimer();
    }
});