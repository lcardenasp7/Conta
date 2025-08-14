#!/usr/bin/env node

/**
 * Railway Setup Script
 * Configura las variables de entorno necesarias para el despliegue en Railway
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando Railway para producción...\n');

// Variables de entorno requeridas para Railway
const railwayEnvVars = {
  NODE_ENV: 'production',
  PORT: '$PORT', // Railway asigna automáticamente el puerto
  JWT_SECRET: 'villas-san-pablo-super-secret-key-2024-railway-production',
  JWT_EXPIRES_IN: '24h',
  FRONTEND_URL: '$RAILWAY_PUBLIC_DOMAIN', // Se configurará automáticamente
  
  // Rate limiting para producción
  RATE_LIMIT_WINDOW_MS: '900000', // 15 minutos
  RATE_LIMIT_MAX_REQUESTS: '100',
  
  // Configuraciones de seguridad
  HELMET_CSP_ENABLED: 'true',
  CORS_ORIGIN_STRICT: 'true'
};

console.log('📋 Variables de entorno para Railway:');
console.log('=====================================');

Object.entries(railwayEnvVars).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

console.log('\n📝 Instrucciones para configurar Railway:');
console.log('==========================================');
console.log('1. Ve a tu proyecto en Railway Dashboard');
console.log('2. Ve a la pestaña "Variables"');
console.log('3. Agrega las siguientes variables:');
console.log('');

Object.entries(railwayEnvVars).forEach(([key, value]) => {
  if (value.startsWith('$')) {
    console.log(`   ${key}: ${value} (Railway lo configurará automáticamente)`);
  } else {
    console.log(`   ${key}: ${value}`);
  }
});

console.log('\n🗄️  Base de datos:');
console.log('==================');
console.log('1. En Railway, agrega un servicio PostgreSQL');
console.log('2. Railway creará automáticamente la variable DATABASE_URL');
console.log('3. No necesitas configurar DATABASE_URL manualmente');

console.log('\n🔧 Comandos adicionales para Railway CLI:');
console.log('==========================================');
console.log('railway login');
console.log('railway link');
console.log('railway variables set NODE_ENV=production');
console.log('railway variables set JWT_SECRET=villas-san-pablo-super-secret-key-2024-railway-production');
console.log('railway variables set JWT_EXPIRES_IN=24h');
console.log('railway variables set RATE_LIMIT_WINDOW_MS=900000');
console.log('railway variables set RATE_LIMIT_MAX_REQUESTS=100');

console.log('\n✅ Setup completado. Revisa las instrucciones arriba.');