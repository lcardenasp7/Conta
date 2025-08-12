// Test básico del módulo de eventos
console.log('🎯 Testing Events Module...');

// Variables globales
let eventsData = [];
let eventsCurrentGrades = [];
let eventsCurrentGroups = [];

// Función de inicialización básica
async function initEvents() {
    try {
        console.log('🎯 Initializing Events Module...');
        
        // Cargar el template principal de eventos
        await loadEventsMainTemplate();
        
        console.log('✅ Events module initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing events module:', error);
    }
}

// Función para cargar template principal
async function loadEventsMainTemplate() {
    const contentArea = document.getElementById('contentArea');
    
    if (contentArea) {
        contentArea.innerHTML = `
            <div id="events-main-content">
                <h2>Gestión de Eventos Escolares</h2>
                <p>Módulo de eventos cargado correctamente</p>
            </div>
        `;
    }
}

// Función para mostrar modal de creación
function showCreateEventModal() {
    console.log('🎯 Opening create event modal...');
    alert('Modal de creación de eventos');
}

// Exponer funciones globalmente
window.initEvents = initEvents;
window.showCreateEventModal = showCreateEventModal;

console.log('✅ Events test module loaded successfully');