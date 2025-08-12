const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGrades() {
  try {
    const grades = await prisma.grade.findMany({
      orderBy: { order: 'asc' }
    });
    console.log('📚 Grados en la base de datos:');
    grades.forEach(grade => {
      console.log(`- ${grade.name} (ID: ${grade.id}, Order: ${grade.order})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGrades();