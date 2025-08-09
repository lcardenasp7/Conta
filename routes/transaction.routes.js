const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, canManageAccounting } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

// Get all transactions
router.get('/', authenticateToken, canManageAccounting, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        debitAccount: { select: { code: true, name: true } },
        creditAccount: { select: { code: true, name: true } },
        user: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    console.error('Transactions fetch error:', error);
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
});

// Create transaction
router.post('/', authenticateToken, canManageAccounting, async (req, res) => {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        ...req.body,
        userId: req.user.id,
        date: new Date(req.body.date)
      }
    });
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Transaction creation error:', error);
    res.status(500).json({ error: 'Error al crear transacción' });
  }
});

module.exports = router;