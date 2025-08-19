/**
 * PRUEBA DEL FRONTEND DE PRÉSTAMOS ENTRE FONDOS
 */

console.log('🧪 PROBANDO FRONTEND DE PRÉSTAMOS ENTRE FONDOS...');

// Simular que estamos en el navegador
global.document = {
    getElementById: (id) => {
        console.log(`📋 Buscando elemento: ${id}`);
        return {
            innerHTML: '',
            value: '',
            addEventListener: () => {},
            style: {}
        };
    }
};

global.console = {
    log: (...args) => console.log(...args),
    error: (...args) => console.error(...args)
};

// Cargar el archivo fund-loans.js
const fs = require('fs');
const path = require('path');

try {
    const fundLoansPath = path.join(__dirname, '../public/js/fund-loans.js');
    const fundLoansContent = fs.readFileSync(fundLoansPath, 'utf8');
    
    // Verificar que las funciones existan
    const requiredFunctions = [
        'updateFundLoansPagination',
        'changeFundLoansPage',
        'showPendingApprovals',
        'showOverdueLoans',
        'formatCurrency',
        'formatDate'
    ];
    
    console.log('🔍 Verificando funciones requeridas...');
    
    for (const func of requiredFunctions) {
        if (fundLoansContent.includes(`function ${func}`)) {
            console.log(`✅ ${func} - Encontrada`);
        } else {
            console.log(`❌ ${func} - NO encontrada`);
        }
    }
    
    // Verificar elementos HTML requeridos
    const requiredElements = [
        'fundLoansPagination',
        'fundLoansTableBody',
        'loanSearch',
        'loanStatusFilter'
    ];
    
    console.log('\n🔍 Verificando elementos HTML requeridos...');
    
    for (const element of requiredElements) {
        if (fundLoansContent.includes(element)) {
            console.log(`✅ ${element} - Encontrado`);
        } else {
            console.log(`❌ ${element} - NO encontrado`);
        }
    }
    
    console.log('\n🎯 VERIFICACIÓN COMPLETADA');
    console.log('📋 Si todas las funciones están presentes, recarga la página web');
    console.log('🔗 Ve a: http://localhost:3000 → Gestión de Fondos → Préstamos entre Fondos');
    
} catch (error) {
    console.error('❌ Error verificando archivo:', error.message);
}