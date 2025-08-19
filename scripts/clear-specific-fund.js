/**
 * Script directo para eliminar el saldo de un fondo específico
 * Uso: node scripts/clear-specific-fund.js
 * 
 * INSTRUCCIONES:
 * 1. Ejecuta el script para ver los fondos disponibles
 * 2. Copia el ID del fondo que quieres limpiar
 * 3. Descomenta y modifica la línea FUND_ID_TO_CLEAR
 * 4. Ejecuta el script nuevamente
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 🎯 CONFIGURA AQUÍ EL ID DEL FONDO QUE QUIERES LIMPIAR
// Descomenta la siguiente línea y pon el ID del fondo:
// const FUND_ID_TO_CLEAR = "pon-aqui-el-id-del-fondo";

async function clearSpecificFundBalance() {
    console.log('🎯 Script para limpiar saldo de fondo específico\n');

    try {
        await prisma.$connect();
        console.log('✅ Conectado a la base de datos\n');

        // Si no se especificó un ID, mostrar fondos disponibles
        if (typeof FUND_ID_TO_CLEAR === 'undefined') {
            console.log('📋 Fondos disponibles para limpiar:\n');
            
            const funds = await prisma.fund.findMany({
                where: {
                    currentBalance: {
                        gt: 0
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            if (funds.length === 0) {
                console.log('✅ No hay fondos con saldo positivo');
                return;
            }

            console.log('═'.repeat(100));
            funds.forEach((fund, index) => {
                console.log(`${index + 1}. 📁 ${fund.name} (${fund.code})`);
                console.log(`   🆔 ID: ${fund.id}`);
                console.log(`   💰 Saldo: $${fund.currentBalance.toLocaleString()}`);
                console.log(`   📊 Tipo: ${fund.type}`);
                console.log(`   📅 Creado: ${fund.createdAt.toLocaleDateString()}`);
                console.log('   ' + '─'.repeat(80));
            });

            console.log('\n🔧 INSTRUCCIONES:');
            console.log('1. Copia el ID del fondo que quieres limpiar');
            console.log('2. Edita este archivo (scripts/clear-specific-fund.js)');
            console.log('3. Descomenta y modifica la línea: const FUND_ID_TO_CLEAR = "ID_AQUI";');
            console.log('4. Ejecuta el script nuevamente');
            console.log('\nEjemplo:');
            console.log('const FUND_ID_TO_CLEAR = "' + (funds[0]?.id || 'ejemplo-id') + '";');
            
            return;
        }

        // Procesar el fondo específico
        console.log(`🎯 Procesando fondo con ID: ${FUND_ID_TO_CLEAR}\n`);

        const fund = await prisma.fund.findUnique({
            where: { id: FUND_ID_TO_CLEAR }
        });

        if (!fund) {
            console.log(`❌ No se encontró un fondo con ID: ${FUND_ID_TO_CLEAR}`);
            console.log('Verifica que el ID sea correcto');
            return;
        }

        console.log('📁 Información del fondo:');
        console.log(`   Nombre: ${fund.name}`);
        console.log(`   Código: ${fund.code}`);
        console.log(`   Saldo actual: $${fund.currentBalance.toLocaleString()}`);
        console.log(`   Tipo: ${fund.type}`);
        console.log(`   Estado: ${fund.isActive ? 'Activo' : 'Inactivo'}`);

        if (fund.currentBalance <= 0) {
            console.log('\n✅ Este fondo ya tiene saldo cero o negativo');
            console.log('No es necesario limpiarlo');
            return;
        }

        console.log('\n🧹 Iniciando limpieza del saldo...');

        // Crear transacción de ajuste
        const transaction = await prisma.fundTransaction.create({
            data: {
                fundId: fund.id,
                type: 'EXPENSE',
                amount: -fund.currentBalance,
                description: `Eliminación de saldo de prueba - Ajuste administrativo (${fund.name})`,
                category: 'ADMINISTRATIVE_ADJUSTMENT',
                performedBy: 'SYSTEM'
            }
        });

        // Actualizar el fondo
        const updatedFund = await prisma.fund.update({
            where: { id: fund.id },
            data: {
                currentBalance: 0,
                totalExpenses: fund.totalExpenses + fund.currentBalance
            }
        });

        console.log('\n✅ ¡Saldo eliminado exitosamente!');
        console.log(`📝 ID de transacción: ${transaction.id}`);
        console.log(`💰 Saldo eliminado: $${fund.currentBalance.toLocaleString()}`);
        console.log(`💰 Nuevo saldo: $${updatedFund.currentBalance.toLocaleString()}`);
        console.log(`📊 Total gastos actualizado: $${updatedFund.totalExpenses.toLocaleString()}`);

        console.log('\n🎯 El fondo ahora puede ser eliminado desde la interfaz web');

    } catch (error) {
        console.error('❌ Error durante la operación:', error);
        
        if (error.code === 'P2025') {
            console.log('💡 El fondo especificado no existe o ya fue eliminado');
        }
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Desconectado de la base de datos');
    }
}

// Ejecutar el script
clearSpecificFundBalance()
    .then(() => {
        console.log('\n🎉 Script completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });