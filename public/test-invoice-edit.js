
// Script para probar edición de facturas en el navegador
async function testInvoiceEdit() {
    console.log('🧪 Probando edición de factura...');
    
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('❌ No hay token de autenticación');
        return;
    }

    const invoiceId = '1cd56789-6124-4821-b54f-0f2a43b9cdab';
    console.log('📄 Probando con factura:', invoiceId);

    try {
        // Datos de prueba para edición
        const testData = {
            dueDate: '2025-10-15',
            concept: 'MONTHLY',
            observations: 'Factura editada desde navegador - Prueba',
            items: [{
                description: 'Mensualidad Navegador',
                quantity: 1,
                unitPrice: 200000
            }]
        };

        console.log('📤 Enviando datos:', testData);

        const response = await fetch(`/api/invoices/${invoiceId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        console.log('📥 Response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Edición exitosa:', result);
        } else {
            const error = await response.json().catch(() => ({}));
            console.error('❌ Error en edición:', error);
        }

    } catch (error) {
        console.error('❌ Error probando edición:', error);
    }
}

// Ejecutar automáticamente
testInvoiceEdit();
