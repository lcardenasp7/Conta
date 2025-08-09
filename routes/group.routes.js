const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, canManageStudents } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

// Validation rules
const validateGroup = [
  body('gradeId').isUUID().withMessage('Grado inválido'),
  body('name').notEmpty().trim().withMessage('Nombre del grupo es requerido'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacidad debe ser mayor a 0')
];

// Get groups by grade
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { gradeId } = req.query;
    
    const where = gradeId ? { gradeId } : {};
    
    const groups = await prisma.group.findMany({
      where,
      include: {
        grade: {
          select: { id: true, name: true, level: true }
        },
        students: {
          where: { status: 'ACTIVE' },
          select: { id: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    // Add current students count to each group
    const groupsWithStudents = groups.map(group => ({
      ...group,
      currentStudents: group.students.length,
      // Remove the students array from response to keep it clean
      students: undefined
    }));
    
    res.json(groupsWithStudents);
  } catch (error) {
    console.error('Groups fetch error:', error);
    res.status(500).json({ error: 'Error al obtener grupos' });
  }
});

// Get single group
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        grade: true,
        students: {
          where: { status: 'ACTIVE' },
          include: {
            enrollments: {
              where: { year: new Date().getFullYear() },
              take: 1
            }
          },
          orderBy: [
            { lastName: 'asc' },
            { firstName: 'asc' }
          ]
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    res.json(group);
  } catch (error) {
    console.error('Group fetch error:', error);
    res.status(500).json({ error: 'Error al obtener grupo' });
  }
});

// Create group
router.post('/', authenticateToken, canManageStudents, validateGroup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gradeId, name, capacity, teacherName, classroom } = req.body;

    // Check if group name already exists for this grade
    const existingGroup = await prisma.group.findFirst({
      where: { 
        gradeId,
        name
      }
    });

    if (existingGroup) {
      return res.status(409).json({ 
        error: 'Ya existe un grupo con ese nombre en este grado' 
      });
    }

    // Verify grade exists
    const grade = await prisma.grade.findUnique({
      where: { id: gradeId }
    });

    if (!grade) {
      return res.status(404).json({ error: 'Grado no encontrado' });
    }

    const group = await prisma.group.create({
      data: {
        gradeId,
        name,
        capacity,
        teacherName,
        classroom,
        year: new Date().getFullYear()
      },
      include: {
        grade: true,
        _count: {
          select: { students: true }
        }
      }
    });

    res.status(201).json(group);
  } catch (error) {
    console.error('Group creation error:', error);
    res.status(500).json({ error: 'Error al crear grupo' });
  }
});

