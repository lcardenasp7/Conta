# Requirements Document - Integración de Pagos de Eventos

## Introduction

El sistema actual de gestión de eventos tiene una desconexión lógica entre las asignaciones de estudiantes a eventos y el registro de pagos. El modal de "Registrar Pago de Evento" permite buscar cualquier estudiante, pero debería estar limitado y conectado específicamente con los estudiantes asignados al evento, para mantener un control adecuado de los pagos y el progreso del evento.

## Requirements

### Requirement 1: Conexión Directa con Asignaciones de Evento

**User Story:** Como coordinador de eventos, quiero que el modal de registro de pagos solo muestre los estudiantes asignados al evento específico, para evitar errores y mantener la integridad de los datos.

#### Acceptance Criteria

1. WHEN abro el modal de "Registrar Pago" desde un evento específico THEN el sistema SHALL mostrar solo los estudiantes asignados a ese evento
2. WHEN selecciono un estudiante de la lista THEN el sistema SHALL mostrar automáticamente la información de su asignación (boletos asignados, vendidos, monto pendiente)
3. WHEN un estudiante ya ha pagado completamente su asignación THEN el sistema SHALL mostrar su estado como "Completado" y no permitir pagos adicionales
4. IF un estudiante tiene pagos parciales THEN el sistema SHALL mostrar el monto restante pendiente

### Requirement 2: Información Contextual de la Asignación

**User Story:** Como usuario del sistema, quiero ver la información completa de la asignación del estudiante al registrar un pago, para tomar decisiones informadas sobre el monto a registrar.

#### Acceptance Criteria

1. WHEN selecciono un estudiante THEN el sistema SHALL mostrar:
   - Nombre completo del estudiante
   - Grado y grupo
   - Boletos asignados
   - Boletos vendidos
   - Monto total esperado
   - Monto ya pagado
   - Monto pendiente
2. WHEN el monto ingresado excede el monto pendiente THEN el sistema SHALL mostrar una advertencia
3. WHEN registro un pago THEN el sistema SHALL actualizar automáticamente el estado de la asignación

### Requirement 3: Validación y Control de Pagos

**User Story:** Como administrador, quiero que el sistema valide automáticamente los pagos contra las asignaciones para evitar inconsistencias en los datos.

#### Acceptance Criteria

1. WHEN registro un pago THEN el sistema SHALL validar que el estudiante esté asignado al evento
2. WHEN el pago completa la asignación THEN el sistema SHALL actualizar el estado a "COMPLETED"
3. WHEN registro un pago parcial THEN el sistema SHALL actualizar el campo "amountRaised" en la asignación
4. WHEN todos los estudiantes completen sus pagos THEN el sistema SHALL actualizar el "totalRaised" del evento

### Requirement 4: Interfaz Mejorada de Selección

**User Story:** Como usuario, quiero una interfaz clara que me muestre el estado de cada estudiante asignado, para identificar rápidamente quién necesita registrar pagos.

#### Acceptance Criteria

1. WHEN abro el modal de pagos THEN el sistema SHALL mostrar una lista de estudiantes con indicadores visuales:
   - Verde: Pago completado
   - Amarillo: Pago parcial
   - Rojo: Sin pagos
2. WHEN filtro por estado de pago THEN el sistema SHALL mostrar solo los estudiantes que coincidan con el filtro
3. WHEN busco por nombre THEN el sistema SHALL filtrar dentro de los estudiantes asignados al evento

### Requirement 5: Actualización en Tiempo Real

**User Story:** Como coordinador, quiero que las estadísticas del evento se actualicen automáticamente cuando registro pagos, para tener información actualizada en tiempo real.

#### Acceptance Criteria

1. WHEN registro un pago THEN el sistema SHALL actualizar inmediatamente:
   - El progreso de recaudación del evento
   - El estado de la asignación del estudiante
   - Las estadísticas generales del evento
2. WHEN cancelo un pago THEN el sistema SHALL revertir automáticamente las actualizaciones
3. WHEN hay múltiples usuarios registrando pagos THEN el sistema SHALL sincronizar los cambios en tiempo real

### Requirement 6: Historial de Pagos por Asignación

**User Story:** Como auditor, quiero ver el historial completo de pagos de cada estudiante en el evento, para realizar seguimiento y auditorías.

#### Acceptance Criteria

1. WHEN veo los detalles de una asignación THEN el sistema SHALL mostrar todos los pagos registrados
2. WHEN un pago es cancelado THEN el sistema SHALL mantener el registro con estado "CANCELLED"
3. WHEN genero reportes del evento THEN el sistema SHALL incluir el detalle de pagos por estudiante
4. WHEN exporto datos THEN el sistema SHALL incluir la trazabilidad completa de pagos

## Technical Considerations

- La integración debe mantener la integridad referencial entre Payment, EventAssignment y Event
- Los pagos de eventos deben estar claramente diferenciados de otros tipos de pagos
- La interfaz debe ser responsive y funcionar en dispositivos móviles
- Las validaciones deben ser tanto en frontend como backend
- Los cambios deben ser auditables y trazables

## Success Criteria

- Eliminación de pagos erróneos a estudiantes no asignados
- Reducción del tiempo de registro de pagos en un 50%
- Mejora en la precisión de las estadísticas de eventos
- Interfaz intuitiva que no requiera capacitación adicional
- Integración completa con el sistema de reportes existente