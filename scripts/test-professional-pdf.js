// Script para probar el PDF profesional mejorado

console.log('🎨 Probando PDF profesional mejorado...');

async function testProfessionalPDF() {
    console.log('🚀 PRUEBA PDF PROFESIONAL');
    console.log('========================');
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No hay token');
            return;
        }
        console.log('🔑 Token: ✅');
        
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
        console.log('📋 Items:', invoice.items?.length || 0);
        
        console.log('\n📥 Generando PDF profesional...');
        
        const startTime = Date.now();
        
        const pdfResponse = await fetch(`/api/invoices/${invoice.id}/pdf`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const responseTime = Date.now() - startTime;
        
        console.log('⏱️ Tiempo:', responseTime, 'ms');
        console.log('📊 Status:', pdfResponse.status);
        console.log('📊 OK:', pdfResponse.ok);
        
        const contentLength = pdfResponse.headers.get('content-length');
        console.log('📋 Content-Length:', contentLength);
        
        if (!pdfResponse.ok) {
            const errorText = await pdfResponse.text();
            console.error('❌ Error response:', errorText);
            return;
        }
        
        console.log('\n📦 Procesando blob...');
        const blob = await pdfResponse.blob();
        
        console.log('📦 Blob size:', blob.size, 'bytes');
        console.log('📈 Tamaño vs anterior:', blob.size > 1669 ? '✅ Más grande (más contenido)' : '⚠️ Mismo tamaño');
        
        if (blob.size === 0) {
            console.error('❌ Blob vacío');
            return;
        }
        
        console.log('\n💾 Descargando PDF profesional...');
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PROFESIONAL_${invoice.invoiceNumber}.pdf`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        console.log('\n🎉 PDF PROFESIONAL DESCARGADO');
        console.log('✅ Verifica que tenga:');
        console.log('   - Header con información institucional');
        console.log('   - Información en dos columnas');
        console.log('   - Tabla de items profesional');
        console.log('   - Totales alineados');
        console.log('   - Footer con información legal');
        console.log('   - TODO EN UNA SOLA PÁGINA');
        
        return true;
        
    } catch (error) {
        console.error('❌ ERROR:', error);
        return false;
    }
}

// Función para comparar tamaños
async function comparePDFSizes() {
    console.log('📊 Comparando tamaños de PDF...');
    
    try {
        const token = localStorage.getItem('token');
        const invoicesResponse = await fetch('/api/invoices?limit=1', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (invoicesResponse.ok) {
            const invoicesData = await invoicesResponse.json();
            if (invoicesData.invoices && invoicesData.invoices.length > 0) {
                const invoice = invoicesData.invoices[0];
                
                console.log('📄 Factura:', invoice.invoiceNumber);
                console.log('📋 Items:', invoice.items?.length || 0);
                
                // Obtener PDF actual
                const pdfResponse = await fetch(`/api/invoices/${invoice.id}/pdf`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (pdfResponse.ok) {
                    const blob = await pdfResponse.blob();
                    console.log('📦 Tamaño actual:', blob.size, 'bytes');
                    console.log('📈 Comparación:');
                    console.log('   - PDF simple anterior: ~1669 bytes');
                    console.log('   - PDF profesional actual:', blob.size, 'bytes');
                    console.log('   - Diferencia:', blob.size - 1669, 'bytes');
                    console.log('   - Incremento:', ((blob.size / 1669 - 1) * 100).toFixed(1) + '%');
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error comparando:', error);
    }
}

// Función para probar con diferentes tipos de facturas
async function testDifferentInvoiceTypes() {
    console.log('🔄 Probando diferentes tipos de facturas...');
    
    try {
        const token = localStorage.getItem('token');
        const invoicesResponse = await fetch('/api/invoices?limit=3', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (invoicesResponse.ok) {
            const invoicesData = await invoicesResponse.json();
            if (invoicesData.invoices && invoicesData.invoices.length > 0) {
                
                for (let i = 0; i < invoicesData.invoices.length; i++) {
                    const invoice = invoicesData.invoices[i];
                    
                    console.log(`\n${i + 1}️⃣ Probando: ${invoice.invoiceNumber}`);
                    console.log('   Items:', invoice.items?.length || 0);
                    console.log('   Cliente:', invoice.student ? 
                        `${invoice.student.firstName} ${invoice.student.lastName}` : 
                        invoice.clientName || 'Cliente Externo');
                    
                    const pdfResponse = await fetch(`/api/invoices/${invoice.id}/pdf`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (pdfResponse.ok) {
                        const blob = await pdfResponse.blob();
                        console.log('   Tamaño:', blob.size, 'bytes');
                        
                        // Descargar
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `TEST_${i + 1}_${invoice.invoiceNumber}.pdf`;
                        
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                        
                        console.log('   ✅ Descargado');
                    } else {
                        console.log('   ❌ Error:', pdfResponse.status);
                    }
                    
                    // Esperar entre descargas
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error probando tipos:', error);
    }
}

// Exportar funciones
window.testProfessionalPDF = testProfessionalPDF;
window.comparePDFSizes = comparePDFSizes;
window.testDifferentInvoiceTypes = testDifferentInvoiceTypes;

console.log('✅ Script cargado');
console.log('💡 Funciones:');
console.log('   - testProfessionalPDF() - Probar PDF profesional');
console.log('   - comparePDFSizes() - Comparar tamaños');
console.log('   - testDifferentInvoiceTypes() - Probar múltiples facturas');

// Auto-ejecutar
setTimeout(testProfessionalPDF, 1000);