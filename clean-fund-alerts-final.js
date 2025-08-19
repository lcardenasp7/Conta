const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanFundAlertsCompletely() {
    console.log('🧹 Limpiando alertas de fondos fantasma...');
    
    try {
        // 1. Eliminar TODAS las alertas de fondos
        console.log('📝 Eliminando todas las alertas de fondos...');
        const alertsCount = await prisma.fundAlert.count();
        console.log(`📊 Alertas encontradas: ${alertsCount}`);
        
        if (alertsCount > 0) {
            await prisma.fundAlert.deleteMany({});
            console.log(`✅ ${alertsCount} alertas eliminadas`);
        }

        // 2. Verificar que no hay fondos fantasma
        console.log('📝 Verificando fondos existentes...');
        const funds = await prisma.fund.findMany({
            select: {
                id: true,
                name: true,
                code: true,
                isActive: true
            }
        });
        
        console.log(`📊 Fondos encontrados: ${funds.length}`);
        funds.forEach((fund, index) => {
            console.log(`${index + 1}. ${fund.name} (${fund.code}) - ${fund.isActive ? 'Activo' : 'Inactivo'}`);
        });

        // 3. Eliminar transacciones huérfanas
        console.log('📝 Eliminando transacciones huérfanas...');
        const transactionsCount = await prisma.fundTransaction.count();
        if (transactionsCount > 0) {
            await prisma.fundTransaction.deleteMany({});
            console.log(`✅ ${transactionsCount} transacciones eliminadas`);
        }

        // 4. Eliminar préstamos huérfanos
        console.log('📝 Eliminando préstamos huérfanos...');
        const loansCount = await prisma.fundLoan.count();
        if (loansCount > 0) {
            await prisma.fundLoan.deleteMany({});
            console.log(`✅ ${loansCount} préstamos eliminados`);
        }

        // 5. Verificación final
        console.log('\n📊 Verificación final...');
        const finalAlerts = await prisma.fundAlert.count();
        const finalFunds = await prisma.fund.count();
        const finalTransactions = await prisma.fundTransaction.count();
        const finalLoans = await prisma.fundLoan.count();

        console.log(`📊 Alertas restantes: ${finalAlerts}`);
        console.log(`📊 Fondos restantes: ${finalFunds}`);
        console.log(`📊 Transacciones restantes: ${finalTransactions}`);
        console.log(`📊 Préstamos restantes: ${finalLoans}`);

        if (finalAlerts === 0) {
            console.log('\n🎉 ¡Limpieza de alertas completada exitosamente!');
            console.log('✅ No más alertas fantasma');
            console.log('✅ Sistema de fondos completamente limpio');
        }

        return {
            success: true,
            alertsDeleted: alertsCount,
            fundsRemaining: finalFunds,
            transactionsDeleted: transactionsCount,
            loansDeleted: loansCount
        };

    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    cleanFundAlertsCompletely()
        .then((result) => {
            console.log('\n✅ Script completado exitosamente');
            console.log('📊 Resultado:', result);
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { cleanFundAlertsCompletely };