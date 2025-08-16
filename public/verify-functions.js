
// Script de verificación de funciones en el navegador
console.log('🔍 Verificando funciones de facturas en el navegador...');

const functionsToCheck = [
    'viewInvoiceDetails',
    'editInvoiceModal', 
    'cancelInvoiceModal',
    'addEditInvoiceItem',
    'removeEditInvoiceItem',
    'updateEditInvoiceTotal',
    'downloadInvoice'
];

console.log('📋 Estado de las funciones:');
functionsToCheck.forEach(func => {
    const exists = typeof window[func] === 'function';
    console.log(`   ${exists ? '✅' : '❌'} ${func}: ${exists ? 'DISPONIBLE' : 'NO DISPONIBLE'}`);
});

// Verificar que SweetAlert2 esté disponible
console.log(`\n🍭 SweetAlert2: ${typeof Swal !== 'undefined' ? '✅ DISPONIBLE' : '❌ NO DISPONIBLE'}`);

// Verificar que Bootstrap esté disponible
console.log(`🅱️ Bootstrap: ${typeof bootstrap !== 'undefined' ? '✅ DISPONIBLE' : '❌ NO DISPONIBLE'}`);

// Verificar token de autenticación
const token = localStorage.getItem('token');
console.log(`🔐 Token de autenticación: ${token ? '✅ PRESENTE' : '❌ AUSENTE'}`);

console.log('\n📊 Verificación completada');
