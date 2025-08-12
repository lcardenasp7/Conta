const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const emailService = require('../services/email.service');

const router = express.Router();
const prisma = new PrismaClient();

// Generar token de reset
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Solicitar reset de contraseña
router.post('/request-reset', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email válido es requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { email } = req.body;

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Por seguridad, siempre respondemos exitosamente
    // aunque el usuario no exista
    if (!user) {
      return res.json({
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
      });
    }

    // Generar token de reset
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // Guardar token en base de datos (necesitamos agregar campos al modelo User)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Crear URL de reset
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}`;

    // Usar template del servicio de email
    const emailHtml = emailService.getPasswordResetTemplate(user.name, resetUrl);

    // Enviar email
    await emailService.sendEmail(
      user.email,
      'Restablecer Contraseña - Sistema Escolar',
      emailHtml
    );

    res.json({
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
    });

  } catch (error) {
    console.error('Error en request-reset:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// Verificar token de reset
router.get('/verify-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Token inválido o expirado'
      });
    }

    res.json({
      valid: true,
      email: user.email
    });

  } catch (error) {
    console.error('Error en verify-token:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// Restablecer contraseña
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Token es requerido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { token, password } = req.body;

    // Buscar usuario con token válido
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Token inválido o expirado'
      });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Actualizar contraseña y limpiar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        lastLogin: new Date()
      }
    });

    // Email de confirmación usando template
    const confirmationHtml = emailService.getPasswordChangedTemplate(user.name);

    await emailService.sendEmail(
      user.email,
      'Contraseña Actualizada - Sistema Escolar',
      confirmationHtml
    );

    res.json({
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;