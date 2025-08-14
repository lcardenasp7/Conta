require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

// Environment configurations
const isProduction = process.env.NODE_ENV === 'production';
const isRailway = process.env.RAILWAY_ENVIRONMENT_NAME !== undefined;

// Import routes
const authRoutes = require('./routes/auth.routes');
const passwordResetRoutes = require('./routes/password-reset.routes');
const institutionRoutes = require('./routes/institution.routes');
const studentRoutes = require('./routes/student.routes');
const gradeRoutes = require('./routes/grade.routes');
const groupRoutes = require('./routes/group.routes');
const eventRoutes = require('./routes/event.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const paymentRoutes = require('./routes/payment.routes');
const transactionRoutes = require('./routes/transaction.routes');
const accountRoutes = require('./routes/account.routes');
const reportRoutes = require('./routes/report.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const financialDashboardRoutes = require('./routes/financial-dashboard.routes');

// Initialize Express app
const app = express();
const prisma = new PrismaClient();

// Port configuration
const PORT = process.env.PORT || 3000;

// Rate limiting - Configuración mejorada para producción
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (isProduction ? 100 : 1000),
  message: {
    error: 'Demasiadas peticiones desde esta IP',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// Security middleware - Configuración mejorada para producción
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-hashes'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
      ],
      scriptSrcAttr: ["'unsafe-inline'"],
      fontSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        ...(isProduction ? [] : ["http:"])
      ],
      connectSrc: [
        "'self'",
        ...(isProduction ? [] : ["http://localhost:3000"])
      ]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "same-origin" }
}));
// CORS configuration - Más restrictivo en producción
app.use(cors({
  origin: isProduction
    ? (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : false)
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}));
// Body parsing middleware con límites de seguridad
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// Logging middleware - Más detallado en producción
if (isProduction) {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400
  }));
} else {
  app.use(morgan('dev'));
}

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Health check endpoint - Simple y rápido
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'School Management API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Database health check - Separado
app.get('/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint - Temporal para diagnosticar
app.get('/debug', async (req, res) => {
  try {
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      port: process.env.PORT,
      databaseUrl: process.env.DATABASE_URL ? 'SET (length: ' + process.env.DATABASE_URL.length + ')' : 'NOT SET',
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime()
    };

    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        debug.dbHost = url.hostname;
        debug.dbPort = url.port;
        debug.dbName = url.pathname.substring(1);
        debug.dbUser = url.username;
      } catch (error) {
        debug.dbUrlError = error.message;
      }
    }

    // Test connection
    try {
      await prisma.$connect();
      debug.connectionTest = 'SUCCESS';
      await prisma.$disconnect();
    } catch (error) {
      debug.connectionTest = 'FAILED';
      debug.connectionError = {
        name: error.constructor.name,
        code: error.code,
        message: error.message
      };
    }

    res.json(debug);
  } catch (error) {
    res.status(500).json({
      error: 'Debug failed',
      message: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/password', passwordResetRoutes);
app.use('/api/institution', institutionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/financial-dashboard', financialDashboardRoutes);

// Static files for uploaded documents
app.use('/uploads', express.static('uploads'));

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// Error handling middleware - Mejorado con logging estructurado
app.use((err, req, res, next) => {
  // Log error details
  const errorInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || 'anonymous',
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    }
  };

  if (isProduction) {
    console.error('Production Error:', JSON.stringify(errorInfo, null, 2));
  } else {
    console.error('Development Error:', err.stack);
  }

  // Prisma error handling
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Registro duplicado',
      field: err.meta?.target,
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Registro no encontrado',
      timestamp: new Date().toISOString()
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      timestamp: new Date().toISOString()
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: err.details || err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Default error - No exponer detalles en producción
  res.status(err.status || 500).json({
    error: isProduction ? 'Error interno del servidor' : err.message,
    timestamp: new Date().toISOString(),
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Graceful shutdown - Mejorado con cleanup completo
const gracefulShutdown = async (signal) => {
  console.log(`${signal} signal received: starting graceful shutdown`);

  try {
    // Close database connections
    await prisma.$disconnect();
    console.log('Database connections closed');

    // Close server
    if (server) {
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
    🚀 Server running on port ${PORT}
    📚 School Management System - I.E.D. Villas de San Pablo
    🌐 Environment: ${process.env.NODE_ENV || 'development'}
    � Secrurity: ${isProduction ? 'Production' : 'Development'} mode
    📅 Started: ${new Date().toISOString()}
    💾 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}
  `);
});

module.exports = app;