// Script para probar la corrección del buffer PDF

console.log('🧪 Probando corrección de buffer PDF...');

// Función de prueba rápida
async function testBufferFix() {
    console.log('🚀 Iniciando prueba de buffer fix...');
    
    try {
        // 1. Obtener token
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No hay token');
            return;
        }
        
        // 2. Obtener factura
        const invoicesResponse = await fetch('/api/invoices?limit=1', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!invoicesResponse.ok) {
            console.error('❌ Error obteniendo facturas');
            return;
        }
        
        const invoicesData = await invoicesResponse.json();
        if (!invoicesData.invoices || invoicesData.invoices.length === 0) {
            console.error('❌ No hay facturas');
            return;
        }
        
        const invoice = invoicesData.invoices[0];
        console.log('🎯 Probando con factura:', invoice.invoiceNumber);
        
        // 3. Probar descarga con nuevo endpoint
        console.log('📥 Probando descarga con buffer...');
        
        const startTime = Date.now();
        
        const pdfResponse = await fetch(`/api/invoices/${invoice.id}/pdf`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const responseTime = Date.now() - startTime;
        
        console.log('⏱️ Tiempo de respuesta:', responseTime, 'ms');
        console.log('📊 Status:', pdfResponse.status);
        console.log('📊 OK:', pdfResponse.ok);
        
        // Verificar headers
        const contentType = pdfResponse.headers.get('content-type');
        const contentLength = pdfResponse.headers.get('content-length');
        
        console.log('📋 Content-Type:', contentType);
        console.log('📋 Content-Length:', contentLength);
        
        if (!pdfResponse.ok) {
            const errorText = await pdfResponse.text();
            console.error('❌ Error:', errorText);
            return;
        }
        
        // Procesar blob
        console.log('📦 Procesando blob...');
        const blob = await pdfResponse.blob();
        
        console.log('📦 Blob size:', blob.size, 'bytes');
        console.log('📦 Blob type:', blob.type);
        
        if (blob.size === 0) {
            console.error('❌ Blob vacío');
            return;
        }
        
        // Intentar descarga
        console.log('💾 Ejecutando descarga...');
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BufferTest_${invoice.invoiceNumber}.pdf`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        console.log('✅ PRUEBA COMPLETADA - ¿Se descargó el PDF?');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error en prueba:', error);
        return false;
    }
}

// Función para comparar antes y después
async function compareDownloadMethods() {
    console.log('🔄 Comparando métodos de descarga...');
    
    try {
        const token = localStorage.getItem('token');
        const invoicesResponse = await fetch('/api/invoices?limit=1', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (invoicesResponse.ok) {
            const invoicesData = await invoicesResponse.json();
            if (invoicesData.invoices && invoicesData.invoices.length > 0) {
                const invoice = invoicesData.invoices[0];
                
                console.log('📊 Comparación de métodos:');
                console.log('   Factura:', invoice.invoiceNumber);
                console.log('   ID:', invoice.id);
                
                // Método 1: Función original
                console.log('\n1️⃣ Probando función original...');
                if (typeof downloadInvoice === 'function') {
                    try {
                        await downloadInvoice(invoice.id);
                        console.log('✅ Función original ejecutada');
                    } catch (error) {
                        console.log('❌ Función original falló:', error.message);
                    }
                } else {
                    console.log('❌ Función original no disponible');
                }
                
                // Esperar un momento
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Método 2: Prueba directa
                console.log('\n2️⃣ Probando método directo...');
                await testBufferFix();
            }
        }
        
    } catch (error) {
        console.error('❌ Error en comparación:', error);
    }
}

// Exportar funciones
window.testBufferFix = testBufferFix;
window.compareDownloadMethods = compareDownloadMethods;

console.log('✅ Script de prueba cargado');
console.log('💡 Funciones disponibles:');
console.log('   - testBufferFix() - Probar corrección');
console.log('   - compareDownloadMethods() - Comparar métodos');

// Auto-ejecutar prueba
setTimeout(testBufferFix, 1000);