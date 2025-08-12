# Implementation Plan - Integración de Pagos de Eventos

## Backend Implementation

- [ ] 1. Crear servicio de pagos de eventos
  - Implementar EventPaymentService con métodos de cálculo de montos
  - Agregar validaciones de asignación y límites de pago
  - Implementar actualización automática de estadísticas del evento
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 1.1 Implementar cálculo de montos de asignación
  - Crear método calculateAssignmentAmounts() que calcule expectedAmount, pendingAmount y paymentStatus
  - Implementar lógica de determinación de estado de pago (PENDING/PARTIAL/COMPLETED)
  - Agregar validación de montos contra boletos asignados
  - _Requirements: 2.1, 2.2_

- [ ] 1.2 Crear endpoint para obtener asignaciones con estado de pago
  - Implementar GET /api/events/:eventId/assignments/payment-status
  - Incluir información completa del estudiante (grado, grupo)
  - Agregar historial de pagos por asignación
  - Optimizar query con includes necesarios
  - _Requirements: 2.1, 6.1, 6.2_

- [ ] 1.3 Mejorar endpoint de creación de pagos de eventos
  - Modificar POST /api/events/:eventId/payments para requerir assignmentId
  - Implementar validación de que el estudiante esté asignado al evento
  - Agregar actualización automática de EventAssignment.amountRaised
  - Implementar recálculo de Event.totalRaised
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 1.4 Implementar validaciones de negocio
  - Validar que el estudiante esté asignado al evento antes de crear pago
  - Implementar advertencia cuando el pago excede el monto pendiente
  - Prevenir pagos en asignaciones ya completadas
  - Agregar manejo de concurrencia para pagos simultáneos
  - _Requirements: 3.1, 3.2, 3.3_

## Database Optimization

- [ ] 2. Optimizar base de datos para pagos de eventos
  - Crear índices para queries eficientes de asignaciones y pagos
  - Implementar campos calculados en EventAssignment
  - Agregar constraints de integridad referencial
  - _Requirements: Performance, Data Integrity_

- [ ] 2.1 Crear índices de base de datos
  - Crear índice compuesto en EventAssignment (eventId, studentId)
  - Crear índice en Payment (assignmentId, eventId)
  - Crear índice en Payment (eventId, date) para reportes
  - Ejecutar ANALYZE para actualizar estadísticas
  - _Requirements: Performance_

- [ ] 2.2 Agregar campo assignmentId a Payment model
  - Modificar schema de Prisma para agregar assignmentId opcional
  - Crear migración de base de datos
  - Actualizar relaciones en el modelo
  - Mantener compatibilidad con pagos existentes
  - _Requirements: 1.1, 3.1_

## Frontend Implementation

- [ ] 3. Rediseñar modal de registro de pagos de eventos
  - Crear componente EventPaymentModal con contexto del evento
  - Implementar lista filtrable de estudiantes asignados
  - Agregar indicadores visuales de estado de pago
  - Crear formulario contextual con información de asignación
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 3.1 Implementar lista de estudiantes asignados
  - Crear componente AssignmentCard con información completa
  - Implementar indicadores visuales de estado (verde/amarillo/rojo)
  - Agregar filtros por estado de pago
  - Implementar búsqueda dentro de estudiantes asignados
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 3.2 Crear formulario contextual de pago
  - Mostrar información de asignación al seleccionar estudiante
  - Implementar validación de monto contra pendiente
  - Agregar advertencias para pagos que excedan el monto pendiente
  - Mostrar historial de pagos previos del estudiante
  - _Requirements: 2.1, 2.2, 2.3, 6.1_

- [ ] 3.3 Implementar actualización en tiempo real
  - Actualizar progreso del evento después de registrar pago
  - Refrescar estado de asignación automáticamente
  - Sincronizar cambios entre múltiples usuarios
  - Actualizar indicadores visuales sin recargar página
  - _Requirements: 5.1, 5.2, 5.3_

## API Client Updates

