const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testGroupsAPI() {
  try {
    console.log('🔍 Testing Groups API Query...\n');
    
    // Simulate the exact query from the API
    const groups = await prisma.group.findMany({
      include: {
        grade: {
          select: { id: true, name: true, level: true }
        },
        students: {
          where: { status: 'ACTIVE' },
          select: { id: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`📊 Found ${groups.length} groups\n`);
    
    // Process groups like in the API
    const groupsWithStudents = groups.map(group => ({
      ...group,
      currentStudents: group.students.length,
      students: undefined // Remove from response
    }));
    
    // Show first few groups with details
    groupsWithStudents.slice(0, 10).forEach(group => {
      console.log(`📋 Group: ${group.name}`);
      console.log(`   Grade: ${group.grade.name}`);
      console.log(`   Students: ${group.currentStudents}`);
      console.log(`   Capacity: ${group.capacity}`);
      console.log(`   Percentage: ${group.capacity > 0 ? Math.round((group.currentStudents / group.capacity) * 100) : 0}%`);
      console.log('');
    });
    
    // Test specific grade query (Sexto)
    console.log('\n🎯 Testing specific grade query (Sexto)...\n');
    
    const sextoGrade = await prisma.grade.findFirst({
      where: { name: 'Sexto' }
    });
    
    if (sextoGrade) {
      const sextoGroups = await prisma.group.findMany({
        where: { gradeId: sextoGrade.id },
        include: {
          grade: {
            select: { id: true, name: true, level: true }
          },
          students: {
            where: { status: 'ACTIVE' },
            select: { id: true }
          }
        },
        orderBy: { name: 'asc' }
      });
      
      console.log(`📊 Found ${sextoGroups.length} groups for Sexto\n`);
      
      sextoGroups.forEach(group => {
        console.log(`📋 Group: ${group.name}`);
        console.log(`   Students: ${group.students.length}`);
        console.log(`   Capacity: ${group.capacity}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGroupsAPI();