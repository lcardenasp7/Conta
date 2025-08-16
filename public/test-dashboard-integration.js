
// Script para probar la integración del dashboard en el navegador
console.log('🔗 Probando integración del dashboard financiero...');

// 1. Verificar que las funciones están disponibles
const functions = [
    'updateFinancialDashboard',
    'notifyFinancialChange',
    'loadFinancialOverview'
];

console.log('📋 Funciones disponibles:');
functions.forEach(func => {
    const available = typeof window[func] === 'function';
    console.log(`   ${available ? '✅' : '❌'} ${func}: ${available ? 'DISPONIBLE' : 'NO DISPONIBLE'}`);
});

// 2. Probar emisión de evento
function testFinancialEvent() {
    console.log('🧪 Probando emisión de evento financiero...');
    
    if (typeof window.notifyFinancialChange === 'function') {
        window.notifyFinancialChange('test_event', {
            message: 'Prueba de integración',
            timestamp: new Date()
        });
        console.log('✅ Evento emitido correctamente');
    } else {
        console.log('❌ Función notifyFinancialChange no disponible');
    }
}

// 3. Probar actualización manual del dashboard
function testDashboardUpdate() {
    console.log('🧪 Probando actualización manual del dashboard...');
    
    if (typeof window.updateFinancialDashboard === 'function') {
        window.updateFinancialDashboard('Prueba manual')
            .then(() => console.log('✅ Dashboard actualizado correctamente'))
            .catch(error => console.log('❌ Error actualizando dashboard:', error));
    } else {
        console.log('❌ Función updateFinancialDashboard no disponible');
    }
}

// 4. Simular cancelación de factura
function simulateInvoiceCancellation() {
    console.log('🧪 Simulando cancelación de factura...');
    
    // Emitir evento como si se hubiera cancelado una factura
    const event = new CustomEvent('financialDataChanged', {
        detail: {
            type: 'invoice_cancelled',
            data: {
                invoiceId: 'test-invoice-123',
                reason: 'Prueba de integración',
                amount: 150000
            },
            timestamp: new Date()
        }
    });
    
    document.dispatchEvent(event);
    console.log('✅ Evento de cancelación simulado');
}

// Ejecutar pruebas automáticamente
console.log('\n🚀 Ejecutando pruebas automáticas...');
testFinancialEvent();

setTimeout(() => {
    testDashboardUpdate();
}, 1000);

setTimeout(() => {
    simulateInvoiceCancellation();
}, 2000);

console.log('\n📋 Pruebas programadas. Revisa los logs en los próximos segundos.');
console.log('\n🔧 Para probar manualmente:');
console.log('   - testFinancialEvent()');
console.log('   - testDashboardUpdate()');
console.log('   - simulateInvoiceCancellation()');
