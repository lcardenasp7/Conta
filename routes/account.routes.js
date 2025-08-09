const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, canManageAccounting } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

// Get chart of accounts
router.get('/', authenticateToken, canManageAccounting, async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { code: 'asc' }
    });
    res.json(accounts);
  } catch (error) {
    console.error('Accounts fetch error:', error);
    res.status(500).json({ error: 'Error al obtener plan de cuentas' });
  }
});

module.exports = router;