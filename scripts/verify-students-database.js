const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyStudentsDatabase() {
  try {
    console.log('🔍 Verificando base de datos de estudiantes...\n');

    // Contar estudiantes totales
    const totalStudents = await prisma.student.count();
    console.log(`📊 Total de estudiantes: ${totalStudents}`);

    // Contar por estado
    const studentsByStatus = await prisma.student.groupBy({
      by: ['status'],
      _count: true
    });

    console.log('\n📈 Estudiantes por estado:');
    studentsByStatus.forEach(group => {
      console.log(`  - ${group.status}: ${group._count} estudiantes`);
    });

    // Contar por grado
    const studentsByGrade = await prisma.student.groupBy({
      by: ['gradeId'],
      _count: true,
      orderBy: {
        _count: 'desc'
      }
    });

    console.log('\n📚 Estudiantes por grado:');
    for (const group of studentsByGrade) {
      const grade = await prisma.grade.findUnique({
        where: { id: group.gradeId },
        select: { name: true, level: true }
      });
      console.log(`  - ${grade?.name || 'Grado desconocido'} (${grade?.level || 'N/A'}): ${group._count} estudiantes`);
    }

    // Verificar grados disponibles
    const grades = await prisma.grade.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { students: true }
        }
      }
    });

    console.log('\n🎓 Grados disponibles:');
    grades.forEach(grade => {
      console.log(`  - ${grade.name} (${grade.level}) - Orden: ${grade.order} - Estudiantes: ${grade._count.students}`);
    });

    // Verificar grupos disponibles
    const groups = await prisma.group.findMany({
      include: {
        grade: { select: { name: true } },
        _count: {
          select: { students: true }
        }
      },
      orderBy: [
        { grade: { order: 'asc' } },
        { name: 'asc' }
      ]
    });

    console.log('\n👥 Grupos disponibles:');
    groups.forEach(group => {
      console.log(`  - ${group.grade.name}-${group.name}: ${group._count.students} estudiantes (Capacidad: ${group.capacity})`);
    });

    // Verificar estudiantes activos por grado y grupo
    console.log('\n✅ Estudiantes ACTIVOS por grado y grupo:');
    const activeStudentsByGradeGroup = await prisma.student.groupBy({
      by: ['gradeId', 'groupId'],
      where: { status: 'ACTIVE' },
      _count: true
    });

    for (const group of activeStudentsByGradeGroup) {
      const [grade, groupInfo] = await Promise.all([
        prisma.grade.findUnique({ where: { id: group.gradeId }, select: { name: true } }),
        prisma.group.findUnique({ where: { id: group.groupId }, select: { name: true } })
      ]);
      console.log(`  - ${grade?.name || 'N/A'}-${groupInfo?.name || 'N/A'}: ${group._count} estudiantes activos`);
    }

    // Verificar eventos existentes
    const existingEvents = await prisma.event.count();
    console.log(`\n🎭 Eventos existentes en la base de datos: ${existingEvents}`);

    if (existingEvents > 0) {
      const events = await prisma.event.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          _count: {
            select: { assignments: true }
          }
        }
      });

      console.log('\n📋 Lista de eventos:');
      events.forEach(event => {
        console.log(`  - ${event.name} (${event.type}) - ${event.status} - ${event._count.assignments} asignaciones`);
      });
    }

    // Resumen final
    console.log('\n📊 RESUMEN:');
    console.log(`✅ Total estudiantes: ${totalStudents}`);
    console.log(`✅ Estudiantes activos: ${studentsByStatus.find(s => s.status === 'ACTIVE')?._count || 0}`);
    console.log(`✅ Grados disponibles: ${grades.length}`);
    console.log(`✅ Grupos disponibles: ${groups.length}`);
    console.log(`✅ Eventos existentes: ${existingEvents}`);

    return {
      totalStudents,
      activeStudents: studentsByStatus.find(s => s.status === 'ACTIVE')?._count || 0,
      grades: grades.length,
      groups: groups.length,
      events: existingEvents
    };

  } catch (error) {
    console.error('❌ Error verificando base de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  verifyStudentsDatabase()
    .then((summary) => {
      console.log('\n🎉 Verificación completada exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { verifyStudentsDatabase };