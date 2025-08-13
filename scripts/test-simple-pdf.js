// Script para probar la versión simplificada del PDF

console.log('🧪 Probando versión simplificada de PDF...');

// Función de prueba inmediata
async function testSimplePDF() {
    console.log('🚀 PRUEBA INMEDIATA - PDF SIMPLIFICADO');
    console.log('=====================================');
    
    try {
        // 1. Token
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No hay token');
            return;
        }
        console.log('🔑 Token: ✅');
        
        // 2. Obtener factura
        const invoicesResponse = await fetch('/api/invoices?limit=1', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!invoicesResponse.ok) {
            console.error('❌ Error facturas:', invoicesResponse.status);
            return;
        }
        
        const invoicesData = await invoicesResponse.json();
        if (!invoicesData.invoices || invoicesData.invoices.length === 0) {
            console.error('❌ No hay facturas');
            return;
        }
        
        const invoice = invoicesData.invoices[0];
        console.log('🎯 Factura:', invoice.invoiceNumber);
        
        // 3. Probar PDF simplificado
        console.log('\n📥 Probando PDF simplificado...');
        
        const startTime = Date.now();
        
        const pdfResponse = await fetch(`/api/invoices/${invoice.id}/pdf`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const responseTime = Date.now() - startTime;
        
        console.log('⏱️ Tiempo:', responseTime, 'ms');
        console.log('📊 Status:', pdfResponse.status);
        console.log('📊 OK:', pdfResponse.ok);
        
        // Headers críticos
        const contentType = pdfResponse.headers.get('content-type');
        const contentLength = pdfResponse.headers.get('content-length');
        
        console.log('📋 Content-Type:', contentType);
        console.log('📋 Content-Length:', contentLength, '← ¡DEBE TENER VALOR!');
        
        if (!pdfResponse.ok) {
            const errorText = await pdfResponse.text();
            console.error('❌ Error response:', errorText);
            return;
        }
        
        // 4. Procesar blob
        console.log('\n📦 Procesando blob...');
        const blobStart = Date.now();
        
        const blob = await pdfResponse.blob();
        
        const blobTime = Date.now() - blobStart;
        console.log('⏱️ Tiempo blob:', blobTime, 'ms');
        console.log('📦 Blob size:', blob.size, 'bytes');
        
        if (blob.size === 0) {
            console.error('❌ Blob vacío');
            return;
        }
        
        // 5. Descargar
        console.log('\n💾 Descargando...');
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SIMPLE_${invoice.invoiceNumber}.pdf`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        console.log('\n🎉 ÉXITO - PDF SIMPLIFICADO DESCARGADO');
        console.log('✅ ¿Se descargó correctamente?');
        
        return true;
        
    } catch (error) {
        console.error('❌ ERROR:', error);
        console.error('📄 Stack:', error.stack);
        return false;
    }
}

// Función para comparar con método anterior
async function compareWithPrevious() {
    console.log('🔄 Comparando con método anterior...');
    
    try {
        // Primero probar el nuevo
        console.log('\n1️⃣ Probando método simplificado...');
        const simpleResult = await testSimplePDF();
        
        // Esperar un momento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Luego probar el original si existe
        console.log('\n2️⃣ Probando método original...');
        if (typeof downloadInvoice === 'function') {
            try {
                const token = localStorage.getItem('token');
                const invoicesResponse = await fetch('/api/invoices?limit=1', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (invoicesResponse.ok) {
                    const invoicesData = await invoicesResponse.json();
                    if (invoicesData.invoices && invoicesData.invoices.length > 0) {
                        await downloadInvoice(invoicesData.invoices[0].id);
                        console.log('✅ Método original también funcionó');
                    }
                }
            } catch (error) {
                console.log('❌ Método original falló:', error.message);
            }
        } else {
            console.log('⚠️ Método original no disponible');
        }
        
        console.log('\n📊 RESUMEN:');
        console.log('   Método simplificado:', simpleResult ? '✅ FUNCIONA' : '❌ FALLA');
        
    } catch (error) {
        console.error('❌ Error en comparación:', error);
    }
}

// Exportar funciones
window.testSimplePDF = testSimplePDF;
window.compareWithPrevious = compareWithPrevious;

console.log('✅ Script cargado');
console.log('💡 Funciones:');
console.log('   - testSimplePDF() - Probar PDF simplificado');
console.log('   - compareWithPrevious() - Comparar métodos');

// Auto-ejecutar
setTimeout(testSimplePDF, 1000);