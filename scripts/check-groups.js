const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGroups() {
  try {
    console.log('🔍 VERIFICANDO GRADOS Y GRUPOS EN LA BASE DE DATOS');
    console.log('=' .repeat(60));
    
    // Obtener todos los grados
    const grades = await prisma.grade.findMany({
      orderBy: { order: 'asc' },
      include: {
        groups: {
          orderBy: { name: 'asc' }
        }
      }
    });

    grades.forEach(grade => {
      console.log(`\n📚 ${grade.name} (Orden: ${grade.order})`);
      console.log(`   ID: ${grade.id}`);
      console.log(`   Grupos:`);
      grade.groups.forEach(group => {
        console.log(`     - ${group.name} (ID: ${group.id}, Capacidad: ${group.capacity})`);
      });
    });

    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error al verificar grupos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGroups();