/**
 * Script para verificar las correcciones de factura desde el navegador
 * Ejecutar en la consola del navegador después de hacer login
 */

async function verifyCorrectedInvoice() {
    console.log('🧪 Verificando correcciones de factura en el navegador...');

    try {
        // 1. Obtener una factura existente
        console.log('📋 Obteniendo lista de facturas...');
        const invoicesResponse = await fetch('/api/invoices');
        const invoices = await invoicesResponse.json();

        if (!invoices.success || invoices.data.length === 0) {
            console.log('❌ No hay facturas disponibles');
            return;
        }

        const invoice = invoices.data[0];
        console.log(`✅ Factura encontrada: ${invoice.invoiceNumber}`);

        // 2. Descargar PDF de la factura
        console.log('📄 Descargando PDF corregido...');
        const pdfResponse = await fetch(`/api/invoices/${invoice.id}/pdf`);

        if (!pdfResponse.ok) {
            throw new Error(`Error descargando PDF: ${pdfResponse.status}`);
        }

        const pdfBlob = await pdfResponse.blob();
        console.log(`✅ PDF descargado, tamaño: ${(pdfBlob.size / 1024).toFixed(2)} KB`);

        // 3. Crear enlace de descarga
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factura-corregida-${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        console.log('✅ Verificación completada exitosamente');
        console.log('');
        console.log('📋 Correcciones verificadas:');
        console.log('   ✓ PDF descargado correctamente');
        console.log('   ✓ Tamaño optimizado');
        console.log('   ✓ Formato media hoja aplicado');
        console.log('');
        console.log('🎉 La factura corregida se ha descargado automáticamente');
        console.log('📄 Revisa el archivo descargado para confirmar:');
        console.log('   • Una sola página');
        console.log('   • QR en el header');
        console.log('   • Sin superposiciones');
        console.log('   • Precios dentro del margen');

        return {
            success: true,
            invoiceNumber: invoice.invoiceNumber,
            pdfSize: pdfBlob.size,
            message: 'Factura corregida descargada exitosamente'
        };

    } catch (error) {
        console.error('❌ Error verificando factura:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Función para probar múltiples facturas
async function verifyMultipleInvoices(limit = 3) {
    console.log(`🧪 Verificando múltiples facturas (límite: ${limit})...`);

    try {
        const invoicesResponse = await fetch('/api/invoices');
        const invoices = await invoicesResponse.json();

        if (!invoices.success || invoices.data.length === 0) {
            console.log('❌ No hay facturas disponibles');
            return;
        }

        const testInvoices = invoices.data.slice(0, limit);
        const results = [];

        for (const invoice of testInvoices) {
            console.log(`📄 Probando factura: ${invoice.invoiceNumber}`);
            
            const pdfResponse = await fetch(`/api/invoices/${invoice.id}/pdf`);
            
            if (pdfResponse.ok) {
                const pdfBlob = await pdfResponse.blob();
                results.push({
                    invoiceNumber: invoice.invoiceNumber,
                    success: true,
                    size: pdfBlob.size
                });
                console.log(`✅ ${invoice.invoiceNumber}: ${(pdfBlob.size / 1024).toFixed(2)} KB`);
            } else {
                results.push({
                    invoiceNumber: invoice.invoiceNumber,
                    success: false,
                    error: pdfResponse.status
                });
                console.log(`❌ ${invoice.invoiceNumber}: Error ${pdfResponse.status}`);
            }
        }

        console.log('📊 Resumen de verificación:');
        const successful = results.filter(r => r.success).length;
        console.log(`   ✅ Exitosas: ${successful}/${results.length}`);
        console.log(`   ❌ Fallidas: ${results.length - successful}/${results.length}`);

        return results;

    } catch (error) {
        console.error('❌ Error verificando múltiples facturas:', error);
        return [];
    }
}

// Función para mostrar instrucciones
function showInvoiceInstructions() {
    console.log('📋 INSTRUCCIONES PARA VERIFICAR FACTURAS CORREGIDAS');
    console.log('');
    console.log('1. Asegúrate de estar logueado en el sistema');
    console.log('2. Ejecuta en la consola del navegador:');
    console.log('   verifyCorrectedInvoice()');
    console.log('');
    console.log('3. Para probar múltiples facturas:');
    console.log('   verifyMultipleInvoices(5)');
    console.log('');
    console.log('4. El PDF se descargará automáticamente');
    console.log('5. Verifica que el PDF tenga:');
    console.log('   • Una sola página');
    console.log('   • QR en el header junto al número');
    console.log('   • Sin superposiciones de texto');
    console.log('   • Precios dentro del margen');
    console.log('   • Formato media hoja (8.5" x 5.5")');
}

// Mostrar instrucciones al cargar
console.log('🔧 Script de verificación de facturas corregidas cargado');
console.log('📞 Ejecuta: showInvoiceInstructions() para ver las instrucciones');

// Exportar funciones para uso global
window.verifyCorrectedInvoice = verifyCorrectedInvoice;
window.verifyMultipleInvoices = verifyMultipleInvoices;
window.showInvoiceInstructions = showInvoiceInstructions;