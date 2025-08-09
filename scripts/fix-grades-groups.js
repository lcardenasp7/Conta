const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixGradesAndGroups() {
  try {
    console.log('🔧 CORRIGIENDO GRADOS Y GRUPOS EN LA BASE DE DATOS');
    console.log('=' .repeat(60));
    
    // Primero, vamos a ver qué grados tienen estudiantes
    const gradesWithStudents = await prisma.grade.findMany({
      include: {
        students: true,
        groups: {
          include: {
            students: true
          }
        }
      }
    });

    console.log('📊 Grados con estudiantes:');
    gradesWithStudents.forEach(grade => {
      if (grade.students.length > 0) {
        console.log(`${grade.name}: ${grade.students.length} estudiantes`);
        grade.groups.forEach(group => {
          if (group.students.length > 0) {
            console.log(`  - Grupo ${group.name}: ${group.students.length} estudiantes`);
          }
        });
      }
    });

    console.log('\n🔄 Actualizando nombres de grupos...');
    
    // Actualizar nombres de grupos de A,B,C a 01,02,03
    const groupMapping = {
      'A': '01',
      'B': '02', 
      'C': '03',
      'D': '04',
      'E': '05',
      'F': '06',
      'G': '07'
    };

    // Obtener todos los grupos que necesitan actualización
    const groupsToUpdate = await prisma.group.findMany({
      where: {
        name: {
          in: Object.keys(groupMapping)
        }
      }
    });

    console.log(`📝 Encontrados ${groupsToUpdate.length} grupos para actualizar`);

    // Actualizar cada grupo
    for (const group of groupsToUpdate) {
      const newName = groupMapping[group.name];
      if (newName) {
        await prisma.group.update({
          where: { id: group.id },
          data: { name: newName }
        });
        console.log(`✅ Grupo ${group.name} → ${newName}`);
      }
    }

    console.log('\n🧹 Eliminando grados duplicados sin estudiantes...');
    
    // Eliminar grados duplicados que no tienen estudiantes
    const emptyGrades = gradesWithStudents.filter(grade => grade.students.length === 0);
    
    for (const grade of emptyGrades) {
      // Primero eliminar los grupos vacíos
      await prisma.group.deleteMany({
        where: { gradeId: grade.id }
      });
      
      // Luego eliminar el grado
      await prisma.grade.delete({
        where: { id: grade.id }
      });
      
      console.log(`🗑️ Eliminado grado vacío: ${grade.name}`);
    }

    console.log('\n✅ Corrección completada. Verificando resultado...');
    
    // Verificar el resultado final
    const finalGrades = await prisma.grade.findMany({
      orderBy: { order: 'asc' },
      include: {
        groups: {
          orderBy: { name: 'asc' }
        },
        students: true
      }
    });

    console.log('\n📋 RESULTADO FINAL:');
    finalGrades.forEach(grade => {
      if (grade.students.length > 0) {
        console.log(`\n${grade.name} (${grade.students.length} estudiantes):`);
        grade.groups.forEach(group => {
          console.log(`  - Grupo ${group.name}`);
        });
      }
    });

    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error al corregir grados y grupos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixGradesAndGroups();