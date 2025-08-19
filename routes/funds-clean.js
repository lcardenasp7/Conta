/**
 * RUTAS DE FONDOS - VERSIÓN LIMPIA PARA PRODUCCIÓN
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

console.log('📋 Cargando rutas de fondos (versión limpia)...');

// ==========================================
// RUTAS DE FONDOS
// ==========================================

// GET /api/funds - Obtener todos los fondos
router.get('/', authenticateToken, async (req, res) => {
    try {
        const funds = await prisma.fund.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        transactions: true,
                        alerts: true
                    }
                }
            }
        });

        res.json(funds);
    } catch (error) {
        console.error('Error al obtener fondos:', error);
        res.status(500).json({ error: 'Error al obtener fondos' });
    }
});

// POST /api/funds - Crear nuevo fondo
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, code, type, description, initialBalance } = req.body;

        // Validaciones
        if (!name || !code || !type) {
            return res.status(400).json({ 
                error: 'Nombre, código y tipo son requeridos' 
            });
        }

        // Verificar que el código no exista
        const existingFund = await prisma.fund.findUnique({
            where: { code }
        });

        if (existingFund) {
            return res.status(409).json({ 
                error: 'Ya existe un fondo con ese código' 
            });
        }

        const fund = await prisma.fund.create({
            data: {
                name,
                code,
                type,
                description,
                initialBalance: initialBalance || 0,
                currentBalance: initialBalance || 0,
                totalIncome: 0,
                totalExpenses: 0
            }
        });

        res.status(201).json(fund);
    } catch (error) {
        console.error('Error al crear fondo:', error);
        res.status(500).json({ error: 'Error al crear fondo' });
    }
});

// GET /api/funds/:id - Obtener fondo específico
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const fund = await prisma.fund.findUnique({
            where: { id },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                alerts: {
                    where: { isActive: true },
                    orderBy: { triggeredAt: 'desc' }
                }
            }
        });

        if (!fund) {
            return res.status(404).json({ error: 'Fondo no encontrado' });
        }

        res.json(fund);
    } catch (error) {
        console.error('Error al obtener fondo:', error);
        res.status(500).json({ error: 'Error al obtener fondo' });
    }
});

// PUT /api/funds/:id - Actualizar fondo
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, alertLevel1, alertLevel2, alertLevel3 } = req.body;

        const fund = await prisma.fund.update({
            where: { id },
            data: {
                name,
                description,
                alertLevel1,
                alertLevel2,
                alertLevel3
            }
        });

        res.json(fund);
    } catch (error) {
        console.error('Error al actualizar fondo:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Fondo no encontrado' });
        }
        res.status(500).json({ error: 'Error al actualizar fondo' });
    }
});

// DELETE /api/funds/:id - Eliminar fondo
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que no tenga transacciones
        const transactionCount = await prisma.fundTransaction.count({
            where: { fundId: id }
        });

        if (transactionCount > 0) {
            return res.status(400).json({ 
                error: 'No se puede eliminar un fondo con transacciones' 
            });
        }

        await prisma.fund.delete({
            where: { id }
        });

        res.json({ message: 'Fondo eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar fondo:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Fondo no encontrado' });
        }
        res.status(500).json({ error: 'Error al eliminar fondo' });
    }
});

// ==========================================
// RUTAS DE TRANSACCIONES DE FONDOS
// ==========================================

// GET /api/funds/:id/transactions - Obtener transacciones de un fondo
router.get('/:id/transactions', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const transactions = await prisma.fundTransaction.findMany({
            where: { fundId: id },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: parseInt(limit),
            include: {
                user: {
                    select: { name: true, email: true }
                },
                performer: {
                    select: { name: true, email: true }
                }
            }
        });

        const total = await prisma.fundTransaction.count({
            where: { fundId: id }
        });

        res.json({
            transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error al obtener transacciones:', error);
        res.status(500).json({ error: 'Error al obtener transacciones' });
    }
});

// ==========================================
// RUTAS DE PRÉSTAMOS ENTRE FONDOS
// ==========================================

// GET /api/funds/loans - Obtener todos los préstamos
router.get('/loans/all', authenticateToken, async (req, res) => {
    try {
        const loans = await prisma.fundLoan.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                lenderFund: {
                    select: { id: true, name: true, code: true }
                },
                borrowerFund: {
                    select: { id: true, name: true, code: true }
                },
                requester: {
                    select: { name: true, email: true }
                },
                approver: {
                    select: { name: true, email: true }
                }
            }
        });

        res.json(loans);
    } catch (error) {
        console.error('Error al obtener préstamos:', error);
        res.status(500).json({ error: 'Error al obtener préstamos' });
    }
});

// POST /api/funds/loans - Crear nuevo préstamo
router.post('/loans', authenticateToken, async (req, res) => {
    try {
        const { lenderFundId, borrowerFundId, amount, reason, dueDate } = req.body;
        const userId = req.user.userId;

        // Validaciones
        if (!lenderFundId || !borrowerFundId || !amount || !reason || !dueDate) {
            return res.status(400).json({ 
                error: 'Todos los campos son requeridos' 
            });
        }

        if (lenderFundId === borrowerFundId) {
            return res.status(400).json({ 
                error: 'Un fondo no puede prestarse a sí mismo' 
            });
        }

        // Verificar que los fondos existan
        const lenderFund = await prisma.fund.findUnique({
            where: { id: lenderFundId }
        });

        const borrowerFund = await prisma.fund.findUnique({
            where: { id: borrowerFundId }
        });

        if (!lenderFund || !borrowerFund) {
            return res.status(404).json({ 
                error: 'Uno o ambos fondos no existen' 
            });
        }

        // Verificar que el fondo prestamista tenga suficiente saldo
        if (lenderFund.currentBalance < amount) {
            return res.status(400).json({ 
                error: 'El fondo prestamista no tiene suficiente saldo' 
            });
        }

        const loan = await prisma.fundLoan.create({
            data: {
                lenderFundId,
                borrowerFundId,
                amount,
                reason,
                dueDate: new Date(dueDate),
                requestedBy: userId,
                pendingAmount: amount
            },
            include: {
                lenderFund: {
                    select: { id: true, name: true, code: true }
                },
                borrowerFund: {
                    select: { id: true, name: true, code: true }
                },
                requester: {
                    select: { name: true, email: true }
                }
            }
        });

        res.status(201).json(loan);
    } catch (error) {
        console.error('Error al crear préstamo:', error);
        res.status(500).json({ error: 'Error al crear préstamo' });
    }
});

// ==========================================
// RUTAS DE ALERTAS DE FONDOS
// ==========================================

// GET /api/funds/alerts - Obtener todas las alertas
router.get('/alerts/all', authenticateToken, async (req, res) => {
    try {
        const alerts = await prisma.fundAlert.findMany({
            where: { isActive: true },
            orderBy: { triggeredAt: 'desc' },
            include: {
                fund: {
                    select: { id: true, name: true, code: true }
                }
            }
        });

        res.json(alerts);
    } catch (error) {
        console.error('Error al obtener alertas:', error);
        res.status(500).json({ error: 'Error al obtener alertas' });
    }
});

// PUT /api/funds/alerts/:id/read - Marcar alerta como leída
router.put('/alerts/:id/read', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const alert = await prisma.fundAlert.update({
            where: { id },
            data: {
                isRead: true,
                readBy: userId,
                readAt: new Date()
            }
        });

        res.json(alert);
    } catch (error) {
        console.error('Error al marcar alerta como leída:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Alerta no encontrada' });
        }
        res.status(500).json({ error: 'Error al marcar alerta como leída' });
    }
});

// Ruta de prueba (solo para desarrollo)
if (process.env.NODE_ENV !== 'production') {
    router.get('/test', (req, res) => {
        console.log('🧪 Ruta de prueba de fondos llamada');
        res.json({ 
            message: 'Rutas de fondos funcionando correctamente',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    });
}

console.log('✅ Rutas de fondos cargadas correctamente');

module.exports = router;