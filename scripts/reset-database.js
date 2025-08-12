const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function resetDatabase() {
    try {
        console.log('🔄 Iniciando reset completo de la base de datos...');
        
        // 1. Disconnect from database
        await prisma.$disconnect();
        console.log('✅ Desconectado de la base de datos');
        
        // 2. Reset database using Prisma
        console.log('🗑️  Reseteando base de datos...');
        execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
        
        // 3. Generate Prisma client
        console.log('🔧 Generando cliente Prisma...');
        execSync('npx prisma generate', { stdio: 'inherit' });
        
        // 4. Run seed
        console.log('🌱 Ejecutando seed...');
        execSync('npx prisma db seed', { stdio: 'inherit' });
        
        console.log('🎉 Base de datos reseteada y configurada exitosamente!');
        console.log('\n📋 Próximos pasos:');
        console.log('   1. Ejecutar: node scripts/import-students.js (si tienes archivo Excel)');
        console.log('   2. O crear estudiantes de prueba con: node scripts/create-sample-students.js');
        
    } catch (error) {
        console.error('❌ Error reseteando base de datos:', error.message);
        process.exit(1);
    }
}

resetDatabase();