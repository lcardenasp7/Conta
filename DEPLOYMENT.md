# 🚀 Deployment Guide - Railway

Esta guía te ayudará a desplegar el Sistema de Gestión Escolar en Railway.

## 📋 Prerrequisitos

1. **Cuenta en Railway**: [railway.app](https://railway.app)
2. **Repositorio en GitHub**: Ya configurado ✅
3. **Base de datos PostgreSQL**: Railway la proporcionará automáticamente

## 🚀 Pasos para Deployment

### 1. Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Haz clic en "Start a New Project"
3. Selecciona "Deploy from GitHub repo"
4. Conecta tu cuenta de GitHub
5. Selecciona el repositorio `lcardenasp7/Conta`

### 2. Configurar Base de Datos

1. En tu proyecto de Railway, haz clic en "Add Service"
2. Selecciona "Database" → "PostgreSQL"
3. Railway creará automáticamente la base de datos
4. La variable `DATABASE_URL` se configurará automáticamente

### 3. Configurar Variables de Entorno

**IMPORTANTE**: Antes de configurar, genera un JWT_SECRET seguro:
```bash
node scripts/generate-jwt-secret.js
```

En Railway, ve a tu servicio → "Variables" y agrega:

```env
# CONFIGURACIÓN CRÍTICA DE SEGURIDAD
NODE_ENV=production
JWT_SECRET=TU_CLAVE_GENERADA_DE_64_CARACTERES_AQUI
JWT_EXPIRES_IN=24h

# CONFIGURACIÓN DE CORS (IMPORTANTE)
FRONTEND_URL=https://tu-dominio-railway.up.railway.app

# CONFIGURACIÓN DE RATE LIMITING
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# INFORMACIÓN DE LA INSTITUCIÓN
INSTITUTION_NAME=Institución Educativa Villas de San Pablo
INSTITUTION_NIT=123456789-0
INSTITUTION_ADDRESS=Carrera 123 #45-67, Barranquilla, Colombia
INSTITUTION_PHONE=+57 5 123 4567
INSTITUTION_EMAIL=info@villasanpablo.edu.co

# CONFIGURACIÓN DE ARCHIVOS
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

**⚠️ CRÍTICO**: 
- Reemplaza `TU_CLAVE_GENERADA_DE_64_CARACTERES_AQUI` con la clave generada
- Reemplaza `tu-dominio-railway.up.railway.app` con tu URL real de Railway

### 4. Configurar Build y Deploy

Railway detectará automáticamente:
- ✅ `package.json` para instalar dependencias
- ✅ `nixpacks.toml` para configuración de build
- ✅ `Procfile` para comando de inicio
- ✅ `railway.json` para configuración específica

### 5. Verificación Pre-Deploy

**ANTES de hacer deploy**, ejecuta la verificación:
```bash
node scripts/production-check.js
```

### 6. Optimización de Base de Datos

Después del primer deploy, optimiza la base de datos:
```bash
railway run node scripts/optimize-database.js
```

### 7. Deploy Automático

1. Railway iniciará el build automáticamente
2. Instalará dependencias con `npm ci`
3. Generará Prisma client con `npx prisma generate`
4. Ejecutará migraciones de base de datos
5. Iniciará el servidor con `npm start`
6. Verificará el health check en `/health`

## 🔧 Comandos Útiles

### Logs en Railway
```bash
# Ver logs en tiempo real
railway logs

# Ver logs de un servicio específico
railway logs --service=web
```

### Base de Datos
```bash
# Conectar a la base de datos
railway connect postgres

# Ejecutar migraciones manualmente
railway run npx prisma migrate deploy

# Ejecutar seed manualmente
railway run npm run db:seed
```

## 🌐 URLs y Dominios

### URL Automática
Railway proporcionará una URL automática como:
`https://conta-production-xxxx.up.railway.app`

### Dominio Personalizado (Opcional)
1. Ve a "Settings" → "Domains"
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones

## 🔐 Variables de Entorno Importantes

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de PostgreSQL (automática) | `postgresql://...` |
| `JWT_SECRET` | Clave secreta para JWT | `mi_clave_super_secreta` |
| `NODE_ENV` | Entorno de ejecución | `production` |
| `PORT` | Puerto del servidor (automático) | `3000` |

## 🚨 Troubleshooting

### Error: "Prisma Client not generated"
```bash
railway run npx prisma generate
```

### Error: "Database connection failed"
1. Verifica que el servicio PostgreSQL esté corriendo
2. Revisa que `DATABASE_URL` esté configurada
3. Reinicia el servicio

### Error: "Build failed"
1. Revisa los logs de build
2. Verifica que todas las dependencias estén en `package.json`
3. Asegúrate de que `nixpacks.toml` esté configurado correctamente

## 📊 Monitoreo

### Métricas Disponibles
- ✅ CPU Usage
- ✅ Memory Usage
- ✅ Network I/O
- ✅ Response Times
- ✅ Error Rates

### Alertas
Configura alertas en Railway para:
- Alto uso de CPU/memoria
- Errores de aplicación
- Tiempo de respuesta elevado

## 🔄 CI/CD Automático

Railway está configurado para:
1. **Auto-deploy** en cada push a `main`
2. **Build automático** con las configuraciones
3. **Rollback** automático en caso de fallo
4. **Health checks** para verificar el estado

## 🎉 ¡Listo!

Una vez completado el deployment:
1. ✅ Tu aplicación estará disponible en la URL de Railway
2. ✅ La base de datos estará configurada y poblada
3. ✅ El sistema estará listo para usar en producción

---

**¿Necesitas ayuda?** Revisa los logs de Railway o contacta al equipo de desarrollo.