const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixNames() {
  try {
    console.log('🔄 Iniciando corrección de nombres y apellidos...');
    
    // Get all students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        document: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log(`📊 Total de estudiantes a corregir: ${students.length}`);
    
    let corrected = 0;
    
    // Process in batches to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      
      // Use transaction for each batch
      await prisma.$transaction(async (tx) => {
        for (const student of batch) {
          // Swap firstName and lastName
          await tx.student.update({
            where: { id: student.id },
            data: {
              firstName: student.lastName, // lastName becomes firstName (names)
              lastName: student.firstName  // firstName becomes lastName (surnames)
            }
          });
          
          corrected++;
          
          if (corrected % 100 === 0) {
            console.log(`✅ Corregidos: ${corrected}/${students.length}`);
          }
        }
      });
    }
    
    console.log(`🎉 ¡Corrección completada! Total corregidos: ${corrected}`);
    
    // Show some examples after correction
    console.log('\n📋 Ejemplos después de la corrección:');
    const examples = await prisma.student.findMany({
      take: 5,
      select: {
        document: true,
        firstName: true,
        lastName: true
      }
    });
    
    examples.forEach(s => {
      console.log(`Documento: ${s.document}`);
      console.log(`Nombres: '${s.firstName}'`);
      console.log(`Apellidos: '${s.lastName}'`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error al corregir nombres:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNames();