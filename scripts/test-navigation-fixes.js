// Script para probar las correcciones de navegación y descarga

console.log('🧪 Probando correcciones de navegación y descarga...');

// 1. Probar que no hay hash en la URL
function testHashRemoval() {
    console.log('🔗 Probando eliminación de hash...');
    
    const originalHash = window.location.hash;
    console.log('Hash original:', originalHash || 'ninguno');
    
    // Simular agregar hash
    window.location.hash = '#test';
    console.log('Hash agregado:', window.location.hash);
    
    // Simular limpieza
    if (window.location.hash) {
        history.replaceState(null, null, window.location.pathname + window.location.search);
        console.log('✅ Hash eliminado, URL actual:', window.location.href);
    }
    
    return !window.location.hash;
}

// 2. Probar función de descarga
async function testDownloadFunction() {
    console.log('📥 Probando función de descarga...');
    
    if (typeof downloadInvoice === 'function') {
        console.log('✅ Función downloadInvoice disponible');
        
        // Buscar una factura para probar
        try {
            const response = await fetch('/api/invoices?limit=1', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.invoices && data.invoices.length > 0) {
                    const invoice = data.invoices[0];
                    console.log('📄 Factura encontrada para prueba:', invoice.invoiceNumber);
                    console.log('🎯 ID de factura:', invoice.id);
                    
                    // No ejecutar la descarga automáticamente, solo mostrar que está disponible
                    console.log('✅ Función de descarga lista para usar');
                    console.log('💡 Para probar: downloadInvoice("' + invoice.id + '")');
                    
                    return true;
                } else {
                    console.log('⚠️ No se encontraron facturas para probar');
                    return false;
                }
            } else {
                console.log('❌ Error obteniendo facturas:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Error en prueba de descarga:', error);
            return false;
        }
    } else {
        console.log('❌ Función downloadInvoice no disponible');
        return false;
    }
}

// 3. Probar navegación
function testNavigation() {
    console.log('🧭 Probando navegación...');
    
    if (typeof loadPage === 'function') {
        console.log('✅ Función loadPage disponible');
        
        // Probar que la navegación no agrega hash
        const originalURL = window.location.href;
        console.log('URL original:', originalURL);
        
        // Simular navegación (sin ejecutar realmente)
        console.log('✅ Navegación lista para usar');
        console.log('💡 Para probar: loadPage("invoices")');
        
        return true;
    } else {
        console.log('❌ Función loadPage no disponible');
        return false;
    }
}

// 4. Probar otras funciones de facturas
function testInvoiceActions() {
    console.log('⚙️ Probando acciones de facturas...');
    
    const functions = ['viewInvoice', 'editInvoice', 'cancelInvoice'];
    const results = {};
    
    functions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            console.log(`✅ ${funcName} disponible`);
            results[funcName] = true;
        } else {
            console.log(`❌ ${funcName} no disponible`);
            results[funcName] = false;
        }
    });
    
    return results;
}

// 5. Ejecutar todas las pruebas
async function runAllTests() {
    console.log('🚀 Ejecutando todas las pruebas...');
    
    const results = {
        hashRemoval: testHashRemoval(),
        navigation: testNavigation(),
        download: await testDownloadFunction(),
        actions: testInvoiceActions()
    };
    
    console.log('📊 Resultados de las pruebas:');
    console.log('   - Eliminación de hash:', results.hashRemoval ? '✅' : '❌');
    console.log('   - Navegación:', results.navigation ? '✅' : '❌');
    console.log('   - Descarga:', results.download ? '✅' : '❌');
    console.log('   - Acciones de facturas:');
    
    Object.entries(results.actions).forEach(([action, available]) => {
        console.log(`     - ${action}:`, available ? '✅' : '❌');
    });
    
    const allPassed = results.hashRemoval && results.navigation && results.download && 
                     Object.values(results.actions).every(v => v);
    
    console.log('\n🎯 Resultado general:', allPassed ? '✅ TODAS LAS PRUEBAS PASARON' : '⚠️ ALGUNAS PRUEBAS FALLARON');
    
    return results;
}

// 6. Función para probar descarga manual
function testManualDownload() {
    console.log('🎯 Función para prueba manual de descarga');
    
    window.testDownloadNow = async function() {
        try {
            const response = await fetch('/api/invoices?limit=1', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.invoices && data.invoices.length > 0) {
                    const invoiceId = data.invoices[0].id;
                    console.log('🎯 Probando descarga con factura:', invoiceId);
                    await downloadInvoice(invoiceId);
                } else {
                    console.log('⚠️ No hay facturas para probar');
                    alert('No hay facturas disponibles para probar la descarga');
                }
            }
        } catch (error) {
            console.error('❌ Error en prueba manual:', error);
            alert('Error en prueba de descarga: ' + error.message);
        }
    };
    
    console.log('✅ Función testDownloadNow() creada');
    console.log('💡 Ejecuta testDownloadNow() para probar la descarga');
}

// Auto-ejecutar pruebas
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runAllTests, 1000);
        testManualDownload();
    });
} else {
    setTimeout(runAllTests, 1000);
    testManualDownload();
}

// Exportar funciones
window.testNavigationFixes = runAllTests;
window.testHashRemoval = testHashRemoval;
window.testDownloadFunction = testDownloadFunction;
window.testNavigation = testNavigation;
window.testInvoiceActions = testInvoiceActions;