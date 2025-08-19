console.log(`
🔍 DIAGNÓSTICO DEL SELECTOR DE FONDOS
====================================

Este script te ayudará a diagnosticar por qué el selector de fondos no aparece.

🛠️ PASOS DE DIAGNÓSTICO:
========================

1. 🌐 Abrir http://localhost:3000 en el navegador

2. 🔐 Iniciar sesión

3. 🔧 Abrir las herramientas de desarrollador (F12)

4. 📋 En la consola, ejecutar estos comandos uno por uno:

   // Verificar que FundSelectorModal esté cargado
   console.log('getFundSelector disponible:', typeof getFundSelector);
   
   // Verificar que la clase esté disponible
   console.log('FundSelectorModal disponible:', typeof FundSelectorModal);
   
   // Probar crear una instancia
   try {
       const selector = getFundSelector();
       console.log('✅ Selector creado exitosamente:', selector);
   } catch (error) {
       console.error('❌ Error creando selector:', error);
   }
   
   // Verificar que las funciones de pagos estén disponibles
   console.log('showFundSelectorForPayment disponible:', typeof showFundSelectorForPayment);
   
   // Verificar que las funciones de facturas estén disponibles
   console.log('showFundSelectorForSupplierInvoice disponible:', typeof showFundSelectorForSupplierInvoice);

5. 🧪 Probar manualmente el selector:

   // Probar mostrar el selector manualmente
   try {
       const selector = getFundSelector();
       selector.show({
           totalAmount: 100000,
           invoiceData: { concept: 'TEST', type: 'OUTGOING' },
           onConfirm: (selections) => {
               console.log('✅ Selecciones:', selections);
           }
       });
       console.log('✅ Selector mostrado manualmente');
   } catch (error) {
       console.error('❌ Error mostrando selector:', error);
   }

6. 🔍 Verificar rutas de API:

   // Probar cargar fondos
   fetch('/api/funds')
       .then(response => response.json())
       .then(data => console.log('✅ Fondos cargados:', data))
       .catch(error => console.error('❌ Error cargando fondos:', error));

🚨 POSIBLES PROBLEMAS Y SOLUCIONES:
==================================

❌ Si "getFundSelector" no está definido:
   → El archivo FundSelectorModal.js no se cargó
   → Verificar que esté incluido en index.html
   → Revisar errores de JavaScript en la consola

❌ Si "showFundSelectorForPayment" no está definido:
   → El archivo payments.js no se cargó correctamente
   → Verificar errores en payments.js

❌ Si "showFundSelectorForSupplierInvoice" no está definido:
   → El archivo invoices.js no se cargó correctamente
   → Verificar errores en invoices.js

❌ Si fetch('/api/funds') falla:
   → El servidor no está corriendo
   → Las rutas de fondos no están configuradas
   → Verificar que routes/funds.js esté incluido en server.js

❌ Si el selector no aparece al guardar:
   → Verificar que la función savePayment() esté llamando a showFundSelectorForPayment()
   → Verificar que la función saveSupplierInvoice() esté llamando a showFundSelectorForSupplierInvoice()
   → Revisar errores en la consola durante el proceso de guardado

🎯 FLUJO ESPERADO:
==================

1. Usuario llena formulario
2. Hace clic en "Guardar"
3. Se ejecuta savePayment() o saveSupplierInvoice()
4. Se llama a showFundSelectorForPayment() o showFundSelectorForSupplierInvoice()
5. Se llama a getFundSelector().show()
6. Aparece el modal del selector de fondos

📞 REPORTAR RESULTADOS:
======================

Después de ejecutar estos diagnósticos, reporta:

✅ Qué funciones están disponibles
✅ Qué errores aparecen en la consola
✅ Si el selector aparece manualmente
✅ Si las rutas de API funcionan
✅ En qué paso específico falla el proceso

¡Con esta información podremos identificar exactamente dónde está el problema!
`);

console.log('🔍 Diagnóstico generado. Sigue las instrucciones en el navegador.');