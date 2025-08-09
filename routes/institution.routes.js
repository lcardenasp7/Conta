const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

// Get institution data (public access for basic info)
router.get('/', async (req, res) => {
  try {
    const institution = await prisma.institution.findFirst();
    res.json(institution);
  } catch (error) {
    console.error('Institution fetch error:', error);
    res.status(500).json({ error: 'Error al obtener datos institucionales' });
  }
});

// Update institution data
router.put('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const data = req.body;
    const institution = await prisma.institution.upsert({
      where: { nit: data.nit },
      update: data,
      create: data
    });
    res.json(institution);
  } catch (error) {
    console.error('Institution update error:', error);
    res.status(500).json({ error: 'Error al actualizar datos institucionales' });
  }
});

module.exports = router;