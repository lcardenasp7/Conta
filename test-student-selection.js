// Test para verificar la selección de estudiantes
console.log('🧪 Testing student selection fix...');

// Simular búsqueda
function testStudentSelection() {
    console.log('🔍 Testing student search and selection...');
    
    // Abrir modal si no está abierto
    const modal = document.getElementById('eventModal');
    if (modal && !modal.classList.contains('show')) {
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }
    
    // Esperar un poco para que el modal se abra
    setTimeout(() => {
        // Buscar estudiante
        const searchInput = document.getElementById('studentSearch');
        if (searchInput) {
            searchInput.value = 'CARLOS';
            
            // Simular evento de input
            const event = new Event('input', { bubbles: true });
            searchInput.dispatchEvent(event);
            
            console.log('✅ Search triggered for "CARLOS"');
        } else {
            console.error('❌ Search input not found');
        }
    }, 500);
}

// Función para probar selección directa
function testDirectSelection() {
    console.log('🎯 Testing direct student selection...');
    
    // Simular selección directa
    try {
        selectStudent('1', 'CARLOS IVAN', 'ACOSTA AMAYA', '12345678', 'SEXTO', 'A');
        console.log('✅ Direct selection test passed');
    } catch (error) {
        console.error('❌ Direct selection test failed:', error);
    }
}

// Ejecutar pruebas
console.log('Running tests in 2 seconds...');
setTimeout(() => {
    testDirectSelection();
    testStudentSelection();
}, 2000);