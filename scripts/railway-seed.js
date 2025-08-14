#!/usr/bin/env node

/**
 * Railway Seed Script
 * Ejecuta las migraciones y seed en Railway
 */

require('dotenv').config();
const { spawn } = require('child_process');

async function runCommand(command, args, description) {
  console.log(`🔄 ${description}...`);
  
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'inherit',
      env: process.env
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completado`);
        resolve();
      } else {
        console.error(`❌ ${description} falló con código ${code}`);
        reject(new Error(`${description} falló`));
      }
    });
    
    process.on('error', (error) => {
      console.error(`❌ Error en ${description}:`, error);
      reject(error);
    });
  });
}

async function main() {
  try {
    console.log('🎯 Railway Seed - Inicialización de Base de Datos');
    console.log('================================================');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL no está configurada');
    }
    
    // 1. Ejecutar migraciones
    await runCommand('npx', ['prisma', 'db', 'push', '--accept-data-loss'], 'Migraciones de base de datos');
    
    // 2. Ejecutar seed de producción
    await runCommand('node', ['scripts/railway-production-seed.js'], 'Seed de datos de producción');
    
    console.log('\n🎉 ¡Base de datos inicializada correctamente!');
    console.log('\n👤 Usuarios creados:');
    console.log('   📧 rector@villasanpablo.edu.co');
    console.log('   🔑 VillasSP2024!');
    console.log('');
    console.log('   📧 contabilidad@villasanpablo.edu.co');
    console.log('   🔑 ContaVSP2024!');
    
  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  }
}

main();