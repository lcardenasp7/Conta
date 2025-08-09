const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, canManageStudents } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

// Validation rules
const validateGrade = [
  body('name').notEmpty().trim().withMessage('Nombre del grado es requerido'),
  body('level').notEmpty().trim().withMessage('Nivel es requerido'),
  body('order').isInt({ min: 1 }).withMessage('Orden debe ser un número mayor a 0')
];

// Get all grades
router.get('/', authenticateToken, async (req, res) => {
  try {
    const grades = await prisma.grade.findMany({
      include: {
        _count: {
          select: { students: true, groups: true }
        }
      },
      orderBy: { order: 'asc' }
    });
    res.json(grades);
  } catch (error) {
    console.error('Grades fetch error:', error);
    res.status(500).json({ error: 'Error al obtener grados' });
  }
});

// Get single grade
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const grade = await prisma.grade.findUnique({
      where: { id: req.params.id },
      include: {
        students: {
          include: {
            group: true
          }
        },
        groups: {
          include: {
            _count: {
              select: { students: true }
            }
          }
        }
      }
    });

    if (!grade) {
      return res.status(404).json({ error: 'Grado no encontrado' });
    }

    res.json(grade);
  } catch (error) {
    console.error('Grade fetch error:', error);
    res.status(500).json({ error: 'Error al obtener grado' });
  }
});

// Create grade
router.post('/', authenticateToken, canManageStudents, validateGrade, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, level, order } = req.body;

    // Check if order already exists
    const existingOrder = await prisma.grade.findFirst({
      where: { order }
    });

    if (existingOrder) {
      return res.status(409).json({
        error: 'Ya existe un grado con ese orden'
      });
    }

    const grade = await prisma.grade.create({
      data: {
        name,
        level,
        order
      }
    });

    res.status(201).json(grade);
  } catch (error) {
    console.error('Grade creation error:', error);
    res.status(500).json({ error: 'Error al crear grado' });
  }
});

// Update grade
router.put('/:id', authenticateToken, canManageStudents, validateGrade, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, level, order } = req.body;

    // Check if order already exists (excluding current grade)
    const existingOrder = await prisma.grade.findFirst({
      where: {
        order,
        id: { not: req.params.id }
      }
    });

    if (existingOrder) {
      return res.status(409).json({
        error: 'Ya existe otro grado con ese orden'
      });
    }

    const grade = await prisma.grade.update({
      where: { id: req.params.id },
      data: {
        name,
        level,
        order
      }
    });

    res.json(grade);
  } catch (error) {
    console.error('Grade update error:', error);
    res.status(500).json({ error: 'Error al actualizar grado' });
  }
});

// Delete grade
router.delete('/:id', authenticateToken, canManageStudents, async (req, res) => {
  try {
    // Check if grade has students
    const studentsCount = await prisma.student.count({
      where: { gradeId: req.params.id }
    });

    if (studentsCount > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar un grado que tiene estudiantes asignados'
      });
    }

    // Check if grade has groups
    const groupsCount = await prisma.group.count({
      where: { gradeId: req.params.id }
    });

    if (groupsCount > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar un grado que tiene grupos asignados'
      });
    }

    await prisma.grade.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Grado eliminado exitosamente' });
  } catch (error) {
    console.error('Grade deletion error:', error);
    res.status(500).json({ error: 'Error al eliminar grado' });
  }
});

// Get grade statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const [totalStudents, activeStudents, groups] = await Promise.all([
      prisma.student.count({ where: { gradeId: req.params.id } }),
      prisma.student.count({
        where: {
          gradeId: req.params.id,
          status: 'ACTIVE'
        }
      }),
      prisma.group.findMany({
        where: { gradeId: req.params.id },
        include: {
          _count: {
            select: { students: true }
          }
        }
      })
    ]);

    res.json({
      totalStudents,
      activeStudents,
      totalGroups: groups.length,
      groups: groups.map(group => ({
        id: group.id,
        name: group.name,
        studentsCount: group._count.students,
        capacity: group.capacity
      }))
    });
  } catch (error) {
    console.error('Grade stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas del grado' });
  }
});

module.exports = router;