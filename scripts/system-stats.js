const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getSystemStats() {
  try {
    const [
      totalStudents,
      totalInvoices,
      totalPayments,
      totalEvents,
      totalUsers,
      pendingInvoices,
      totalDebtors
    ] = await Promise.all([
      prisma.student.count(),
      prisma.invoice.count(),
      prisma.payment.count(),
      prisma.event.count(),
      prisma.user.count(),
      prisma.invoice.count({ where: { status: { in: ['PENDING', 'PARTIAL'] } } }),
      prisma.invoice.findMany({
        where: { status: { in: ['PENDING', 'PARTIAL'] } },
        select: { studentId: true },
        distinct: ['studentId']
      })
    ]);
    
    console.log('📊 ESTADÍSTICAS DEL SISTEMA:');
    console.log('============================');
    console.log(`👥 Estudiantes: ${totalStudents}`);
    console.log(`🧾 Facturas: ${totalInvoices}`);
    console.log(`💳 Pagos: ${totalPayments}`);
    console.log(`🎉 Eventos: ${totalEvents}`);
    console.log(`👤 Usuarios: ${totalUsers}`);
    console.log(`⚠️  Facturas pendientes: ${pendingInvoices}`);
    console.log(`💰 Deudores: ${totalDebtors.length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getSystemStats();