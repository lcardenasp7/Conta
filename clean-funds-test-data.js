const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanFundsTestData() {
    console.log('🧹 Limpiando datos de prueba de fondos...');
    
    try {
        // 1. Eliminar todas las alertas de fondos
        console.log('📝 Eliminando alertas de fondos...');
        const alertsCount = await prisma.fundAlert.count();
        if (alertsCount > 0) {
            await prisma.fundAlert.deleteMany({});
            console.log(`✅ ${alertsCount} alertas de fondos eliminadas`);
        } else {
            console.log('ℹ️ No hay alertas de fondos para eliminar');
        }

        // 2. Eliminar todas las transacciones de fondos
        console.log('📝 Eliminando transacciones de fondos...');
        const transactionsCount = await prisma.fundTransaction.count();
        if (transactionsCount > 0) {
            await prisma.fundTransaction.deleteMany({});
            console.log(`✅ ${transactionsCount} transacciones de fondos eliminadas`);
        } else {
            console.log('ℹ️ No hay transacciones de fondos para eliminar');
        }

        // 3. Eliminar todos los préstamos entre fondos
        console.log('📝 Eliminando préstamos entre fondos...');
        const loansCount = await prisma.fundLoan.count();
        if (loansCount > 0) {
            await prisma.fundLoan.deleteMany({});
            console.log(`✅ ${loansCount} préstamos entre fondos eliminados`);
        } else {
            console.log('ℹ️ No hay préstamos entre fondos para eliminar');
        }

        // 4. Eliminar todos los fondos
        console.log('📝 Eliminando todos los fondos...');
        const fundsCount = await prisma.fund.count();
        if (fundsCount > 0) {
            await prisma.fund.deleteMany({});
            console.log(`✅ ${fundsCount} fondos eliminados`);
        } else {
            console.log('ℹ️ No hay fondos para eliminar');
        }

        // 5. Verificar que todo esté limpio
        console.log('\n📊 Verificando limpieza...');
        const remainingFunds = await prisma.fund.count();
        const remainingTransactions = await prisma.fundTransaction.count();
        const remainingLoans = await prisma.fundLoan.count();
        const remainingAlerts = await prisma.fundAlert.count();

        console.log(`📊 Fondos restantes: ${remainingFunds}`);
        console.log(`📊 Transacciones restantes: ${remainingTransactions}`);
        console.log(`📊 Préstamos restantes: ${remainingLoans}`);
        console.log(`📊 Alertas restantes: ${remainingAlerts}`);

        if (remainingFunds === 0 && remainingTransactions === 0 && remainingLoans === 0 && remainingAlerts === 0) {
            console.log('\n🎉 ¡Limpieza completada exitosamente!');
            console.log('✅ Todos los datos de prueba de fondos han sido eliminados');
            console.log('✅ El sistema está listo para datos reales de producción');
        } else {
            console.log('\n⚠️ Algunos datos no fueron eliminados completamente');
        }

        return {
            success: true,
            fundsDeleted: fundsCount,
            transactionsDeleted: transactionsCount,
            loansDeleted: loansCount,
            alertsDeleted: alertsCount
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
    cleanFundsTestData()
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

module.exports = { cleanFundsTestData };