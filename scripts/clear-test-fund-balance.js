/**
 * Script para eliminar el saldo de un fondo de prueba específico
 * Uso: node scripts/clear-test-fund-balance.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearTestFundBalance() {
    console.log('🧹 Iniciando limpieza de saldo de fondo de prueba...\n');

    try {
        await prisma.$connect();
        console.log('✅ Conectado a la base de datos\n');

        // 1. Mostrar todos los fondos para identificar cuál limpiar
        console.log('📋 Fondos disponibles:');
        const allFunds = await prisma.fund.findMany({
            orderBy: { createdAt: 'desc' }
        });

        if (allFunds.length === 0) {
            console.log('❌ No se encontraron fondos en la base de datos');
            return;
        }

        console.log('═'.repeat(80));
        allFunds.forEach((fund, index) => {
            console.log(`${index + 1}. ${fund.name} (${fund.code})`);
            console.log(`   - ID: ${fund.id}`);
            console.log(`   - Saldo: $${fund.currentBalance?.toLocaleString() || 0}`);
            console.log(`   - Tipo: ${fund.type}`);
            console.log(`   - Estado: ${fund.isActive ? 'Activo' : 'Inactivo'}`);
            console.log(`   - Creado: ${fund.createdAt}`);
            console.log('   ' + '─'.repeat(50));
        });

        // 2. Buscar fondos con saldo positivo (probablemente de prueba)
        const fundsWithBalance = allFunds.filter(fund => fund.currentBalance > 0);
        
        if (fundsWithBalance.length === 0) {
            console.log('✅ No hay fondos con saldo positivo para limpiar');
            return;
        }

        console.log(`\n🎯 Fondos con saldo positivo encontrados: ${fundsWithBalance.length}`);
        
        // 3. Identificar fondos de prueba (por nombre o código)
        const testFunds = fundsWithBalance.filter(fund => 
            fund.name.toLowerCase().includes('prueba') ||
            fund.code.toLowerCase().includes('prueb') ||
            fund.name.toLowerCase().includes('test') ||
            fund.code.toLowerCase().includes('test') ||
            fund.description?.toLowerCase().includes('prueba') ||
            fund.description?.toLowerCase().includes('test')
        );

        if (testFunds.length > 0) {
            console.log('\n🧪 Fondos de prueba identificados:');
            for (const fund of testFunds) {
                console.log(`\n🎯 Procesando: ${fund.name} (${fund.code})`);
                console.log(`   Saldo actual: $${fund.currentBalance.toLocaleString()}`);
                
                await clearFundBalance(fund);
            }
        } else {
            console.log('\n⚠️ No se encontraron fondos de prueba automáticamente.');
            console.log('Fondos con saldo positivo:');
            
            fundsWithBalance.forEach((fund, index) => {
                console.log(`${index + 1}. ${fund.name} - $${fund.currentBalance.toLocaleString()}`);
            });
            
            console.log('\n💡 Para limpiar un fondo específico, modifica el script y agrega el ID del fondo.');
            console.log('Ejemplo: await clearSpecificFund("ID_DEL_FONDO_AQUI");');
        }

    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Desconectado de la base de datos');
    }
}

// Función para limpiar el saldo de un fondo específico
async function clearFundBalance(fund) {
    try {
        const currentBalance = fund.currentBalance;
        
        if (currentBalance <= 0) {
            console.log(`   ✅ El fondo ya tiene saldo cero o negativo`);
            return;
        }

        // Crear transacción de ajuste para poner el saldo en cero
        const transaction = await prisma.fundTransaction.create({
            data: {
                fundId: fund.id,
                type: 'EXPENSE',
                amount: -currentBalance, // Negativo para restar el saldo completo
                description: `Ajuste administrativo: Eliminación de saldo de prueba (${fund.name})`,
                category: 'ADMINISTRATIVE_ADJUSTMENT',
                performedBy: 'SYSTEM' // O puedes usar un ID de usuario específico
            }
        });

        // Actualizar el saldo del fondo a cero
        const updatedFund = await prisma.fund.update({
            where: { id: fund.id },
            data: {
                currentBalance: 0,
                totalExpenses: fund.totalExpenses + currentBalance
            }
        });

        console.log(`   ✅ Saldo eliminado exitosamente`);
        console.log(`   📝 Transacción creada: ${transaction.id}`);
        console.log(`   💰 Saldo anterior: $${currentBalance.toLocaleString()}`);
        console.log(`   💰 Saldo nuevo: $${updatedFund.currentBalance.toLocaleString()}`);

    } catch (error) {
        console.error(`   ❌ Error limpiando fondo ${fund.name}:`, error.message);
    }
}

// Función para limpiar un fondo específico por ID (para uso manual)
async function clearSpecificFund(fundId) {
    try {
        const fund = await prisma.fund.findUnique({
            where: { id: fundId }
        });

        if (!fund) {
            console.log(`❌ Fondo con ID ${fundId} no encontrado`);
            return;
        }

        console.log(`🎯 Limpiando fondo específico: ${fund.name}`);
        await clearFundBalance(fund);

    } catch (error) {
        console.error('❌ Error limpiando fondo específico:', error);
    }
}

// Función para limpiar TODOS los fondos (¡PELIGROSO!)
async function clearAllFundsBalance() {
    console.log('⚠️ ADVERTENCIA: Esta función eliminará el saldo de TODOS los fondos');
    console.log('Solo usar en entornos de desarrollo/prueba');
    
    const allFunds = await prisma.fund.findMany({
        where: {
            currentBalance: {
                gt: 0
            }
        }
    });

    console.log(`🎯 Limpiando ${allFunds.length} fondos con saldo positivo...`);
    
    for (const fund of allFunds) {
        await clearFundBalance(fund);
    }
}

// Ejecutar el script
clearTestFundBalance()
    .then(() => {
        console.log('\n🎉 Limpieza completada');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });

// Exportar funciones para uso manual si es necesario
module.exports = {
    clearTestFundBalance,
    clearSpecificFund,
    clearAllFundsBalance
};