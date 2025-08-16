/**
 * Script para verificar que las funciones del frontend estén correctamente implementadas
 */

const fs = require('fs');

function verifyFrontendFunctions() {
    try {
        console.log('🔍 Verificando funciones del frontend...');

        // Leer archivo de facturas
        const invoicesJs = fs.readFileSync('public/js/invoices.js', 'utf8');

        // Verificar funciones principales
        const functions = [
            'viewInvoiceDetails',
            'editInvoiceModal', 
            'cancelInvoiceModal',
            'addEditInvoiceItem',
            'removeEditInvoiceItem',
            'updateEditInvoiceTotal',
            'saveInvoiceChanges'
        ];

        console.log('📋 Verificación de funciones:');
        
        const missingFunctions = [];
        const existingFunctions = [];

        functions.forEach(func => {
            const exists = invoicesJs.includes(`function ${func}`) || invoicesJs.includes(`async function ${func}`);
            if (exists) {
                existingFunctions.push(func);
                console.log(`   ✅ ${func}: EXISTE`);
            } else {
                missingFunctions.push(func);
                console.log(`   ❌ ${func}: FALTA`);
            }
        });

        // Verificar exportaciones
        console.log('\n📤 Verificación de exportaciones:');
        
        const exports = [
            'window.viewInvoiceDetails',
            'window.editInvoiceModal',
            'window.cancelInvoiceModal',
            'window.addEditInvoiceItem',
            'window.removeEditInvoiceItem',
            'window.updateEditInvoiceTotal'
        ];

        const missingExports = [];
        const existingExports = [];

        exports.forEach(exp => {
            const exists = invoicesJs.includes(exp);
            if (exists) {
                existingExports.push(exp);
                console.log(`   ✅ ${exp}: EXPORTADA`);
            } else {
                missingExports.push(exp);
                console.log(`   ❌ ${exp}: FALTA EXPORTAR`);
            }
        });

        // Crear script de verificación para el navegador
        const browserVerificationScript = `
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
    console.log(\`   \${exists ? '✅' : '❌'} \${func}: \${exists ? 'DISPONIBLE' : 'NO DISPONIBLE'}\`);
});

// Verificar que SweetAlert2 esté disponible
console.log(\`\\n🍭 SweetAlert2: \${typeof Swal !== 'undefined' ? '✅ DISPONIBLE' : '❌ NO DISPONIBLE'}\`);

// Verificar que Bootstrap esté disponible
console.log(\`🅱️ Bootstrap: \${typeof bootstrap !== 'undefined' ? '✅ DISPONIBLE' : '❌ NO DISPONIBLE'}\`);

// Verificar token de autenticación
const token = localStorage.getItem('token');
console.log(\`🔐 Token de autenticación: \${token ? '✅ PRESENTE' : '❌ AUSENTE'}\`);

console.log('\\n📊 Verificación completada');
`;

        fs.writeFileSync('public/verify-functions.js', browserVerificationScript);
        console.log('\n📝 Script de verificación creado: public/verify-functions.js');

        // Resumen
        console.log('\n📊 RESUMEN:');
        console.log(`   ✅ Funciones existentes: ${existingFunctions.length}/${functions.length}`);
        console.log(`   ✅ Exportaciones existentes: ${existingExports.length}/${exports.length}`);
        
        if (missingFunctions.length > 0) {
            console.log(`   ❌ Funciones faltantes: ${missingFunctions.join(', ')}`);
        }
        
        if (missingExports.length > 0) {
            console.log(`   ❌ Exportaciones faltantes: ${missingExports.join(', ')}`);
        }

        // Instrucciones
        console.log('\n📋 INSTRUCCIONES:');
        console.log('1. Abrir http://localhost:3000 en el navegador');
        console.log('2. Iniciar sesión');
        console.log('3. Abrir consola del navegador (F12)');
        console.log('4. Ejecutar:');
        console.log('');
        console.log('   const script = document.createElement("script");');
        console.log('   script.src = "/verify-functions.js";');
        console.log('   document.head.appendChild(script);');
        console.log('');
        console.log('5. Revisar el output en la consola');

        return {
            success: true,
            functionsFound: existingFunctions.length,
            functionsTotal: functions.length,
            exportsFound: existingExports.length,
            exportsTotal: exports.length,
            missingFunctions,
            missingExports
        };

    } catch (error) {
        console.error('❌ Error verificando funciones:', error);
        throw error;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    verifyFrontendFunctions();
}

module.exports = verifyFrontendFunctions;