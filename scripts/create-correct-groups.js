const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCorrectGroups() {
  try {
    console.log('🔧 CREANDO ESTRUCTURA CORRECTA DE GRUPOS');
    console.log('=' .repeat(60));
    
    // Definir la estructura correcta de cursos por grado
    const gradeStructure = {
      'Sexto': [1, 2, 3, 4, 5, 6, 7],      // 7 cursos
      'Séptimo': [1, 2, 3, 4, 5, 6, 7],    // 7 cursos
      'Octavo': [1, 2, 3, 4, 5, 6],        // 6 cursos
      'Noveno': [1, 2, 3, 4, 5, 6],        // 6 cursos
      'Décimo': [1, 2, 3, 4, 5, 6],        // 6 cursos
      'Undécimo': [1, 2, 3, 4]             // 4 cursos
    };
    
    // Obtener todos los grados
    const grades = await prisma.grade.findMany({
      include: {
        groups: true,
        students: true
      }
    });

    console.log('📊 Estructura actual vs requerida:');
    
    for (const grade of grades) {
      if (grade.students.length > 0) {
        const requiredCourses = gradeStructure[grade.name] || [];
        const existingGroups = grade.groups.map(g => g.name);
        
        console.log(`\n${grade.name}:`);
        console.log(`  Actual: [${existingGroups.join(', ')}]`);
        console.log(`  Requerido: [${requiredCourses.map(c => c.toString().padStart(2, '0')).join(', ')}]`);
        
        // Eliminar grupos que no deberían existir
        for (const group of grade.groups) {
          const groupNum = parseInt(group.name);
          if (!requiredCourses.includes(groupNum)) {
            // Antes de eliminar, mover estudiantes al grupo 01
            const studentsInGroup = await prisma.student.count({
              where: { groupId: group.id }
            });
            
            if (studentsInGroup > 0) {
              const targetGroup = grade.groups.find(g => g.name === '01');
              if (targetGroup) {
                await prisma.student.updateMany({
                  where: { groupId: group.id },
                  data: { groupId: targetGroup.id }
                });
                console.log(`  📦 Movidos ${studentsInGroup} estudiantes del grupo ${group.name} al grupo 01`);
              }
            }
            
            await prisma.group.delete({
              where: { id: group.id }
            });
            console.log(`  🗑️ Eliminado grupo ${group.name} (no requerido)`);
          }
        }
        
        // Crear grupos faltantes
        for (const courseNum of requiredCourses) {
          const groupName = courseNum.toString().padStart(2, '0');
          const existsGroup = grade.groups.find(g => g.name === groupName);
          
          if (!existsGroup) {
            await prisma.group.create({
              data: {
                name: groupName,
                gradeId: grade.id,
                capacity: 30,
                year: 2024
              }
            });
            console.log(`  ✅ Creado grupo ${groupName}`);
          }
        }
      }
    }

    console.log('\n📋 ESTRUCTURA FINAL:');
    const updatedGrades = await prisma.grade.findMany({
      include: {
        groups: {
          orderBy: { name: 'asc' }
        },
        students: true
      },
      orderBy: { order: 'asc' }
    });

    updatedGrades.forEach(grade => {
      if (grade.students.length > 0) {
        console.log(`\n${grade.name} (${grade.students.length} estudiantes):`);
        grade.groups.forEach(group => {
          console.log(`  - Grupo ${group.name}`);
        });
      }
    });

    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error al crear estructura correcta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCorrectGroups();