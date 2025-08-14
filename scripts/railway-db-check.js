#!/usr/bin/env node

/**
 * Railway Database Connection Check
 * Verifica la conexión a la base de datos en Railway
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function checkDatabaseConnection() {
  console.log('🔍 Verificando conexión a la base de datos...\n');
  
  console.log('📋 Configuración actual:');
  console.log('========================');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'configured' : 'NOT SET'}`);
  console.log(`PORT: ${process.env.PORT || 'not set'}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'configured' : 'NOT SET'}`);
  
  if (process.env.DATABASE_URL) {
    // Mostrar solo el host de la URL de la base de datos por seguridad
    const dbUrl = new URL(process.env.DATABASE_URL);
    console.log(`Database Host: ${dbUrl.hostname}`);
    console.log(`Database Port: ${dbUrl.port}`);
    console.log(`Database Name: ${dbUrl.pathname.substring(1)}`);
  }
  
  console.log('\n🔗 Intentando conectar a la base de datos...');
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Conexión básica exitosa');
    
    // Test query execution
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Consulta de prueba exitosa:', result);
    
    // Check if tables exist
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Tabla 'user' encontrada con ${userCount} registros`);
    } catch (error) {
      console.log('⚠️  Tabla "user" no encontrada o no accesible:', error.message);
    }
    
    try {
      const studentCount = await prisma.student.count();
      console.log(`✅ Tabla 'student' encontrada con ${studentCount} registros`);
    } catch (error) {
      console.log('⚠️  Tabla "student" no encontrada o no accesible:', error.message);
    }
    
    console.log('\n🎉 Base de datos configurada correctamente!');
    
  } catch (error) {
    console.error('\n❌ Error de conexión a la base de datos:');
    console.error('=====================================');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'P1001') {
      console.error('\n💡 Solución sugerida:');
      console.error('- Verifica que la variable DATABASE_URL esté configurada correctamente');
      console.error('- Asegúrate de que el servicio PostgreSQL esté ejecutándose en Railway');
      console.error('- Verifica que la red permita conexiones a la base de datos');
    }
    
    if (error.code === 'P1000') {
      console.error('\n💡 Solución sugerida:');
      console.error('- Verifica las credenciales de la base de datos');
      console.error('- Asegúrate de que el usuario tenga permisos suficientes');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar verificación
checkDatabaseConnection()
  .catch((error) => {
    console.error('Error inesperado:', error);
    process.exit(1);
  });