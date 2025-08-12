const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAPIEndpoint() {
  try {
    console.log('🔍 Testing API endpoint directly...\n');
    
    // Test the exact query that the API endpoint uses
    const gradeId = await prisma.grade.findFirst({
      where: { name: 'Sexto' },
      select: { id: true }
    });
    
    if (!gradeId) {
      console.log('❌ Grade "Sexto" not found');
      return;
    }
    
    console.log(`📋 Testing with gradeId: ${gradeId.id}\n`);
    
    // Simulate the API endpoint query
    const where = { gradeId: gradeId.id };
    
    const groups = await prisma.group.findMany({
      where,
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
    
    // Add current students count to each group (like in the API)
    const groupsWithStudents = groups.map(group => ({
      ...group,
      currentStudents: group.students.length,
      students: undefined // Remove from response
    }));
    
    console.log(`📊 API would return ${groupsWithStudents.length} groups for Sexto:\n`);
    
    groupsWithStudents.forEach(group => {
      console.log(`📋 Group: ${group.name}`);
      console.log(`   Grade: ${group.grade.name}`);
      console.log(`   Current Students: ${group.currentStudents}`);
      console.log(`   Capacity: ${group.capacity}`);
      console.log(`   Available: ${group.capacity - group.currentStudents}`);
      console.log(`   Occupancy: ${group.capacity > 0 ? Math.round((group.currentStudents / group.capacity) * 100) : 0}%`);
      console.log('');
    });
    
    // Test JSON serialization
    console.log('🔄 Testing JSON serialization...\n');
    const jsonResponse = JSON.stringify(groupsWithStudents, null, 2);
    console.log('JSON Response (first 500 chars):');
    console.log(jsonResponse.substring(0, 500) + '...\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPIEndpoint();