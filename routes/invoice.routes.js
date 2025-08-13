const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, canManageAccounting } = require('../middleware/auth.middleware');
const invoiceGeneratorService = require('../services/invoice-generator.service');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const prisma = new PrismaClient();

// Validation rules
const validateInvoice = [
  body('studentId').optional().isUUID().withMessage('ID de estudiante inválido'),
  body('concept').isIn([
    'TUITION', 'MONTHLY', 'EVENT', 'UNIFORM', 'BOOKS', 'TRANSPORT', 'CAFETERIA',
    'OFFICE_SUPPLIES', 'MAINTENANCE', 'UTILITIES', 'PROFESSIONAL_SERVICES', 
    'EQUIPMENT', 'CLEANING_SUPPLIES', 'FOOD_SUPPLIES', 'EDUCATIONAL_MATERIALS',
    'TECHNOLOGY', 'INSURANCE', 'RENT', 'OTHER'
  ]).withMessage('Concepto inválido'),
  body('type').optional().isIn(['OUTGOING', 'INCOMING']).withMessage('Tipo de factura inválido'),
  body('dueDate').isISO8601().withMessage('Fecha de vencimiento inválida'),
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un item'),
  body('items.*.description').notEmpty().withMessage('Descripción del item requerida'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Precio unitario inválido')
];

// Get all invoices with filters and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = '', 
      studentId = '', 
      concept = '',
      type = 'OUTGOING',
      search = ''
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    const where = {};
    
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (concept) where.concept = concept;
    if (type) where.type = type;
    
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { student: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { document: { contains: search } }
          ]
        }}
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { 
          student: { 
            select: { 
              id: true, 
              firstName: true, 
              lastName: true, 
              document: true,
              grade: { select: { name: true } },
              group: { select: { name: true } }
            } 
          },
          items: true,
          user: { select: { name: true } }
        },
        orderBy: { date: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.invoice.count({ where })
    ]);

    res.json({
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Invoices fetch error:', error);
    res.status(500).json({ error: 'Error al obtener facturas' });
  }
});

// Get debts information - MUST BE BEFORE /:id route
router.get('/debts', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      gradeId = '', 
      groupId = '',
      minAmount = 0,
      daysOverdue = 0
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const today = new Date();
    
    // Calculate overdue date
    const overdueDate = new Date();
    overdueDate.setDate(today.getDate() - parseInt(daysOverdue));

    // Build where clause for debts
    const where = {
      status: { in: ['PENDING', 'PARTIAL'] },
      ...(daysOverdue > 0 && { dueDate: { lt: overdueDate } })
    };

    if (gradeId || groupId) {
      where.student = {};
      if (gradeId) where.student.gradeId = gradeId;
      if (groupId) where.student.groupId = groupId;
    }

    // Get invoices with debts
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              document: true,
              phone: true,
              email: true,
              grade: { select: { name: true } },
              group: { select: { name: true } },
              guardianName: true,
              guardianPhone: true
            }
          },
          payments: {
            where: { status: 'COMPLETED' },
            select: { amount: true }
          }
        },
        orderBy: { dueDate: 'asc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.invoice.count({ where })
    ]);

    // Calculate debt amounts and days overdue
    const debts = invoices.map(invoice => {
      const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const pendingAmount = invoice.total - totalPaid;
      const daysOverdue = Math.max(0, Math.floor((today - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24)));
      
      return {
        ...invoice,
        totalPaid,
        pendingAmount,
        daysOverdue,
        isOverdue: new Date(invoice.dueDate) < today
      };
    }).filter(debt => debt.pendingAmount >= parseFloat(minAmount));

    res.json({
      debts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: debts.length,
        pages: Math.ceil(debts.length / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Debts fetch error:', error);
    res.status(500).json({ error: 'Error al obtener información de deudas' });
  }
});

// Get debts statistics - MUST BE BEFORE /:id route
router.get('/debts/stats', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    
    const [
      totalDebtors,
      overdueDebtors,
      totalDebtAmount,
      overdueDebtAmount
    ] = await Promise.all([
      // Total debtors
      prisma.invoice.findMany({
        where: { status: { in: ['PENDING', 'PARTIAL'] } },
        select: { studentId: true },
        distinct: ['studentId']
      }),
      
      // Overdue debtors
      prisma.invoice.findMany({
        where: { 
          status: { in: ['PENDING', 'PARTIAL'] },
          dueDate: { lt: today }
        },
        select: { studentId: true },
        distinct: ['studentId']
      }),
      
      // Total debt amount
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { status: { in: ['PENDING', 'PARTIAL'] } }
      }),
      
      // Overdue debt amount
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { 
          status: { in: ['PENDING', 'PARTIAL'] },
          dueDate: { lt: today }
        }
      })
    ]);

    res.json({
      totalDebtors: totalDebtors.length,
      overdueDebtors: overdueDebtors.length,
      totalDebtAmount: totalDebtAmount._sum.total || 0,
      overdueDebtAmount: overdueDebtAmount._sum.total || 0
    });

  } catch (error) {
    console.error('Debt stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de deudas' });
  }
});

// Get invoice statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const [
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      overdueInvoices,
      totalAmount,
      pendingAmount
    ] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'PENDING' } }),
      prisma.invoice.count({ where: { status: 'PAID' } }),
      prisma.invoice.count({ 
        where: { 
          status: 'PENDING',
          dueDate: { lt: new Date() }
        } 
      }),
      prisma.invoice.aggregate({
        _sum: { total: true }
      }),
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { status: 'PENDING' }
      })
    ]);

    res.json({
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      overdueInvoices,
      totalAmount: totalAmount._sum.total || 0,
      pendingAmount: pendingAmount._sum.total || 0
    });
  } catch (error) {
    console.error('Invoice stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Get single invoice - MUST BE AFTER specific routes
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        student: {
          include: {
            grade: { select: { name: true } },
            group: { select: { name: true } }
          }
        },
        items: true,
        user: { select: { name: true } },
        payments: {
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Invoice fetch error:', error);
    res.status(500).json({ error: 'Error al obtener factura' });
  }
});

// Create invoice
router.post('/', authenticateToken, canManageAccounting, validateInvoice, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, ...invoiceData } = req.body;
    
    // Calculate totals - Educational services are exempt from VAT
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = 0; // Educational services are exempt from VAT
    const total = subtotal; // Total equals subtotal for educational services

    // Generate unique invoice number
    const invoiceNumber = await generateUniqueInvoiceNumber(prisma);

    const invoice = await prisma.invoice.create({
      data: {
        ...invoiceData,
        invoiceNumber,
        userId: req.user.id,
        date: new Date(),
        dueDate: new Date(invoiceData.dueDate),
        subtotal,
        tax,
        total,
        status: 'PENDING',
        items: {
          create: items.map(item => ({
            ...item,
            total: item.quantity * item.unitPrice
          }))
        }
      },
      include: { 
        items: true,
        student: {
          select: {
            firstName: true,
            lastName: true,
            document: true
          }
        }
      }
    });
    
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Invoice creation error:', error);
    
    // Handle specific errors
    if (error.code === 'P2002' || error.message.includes('duplicado')) {
      return res.status(400).json({ error: 'Número de factura duplicado' });
    }
    
    res.status(500).json({ error: 'Error al crear factura' });
  }
});

// Create bulk invoices - MEJORADO
router.post('/bulk', authenticateToken, canManageAccounting, async (req, res) => {
  try {
    const { gradeIds = [], groupIds = [], concept, description, amount, dueDate, includeInactive = false } = req.body;
    
    if ((!gradeIds.length && !groupIds.length) || !concept || !description || !amount || !dueDate) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const result = await invoiceGeneratorService.generateBulkInvoices({
      gradeIds,
      groupIds,
      concept,
      description,
      amount,
      dueDate,
      userId: req.user.id,
      includeInactive
    });
    
    res.status(201).json({
      message: `Se crearon ${result.count} facturas exitosamente`,
      ...result
    });
    
  } catch (error) {
    console.error('Bulk invoice creation error:', error);
    res.status(500).json({ error: error.message || 'Error al crear facturas masivas' });
  }
});

