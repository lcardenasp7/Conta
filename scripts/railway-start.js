#!/usr/bin/env node

/**
 * Railway Start Script
 * Inicializa la base de datos y arranca el servidor
 */

require('dotenv').config();
const { spawn } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializeDatabase() {
  console.log('🗄️  Inicializando base de datos...');
  
  try {
    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conexión a la base de datos establecida');
    
    // Ejecutar migraciones
    console.log('🔄 Aplicando migraciones...');
    const migrateProcess = spawn('npx', ['prisma', 'db', 'push', '--accept-data-loss'], {
      stdio: 'inherit'
    });
    
    await new Promise((resolve, reject) => {
      migrateProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Migraciones aplicadas correctamente');
          resolve();
        } else {
          reject(new Error(`Migración falló con código ${code}`));
        }
      });
    });
    
    // Verificar que las tablas existen
    try {
      await prisma.user.findFirst();
      console.log('✅ Tabla user verificada');
    } catch (error) {
      console.log('⚠️  Tabla user no encontrada, pero continuando...');
    }
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function startServer() {
  console.log('🚀 Iniciando servidor...');
  
  const serverProcess = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: process.env
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Servidor terminó con código ${code}`);
    process.exit(code);
  });
  
  // Manejar señales de terminación
  process.on('SIGTERM', () => {
    console.log('Recibida señal SIGTERM, terminando servidor...');
    serverProcess.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    console.log('Recibida señal SIGINT, terminando servidor...');
    serverProcess.kill('SIGINT');
  });
}

async function main() {
  try {
    console.log('🎯 Railway Start Script');
    console.log('=======================');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Port: ${process.env.PORT || '3000'}`);
    console.log(`Database: ${process.env.DATABASE_URL ? 'configured' : 'NOT SET'}`);
    console.log('');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL no está configurada');
    }
    
    await initializeDatabase();
    await startServer();
    
  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

main();