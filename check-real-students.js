const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStudents() {
  try {
    const total = await prisma.student.count();
    const active = await prisma.student.count({ where: { status: 'ACTIVE' } });
    const inactive = await prisma.student.count({ where: { status: 'INACTIVE' } });
    
    console.log('📊 Estadísticas de estudiantes:');
    console.log('Total:', total);
    console.log('Activos:', active);
    console.log('Inactivos:', inactive);
    
    // Buscar algunos estudiantes con 'a'
    const searchResults = await prisma.student.findMany({
      where: {
        OR: [
          { firstName: { contains: 'a', mode: 'insensitive' } },
          { lastName: { contains: 'a', mode: 'insensitive' } }
        ]
      },
      take: 10,
      include: {
        grade: true,
        group: true
      }
    });
    
    console.log('\n🔍 Primeros 10 estudiantes con "a":');
    searchResults.forEach(s => {
      console.log(`- ${s.firstName} ${s.lastName} (${s.document}) - ${s.grade?.name || 'N/A'} ${s.group?.name || 'N/A'}`);
    });
    
    // Probar búsqueda específica
    console.log('\n🎯 Probando búsqueda específica...');
    const specificSearch = await prisma.student.findMany({
      where: {
        OR: [
          { firstName: { contains: 'CARLOS', mode: 'insensitive' } },
          { lastName: { contains: 'CARLOS', mode: 'insensitive' } }
        ]
      },
      take: 5,
      include: {
        grade: true,
        group: true
      }
    });
    
    console.log('Estudiantes con "CARLOS":');
    specificSearch.forEach(s => {
      console.log(`- ${s.firstName} ${s.lastName} (${s.document})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudents();