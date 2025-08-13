// Script para diagnosticar problemas de descarga de facturas

console.log('🔍 Iniciando diagnóstico de descarga de facturas...');

// Función de diagnóstico paso a paso
async function debugInvoiceDownload(invoiceId) {
    console.log('🧪 Diagnóstico paso a paso para factura:', invoiceId);
    
    try {
        // Paso 1: Verificar token
        const token = localStorage.getItem('token');
        console.log('1️⃣ Token disponible:', token ? '✅ Sí' : '❌ No');
        
        if (!token) {
            throw new Error('No hay token de autenticación');
        }
        
        // Paso 2: Hacer petición
        console.log('2️⃣ Haciendo petición a:', `/api/invoices/${invoiceId}/pdf`);
        
        const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('3️⃣ Respuesta recibida:');
        console.log('   - Status:', response.status);
        console.log('   - Status Text:', response.statusText);
        console.log('   - OK:', response.ok);
        
        // Paso 3: Verificar headers
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        const contentDisposition = response.headers.get('content-disposition');
        
        console.log('4️⃣ Headers de respuesta:');
        console.log('   - Content-Type:', contentType);
        console.log('   - Content-Length:', contentLength);
        console.log('   - Content-Disposition:', contentDisposition);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Error en respuesta:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Paso 4: Verificar tipo de contenido
        if (!contentType || !contentType.includes('application/pdf')) {
            console.log('⚠️ Tipo de contenido inesperado:', contentType);
            
            // Intentar leer como texto para ver qué devuelve
            const responseText = await response.text();
            console.log('📄 Contenido de respuesta:', responseText.substring(0, 500));
            throw new Error('La respuesta no es un PDF válido');
        }
        
        // Paso 5: Crear blob
        console.log('5️⃣ Creando blob...');
        const blob = await response.blob();
        console.log('   - Blob size:', blob.size, 'bytes');
        console.log('   - Blob type:', blob.type);
        
        if (blob.size === 0) {
            throw new Error('El PDF está vacío');
        }
        
        // Paso 6: Crear URL y elemento de descarga
        console.log('6️⃣ Creando descarga...');
        const url = window.URL.createObjectURL(blob);
        console.log('   - URL creada:', url.substring(0, 50) + '...');
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `Factura_${invoiceId}_debug.pdf`;
        a.style.display = 'none';
        
        // Paso 7: Ejecutar descarga
        console.log('7️⃣ Ejecutando descarga...');
        document.body.appendChild(a);
        
        // Agregar event listeners para debug
        a.addEventListener('click', () => {
            console.log('🖱️ Click ejecutado en elemento de descarga');
        });
        
        a.click();
        console.log('   - Click ejecutado');
        
        // Paso 8: Limpiar
        setTimeout(() => {
            console.log('8️⃣ Limpiando recursos...');
            window.URL.revokeObjectURL(url);
            if (document.body.contains(a)) {
                document.body.removeChild(a);
            }
            console.log('   - Recursos limpiados');
        }, 1000); // Más tiempo para debug
        
        console.log('✅ Diagnóstico completado exitosamente');
        return true;
        
    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
        return false;
    }
}

// Función para probar con la primera factura disponible
async function testDownloadWithFirstInvoice() {
    console.log('🎯 Probando descarga con primera factura disponible...');
    
    try {
        const response = await fetch('/api/invoices?limit=1', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error obteniendo facturas: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.invoices && data.invoices.length > 0) {
            const invoice = data.invoices[0];
            console.log('📄 Factura encontrada:', invoice.invoiceNumber);
            console.log('🆔 ID:', invoice.id);
            
            return await debugInvoiceDownload(invoice.id);
        } else {
            console.log('⚠️ No hay facturas disponibles para probar');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error obteniendo facturas:', error);
        return false;
    }
}

// Función para verificar el endpoint del servidor
async function checkPDFEndpoint(invoiceId) {
    console.log('🔍 Verificando endpoint del servidor...');
    
    try {
        // Hacer petición HEAD para verificar que el endpoint existe
        const headResponse = await fetch(`/api/invoices/${invoiceId}/pdf`, {
            method: 'HEAD',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        console.log('📡 Respuesta HEAD:');
        console.log('   - Status:', headResponse.status);
        console.log('   - Headers disponibles:', [...headResponse.headers.keys()]);
        
        return headResponse.ok;
        
    } catch (error) {
        console.error('❌ Error verificando endpoint:', error);
        return false;
    }
}

// Función para probar descarga alternativa (sin Content-Type header)
async function alternativeDownload(invoiceId) {
    console.log('🔄 Probando método alternativo de descarga...');
    
    try {
        const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
            // Sin Content-Type header
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        console.log('📦 Blob alternativo creado:', blob.size, 'bytes');
        
        // Forzar tipo PDF
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Factura_${invoiceId}_alt.pdf`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        
        console.log('✅ Descarga alternativa ejecutada');
        return true;
        
    } catch (error) {
        console.error('❌ Error en descarga alternativa:', error);
        return false;
    }
}

// Función principal de diagnóstico
async function runFullDiagnosis() {
    console.log('🚀 Ejecutando diagnóstico completo...');
    
    try {
        // 1. Probar con primera factura
        const testResult = await testDownloadWithFirstInvoice();
        
        if (!testResult) {
            console.log('⚠️ Diagnóstico básico falló, probando alternativas...');
            
            // Obtener ID de factura para pruebas adicionales
            const response = await fetch('/api/invoices?limit=1', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.invoices && data.invoices.length > 0) {
                    const invoiceId = data.invoices[0].id;
                    
                    // 2. Verificar endpoint
                    await checkPDFEndpoint(invoiceId);
                    
                    // 3. Probar método alternativo
                    await alternativeDownload(invoiceId);
                }
            }
        }
        
        console.log('🏁 Diagnóstico completo terminado');
        
    } catch (error) {
        console.error('💥 Error en diagnóstico completo:', error);
    }
}

// Exportar funciones para uso en consola
window.debugInvoiceDownload = debugInvoiceDownload;
window.testDownloadWithFirstInvoice = testDownloadWithFirstInvoice;
window.checkPDFEndpoint = checkPDFEndpoint;
window.alternativeDownload = alternativeDownload;
window.runFullDiagnosis = runFullDiagnosis;

console.log('✅ Script de diagnóstico cargado');
console.log('💡 Funciones disponibles:');
console.log('   - runFullDiagnosis() - Ejecutar diagnóstico completo');
console.log('   - testDownloadWithFirstInvoice() - Probar con primera factura');
console.log('   - debugInvoiceDownload(id) - Diagnóstico detallado');
console.log('   - alternativeDownload(id) - Método alternativo');

// Auto-ejecutar diagnóstico si se carga el script
if (document.readyState === 'complete') {
    setTimeout(runFullDiagnosis, 1000);
} else {
    window.addEventListener('load', () => {
        setTimeout(runFullDiagnosis, 1000);
    });
}