// Script simple para probar la navegación

console.log('🧪 Simple Navigation Test Loaded');

// Función para verificar funciones disponibles
function checkAvailableFunctions() {
    console.log('🔍 Checking available functions...');
    
    const functions = [
        'loadPage',
        'switchToEventsTab', 
        'initEvents',
        'initEventAssignments',
        'initEventReports'
    ];
    
    functions.forEach(funcName => {
        const funcType = typeof window[funcName];
        if (funcType === 'function') {
            console.log(`✅ ${funcName}: available`);
        } else {
            console.log(`❌ ${funcName}: ${funcType}`);
        }
    });
}

// Función simple para probar navegación
function testSimpleNavigation() {
    console.log('🚀 Testing simple navigation...');
    
    // Verificar funciones primero
    checkAvailableFunctions();
    
    // Probar navegación a asignaciones
    console.log('📋 Testing assignments...');
    if (typeof loadPage === 'function') {
        loadPage('event-assignments');
        console.log('✅ loadPage called for event-assignments');
    } else {
        console.error('❌ loadPage function not available');
    }
    
    // Esperar y probar reportes
    setTimeout(() => {
        console.log('📊 Testing reports...');
        if (typeof loadPage === 'function') {
            loadPage('event-reports');
            console.log('✅ loadPage called for event-reports');
        } else {
            console.error('❌ loadPage function not available');
        }
    }, 3000);
}

// Función para verificar que switchToEventsTab existe
function checkSwitchFunction() {
    if (typeof switchToEventsTab === 'function') {
        console.log('✅ switchToEventsTab function is available');
        
        // Probar directamente
        console.log('🔄 Testing direct tab switch...');
        switchToEventsTab('assignments');
        
        setTimeout(() => {
            switchToEventsTab('reports');
        }, 1000);
        
    } else {
        console.error('❌ switchToEventsTab function not available');
    }
}

// Función para probar initEvents directamente
function testInitEvents() {
    console.log('🎯 Testing initEvents directly...');
    
    if (typeof initEvents === 'function') {
        console.log('✅ initEvents is available, calling it...');
        initEvents().then(() => {
            console.log('✅ initEvents completed successfully');
        }).catch(error => {
            console.error('❌ initEvents failed:', error);
        });
    } else {
        console.error('❌ initEvents function not available');
    }
}

// Hacer disponible globalmente
window.testSimpleNavigation = testSimpleNavigation;
window.checkSwitchFunction = checkSwitchFunction;
window.checkAvailableFunctions = checkAvailableFunctions;
window.testInitEvents = testInitEvents;

console.log('💡 Available functions:');
console.log('- checkAvailableFunctions() - Check what functions are loaded');
console.log('- testInitEvents() - Test initEvents directly');
console.log('- testSimpleNavigation() - Test navigation');
console.log('- checkSwitchFunction() - Test tab switching');