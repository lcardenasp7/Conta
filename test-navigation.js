// Script para probar la navegación de eventos

console.log('🧪 Testing Events Navigation...');

// Función para probar la navegación a asignaciones
function testNavigateToAssignments() {
    console.log('📋 Testing navigation to assignments...');
    
    try {
        // Simular clic en el menú de asignaciones
        loadPage('event-assignments');
        
        setTimeout(() => {
            const assignmentsTab = document.getElementById('events-assignments-tab');
            const assignmentsPane = document.getElementById('events-assignments');
            
            if (assignmentsTab && assignmentsTab.classList.contains('active')) {
                console.log('✅ Assignments tab is active');
            } else {
                console.warn('⚠️ Assignments tab is not active');
            }
            
            if (assignmentsPane && assignmentsPane.classList.contains('active')) {
                console.log('✅ Assignments pane is visible');
            } else {
                console.warn('⚠️ Assignments pane is not visible');
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error testing assignments navigation:', error);
    }
}

// Función para probar la navegación a reportes
function testNavigateToReports() {
    console.log('📊 Testing navigation to reports...');
    
    try {
        // Simular clic en el menú de reportes
        loadPage('event-reports');
        
        setTimeout(() => {
            const reportsTab = document.getElementById('events-reports-tab');
            const reportsPane = document.getElementById('events-reports');
            
            if (reportsTab && reportsTab.classList.contains('active')) {
                console.log('✅ Reports tab is active');
            } else {
                console.warn('⚠️ Reports tab is not active');
            }
            
            if (reportsPane && reportsPane.classList.contains('active')) {
                console.log('✅ Reports pane is visible');
            } else {
                console.warn('⚠️ Reports pane is not visible');
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error testing reports navigation:', error);
    }
}

// Función para probar el cambio manual de tabs
function testTabSwitching() {
    console.log('🔄 Testing manual tab switching...');
    
    try {
        // Primero cargar eventos
        loadPage('events');
        
        setTimeout(() => {
            console.log('📋 Switching to assignments tab...');
            switchToEventsTab('assignments');
            
            setTimeout(() => {
                console.log('📊 Switching to reports tab...');
                switchToEventsTab('reports');
                
                setTimeout(() => {
                    console.log('📅 Switching back to events list...');
                    switchToEventsTab('list');
                }, 1000);
            }, 1000);
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error testing tab switching:', error);
    }
}

// Función para verificar elementos del DOM
function checkDOMElements() {
    console.log('🔍 Checking DOM elements...');
    
    const requiredElements = [
        'eventsTab',
        'events-list-tab',
        'events-assignments-tab',
        'events-reports-tab',
        'eventsTabContent',
        'events-list',
        'events-assignments',
        'events-reports'
    ];
    
    let missingElements = [];
    
    requiredElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (!element) {
            missingElements.push(elementId);
        }
    });
    
    if (missingElements.length === 0) {
        console.log('✅ All required DOM elements found');
    } else {
        console.warn('⚠️ Missing DOM elements:', missingElements);
        console.log('💡 Try loading the events page first: loadPage("events")');
    }
}

// Función principal de prueba
function testEventsNavigation() {
    console.log('🚀 Starting Events Navigation Tests...');
    
    checkDOMElements();
    
    console.log('\n💡 Available test functions:');
    console.log('- testNavigateToAssignments() - Test sidebar → assignments');
    console.log('- testNavigateToReports() - Test sidebar → reports');
    console.log('- testTabSwitching() - Test manual tab switching');
    console.log('- checkDOMElements() - Verify DOM elements exist');
    
    console.log('\n🎯 To test the full flow:');
    console.log('1. testNavigateToAssignments()');
    console.log('2. testNavigateToReports()');
    console.log('3. testTabSwitching()');
}

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
    window.testNavigateToAssignments = testNavigateToAssignments;
    window.testNavigateToReports = testNavigateToReports;
    window.testTabSwitching = testTabSwitching;
    window.checkDOMElements = checkDOMElements;
    window.testEventsNavigation = testEventsNavigation;
    
    console.log('💡 Navigation test functions loaded. Run testEventsNavigation() to start.');
}

// Auto-run check if not in browser
if (typeof window === 'undefined') {
    testEventsNavigation();
}