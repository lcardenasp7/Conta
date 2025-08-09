const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { 
  authenticateToken, 
  canManageStudents,
  logActivity 
} = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

// Validation rules
const validateStudent = [
  body('documentType').isIn(['TI', 'RC', 'CC', 'CE', 'PP']).withMessage('Tipo de documento inválido'),
  body('document').notEmpty().trim().withMessage('Documento es requerido'),
  body('firstName').notEmpty().trim().withMessage('Nombres son requeridos'),
  body('lastName').notEmpty().trim().withMessage('Apellidos son requeridos'),
  body('birthDate').isISO8601().withMessage('Fecha de nacimiento inválida'),
  body('gender').isIn(['M', 'F', 'O']).withMessage('Género inválido'),
  body('address').notEmpty().trim().withMessage('Dirección es requerida'),
  body('gradeId').isUUID().withMessage('Grado inválido'),
  body('groupId').isUUID().withMessage('Grupo inválido'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Email inválido'),
  body('phone').optional().isLength({ min: 7, max: 15 }).withMessage('Teléfono debe tener entre 7 y 15 dígitos')
];

// Get all students with pagination and filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      gradeId = '', 
      groupId = '',
      status = ''
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { document: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (gradeId) where.gradeId = gradeId;
    if (groupId) where.groupId = groupId;
    if (status) where.status = status;

    // Get students with pagination
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          grade: true,
          group: true,
          enrollments: {
            where: { year: new Date().getFullYear() },
            take: 1
          }
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ]
      }),
      prisma.student.count({ where })
    ]);

    res.json({
      students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      error: 'Error al obtener estudiantes'
    });
  }
});

// Get single student by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        grade: true,
        group: true,
        enrollments: {
          orderBy: { year: 'desc' }
        },
        invoices: {
          orderBy: { date: 'desc' },
          take: 5
        },
        payments: {
          orderBy: { date: 'desc' },
          take: 5
        },
        eventAssignments: {
          include: { event: true }
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 30
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        error: 'Estudiante no encontrado'
      });
    }

    res.json(student);

  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      error: 'Error al obtener estudiante'
    });
  }
});

// Create new student
router.post('/', 
  authenticateToken, 
  canManageStudents,
  validateStudent,
  logActivity('CREATE_STUDENT'),
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const studentData = req.body;

      // Check if document already exists
      const existingStudent = await prisma.student.findUnique({
        where: { document: studentData.document }
      });

      if (existingStudent) {
        return res.status(409).json({
          error: 'Ya existe un estudiante con ese documento'
        });
      }

      // Create student and enrollment in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create student
        const student = await tx.student.create({
          data: {
            documentType: studentData.documentType,
            document: studentData.document,
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            birthDate: new Date(studentData.birthDate),
            gender: studentData.gender,
            email: studentData.email,
            phone: studentData.phone,
            address: studentData.address,
            gradeId: studentData.gradeId,
            groupId: studentData.groupId,
            guardianName: studentData.guardianName,
            guardianPhone: studentData.guardianPhone,
            guardianEmail: studentData.guardianEmail,
            status: 'ACTIVE'
          }
        });

        // Create enrollment for current year
        await tx.enrollment.create({
          data: {
            studentId: student.id,
            year: new Date().getFullYear(),
            gradeId: studentData.gradeId,
            groupId: studentData.groupId,
            status: 'ACTIVE'
          }
        });

        return student;
      });

      res.status(201).json({
        message: 'Estudiante creado exitosamente',
        student: result
      });

    } catch (error) {
      console.error('Error creating student:', error);
      res.status(500).json({
        error: 'Error al crear estudiante'
      });
    }
  }
);

// Update student
router.put('/:id',
  authenticateToken,
  canManageStudents,
  validateStudent,
  logActivity('UPDATE_STUDENT'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const studentData = req.body;

      // Check if student exists
      const existingStudent = await prisma.student.findUnique({
        where: { id }
      });

      if (!existingStudent) {
        return res.status(404).json({
          error: 'Estudiante no encontrado'
        });
      }

      // Check if document is being changed and already exists
      if (studentData.document !== existingStudent.document) {
        const duplicateDocument = await prisma.student.findUnique({
          where: { document: studentData.document }
        });

        if (duplicateDocument) {
          return res.status(409).json({
            error: 'Ya existe otro estudiante con ese documento'
          });
        }
      }

      // Update student
      const updatedStudent = await prisma.student.update({
        where: { id },
        data: {
          documentType: studentData.documentType,
          document: studentData.document,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          birthDate: new Date(studentData.birthDate),
          gender: studentData.gender,
          email: studentData.email,
          phone: studentData.phone,
          address: studentData.address,
          gradeId: studentData.gradeId,
          groupId: studentData.groupId,
          guardianName: studentData.guardianName,
          guardianPhone: studentData.guardianPhone,
          guardianEmail: studentData.guardianEmail
        },
        include: {
          grade: true,
          group: true
        }
      });

      res.json({
        message: 'Estudiante actualizado exitosamente',
        student: updatedStudent
      });

    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({
        error: 'Error al actualizar estudiante'
      });
    }
  }
);

// Delete student (soft delete - change status)
router.delete('/:id',
  authenticateToken,
  canManageStudents,
  logActivity('DELETE_STUDENT'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if student exists
      const student = await prisma.student.findUnique({
        where: { id }
      });

      if (!student) {
        return res.status(404).json({
          error: 'Estudiante no encontrado'
        });
      }

      // Soft delete - change status to INACTIVE
      await prisma.student.update({
        where: { id },
        data: { status: 'INACTIVE' }
      });

      res.json({
        message: 'Estudiante eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({
        error: 'Error al eliminar estudiante'
      });
    }
  }
);

// Get student statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const [
      totalActive,
      totalInactive,
      totalGraduated,
      byGrade,
      byGender,
      recentEnrollments
    ] = await Promise.all([
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.student.count({ where: { status: 'INACTIVE' } }),
      prisma.student.count({ where: { status: 'GRADUATED' } }),
      prisma.student.groupBy({
        by: ['gradeId'],
        where: { status: 'ACTIVE' },
        _count: true
      }),
      prisma.student.groupBy({
        by: ['gender'],
        where: { status: 'ACTIVE' },
        _count: true
      }),
      prisma.enrollment.count({
        where: {
          year: currentYear,
          createdAt: {
            gte: new Date(currentYear, 0, 1)
          }
        }
      })
    ]);

    res.json({
      totalActive,
      totalInactive,
      totalGraduated,
      byGrade,
      byGender,
      recentEnrollments,
      lastUpdated: new Date()
    });

  } catch (error) {
    console.error('Error fetching student statistics:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas'
    });
  }
});

// Bulk import students (CSV)
router.post('/import',
  authenticateToken,
  canManageStudents,
  logActivity('IMPORT_STUDENTS'),
  async (req, res) => {
    try {
      const { students } = req.body;

      if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({
          error: 'Datos de estudiantes inválidos'
        });
      }

      const results = {
        success: [],
        errors: []
      };

      for (const studentData of students) {
        try {
          // Check if student already exists
          const existing = await prisma.student.findUnique({
            where: { document: studentData.document }
          });

          if (existing) {
            results.errors.push({
              document: studentData.document,
              error: 'Documento ya existe'
            });
            continue;
          }

          // Create student
          const student = await prisma.student.create({
            data: {
              ...studentData,
              birthDate: new Date(studentData.birthDate),
              status: 'ACTIVE'
            }
          });

          // Create enrollment
          await prisma.enrollment.create({
            data: {
              studentId: student.id,
              year: new Date().getFullYear(),
              gradeId: studentData.gradeId,
              groupId: studentData.groupId,
              status: 'ACTIVE'
            }
          });

          results.success.push(student.id);

        } catch (error) {
          results.errors.push({
            document: studentData.document,
            error: error.message
          });
        }
      }

      res.json({
        message: 'Importación completada',
        results
      });

    } catch (error) {
      console.error('Error importing students:', error);
      res.status(500).json({
        error: 'Error al importar estudiantes'
      });
    }
  }
);

module.exports = router;