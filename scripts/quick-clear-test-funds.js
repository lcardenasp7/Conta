/**
 * Script rápido para eliminar saldos de fondos de prueba
 * Busca automáticamente fondos con "PRUEBA", "TEST", etc. en el nombre
 * Uso: node scripts/quick-clear-test-funds.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickClearTestFunds() {
    console.log('⚡ Script rápido para limpiar fondos de prueba\n');

    try {
        await prisma.$connect();
        console.log('✅ Conectado a la base de datos\n');

        // Buscar fondos de prueba con saldo positivo
        const testFunds = await prisma.fund.findMany({
            where: {
                AND: [
                    {
                        currentBalance: {
                            gt: 0
                        }
                    },
                    {
                        OR: [
                            { name: { contains: 'PRUEBA', mode: 'insensitive' } },
                            { name: { contains: 'TEST', mode: 'insensitive' } },
                            { name: { contains: 'DEMO', mode: 'insensitive' } },
                            { code: { contains: 'PRUEB', mode: 'insensitive' } },
                            { code: { contains: 'TEST', mode: 'insensitive' } },
                            { code: { contains: 'DEMO', mode: 'insensitive' } },
                            { description: { contains: 'prueba', mode: 'insensitive' } },
                            { description: { contains: 'test', mode: 'insensitive' } }
                        ]
                    }
                ]
            }
        });

        if (testFunds.length === 0) {
            console.log('✅ No se encontraron fondos de prueba con saldo positivo');
            
            // Mostrar todos los fondos con saldo para referencia
            const allFundsWithBalance = await prisma.fund.findMany({
                where: {
                    currentBalance: { gt: 0 }
                }
            });

            if (allFundsWithBalance.length > 0) {
                console.log('\n📋 Fondos con saldo positivo (no identificados como prueba):');
                allFundsWithBalance.forEach((fund, index) => {
                    console.log(`${index + 1}. ${fund.name} (${fund.code}) - $${fund.currentBalance.toLocaleString()}`);
                });
                console.log('\n💡 Si alguno de estos es de prueba, usa el script clear-specific-fund.js');
            }
            
            return;
        }

        console.log(`🎯 Encontrados ${testFunds.length} fondos de prueba con saldo:\n`);

        for (const fund of testFunds) {
            console.log(`🧹 Limpiando: ${fund.name} (${fund.code})`);
            console.log(`   💰 Saldo actual: $${fund.currentBalance.toLocaleString()}`);

            try {
                // Crear transacción de ajuste
                const transaction = await prisma.fundTransaction.create({
                    data: {
                        fundId: fund.id,
                        type: 'EXPENSE',
                        amount: -fund.currentBalance,
                        description: `Eliminación automática de saldo de prueba - ${fund.name}`,
                        category: 'ADMINISTRATIVE_ADJUSTMENT',
                        performedBy: 'SYSTEM'
                    }
                });

                // Actualizar el fondo
                await prisma.fund.update({
                    where: { id: fund.id },
                    data: {
                        currentBalance: 0,
                        totalExpenses: fund.totalExpenses + fund.currentBalance
                    }
                });

                console.log(`   ✅ Saldo eliminado - Transacción: ${transaction.id}`);

            } catch (error) {
                console.log(`   ❌ Error limpiando ${fund.name}: ${error.message}`);
            }

            console.log('   ' + '─'.repeat(60));
        }

        console.log('\n🎉 Limpieza completada');
        console.log(`✅ ${testFunds.length} fondos de prueba limpiados`);
        console.log('🗑️ Ahora puedes eliminar estos fondos desde la interfaz web');

    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Desconectado de la base de datos');
    }
}

// Ejecutar el script
quickClearTestFunds()
    .then(() => {
        console.log('\n⚡ Script rápido completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });