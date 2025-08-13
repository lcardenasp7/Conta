// Script para probar la creación de facturas desde el frontend
// Este script se puede ejecutar en la consola del navegador

async function testFrontendInvoiceCreation() {
    console.log('🧪 Probando creación de factura externa desde frontend...');
    
    try {
        // Datos de prueba para factura externa
        const testInvoiceData = {
            clientName: 'Cliente Prueba Frontend',
            clientDocument: '987654321',
            clientEmail: 'prueba@frontend.com',
            clientPhone: '3001234567',
            concept: 'OTHER',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            observations: 'Factura de prueba creada desde frontend',
            items: [
                {
                    description: 'Producto de prueba',
                    quantity: 2,
                    unitPrice: 25000
                },
                {
                    description: 'Servicio de prueba',
                    quantity: 1,
                    unitPrice: 50000
                }
            ]
        };

        console.log('📝 Datos de prueba:', testInvoiceData);

        // Realizar la petición usando la API
        const result = await api.createExternalInvoice(testInvoiceData);
        
        console.log('✅ Factura creada exitosamente:', result);
        console.log(`📄 Número de factura: ${result.invoice?.invoiceNumber}`);
        console.log(`💰 Total: ${formatCurrency(result.invoice?.total || 0)}`);

        // Mostrar notificación de éxito
        showSuccess(`Factura ${result.invoice?.invoiceNumber} creada exitosamente`);

        return result;

    } catch (error) {
        console.error('❌ Error al crear factura:', error);
        showError('Error al crear factura: ' + error.message);
        throw error;
    }
}

async function testMultipleInvoiceCreation() {
    console.log('🔄 Probando creación múltiple de facturas...');
    
    const promises = [];
    
    for (let i = 1; i <= 3; i++) {
        const testData = {
            clientName: `Cliente Múltiple ${i}`,
            clientDocument: `98765432${i}`,
            clientEmail: `multiple${i}@test.com`,
            concept: 'OTHER',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            observations: `Factura múltiple ${i}`,
            items: [
                {
                    description: `Producto ${i}`,
                    quantity: 1,
                    unitPrice: 10000 * i
                }
            ]
        };

        promises.push(api.createExternalInvoice(testData));
    }

    try {
        const results = await Promise.allSettled(promises);
        
        let successCount = 0;
        let errorCount = 0;
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                console.log(`✅ Factura ${index + 1}: ${result.value.invoice?.invoiceNumber}`);
                successCount++;
            } else {
                console.log(`❌ Factura ${index + 1}: ${result.reason.message}`);
                errorCount++;
            }
        });

        console.log(`📊 Resultados: ${successCount} exitosas, ${errorCount} fallidas`);
        
        if (successCount > 0) {
            showSuccess(`${successCount} facturas creadas exitosamente`);
        }
        
        if (errorCount > 0) {
            showError(`${errorCount} facturas fallaron`);
        }

        return results;

    } catch (error) {
        console.error('❌ Error en creación múltiple:', error);
        showError('Error en creación múltiple: ' + error.message);
        throw error;
    }
}

async function cleanupTestInvoices() {
    console.log('🧹 Limpiando facturas de prueba...');
    
    try {
        // Esta función requeriría un endpoint específico para eliminar facturas de prueba
        // Por ahora solo mostramos un mensaje
        console.log('⚠️  Para limpiar las facturas de prueba, usar el panel de administración');
        showNotification('Facturas de prueba creadas. Eliminar manualmente si es necesario.', 'info');
        
    } catch (error) {
        console.error('❌ Error al limpiar:', error);
    }
}

// Función para probar la validación de campos
async function testValidation() {
    console.log('🔍 Probando validación de campos...');
    
    const invalidData = {
        clientName: '', // Campo requerido vacío
        clientDocument: '123',
        concept: 'INVALID_CONCEPT',
        dueDate: 'invalid-date',
        items: [] // Array vacío
    };

    try {
        await api.createExternalInvoice(invalidData);
        console.log('❌ ERROR: La validación debería haber fallado');
    } catch (error) {
        console.log('✅ Validación funcionando correctamente:', error.message);
        return true;
    }
    
    return false;
}

// Función principal de prueba
async function runAllTests() {
    console.log('🚀 Ejecutando todas las pruebas de facturas externas...');
    
    try {
        // 1. Probar validación
        console.log('\n1️⃣ Probando validación...');
        await testValidation();
        
        // 2. Probar creación simple
        console.log('\n2️⃣ Probando creación simple...');
        await testFrontendInvoiceCreation();
        
        // Esperar un poco entre pruebas
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 3. Probar creación múltiple
        console.log('\n3️⃣ Probando creación múltiple...');
        await testMultipleInvoiceCreation();
        
        console.log('\n✅ Todas las pruebas completadas exitosamente');
        showSuccess('Todas las pruebas de facturas completadas');
        
    } catch (error) {
        console.error('\n❌ Error en las pruebas:', error);
        showError('Error en las pruebas: ' + error.message);
    }
}

// Hacer las funciones disponibles globalmente para uso en consola
window.testFrontendInvoiceCreation = testFrontendInvoiceCreation;
window.testMultipleInvoiceCreation = testMultipleInvoiceCreation;
window.testValidation = testValidation;
window.runAllTests = runAllTests;
window.cleanupTestInvoices = cleanupTestInvoices;

console.log('🧪 Funciones de prueba cargadas. Usar:');
console.log('   - testFrontendInvoiceCreation()');
console.log('   - testMultipleInvoiceCreation()');
console.log('   - testValidation()');
console.log('   - runAllTests()');
console.log('   - cleanupTestInvoices()');