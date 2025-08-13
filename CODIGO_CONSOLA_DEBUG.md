# Código para Debuggear en la Consola

## 🚀 Instrucciones

1. Abre la consola del navegador (F12 → Console)
2. Copia y pega el siguiente código completo
3. Presiona Enter
4. Observa los resultados

## 📋 Código para Copiar y Pegar

```javascript
// DIAGNÓSTICO INMEDIATO DE DESCARGA PDF
(async function() {
    console.log('🔍 DIAGNÓSTICO INMEDIATO DE DESCARGA PDF');
    console.log('==========================================');
    
    try {
        // 1. Verificar token
        const token = localStorage.getItem('token');
        console.log('🔑 Token:', token ? '✅ Disponible' : '❌ NO DISPONIBLE');
        
        if (!token) {
            console.error('❌ PROBLEMA: No hay token de autenticación');
            return;
        }
        
        // 2. Obtener facturas
        console.log('\n📋 Obteniendo facturas...');
        const invoicesResponse = await fetch('/api/invoices?limit=1', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('📊 Status facturas:', invoicesResponse.status);
        
        if (!invoicesResponse.ok) {
            console.error('❌ PROBLEMA: No se pueden obtener facturas');
            const errorText = await invoicesResponse.text();
            console.log('📄 Error:', errorText);
            return;
        }
        
        const invoicesData = await invoicesResponse.json();
        console.log('📄 Facturas encontradas:', invoicesData.invoices?.length || 0);
        
        if (!invoicesData.invoices || invoicesData.invoices.length === 0) {
            console.error('❌ PROBLEMA: No hay facturas disponibles');
            return;
        }
        
        const invoice = invoicesData.invoices[0];
        console.log('🎯 Factura seleccionada:', invoice.invoiceNumber);
        console.log('🆔 ID:', invoice.id);
        
        // 3. Probar endpoint PDF
        console.log('\n📥 Probando endpoint PDF...');
        const pdfUrl = `/api/invoices/${invoice.id}/pdf`;
        console.log('🔗 URL:', pdfUrl);
        
        const startTime = Date.now();
        
        const pdfResponse = await fetch(pdfUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const responseTime = Date.now() - startTime;
        console.log('⏱️ Tiempo respuesta:', responseTime, 'ms');
        console.log('📊 Status:', pdfResponse.status);
        console.log('📊 OK:', pdfResponse.ok);
        
        // Mostrar headers importantes
        const contentType = pdfResponse.headers.get('content-type');
        const contentLength = pdfResponse.headers.get('content-length');
        
        console.log('📋 Headers importantes:');
        console.log('   Content-Type:', contentType);
        console.log('   Content-Length:', contentLength);
        
        if (!pdfResponse.ok) {
            console.error('❌ PROBLEMA: Error en respuesta PDF');
            const errorText = await pdfResponse.text();
            console.log('📄 Error response:', errorText);
            return;
        }
        
        // 4. Procesar blob
        console.log('\n📦 Procesando blob...');
        const blob = await pdfResponse.blob();
        
        console.log('📦 Blob size:', blob.size, 'bytes');
        console.log('📦 Blob type:', blob.type);
        
        if (blob.size === 0) {
            console.error('❌ PROBLEMA: Blob vacío');
            return;
        }
        
        // 5. Intentar descarga
        console.log('\n💾 Intentando descarga...');
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DEBUG_${invoice.invoiceNumber}.pdf`;
        
        document.body.appendChild(a);
        console.log('📎 Elemento agregado al DOM');
        
        // Intentar click
        console.log('🖱️ Ejecutando click...');
        a.click();
        
        // Limpiar después de un momento
        setTimeout(() => {
            if (document.body.contains(a)) {
                document.body.removeChild(a);
            }
            URL.revokeObjectURL(url);
            
            console.log('\n✅ DIAGNÓSTICO COMPLETADO');
            console.log('💡 Si no se descargó, revisar configuración del navegador');
            
        }, 1000);
        
    } catch (error) {
        console.error('❌ ERROR EN DIAGNÓSTICO:', error);
        console.error('📄 Stack trace:', error.stack);
    }
})();
```

## 🔍 Qué Buscar en los Resultados

### ✅ Resultados Esperados (Todo OK)
```
🔑 Token: ✅ Disponible
📊 Status facturas: 200
📄 Facturas encontradas: 1
🎯 Factura seleccionada: FAC-2025-000016
📊 Status: 200
📊 OK: true
📋 Headers importantes:
   Content-Type: application/pdf
   Content-Length: [número]
📦 Blob size: [número] bytes
📦 Blob type: application/pdf
✅ DIAGNÓSTICO COMPLETADO
```

### ❌ Problemas Posibles

**1. No hay token:**
```
🔑 Token: ❌ NO DISPONIBLE
❌ PROBLEMA: No hay token de autenticación
```
**Solución:** Hacer login nuevamente

**2. Error en facturas:**
```
📊 Status facturas: 401
❌ PROBLEMA: No se pueden obtener facturas
```
**Solución:** Token expirado, hacer login nuevamente

**3. Error en PDF:**
```
📊 Status: 500
❌ PROBLEMA: Error en respuesta PDF
```
**Solución:** Revisar logs del servidor

**4. Blob vacío:**
```
📦 Blob size: 0 bytes
❌ PROBLEMA: Blob vacío
```
**Solución:** Error en generación de PDF en el servidor

## 🛠️ Acciones Según Resultados

### Si todo se ve bien pero no descarga:
1. Revisar configuración de descargas del navegador
2. Verificar si hay bloqueador de pop-ups activo
3. Probar en modo incógnito
4. Probar en otro navegador

### Si hay errores de servidor:
1. Revisar logs del servidor en la terminal
2. Verificar que el servicio de PDF esté funcionando
3. Comprobar que la factura existe en la base de datos

### Si hay errores de autenticación:
1. Hacer logout y login nuevamente
2. Verificar que el usuario tenga permisos
3. Comprobar que el token no haya expirado

## 📞 Reportar Resultados

Cuando ejecutes el código, comparte:
1. ✅ Los mensajes que aparecen en verde
2. ❌ Los mensajes de error en rojo
3. 📊 Los números de status y tamaños
4. 🖥️ Qué navegador estás usando

Esto me ayudará a identificar exactamente dónde está el problema.