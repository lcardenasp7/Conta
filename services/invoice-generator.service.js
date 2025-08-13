/**
 * Invoice Generator Service
 * Servicio para generar facturas automáticamente
 */

const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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
     * Generar PDF de factura optimizado
     */
    async generateInvoicePDF(invoiceId) {
        try {
            console.log(`📄 Generando PDF optimizado para factura: ${invoiceId}`);

            // Obtener datos de la factura
            const invoice = await prisma.invoice.findUnique({
                where: { id: invoiceId },
                include: {
                    student: {
                        include: {
                            grade: { select: { name: true } },
                            group: { select: { name: true } }
                        }
                    },
                    items: true,
                    user: { select: { name: true } }
                }
            });

            if (!invoice) {
                throw new Error('Factura no encontrada');
            }

            // Obtener datos de la institución
            const institution = await prisma.institution.findFirst();

            // Determinar si usar layout optimizado o legacy
            const useOptimizedLayout = invoice.items.length <= 5; // Usar optimizado para pocas items

            if (useOptimizedLayout) {
                return await this.generateOptimizedPDF(invoice, institution);
            } else {
                return await this.generateLegacyPDF(invoice, institution);
            }

        } catch (error) {
            console.error('❌ Error generando PDF:', error);
            // Fallback al método legacy
            return await this.generateLegacyPDF(invoice, institution);
        }
    }

    /**
     * Generar PDF de factura como buffer
     */
    async generateInvoicePDFBuffer(invoiceId) {
        try {
            console.log(`📄 Generando PDF buffer para factura: ${invoiceId}`);

            // Obtener datos de la factura
            const invoice = await prisma.invoice.findUnique({
                where: { id: invoiceId },
                include: {
                    student: {
                        include: {
                            grade: { select: { name: true } },
                            group: { select: { name: true } }
                        }
                    },
                    items: true,
                    user: { select: { name: true } }
                }
            });

            if (!invoice) {
                throw new Error('Factura no encontrada');
            }

            // Obtener datos de la institución
            const institution = await prisma.institution.findFirst();

            // Crear documento PDF
            const doc = new PDFDocument({
                margin: 40,
                size: 'A4'
            });

            // Configurar metadata
            doc.info.Title = `Factura ${invoice.invoiceNumber}`;
            doc.info.Author = institution?.name || 'Sistema Educativo';
            doc.info.Subject = 'Factura de Servicios Educativos';

            // Generar contenido
            let currentY = 40;

            // Header compacto
            currentY = await this.addOptimizedHeader(doc, institution, currentY, invoice);
            currentY += 20;

            // Información en dos columnas
            currentY = this.addOptimizedInfo(doc, invoice, currentY);
            currentY += 25;

            // Tabla de items compacta
            currentY = this.addOptimizedItems(doc, invoice, currentY);
            currentY += 30;

            // Totales
            currentY = this.addOptimizedTotals(doc, invoice, currentY);
            currentY += 40;

            // Footer
            this.addOptimizedFooter(doc, institution, currentY);

            // Convertir a buffer
            return new Promise((resolve, reject) => {
                const buffers = [];

                doc.on('data', (chunk) => {
                    buffers.push(chunk);
                });

                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    console.log('✅ PDF buffer created, size:', pdfBuffer.length);
                    resolve(pdfBuffer);
                });

                doc.on('error', (error) => {
                    console.error('❌ PDF buffer error:', error);
                    reject(error);
                });

                // Finalizar documento
                doc.end();
            });

        } catch (error) {
            console.error('❌ Error generando PDF buffer:', error);
            throw error;
        }
    }

    /**
     * Generar PDF optimizado para facturas simples
     */
    async generateOptimizedPDF(invoice, institution) {
        const doc = new PDFDocument({
            margin: 40,
            size: 'A4'
        });

        // Configurar metadata
        doc.info.Title = `Factura ${invoice.invoiceNumber}`;
        doc.info.Author = institution?.name || 'Sistema Educativo';
        doc.info.Subject = 'Factura de Servicios Educativos';

        let currentY = 40;

        // Header compacto
        currentY = await this.addOptimizedHeader(doc, institution, currentY, invoice);
        currentY += 20;

        // Información en dos columnas
        currentY = this.addOptimizedInfo(doc, invoice, currentY);
        currentY += 25;

        // Tabla de items compacta
        currentY = this.addOptimizedItems(doc, invoice, currentY);
        currentY += 30;

        // Totales
        currentY = this.addOptimizedTotals(doc, invoice, currentY);
        currentY += 40;

        // Footer
        this.addOptimizedFooter(doc, institution, currentY);

        // IMPORTANTE: No finalizar el documento aquí, se hace en el endpoint
        return doc;
    }

    /**
     * Generar PDF con método legacy para facturas complejas
     */
    async generateLegacyPDF(invoice, institution) {
        const doc = new PDFDocument({ margin: 50 });

        // Configurar metadata
        doc.info.Title = `Factura ${invoice.invoiceNumber}`;
        doc.info.Author = institution?.name || 'Sistema Educativo';
        doc.info.Subject = 'Factura de Servicios Educativos';

        // Header con logo e información institucional
        await this.addInvoiceHeader(doc, institution, invoice);

        // Información de la factura
        this.addInvoiceInfo(doc, invoice);

        // Información del cliente/estudiante
        this.addClientInfo(doc, invoice);

        // Tabla de items
        this.addInvoiceItems(doc, invoice);

        // Totales
        this.addInvoiceTotals(doc, invoice);

        // Footer
        this.addInvoiceFooter(doc, institution);

        return doc;
    }

    /**
     * Calcular layout óptimo basado en contenido
     */
    calculateOptimalLayout(invoice, doc) {
        const pageHeight = doc.page.height - 80; // Margen superior e inferior
        const itemCount = invoice.items.length;

        // Alturas estimadas para cada sección
        const headerHeight = 120;
        const infoSectionHeight = 100;
        const tableHeaderHeight = 25;
        const itemRowHeight = 20;
        const totalsHeight = 80;
        const footerHeight = 80;

        // Calcular altura total necesaria
        const totalItemsHeight = itemCount * itemRowHeight;
        const totalContentHeight = headerHeight + infoSectionHeight + tableHeaderHeight +
            totalItemsHeight + totalsHeight + footerHeight;

        // Determinar si cabe en una página
        const fitsInOnePage = totalContentHeight <= pageHeight;

        // Ajustar espaciado si cabe en una página
        const spacing = fitsInOnePage ? {
            afterHeader: 20,
            afterInfo: 25,
            afterTable: 30,
            beforeFooter: 40
        } : {
            afterHeader: 15,
            afterInfo: 20,
            afterTable: 25,
            beforeFooter: 30
        };

        return {
            fitsInOnePage,
            itemCount,
            spacing,
            pageHeight,
            totalContentHeight
        };
    }

    /**
     * Renderizar factura optimizada
     */
    async renderOptimizedInvoice(doc, invoice, institution, layout) {
        let currentY = 40;

        try {
            // Header compacto
            currentY = await this.addOptimizedHeader(doc, institution, currentY, invoice);
            currentY += layout.spacing.afterHeader;

            // Información en dos columnas
            currentY = this.addOptimizedInfo(doc, invoice, currentY);
            currentY += layout.spacing.afterInfo;

            // Tabla de items compacta
            currentY = this.addOptimizedItems(doc, invoice, currentY);
            currentY += layout.spacing.afterTable;

            // Totales
            currentY = this.addOptimizedTotals(doc, invoice, currentY);

            // Footer - solo si hay espacio, sino en nueva página
            const remainingSpace = doc.page.height - currentY - 40;
            if (remainingSpace < 100 && !layout.fitsInOnePage) {
                doc.addPage();
                currentY = 40;
            } else {
                currentY += layout.spacing.beforeFooter;
            }

            this.addOptimizedFooter(doc, institution, currentY);

        } catch (error) {
            console.error('Error renderizando factura:', error);
            throw error;
        }
    }

    /**
     * Agregar header optimizado
     */
    async addOptimizedHeader(doc, institution, startY, invoice) {
        // Buscar logo
        const logoPath = await this.findLogoPath();

        // Logo compacto (si existe)
        if (logoPath && fs.existsSync(logoPath)) {
            doc.image(logoPath, 40, startY, { width: 60, height: 60 });
        }

        // Información institucional compacta - Nombre más grande y destacado
        const institutionName = institution?.name || 'INSTITUCIÓN EDUCATIVA';

        // Nombre del colegio más grande para que resalte (10pt en lugar de 9pt)
        doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#000000');

        // Dividir el nombre para evitar superposición
        const words = institutionName.split(' ');
        if (words.length > 3) {
            // Dividir en dos líneas para nombres largos
            const midPoint = Math.ceil(words.length / 2);
            const firstLine = words.slice(0, midPoint).join(' ');
            const secondLine = words.slice(midPoint).join(' ');

            doc.text(firstLine, 110, startY, { width: 280 })
                .text(secondLine, 110, startY + 13, { width: 280 });
        } else {
            // Para nombres cortos, usar una sola línea
            doc.text(institutionName, 110, startY, { width: 280 });
        }

        // Información de contacto con espaciado ajustado
        doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#333333')
            .text(`NIT: ${institution?.nit || 'N/A'}`, 110, startY + 28)
            .text(`Tel: ${institution?.phone || 'N/A'}`, 110, startY + 40)
            .text(`Email: ${institution?.email || 'N/A'}`, 110, startY + 52)
            .text(`Dg. 136 #9D - 60, Suroccidente, Barranquilla`, 110, startY + 64);

        // Título FACTURA
        doc.fontSize(16)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('FACTURA', 420, startY + 5);

        // Número de factura debajo del título FACTURA
        if (invoice && invoice.invoiceNumber) {
            doc.fontSize(12)
                .font('Helvetica')
                .fillColor('#2c3e50')
                .text(invoice.invoiceNumber, 420, startY + 25);
        }

        // Línea separadora con más espacio
        doc.moveTo(40, startY + 90)
            .lineTo(555, startY + 90)
            .strokeColor('#bdc3c7')
            .lineWidth(1)
            .stroke();

        return startY + 100;
    }

    /**
     * Buscar ruta del logo
     */
    async findLogoPath() {
        const logoExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

        // Buscar logo con nombre fijo
        for (const ext of logoExtensions) {
            const testPath = path.join(__dirname, '../public/uploads/logo' + ext);
            if (fs.existsSync(testPath)) {
                return testPath;
            }
        }

        // Buscar el más reciente con prefijo logo_
        try {
            const uploadsDir = path.join(__dirname, '../public/uploads');
            if (fs.existsSync(uploadsDir)) {
                const files = fs.readdirSync(uploadsDir)
                    .filter(file => file.startsWith('logo_') && logoExtensions.some(ext => file.endsWith(ext)))
                    .sort((a, b) => {
                        const statA = fs.statSync(path.join(uploadsDir, a));
                        const statB = fs.statSync(path.join(uploadsDir, b));
                        return statB.mtime - statA.mtime;
                    });

                if (files.length > 0) {
                    return path.join(uploadsDir, files[0]);
                }
            }
        } catch (error) {
            console.warn('Error buscando logo:', error.message);
        }

        return null;
    }

    /**
     * Agregar información optimizada en dos columnas
     */
    addOptimizedInfo(doc, invoice, startY) {
        // Columna izquierda - Cliente
        doc.fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('INFORMACIÓN DEL CLIENTE', 40, startY);

        doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#000000');

        if (invoice.student) {
            const studentName = `${invoice.student.firstName} ${invoice.student.lastName}`;
            doc.text(`Cliente: ${studentName}`, 40, startY + 15)
                .text(`Documento: ${invoice.student.document}`, 40, startY + 27)
                .text(`Grado: ${invoice.student.grade?.name || 'N/A'}`, 40, startY + 39)
                .text(`Grupo: ${invoice.student.group?.name || 'N/A'}`, 40, startY + 51);
        } else {
            doc.text(`Cliente: ${invoice.clientName || 'Cliente Externo'}`, 40, startY + 15)
                .text(`Documento: ${invoice.clientDocument || 'N/A'}`, 40, startY + 27)
                .text(`Email: ${invoice.clientEmail || 'N/A'}`, 40, startY + 39)
                .text(`Teléfono: ${invoice.clientPhone || 'N/A'}`, 40, startY + 51);
        }

        // Columna derecha - Factura
        doc.fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('INFORMACIÓN DE LA FACTURA', 320, startY);

        doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#000000')
            .text(`Número: ${invoice.invoiceNumber}`, 320, startY + 15)
            .text(`Fecha: ${this.formatDate(invoice.date)}`, 320, startY + 27)
            .text(`Vencimiento: ${this.formatDate(invoice.dueDate)}`, 320, startY + 39)
            .text(`Estado: ${this.getStatusText(invoice.status)}`, 320, startY + 51);

        return startY + 75;
    }

    /**
     * Agregar tabla de items optimizada
     */
    addOptimizedItems(doc, invoice, startY) {
        const tableTop = startY;
        const itemHeight = 18; // Más compacto

        // Headers de la tabla
        doc.fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50');

        this.generateOptimizedTableRow(doc, tableTop, 'DESCRIPCIÓN', 'CANT.', 'PRECIO UNIT.', 'TOTAL');

        // Línea bajo headers
        doc.moveTo(40, tableTop + 12)
            .lineTo(555, tableTop + 12)
            .strokeColor('#bdc3c7')
            .lineWidth(1)
            .stroke();

        // Items
        doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#000000');

        let currentY = tableTop + 20;

        invoice.items.forEach((item, index) => {
            this.generateOptimizedTableRow(
                doc,
                currentY,
                item.description,
                item.quantity.toString(),
                this.formatCurrency(item.unitPrice),
                this.formatCurrency(item.total)
            );
            currentY += itemHeight;
        });

        return currentY + 10;
    }

    /**
     * Generar fila de tabla optimizada
     */
    generateOptimizedTableRow(doc, y, desc, qty, price, total) {
        doc.text(desc, 40, y, { width: 280, ellipsis: true })
            .text(qty, 330, y, { width: 40, align: 'center' })
            .text(price, 380, y, { width: 80, align: 'right' })
            .text(total, 470, y, { width: 85, align: 'right' });
    }

    /**
     * Agregar totales optimizados
     */
    addOptimizedTotals(doc, invoice, startY) {
        // Línea separadora
        doc.moveTo(350, startY)
            .lineTo(555, startY)
            .strokeColor('#bdc3c7')
            .lineWidth(1)
            .stroke();

        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#000000')
            .text('Subtotal:', 400, startY + 10)
            .text('IVA (0%):', 400, startY + 22)
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('TOTAL:', 400, startY + 34);

        doc.font('Helvetica')
            .fontSize(9)
            .text(this.formatCurrency(invoice.subtotal || invoice.total), 470, startY + 10, { width: 85, align: 'right' })
            .text(this.formatCurrency(invoice.tax || 0), 470, startY + 22, { width: 85, align: 'right' })
            .font('Helvetica-Bold')
            .fontSize(11)
            .fillColor('#2c3e50')
            .text(this.formatCurrency(invoice.total), 470, startY + 34, { width: 85, align: 'right' });

        return startY + 55;
    }

    /**
     * Agregar footer optimizado
     */
    addOptimizedFooter(doc, institution, startY) {
        // Línea separadora
        doc.moveTo(40, startY)
            .lineTo(555, startY)
            .strokeColor('#bdc3c7')
            .lineWidth(1)
            .stroke();

        doc.fontSize(7)
            .font('Helvetica')
            .fillColor('#666666')
            .text('Esta factura fue generada electrónicamente por el Sistema de Gestión Educativa', 40, startY + 10, { width: 515 })
            .text(`Resolución DIAN: ${institution?.resolution || 'N/A'} | Los servicios educativos están exentos de IVA según el artículo 476 del Estatuto Tributario`, 40, startY + 22, { width: 515 })
            .text(`Para consultas: ${institution?.email || 'N/A'} | ${institution?.phone || 'N/A'}`, 40, startY + 34, { width: 515 });

        return startY + 50;
    }

    /**
     * Agregar header de la factura (método legacy - mantener para compatibilidad)
     */
    async addInvoiceHeader(doc, institution, invoice) {
        // Buscar logo con diferentes extensiones
        const logoExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
        let logoPath = null;

        for (const ext of logoExtensions) {
            const testPath = path.join(__dirname, '../public/uploads/logo' + ext);
            if (fs.existsSync(testPath)) {
                logoPath = testPath;
                break;
            }
        }

        // Si no encuentra logo con nombre fijo, buscar el más reciente
        if (!logoPath) {
            try {
                const uploadsDir = path.join(__dirname, '../public/uploads');
                if (fs.existsSync(uploadsDir)) {
                    const files = fs.readdirSync(uploadsDir)
                        .filter(file => file.startsWith('logo_') && logoExtensions.some(ext => file.endsWith(ext)))
                        .sort((a, b) => {
                            const statA = fs.statSync(path.join(uploadsDir, a));
                            const statB = fs.statSync(path.join(uploadsDir, b));
                            return statB.mtime - statA.mtime;
                        });

                    if (files.length > 0) {
                        logoPath = path.join(uploadsDir, files[0]);
                    }
                }
            } catch (error) {
                console.warn('Error buscando logo:', error.message);
            }
        }

        // Logo (si existe) - Posición ajustada
        if (logoPath && fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 45, { width: 70, height: 70 });
        }

        // Información institucional - Posición y espaciado mejorados
        const institutionName = institution?.name || 'INSTITUCIÓN EDUCATIVA';

        // Dividir nombre largo en múltiples líneas si es necesario
        const maxWidth = 220; // Ancho máximo para el nombre
        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#000000');

        // Calcular si el nombre necesita dividirse
        const nameWidth = doc.widthOfString(institutionName);
        if (nameWidth > maxWidth) {
            // Dividir en palabras y crear líneas
            const words = institutionName.split(' ');
            let currentLine = '';
            let yPosition = 45;

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                if (doc.widthOfString(testLine) <= maxWidth) {
                    currentLine = testLine;
                } else {
                    if (currentLine) {
                        doc.text(currentLine, 130, yPosition);
                        yPosition += 16;
                    }
                    currentLine = word;
                }
            }
            if (currentLine) {
                doc.text(currentLine, 130, yPosition);
            }
        } else {
            doc.text(institutionName, 130, 45);
        }

        // Información adicional - Espaciado mejorado
        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#333333')
            .text(`NIT: ${institution?.nit || 'N/A'}`, 130, 75)
            .text(`Tel: ${institution?.phone || 'N/A'}`, 130, 88)
            .text(`Email: ${institution?.email || 'N/A'}`, 130, 101)
            .text(`Dg. 136 #9D - 60, Suroccidente, Barranquilla`, 130, 114);

        // Título FACTURA - Posición ajustada para no solapar
        doc.fontSize(22)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('FACTURA', 420, 45);

        // Número de factura debajo del título FACTURA
        if (invoice && invoice.invoiceNumber) {
            doc.fontSize(14)
                .font('Helvetica')
                .fillColor('#2c3e50')
                .text(invoice.invoiceNumber, 420, 70);
        }

        // Línea separadora - Posición ajustada con más espacio
        doc.moveTo(50, 140)
            .lineTo(550, 140)
            .strokeColor('#bdc3c7')
            .lineWidth(1)
            .stroke();
    }

    /**
     * Agregar información de la factura
     */
    addInvoiceInfo(doc, invoice) {
        const startY = 175; // Aumentado para evitar solapamiento

        doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('INFORMACIÓN DE LA FACTURA', 380, startY);

        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#000000')
            .text(`Número: ${invoice.invoiceNumber}`, 380, startY + 18)
            .text(`Fecha: ${this.formatDate(invoice.date)}`, 380, startY + 32)
            .text(`Vencimiento: ${this.formatDate(invoice.dueDate)}`, 380, startY + 46)
            .text(`Estado: ${this.getStatusText(invoice.status)}`, 380, startY + 60);
    }

    /**
     * Agregar información del cliente
     */
    addClientInfo(doc, invoice) {
        const startY = 175; // Aumentado para evitar solapamiento

        doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('INFORMACIÓN DEL CLIENTE', 50, startY);

        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#000000');

        if (invoice.student) {
            const studentName = `${invoice.student.firstName} ${invoice.student.lastName}`;
            // Manejar nombres largos
            if (doc.widthOfString(`Estudiante: ${studentName}`) > 300) {
                doc.text('Estudiante:', 50, startY + 18)
                    .text(studentName, 50, startY + 32)
                    .text(`Documento: ${invoice.student.document}`, 50, startY + 46)
                    .text(`Grado: ${invoice.student.grade?.name || 'N/A'}`, 50, startY + 60)
                    .text(`Grupo: ${invoice.student.group?.name || 'N/A'}`, 50, startY + 74);
            } else {
                doc.text(`Estudiante: ${studentName}`, 50, startY + 18)
                    .text(`Documento: ${invoice.student.document}`, 50, startY + 32)
                    .text(`Grado: ${invoice.student.grade?.name || 'N/A'}`, 50, startY + 46)
                    .text(`Grupo: ${invoice.student.group?.name || 'N/A'}`, 50, startY + 60);
            }
        } else {
            // Cliente externo
            doc.text(`Cliente: ${invoice.clientName || 'Cliente Externo'}`, 50, startY + 18)
                .text(`Documento: ${invoice.clientDocument || 'N/A'}`, 50, startY + 32)
                .text(`Email: ${invoice.clientEmail || 'N/A'}`, 50, startY + 46)
                .text(`Teléfono: ${invoice.clientPhone || 'N/A'}`, 50, startY + 60);
        }
    }

    /**
     * Agregar tabla de items
     */
    addInvoiceItems(doc, invoice) {
        const startY = 300; // Aumentado para dar más espacio
        const tableTop = startY;
        const itemHeight = 22; // Aumentado para mejor legibilidad

        // Headers de la tabla
        doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50');

        this.generateTableRow(doc, tableTop, 'DESCRIPCIÓN', 'CANT.', 'PRECIO UNIT.', 'TOTAL');

        // Línea bajo headers
        doc.moveTo(50, tableTop + 15)
            .lineTo(550, tableTop + 15)
            .strokeColor('#bdc3c7')
            .lineWidth(1)
            .stroke();

        // Items
        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#000000');

        let currentY = tableTop + 25;

        invoice.items.forEach((item, index) => {
            this.generateTableRow(
                doc,
                currentY,
                item.description,
                item.quantity.toString(),
                this.formatCurrency(item.unitPrice),
                this.formatCurrency(item.total)
            );
            currentY += itemHeight;
        });

        return currentY;
    }

    /**
     * Generar fila de tabla
     */
    generateTableRow(doc, y, desc, qty, price, total) {
        // Descripción con ancho limitado para evitar solapamiento
        doc.text(desc, 50, y, { width: 260, ellipsis: true })
            .text(qty, 320, y, { width: 50, align: 'center' })
            .text(price, 380, y, { width: 80, align: 'right' })
            .text(total, 470, y, { width: 80, align: 'right' });
    }

    /**
     * Agregar totales
     */
    addInvoiceTotals(doc, invoice) {
        const startY = 480; // Aumentado para dar más espacio

        // Línea separadora
        doc.moveTo(350, startY)
            .lineTo(550, startY)
            .strokeColor('#bdc3c7')
            .lineWidth(1)
            .stroke();

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#000000')
            .text('Subtotal:', 400, startY + 15)
            .text('IVA (0%):', 400, startY + 30)
            .font('Helvetica-Bold')
            .text('TOTAL:', 400, startY + 45);

        doc.font('Helvetica')
            .text(this.formatCurrency(invoice.subtotal || invoice.total), 470, startY + 15, { width: 80, align: 'right' })
            .text(this.formatCurrency(invoice.tax || 0), 470, startY + 30, { width: 80, align: 'right' })
            .font('Helvetica-Bold')
            .fontSize(12)
            .fillColor('#2c3e50')
            .text(this.formatCurrency(invoice.total), 470, startY + 45, { width: 80, align: 'right' });
    }

    /**
     * Agregar footer
     */
    addInvoiceFooter(doc, institution) {
        const footerY = 680; // Aumentado para dar más espacio

        // Línea separadora
        doc.moveTo(50, footerY)
            .lineTo(550, footerY)
            .strokeColor('#bdc3c7')
            .lineWidth(1)
            .stroke();

        doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#666666')
            .text('Esta factura fue generada electrónicamente por el Sistema de Gestión Educativa', 50, footerY + 15, { width: 500 })
            .text(`Resolución DIAN: ${institution?.resolution || 'N/A'}`, 50, footerY + 30)
            .text('Los servicios educativos están exentos de IVA según el artículo 476 del Estatuto Tributario', 50, footerY + 45, { width: 500 });

        // Información de contacto
        doc.text(`Para consultas: ${institution?.email || 'N/A'} | ${institution?.phone || 'N/A'}`, 50, footerY + 65, { width: 500 });
    }

    /**
     * Formatear fecha
     */
    formatDate(date) {
        return new Date(date).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Formatear moneda
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Obtener texto del estado
     */
    getStatusText(status) {
        const texts = {
            'PENDING': 'Pendiente',
            'PAID': 'Pagada',
            'PARTIAL': 'Pago Parcial',
            'OVERDUE': 'Vencida',
            'CANCELLED': 'Cancelada'
        };
        return texts[status] || status;
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