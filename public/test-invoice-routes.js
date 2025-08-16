
// Script para probar las rutas de facturas en el navegador
// Ejecutar en la consola después del login

async function testInvoiceRoutes() {
    console.log('🧪 Probando rutas de facturas...');
    
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('❌ No hay token de autenticación');
        return;
    }

    // Obtener una factura para probar
    try {
        const response = await fetch('/api/invoices?limit=1', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error(`Error obteniendo facturas: ${response.status}`);
        }
        
        const data = await response.json();
        const invoice = data.invoices?.[0];
        
        if (!invoice) {
            console.log('❌ No hay facturas para probar');
            return;
        }
        
        console.log(`📄 Probando con factura: ${invoice.invoiceNumber}`);
        
        // Probar ruta VER
        console.log('👁️ Probando ruta VER...');
        const viewResponse = await fetch(`/api/invoices/${invoice.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`   VER: ${viewResponse.ok ? '✅ OK' : '❌ ERROR ' + viewResponse.status}`);
        
        // Solo probar editar y cancelar si la factura está PENDING
        if (invoice.status === 'PENDING') {
            // Probar ruta EDITAR (sin enviar datos, solo verificar que existe)
            console.log('✏️ Probando ruta EDITAR...');
            const editResponse = await fetch(`/api/invoices/${invoice.id}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ dueDate: invoice.dueDate }) // Datos mínimos
            });
            console.log(`   EDITAR: ${editResponse.ok ? '✅ OK' : '❌ ERROR ' + editResponse.status}`);
            
            // Probar ruta CANCELAR (sin enviar datos, solo verificar que existe)
            console.log('❌ Probando ruta CANCELAR...');
            const cancelResponse = await fetch(`/api/invoices/${invoice.id}/cancel`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: 'Prueba de ruta' })
            });
            console.log(`   CANCELAR: ${cancelResponse.ok ? '✅ OK' : '❌ ERROR ' + cancelResponse.status}`);
            
            // Si se canceló, revertir
            if (cancelResponse.ok) {
                console.log('🔄 Revirtiendo cancelación de prueba...');
                await fetch(`/api/invoices/${invoice.id}`, {
                    method: 'PUT',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 'PENDING' })
                });
            }
        } else {
            console.log(`⚠️ Factura no está PENDING (${invoice.status}), no se pueden probar editar/cancelar`);
        }
        
        console.log('✅ Prueba de rutas completada');
        
    } catch (error) {
        console.error('❌ Error probando rutas:', error);
    }
}

// Ejecutar automáticamente
testInvoiceRoutes();
