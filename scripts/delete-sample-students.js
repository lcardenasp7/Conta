const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteSampleStudents() {
  try {
    console.log('🗑️  Eliminando estudiantes de prueba...');
    
    // Buscar estudiantes que parezcan de prueba (puedes ajustar los criterios)
    const sampleStudents = await prisma.student.findMany({
      where: {
        OR: [
          { firstName: { startsWith: 'Estudiante' } },
          { lastName: { startsWith: 'Prueba' } },
          { firstName: { startsWith: 'Juan' } },
          { firstName: { startsWith: 'María' } },
          { firstName: { startsWith: 'Carlos' } },
          { firstName: { startsWith: 'Ana' } },
          { firstName: { startsWith: 'Luis' } },
          { firstName: { startsWith: 'Laura' } },
          { firstName: { startsWith: 'Pedro' } },
          { firstName: { startsWith: 'Sofia' } },
          { firstName: { startsWith: 'Miguel' } },
          { firstName: { startsWith: 'Carmen' } },
          // Agregar más criterios si es necesario
        ]
      }
    });

    console.log(`📊 Encontrados ${sampleStudents.length} estudiantes de prueba`);
    
    if (sampleStudents.length > 0) {
      // Mostrar lista de estudiantes a eliminar
      console.log('\n👥 Estudiantes que serán eliminados:');
      sampleStudents.forEach((student, index) => {
        console.log(`${index + 1}. ${student.firstName} ${student.lastName} - ${student.documentNumber}`);
      });

      // Eliminar los estudiantes
      const deleteResult = await prisma.student.deleteMany({
        where: {
          id: {
            in: sampleStudents.map(s => s.id)
          }
        }
      });

      console.log(`\n✅ ${deleteResult.count} estudiantes de prueba eliminados exitosamente`);
    } else {
      console.log('ℹ️  No se encontraron estudiantes de prueba para eliminar');
    }

  } catch (error) {
    console.error('❌ Error eliminando estudiantes de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  deleteSampleStudents();
}

module.exports = { deleteSampleStudents };