/**
 * Reset Password Functionality
 * Maneja el flujo completo de restablecimiento de contraseña
 */

class PasswordReset {
    constructor() {
        this.currentStep = 1;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkTokenFromURL();
    }

    bindEvents() {
        // Form submissions
        document.getElementById('requestResetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.requestReset();
        });

        document.getElementById('resetPasswordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.resetPassword();
        });

        // Password visibility toggles
        document.getElementById('togglePassword').addEventListener('click', () => {
            this.togglePasswordVisibility('password', 'togglePassword');
        });

        document.getElementById('toggleConfirmPassword').addEventListener('click', () => {
            this.togglePasswordVisibility('confirmPassword', 'toggleConfirmPassword');
        });

        // Password confirmation validation
        document.getElementById('confirmPassword').addEventListener('input', () => {
            this.validatePasswordMatch();
        });
    }

    checkTokenFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
            this.verifyToken(token);
        }
    }

    async verifyToken(token) {
        try {
            this.showLoading(true);
            
            const response = await fetch(`/api/password/verify-token/${token}`);
            const data = await response.json();
            
            if (response.ok && data.valid) {
                document.getElementById('resetToken').value = token;
                this.showStep(3);
            } else {
                document.getElementById('errorMessage').textContent = 
                    data.error || 'El enlace de restablecimiento es inválido o ha expirado.';
                this.showStep(5);
            }
        } catch (error) {
            console.error('Error verificando token:', error);
            document.getElementById('errorMessage').textContent = 
                'Error de conexión. Por favor, intenta más tarde.';
            this.showStep(5);
        } finally {
            this.showLoading(false);
        }
    }

    async requestReset() {
        try {
            this.showLoading(true);
            
            const formData = new FormData(document.getElementById('requestResetForm'));
            const email = formData.get('email');

            const response = await fetch('/api/password/request-reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                this.showStep(2);
            } else {
                this.showError(data.error || 'Error al procesar la solicitud');
            }
        } catch (error) {
            console.error('Error solicitando reset:', error);
            this.showError('Error de conexión. Por favor, intenta más tarde.');
        } finally {
            this.showLoading(false);
        }
    }

    async resetPassword() {
        try {
            // Validar que las contraseñas coincidan
            if (!this.validatePasswordMatch()) {
                return;
            }

            this.showLoading(true);
            
            const formData = new FormData(document.getElementById('resetPasswordForm'));
            const resetData = {
                token: formData.get('token'),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword')
            };

            const response = await fetch('/api/password/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(resetData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showStep(4);
            } else {
                this.showError(data.error || 'Error al actualizar la contraseña');
            }
        } catch (error) {
            console.error('Error reseteando contraseña:', error);
            this.showError('Error de conexión. Por favor, intenta más tarde.');
        } finally {
            this.showLoading(false);
        }
    }

    validatePasswordMatch() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const confirmInput = document.getElementById('confirmPassword');

        if (password !== confirmPassword) {
            confirmInput.setCustomValidity('Las contraseñas no coinciden');
            confirmInput.classList.add('is-invalid');
            return false;
        } else {
            confirmInput.setCustomValidity('');
            confirmInput.classList.remove('is-invalid');
            confirmInput.classList.add('is-valid');
            return true;
        }
    }

    togglePasswordVisibility(inputId, buttonId) {
        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'bi bi-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'bi bi-eye';
        }
    }

    showStep(stepNumber) {
        // Ocultar todos los pasos
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });

        // Mostrar el paso actual
        document.getElementById(`step${stepNumber}`).classList.add('active');
        this.currentStep = stepNumber;
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        spinner.style.display = show ? 'block' : 'none';
    }

    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            confirmButtonColor: '#667eea'
        });
    }

    showSuccess(message) {
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: message,
            confirmButtonColor: '#667eea'
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new PasswordReset();
});

// Función global para mostrar pasos (usada en HTML)
function showStep(stepNumber) {
    if (window.passwordReset) {
        window.passwordReset.showStep(stepNumber);
    }
}

// Hacer disponible globalmente
window.passwordReset = new PasswordReset();