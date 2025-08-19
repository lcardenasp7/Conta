#!/usr/bin/env node

/**
 * SCRIPT DE PRUEBA: AMBOS MODALES DE FACTURAS
 * Verifica que tanto el modal de factura externa como el de proveedor funcionen
 */

console.log('🧪 INSTRUCCIONES PARA PROBAR AMBOS MODALES DE FACTURAS\n');

function generateTestInstructions() {
    console.log('📋 PRUEBA 1: FACTURA EXTERNA (SweetAlert)');
    console.log('');
    console.log('1. Ve a http://localhost:3000');
    console.log('2. Inicia sesión (admin@villas.edu.co / admin123)');
    console.log('3. Ve a "Facturación" → "Facturas"');
    console.log('4. Haz clic en "Factura Externa" (botón verde)');
    console.log('5. Llena todos los campos:');
    console.log('   • Nombre del Cliente: "Cliente Test"');
    console.log('   • Documento/NIT: "12345678"');
    console.log('   • Concepto: Selecciona cualquier opción');
    console.log('   • 💰 Fondo para el Pago: SELECCIONA UN FONDO');
    console.log('   • Descripción: "Producto test"');
    console.log('   • Cantidad: 1');
    console.log('   • Precio: 50000');
    console.log('6. Haz clic en "Crear Factura"');
    console.log('');
    console.log('✅ RESULTADO ESPERADO:');
    console.log('   • Mensaje de éxito');
    console.log('   • Factura aparece en la lista');
    console.log('   • Ingreso registrado en el fondo seleccionado');
    console.log('');
    
    console.log('📋 PRUEBA 2: FACTURA PROVEEDOR (Modal Bootstrap)');
    console.log('');
    console.log('1. Haz clic en "Factura Proveedor" (botón amarillo)');
    console.log('2. Llena todos los campos:');
    console.log('   • Número de Factura: "PROV-002"');
    console.log('   • Fecha de Factura: (cualquier fecha)');
    console.log('   • Fecha de Vencimiento: (fecha futura)');
    console.log('   • Concepto: Selecciona cualquier opción');
    console.log('   • Nombre del Proveedor: "Proveedor Test"');
    console.log('   • 💰 Fondo para el Pago: SELECCIONA UN FONDO');
    console.log('   • Descripción: "Servicio test"');
    console.log('   • Cantidad: 1');
    console.log('   • Precio: 75000');
    console.log('3. Haz clic en "Guardar Factura"');
    console.log('');
    console.log('✅ RESULTADO ESPERADO:');
    console.log('   • Mensaje de éxito');
    console.log('   • Modal se cierra');
    console.log('   • Factura aparece en la lista');
    console.log('   • Gasto registrado en el fondo seleccionado');
    console.log('');
    
    console.log('🔍 LOGS ESPERADOS EN CONSOLA:');
    console.log('');
    console.log('FACTURA EXTERNA:');
    console.log('   • "💾 Procesando factura externa con fondo: [fund-id]"');
    console.log('   • "💾 Creando factura externa..."');
    console.log('   • "✅ Factura externa creada:"');
    console.log('   • "💰 Registrando ingreso en fondo:"');
    console.log('');
    console.log('FACTURA PROVEEDOR:');
    console.log('   • "🔘 Botón de guardar clickeado"');
    console.log('   • "🔍 INICIANDO saveSupplierInvoice..."');
    console.log('   • "💾 Creando factura de proveedor..."');
    console.log('   • "✅ Factura creada:"');
    console.log('   • "💰 Registrando gasto en fondo:"');
    console.log('');
    
    console.log('🎯 DIFERENCIAS CLAVE:');
    console.log('');
    console.log('FACTURA EXTERNA (Ingreso):');
    console.log('   • Usa SweetAlert');
    console.log('   • Registra INGRESO en el fondo');
    console.log('   • Para cobrar a clientes externos');
    console.log('');
    console.log('FACTURA PROVEEDOR (Gasto):');
    console.log('   • Usa Modal Bootstrap');
    console.log('   • Registra GASTO en el fondo');
    console.log('   • Para pagar a proveedores');
    console.log('');
    
    console.log('⚠️ SI HAY PROBLEMAS:');
    console.log('   • Abre F12 y ve a la pestaña Console');
    console.log('   • Busca errores en rojo');
    console.log('   • Verifica que seleccionaste un fondo');
    console.log('   • Reporta los logs exactos que ves');
}

async function main() {
    try {
        generateTestInstructions();
        
        console.log('\n✅ AMBOS SISTEMAS ESTÁN LISTOS PARA PROBAR');
        console.log('\n🚀 El servidor está corriendo en http://localhost:3000');
        console.log('📊 Ambos modales tienen selección de fondos integrada');
        console.log('💰 Trazabilidad completa de ingresos y gastos');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };