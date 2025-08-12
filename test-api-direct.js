// Test directo de la API de estudiantes
console.log('🧪 Testing API directly...');

// Función para probar la API
async function testStudentsAPI() {
    try {
        console.log('🔍 Testing search with "CARLOS"...');
        
        // Probar con diferentes parámetros
        const tests = [
            { search: 'CARLOS', limit: 5 },
            { search: 'carlos', limit: 5 },
            { search: 'a', limit: 10 },
            { search: 'EDWIN', limit: 5 }
        ];
        
        for (const params of tests) {
            console.log(`\n📡 Testing with params:`, params);
            
            try {
                const response = await api.getStudents(params);
                console.log(`✅ Response for "${params.search}":`, response);
                console.log(`📊 Found ${response.students?.length || 0} students`);
                
                if (response.students && response.students.length > 0) {
                    console.log('👥 First few students:');
                    response.students.slice(0, 3).forEach(s => {
                        console.log(`  - ${s.firstName} ${s.lastName} (${s.document})`);
                    });
                }
            } catch (error) {
                console.error(`❌ Error with "${params.search}":`, error);
            }
        }
        
    } catch (error) {
        console.error('❌ General error:', error);
    }
}

// Ejecutar test
testStudentsAPI();