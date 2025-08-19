/**
 * Script para probar la funcionalidad completa de fondos en Railway
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFundsFunctionality() {
    console.log('🧪 Probando funcionalidad completa de fondos en Railway...\n');

    try {
        await prisma.$connect();
        console.log('✅ Conectado a la base de datos\n');

        // 1. Limpiar fondos existentes (solo para prueba)
        console.log('1. Limpiando fondos existentes...');
        const deletedCount = await prisma.fund.deleteMany({});
        console.log(`🗑️ Eliminados ${deletedCount.count} fondos existentes\n`);

        // 2. Crear fondos de prueba
        console.log('2. Creando fondos de prueba...');
        const testFunds = [
            {
                name: 'Fondo de Eventos Escolares',
                code: 'EVE2025',
                type: 'EVENTS',
                description: 'Fondo destinado a la organización de eventos escolares y actividades extracurriculares',
                initialBalance: 800000,
                currentBalance: 800000,
                totalIncome: 0,
                totalExpenses: 0,
                alertLevel1: 70,
                alertLevel2: 85,
                alertLevel3: 95,
                isActive: true,
                academicYear: 2025
            },
            {
                name: 'Fondo de Matrículas 2025',
                code: 'MAT2025',
                type: 'TUITION',
                description: 'Fondo para el manejo de ingresos por matrículas del año académico 2025',
                initialBalance: 1500000,
                currentBalance: 1500000,
                totalIncome: 0,
                totalExpenses: 0,
                alertLevel1: 60,
                alertLevel2: 80,
                alertLevel3: 90,
                isActive: true,
                academicYear: 2025
            },
            {
                name: 'Fondo Mensualidades',
                code: 'MENS2025',
                type: 'MONTHLY_FEES',
                description: 'Fondo para el recaudo y manejo de mensualidades',
                initialBalance: 2000000,
                currentBalance: 2000000,
                totalIncome: 0,
                totalExpenses: 0,
                alertLevel1: 65,
                alertLevel2: 82,
                alertLevel3: 92,
                isActive: true,
                academicYear: 2025
            },
            {
                name: 'Fondo Operacional',
                code: 'OPE2025',
                type: 'OPERATIONAL',
                description: 'Fondo para gastos operacionales y administrativos',
                initialBalance: 1200000,
                currentBalance: 1200000,
                totalIncome: 0,
                totalExpenses: 0,
                alertLevel1: 75,
                alertLevel2: 88,
                alertLevel3: 95,
                isActive: true,
                academicYear: 2025
            },
            {
                name: 'Fondo de Emergencia',
                code: 'EME2025',
                type: 'EMERGENCY',
                description: 'Fondo de reserva para situaciones de emergencia',
                initialBalance: 500000,
                currentBalance: 500000,
                totalIncome: 0,
                totalExpenses: 0,
                alertLevel1: 80,
                alertLevel2: 90,
                alertLevel3: 95,
                isActive: true,
                academicYear: 2025
            }
        ];

        const createdFunds = [];
        for (const fundData of testFunds) {
            try {
                const fund = await prisma.fund.create({
                    data: fundData
                });
                createdFunds.push(fund);
                console.log(`✅ Creado: ${fund.name} - Saldo: $${fund.currentBalance.toLocaleString()}`);
            } catch (error) {
                console.log(`❌ Error creando ${fundData.name}:`, error.message);
            }
        }

        console.log(`\n📊 Total de fondos creados: ${createdFunds.length}\n`);

        // 3. Verificar que se pueden consultar
        console.log('3. Verificando consulta de fondos...');
        const allFunds = await prisma.fund.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        transactions: true,
                        alerts: true
                    }
                }
            }
        });

        console.log(`✅ Consultados ${allFunds.length} fondos desde la base de datos`);

        // 4. Mostrar resumen de fondos
        console.log('\n4. Resumen de fondos creados:');
        console.log('═'.repeat(80));
        
        let totalBalance = 0;
        allFunds.forEach((fund, index) => {
            totalBalance += fund.currentBalance || 0;
            console.log(`${index + 1}. ${fund.name}`);
            console.log(`   Código: ${fund.code} | Tipo: ${fund.type}`);
            console.log(`   Saldo: $${(fund.currentBalance || 0).toLocaleString()}`);
            console.log(`   Estado: ${fund.isActive ? '🟢 Activo' : '🔴 Inactivo'}`);
            console.log(`   Año: ${fund.academicYear || 'N/A'}`);
            console.log('   ' + '─'.repeat(50));
        });

        console.log(`\n💰 Saldo total de todos los fondos: $${totalBalance.toLocaleString()}`);

        // 5. Probar filtros y búsquedas
        console.log('\n5. Probando filtros...');
        
        const activeFunds = await prisma.fund.findMany({
            where: { isActive: true }
        });
        console.log(`🟢 Fondos activos: ${activeFunds.length}`);

        const eventFunds = await prisma.fund.findMany({
            where: { type: 'EVENTS' }
        });
        console.log(`🎉 Fondos de eventos: ${eventFunds.length}`);

        const currentYearFunds = await prisma.fund.findMany({
            where: { academicYear: 2025 }
        });
        console.log(`📅 Fondos del año 2025: ${currentYearFunds.length}`);

        // 6. Simular datos para el dashboard
        console.log('\n6. Calculando estadísticas para el dashboard...');
        const stats = {
            totalFunds: allFunds.length,
            totalBalance: totalBalance,
            activeFunds: activeFunds.length,
            fundsWithAlerts: 0 // Por ahora 0 ya que son fondos nuevos
        };

        console.log('📊 Estadísticas del dashboard:');
        console.log(`   - Total de fondos: ${stats.totalFunds}`);
        console.log(`   - Saldo total: $${stats.totalBalance.toLocaleString()}`);
        console.log(`   - Fondos activos: ${stats.activeFunds}`);
        console.log(`   - Fondos con alertas: ${stats.fundsWithAlerts}`);

        console.log('\n✅ Prueba de funcionalidad completada exitosamente');
        console.log('\n🌐 Los fondos deberían aparecer ahora en la interfaz web');
        console.log('📝 Recarga la página de Gestión de Fondos para ver los cambios');

    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
        
        if (error.code) {
            console.log(`\n🔧 Código de error Prisma: ${error.code}`);
        }
        
        if (error.message) {
            console.log(`📝 Mensaje: ${error.message}`);
        }
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Desconectado de la base de datos');
    }
}

// Ejecutar prueba
testFundsFunctionality()
    .then(() => {
        console.log('\n🎉 Prueba completada');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });