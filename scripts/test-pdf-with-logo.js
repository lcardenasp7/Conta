// Script para probar PDF con logo/escudo

console.log('🛡️ Probando PDF con logo/escudo...');

async function testPDFWithLogo() {
    console.log('🚀 PRUEBA PDF CON LOGO');
    console.log('====================');
    
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
        
        console.log('\n📥 Generando PDF con logo...');
        
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
        
        // Comparar tamaño (con logo debería ser más grande)
        if (blob.size > 5000) {
            console.log('🛡️ Tamaño sugiere que incluye logo (>5KB)');
        } else {
            console.log('⚠️ Tamaño pequeño, posible que no incluya logo');
        }
        
        if (blob.size === 0) {
            console.error('❌ Blob vacío');
            return;
        }
        
        console.log('\n💾 Descargando PDF con logo...');
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CON_LOGO_${invoice.invoiceNumber}.pdf`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        console.log('\n🎉 PDF CON LOGO DESCARGADO');
        console.log('✅ Verifica que tenga:');
        console.log('   - 🛡️ Logo/escudo en la esquina superior izquierda');
        console.log('   - 📄 Información institucional al lado del logo');
        console.log('   - 🎨 Diseño profesional completo');
        console.log('   - 📄 Una sola página optimizada');
        
        return true;
        
    } catch (error) {
        console.error('❌ ERROR:', error);
        return false;
    }
}

// Función para verificar si el logo existe
async function checkLogoAvailability() {
    console.log('🔍 Verificando disponibilidad del logo...');
    
    try {
        // Intentar acceder al logo
        const logoResponse = await fetch('/uploads/logo.png');
        
        console.log('🛡️ Logo status:', logoResponse.status);
        console.log('🛡️ Logo OK:', logoResponse.ok);
        
        if (logoResponse.ok) {
            const logoBlob = await logoResponse.blob();
            console.log('🛡️ Logo size:', logoBlob.size, 'bytes');
            console.log('🛡️ Logo type:', logoBlob.type);
            
            if (logoBlob.size > 0) {
                console.log('✅ Logo disponible y válido');
                return true;
            } else {
                console.log('⚠️ Logo vacío');
                return false;
            }
        } else {
            console.log('❌ Logo no accesible');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error verificando logo:', error);
        return false;
    }
}

// Función para comparar PDFs con y sin logo
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
                
                // Obtener PDF actual (con logo)
                const pdfResponse = await fetch(`/api/invoices/${invoice.id}/pdf`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (pdfResponse.ok) {
                    const blob = await pdfResponse.blob();
                    console.log('📦 Tamaño con logo:', blob.size, 'bytes');
                    
                    // Estimaciones
                    console.log('📈 Comparación estimada:');
                    console.log('   - PDF simple: ~1669 bytes');
                    console.log('   - PDF profesional sin logo: ~3000-4000 bytes');
                    console.log('   - PDF profesional con logo: ~5000+ bytes');
                    console.log('   - Actual:', blob.size, 'bytes');
                    
                    if (blob.size > 5000) {
                        console.log('✅ Tamaño indica que probablemente incluye logo');
                    } else if (blob.size > 3000) {
                        console.log('⚠️ Tamaño medio, posible logo pequeño o sin logo');
                    } else {
                        console.log('❌ Tamaño pequeño, probablemente sin logo');
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error comparando:', error);
    }
}

// Exportar funciones
window.testPDFWithLogo = testPDFWithLogo;
window.checkLogoAvailability = checkLogoAvailability;
window.comparePDFSizes = comparePDFSizes;

console.log('✅ Script cargado');
console.log('💡 Funciones:');
console.log('   - testPDFWithLogo() - Probar PDF con logo');
console.log('   - checkLogoAvailability() - Verificar logo');
console.log('   - comparePDFSizes() - Comparar tamaños');

// Auto-ejecutar verificaciones
setTimeout(() => {
    checkLogoAvailability().then(logoOK => {
        if (logoOK) {
            console.log('🚀 Logo disponible, probando PDF...');
            setTimeout(testPDFWithLogo, 1000);
        } else {
            console.log('⚠️ Logo no disponible, probando PDF sin logo...');
            setTimeout(testPDFWithLogo, 1000);
        }
    });
}, 1000);