- [ ] 4. Actualizar cliente API para nuevos endpoints
  - Agregar método getEventAssignmentsWithPaymentStatus()
  - Modificar createEventPayment() para incluir assignmentId
  - Implementar métodos de actualización en tiempo real
  - _Requirements: Integration_

- [ ] 4.1 Implementar métodos de API para asignaciones
  - Crear api.getEventAssignmentsWithPaymentStatus(eventId)
  - Implementar api.getAssignmentPaymentHistory(assignmentId)
  - Agregar api.calculateAssignmentAmounts(assignmentId)
  - _Requirements: 2.1, 6.1_

- [ ] 4.2 Actualizar métodos de pago de eventos
  - Modificar api.createEventPayment() para requerir assignmentId
  - Implementar api.validateEventPayment() para validaciones previas
  - Agregar api.getEventPaymentStats(eventId) para estadísticas
  - _Requirements: 3.1, 5.1_

## Integration and Testing

- [ ] 5. Integrar nueva funcionalidad con sistema existente
  - Conectar modal de pagos con gestión de eventos
  - Actualizar reportes para incluir pagos por asignación
  - Mantener compatibilidad con pagos existentes
  - _Requirements: Integration, Backward Compatibility_

- [ ] 5.1 Conectar con módulo de eventos existente
  - Modificar events.js para usar nuevo modal de pagos
  - Actualizar botones de "Registrar Pago" para pasar eventId
  - Integrar con sistema de notificaciones existente
  - _Requirements: 4.1, 5.1_

- [ ] 5.2 Actualizar sistema de reportes
  - Modificar reportes de eventos para incluir pagos por asignación
  - Agregar exportación de datos con trazabilidad completa
  - Implementar auditoría de pagos cancelados
  - _Requirements: 6.3, 6.4_

- [ ] 5.3 Implementar migración de datos existentes
  - Crear script para vincular pagos existentes con asignaciones
  - Recalcular montos de asignaciones basado en pagos históricos
  - Actualizar estadísticas de eventos con datos corregidos
  - Validar integridad de datos después de migración
  - _Requirements: Data Migration, Integrity_

## Validation and Error Handling

- [ ] 6. Implementar validaciones y manejo de errores
  - Crear validaciones tanto en frontend como backend
  - Implementar mensajes de error específicos y útiles
  - Agregar logging para auditoría y debugging
  - _Requirements: 3.1, 3.2, 3.3, Error Handling_

- [ ] 6.1 Implementar validaciones de frontend
  - Validar selección de estudiante asignado antes de mostrar formulario
  - Implementar validación de monto en tiempo real
  - Mostrar advertencias para montos que excedan pendiente
  - Prevenir envío de formulario con datos inválidos
  - _Requirements: 2.2, 3.2_

- [ ] 6.2 Implementar validaciones de backend
  - Validar que assignmentId corresponda al eventId
  - Verificar que el estudiante esté asignado al evento
  - Validar que el monto no sea negativo o excesivamente alto
  - Implementar validación de concurrencia para pagos simultáneos
  - _Requirements: 3.1, 3.2, 3.3_

## Documentation and Testing

- [ ] 7. Crear documentación y pruebas
  - Documentar nuevos endpoints de API
  - Crear pruebas unitarias para EventPaymentService
  - Implementar pruebas de integración para flujo completo
  - _Requirements: Documentation, Testing_

- [ ] 7.1 Crear pruebas unitarias
  - Probar cálculos de montos de asignación
  - Validar lógica de determinación de estado de pago
  - Probar validaciones de negocio
  - _Requirements: Testing_

- [ ] 7.2 Implementar pruebas de integración
  - Probar flujo completo de registro de pago
  - Validar actualización de estadísticas del evento
  - Probar manejo de errores y casos edge
  - _Requirements: Integration Testing_

- [ ] 7.3 Crear documentación de usuario
  - Documentar nuevo flujo de registro de pagos
  - Crear guía de resolución de problemas
  - Actualizar manual de usuario con nuevas funcionalidades
  - _Requirements: Documentation_