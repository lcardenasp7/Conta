#!/usr/bin/env node

/**
 * SCRIPT DE CORRECCIÓN: BOTÓN DE FACTURA DE PROVEEDOR
 * Soluciona el problema del botón que no ejecuta la función
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 CORRIGIENDO BOTÓN DE FACTURA DE PROVEEDOR...\n');

function fixSupplierInvoiceButton() {
    console.log('1️⃣ Modificando botón para usar event listener...');
    
    const invoicesPath = path.join(__dirname, '../public/js/invoices.js');
    let content = fs.readFileSync(invoicesPath, 'utf8');
    
    // Cambiar el botón para que use un ID en lugar de onclick
    const oldButton = `<button type="button" class="btn btn-primary" onclick="saveSupplierInvoice()">
                            <i class="bi bi-save"></i> Guardar Factura
                        </button>`;
    
    const newButton = `<button type="button" class="btn btn-primary" id="saveSupplierInvoiceBtn">
                            <i class="bi bi-save"></i> Guardar Factura
                        </button>`;
    
    if (content.includes(oldButton)) {
        content = content.replace(oldButton, newButton);
        console.log('   ✅ Botón actualizado para usar ID');
    } else {
        console.log('   ⚠️ Botón ya actualizado o no encontrado');
    }
    
    // Agregar event listener después de crear el modal
    const insertPoint = content.indexOf('return document.getElementById(\'supplierInvoiceModal\');');
    
    if (insertPoint !== -1) {
        const eventListenerCode = `
    
    // Agregar event listener al botón de guardar
    const saveBtn = document.getElementById('saveSupplierInvoiceBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            console.log('🔘 Botón de guardar clickeado');
            saveSupplierInvoice();
        });
        console.log('✅ Event listener agregado al botón de guardar');
    }
    `;
        
        content = content.substring(0, insertPoint) + eventListenerCode + content.substring(insertPoint);
        console.log('   ✅ Event listener agregado');
    }
    
    fs.writeFileSync(invoicesPath, content);
}

function addButtonDebugCode() {
    console.log('2️⃣ Agregando código de depuración para el botón...');
    
    const invoicesPath = path.join(__dirname, '../public/js/invoices.js');
    let content = fs.readFileSync(invoicesPath, 'utf8');
    
    // Agregar función de prueba del botón
    const testFunction = `
// Función de prueba para el botón de guardar
function testSupplierInvoiceButton() {
    console.log('🧪 PROBANDO BOTÓN DE FACTURA DE PROVEEDOR');
    const modal = document.getElementById('supplierInvoiceModal');
    const button = document.getElementById('saveSupplierInvoiceBtn');
    const form = document.getElementById('supplierInvoiceForm');
    
    console.log('Modal encontrado:', !!modal);
    console.log('Botón encontrado:', !!button);
    console.log('Formulario encontrado:', !!form);
    console.log('Función saveSupplierInvoice disponible:', typeof window.saveSupplierInvoice);
    
    if (button) {
        console.log('Simulando click en el botón...');
        button.click();
    }
}

window.testSupplierInvoiceButton = testSupplierInvoiceButton;
`;
    
    if (!content.includes('function testSupplierInvoiceButton')) {
        content += testFunction;
        fs.writeFileSync(invoicesPath, content);
        console.log('   ✅ Función de prueba agregada');
    } else {
        console.log('   ✅ Función de prueba ya presente');
    }
}

function generateTestInstructions() {
    console.log('\n📋 INSTRUCCIONES DE PRUEBA:');
    console.log('');
    console.log('1. Reinicia el servidor (Ctrl+C y luego npm start)');
    console.log('2. Ve a http://localhost:3000');
    console.log('3. Inicia sesión y ve a Facturación → Facturas');
    console.log('4. Abre las herramientas de desarrollador (F12)');
    console.log('5. Haz clic en "Factura Proveedor"');
    console.log('6. En la consola, ejecuta: testSupplierInvoiceButton()');
    console.log('7. Observa los logs para ver qué elementos se encuentran');
    console.log('8. Llena el formulario y prueba el botón "Guardar Factura"');
    console.log('');
    console.log('🔍 LOGS ESPERADOS:');
    console.log('   • "🔘 Botón de guardar clickeado"');
    console.log('   • "🔍 INICIANDO saveSupplierInvoice..."');
    console.log('   • "📋 Obteniendo formulario..."');
}

async function main() {
    try {
        fixSupplierInvoiceButton();
        addButtonDebugCode();
        generateTestInstructions();
        
        console.log('\n✅ CORRECCIONES APLICADAS');
        console.log('   • Botón cambiado para usar event listener');
        console.log('   • Función de prueba agregada');
        console.log('   • Logs de depuración mejorados');
        
    } catch (error) {
        console.error('❌ Error durante las correcciones:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };