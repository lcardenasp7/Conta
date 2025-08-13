// Script para probar el layout mejorado del PDF

console.log('🎨 Probando layout mejorado del PDF...');

async function testImprovedLayout() {
    console.log('🚀 PRUEBA LAYOUT MEJORADO');
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
        
        console.log('\n📥 Generando PDF con layout mejorado...');
        
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
        
        if (blob.size === 0) {
            console.error('❌ Blob vacío');
            return;
        }
        
        console.log('\n💾 Descargando PDF con layout mejorado...');
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LAYOUT_MEJORADO_${invoice.invoiceNumber}.pdf`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        console.log('\n🎉 PDF CON LAYOUT MEJORADO DESCARGADO');
        console.log('✅ Verifica que tenga:');
        console.log('   - 🛡️ Logo en la esquina superior izquierda');
        console.log('   - 🏢 Nombre de institución SIN chocar con FACTURA');
        console.log('   - 📄 "FACTURA" en la esquina superior derecha');
        console.log('   - 🔢 Número de factura DEBAJO de "FACTURA"');
        console.log('   - 📋 Información bien distribuida');
        console.log('   - 📄 Una sola página optimizada');
        
        return true;
        
    } catch (error) {
        console.error('❌ ERROR:', error);
        return false;
    }
}

// Función para verificar el layout específicamente
async function verifyLayout() {
    console.log('🔍 Verificando elementos del layout...');
    
    try {
        const token = localStorage.getItem('token');
        const invoicesResponse = await fetch('/api/invoices?limit=1', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (invoicesResponse.ok) {
            const invoicesData = await invoicesResponse.json();
            if (invoicesData.invoices && invoicesData.invoices.length > 0) {
                const invoice = invoicesData.invoices[0];
                
                console.log('📄 Elementos que debe tener el PDF:');
                console.log('   1. Logo/escudo: 🛡️ Esquina superior izquierda');
                console.log('   2. Nombre institución: 🏢 Al lado del logo (ancho limitado)');
                console.log('   3. "FACTURA": 📄 Esquina superior derecha');
                console.log('   4. Número factura: 🔢', invoice.invoiceNumber, 'debajo de FACTURA');
                console.log('   5. Información en dos columnas: 📋 Cliente | Factura');
                console.log('   6. Tabla de items: 📊 Con headers profesionales');
                console.log('   7. Totales: 💰 Alineados a la derecha');
                console.log('   8. Footer legal: ⚖️ Información DIAN');
                
                console.log('\n🎯 Mejoras aplicadas:');
                console.log('   - ✅ Nombre institución con ancho limitado (280px)');
                console.log('   - ✅ Número de factura visible debajo del título');
                console.log('   - ✅ Espaciado ajustado para mejor distribución');
                console.log('   - ✅ Header más alto para acomodar contenido');
            }
        }
        
    } catch (error) {
        console.error('❌ Error verificando layout:', error);
    }
}

// Función para comparar con versión anterior
async function compareLayouts() {
    console.log('📊 Comparando layouts...');
    
    console.log('🔄 Cambios realizados:');
    console.log('   ANTES:');
    console.log('   - ❌ Nombre institución chocaba con FACTURA');
    console.log('   - ❌ Solo decía "FACTURA" sin número');
    console.log('   - ❌ Layout desorganizado');
    
    console.log('   DESPUÉS:');
    console.log('   - ✅ Nombre institución con ancho limitado (280px)');
    console.log('   - ✅ Número de factura visible debajo del título');
    console.log('   - ✅ Espaciado mejorado (header de 130px)');
    console.log('   - ✅ Layout profesional y organizado');
    
    // Probar el nuevo layout
    await testImprovedLayout();
}

// Exportar funciones
window.testImprovedLayout = testImprovedLayout;
window.verifyLayout = verifyLayout;
window.compareLayouts = compareLayouts;

console.log('✅ Script cargado');
console.log('💡 Funciones:');
console.log('   - testImprovedLayout() - Probar layout mejorado');
console.log('   - verifyLayout() - Verificar elementos');
console.log('   - compareLayouts() - Comparar cambios');

// Auto-ejecutar
setTimeout(testImprovedLayout, 1000);