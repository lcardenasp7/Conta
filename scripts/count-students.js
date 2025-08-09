const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function countStudents() {
  try {
    // Contar total de estudiantes
    const totalStudents = await prisma.student.count();
    
    // Obtener estudiantes con sus grados y grupos
    const studentsWithGradeAndGroup = await prisma.student.findMany({
      include: {
        grade: true,
        group: true
      }
    });

    // Agrupar por grado
    const gradeStats = {};
    const gradeGroupStats = {};
    
    studentsWithGradeAndGroup.forEach(student => {
      const gradeName = student.grade.name;
      const groupName = student.group.name;
      
      // Contar por grado
      if (!gradeStats[gradeName]) {
        gradeStats[gradeName] = 0;
      }
      gradeStats[gradeName]++;
      
      // Contar por grado y grupo
      const key = `${gradeName} - ${groupName}`;
      if (!gradeGroupStats[key]) {
        gradeGroupStats[key] = 0;
      }
      gradeGroupStats[key]++;
    });

    console.log('📊 RESUMEN DE ESTUDIANTES EN EL SISTEMA');
    console.log('=' .repeat(50));
    console.log(`🎓 TOTAL DE ESTUDIANTES: ${totalStudents}`);
    console.log('');

    console.log('📈 ESTUDIANTES POR GRADO:');
    console.log('-'.repeat(30));
    Object.entries(gradeStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([gradeName, count]) => {
        console.log(`${gradeName}: ${count} estudiantes`);
      });
    console.log('');

    console.log('📋 ESTUDIANTES POR GRADO Y GRUPO:');
    console.log('-'.repeat(40));
    Object.entries(gradeGroupStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, count]) => {
        console.log(`${key}: ${count} estudiantes`);
      });

    console.log('\n' + '='.repeat(50));
    
  } catch (error) {
    console.error('❌ Error al contar estudiantes:', error);
  } finally {
    await prisma.$disconnect();
  }
}



countStudents();