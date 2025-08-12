/**
 * Invoice Generator Service
 * Servicio para generar facturas automáticamente
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class InvoiceGeneratorService {
    constructor() {
        this.concepts = {
            TUITION: 'Matrícula',
            MONTHLY: 'Mensualidad',
            EVENT: 'Evento Escolar',
            UNIFORM: 'Uniforme',
            BOOKS: 'Libros y Materiales',
            TRANSPORT: 'Transporte',
            CAFETERIA: 'Cafetería',
            OTHER: 'Otros'
        };
    }

    /**
     * Generar facturas masivas por grado
     */
    async generateBulkInvoices(params) {
        const {
            gradeIds = [],
            groupIds = [],
            concept,
            description,
            amount,
            dueDate,
            userId,
            includeInactive = false
        } = params;

        try {
            console.log('🧾 Iniciando generación masiva de facturas...');
            
            // Validar parámetros
            if (!concept || !description || !amount || !dueDate || !userId) {
                throw new Error('Parámetros requeridos faltantes');
            }

            // Construir filtros para estudiantes
            const studentFilters = {
                status: includeInactive ? undefined : 'ACTIVE'
            };

            if (gradeIds.length > 0 || groupIds.length > 0) {
                studentFilters.OR = [];
                
                if (gradeIds.length > 0) {
                    studentFilters.OR.push({ gradeId: { in: gradeIds } });
                }
                
                if (groupIds.length > 0) {
                    studentFilters.OR.push({ groupId: { in: groupIds } });
                }
            }

            // Obtener estudiantes
            const students = await prisma.student.findMany({
                where: studentFilters,
                include: {
                    grade: { select: { name: true } },
                    group: { select: { name: true } }
                }
            });

            if (students.length === 0) {
                throw new Error('No se encontraron estudiantes con los criterios especificados');
            }

            console.log(`📊 Generando facturas para ${students.length} estudiantes`);

            // Generar facturas en transacción
            const result = await this.createInvoicesTransaction(
                students,
                concept,
                description,
                amount,
                dueDate,
                userId
            );

            console.log(`✅ Generadas ${result.invoices.length} facturas exitosamente`);

            return result;

        } catch (error) {
            console.error('❌ Error generando facturas masivas:', error);
            throw error;
        }
    }

    /**
     * Generar facturas mensuales automáticas
     */
    async generateMonthlyInvoices(params) {
        const {
            month,
            year,
            concept = 'MONTHLY',
            baseAmount,
            userId,
            gradeSpecificAmounts = {} // { gradeId: amount }
        } = params;

        try {
            console.log(`🗓️  Generando facturas mensuales para ${month}/${year}`);

            // Verificar si ya existen facturas para este mes
            const existingInvoices = await prisma.invoice.count({
                where: {
                    concept,
                    date: {
                        gte: new Date(year, month - 1, 1),
                        lt: new Date(year, month, 1)
                    }
                }
            });

            if (existingInvoices > 0) {
                throw new Error(`Ya existen ${existingInvoices} facturas para ${month}/${year}`);
            }

            // Obtener estudiantes activos agrupados por grado
            const studentsByGrade = await prisma.student.groupBy({
                by: ['gradeId'],
                _count: { id: true },
                where: { status: 'ACTIVE' }
            });

            const invoices = [];
            const dueDate = new Date(year, month - 1, 15); // Vence el 15 del mes

            // Generar facturas por grado
            for (const gradeGroup of studentsByGrade) {
                const gradeId = gradeGroup.gradeId;
                const amount = gradeSpecificAmounts[gradeId] || baseAmount;

                const grade = await prisma.grade.findUnique({
                    where: { id: gradeId },
                    select: { name: true }
                });

                const students = await prisma.student.findMany({
                    where: { 
                        gradeId,
                        status: 'ACTIVE'
                    }
                });

                const description = `Mensualidad ${month}/${year} - ${grade?.name || 'Grado'}`;

                const gradeInvoices = await this.createInvoicesTransaction(
                    students,
                    concept,
                    description,
                    amount,
                    dueDate,
                    userId
                );

                invoices.push(...gradeInvoices.invoices);
            }

            console.log(`✅ Generadas ${invoices.length} facturas mensuales`);

            return {
                success: true,
                count: invoices.length,
                month,
                year,
                invoices: invoices.slice(0, 10) // Muestra solo las primeras 10
            };

        } catch (error) {
            console.error('❌ Error generando facturas mensuales:', error);
            throw error;
        }
    }

    /**
     * Generar facturas para eventos
     */
    async generateEventInvoices(eventId, userId) {
        try {
            console.log(`🎯 Generando facturas para evento: ${eventId}`);

            // Obtener evento y sus asignaciones
            const event = await prisma.event.findUnique({
                where: { id: eventId },
                include: {
                    assignments: {
                        include: {
                            student: {
                                include: {
                                    grade: { select: { name: true } },
                                    group: { select: { name: true } }
                                }
                            }
                        }
                    }
                }
            });

            if (!event) {
                throw new Error('Evento no encontrado');
            }

            if (event.assignments.length === 0) {
                throw new Error('El evento no tiene estudiantes asignados');
            }

            // Verificar si ya existen facturas para este evento
            const existingInvoices = await prisma.invoice.count({
                where: {
                    concept: 'EVENT',
                    // Buscar en observaciones o crear campo eventId
                    observations: { contains: event.id }
                }
            });

            if (existingInvoices > 0) {
                throw new Error(`Ya existen ${existingInvoices} facturas para este evento`);
            }

            const students = event.assignments.map(assignment => assignment.student);
            const description = `${event.name} - ${event.type}`;
            const amount = event.ticketPrice;
            const dueDate = new Date(event.eventDate);
            dueDate.setDate(dueDate.getDate() - 7); // Vence 7 días antes del evento

            const result = await this.createInvoicesTransaction(
                students,
                'EVENT',
                description,
                amount,
                dueDate,
                userId,
                event.id // eventId para referencia
            );

            console.log(`✅ Generadas ${result.invoices.length} facturas para evento`);

            return result;

        } catch (error) {
            console.error('❌ Error generando facturas de evento:', error);
            throw error;
        }
    }

    /**
     * Crear facturas en transacción
     */
    async createInvoicesTransaction(students, concept, description, amount, dueDate, userId, eventId = null) {
        return await prisma.$transaction(async (tx) => {
            // Obtener último número de factura
            const lastInvoice = await tx.invoice.findFirst({
                orderBy: { invoiceNumber: 'desc' }
            });

            let nextNumber = lastInvoice 
                ? parseInt(lastInvoice.invoiceNumber.split('-')[2]) + 1 
                : 1;

            const year = new Date().getFullYear();
            const invoices = [];
            const errors = [];

            for (const student of students) {
                try {
                    const invoiceNumber = `FAC-${year}-${nextNumber.toString().padStart(6, '0')}`;

                    const invoice = await tx.invoice.create({
                        data: {
                            invoiceNumber,
                            studentId: student.id,
                            concept,
                            date: new Date(),
                            dueDate: new Date(dueDate),
                            subtotal: amount,
                            tax: 0, // Servicios educativos exentos de IVA
                            total: amount,
                            status: 'PENDING',
                            userId,
                            observations: eventId ? `Evento: ${eventId}` : null,
                            items: {
                                create: [{
                                    description,
                                    quantity: 1,
                                    unitPrice: amount,
                                    total: amount
                                }]
                            }
                        },
                        include: {
                            student: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    document: true
                                }
                            },
                            items: true
                        }
                    });

                    invoices.push(invoice);
                    nextNumber++;

                } catch (error) {
                    console.error(`Error creando factura para estudiante ${student.id}:`, error);
                    errors.push({
                        studentId: student.id,
                        studentName: `${student.firstName} ${student.lastName}`,
                        error: error.message
                    });
                }
            }

            return {
                success: true,
                count: invoices.length,
                invoices,
                errors
            };
        });
    }

    /**
     * Obtener plantillas de facturación
     */
    async getInvoiceTemplates() {
        return {
            monthly: {
                concept: 'MONTHLY',
                description: 'Mensualidad {month}/{year}',
                defaultAmount: 50000,
                dueDay: 15
            },
            tuition: {
                concept: 'TUITION',
                description: 'Matrícula {year}',
                defaultAmount: 100000,
                dueDay: 30
            },
            uniform: {
                concept: 'UNIFORM',
                description: 'Uniforme Escolar',
                defaultAmount: 80000,
                dueDay: 30
            },
            books: {
                concept: 'BOOKS',
                description: 'Libros y Materiales {year}',
                defaultAmount: 120000,
                dueDay: 30
            }
        };
    }

    /**
     * Programar facturas automáticas
     */
    async scheduleAutomaticInvoices(schedule) {
        // Esta funcionalidad se puede implementar con cron jobs
        // Por ahora, solo guardamos la configuración
        console.log('📅 Programación de facturas automáticas:', schedule);
        
        // TODO: Implementar con node-cron o similar
        return {
            success: true,
            message: 'Programación guardada (implementación pendiente)',
            schedule
        };
    }
}

// Singleton instance
const invoiceGeneratorService = new InvoiceGeneratorService();

module.exports = invoiceGeneratorService;