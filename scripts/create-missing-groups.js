const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createMissingGroups() {
  try {
    console.log('🔧 CREANDO GRUPOS FALTANTES');
    console.log('=' .repeat(50));
    
    // Obtener todos los grados
    const grades = await prisma.grade.findMany({
      include: {
        groups: true,
        students: true
      }
    });

    console.log('📊 Grados actuales:');
    grades.forEach(grade => {
      if (grade.students.length > 0) {
        console.log(`${grade.name}: ${grade.students.length} estudiantes, ${grade.groups.length} grupos`);
        grade.groups.forEach(group => {
          console.log(`  - Grupo ${group.name}`);
        });
      }
    });

    console.log('\n🔨 Creando grupos faltantes (04, 05, 06, 07)...');
    
    // Para cada grado que tiene estudiantes, crear los grupos faltantes
    for (const grade of grades) {
      if (grade.students.length > 0) {
        const existingGroupNames = grade.groups.map(g => g.name);
        const neededGroups = ['01', '02', '03', '04', '05', '06', '07'];
        
        for (const groupName of neededGroups) {
          if (!existingGroupNames.includes(groupName)) {
            await prisma.group.create({
              data: {
                name: groupName,
                gradeId: grade.id,
                capacity: 30,
                year: 2024
              }
            });
            console.log(`✅ Creado grupo ${groupName} en ${grade.name}`);
          }
        }
      }
    }

    console.log('\n📋 RESULTADO FINAL:');
    const updatedGrades = await prisma.grade.findMany({
      include: {
        groups: {
          orderBy: { name: 'asc' }
        },
        students: true
      }
    });

    updatedGrades.forEach(grade => {
      if (grade.students.length > 0) {
        console.log(`\n${grade.name} (${grade.students.length} estudiantes):`);
        grade.groups.forEach(group => {
          console.log(`  - Grupo ${group.name}`);
        });
      }
    });

    console.log('\n' + '='.repeat(50));
    
  } catch (error) {
    console.error('❌ Error al crear grupos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingGroups();