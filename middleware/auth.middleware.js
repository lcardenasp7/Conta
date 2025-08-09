const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Token de autenticación no proporcionado'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'Usuario inactivo'
      });
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Error de autenticación'
    });
  }
};

// Check if user has required role
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'No autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'No tiene permisos para realizar esta acción',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'No autenticado'
    });
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'RECTOR') {
    return res.status(403).json({
      error: 'Acceso restringido a administradores'
    });
  }

  next();
};

// Check if user is rector
const isRector = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'No autenticado'
    });
  }

  if (req.user.role !== 'RECTOR') {
    return res.status(403).json({
      error: 'Acceso restringido al rector'
    });
  }

  next();
};

// Check if user can manage accounting
const canManageAccounting = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'No autenticado'
    });
  }

  const allowedRoles = ['RECTOR', 'ACCOUNTANT', 'AUXILIARY_ACCOUNTANT', 'ADMIN'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'No tiene permisos para gestionar contabilidad'
    });
  }

  next();
};

// Check if user can manage students
const canManageStudents = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'No autenticado'
    });
  }

  const allowedRoles = ['RECTOR', 'SECRETARY', 'ADMIN', 'AUXILIARY_ACCOUNTANT'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'No tiene permisos para gestionar estudiantes'
    });
  }

  next();
};

// Check if user can view reports
const canViewReports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'No autenticado'
    });
  }

  // All authenticated users can view reports, but content may vary by role
  next();
};

// Log user activity
const logActivity = (action) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action: action,
            entity: req.baseUrl,
            entityId: req.params.id || 'N/A',
            ip: req.ip,
            userAgent: req.get('user-agent'),
            oldData: req.method === 'PUT' || req.method === 'PATCH' ? req.body : null,
            newData: null
          }
        });
      }
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't block the request if logging fails
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  isAdmin,
  isRector,
  canManageAccounting,
  canManageStudents,
  canViewReports,
  logActivity
};