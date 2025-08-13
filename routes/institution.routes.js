const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, canManageInstitution } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for logo upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create versioned filename to avoid conflicts
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `logo_${timestamp}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
    files: 1 // Only one file at a time
  },
  fileFilter: function (req, file, cb) {
    // Allowed types and sizes
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    // Additional security checks
    if (!file.originalname || file.originalname.length > 255) {
      return cb(new Error('Nombre de archivo inválido'));
    }

    // Check for potentially dangerous extensions
    const dangerousExts = /\.(exe|bat|cmd|scr|pif|com|js|jar|vbs|ws|wsf)$/i;
    if (dangerousExts.test(file.originalname)) {
      return cb(new Error('Tipo de archivo no permitido por seguridad'));
    }

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP)'));
    }
  }
});

// Validation rules
const validateInstitution = [
  body('name').notEmpty().withMessage('Nombre de la institución es requerido'),
  body('nit').notEmpty().withMessage('NIT es requerido'),
  body('address').notEmpty().withMessage('Dirección es requerida'),
  body('city').notEmpty().withMessage('Ciudad es requerida'),
  body('phone').notEmpty().withMessage('Teléfono es requerido'),
  body('email').isEmail().withMessage('Email válido es requerido')
];

// Get institution data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const institution = await prisma.institution.findFirst();
    
    if (!institution) {
      return res.status(404).json({ error: 'No hay configuración institucional' });
    }

    res.json(institution);
  } catch (error) {
    console.error('Institution fetch error:', error);
    res.status(500).json({ error: 'Error al obtener datos institucionales' });
  }
});

// Create or update institution
router.post('/', authenticateToken, canManageInstitution, validateInstitution, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const institutionData = req.body;

    // Check if institution already exists
    const existingInstitution = await prisma.institution.findFirst();

    let institution;
    if (existingInstitution) {
      // Update existing
      institution = await prisma.institution.update({
        where: { id: existingInstitution.id },
        data: institutionData
      });
    } else {
      // Create new
      institution = await prisma.institution.create({
        data: institutionData
      });
    }

    res.json(institution);
  } catch (error) {
    console.error('Institution save error:', error);
    res.status(500).json({ error: 'Error al guardar datos institucionales' });
  }
});

// Update institution (PUT method)
router.put('/', authenticateToken, canManageInstitution, validateInstitution, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const institutionData = req.body;

    // Check if institution already exists
    const existingInstitution = await prisma.institution.findFirst();

    let institution;
    if (existingInstitution) {
      // Update existing
      institution = await prisma.institution.update({
        where: { id: existingInstitution.id },
        data: institutionData
      });
    } else {
      // Create new
      institution = await prisma.institution.create({
        data: institutionData
      });
    }

    res.json(institution);
  } catch (error) {
    console.error('Institution update error:', error);
    res.status(500).json({ error: 'Error al actualizar datos institucionales' });
  }
});

// Upload logo
router.post('/logo', authenticateToken, canManageInstitution, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo de logo' });
    }

    // Get existing institution to backup current logo
    const existingInstitution = await prisma.institution.findFirst();
    
    // Backup current logo if exists
    if (existingInstitution && existingInstitution.logo) {
      const currentLogoPath = path.join(__dirname, '../public', existingInstitution.logo);
      if (fs.existsSync(currentLogoPath)) {
        const backupDir = path.join(__dirname, '../public/uploads/backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const ext = path.extname(existingInstitution.logo);
        const backupPath = path.join(backupDir, `logo_backup_${timestamp}${ext}`);
        
        try {
          fs.copyFileSync(currentLogoPath, backupPath);
          console.log(`✅ Logo anterior respaldado: ${backupPath}`);
        } catch (error) {
          console.warn('⚠️ No se pudo respaldar logo anterior:', error.message);
        }
      }
    }

    // Get the uploaded file path
    const logoPath = `/uploads/${req.file.filename}`;
    
    if (existingInstitution) {
      await prisma.institution.update({
        where: { id: existingInstitution.id },
        data: { logo: logoPath }
      });
    } else {
      // Create institution record with just the logo
      await prisma.institution.create({
        data: {
          name: 'Institución Educativa',
          nit: '000000000-0',
          address: 'Dirección pendiente',
          city: 'Ciudad pendiente',
          state: 'Departamento pendiente',
          locality: 'Localidad pendiente',
          phone: '000-0000000',
          email: 'info@institucion.edu.co',
          dane: '000000000000',
          resolution: 'Pendiente',
          levels: 'Preescolar, Básica, Media',
          title: 'Bachiller Académico',
          calendar: 'A',
          schedule: 'Diurno',
          logo: logoPath
        }
      });
    }

    // Log the change
    console.log(`📸 Logo actualizado por usuario: ${req.user.name} (${req.user.email})`);
    console.log(`   Archivo: ${req.file.filename}`);
    console.log(`   Tamaño: ${(req.file.size / 1024).toFixed(2)} KB`);
    console.log(`   Fecha: ${new Date().toISOString()}`);

    res.json({
      message: 'Logo cargado exitosamente',
      logoPath: logoPath,
      filename: req.file.filename,
      size: req.file.size,
      uploadedBy: req.user.name,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ error: 'Error al cargar el logo' });
  }
});

// Delete logo
router.delete('/logo', authenticateToken, canManageInstitution, async (req, res) => {
  try {
    const institution = await prisma.institution.findFirst();
    
    if (!institution || !institution.logo) {
      return res.status(404).json({ error: 'No hay logo para eliminar' });
    }

    // Delete file from filesystem
    const logoPath = path.join(__dirname, '../public', institution.logo);
    if (fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
    }

    // Update database
    await prisma.institution.update({
      where: { id: institution.id },
      data: { logo: null }
    });

    res.json({ message: 'Logo eliminado exitosamente' });

  } catch (error) {
    console.error('Logo delete error:', error);
    res.status(500).json({ error: 'Error al eliminar el logo' });
  }
});

// Get logo (for public access)
router.get('/logo', async (req, res) => {
  try {
    const institution = await prisma.institution.findFirst();
    
    if (!institution || !institution.logo) {
      return res.status(404).json({ error: 'Logo no encontrado' });
    }

    const logoPath = path.join(__dirname, '../public', institution.logo);
    
    if (!fs.existsSync(logoPath)) {
      return res.status(404).json({ error: 'Archivo de logo no encontrado' });
    }

    res.sendFile(logoPath);

  } catch (error) {
    console.error('Logo fetch error:', error);
    res.status(500).json({ error: 'Error al obtener el logo' });
  }
});

// Get logo history/backups
router.get('/logo/history', authenticateToken, canManageInstitution, async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../public/uploads/backups');
    
    if (!fs.existsSync(backupDir)) {
      return res.json({ backups: [] });
    }

    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter(file => file.startsWith('logo_backup_'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        const timestamp = file.match(/logo_backup_(\d+)/)?.[1];
        
        return {
          filename: file,
          path: `/uploads/backups/${file}`,
          size: stats.size,
          createdAt: new Date(parseInt(timestamp) || stats.birthtime),
          sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json({ backups });
  } catch (error) {
    console.error('Logo history error:', error);
    res.status(500).json({ error: 'Error al obtener historial de logos' });
  }
});

// Restore logo from backup
router.post('/logo/restore/:filename', authenticateToken, canManageInstitution, async (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(__dirname, '../public/uploads/backups', filename);
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup no encontrado' });
    }

    // Copy backup to current logo
    const timestamp = Date.now();
    const ext = path.extname(filename);
    const newLogoName = `logo_${timestamp}${ext}`;
    const newLogoPath = path.join(__dirname, '../public/uploads', newLogoName);
    
    fs.copyFileSync(backupPath, newLogoPath);

    // Update database
    const institution = await prisma.institution.findFirst();
    if (institution) {
      await prisma.institution.update({
        where: { id: institution.id },
        data: { logo: `/uploads/${newLogoName}` }
      });
    }

    console.log(`🔄 Logo restaurado desde backup: ${filename} por ${req.user.name}`);

    res.json({
      message: 'Logo restaurado exitosamente',
      logoPath: `/uploads/${newLogoName}`,
      restoredFrom: filename
    });

  } catch (error) {
    console.error('Logo restore error:', error);
    res.status(500).json({ error: 'Error al restaurar logo' });
  }
});

module.exports = router;