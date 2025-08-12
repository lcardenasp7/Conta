# Design Document - Integración de Pagos de Eventos

## Overview

Este diseño corrige la desconexión lógica entre las asignaciones de eventos y el registro de pagos, creando un flujo integrado que mantiene la integridad de los datos y mejora la experiencia del usuario.

## Architecture

### Current State Issues
```
❌ PROBLEMA ACTUAL:
Modal de Pago → Búsqueda General de Estudiantes → Pago Genérico
                     ↓
               Sin conexión con EventAssignment
                     ↓
            Datos inconsistentes y errores
```

### Proposed Architecture
```
✅ SOLUCIÓN PROPUESTA:
Event → EventAssignments → Filtered Student List → Contextual Payment
   ↓         ↓                    ↓                      ↓
Updates   Real-time           Assignment Info      Auto-update
Stats     Sync                Display              Assignment
```

## Components and Interfaces

### 1. Backend API Enhancements

#### New Endpoint: Get Event Assignments with Payment Status
```javascript
GET /api/events/:eventId/assignments/payment-status
Response: {
  eventId: string,
  eventName: string,
  assignments: [
    {
      id: string,
      student: {
        id: string,
        firstName: string,
        lastName: string,
        document: string,
        grade: { name: string },
        group: { name: string }
      },
      ticketsAssigned: number,
      ticketsSold: number,
      amountRaised: number,
      expectedAmount: number,
      pendingAmount: number,
      paymentStatus: 'PENDING' | 'PARTIAL' | 'COMPLETED',
      payments: [
        {
          id: string,
          amount: number,
          date: string,
          method: string,
          status: string
        }
      ]
    }
  ]
}
```

#### Enhanced Payment Creation
```javascript
POST /api/events/:eventId/payments
Body: {
  assignmentId: string,  // ← NUEVO: Conexión directa
  amount: number,
  method: string,
  reference?: string,
  observations?: string
}
```

#### Auto-calculation Service
```javascript
// services/event-payment.service.js
class EventPaymentService {
  calculateAssignmentAmounts(assignment, ticketPrice) {
    const expectedAmount = assignment.ticketsAssigned * ticketPrice;
    const pendingAmount = expectedAmount - assignment.amountRaised;
    const paymentStatus = this.getPaymentStatus(assignment.amountRaised, expectedAmount);
    
    return { expectedAmount, pendingAmount, paymentStatus };
  }
  
  updateEventStats(eventId) {
    // Recalcular totalRaised del evento
    // Actualizar progreso de recaudación
  }
}
```

### 2. Frontend Component Redesign

#### Event Payment Modal Structure
```html
<!-- Modal mejorado con contexto del evento -->
<div class="modal" id="eventPaymentModal">
  <div class="modal-header">
    <h5>Registrar Pago - [Nombre del Evento]</h5>
    <div class="event-progress">
      <span>Progreso: $X,XXX / $X,XXX (XX%)</span>
    </div>
  </div>
  
  <div class="modal-body">
    <!-- Filtros y búsqueda -->
    <div class="filters-section">
      <input type="search" placeholder="Buscar estudiante asignado...">
      <select id="paymentStatusFilter">
        <option value="">Todos los estados</option>
        <option value="PENDING">Sin pagos</option>
        <option value="PARTIAL">Pago parcial</option>
        <option value="COMPLETED">Completado</option>
      </select>
    </div>
    
    <!-- Lista de estudiantes asignados -->
    <div class="assigned-students-list">
      <!-- Cada estudiante con indicador visual -->
    </div>
    
    <!-- Formulario de pago contextual -->
    <div class="payment-form-section">
      <!-- Información de la asignación seleccionada -->
      <!-- Formulario de pago con validaciones -->
    </div>
  </div>
</div>
```

#### Student Assignment Card Component
```html
<div class="assignment-card" data-status="[PENDING|PARTIAL|COMPLETED]">
  <div class="student-info">
    <h6>[Nombre Completo]</h6>
    <small>[Grado] - [Grupo] | Doc: [Documento]</small>
  </div>
  
  <div class="assignment-details">
    <div class="tickets-info">
      <span>Boletos: [Vendidos]/[Asignados]</span>
    </div>
    <div class="amount-info">
      <span class="expected">Esperado: $[Monto]</span>
      <span class="paid">Pagado: $[Monto]</span>
      <span class="pending">Pendiente: $[Monto]</span>
    </div>
  </div>
  
  <div class="payment-status">
    <span class="badge badge-[status]">[Estado]</span>
    <button class="btn-register-payment">Registrar Pago</button>
  </div>
</div>
```

### 3. Data Models Enhancement

#### EventAssignment Model Extension
```javascript
// Campos calculados dinámicamente
interface EventAssignmentWithPayments {
  // Campos existentes
  id: string;
  eventId: string;
  studentId: string;
  ticketsAssigned: number;
  ticketsSold: number;
  amountRaised: number;
  
  // Campos calculados
  expectedAmount: number;
  pendingAmount: number;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'COMPLETED';
  paymentPercentage: number;
  
  // Relaciones expandidas
  student: StudentWithGrade;
  payments: EventPayment[];
  event: EventBasicInfo;
}
```

#### Payment Model for Events
```javascript
interface EventPayment {
  id: string;
  assignmentId: string;  // ← Conexión directa
  eventId: string;       // ← Para queries rápidas
  studentId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  observations?: string;
  date: Date;
  status: PaymentStatus;
  userId: string;        // Quien registró el pago
}
```

## Data Flow

### 1. Opening Payment Modal
```
User clicks "Registrar Pago" on Event
         ↓
Load Event Assignments with Payment Status
         ↓
Calculate amounts and status for each assignment
         ↓
Display filtered list with visual indicators
```

### 2. Registering Payment
```
User selects student assignment
         ↓
Display assignment context (amounts, history)
         ↓
User enters payment details
         ↓
Validate against assignment limits
         ↓
Create payment with assignmentId reference
         ↓
Update assignment amountRaised
         ↓
Recalculate event totalRaised
         ↓
Refresh UI with new status
```

### 3. Real-time Updates
```
Payment registered
         ↓
Update EventAssignment.amountRaised
         ↓
Recalculate Event.totalRaised
         ↓
Broadcast updates to connected clients
         ↓
Update UI indicators and progress bars
```

## Error Handling

### Validation Rules
1. **Assignment Validation**: Student must be assigned to the event
2. **Amount Validation**: Payment cannot exceed pending amount (with warnings for overages)
3. **Status Validation**: Cannot add payments to completed assignments
4. **Concurrency**: Handle simultaneous payments by multiple users

### Error Scenarios
```javascript
// Validation examples
if (!assignment) {
  throw new Error('Estudiante no asignado a este evento');
}

if (paymentAmount > assignment.pendingAmount) {
  // Warning, not error - allow with confirmation
  return { 
    warning: 'El monto excede lo pendiente',
    overage: paymentAmount - assignment.pendingAmount
  };
}

if (assignment.paymentStatus === 'COMPLETED') {
  throw new Error('Esta asignación ya está completamente pagada');
}
```

## Testing Strategy

### Unit Tests
- EventPaymentService calculation methods
- Assignment status determination logic
- Payment validation rules

### Integration Tests
- Event-Assignment-Payment data flow
- Real-time updates between components
- Concurrent payment scenarios

### UI Tests
- Modal opening with correct event context
- Student filtering and search functionality
- Payment form validation and submission
- Status indicator updates

## Performance Considerations

### Database Optimization
```sql
-- Índices necesarios para queries eficientes
CREATE INDEX idx_event_assignment_payment ON "EventAssignment"("eventId", "studentId");
CREATE INDEX idx_payment_assignment ON "Payment"("assignmentId", "eventId");
CREATE INDEX idx_payment_event_date ON "Payment"("eventId", "date");
```

### Caching Strategy
- Cache assignment calculations for active events
- Real-time sync for payment updates
- Lazy loading for payment history

### Query Optimization
```javascript
// Single query para obtener toda la información necesaria
const assignmentsWithPayments = await prisma.eventAssignment.findMany({
  where: { eventId },
  include: {
    student: {
      include: {
        grade: { select: { name: true } },
        group: { select: { name: true } }
      }
    },
    payments: {
      where: { status: 'COMPLETED' },
      orderBy: { date: 'desc' }
    }
  }
});
```

## Security Considerations

### Authorization
- Only users with event management permissions can register payments
- Audit trail for all payment operations
- Prevent payment manipulation through direct API calls

### Data Integrity
- Transaction-based payment registration
- Rollback capabilities for failed operations
- Validation at both frontend and backend levels

## Migration Strategy

### Phase 1: Backend Implementation
1. Create new API endpoints
2. Implement EventPaymentService
3. Add database indexes
4. Create migration scripts

### Phase 2: Frontend Integration
1. Update event modal components
2. Implement new payment flow
3. Add real-time update handling
4. Update existing payment forms

### Phase 3: Data Migration
1. Link existing payments to assignments where possible
2. Recalculate assignment amounts
3. Update event statistics
4. Validate data integrity

This design ensures a robust, user-friendly, and maintainable solution for event payment management while maintaining data integrity and providing excellent user experience.