// Update group - VERSION CON DEBUGGING COMPLETO
router.put('/:id', authenticateToken, canManageStudents, validateGroup, async (req, res) => {
  console.log('🔵 === PUT /groups/:id STARTED ===');
  console.log('🔵 Request ID:', req.params.id);
  console.log('🔵 Request body:', JSON.stringify(req.body, null, 2));
  console.log('🔵 Request headers:', {
    'content-type': req.headers['content-type'],
    'authorization': req.headers.authorization ? 'Bearer [HIDDEN]' : 'No auth header'
  });
  
  try {
    const errors = validationResult(req);
    console.log('🔵 Validation result:', errors.isEmpty() ? 'PASSED' : 'FAILED');
    
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({ errors: errors.array() });
    }

    const { gradeId, name, capacity, teacherName, classroom } = req.body;
    console.log('🔵 Destructured values:', { 
      gradeId, 
      name, 
      capacity, 
      teacherName, 
      classroom,
      types: {
        gradeId: typeof gradeId,
        name: typeof name,
        capacity: typeof capacity,
        teacherName: typeof teacherName,
        classroom: typeof classroom
      }
    });

    // Check if group name already exists for this grade (excluding current group)
    console.log('🔵 Checking for existing group...');
    console.log('🔵 Query params:', { gradeId, name, excludeId: req.params.id });
    
    const existingGroup = await prisma.group.findFirst({
      where: { 
        gradeId,
        name,
        id: { not: req.params.id }
      }
    });
    console.log('🔵 Existing group check result:', existingGroup ? 'FOUND DUPLICATE' : 'NO DUPLICATE');

    if (existingGroup) {
      console.log('❌ Duplicate group found:', existingGroup);
      return res.status(409).json({ 
        error: 'Ya existe otro grupo con ese nombre en este grado' 
      });
    }

    // Check if new capacity is not less than current students
    console.log('🔵 Checking current students for group:', req.params.id);
    const currentStudents = await prisma.student.count({
      where: { 
        groupId: req.params.id,
        status: 'ACTIVE'
      }
    });
    console.log('🔵 Current students count:', currentStudents);
    console.log('🔵 New capacity:', capacity);
    console.log('🔵 Capacity check:', capacity >= currentStudents ? 'PASSED' : 'FAILED');

    if (capacity < currentStudents) {
      console.log('❌ Capacity validation failed');
      return res.status(400).json({
        error: `La capacidad no puede ser menor al número actual de estudiantes (${currentStudents})`
      });
    }

    // Verify the group exists before trying to update
    console.log('🔵 Verifying group exists...');
    const existingGroupToUpdate = await prisma.group.findUnique({
      where: { id: req.params.id }
    });
    
    if (!existingGroupToUpdate) {
      console.log('❌ Group to update not found');
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    console.log('🔵 Group to update found:', existingGroupToUpdate.name);

    // Attempt to update the group
    console.log('🔵 Attempting to update group...');
    console.log('🔵 Update data:', {
      gradeId,
      name,
      capacity,
      teacherName: teacherName || null,
      classroom: classroom || null
    });

    const group = await prisma.group.update({
      where: { id: req.params.id },
      data: {
        gradeId,
        name,
        capacity,
        teacherName: teacherName || null,
        classroom: classroom || null
      },
      include: {
        grade: true,
        _count: {
          select: { students: true }
        }
      }
    });
    
    console.log('🔵 Group updated successfully:', {
      id: group.id,
      name: group.name,
      capacity: group.capacity
    });

    res.json(group);
    
  } catch (error) {
    console.error('❌ === PUT /groups/:id ERROR ===');
    console.error('❌ Error type:', error.constructor.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error meta:', error.meta);
    console.error('❌ Is Prisma Error:', error.name?.includes('Prisma'));
    
    // Log diferentes tipos de errores de Prisma
    if (error.name?.includes('Prisma')) {
      console.error('❌ Prisma error details:', {
        clientVersion: error.clientVersion,
        errorCode: error.code,
        meta: error.meta
      });
    }
    
    console.error('❌ Full error object:', JSON.stringify(error, null, 2));
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ === END ERROR ===');
    
    res.status(500).json({ error: 'Error al actualizar grupo' });
  }
});

// Delete group
router.delete('/:id', authenticateToken, canManageStudents, async (req, res) => {
  try {
    // Check if group has students
    const studentsCount = await prisma.student.count({
      where: { groupId: req.params.id }
    });

    if (studentsCount > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar un grupo que tiene estudiantes asignados'
      });
    }

    await prisma.group.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Grupo eliminado exitosamente' });
  } catch (error) {
    console.error('Group deletion error:', error);
    res.status(500).json({ error: 'Error al eliminar grupo' });
  }
});

// Get group statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const [group, totalStudents, activeStudents, studentsByGender] = await Promise.all([
      prisma.group.findUnique({
        where: { id: req.params.id },
        include: { grade: true }
      }),
      prisma.student.count({ where: { groupId: req.params.id } }),
      prisma.student.count({ 
        where: { 
          groupId: req.params.id,
          status: 'ACTIVE'
        } 
      }),
      prisma.student.groupBy({
        by: ['gender'],
        where: { 
          groupId: req.params.id,
          status: 'ACTIVE'
        },
        _count: true
      })
    ]);

    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    res.json({
      group: {
        id: group.id,
        name: group.name,
        capacity: group.capacity,
        teacherName: group.teacherName,
        classroom: group.classroom,
        grade: group.grade
      },
      totalStudents,
      activeStudents,
      availableCapacity: group.capacity - activeStudents,
      occupancyPercentage: Math.round((activeStudents / group.capacity) * 100),
      studentsByGender
    });
  } catch (error) {
    console.error('Group stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas del grupo' });
  }
});

// Transfer students between groups
router.post('/:id/transfer-students', authenticateToken, canManageStudents, async (req, res) => {
  try {
    const { studentIds, targetGroupId } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'Lista de estudiantes inválida' });
    }

    // Verify target group exists and has capacity
    const targetGroup = await prisma.group.findUnique({
      where: { id: targetGroupId },
      include: {
        _count: {
          select: { students: true }
        }
      }
    });

    if (!targetGroup) {
      return res.status(404).json({ error: 'Grupo destino no encontrado' });
    }

    const availableCapacity = targetGroup.capacity - targetGroup._count.students;
    if (availableCapacity < studentIds.length) {
      return res.status(400).json({
        error: `El grupo destino no tiene suficiente capacidad. Disponible: ${availableCapacity}, Necesario: ${studentIds.length}`
      });
    }

    // Transfer students
    await prisma.student.updateMany({
      where: {
        id: { in: studentIds },
        groupId: req.params.id
      },
      data: {
        groupId: targetGroupId,
        gradeId: targetGroup.gradeId
      }
    });

    res.json({
      message: `${studentIds.length} estudiante(s) transferido(s) exitosamente`,
      transferredCount: studentIds.length
    });

  } catch (error) {
    console.error('Student transfer error:', error);
    res.status(500).json({ error: 'Error al transferir estudiantes' });
  }
});

module.exports = router;