// Generate monthly invoices - NUEVO
router.post('/generate/monthly', authenticateToken, canManageAccounting, async (req, res) => {
  try {
    const { month, year, baseAmount, gradeSpecificAmounts = {} } = req.body;
    
    if (!month || !year || !baseAmount) {
      return res.status(400).json({ error: 'Mes, año y monto base son requeridos' });
    }

    const result = await invoiceGeneratorService.generateMonthlyInvoices({
      month: parseInt(month),
      year: parseInt(year),
      baseAmount: parseFloat(baseAmount),
      gradeSpecificAmounts,
      userId: req.user.id
    });
    
    res.status(201).json(result);
    
  } catch (error) {
    console.error('Monthly invoice generation error:', error);
    res.status(500).json({ error: error.message || 'Error al generar facturas mensuales' });
  }
});

// Generate event invoices - NUEVO
router.post('/generate/event/:eventId', authenticateToken, canManageAccounting, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const result = await invoiceGeneratorService.generateEventInvoices(eventId, req.user.id);
    
    res.status(201).json(result);
    
  } catch (error) {
    console.error('Event invoice generation error:', error);
    res.status(500).json({ error: error.message || 'Error al generar facturas de evento' });
  }
});

// Get invoice templates - NUEVO
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const templates = await invoiceGeneratorService.getInvoiceTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Invoice templates error:', error);
    res.status(500).json({ error: 'Error al obtener plantillas' });
  }
});

// Update invoice
router.put('/:id', authenticateToken, canManageAccounting, async (req, res) => {
  try {
    const { items, ...invoiceData } = req.body;
    
    // Calculate totals if items are provided - Educational services are exempt from VAT
    let updateData = { ...invoiceData };
    
    if (items) {
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const tax = 0; // Educational services are exempt from VAT
      const total = subtotal; // Total equals subtotal for educational services
      
      updateData = {
        ...updateData,
        subtotal,
        tax,
        total
      };
    }

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: updateData,
      include: { 
        items: true,
        student: {
          select: {
            firstName: true,
            lastName: true,
            document: true
          }
        }
      }
    });

    // Update items if provided
    if (items) {
      // Delete existing items
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: req.params.id }
      });
      
      // Create new items
      await prisma.invoiceItem.createMany({
        data: items.map(item => ({
          ...item,
          invoiceId: req.params.id,
          total: item.quantity * item.unitPrice
        }))
      });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Invoice update error:', error);
    res.status(500).json({ error: 'Error al actualizar factura' });
  }
});

// Delete invoice
router.delete('/:id', authenticateToken, canManageAccounting, async (req, res) => {
  try {
    // Check if invoice has payments
    const paymentsCount = await prisma.payment.count({
      where: { invoiceId: req.params.id }
    });

    if (paymentsCount > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar una factura que tiene pagos asociados' 
      });
    }

    await prisma.invoice.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Factura eliminada exitosamente' });
  } catch (error) {
    console.error('Invoice deletion error:', error);
    res.status(500).json({ error: 'Error al eliminar factura' });
  }
});

