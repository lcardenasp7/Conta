#!/usr/bin/env node

/**
 * Railway Debug Script
 * Diagnóstica problemas de conexión en Railway
 */

require('dotenv').config();

console.log('🔍 Railway Debug - Diagnóstico de Conexión');
console.log('===========================================');

// Información del entorno
console.log('\n📋 Variables de Entorno:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('PORT:', process.env.PORT || 'not set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET (length: ' + process.env.DATABASE_URL.length + ')' : 'NOT SET');

if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('DB Host:', url.hostname);
    console.log('DB Port:', url.port);
    console.log('DB Name:', url.pathname.substring(1));
    console.log('DB User:', url.username);
  } catch (error) {
    console.log('❌ DATABASE_URL format error:', error.message);
  }
}

// Test de conexión básica
console.log('\n🔗 Test de Conexión:');

async function testConnection() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      log: ['error', 'warn'],
    });

    console.log('Intentando conectar...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa');

    console.log('Ejecutando query de prueba...');
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as timestamp`;
    console.log('✅ Query exitosa:', result);

    await prisma.$disconnect();
    console.log('✅ Desconexión exitosa');

  } catch (error) {
    console.log('❌ Error de conexión:');
    console.log('Tipo:', error.constructor.name);
    console.log('Código:', error.code);
    console.log('Mensaje:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n💡 Solución P1001:');
      console.log('- Verifica que PostgreSQL esté ejecutándose');
      console.log('- Verifica la URL de conexión');
      console.log('- Verifica la conectividad de red');
    }
    
    if (error.code === 'P1000') {
      console.log('\n💡 Solución P1000:');
      console.log('- Verifica las credenciales');
      console.log('- Verifica los permisos del usuario');
    }
  }
}

// Información del sistema
console.log('\n🖥️  Sistema:');
console.log('Platform:', process.platform);
console.log('Node Version:', process.version);
console.log('Memory Usage:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB');

// Test de red básico
console.log('\n🌐 Test de Red:');
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    const net = require('net');
    
    console.log(`Probando conexión TCP a ${url.hostname}:${url.port}...`);
    
    const socket = new net.Socket();
    socket.setTimeout(5000);
    
    socket.connect(parseInt(url.port), url.hostname, () => {
      console.log('✅ Conexión TCP exitosa');
      socket.destroy();
    });
    
    socket.on('error', (error) => {
      console.log('❌ Error TCP:', error.message);
    });
    
    socket.on('timeout', () => {
      console.log('❌ Timeout TCP');
      socket.destroy();
    });
    
  } catch (error) {
    console.log('❌ Error en test TCP:', error.message);
  }
}

// Ejecutar test de conexión
testConnection().then(() => {
  console.log('\n✅ Debug completado');
}).catch((error) => {
  console.log('\n❌ Debug falló:', error.message);
  process.exit(1);
});