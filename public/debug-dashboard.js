
// Script de debugging para el dashboard en el navegador
console.log('🔍 Iniciando debugging del dashboard...');

// 1. Verificar si las funciones están disponibles
console.log('📋 Verificando funciones disponibles:');
const functions = [
    'loadFinancialOverview',
    'updateFinancialDashboard', 
    'notifyFinancialChange'
];

functions.forEach(func => {
    const available = typeof window[func] === 'function';
    console.log(`   ${available ? '✅' : '❌'} ${func}: ${available ? 'DISPONIBLE' : 'NO DISPONIBLE'}`);
});

// 2. Verificar si hay event listeners
console.log('\n👂 Verificando event listeners:');
const hasFinancialListener = document._events && document._events['financialDataChanged'];
console.log(`   Event listener financialDataChanged: ${hasFinancialListener ? '✅ EXISTE' : '❌ NO EXISTE'}`);

// 3. Probar emisión manual de evento
function testManualEvent() {
    console.log('\n🧪 Probando emisión manual de evento...');
    
    const event = new CustomEvent('financialDataChanged', {
        detail: {
            type: 'invoice_cancelled',
            data: {
                invoiceId: 'test-123',
                amount: 150000,
                reason: 'Prueba manual'
            },
            timestamp: new Date()
        }
    });
    
    document.dispatchEvent(event);
    console.log('✅ Evento emitido manualmente');
}

// 4. Probar actualización directa del dashboard
function testDirectUpdate() {
    console.log('\n🔄 Probando actualización directa...');
    
    if (typeof window.loadFinancialOverview === 'function') {
        window.loadFinancialOverview()
            .then(() => console.log('✅ Dashboard actualizado directamente'))
            .catch(error => console.error('❌ Error actualizando dashboard:', error));
    } else {
        console.log('❌ Función loadFinancialOverview no disponible');
    }
}

// 5. Verificar API del dashboard
async function testDashboardAPI() {
    console.log('\n🌐 Probando API del dashboard...');
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/financial-dashboard/overview?period=current-month', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API del dashboard funciona:', data.summary);
        } else {
            console.error('❌ Error en API del dashboard:', response.status);
        }
    } catch (error) {
        console.error('❌ Error llamando API:', error);
    }
}

// 6. Monitorear eventos en tiempo real
function monitorEvents() {
    console.log('\n👀 Monitoreando eventos financieros...');
    
    document.addEventListener('financialDataChanged', function(event) {
        console.log('📢 EVENTO RECIBIDO:', {
            type: event.detail.type,
            data: event.detail.data,
            timestamp: event.detail.timestamp
        });
    });
    
    console.log('✅ Monitor de eventos activado');
}

// Ejecutar pruebas automáticamente
console.log('\n🚀 Ejecutando pruebas automáticas...');

// Activar monitor primero
monitorEvents();

// Probar después de 1 segundo
setTimeout(() => {
    testManualEvent();
}, 1000);

// Probar actualización directa después de 3 segundos
setTimeout(() => {
    testDirectUpdate();
}, 3000);

// Probar API después de 5 segundos
setTimeout(() => {
    testDashboardAPI();
}, 5000);

console.log('\n🔧 Funciones disponibles para prueba manual:');
console.log('   - testManualEvent()');
console.log('   - testDirectUpdate()');
console.log('   - testDashboardAPI()');
console.log('   - monitorEvents()');

// Hacer funciones globales
window.testManualEvent = testManualEvent;
window.testDirectUpdate = testDirectUpdate;
window.testDashboardAPI = testDashboardAPI;
window.monitorEvents = monitorEvents;
