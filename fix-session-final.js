const fs = require('fs');
const path = require('path');

console.log('🔧 Aplicando correcciones finales de sesión...');

// 1. Verificar y corregir auth.js
console.log('📝 Verificando auth.js...');

const authPath = 'public/js/auth.js';
let authContent = fs.readFileSync(authPath, 'utf8');

// Verificar si ya tiene las mejoras
if (!authContent.includes('sessionDisplayTimer')) {
    console.log('⚠️ auth.js no tiene las mejoras, aplicando...');
    
    // Aplicar todas las mejoras de sesión
    const authFixed = `// Authentication Management

// NUEVO: Variables para gestión de sesión
let inactivityTimer;
let sessionDisplayTimer;
let sessionStartTime;
let sessionTimeout = 30 * 60 * 1000; // 30 minutos en milisegundos
let warningTimeout = 25 * 60 * 1000; // 25 minutos para mostrar advertencia

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

// NUEVO: Activar navegación después del login
function enableNavigation() {
    // Activar todos los enlaces de navegación
    const navLinks = document.querySelectorAll('.nav-link, .navbar-nav a, .btn');
    navLinks.forEach(link => {
        link.style.pointerEvents = 'auto';
        link.classList.remove('disabled');
    });
    
    // Activar menús desplegables
    const dropdowns = document.querySelectorAll('.dropdown-toggle');
    dropdowns.forEach(dropdown => {
        dropdown.removeAttribute('disabled');
    });
    
    // Forzar actualización de Bootstrap components
    if (typeof bootstrap !== 'undefined') {
        // Re-inicializar tooltips y popovers
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
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
        
        sessionTimer.textContent = \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
        
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

// NUEVO: Mostrar advertencia de sesión
function showSessionWarning() {
    const remainingTime = Math.ceil((sessionTimeout - warningTimeout) / 1000 / 60); // minutos restantes
    
    if (confirm(\`Su sesión expirará en \${remainingTime} minutos por inactividad. ¿Desea continuar?\`)) {
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
    
    // NUEVO: Forzar actualización de la interfaz
    setTimeout(() => {
        // Activar menús y botones
        enableNavigation();
        
        // Load dashboard content
        if (typeof loadPage === 'function') {
            loadPage('dashboard');
        }
        
        // Forzar re-render de elementos
        document.body.style.display = 'none';
        document.body.offsetHeight; // Trigger reflow
        document.body.style.display = '';
    }, 100);
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
});`;

    fs.writeFileSync(authPath, authFixed, 'utf8');
    console.log('✅ auth.js actualizado con mejoras de sesión');
} else {
    console.log('✅ auth.js ya tiene las mejoras aplicadas');
}

// 2. Verificar y corregir index.html
console.log('📝 Verificando index.html...');

const indexPath = 'public/index.html';
let indexContent = fs.readFileSync(indexPath, 'utf8');

if (!indexContent.includes('sessionIndicator')) {
    console.log('⚠️ index.html no tiene el indicador de sesión, aplicando...');
    
    // Buscar y reemplazar la sección del navbar
    const oldNavbar = `                <div class="d-flex align-items-center gap-3">
                    <div class="dropdown">
                        <button class="btn btn-link dropdown-toggle" data-bs-toggle="dropdown">
                            <i class="bi bi-person-circle"></i>
                            <span id="userName">Usuario</span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="#" onclick="logout()">
                                <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
                            </a></li>
                        </ul>
                    </div>
                </div>`;

    const newNavbar = `                <div class="d-flex align-items-center gap-3">
                    <!-- NUEVO: Indicador de tiempo de sesión -->
                    <div id="sessionIndicator" class="d-none">
                        <small class="text-muted">
                            <i class="bi bi-clock"></i>
                            <span id="sessionTimer">30:00</span>
                        </small>
                    </div>
                    
                    <div class="dropdown">
                        <button class="btn btn-link dropdown-toggle" data-bs-toggle="dropdown">
                            <i class="bi bi-person-circle"></i>
                            <span id="userName">Usuario</span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="#" onclick="extendSession()">
                                <i class="bi bi-clock-history"></i> Extender Sesión
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="#" onclick="logout()">
                                <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
                            </a></li>
                        </ul>
                    </div>
                </div>`;

    indexContent = indexContent.replace(oldNavbar, newNavbar);
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    console.log('✅ index.html actualizado con indicador de sesión');
} else {
    console.log('✅ index.html ya tiene el indicador de sesión');
}

console.log('\n🎉 ¡Correcciones de sesión aplicadas exitosamente!');
console.log('\n📋 Mejoras aplicadas:');
console.log('✅ Fix del problema de refresh después del login');
console.log('✅ Timeout de sesión por inactividad (30 minutos)');
console.log('✅ Advertencia a los 25 minutos');
console.log('✅ Indicador visual del tiempo restante');
console.log('✅ Opción para extender sesión manualmente');
console.log('✅ Detección de actividad del usuario');

console.log('\n🚀 Próximos pasos:');
console.log('1. Hacer commit y push de los cambios');
console.log('2. Hacer redeploy en Railway');
console.log('3. Probar el sistema con las mejoras');

console.log('\n⏰ Configuración de tiempo:');
console.log('- Sesión total: 30 minutos');
console.log('- Advertencia: 25 minutos');
console.log('- Tiempo crítico (rojo): últimos 5 minutos');
console.log('- Tiempo de advertencia (amarillo): últimos 10 minutos');