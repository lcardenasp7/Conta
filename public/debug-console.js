// Script para ejecutar directamente en la consola del navegador
// Copia y pega este código completo en la consola

(async function() {
    console.log('🔍 DIAGNÓSTICO INMEDIATO DE DESCARGA PDF');
    console.log('==========================================');
    
    try {
        // 1. Verificar token
        const token = localStorage.getItem('token');
        console.log('🔑 Token:', token ? '✅ Disponible' : '❌ NO DISPONIBLE');
        
        if (!token) {
            console.error('❌ PROBLEMA: No hay token de autenticación');
            console.log('💡 SOLUCIÓN: Hacer login nuevamente');
            return;
        }
        
        // 2. Obtener facturas
        console.log('\n📋 Obteniendo facturas...');
        const invoicesResponse = await fetch('/api/invoices?limit=1', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('📊 Status facturas:', invoicesResponse.status);
        
        if (!invoicesResponse.ok) {
            console.error('❌ PROBLEMA: No se pueden obtener facturas');
            const errorText = await invoicesResponse.text();
            console.log('📄 Error:', errorText);
            return;
        }
        
        const invoicesData = await invoicesResponse.json();
        console.log('📄 Facturas encontradas:', invoicesData.invoices?.length || 0);
        
        if (!invoicesData.invoices || invoicesData.invoices.length === 0) {
            console.error('❌ PROBLEMA: No hay facturas disponibles');
            return;
        }
        
        const invoice = invoicesData.invoices[0];
        console.log('🎯 Factura seleccionada:', invoice.invoiceNumber);
        console.log('🆔 ID:', invoice.id);
        
        // 3. Probar endpoint PDF
        console.log('\n📥 Probando endpoint PDF...');
        const pdfUrl = `/api/invoices/${invoice.id}/pdf`;
        console.log('🔗 URL:', pdfUrl);
        
        const startTime = Date.now();
        
        const pdfResponse = await fetch(pdfUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const responseTime = Date.now() - startTime;
        console.log('⏱️ Tiempo respuesta:', responseTime, 'ms');
        console.log('📊 Status:', pdfResponse.status);
        console.log('📊 OK:', pdfResponse.ok);
        
        // Mostrar headers importantes
        const contentType = pdfResponse.headers.get('content-type');
        const contentLength = pdfResponse.headers.get('content-length');
        const contentDisposition = pdfResponse.headers.get('content-disposition');
        
        console.log('📋 Headers importantes:');
        console.log('   Content-Type:', contentType);
        console.log('   Content-Length:', contentLength);
        console.log('   Content-Disposition:', contentDisposition);
        
        if (!pdfResponse.ok) {
            console.error('❌ PROBLEMA: Error en respuesta PDF');
            const errorText = await pdfResponse.text();
            console.log('📄 Error response:', errorText);
            return;
        }
        
        // 4. Procesar blob
        console.log('\n📦 Procesando blob...');
        const blob = await pdfResponse.blob();
        
        console.log('📦 Blob size:', blob.size, 'bytes');
        console.log('📦 Blob type:', blob.type);
        
        if (blob.size === 0) {
            console.error('❌ PROBLEMA: Blob vacío');
            return;
        }
        
        if (blob.size < 1000) {
            console.warn('⚠️ ADVERTENCIA: Blob muy pequeño, posible error');
        }
        
        // 5. Intentar descarga
        console.log('\n💾 Intentando descarga...');
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DEBUG_${invoice.invoiceNumber}.pdf`;
        
        // Verificar que el elemento se puede crear
        console.log('📎 Elemento <a> creado:', !!a);
        console.log('📎 href asignado:', !!a.href);
        console.log('📎 download asignado:', !!a.download);
        
        document.body.appendChild(a);
        console.log('📎 Elemento agregado al DOM');
        
        // Intentar click
        console.log('🖱️ Ejecutando click...');
        a.click();
        
        // Verificar después del click
        setTimeout(() => {
            console.log('📎 Elemento aún en DOM:', document.body.contains(a));
            
            // Limpiar
            if (document.body.contains(a)) {
                document.body.removeChild(a);
            }
            URL.revokeObjectURL(url);
            
            console.log('\n✅ DIAGNÓSTICO COMPLETADO');
            console.log('💡 Si no se descargó, revisar configuración del navegador');
            
        }, 1000);
        
    } catch (error) {
        console.error('❌ ERROR EN DIAGNÓSTICO:', error);
        console.error('📄 Stack trace:', error.stack);
        
        // Sugerencias basadas en el error
        if (error.message.includes('fetch')) {
            console.log('💡 POSIBLE CAUSA: Problema de red o servidor');
        } else if (error.message.includes('JSON')) {
            console.log('💡 POSIBLE CAUSA: Respuesta no válida del servidor');
        } else if (error.message.includes('blob')) {
            console.log('💡 POSIBLE CAUSA: Problema procesando el PDF');
        }
    }
})();

// También definir función para uso posterior
window.debugPDFDownload = async function() {
    // Repetir el código anterior para uso posterior
    console.log('🔄 Ejecutando debug PDF...');
    // (El mismo código de arriba se puede llamar nuevamente)
};

console.log('\n💡 INSTRUCCIONES:');
console.log('1. Si ves "✅ DIAGNÓSTICO COMPLETADO" pero no se descarga:');
console.log('   - Revisar configuración de descargas del navegador');
console.log('   - Verificar si hay bloqueador de pop-ups');
console.log('2. Si hay errores, revisar los logs del servidor');
console.log('3. Para repetir: debugPDFDownload()');