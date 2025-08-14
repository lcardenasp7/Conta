# Guía de Despliegue en Railway

## 🚀 Configuración Paso a Paso

### 1. Preparar el Proyecto

```bash
# Ejecutar script de configuración
npm run railway:setup
```

### 2. Configurar Railway Dashboard

1. **Crear nuevo proyecto en Railway**
   - Ve a [railway.app](https://railway.app)
   - Crea un nuevo proyecto
   - Conecta tu repositorio GitHub

2. **Agregar servicio PostgreSQL**
   - En tu proyecto, haz clic en "Add Service"
   - Selecciona "PostgreSQL"
   - Railway creará automáticamente la variable `DATABASE_URL`

3. **Configurar Variables de Entorno**
   - Ve a la pestaña "Variables" de tu servicio web
   - Agrega las siguientes variables:

```env
NODE_ENV=production
JWT_SECRET=villas-san-pablo-super-secret-key-2024-railway-production
JWT_EXPIRES_IN=24h
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
HELMET_CSP_ENABLED=true
CORS_ORIGIN_STRICT=true
```

### 3. Configurar Dominio (Opcional)

1. En Railway, ve a "Settings" > "Domains"
2. Genera un dominio público o configura uno personalizado
3. Si usas dominio personalizado, agrega la variable:
   ```env
   FRONTEND_URL=https://tu-dominio.com
   ```

### 4. Verificar Despliegue

Una vez desplegado, verifica:

1. **Health Check**: `https://tu-app.railway.app/health`
2. **Logs**: Revisa los logs en Railway Dashboard
3. **Base de datos**: Ejecuta el script de verificación:
   ```bash
   npm run db:check
   ```

## 🔧 Comandos Útiles

### Railway CLI (Opcional)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Vincular proyecto
railway link

# Configurar variables desde CLI
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=villas-san-pablo-super-secret-key-2024-railway-production

# Ver logs
railway logs

# Abrir en navegador
railway open
```

### Scripts del Proyecto

```bash
# Verificar configuración de Railway
npm run railway:setup

# Verificar conexión a base de datos
npm run db:check

# Verificar estado de producción
npm run production:check
```

## 🐛 Solución de Problemas

### Error: Database connection failed

**Síntomas**: Health check falla con status 503

**Soluciones**:
1. Verifica que el servicio PostgreSQL esté ejecutándose
2. Confirma que `DATABASE_URL` esté configurada
3. Revisa los logs de Railway para errores específicos

```bash
# Verificar desde local (si tienes acceso a la DB)
npm run db:check
```

### Error: Port already in use

**Síntomas**: Aplicación no inicia

**Soluciones**:
1. Railway asigna automáticamente el puerto
2. No configures manualmente la variable `PORT`
3. Asegúrate de usar `process.env.PORT` en el código

### Error: Build failed

**Síntomas**: Despliegue falla durante build

**Soluciones**:
1. Verifica que todas las dependencias estén en `package.json`
2. Revisa que `prisma generate` se ejecute correctamente
3. Confirma que no hay errores de sintaxis

### Error: Health check timeout

**Síntomas**: Aplicación se despliega pero health check falla

**Soluciones**:
1. Aumenta el timeout en `railway.json`
2. Verifica que `/health` endpoint responda rápidamente
3. Revisa logs para errores durante startup

## 📋 Checklist de Despliegue

- [ ] Servicio PostgreSQL agregado en Railway
- [ ] Variables de entorno configuradas
- [ ] `DATABASE_URL` generada automáticamente
- [ ] Health check responde correctamente
- [ ] Logs no muestran errores críticos
- [ ] Aplicación accesible desde dominio público
- [ ] Base de datos inicializada correctamente

## 🔒 Seguridad en Producción

- ✅ JWT_SECRET único y seguro
- ✅ Rate limiting configurado
- ✅ CORS restrictivo
- ✅ Helmet habilitado
- ✅ Variables sensibles no expuestas en logs
- ✅ HTTPS habilitado automáticamente por Railway

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en Railway Dashboard
2. Ejecuta `npm run db:check` para verificar DB
3. Consulta la documentación de Railway
4. Revisa este archivo para soluciones comunes