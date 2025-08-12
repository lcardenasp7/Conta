// Script de prueba para verificar los módulos de eventos

console.log('🧪 Testing Events Modules...');

// Verificar que las funciones principales estén disponibles
const requiredFunctions = [
    'initEvents',
    'initEventAssignments', 
    'initEventReports'
];

const missingFunctions = [];

requiredFunctions.forEach(funcName => {
    if (typeof window[funcName] !== 'function') {
        missingFunctions.push(funcName);
    }
});

if (missingFunctions.length > 0) {
    console.error('❌ Missing functions:', missingFunctions);
} else {
    console.log('✅ All required functions are available');
}

// Verificar API
if (typeof api === 'undefined') {
    console.error('❌ API object not available');
} else {
    console.log('✅ API object available');
    
    // Verificar funciones de API específicas para eventos
    const apiEventsFunctions = [
        'getEvents',
        'createEvent',
        'getEventAssignments',
        'createEventAssignment',
        'createEventPayment',
        'getAllEventAssignments',
        'getAllEventPayments'
    ];
    
    const missingApiFunctions = [];
    
    apiEventsFunctions.forEach(funcName => {
        if (typeof api[funcName] !== 'function') {
            missingApiFunctions.push(funcName);
        }
    });
    
    if (missingApiFunctions.length > 0) {
        console.warn('⚠️ Missing API functions:', missingApiFunctions);
    } else {
        console.log('✅ All API functions available');
    }
}

// Verificar dependencias externas
const externalDependencies = [
    { name: 'Bootstrap', check: () => typeof bootstrap !== 'undefined' },
    { name: 'Chart.js', check: () => typeof Chart !== 'undefined' },
    { name: 'SweetAlert2', check: () => typeof Swal !== 'undefined' }
];

externalDependencies.forEach(dep => {
    if (dep.check()) {
        console.log(`✅ ${dep.name} available`);
    } else {
        console.warn(`⚠️ ${dep.name} not available`);
    }
});

// Verificar elementos DOM necesarios
const requiredElements = [
    'contentArea',
    'pageTitle'
];

const missingElements = [];

requiredElements.forEach(elementId => {
    if (!document.getElementById(elementId)) {
        missingElements.push(elementId);
    }
});

if (missingElements.length > 0) {
    console.warn('⚠️ Missing DOM elements:', missingElements);
} else {
    console.log('✅ All required DOM elements available');
}

console.log('🧪 Events Modules Test Complete');

// Función para probar la inicialización de eventos
async function testEventsInitialization() {
    try {
        console.log('🧪 Testing Events Initialization...');
        
        if (typeof initEvents === 'function') {
            await initEvents();
            console.log('✅ Events initialization successful');
        } else {
            console.error('❌ initEvents function not available');
        }
    } catch (error) {
        console.error('❌ Events initialization failed:', error);
    }
}

// Exportar función de prueba
if (typeof window !== 'undefined') {
    window.testEventsInitialization = testEventsInitialization;
}