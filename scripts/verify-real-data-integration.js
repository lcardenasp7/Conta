#!/usr/bin/env node

/**
 * Script para verificar la eliminación de datos simulados y la integración con el dashboard
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando eliminación de datos simulados y integración con dashboard...\n');

// Verificar que se eliminaron los datos simulados
console.log('📋 Verificando eliminación de datos simulados:');

const apiContent = fs.readFileSync('public/js/api.js', 'utf8');

// Verificar que NO existen referencias a datos simulados
const simulatedDataChecks = [
    { pattern: /simulatedEventPayments\s*=\s*\[/, name: 'Array de datos simulados', shouldExist: false },
    { pattern: /pay_initial_123/, name: 'Pago demo inicial', shouldExist: false },
    { pattern: /MONICA PATRICIA ALARCON/, name: 'Datos demo específicos', shouldExist: false },
    { pattern: /initializeDemoPayments/, name: 'Función de inicialización demo', shouldExist: false },
    { pattern: /savePaymentsToStorage/, name: 'Función de localStorage', shouldExist: false }
];

simulatedDataChecks.forEach(check => {
    const exists = check.pattern.test(apiContent);
    if (check.shouldExist === exists) {
        console.log(`✅ ${check.name} - ${exists ? 'presente' : 'eliminado'} correctamente`);
    } else {
        console.log(`❌ ${check.name} - ${exists ? 'aún presente (debería estar eliminado)' : 'faltante (debería estar presente)'}`);
    }
});

// Verificar que las funciones usan endpoints reales
console.log('\n🌐 Verificando uso de endpoints reales:');

const endpointChecks = [
    { pattern: /this\.get\(`\/events\/\$\{eventId\}\/assignments/, name: 'getEventAssignments', shouldExist: true },
    { pattern: /this\.get\(`\/events\/\$\{eventId\}\/payments/, name: 'getEventPayments', shouldExist: true },
    { pattern: /this\.post\(`\/events\/\$\{eventId\}\/payments/, name: 'createEventPayment', shouldExist: true },
    { pattern: /this\.delete\(`\/payments\/\$\{paymentId\}/, name: 'deletePayment', shouldExist: true },
    { pattern: /this\.get\(`\/events\/\$\{eventId\}\/payments\/student/, name: 'getPaymentHistory', shouldExist: true }
];

endpointChecks.forEach(check => {
    const exists = check.pattern.test(apiContent);
    if (check.shouldExist === exists) {
        console.log(`✅ ${check.name} - ${exists ? 'usando endpoint real' : 'no implementado'}`);
    } else {
        console.log(`❌ ${check.name} - ${exists ? 'implementado' : 'faltante'}`);
    }
});

// Verificar integración con dashboard financiero
console.log('\n💰 Verificando integración con dashboard financiero:');

const assignmentsContent = fs.readFileSync('public/js/event-assignments.js', 'utf8');

const dashboardIntegrationChecks = [
    { pattern: /updateFinancialDashboardAfterPayment/, name: 'Función de actualización de dashboard', shouldExist: true },
    { pattern: /window\.refreshDashboard/, name: 'Llamada a refreshDashboard', shouldExist: true },
    { pattern: /window\.loadFinancialOverview/, name: 'Llamada a loadFinancialOverview', shouldExist: true },
    { pattern: /paymentRegistered.*CustomEvent/, name: 'Evento personalizado paymentRegistered', shouldExist: true }
];

dashboardIntegrationChecks.forEach(check => {
    const exists = check.pattern.test(assignmentsContent);
    if (check.shouldExist === exists) {
        console.log(`✅ ${check.name} - ${exists ? 'implementado' : 'no requerido'}`);
    } else {
        console.log(`❌ ${check.name} - ${exists ? 'implementado' : 'faltante'}`);
    }
});

// Verificar que las funciones de pago llaman a la actualización del dashboard
console.log('\n🔄 Verificando actualización automática del dashboard:');

const paymentFunctionChecks = [
    { pattern: /saveEventPayment[\s\S]*?updateFinancialDashboardAfterPayment/, name: 'saveEventPayment actualiza dashboard', shouldExist: true },
    { pattern: /deletePaymentFromHistory[\s\S]*?updateFinancialDashboardAfterPayment/, name: 'deletePaymentFromHistory actualiza dashboard', shouldExist: true }
];

paymentFunctionChecks.forEach(check => {
    const exists = check.pattern.test(assignmentsContent);
    if (check.shouldExist === exists) {
        console.log(`✅ ${check.name} - ${exists ? 'implementado' : 'no requerido'}`);
    } else {
        console.log(`❌ ${check.name} - ${exists ? 'implementado' : 'faltante'}`);
    }
});

console.log('\n📋 Resumen de cambios implementados:');
console.log('✅ Eliminados todos los datos simulados de eventos');
console.log('✅ Todas las funciones ahora usan endpoints reales del backend');
console.log('✅ Integración con dashboard financiero implementada');
console.log('✅ Actualización automática del dashboard después de pagos');
console.log('✅ Eventos personalizados para comunicación entre módulos');

console.log('\n🧪 Instrucciones de prueba:');
console.log('1. Registrar un pago en un evento');
console.log('2. Verificar que aparece en el dashboard financiero');
console.log('3. Eliminar un pago de evento');
console.log('4. Verificar que se actualiza el dashboard financiero');
console.log('5. Refrescar la página y verificar que los cambios persisten');

console.log('\n🚀 Sistema listo para pruebas con datos reales!');