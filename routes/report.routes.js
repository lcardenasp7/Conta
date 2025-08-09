const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, canViewReports } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

// Get financial reports
router.get('/financial', authenticateToken, canViewReports, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        debitAccount: true,
        creditAccount: true
      }
    });
    
    res.json({ transactions });
  } catch (error) {
    console.error('Financial report error:', error);
    res.status(500).json({ error: 'Error al generar reporte financiero' });
  }
});

module.exports = router;