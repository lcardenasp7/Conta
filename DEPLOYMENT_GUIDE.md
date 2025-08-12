# 🚀 Guía de Despliegue - Sistema Villas de San Pablo

## 📋 Resumen del Proyecto

**Sistema de Gestión Escolar** desarrollado para la I.E.D. Villas de San Pablo
- **Estado**: v1.0.0 - Base funcional (30% completo)
- **Estudiantes**: 1,340 importados correctamente
- **Funcionalidades**: Gestión completa de eventos, facturas y pagos

## 🔧 Configuración Local

### 1. Clonar y Configurar
```bash
git clone https://github.com/tu-usuario/sistema-villas.git
cd sistema-villas
npm install
cp .env.example .env
```

### 2. Base de Datos
```bash
# Configurar PostgreSQL local
createdb school_management

# Sincronizar esquema
npx prisma db push

# Poblar datos iniciales
npx prisma db seed
```

### 3. Importar Estudiantes
```bash
# Colocar archivo "BASE DE DATOS ESTUDIANTES.xlsx" en Documents
node scripts/import-students-villas.js
```

### 4. Iniciar Sistema
```bash
npm start
# Servidor en http://localhost:3000
```

## 🌐 Despliegue en Railway

### 1. Preparar Railway
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Crear proyecto
railway init
```

### 2. Variables de Entorno
```env
DATABASE_URL=postgresql://...  # Railway PostgreSQL
JWT_SECRET=clave-super-segura
NODE_ENV=production
PORT=3000
```

### 3. Desplegar
```bash
railway up
```

## 🔐 Usuarios por Defecto

```
Rector:
- Email: rector@villasanpablo.edu.co  
- Password: VillasSP2024!

Auxiliar Contable:
- Email: contabilidad@villasanpablo.edu.co
- Password: ContaVSP2024!
```

## 📊 Scripts Útiles

```bash
# Generar token de acceso
node scripts/auto-login.js

# Análisis del sistema
node scripts/system-analysis.js

# Resetear base de datos
node scripts/reset-database.js

# Verificar funcionalidades faltantes
node scripts/missing-features-analysis.js
```

## 🎯 Próximos Desarrollos

### Alta Prioridad (2-4 semanas)
- [ ] Reportes financieros detallados
- [ ] Estados de cuenta por estudiante  
- [ ] Control de asistencia básico
- [ ] Notificaciones de pagos vencidos
- [ ] Backup automático

### Media Prioridad (1-3 meses)
- [ ] Registro de notas y calificaciones
- [ ] Portal para padres de familia
- [ ] Gestión completa de docentes
- [ ] Reportes avanzados
- [ ] Integración bancaria

### Baja Prioridad (3-6 meses)
- [ ] Business Intelligence
- [ ] Aplicación móvil
- [ ] Integraciones externas (SIMAT, DIAN)
- [ ] Microservicios
- [ ] Features avanzadas

## 🔍 Monitoreo y Mantenimiento

### Logs Importantes
```bash
# Ver logs de Railway
railway logs

# Monitorear base de datos
node scripts/system-stats.js

# Verificar integridad
node scripts/production-check.js
```

### Backup de Datos
```bash
# Backup manual
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql $DATABASE_URL < backup_20250812.sql
```

## 📞 Soporte

**Institución Educativa Distrital Villas de San Pablo**
- 📧 Email: yasminricodc@gmail.com
- 📱 Teléfono: 313 537 40 16
- 📍 Dirección: Diagonal 136 Nº 9D-60, Barranquilla

## 🚨 Troubleshooting

### Problemas Comunes

**Error de conexión a BD:**
```bash
# Verificar URL de conexión
echo $DATABASE_URL
npx prisma db push
```

**Estudiantes no aparecen:**
```bash
# Verificar importación
node scripts/count-students.js
node scripts/verify-students-database.js
```

**Error de autenticación:**
```bash
# Generar nuevo token
node scripts/auto-login.js
```

**Performance lenta:**
```bash
# Optimizar base de datos
node scripts/optimize-database.js
```

---

**Sistema desarrollado con ❤️ para la educación en Colombia** 🇨🇴