// Download invoice PDF - USANDO SERVICIO CORREGIDO
router.get('/:id/pdf', authenticateToken, async (req, res) => {
  try {
    console.log('📄 PDF download request for invoice:', req.params.id);
    const invoiceId = req.params.id;
    
    // Usar el servicio corregido para generar el PDF
    const invoiceService = require('../services/invoice-generator.service.js');
    
    const pdfBuffer = await invoiceService.generateInvoicePDFBuffer(invoiceId);
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.log('❌ Error generating PDF buffer');
      return res.status(500).json({ error: 'Error generando PDF' });
    }

    // Obtener información de la factura para el nombre del archivo
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { invoiceNumber: true }
    });

    console.log('✅ PDF generated successfully using corrected service');

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Factura_${invoice?.invoiceNumber || 'Unknown'}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader('Cache-Control', 'no-cache');
    
    console.log('📤 Sending PDF buffer...');
    
    // Enviar buffer
    res.send(pdfBuffer);
    
    console.log('✅ PDF sent successfully with corrected header');
    doc.moveTo(40, currentY)
       .lineTo(555, currentY)
       .strokeColor('#bdc3c7')
       .lineWidth(1)
       .stroke();

    currentY += 20;

    // Información en dos columnas
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('INFORMACIÓN DEL CLIENTE', 40, currentY)
       .text('INFORMACIÓN DE LA FACTURA', 320, currentY);

    currentY += 15;
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#000000');

    // Cliente
    if (invoice.student) {
      const studentName = `${invoice.student.firstName} ${invoice.student.lastName}`;
      doc.text(`Cliente: ${studentName}`, 40, currentY)
         .text(`Documento: ${invoice.student.document}`, 40, currentY + 12)
         .text(`Grado: ${invoice.student.grade?.name || 'N/A'}`, 40, currentY + 24)
         .text(`Grupo: ${invoice.student.group?.name || 'N/A'}`, 40, currentY + 36);
    } else {
      doc.text(`Cliente: ${invoice.clientName || 'Cliente Externo'}`, 40, currentY)
         .text(`Documento: ${invoice.clientDocument || 'N/A'}`, 40, currentY + 12)
         .text(`Email: ${invoice.clientEmail || 'N/A'}`, 40, currentY + 24)
         .text(`Teléfono: ${invoice.clientPhone || 'N/A'}`, 40, currentY + 36);
    }

    // Factura
    doc.text(`Número: ${invoice.invoiceNumber}`, 320, currentY)
       .text(`Fecha: ${new Date(invoice.date).toLocaleDateString('es-CO')}`, 320, currentY + 12)
       .text(`Vencimiento: ${new Date(invoice.dueDate).toLocaleDateString('es-CO')}`, 320, currentY + 24)
       .text(`Estado: Pendiente`, 320, currentY + 36);

    currentY += 60;

    // Tabla de items
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('DESCRIPCIÓN', 40, currentY)
       .text('CANT.', 330, currentY)
       .text('PRECIO UNIT.', 380, currentY)
       .text('TOTAL', 470, currentY);

    // Línea bajo headers
    currentY += 12;
    doc.moveTo(40, currentY)
       .lineTo(555, currentY)
       .strokeColor('#bdc3c7')
       .lineWidth(1)
       .stroke();

    currentY += 15;

    // Items
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#000000');

    invoice.items.forEach(item => {
      doc.text(item.description, 40, currentY, { width: 280, ellipsis: true })
         .text(item.quantity.toString(), 330, currentY, { width: 40, align: 'center' })
         .text(`$${item.unitPrice.toLocaleString()}`, 380, currentY, { width: 80, align: 'right' })
         .text(`$${item.total.toLocaleString()}`, 470, currentY, { width: 85, align: 'right' });
      currentY += 18;
    });

    currentY += 20;

    // Totales
    doc.moveTo(350, currentY)
       .lineTo(555, currentY)
       .strokeColor('#bdc3c7')
       .lineWidth(1)
       .stroke();

    currentY += 10;
    doc.fontSize(9)
       .font('Helvetica')
       .text('Subtotal:', 400, currentY)
       .text('IVA (0%):', 400, currentY + 12)
       .font('Helvetica-Bold')
       .fontSize(10)
       .text('TOTAL:', 400, currentY + 24);

    doc.font('Helvetica')
       .fontSize(9)
       .text(`$${invoice.total.toLocaleString()}`, 470, currentY, { width: 85, align: 'right' })
       .text('$0', 470, currentY + 12, { width: 85, align: 'right' })
       .font('Helvetica-Bold')
       .fontSize(11)
       .fillColor('#2c3e50')
       .text(`$${invoice.total.toLocaleString()}`, 470, currentY + 24, { width: 85, align: 'right' });

    currentY += 60;

    // Footer
    doc.moveTo(40, currentY)
       .lineTo(555, currentY)
       .strokeColor('#bdc3c7')
       .lineWidth(1)
       .stroke();

    currentY += 10;
    doc.fontSize(7)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Esta factura fue generada electrónicamente por el Sistema de Gestión Educativa', 40, currentY, { width: 515 })
       .text(`Resolución DIAN: ${institution?.resolution || 'N/A'}`, 40, currentY + 12)
       .text('Los servicios educativos están exentos de IVA según el artículo 476 del Estatuto Tributario', 40, currentY + 24, { width: 515 })
       .text(`Para consultas: ${institution?.email || 'N/A'} | ${institution?.phone || 'N/A'}`, 40, currentY + 36, { width: 515 });
    
    // Convertir a buffer
    const buffers = [];
    
    doc.on('data', (chunk) => {
      buffers.push(chunk);
    });
    
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      console.log('📦 PDF buffer created, size:', pdfBuffer.length, 'bytes');
      
      // Configurar headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Factura_${invoice.invoiceNumber}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache');
      
      console.log('📤 Sending PDF buffer...');
      
      // Enviar buffer
      res.send(pdfBuffer);
      
      console.log('✅ PDF sent successfully');
    });
    
    doc.on('error', (error) => {
      console.error('❌ PDF creation error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error creando PDF' });
      }
    });
    
    // Finalizar documento
    doc.end();

  } catch (error) {
    console.error('❌ PDF generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar PDF de la factura' });
    }
  }
});

