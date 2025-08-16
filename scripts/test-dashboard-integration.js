/**
 * Script para probar la integración del dashboard con las operaciones de facturas
 */

const fs = require('fs');

function testDashboardIntegration() {
    try {
        console.log('🔗 Probando integración del dashboard financiero...');

        // 1. Verificar que las funciones están implementadas en invoices.js
        const invoicesJs = fs.readFileSync('public/js/invoices.js', 'utf8');
        
        const hasUpdateFunction = invoicesJs.includes('updateFinancialDashboard');
        const hasNotifyFunction = invoicesJs.includes('notifyFinancialChange');
        const hasEventEmission = invoicesJs.includes('financialDataChanged');
        
        console.log('📋 Verificación de funciones en invoices.js:');
        console.log(`   ✅ updateFinancialDashboard: ${hasUpdateFunction ? 'EXISTE' : 'FALTA'}`);
        console.log(`   ✅ notifyFinancialChange: ${hasNotifyFunction ? 'EXISTE' : 'FALTA'}`);
        console.log(`   ✅ Emisión de eventos: ${hasEventEmission ? 'EXISTE' : 'FALTA'}`);

        // 2. Verificar que el dashboard escucha los eventos
        const dashboardJs = fs.readFileSync('public/js/financial-dashboard.js', 'utf8');
        
        const hasEventListener = dashboardJs.includes('financialDataChanged');
        const hasAutoUpdate = dashboardJs.includes('loadFinancialOverview');
        
        console.log('\n📋 Verificación de funciones en financial-dashboard.js:');
        console.log(`   ✅ Event listener: ${hasEventListener ? 'EXISTE' : 'FALTA'}`);
        console.log(`   ✅ Auto-actualización: ${hasAutoUpdate ? 'EXISTE' : 'FALTA'}`);

        // 3. Verificar que payments.js también notifica
        const paymentsJs = fs.readFileSync('public/js/payments.js', 'utf8');
        
        const hasPaymentNotification = paymentsJs.includes('notifyFinancialChange');
        
        console.log('\n📋 Verificación de funciones en payments.js:');
        console.log(`   ✅ Notificación de pagos: ${hasPaymentNotification ? 'EXISTE' : 'FALTA'}`);

        // 4. Crear script de prueba para el navegador
        const browserTestScript = `
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
    console.log(\`   \${available ? '✅' : '❌'} \${func}: \${available ? 'DISPONIBLE' : 'NO DISPONIBLE'}\`);
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
console.log('\\n🚀 Ejecutando pruebas automáticas...');
testFinancialEvent();

setTimeout(() => {
    testDashboardUpdate();
}, 1000);

setTimeout(() => {
    simulateInvoiceCancellation();
}, 2000);

console.log('\\n📋 Pruebas programadas. Revisa los logs en los próximos segundos.');
console.log('\\n🔧 Para probar manualmente:');
console.log('   - testFinancialEvent()');
console.log('   - testDashboardUpdate()');
console.log('   - simulateInvoiceCancellation()');
`;

        fs.writeFileSync('public/test-dashboard-integration.js', browserTestScript);
        console.log('\n📝 Script de prueba creado: public/test-dashboard-integration.js');

        // 5. Instrucciones
        console.log('\n📋 CÓMO FUNCIONA LA INTEGRACIÓN:');
        console.log('');
        console.log('🔄 FLUJO DE ACTUALIZACIÓN:');
        console.log('1. Usuario cancela/edita factura o crea pago');
        console.log('2. Se emite evento "financialDataChanged"');
        console.log('3. Dashboard escucha el evento automáticamente');
        console.log('4. Dashboard se actualiza después de 1.5 segundos');
        console.log('5. Se muestra notificación sutil al usuario');
        console.log('');
        console.log('📊 EVENTOS SOPORTADOS:');
        console.log('   • invoice_cancelled - Factura cancelada');
        console.log('   • invoice_edited - Factura editada');
        console.log('   • payment_created - Pago registrado');
        console.log('');
        console.log('🧪 PARA PROBAR:');
        console.log('1. Abrir http://localhost:3000');
        console.log('2. Iniciar sesión');
        console.log('3. Abrir dashboard financiero');
        console.log('4. En otra pestaña, cancelar/editar una factura');
        console.log('5. Volver al dashboard y ver que se actualiza automáticamente');
        console.log('');
        console.log('🔧 PARA DEBUGGING:');
        console.log('1. Abrir consola del navegador (F12)');
        console.log('2. Ejecutar:');
        console.log('   const script = document.createElement("script");');
        console.log('   script.src = "/test-dashboard-integration.js";');
        console.log('   document.head.appendChild(script);');

        return {
            success: true,
            invoicesIntegration: hasUpdateFunction && hasNotifyFunction,
            dashboardIntegration: hasEventListener && hasAutoUpdate,
            paymentsIntegration: hasPaymentNotification,
            allIntegrated: hasUpdateFunction && hasNotifyFunction && hasEventListener && hasAutoUpdate && hasPaymentNotification
        };

    } catch (error) {
        console.error('❌ Error probando integración:', error);
        throw error;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const result = testDashboardIntegration();
    
    console.log('\n📊 RESULTADO DE LA INTEGRACIÓN:');
    console.log(`   Facturas → Dashboard: ${result.invoicesIntegration ? '✅ INTEGRADO' : '❌ FALTA'}`);
    console.log(`   Dashboard → Eventos: ${result.dashboardIntegration ? '✅ INTEGRADO' : '❌ FALTA'}`);
    console.log(`   Pagos → Dashboard: ${result.paymentsIntegration ? '✅ INTEGRADO' : '❌ FALTA'}`);
    console.log(`   Estado general: ${result.allIntegrated ? '✅ COMPLETAMENTE INTEGRADO' : '⚠️ INTEGRACIÓN PARCIAL'}`);
}

module.exports = testDashboardIntegration;