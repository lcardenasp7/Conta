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

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
    window.testNavigateToAssignments = testNavigateToAssignments;
    window.testNavigateToReports = testNavigateToReports;
    
    console.log('💡 Navigation test functions loaded:');
    console.log('- testNavigateToAssignments()');
    console.log('- testNavigateToReports()');
}