// Generate invoice for student events
router.post('/student', authenticateToken, canManageAccounting, async (req, res) => {
  try {
    const { studentId, concept, observations, assignmentIds } = req.body;

    // Validate required fields
    if (!studentId || !assignmentIds || assignmentIds.length === 0) {
      return res.status(400).json({ error: 'Datos requeridos faltantes' });
    }

    // Get student data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        grade: { select: { name: true } },
        group: { select: { name: true } }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    // Get assignments data
    const assignments = await prisma.eventAssignment.findMany({
      where: { 
        id: { in: assignmentIds },
        studentId: studentId
      },
      include: {
        event: {
          select: {
            name: true,
            ticketPrice: true
          }
        }
      }
    });

    if (assignments.length === 0) {
      return res.status(404).json({ error: 'No se encontraron asignaciones válidas' });
    }

    // Generate unique invoice number
    const invoiceNumber = await generateUniqueInvoiceNumber(prisma);

    // Calculate items and total
    const items = assignments.map(assignment => {
      const pendingTickets = assignment.ticketsAssigned - assignment.ticketsSold;
      const unitPrice = assignment.event.ticketPrice;
      const total = pendingTickets * unitPrice;

      return {
        description: `${assignment.event.name} - Boletos`,
        quantity: pendingTickets,
        unitPrice: unitPrice,
        total: total
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    // Create invoice in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Double-check that the invoice number is still unique
      const existingInvoice = await tx.invoice.findUnique({
        where: { invoiceNumber }
      });

      if (existingInvoice) {
        throw new Error('Número de factura duplicado');
      }

      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          studentId,
          concept: 'EVENT',
          subtotal: totalAmount,
          tax: 0,
          total: totalAmount,
          status: 'PENDING',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          observations: observations || null,
          userId: req.user.id,
          items: {
            create: items
          }
        },
        include: {
          items: true,
          student: {
            select: {
              firstName: true,
              lastName: true,
              document: true,
              grade: { select: { name: true } },
              group: { select: { name: true } }
            }
          }
        }
      });

      return invoice;
    });

    res.status(201).json({
      message: 'Factura generada exitosamente',
      invoice: result
    });

  } catch (error) {
    console.error('Student invoice generation error:', error);
    res.status(500).json({ error: 'Error al generar factura del estudiante' });
  }
});

// Función mejorada para generar números de factura únicos
async function generateUniqueInvoiceNumber(prisma, retries = 5) {
  const currentYear = new Date().getFullYear();
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Usar transacción para evitar condiciones de carrera
      const result = await prisma.$transaction(async (tx) => {
        // Obtener el último número del año actual con bloqueo
        const lastInvoice = await tx.invoice.findFirst({
          where: {
            invoiceNumber: {
              startsWith: `FAC-${currentYear}-`
            }
          },
          orderBy: { invoiceNumber: 'desc' }
        });

        let nextNumber = 1;
        if (lastInvoice) {
          const parts = lastInvoice.invoiceNumber.split('-');
          if (parts.length === 3) {
            nextNumber = parseInt(parts[2]) + 1;
          }
        }

        const invoiceNumber = `FAC-${currentYear}-${nextNumber.toString().padStart(6, '0')}`;

        // Verificar que no existe (doble verificación)
        const existing = await tx.invoice.findUnique({
          where: { invoiceNumber }
        });

        if (existing) {
          throw new Error('Número de factura ya existe');
        }

        return invoiceNumber;
      });

      return result;
    } catch (error) {
      if (attempt === retries - 1) {
        throw new Error('No se pudo generar un número de factura único: ' + error.message);
      }
      
      // Esperar un tiempo aleatorio antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    }
  }
}

// Generate external invoice - Improved version with unique number generation
router.post('/external', authenticateToken, canManageAccounting, async (req, res) => {
  try {
    console.log('📄 External invoice request received:', req.body);
    
    const { 
      clientName, 
      clientDocument, 
      clientEmail, 
      clientPhone, 
      concept, 
      dueDate, 
      observations, 
      items 
    } = req.body;

    // Validate required fields
    if (!clientName || !clientDocument || !concept || !dueDate || !items || items.length === 0) {
      console.error('❌ Missing required fields:', {
        clientName: !!clientName,
        clientDocument: !!clientDocument,
        concept: !!concept,
        dueDate: !!dueDate,
        items: items?.length || 0
      });
      return res.status(400).json({ error: 'Datos requeridos faltantes' });
    }

    // Generate unique invoice number
    const invoiceNumber = await generateUniqueInvoiceNumber(prisma);

    // Calculate total
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    console.log('💰 Calculated total:', totalAmount);
    console.log('🔢 Invoice number:', invoiceNumber);

    // Create invoice in transaction
    const result = await prisma.$transaction(async (tx) => {
      console.log('🔄 Starting transaction...');
      
      // Double-check that the invoice number is still unique
      const existingInvoice = await tx.invoice.findUnique({
        where: { invoiceNumber }
      });

      if (existingInvoice) {
        throw new Error('Número de factura duplicado');
      }
      
      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          concept,
          subtotal: totalAmount, // Educational services are tax-exempt
          tax: 0, // No tax for educational services
          total: totalAmount,
          status: 'PENDING',
          dueDate: new Date(dueDate),
          observations: observations || null,
          userId: req.user.id,
          type: 'OUTGOING', // Explicitly set type
          // External client data
          clientName,
          clientDocument,
          clientEmail: clientEmail || null,
          clientPhone: clientPhone || null,
          isExternal: true,
          items: {
            create: items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice
            }))
          }
        },
        include: {
          items: true
        }
      });

      console.log('✅ Invoice created successfully:', invoice.invoiceNumber);
      return invoice;
    });

    res.status(201).json({
      message: 'Factura externa generada exitosamente',
      invoice: result
    });

  } catch (error) {
    console.error('❌ External invoice generation error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    
    // More specific error messages
    if (error.code === 'P2002' || error.message.includes('duplicado')) {
      return res.status(400).json({ error: 'Número de factura duplicado' });
    } else if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Error de referencia en la base de datos' });
    } else if (error.message.includes('required')) {
      return res.status(400).json({ error: 'Faltan campos requeridos: ' + error.message });
    }
    
    res.status(500).json({ 
      error: 'Error al generar factura externa',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Test endpoint for external invoices (debugging)
router.post('/external/test', authenticateToken, async (req, res) => {
  try {
    console.log('🧪 Test external invoice endpoint called');
    console.log('User:', req.user);
    console.log('Body:', req.body);
    
    res.json({
      message: 'Test endpoint working',
      user: req.user.name,
      timestamp: new Date().toISOString(),
      bodyReceived: req.body
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;