const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleInvoices() {
  try {
    console.log('🧾 Creando facturas de ejemplo...');
    
    // Get some students
    const students = await prisma.student.findMany({
      take: 20,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        document: true
      }
    });
    
    if (students.length === 0) {
      console.log('❌ No hay estudiantes en el sistema');
      return;
    }
    
    console.log(`📊 Creando facturas para ${students.length} estudiantes...`);
    
    // Get a user to assign as creator
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No hay usuarios en el sistema');
      return;
    }
    
    const concepts = ['TUITION', 'MONTHLY', 'EVENT', 'UNIFORM', 'BOOKS'];
    const conceptNames = {
      'TUITION': 'Matrícula 2025',
      'MONTHLY': 'Mensualidad',
      'EVENT': 'Evento Escolar',
      'UNIFORM': 'Uniforme Escolar',
      'BOOKS': 'Libros y Materiales'
    };
    
    let created = 0;
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const concept = concepts[i % concepts.length];
      const baseAmount = concept === 'TUITION' ? 200000 : 
                        concept === 'MONTHLY' ? 150000 :
                        concept === 'UNIFORM' ? 80000 :
                        concept === 'BOOKS' ? 120000 : 50000;
      
      // Add some variation to amounts
      const amount = baseAmount + (Math.random() * 50000 - 25000);
      const finalAmount = Math.round(amount / 1000) * 1000; // Round to nearest 1000
      
      // Create due date (some overdue, some current)
      const dueDate = new Date();
      const daysOffset = Math.floor(Math.random() * 120) - 60; // -60 to +60 days
      dueDate.setDate(dueDate.getDate() + daysOffset);
      
      // Generate invoice number
      const invoiceNumber = `FAC-2025-${(created + 1).toString().padStart(6, '0')}`;
      
      try {
        await prisma.invoice.create({
          data: {
            invoiceNumber,
            studentId: student.id,
            concept,
            date: new Date(),
            dueDate,
            subtotal: finalAmount,
            tax: 0, // Educational services exempt from VAT
            total: finalAmount,
            status: Math.random() > 0.3 ? 'PENDING' : 'PAID', // 70% pending, 30% paid
            userId: user.id,
            items: {
              create: [{
                description: conceptNames[concept],
                quantity: 1,
                unitPrice: finalAmount,
                total: finalAmount
              }]
            }
          }
        });
        
        created++;
        
        if (created % 5 === 0) {
          console.log(`✅ Creadas: ${created}/${students.length}`);
        }
        
      } catch (error) {
        console.error(`❌ Error creando factura para ${student.firstName} ${student.lastName}:`, error.message);
      }
    }
    
    console.log(`🎉 ¡Facturas creadas exitosamente! Total: ${created}`);
    
    // Show summary
    const summary = await prisma.invoice.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { total: true }
    });
    
    console.log('\n📊 Resumen de facturas creadas:');
    summary.forEach(item => {
      console.log(`${item.status}: ${item._count.id} facturas - $${item._sum.total?.toLocaleString()}`);
    });
    
    // Show overdue count
    const overdueCount = await prisma.invoice.count({
      where: {
        status: 'PENDING',
        dueDate: { lt: new Date() }
      }
    });
    
    console.log(`⏰ Facturas vencidas: ${overdueCount}`);
    
  } catch (error) {
    console.error('❌ Error creando facturas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleInvoices();