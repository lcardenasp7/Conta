console.log(`
🔄 NUEVO ENFOQUE PARA EL SELECTOR DE FONDOS
==========================================

He cambiado completamente la lógica para evitar que el modal desaparezca:

✅ CAMBIOS APLICADOS:
====================

1. 🔧 El selector de fondos ahora se muestra INMEDIATAMENTE después de validar la factura
2. 🔧 NO se cierra el modal original hasta que el usuario confirme en el selector
3. 🔧 Simplificado la lógica para evitar problemas de async/await
4. 🔧 Agregado función de fallback si el selector no está disponible
5. 🔧 Creado función centralizada para cerrar modal y limpiar formulario

📋 FLUJO NUEVO:
===============

ANTES (problemático):
Usuario → Llena formulario → Clic "Crear Factura" → Modal se cierra → Selector aparece (pero no se ve)

AHORA (corregido):
Usuario → Llena formulario → Clic "Crear Factura" → Selector aparece INMEDIATAMENTE → Usuario selecciona fondos → Se procesa todo → Modal se cierra

🧪 PRUEBA ESTO AHORA:
====================

1. 🚀 Asegúrate de que el servidor esté corriendo:
   node server.js

2. 🌐 Abrir http://localhost:3000

3. 🔐 Iniciar sesión:
   rector@villasanpablo.edu.co / VillasSP2024!

4. 📄 Crear Factura de Proveedor:
   a) Ir a "Facturación" → "Facturas"
   b) Hacer clic en "Factura Proveedor"
   c) Llenar TODOS los datos requeridos:
      - Nombre: "Proveedor Test"
      - Documento: "123456789"
      - Email: "test@test.com" (opcional)
      - Teléfono: "123456789" (opcional)
      - Concepto: Seleccionar "Mantenimiento"
      - Fecha de vencimiento: Cualquier fecha futura
      - Agregar un item:
        * Descripción: "Reparación de equipos"
        * Cantidad: 1
        * Precio: 100000
   d) Hacer clic en "Crear Factura"
   e) 🎯 EL SELECTOR DE FONDOS DEBE APARECER INMEDIATAMENTE
   f) Debes ver una lista de fondos con sus saldos
   g) Seleccionar "Fondo Operacional" (que tiene $500,000)
   h) El monto $100,000 debe aparecer automáticamente
   i) Hacer clic en "Confirmar Selección"
   j) Debe mostrar mensaje de éxito y cerrar ambos modales

🔍 QUÉ BUSCAR EN LA CONSOLA:
============================

Debes ver estos mensajes en orden:
1. "🎯 Mostrando selector de fondos para factura de proveedor"
2. "🎯 Mostrando selector de fondos: Object"
3. "📋 Cargando fondos disponibles..."
4. "✅ Cargados X fondos"
5. "✅ Fondos seleccionados: [array con selecciones]"

🚨 SI AÚN NO FUNCIONA:
=====================

Reporta exactamente:
- ¿Aparece el selector de fondos?
- ¿Qué mensajes ves en la consola?
- ¿En qué paso específico falla?
- ¿Hay errores en rojo en la consola?

🎯 ESTE ENFOQUE DEBERÍA FUNCIONAR:
=================================

La diferencia clave es que ahora:
- ✅ NO cerramos el modal original hasta el final
- ✅ Mostramos el selector INMEDIATAMENTE
- ✅ El selector aparece ENCIMA del modal original
- ✅ Solo cerramos todo cuando el usuario confirma

¡Prueba esto y me dices si ahora sí aparece el selector!
`);

console.log('🔄 Nuevo enfoque implementado. ¡Prueba crear una factura de proveedor ahora!');