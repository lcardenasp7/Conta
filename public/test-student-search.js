// Script para probar la búsqueda de estudiantes

console.log('🧪 Student Search Test Loaded');

// Función para probar la búsqueda de estudiantes
async function testStudentSearch() {
    console.log('🔍 Testing student search...');
    
    try {
        // Probar la función API directamente
        console.log('📡 Testing API function...');
        const students = await api.searchStudents('CARLOS');
        console.log('✅ API response:', students);
        console.log('📊 Students count:', students.length);
        console.log('📋 First student:', students[0]);
        
        return students;
    } catch (error) {
        console.error('❌ Error testing student search:', error);
        return null;
    }
}

// Función para probar la búsqueda en el modal
function testModalSearch() {
    console.log('🎯 Testing modal search...');
    
    // Verificar que el modal esté disponible
    const modal = document.getElementById('assignmentModal');
    if (!modal) {
        console.error('❌ Assignment modal not found');
        return;
    }
    
    // Verificar que la función de búsqueda esté disponible
    if (typeof searchStudentsForAssignment !== 'function') {
        console.error('❌ searchStudentsForAssignment function not available');
        return;
    }
    
    console.log('✅ Modal and search function available');
    
    // Simular búsqueda
    try {
        searchStudentsForAssignment('CARLOS');
        console.log('✅ Search function called successfully');
    } catch (error) {
        console.error('❌ Error calling search function:', error);
    }
}

// Función para probar la selección de estudiante
function testStudentSelection() {
    console.log('🎯 Testing student selection...');
    
    // Verificar que la función esté disponible
    if (typeof selectStudentForAssignment !== 'function') {
        console.error('❌ selectStudentForAssignment function not available');
        return;
    }
    
    // Verificar elementos DOM necesarios
    const requiredElements = [
        'selectedStudentId',
        'assignmentStudentSearch', 
        'assignmentStudentResults',
        'selectedStudentInfo'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('❌ Missing DOM elements:', missingElements);
        return;
    }
    
    console.log('✅ All required elements found');
    
    // Simular selección
    try {
        selectStudentForAssignment('test-id', 'Juan', 'Pérez', '12345678', '5°', 'A');
        console.log('✅ Student selection function called successfully');
    } catch (error) {
        console.error('❌ Error calling selection function:', error);
    }
}

// Función para verificar el estado del sistema
function checkSearchSystem() {
    console.log('🔍 Checking search system status...');
    
    const checks = [
        { name: 'API object', check: () => typeof api !== 'undefined' },
        { name: 'searchStudents function', check: () => typeof api.searchStudents === 'function' },
        { name: 'searchStudentsForAssignment function', check: () => typeof searchStudentsForAssignment === 'function' },
        { name: 'Assignment modal', check: () => document.getElementById('assignmentModal') !== null },
        { name: 'Student results div', check: () => document.getElementById('assignmentStudentResults') !== null }
    ];
    
    checks.forEach(check => {
        if (check.check()) {
            console.log(`✅ ${check.name}: OK`);
        } else {
            console.log(`❌ ${check.name}: MISSING`);
        }
    });
}

// Hacer funciones disponibles globalmente
window.testStudentSearch = testStudentSearch;
window.testModalSearch = testModalSearch;
window.testStudentSelection = testStudentSelection;
window.checkSearchSystem = checkSearchSystem;

console.log('💡 Available test functions:');
console.log('- testStudentSearch() - Test API search directly');
console.log('- testModalSearch() - Test modal search function');
console.log('- testStudentSelection() - Test student selection');
console.log('- checkSearchSystem() - Check system status');