// Debug del frontend - ejecutar en la consola del navegador
console.log('🔍 Debugging frontend API calls...');

// 1. Verificar token
console.log('1. Checking token...');
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
console.log('Token length:', token ? token.length : 0);

// 2. Verificar API instance
console.log('\n2. Checking API instance...');
console.log('API exists:', typeof api !== 'undefined');
if (typeof api !== 'undefined') {
    console.log('API token:', api.token ? 'exists' : 'missing');
}

// 3. Test directo de la API
console.log('\n3. Testing API directly...');
async function testDirectAPI() {
    try {
        // Asegurar que el token esté configurado
        if (token && typeof api !== 'undefined') {
            api.setToken(token);
        }
        
        console.log('🔍 Testing search for "CARLOS"...');
        const response = await api.getStudents({ search: 'CARLOS', limit: 5 });
        console.log('✅ API Response:', response);
        console.log('📊 Students found:', response.students?.length || 0);
        
        if (response.students && response.students.length > 0) {
            console.log('👥 Students:');
            response.students.forEach(s => {
                console.log(`  - ${s.firstName} ${s.lastName} (${s.document})`);
            });
        }
        
    } catch (error) {
        console.error('❌ API Error:', error);
        console.error('Error details:', error.message);
    }
}

// 4. Test de la función de búsqueda
console.log('\n4. Testing search function...');
function testSearchFunction() {
    const resultsDiv = document.getElementById('studentResults');
    if (resultsDiv) {
        console.log('✅ Results div found');
        searchStudents('CARLOS', resultsDiv);
    } else {
        console.log('❌ Results div not found');
    }
}

// Ejecutar tests
setTimeout(() => {
    testDirectAPI();
    testSearchFunction();
}, 1000);

console.log('\n📋 Instructions:');
console.log('1. Set token: localStorage.setItem("token", "YOUR_TOKEN_HERE")');
console.log('2. Reload page');
console.log('3. Run this script again');