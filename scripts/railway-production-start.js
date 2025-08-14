#!/usr/bin/env node

/**
 * Railway Production Start Script
 * Maneja migraciones y inicio del servidor de forma robusta
 */

require('dotenv').config();
const { spawn } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function runMigrations() {
  console.log('🔄 Ejecutando migraciones de base de datos...');
  
  return new Promise((resolve, reject) => {
    const migrate = spawn('npx', ['prisma', 'db', 'push', '--accept-data-loss'], {
      stdio: 'inherit',
      env: process.env
    });
    
    migrate.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Migraciones completadas exitosamente');
        resolve();
      } else {
        console.error('❌ Error en migraciones, código:', code);
        reject(new Error(`Migraciones fallaron con código ${code}`));
      }
    });
    
    migrate.on('error', (error) => {
      console.error('❌ Error ejecutando migraciones:', error);
      reject(error);
    });
  });
}

async function testConnection() {
  console.log('🔍 Verificando conexión a base de datos...');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión a base de datos verificada');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    throw error;
  }
}

async function startServer() {
  console.log('🚀 Iniciando servidor...');
  
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: process.env
  });
  
  server.on('error', (error) => {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  });
  
  // Manejar señales de terminación
  process.on('SIGTERM', () => {
    console.log('Recibida señal SIGTERM, terminando...');
    server.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    console.log('Recibida señal SIGINT, terminando...');
    server.kill('SIGINT');
  });
}

async function main() {
  try {
    console.log('🎯 Railway Production Start');
    console.log('===========================');
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Database URL: ${process.env.DATABASE_URL ? 'configured' : 'NOT SET'}`);
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL no está configurada');
    }
    
    // Ejecutar migraciones
    await runMigrations();
    
    // Verificar conexión
    await testConnection();
    
    // Iniciar servidor
    await startServer();
    
  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

main();