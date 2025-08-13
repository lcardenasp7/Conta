/**
 * Modal Accessibility Helper
 * Mejora la accesibilidad de todos los modales Bootstrap
 */

// Función para mejorar la accesibilidad de modales
function enhanceModalAccessibility(modalElement) {
    if (!modalElement) return;

    // Manejar eventos de apertura
    modalElement.addEventListener('show.bs.modal', function () {
        // Remover aria-hidden antes de mostrar
        modalElement.removeAttribute('aria-hidden');
    });

    modalElement.addEventListener('shown.bs.modal', function () {
        // Enfocar el primer elemento focuseable
        setTimeout(() => {
            const focusableElements = modalElement.querySelectorAll(
                'input:not([disabled]):not([type="hidden"]), ' +
                'select:not([disabled]), ' +
                'textarea:not([disabled]), ' +
                'button:not([disabled]), ' +
                '[tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }, 100);
    });

    modalElement.addEventListener('hidden.bs.modal', function () {
        // Restaurar aria-hidden cuando se oculta
        modalElement.setAttribute('aria-hidden', 'true');
    });

    // Manejar navegación con teclado
    modalElement.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        }
        
        // Trap focus dentro del modal
        if (e.key === 'Tab') {
            const focusableElements = modalElement.querySelectorAll(
                'input:not([disabled]):not([type="hidden"]), ' +
                'select:not([disabled]), ' +
                'textarea:not([disabled]), ' +
                'button:not([disabled]), ' +
                '[tabindex]:not([tabindex="-1"])'
            );
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    });
}

// Función para inicializar accesibilidad en todos los modales
function initializeModalAccessibility() {
    // Buscar todos los modales existentes
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        enhanceModalAccessibility(modal);
    });

    // Observer para modales creados dinámicamente
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    if (node.classList && node.classList.contains('modal')) {
                        enhanceModalAccessibility(node);
                    }
                    
                    // Buscar modales dentro del nodo agregado
                    const childModals = node.querySelectorAll && node.querySelectorAll('.modal');
                    if (childModals) {
                        childModals.forEach(modal => {
                            enhanceModalAccessibility(modal);
                        });
                    }
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Función para crear modales accesibles
function createAccessibleModal(modalId, title, content, options = {}) {
    const modalHtml = `
        <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
            <div class="modal-dialog ${options.size || ''}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="${modalId}Label">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
                </div>
            </div>
        </div>
    `;

    // Crear elemento
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHtml;
    const modalElement = tempDiv.firstElementChild;

    // Agregar al DOM
    document.body.appendChild(modalElement);

    // Mejorar accesibilidad
    enhanceModalAccessibility(modalElement);

    return modalElement;
}

// Función para mostrar modal de forma accesible
function showAccessibleModal(modalElement) {
    if (!modalElement) return;

    // Remover aria-hidden antes de mostrar
    modalElement.removeAttribute('aria-hidden');
    
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    return modal;
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModalAccessibility);
} else {
    initializeModalAccessibility();
}

// Exportar funciones
window.enhanceModalAccessibility = enhanceModalAccessibility;
window.createAccessibleModal = createAccessibleModal;
window.showAccessibleModal = showAccessibleModal;
window.initializeModalAccessibility = initializeModalAccessibility;