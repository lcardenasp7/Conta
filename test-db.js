// test-db.js - Script para probar conexión a la base de datos
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔄 Probando conexión a la base de datos...');
    
    // Probar conexión
    await prisma.$connect();
    console.log('✅ Conexión exitosa a PostgreSQL');
    
    // Probar una consulta simple
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 Versión de PostgreSQL:', result[0].version);
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Verifica que la URL del servidor sea correcta');
    }
    if (error.message.includes('authentication failed')) {
      console.log('💡 Verifica el usuario y contraseña');
    }
    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('💡 Verifica que la base de datos exista');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();