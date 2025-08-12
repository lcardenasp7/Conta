// Script para probar las funcionalidades principales de eventos

console.log('🧪 Testing Events Functionality...');

// Función para probar la funcionalidad de pagos
async function testPaymentFunctionality() {
    console.log('\n💳 Testing Payment Functionality...');
    
    try {
        // Verificar que el módulo de asignaciones esté cargado
        if (typeof initEventAssignments !== 'function') {
            console.error('❌ Event assignments module not loaded');
            return;
        }
        
        // Verificar que las funciones de búsqueda estén disponibles
        if (typeof searchStudentsForPayment !== 'function') {
            console.error('❌ searchStudentsForPayment function not available');
            return;
        }
        
        console.log('✅ Payment functions available');
        
        // Verificar que el modal de pagos esté en el DOM
        const paymentModal = document.getElementById('eventPaymentModal');
        if (paymentModal) {
            console.log('✅ Payment modal found in DOM');
        } else {
            console.warn('⚠️ Payment modal not found in DOM');
        }
        
        // Verificar elementos del formulario de pago
        const paymentElements = [
            'paymentStudentSearch',
            'paymentAmount',
            'paymentMethod',
            'paymentDate',
            'paymentReference'
        ];
        
        let missingElements = [];
        paymentElements.forEach(elementId => {
            if (!document.getElementById(elementId)) {
                missingElements.push(elementId);
            }
        });
        
        if (missingElements.length === 0) {
            console.log('✅ All payment form elements available');
        } else {
            console.warn('⚠️ Missing payment form elements:', missingElements);
        }
        
    } catch (error) {
        console.error('❌ Error testing payment functionality:', error);
    }
}

// Función para probar la funcionalidad de eventos básica
async function testBasicEventFunctionality() {
    console.log('\n📅 Testing Basic Event Functionality...');
    
    try {
        // Verificar que el módulo core esté cargado
        if (typeof initEvents !== 'function') {
            console.error('❌ Events core module not loaded');
            return;
        }
        
        console.log('✅ Events core functions available');
        
        // Verificar que la API esté disponible
        if (typeof api === 'undefined') {
            console.error('❌ API not available');
            return;
        }
        
        // Probar obtener eventos
        try {
            const events = await api.getEvents();
            console.log(`✅ Events loaded: ${events.length} events found`);
            
            if (events.length > 0) {
                console.log('📊 Sample event:', {
                    name: events[0].name,
                    type: events[0].type,
                    status: events[0].status
                });
            }
        } catch (error) {
            console.error('❌ Error loading events:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Error testing basic event functionality:', error);
    }
}

// Función para probar la funcionalidad de asignaciones
async function testAssignmentFunctionality() {
    console.log('\n👥 Testing Assignment Functionality...');
    
    try {
        // Verificar funciones de asignación
        const assignmentFunctions = [
            'selectEventForAssignments',
            'showAssignmentModal',
            'showBulkAssignmentModal',
            'showEventPaymentModal'
        ];
        
        let missingFunctions = [];
        assignmentFunctions.forEach(funcName => {
            if (typeof window[funcName] !== 'function') {
                missingFunctions.push(funcName);
            }
        });
        
        if (missingFunctions.length === 0) {
            console.log('✅ All assignment functions available');
        } else {
            console.warn('⚠️ Missing assignment functions:', missingFunctions);
        }
        
        // Verificar elementos de asignación en el DOM
        const assignmentElements = [
            'assignmentEventSelect',
            'assignmentActionsContainer',
            'assignmentsTableContainer'
        ];
        
        let missingElements = [];
        assignmentElements.forEach(elementId => {
            if (!document.getElementById(elementId)) {
                missingElements.push(elementId);
            }
        });
        
        if (missingElements.length === 0) {
            console.log('✅ All assignment elements available');
        } else {
            console.warn('⚠️ Missing assignment elements:', missingElements);
        }
        
    } catch (error) {
        console.error('❌ Error testing assignment functionality:', error);
    }
}

// Función principal de prueba
async function runEventTests() {
    console.log('🚀 Starting Events Functionality Tests...');
    
    await testBasicEventFunctionality();
    await testAssignmentFunctionality();
    await testPaymentFunctionality();
    
    console.log('\n🎯 Test Summary:');
    console.log('- Basic events: Check console for results');
    console.log('- Assignments: Check console for results');
    console.log('- Payments: Check console for results');
    
    console.log('\n💡 To test payment flow manually:');
    console.log('1. Go to Events → Assignments tab');
    console.log('2. Select an event');
    console.log('3. Click "Registrar Pago"');
    console.log('4. Search for a student');
    console.log('5. Verify student info appears correctly');
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.testPaymentFunctionality = testPaymentFunctionality;
    window.testBasicEventFunctionality = testBasicEventFunctionality;
    window.testAssignmentFunctionality = testAssignmentFunctionality;
    window.runEventTests = runEventTests;
    
    console.log('💡 Available test functions:');
    console.log('- runEventTests() - Run all tests');
    console.log('- testPaymentFunctionality() - Test payment features');
    console.log('- testBasicEventFunctionality() - Test basic event features');
    console.log('- testAssignmentFunctionality() - Test assignment features');
}

// Auto-run if not in browser
if (typeof window === 'undefined') {
    runEventTests();
}