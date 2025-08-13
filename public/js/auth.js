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
    
    // Load dashboard content
    if (typeof loadPage === 'function') {
        loadPage('dashboard');
    }
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
});