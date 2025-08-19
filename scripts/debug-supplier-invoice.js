#!/usr/bin/env node

/**
 * SCRIPT DE DEPURACIÓN: FACTURA DE PROVEEDOR
 * Identifica por qué no se está guardando la factura
 */

console.log('🔍 DEPURANDO PROBLEMA DE FACTURA DE PROVEEDOR...\n');

const fs = require('fs');
const path = require('path');

function checkInvoicesFile() {
    console.log('1️⃣ Verificando archivo invoices.js...');
    
    const invoicesPath = path.join(__dirname, '../public/js/invoices.js');
    const content = fs.readFileSync(invoicesPath, 'utf8');
    
    const checks = [
        {
            name: 'Función saveSupplierInvoice existe',
            test: content.includes('async function saveSupplierInvoice()')
        },
        {
            name: 'Función processSupplierInvoiceWithSelectedFund existe',
            test: content.includes('async function processSupplierInvoiceWithSelectedFund(')
        },
        {
            name: 'Función closeSupplierInvoiceModal existe',
            test: content.includes('function closeSupplierInvoiceModal()')
        },
        {
            name: 'Función getSupplierConceptText existe',
            test: content.includes('function getSupplierConceptText(')
        },
        {
            name: 'API call corregido (api.post en lugar de API.request)',
            test: content.includes('const response = await api.post(\'/invoices\', invoiceData);')
        },
        {
            name: 'Validación de fondo presente',
            test: content.includes('const selectedFundId = document.getElementById(\'supplierInvoiceFund\').value;')
        },
        {
            name: 'Función exportada correctamente',
            test: content.includes('window.saveSupplierInvoice = saveSupplierInvoice;')
        }
    ];
    
    checks.forEach(check => {
        if (check.test) {
            console.log(`   ✅ ${check.name}`);
        } else {
            console.log(`   ❌ ${check.name}`);
        }
    });
    
    return checks;
}

function addDebuggingToSaveFunction() {
    console.log('\n2️⃣ Agregando logs de depuración...');
    
    const invoicesPath = path.join(__dirname, '../public/js/invoices.js');
    let content = fs.readFileSync(invoicesPath, 'utf8');
    
    // Agregar log al inicio de saveSupplierInvoice
    if (!content.includes('🔍 INICIANDO saveSupplierInvoice')) {
        content = content.replace(
            'async function saveSupplierInvoice() {',
            `async function saveSupplierInvoice() {
    console.log('🔍 INICIANDO saveSupplierInvoice...');`
        );
        
        // Agregar log antes de la validación del formulario
        content = content.replace(
            'const form = document.getElementById(\'supplierInvoiceForm\');',
            `console.log('📋 Obteniendo formulario...');
        const form = document.getElementById('supplierInvoiceForm');
        console.log('📋 Formulario encontrado:', !!form);`
        );
        
        // Agregar log antes de la validación de fondos
        content = content.replace(
            'const selectedFundId = document.getElementById(\'supplierInvoiceFund\').value;',
            `console.log('💰 Verificando fondo seleccionado...');
        const selectedFundId = document.getElementById('supplierInvoiceFund').value;
        console.log('💰 Fondo seleccionado:', selectedFundId);`
        );
        
        fs.writeFileSync(invoicesPath, content);
        console.log('   ✅ Logs de depuración agregados');
    } else {
        console.log('   ✅ Logs de depuración ya presentes');
    }
}

function checkModalHTML() {
    console.log('\n3️⃣ Verificando HTML del modal...');
    
    const invoicesPath = path.join(__dirname, '../public/js/invoices.js');
    const content = fs.readFileSync(invoicesPath, 'utf8');
    
    const checks = [
        {
            name: 'Modal tiene ID correcto',
            test: content.includes('id="supplierInvoiceModal"')
        },
        {
            name: 'Formulario tiene ID correcto',
            test: content.includes('id="supplierInvoiceForm"')
        },
        {
            name: 'Campo de fondo tiene ID correcto',
            test: content.includes('id="supplierInvoiceFund"')
        },
        {
            name: 'Botón de guardar llama función correcta',
            test: content.includes('onclick="saveSupplierInvoice()"')
        }
    ];
    
    checks.forEach(check => {
        if (check.test) {
            console.log(`   ✅ ${check.name}`);
        } else {
            console.log(`   ❌ ${check.name}`);
        }
    });
}

function generateTestCode() {
    console.log('\n4️⃣ Código de prueba para consola del navegador:');
    console.log('');
    console.log('// Pega este código en la consola del navegador después de abrir el modal:');
    console.log('');
    console.log('console.log("=== DEPURACIÓN FACTURA PROVEEDOR ===");');
    console.log('console.log("Modal:", document.getElementById("supplierInvoiceModal"));');
    console.log('console.log("Formulario:", document.getElementById("supplierInvoiceForm"));');
    console.log('console.log("Campo fondo:", document.getElementById("supplierInvoiceFund"));');
    console.log('console.log("Función saveSupplierInvoice:", typeof window.saveSupplierInvoice);');
    console.log('console.log("Valor del fondo:", document.getElementById("supplierInvoiceFund")?.value);');
    console.log('');
    console.log('// Para probar la función manualmente:');
    console.log('window.saveSupplierInvoice();');
}

async function main() {
    try {
        const checks = checkInvoicesFile();
        addDebuggingToSaveFunction();
        checkModalHTML();
        generateTestCode();
        
        console.log('\n📊 RESUMEN:');
        const passedChecks = checks.filter(check => check.test).length;
        console.log(`   ✅ ${passedChecks}/${checks.length} verificaciones pasaron`);
        
        if (passedChecks === checks.length) {
            console.log('\n🎯 TODAS LAS FUNCIONES ESTÁN PRESENTES');
            console.log('\n🔍 PASOS PARA DEPURAR:');
            console.log('1. Abre el navegador y ve a la página de facturas');
            console.log('2. Abre las herramientas de desarrollador (F12)');
            console.log('3. Ve a la pestaña "Console"');
            console.log('4. Abre el modal de factura de proveedor');
            console.log('5. Llena todos los campos incluyendo el fondo');
            console.log('6. Haz clic en "Guardar Factura"');
            console.log('7. Observa los logs en la consola');
            console.log('8. Si no aparecen logs, pega el código de prueba');
        } else {
            console.log('\n⚠️ FALTAN ALGUNAS FUNCIONES - REVISA LOS ERRORES ARRIBA');
        }
        
    } catch (error) {
        console.error('❌ Error durante la depuración:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };