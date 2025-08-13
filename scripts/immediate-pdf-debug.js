// Script de diagnóstico inmediato para descarga de PDFs
// Ejecutar en la consola del navegador

console.log('🔍 Iniciando diagnóstico inmediato de descarga...');

// Función para interceptar y debuggear la descarga
async function debugDownloadNow() {
    console.log('🧪 Debug inmediato de descarga de PDF');
    
    try {
        // 1. Verificar token
        const token = localStorage.getItem('token');
        console.log('🔑 Token:', token ? 'Disponible' : 'NO DISPONIBLE');
        
        if (!token) {
            console.error('❌ No hay token de autenticación');
            return;
        }
        
        // 2. Obtener primera factura
        console.log('📋 Obteniendo facturas...');
        const invoicesResponse = await fetch('/api/invoices?limit=1', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('📊 Respuesta facturas:', invoicesResponse.status, invoicesResponse.statusText);
        
        if (!invoicesResponse.ok) {
            console.error('❌ Error obteniendo facturas');
            return;
        }
        
        const invoicesData = await invoicesResponse.json();
        console.log('📄 Facturas obtenidas:', invoicesData.invoices?.length || 0);
        
        if (!invoicesData.invoices || invoicesData.invoices.length === 0) {
            console.error('❌ No hay facturas disponibles');
            return;
        }
        
        const invoice = invoicesData.invoices[0];
        console.log('🎯 Factura seleccionada:', invoice.invoiceNumber, 'ID:', invoice.id);
        
        // 3. Probar descarga paso a paso
        console.log('📥 Iniciando descarga paso a paso...');
        
        const pdfUrl = `/api/invoices/${invoice.id}/pdf`;
        console.log('🔗 URL:', pdfUrl);
        
        // Crear AbortController para timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            console.log('⏰ Timeout: La petición tardó más de 30 segundos');
        }, 30000);
        
        console.log('📡 Haciendo petición PDF...');
        const startTime = Date.now();
        
        const pdfResponse = await fetch(pdfUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        console.log('⏱️ Tiempo de respuesta:', responseTime, 'ms');
        console.log('📊 Status:', pdfResponse.status);
        console.log('📊 Status Text:', pdfResponse.statusText);
        console.log('📊 OK:', pdfResponse.ok);
        
        // 4. Analizar headers
        console.log('📋 Headers de respuesta:');
        for (let [key, value] of pdfResponse.headers.entries()) {
            console.log(`   ${key}: ${value}`);
        }
        
        if (!pdfResponse.ok) {
            console.error('❌ Error en respuesta PDF');
            const errorText = await pdfResponse.text();
            console.log('📄 Error text:', errorText);
            return;
        }
        
        // 5. Procesar blob
        console.log('📦 Procesando blob...');
        const blobStartTime = Date.now();
        
        const blob = await pdfResponse.blob();
        
        const blobTime = Date.now() - blobStartTime;
        console.log('⏱️ Tiempo blob:', blobTime, 'ms');
        console.log('📦 Blob size:', blob.size, 'bytes');
        console.log('📦 Blob type:', blob.type);
        
        if (blob.size === 0) {
            console.error('❌ Blob vacío');
            return;
        }
        
        // 6. Crear descarga
        console.log('💾 Creando descarga...');
        const url = URL.createObjectURL(blob);
        console.log('🔗 Blob URL creada:', url.substring(0, 50) + '...');
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `Debug_${invoice.invoiceNumber}.pdf`;
        a.style.display = 'none';
        
        console.log('📎 Elemento <a> creado');
        
        // Agregar listeners para debug
        a.addEventListener('click', () => {
            console.log('🖱️ Click event fired');
        });
        
        document.body.appendChild(a);
        console.log('📎 Elemento agregado al DOM');
        
        // Trigger download
        console.log('🚀 Ejecutando click...');
        a.click();
        
        // Verificar si el elemento sigue en el DOM
        setTimeout(() => {
            const stillInDOM = document.body.contains(a);
            console.log('📎 Elemento aún en DOM:', stillInDOM);
            
            if (stillInDOM) {
                document.body.removeChild(a);
                console.log('📎 Elemento removido del DOM');
            }
            
            URL.revokeObjectURL(url);
            console.log('🔗 URL revocada');
        }, 2000);
        
        console.log('✅ Proceso de descarga completado');
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('⏰ Petición cancelada por timeout');
        } else {
            console.error('❌ Error en debug:', error);
            console.error('📄 Error stack:', error.stack);
        }
    }
}

// Función para verificar el estado del servidor
async function checkServerPDFStatus() {
    console.log('🖥️ Verificando estado del servidor PDF...');
    
    try {
        const token = localStorage.getItem('token');
        
        // Obtener una factura
        const invoicesResponse = await fetch('/api/invoices?limit=1', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!invoicesResponse.ok) {
            console.log('❌ No se pueden obtener facturas');
            return;
        }
        
        const invoicesData = await invoicesResponse.json();
        if (!invoicesData.invoices || invoicesData.invoices.length === 0) {
            console.log('❌ No hay facturas para probar');
            return;
        }
        
        const invoiceId = invoicesData.invoices[0].id;
        
        // Hacer petición HEAD para verificar endpoint
        console.log('📡 Verificando endpoint con HEAD...');
        const headResponse = await fetch(`/api/invoices/${invoiceId}/pdf`, {
            method: 'HEAD',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('📊 HEAD Response:', headResponse.status, headResponse.statusText);
        
        // Verificar headers disponibles
        console.log('📋 Headers disponibles:');
        for (let [key, value] of headResponse.headers.entries()) {
            console.log(`   ${key}: ${value}`);
        }
        
    } catch (error) {
        console.error('❌ Error verificando servidor:', error);
    }
}

// Función para monitorear network requests
function monitorNetworkRequests() {
    console.log('📡 Monitoreando requests de red...');
    
    // Override fetch para monitorear
    const originalFetch = window.fetch;
    
    window.fetch = function(...args) {
        const url = args[0];
        
        if (typeof url === 'string' && url.includes('/pdf')) {
            console.log('🔍 PDF Request intercepted:', url);
            console.log('🔍 Request args:', args);
            
            return originalFetch.apply(this, args)
                .then(response => {
                    console.log('🔍 PDF Response received:', response.status, response.statusText);
                    return response;
                })
                .catch(error => {
                    console.error('🔍 PDF Request failed:', error);
                    throw error;
                });
        }
        
        return originalFetch.apply(this, args);
    };
    
    console.log('✅ Network monitoring activado');
}

// Función para probar con la función original
async function testOriginalDownloadFunction() {
    console.log('🔧 Probando función original downloadInvoice...');
    
    if (typeof downloadInvoice !== 'function') {
        console.log('❌ Función downloadInvoice no disponible');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const invoicesResponse = await fetch('/api/invoices?limit=1', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (invoicesResponse.ok) {
            const invoicesData = await invoicesResponse.json();
            if (invoicesData.invoices && invoicesData.invoices.length > 0) {
                const invoiceId = invoicesData.invoices[0].id;
                console.log('🎯 Probando con ID:', invoiceId);
                
                // Llamar función original
                await downloadInvoice(invoiceId);
            }
        }
        
    } catch (error) {
        console.error('❌ Error en función original:', error);
    }
}

// Ejecutar diagnóstico automáticamente
console.log('🚀 Ejecutando diagnóstico automático...');
console.log('💡 Funciones disponibles:');
console.log('   - debugDownloadNow() - Debug completo');
console.log('   - checkServerPDFStatus() - Verificar servidor');
console.log('   - monitorNetworkRequests() - Monitorear requests');
console.log('   - testOriginalDownloadFunction() - Probar función original');

// Auto-ejecutar
setTimeout(() => {
    console.log('🔄 Iniciando diagnóstico automático...');
    debugDownloadNow();
}, 1000);

// Exportar funciones
window.debugDownloadNow = debugDownloadNow;
window.checkServerPDFStatus = checkServerPDFStatus;
window.monitorNetworkRequests = monitorNetworkRequests;
window.testOriginalDownloadFunction = testOriginalDownloadFunction;