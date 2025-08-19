const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDashboardFunds() {
  try {
    console.log('🔧 Verificando y corrigiendo fondos para el dashboard...');

    // Verificar si existen fondos
    const existingFunds = await prisma.fund.findMany();
    console.log(`📊 Fondos existentes: ${existingFunds.length}`);

    if (existingFunds.length === 0) {
      console.log('📝 Creando fondos básicos...');
      
      // Crear fondos básicos
      const basicFunds = [
        {
          name: 'Fondo de Matrículas',
          code: 'MATRICULAS',
          type: 'TUITION',
          description: 'Fondo para el manejo de ingresos por matrículas',
          academicYear: new Date().getFullYear(),
          initialBalance: 0,
          currentBalance: 0,
          balance: 0,
          totalIncome: 0,
          totalExpenses: 0,
          isActive: true,
          alertLevel1: 70.0,
          alertLevel2: 85.0,
          alertLevel3: 95.0
        },
        {
          name: 'Fondo de Mensualidades',
          code: 'MENSUALIDADES',
          type: 'MONTHLY_FEES',
          description: 'Fondo para el manejo de ingresos por mensualidades',
          academicYear: new Date().getFullYear(),
          initialBalance: 0,
          currentBalance: 0,
          balance: 0,
          totalIncome: 0,
          totalExpenses: 0,
          isActive: true,
          alertLevel1: 70.0,
          alertLevel2: 85.0,
          alertLevel3: 95.0
        },
        {
          name: 'Fondo de Eventos',
          code: 'EVENTOS',
          type: 'EVENTS',
          description: 'Fondo para el manejo de ingresos y gastos de eventos',
          academicYear: new Date().getFullYear(),
          initialBalance: 0,
          currentBalance: 0,
          balance: 0,
          totalIncome: 0,
          totalExpenses: 0,
          isActive: true,
          alertLevel1: 70.0,
          alertLevel2: 85.0,
          alertLevel3: 95.0
        },
        {
          name: 'Fondo Operacional',
          code: 'OPERACIONAL',
          type: 'OPERATIONAL',
          description: 'Fondo para gastos operacionales de la institución',
          academicYear: new Date().getFullYear(),
          initialBalance: 0,
          currentBalance: 0,
          balance: 0,
          totalIncome: 0,
          totalExpenses: 0,
          isActive: true,
          alertLevel1: 70.0,
          alertLevel2: 85.0,
          alertLevel3: 95.0
        }
      ];

      for (const fundData of basicFunds) {
        const fund = await prisma.fund.create({
          data: fundData
        });
        console.log(`✅ Fondo creado: ${fund.name} (${fund.code})`);
      }
    }

    // Verificar datos del dashboard
    console.log('📊 Verificando datos del dashboard...');
    
    const stats = await Promise.all([
      prisma.student.count(),
      prisma.event.count(),
      prisma.invoice.count(),
      prisma.payment.count(),
      prisma.fund.count()
    ]);

    console.log(`
📈 Estadísticas actuales:
- Estudiantes: ${stats[0]}
- Eventos: ${stats[1]}
- Facturas: ${stats[2]}
- Pagos: ${stats[3]}
- Fondos: ${stats[4]}
    `);

    // Si no hay datos, crear algunos datos de ejemplo
    if (stats.every(stat => stat === 0)) {
      console.log('⚠️ No hay datos en el sistema. El dashboard mostrará valores en cero.');
      console.log('💡 Sugerencia: Crear algunos estudiantes, eventos o facturas para ver datos en el dashboard.');
    }

    console.log('✅ Verificación completada. El dashboard debería funcionar correctamente.');

  } catch (error) {
    console.error('❌ Error corrigiendo fondos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixDashboardFunds()
    .then(() => {
      console.log('🎉 Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error ejecutando script:', error);
      process.exit(1);
    });
}

module.exports = { fixDashboardFunds };