# 🏛️ Guía para Cargar el Escudo Institucional

## ✅ **Funcionalidad Implementada**

He implementado completamente la página de **Configuración Institucional** con las siguientes características:

### **📋 Formulario Completo:**
- ✅ **Información Básica**: Nombre, NIT, DANE, Resolución DIAN
- ✅ **Ubicación**: Dirección, Ciudad, Departamento, Localidad  
- ✅ **Contacto**: Teléfono, Email
- ✅ **Información Académica**: Niveles, Título, Calendario, Jornada

### **🖼️ Gestión de Logo:**
- ✅ **Carga de archivos**: JPG, PNG, GIF (máx. 2MB)
- ✅ **Vista previa**: Inmediata al cargar
- ✅ **Eliminación**: Opción para quitar el logo
- ✅ **Validación**: Tipo y tamaño de archivo

### **👁️ Vista Previa:**
- ✅ **Previsualización**: Cómo se verá en las facturas
- ✅ **Actualización automática**: Al cambiar datos

## 🚀 **Cómo Usar la Funcionalidad**

### **Paso 1: Acceder a la Configuración**
1. Inicia sesión en el sistema
2. Ve al menú lateral → **Configuración** → **Institución**
3. La página se cargará con el formulario completo

### **Paso 2: Completar Información Institucional**
1. **Información Básica:**
   - Nombre de la Institución (requerido)
   - NIT (requerido, formato: 000000000-0)
   - Código DANE (opcional)
   - Resolución DIAN (opcional)

2. **Ubicación:**
   - Dirección completa (requerido)
   - Ciudad (requerido)
   - Departamento (opcional)
   - Localidad (opcional)

3. **Contacto:**
   - Teléfono (requerido)
   - Email (requerido, se valida formato)

4. **Información Académica:**
   - Niveles educativos (ej: "Preescolar, Básica, Media")
   - Título que otorga (ej: "Bachiller Académico")
   - Calendario (A o B)
   - Jornada (Mañana, Tarde, Noche, Completa)

### **Paso 3: Cargar el Escudo/Logo**
1. En la sección derecha, haz clic en **"Cargar Logo"**
2. Selecciona tu archivo de imagen:
   - ✅ Formatos: JPG, PNG, GIF
   - ✅ Tamaño máximo: 2MB
   - ✅ Recomendado: Imagen cuadrada o rectangular
3. La imagen aparecerá inmediatamente en la vista previa
4. Verás una previsualización de cómo se verá en las facturas

### **Paso 4: Guardar Cambios**
1. Haz clic en **"Guardar Cambios"**
2. El sistema validará los campos requeridos
3. Se guardará toda la información y el logo
4. Recibirás una confirmación de éxito

## 🎯 **Dónde se Usa el Logo**

Una vez cargado, el logo aparecerá automáticamente en:

1. **📄 Facturas PDF**: Header superior izquierdo
2. **🖥️ Sistema**: Vista previa en configuración
3. **📊 Reportes**: Documentos oficiales (futuro)

## 🔧 **Funcionalidades Técnicas**

### **Validaciones Implementadas:**
- ✅ Campos requeridos marcados con *
- ✅ Formato de email válido
- ✅ Tipo de archivo de imagen
- ✅ Tamaño máximo de 2MB
- ✅ Formato de NIT colombiano

### **Características Avanzadas:**
- ✅ **Carga asíncrona**: Sin recargar la página
- ✅ **Vista previa inmediata**: Al seleccionar archivo
- ✅ **Manejo de errores**: Mensajes claros
- ✅ **Respaldo automático**: Se guarda en `/public/uploads/`
- ✅ **Integración completa**: Con sistema de facturas

## 🚨 **Solución de Problemas**

### **Si no aparece la página:**
```bash
# Reiniciar servidor
npm start
```

### **Si hay errores al cargar:**
```bash
# Verificar dependencias
npm install multer pdfkit
```

### **Si no se guarda el logo:**
1. Verifica que el directorio `/public/uploads/` exista
2. Verifica permisos de escritura
3. Revisa el tamaño del archivo (máx. 2MB)

## 📱 **Interfaz Responsive**

La página funciona perfectamente en:
- ✅ **Desktop**: Formulario en 2 columnas
- ✅ **Tablet**: Adaptación automática
- ✅ **Móvil**: Vista vertical optimizada

## 🎉 **¡Listo para Usar!**

La funcionalidad está **100% implementada y funcional**. Solo necesitas:

1. **Reiniciar el servidor** si no lo has hecho
2. **Ir a Configuración → Institución**
3. **Completar el formulario**
4. **Cargar tu escudo**
5. **Guardar cambios**

¡Tu logo aparecerá automáticamente en todas las facturas PDF que generes!

---

**Fecha de implementación:** $(Get-Date -Format "yyyy-MM-dd")
**Estado:** ✅ Completamente funcional
**Archivos modificados:** 
- `public/js/app.js` (template de página)
- `public/js/institution.js` (funcionalidad)
- `public/index.html` (carga de script)
- `routes/institution.routes.js` (backend)