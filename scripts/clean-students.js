const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanStudents() {
    try {
        console.log('🧹 Limpiando estudiantes existentes...');
        
        // Delete in correct order due to foreign key constraints
        await prisma.enrollment.deleteMany({});
        console.log('✅ Enrollments eliminados');
        
        await prisma.eventAssignment.deleteMany({});
        console.log('✅ Event assignments eliminados');
        
        // Delete all payments and invoices for now
        await prisma.payment.deleteMany({});
        console.log('✅ Todos los payments eliminados');
        
        await prisma.invoice.deleteMany({});
        console.log('✅ Todas las invoices eliminadas');
        
        await prisma.student.deleteMany({});
        console.log('✅ Estudiantes eliminados');
        
        console.log('🎉 Base de datos limpia, lista para nueva importación');
        
    } catch (error) {
        console.error('❌ Error limpiando base de datos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanStudents();