/**
 * CORREGIR CAPTURA DE DATOS DEL FORMULARIO DE PRÉSTAMOS
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 CORRIGIENDO CAPTURA DE DATOS DEL FORMULARIO...');

const fundLoansPath = path.join(__dirname, '../public/js/fund-loans.js');
let fundLoansContent = fs.readFileSync(fundLoansPath, 'utf8');

// Reemplazar la función saveLoan con una versión que capture correctamente los datos
const newSaveLoanFunction = `
// Save loan
async function saveLoan() {
    try {
        console.log('💾 Guardando préstamo...');
        
        // Obtener datos directamente de los elementos del formulario
        const lenderFundSelect = document.getElementById('lenderFund');
        const borrowerFundSelect = document.getElementById('borrowerFund');
        const amountInput = document.getElementById('loanAmount');
        const reasonInput = document.getElementById('loanReason');
        const dueDateInput = document.getElementById('loanDueDate');
        const observationsInput = document.getElementById('loanObservations');
        
        console.log('🔍 Elementos del formulario:', {
            lenderFund: lenderFundSelect?.value,
            borrowerFund: borrowerFundSelect?.value,
            amount: amountInput?.value,
            reason: reasonInput?.value,
            dueDate: dueDateInput?.value,
            observations: observationsInput?.value
        });
        
        const loanData = {
            lenderFundId: lenderFundSelect?.value,
            borrowerFundId: borrowerFundSelect?.value,
            amount: parseFloat(amountInput?.value || 0),
            reason: reasonInput?.value,
            dueDate: dueDateInput?.value,
            observations: observationsInput?.value || ''
        };
        
        console.log('📋 Datos del préstamo:', loanData);
        
        // Validaciones básicas
        if (!loanData.lenderFundId) {
            throw new Error('Debe seleccionar un fondo prestamista');
        }
        
        if (!loanData.borrowerFundId) {
            throw new Error('Debe seleccionar un fondo receptor');
        }
        
        if (!loanData.amount || loanData.amount <= 0) {
            throw new Error('Debe ingresar un monto válido mayor a cero');
        }
        
        if (!loanData.reason || loanData.reason.trim() === '') {
            throw new Error('Debe ingresar el motivo del préstamo');
        }
        
        if (loanData.lenderFundId === loanData.borrowerFundId) {
            throw new Error('No se puede prestar al mismo fondo');
        }
        
        showLoading();
        
        // Crear préstamo usando la API
        const response = await api.createLoan(loanData);
        
        if (response.success) {
            showSuccess('Préstamo creado exitosamente');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('loanModal'));
            if (modal) {
                modal.hide();
            }
            
            // Limpiar formulario
            if (lenderFundSelect) lenderFundSelect.value = '';
            if (borrowerFundSelect) borrowerFundSelect.value = '';
            if (amountInput) amountInput.value = '';
            if (reasonInput) reasonInput.value = '';
            if (dueDateInput) dueDateInput.value = '';
            if (observationsInput) observationsInput.value = '';
            
            // Recargar lista de préstamos
            await loadFundLoans();
            
        } else {
            throw new Error(response.error || 'Error al crear préstamo');
        }
        
    } catch (error) {
        console.error('Error saving loan:', error);
        showError(error.message || 'Error al guardar préstamo');
    } finally {
        hideLoading();
    }
}`;

// Buscar y reemplazar la función saveLoan existente
const saveLoanRegex = /\/\/ Save loan[\s\S]*?async function saveLoan\(\)[\s\S]*?(?=\n\n\/\/|\nfunction|\nwindow\.|\n$)/;
if (saveLoanRegex.test(fundLoansContent)) {
    fundLoansContent = fundLoansContent.replace(saveLoanRegex, newSaveLoanFunction);
} else {
    // Si no encuentra la función completa, buscar solo la función
    const simpleSaveLoanRegex = /async function saveLoan\(\)[\s\S]*?(?=\n\n\/\/|\nfunction|\nwindow\.|\n$)/;
    if (simpleSaveLoanRegex.test(fundLoansContent)) {
        fundLoansContent = fundLoansContent.replace(simpleSaveLoanRegex, newSaveLoanFunction);
    } else {
        console.log('⚠️ No se encontró la función saveLoan, agregándola al final');
        fundLoansContent += '\n' + newSaveLoanFunction;
    }
}

// Verificar que el HTML del modal tenga los IDs correctos
console.log('🔍 Verificando IDs del formulario en el HTML...');

const requiredIds = [
    'lenderFund',
    'borrowerFund', 
    'loanAmount',
    'loanReason',
    'loanDueDate',
    'loanObservations'
];

for (const id of requiredIds) {
    if (fundLoansContent.includes(`id="${id}"`)) {
        console.log(`✅ ${id} - Encontrado`);
    } else {
        console.log(`❌ ${id} - NO encontrado`);
    }
}

// Corregir el HTML del modal si es necesario
if (fundLoansContent.includes('id="loanModal"')) {
    console.log('🔧 Corrigiendo HTML del modal...');
    
    // Asegurar que los campos tengan los IDs correctos
    fundLoansContent = fundLoansContent.replace(/id="lenderFund"/g, 'id="lenderFund" name="lenderFund"');
    fundLoansContent = fundLoansContent.replace(/id="borrowerFund"/g, 'id="borrowerFund" name="borrowerFund"');
    fundLoansContent = fundLoansContent.replace(/id="loanAmount"/g, 'id="loanAmount" name="amount"');
    fundLoansContent = fundLoansContent.replace(/id="loanReason"/g, 'id="loanReason" name="reason"');
    fundLoansContent = fundLoansContent.replace(/id="loanDueDate"/g, 'id="loanDueDate" name="dueDate"');
    fundLoansContent = fundLoansContent.replace(/id="loanObservations"/g, 'id="loanObservations" name="observations"');
}

// Escribir el archivo corregido
fs.writeFileSync(fundLoansPath, fundLoansContent);

console.log('✅ Captura de datos del formulario corregida');

console.log('');
console.log('🎯 CORRECCIONES APLICADAS');
console.log('');
console.log('📋 FUNCIÓN SAVELOAN:');
console.log('  ✅ Captura directa de elementos por ID');
console.log('  ✅ Validaciones mejoradas con mensajes específicos');
console.log('  ✅ Logging detallado para debugging');
console.log('  ✅ Limpieza del formulario después de guardar');
console.log('');
console.log('📋 VALIDACIONES:');
console.log('  ✅ Fondo prestamista requerido');
console.log('  ✅ Fondo receptor requerido');
console.log('  ✅ Monto válido mayor a cero');
console.log('  ✅ Motivo del préstamo requerido');
console.log('  ✅ No prestar al mismo fondo');
console.log('');
console.log('🔄 RECARGA LA PÁGINA WEB:');
console.log('  - Presiona Ctrl+F5 para forzar recarga');
console.log('  - Abre la consola del navegador (F12)');
console.log('  - Llena el formulario y haz clic en "Solicitar Préstamo"');
console.log('  - Verifica los logs en la consola para ver qué datos se capturan');
console.log('');
console.log('🧪 DEBUGGING:');
console.log('  - Los logs mostrarán exactamente qué valores se capturan');
console.log('  - Si algún campo está vacío, se mostrará en los logs');
console.log('  - Los mensajes de error serán más específicos');