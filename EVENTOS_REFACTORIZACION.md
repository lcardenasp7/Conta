# Refactorización del Módulo de Eventos

## Estructura Anterior vs Nueva

### Antes (Archivo único)
- `public/js/events.js` - Contenía toda la funcionalidad (3000+ líneas)

### Después (Módulos separados)
- `public/js/events-core.js` - Funcionalidad principal de eventos
- `public/js/event-assignments.js` - Gestión de asignaciones y pagos
- `public/js/event-reports.js` - Reportes y estadísticas
- `public/js/events.js` - Archivo principal (mantiene compatibilidad)

## Funcionalidades por Módulo

### 1. events-core.js
**Responsabilidades:**
- Inicialización del módulo principal
- CRUD básico de eventos
- Lista de eventos con filtros
- Modales de creación/edición de eventos
- Estadísticas generales

**Funciones principales:**
- `initEvents()` - Inicialización principal
- `loadEventsMainTemplate()` - Template principal con tabs
- `showCreateEventModal()` - Modal de crear evento
- `saveEvent()` - Guardar/actualizar evento
- `searchEvents()` - Búsqueda y filtros

### 2. event-assignments.js
**Responsabilidades:**
- Gestión de asignaciones de boletos
- Asignación individual y masiva
- Registro de pagos de eventos
- Búsqueda de estudiantes con asignaciones

**Funciones principales:**
- `initEventAssignments()` - Inicialización del módulo
- `selectEventForAssignments()` - Seleccionar evento para gestionar
- `showAssignmentModal()` - Modal de asignación individual
- `showBulkAssignmentModal()` - Modal de asignación masiva
- `showEventPaymentModal()` - Modal de registro de pagos
- `searchStudentsForPayment()` - Búsqueda de estudiantes para pagos

### 3. event-reports.js
**Responsabilidades:**
- Generación de reportes y estadísticas
- Gráficos con Chart.js
- Exportación de datos
- Análisis de rendimiento

**Funciones principales:**
- `initEventReports()` - Inicialización del módulo
- `generateEventReports()` - Generar reportes
- `generateCharts()` - Crear gráficos
- `exportEventReports()` - Exportar datos

## Mejoras Implementadas

### 1. Conexión Correcta de Pagos con Estudiantes
**Problema anterior:** El modal de registro de pagos no estaba conectado correctamente con los estudiantes.

**Solución implementada:**
- Búsqueda inteligente que filtra estudiantes con asignaciones
- Información detallada del estudiante y su asignación
- Cálculo automático de montos pendientes
- Validación de que el estudiante tenga asignación en el evento

### 2. Estructura Modular
**Beneficios:**
- Código más mantenible y organizado
- Carga bajo demanda de funcionalidades
- Mejor separación de responsabilidades
- Facilita el trabajo en equipo

### 3. Navegación Mejorada
**Nuevas opciones en el menú:**
- Gestión de Eventos (funcionalidad principal)
- Asignaciones (gestión de boletos y pagos)
- Reportes de Eventos (análisis y estadísticas)

## Flujo de Trabajo Mejorado

### Para Registrar un Pago:
1. Ir a "Eventos Escolares" → "Asignaciones"
2. Seleccionar el evento
3. Hacer clic en "Registrar Pago"
4. Buscar el estudiante (solo muestra estudiantes con asignación)
5. El sistema muestra automáticamente:
   - Información del estudiante
   - Boletos asignados vs vendidos
   - Monto pendiente
6. Completar datos del pago y guardar

### Para Asignaciones Masivas:
1. Seleccionar evento
2. Hacer clic en "Asignación Masiva"
3. Elegir tipo: Por Grado, Por Grupo, o Mixto
4. Seleccionar grados/grupos
5. Definir cantidad de boletos por estudiante
6. Vista previa antes de confirmar

## Archivos Modificados

### Nuevos archivos:
- `public/js/events-core.js`
- `public/js/event-assignments.js`
- `public/js/event-reports.js`
- `EVENTOS_REFACTORIZACION.md`

### Archivos modificados:
- `public/js/events.js` (simplificado)
- `public/index.html` (referencias a nuevos scripts)
- `public/js/app.js` (manejo de nuevas páginas)

## Compatibilidad

La refactorización mantiene compatibilidad con:
- API existente (routes/event.routes.js)
- Base de datos (prisma/schema.prisma)
- Funcionalidades existentes

## Próximos Pasos

1. **Testing:** Probar todas las funcionalidades en cada módulo
2. **Optimización:** Revisar rendimiento de carga de módulos
3. **Documentación:** Completar documentación de API
4. **Validaciones:** Agregar más validaciones en formularios
5. **UX/UI:** Mejorar experiencia de usuario en modales

## Notas Técnicas

### Carga de Módulos:
Los módulos se cargan en este orden:
1. `events-core.js` (funcionalidad base)
2. `event-assignments.js` (asignaciones)
3. `event-reports.js` (reportes)
4. `events.js` (compatibilidad)

### Dependencias:
- Bootstrap 5.3+ (UI)
- Chart.js (gráficos)
- SweetAlert2 (alertas)
- API personalizada (comunicación con backend)

### Variables Globales:
- `selectedEventForAssignments` - Evento seleccionado para asignaciones
- `assignmentsData` - Datos de asignaciones del evento actual
- `reportsData` - Datos para reportes
- `eventsData` - Lista de eventos

Esta refactorización mejora significativamente la organización del código y corrige el problema de conexión entre pagos y estudiantes que mencionaste.