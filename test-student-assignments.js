// Test script to check student assignments
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testStudentAssignments() {
    try {
        const studentId = 'baba7515-a2e4-4776-a8fb-9710d7acebb4'; // EMMANUEL David ACOSTA GOMEZ
        
        console.log('🔍 Checking student assignments for:', studentId);
        
        // Get student info
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                document: true
            }
        });
        
        console.log('👤 Student:', student);
        
        // Get assignments
        const assignments = await prisma.eventAssignment.findMany({
            where: { studentId: studentId },
            include: {
                event: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        ticketPrice: true,
                        status: true
                    }
                }
            }
        });
        
        console.log('📋 Assignments found:', assignments.length);
        assignments.forEach((assignment, index) => {
            console.log(`${index + 1}. Event: ${assignment.event.name}`);
            console.log(`   Tickets Assigned: ${assignment.ticketsAssigned}`);
            console.log(`   Tickets Sold: ${assignment.ticketsSold}`);
            console.log(`   Status: ${assignment.status}`);
            console.log('---');
        });
        
        // Get payments for events
        const payments = await prisma.payment.findMany({
            where: { 
                studentId: studentId,
                eventId: { not: null }
            },
            include: {
                event: {
                    select: {
                        name: true
                    }
                }
            }
        });
        
        console.log('💰 Event payments found:', payments.length);
        payments.forEach((payment, index) => {
            console.log(`${index + 1}. Event: ${payment.event?.name || 'N/A'}`);
            console.log(`   Amount: $${payment.amount}`);
            console.log(`   Method: ${payment.method}`);
            console.log(`   Status: ${payment.status}`);
            console.log(`   Date: ${payment.date}`);
            console.log('---');
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testStudentAssignments();