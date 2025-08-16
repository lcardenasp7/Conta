const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Ruta para verificar facturas a través del código QR
 * GET /verify-invoice/:id
 */
router.get('/verify-invoice/:id', async (req, res) => {
    try {
        const invoiceId = req.params.id;

        // Buscar la factura
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
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

        if (!invoice) {
            return res.status(404).json({
                error: 'Factura no encontrada',
                valid: false
            });
        }

        // Información de verificación
        const verificationData = {
            valid: true,
            invoice: {
                number: invoice.invoiceNumber,
                date: invoice.date,
                dueDate: invoice.dueDate,
                total: invoice.total,
                status: invoice.status,
                concept: invoice.concept
            },
            client: invoice.student ? {
                name: `${invoice.student.firstName} ${invoice.student.lastName}`,
                document: invoice.student.document,
                type: 'Estudiante'
            } : {
                name: invoice.clientName || 'Cliente Externo',
                document: invoice.clientDocument || 'N/A',
                type: 'Cliente Externo'
            },
            institution: {
                name: 'INSTITUCIÓN EDUCATIVA DISTRITAL VILLAS DE SAN PABLO',
                nit: '901.079.125-0',
                email: 'contabilidad@villasanpablo.edu.co',
                phone: '3004566968-3012678548'
            },
            items: invoice.items.map(item => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total
            })),
            verification: {
                timestamp: new Date().toISOString(),
                message: 'Factura verificada exitosamente'
            }
        };

        res.json(verificationData);

    } catch (error) {
        console.error('Error verificando factura:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            valid: false
        });
    }
});

/**
 * Página HTML para mostrar la verificación de facturas
 * GET /verify-invoice-page/:id
 */
router.get('/verify-invoice-page/:id', async (req, res) => {
    try {
        const invoiceId = req.params.id;

        // Buscar la factura
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
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

        if (!invoice) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Factura No Encontrada</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .error { color: #dc3545; }
                    </style>
                </head>
                <body>
                    <h1 class="error">❌ Factura No Encontrada</h1>
                    <p>La factura solicitada no existe o ha sido eliminada.</p>
                </body>
                </html>
            `);
        }

        // Generar página de verificación
        const clientName = invoice.student ? 
            `${invoice.student.firstName} ${invoice.student.lastName}` : 
            (invoice.clientName || 'Cliente Externo');

        const html = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verificación de Factura - ${invoice.invoiceNumber}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        max-width: 800px; 
                        margin: 0 auto; 
                        padding: 20px;
                        background-color: #f8f9fa;
                    }
                    .container { 
                        background: white; 
                        padding: 30px; 
                        border-radius: 10px; 
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .header { 
                        text-align: center; 
                        border-bottom: 2px solid #FF6B35; 
                        padding-bottom: 20px; 
                        margin-bottom: 30px;
                    }
                    .valid { color: #28a745; }
                    .info-grid { 
                        display: grid; 
                        grid-template-columns: 1fr 1fr; 
                        gap: 20px; 
                        margin: 20px 0;
                    }
                    .info-box { 
                        padding: 15px; 
                        border: 1px solid #1E3A8A; 
                        border-radius: 5px; 
                        background-color: #f8f9fa;
                    }
                    .info-box h3 { 
                        margin-top: 0; 
                        color: #1E3A8A; 
                    }
                    .items-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 20px 0;
                    }
                    .items-table th, .items-table td { 
                        border: 1px solid #ddd; 
                        padding: 10px; 
                        text-align: left;
                    }
                    .items-table th { 
                        background-color: #1E3A8A; 
                        color: white;
                    }
                    .total { 
                        font-size: 1.2em; 
                        font-weight: bold; 
                        color: #FF6B35;
                    }
                    .footer { 
                        text-align: center; 
                        margin-top: 30px; 
                        padding-top: 20px; 
                        border-top: 1px solid #ddd; 
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 class="valid">✅ Factura Verificada</h1>
                        <h2>INSTITUCIÓN EDUCATIVA DISTRITAL VILLAS DE SAN PABLO</h2>
                        <p>NIT: 901.079.125-0</p>
                    </div>

                    <div class="info-grid">
                        <div class="info-box">
                            <h3>Información de la Factura</h3>
                            <p><strong>Número:</strong> ${invoice.invoiceNumber}</p>
                            <p><strong>Fecha:</strong> ${invoice.date.toLocaleDateString('es-CO')}</p>
                            <p><strong>Vencimiento:</strong> ${invoice.dueDate.toLocaleDateString('es-CO')}</p>
                            <p><strong>Estado:</strong> ${invoice.status}</p>
                        </div>

                        <div class="info-box">
                            <h3>Información del Cliente</h3>
                            <p><strong>Nombre:</strong> ${clientName}</p>
                            <p><strong>Documento:</strong> ${invoice.student?.document || invoice.clientDocument || 'N/A'}</p>
                            <p><strong>Tipo:</strong> ${invoice.student ? 'Estudiante' : 'Cliente Externo'}</p>
                        </div>
                    </div>

                    <h3>Detalle de Items</h3>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Descripción</th>
                                <th>Cantidad</th>
                                <th>Precio Unitario</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.items.map(item => `
                                <tr>
                                    <td>${item.description}</td>
                                    <td>${item.quantity}</td>
                                    <td>$${item.unitPrice.toLocaleString('es-CO')}</td>
                                    <td>$${item.total.toLocaleString('es-CO')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div style="text-align: right;">
                        <p class="total">Total: $${invoice.total.toLocaleString('es-CO')}</p>
                    </div>

                    <div class="footer">
                        <p>Esta verificación fue generada el ${new Date().toLocaleString('es-CO')}</p>
                        <p>Para consultas: contabilidad@villasanpablo.edu.co | 3004566968-3012678548</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        res.send(html);

    } catch (error) {
        console.error('Error generando página de verificación:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error de Verificación</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .error { color: #dc3545; }
                </style>
            </head>
            <body>
                <h1 class="error">❌ Error de Verificación</h1>
                <p>Ocurrió un error al verificar la factura. Intente nuevamente más tarde.</p>
            </body>
            </html>
        `);
    }
});

module.exports = router;