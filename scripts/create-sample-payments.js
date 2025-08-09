const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSamplePayments() {
  try {
    console.log('💳 Creando pagos de ejemplo...');
    
    // Get some pending invoices
    const pendingInvoices = await prisma.invoice.findMany({
      where: { status: 'PENDING' },
      take: 5,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    if (pendingInvoices.length === 0) {
      console.log('❌ No hay facturas pendientes');
      return;
    }
    
    // Get a user to assign as creator
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No hay usuarios en el sistema');
      return;
    }
    
    const paymentMethods = ['CASH', 'BANK_TRANSFER', 'CARD'];
    let created = 0;
    
    for (const invoice of pendingInvoices) {
      const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      // Create partial or full payment
      const isPartialPayment = Math.random() > 0.7; // 30% chance of partial payment
      const paymentAmount = isPartialPayment ? 
        Math.floor(invoice.total * (0.3 + Math.random() * 0.4)) : // 30-70% of total
        invoice.total;
      
      // Generate payment number
      const paymentNumber = `PAG-2025-${(created + 1).toString().padStart(6, '0')}`;
      
      try {
        await prisma.$transaction(async (tx) => {
          // Create payment
          await tx.payment.create({
            data: {
              paymentNumber,
              studentId: invoice.studentId,
              invoiceId: invoice.id,
              amount: paymentAmount,
              method,
              date: new Date(),
              status: 'COMPLETED',
              userId: user.id,
              reference: method === 'BANK_TRANSFER' ? `REF${Math.floor(Math.random() * 1000000)}` : null
            }
          });
          
          // Update invoice status
          const newStatus = paymentAmount >= invoice.total ? 'PAID' : 'PARTIAL';
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: newStatus }
          });
        });
        
        created++;
        console.log(`✅ Pago creado: ${paymentNumber} - ${invoice.student.firstName} ${invoice.student.lastName} - $${paymentAmount.toLocaleString()}`);
        
      } catch (error) {
        console.error(`❌ Error creando pago para factura ${invoice.invoiceNumber}:`, error.message);
      }
    }
    
    console.log(`🎉 ¡Pagos creados exitosamente! Total: ${created}`);
    
    // Show summary
    const paymentSummary = await prisma.payment.groupBy({
      by: ['method'],
      _count: { id: true },
      _sum: { amount: true }
    });
    
    console.log('\n📊 Resumen de pagos creados:');
    paymentSummary.forEach(item => {
      console.log(`${item.method}: ${item._count.id} pagos - $${item._sum.amount?.toLocaleString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error creando pagos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSamplePayments();