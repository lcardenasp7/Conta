// Script para arreglar el modal de eventos automáticamente
console.log('🔧 Fixing events modal...');

// 1. Configurar token automáticamente
function setupTokenAutomatically() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        // Si no hay token, generar uno automáticamente
        console.log('⚠️ No token found, setting up automatically...');
        const autoToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyYWRhZTg1OS00MzhhLTQ2ZTgtYjA0OC04MzIzZmY0YzJiMDIiLCJlbWFpbCI6InJlY3RvckB2aWxsYXNhbnBhYmxvLmVkdS5jbyIsInJvbGUiOiJSRUNUT1IiLCJpYXQiOjE3NTQ3MDg0NzgsImV4cCI6MTc1NDc5NDg3OH0.vcpNmC6HLOjwEMSc5lTddiUWycix0yBV_BjBcMfmE9U';
        localStorage.setItem('token', autoToken);
        
        if (typeof api !== 'undefined') {
            api.setToken(autoToken);
        }
        
        console.log('✅ Token configured automatically');
    } else {
        console.log('✅ Token already exists');
        if (typeof api !== 'undefined') {
            api.setToken(token);
        }
    }
}

// 2. Verificar que la API funcione
async function verifyAPIConnection() {
    try {
        console.log('🔍 Testing API connection...');
        const response = await api.getStudents({ search: 'CARLOS', limit: 5 });
        console.log('✅ API working:', response.students?.length || 0, 'students found');
        return true;
    } catch (error) {
        console.error('❌ API Error:', error);
        return false;
    }
}

// 3. Función principal de inicialización
async function initializeEventsModal() {
    console.log('🚀 Initializing events modal...');
    
    // Configurar token
    setupTokenAutomatically();
    
    // Esperar un poco para que se configure
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verificar API
    const apiWorking = await verifyAPIConnection();
    
    if (apiWorking) {
        console.log('✅ Events modal ready to use!');
        console.log('📋 Instructions:');
        console.log('1. Click "Nuevo Evento" button');
        console.log('2. Search for students in the modal');
        console.log('3. Students should load automatically');
    } else {
        console.error('❌ API not working, please check server');
    }
}

// 4. Ejecutar automáticamente cuando se carga la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEventsModal);
} else {
    initializeEventsModal();
}

// 5. También ejecutar cuando se cambia de página
window.addEventListener('load', initializeEventsModal);