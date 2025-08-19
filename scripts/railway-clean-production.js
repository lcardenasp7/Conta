#!/usr/bin/env node

/**
 * Script para limpiar la base de datos de Railway
 * Elimina todos los datos de prueba y deja solo lo esencial
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanProductionDatabase() {
    console.log('🧹 LIMPIANDO BASE DE DATOS DE RAILWAY');
    console.log('===================================\n');

    try {
        // 1. Eliminar todos los datos transaccionales
        console.log('🗑️ Eliminando datos transaccionales...');
        
        await prisma.fundTransaction.deleteMany({});
        console.log('✅ Transacciones de fondos eliminadas');
        
        await prisma.payment.deleteMany({});
        console.log('✅ Pagos eliminados');
        
        await prisma.invoiceItem.deleteMany({});
        console.log('✅ Items de facturas eliminados');
        
        await prisma.invoice.deleteMany({});
        console.log('✅ Facturas eliminadas');
        
        await prisma.eventAssignment.deleteMany({});
        console.log('✅ Asignaciones de eventos eliminadas');
        
        await prisma.event.deleteMany({});
        console.log('✅ Eventos eliminados');
        
        // 2. Resetear fondos (mantener estructura pero sin dinero)
        console.log('\n💰 Reseteando fondos...');
        
        await prisma.fund.updateMany({
            data: {
                currentBalance: 0,
                totalIncome: 0,
                totalExpenses: 0,
                balance: 0
            }
        });
        console.log('✅ Saldos de fondos reseteados a $0');
        
        // 3. Eliminar estudiantes de prueba (mantener solo estructura)
        console.log('\n👥 Eliminando estudiantes de prueba...');
        
        const studentCount = await prisma.student.count();
        console.log(`📊 Estudiantes actuales: ${studentCount}`);
        
        if (studentCount > 0) {
            await prisma.student.deleteMany({});
            console.log('✅ Todos los estudiantes eliminados');
        }
        
        // 4. Verificar que solo queden datos esenciales
        console.log('\n📋 VERIFICANDO DATOS RESTANTES...');
        
        const institution = await prisma.institution.count();
        const users = await prisma.user.count();
        const grades = await prisma.grade.count();
        const groups = await prisma.group.count();
        const accounts = await prisma.account.count();
        const funds = await prisma.fund.count();
        
        console.log(`✅ Institución: ${institution}`);
        console.log(`✅ Usuarios: ${users}`);
        console.log(`✅ Grados: ${grades}`);
        console.log(`✅ Grupos: ${groups}`);
        console.log(`✅ Cuentas contables: ${accounts}`);
        console.log(`✅ Fondos: ${funds}`);
        
        // 5. Verificar que no hay datos transaccionales
        const invoices = await prisma.invoice.count();
        const payments = await prisma.payment.count();
        const events = await prisma.event.count();
        const students = await prisma.student.count();
        const transactions = await prisma.fundTransaction.count();
        
        console.log(`\n🔍 VERIFICACIÓN DE LIMPIEZA:`);
        console.log(`❌ Facturas: ${invoices} (debe ser 0)`);
        console.log(`❌ Pagos: ${payments} (debe ser 0)`);
        console.log(`❌ Eventos: ${events} (debe ser 0)`);
        console.log(`❌ Estudiantes: ${students} (debe ser 0)`);
        console.log(`❌ Transacciones: ${transactions} (debe ser 0)`);
        
        if (invoices === 0 && payments === 0 && events === 0 && students === 0 && transactions === 0) {
            console.log('\n🎉 ¡BASE DE DATOS LIMPIA EXITOSAMENTE!');
            console.log('✅ Solo quedan datos esenciales para producción');
        } else {
            console.log('\n⚠️ Algunos datos no se eliminaron completamente');
        }
        
        console.log('\n📋 ESTADO FINAL:');
        console.log('================');
        console.log('✅ Institución configurada');
        console.log('✅ Usuarios administrativos listos');
        console.log('✅ Estructura académica preparada');
        console.log('✅ Sistema financiero inicializado');
        console.log('✅ Fondos creados (saldo $0)');
        console.log('❌ Sin estudiantes (listos para importar)');
        console.log('❌ Sin facturas (sistema limpio)');
        console.log('❌ Sin pagos (sistema limpio)');
        console.log('❌ Sin eventos (listos para crear)');
        
    } catch (error) {
        console.error('❌ Error limpiando base de datos:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    cleanProductionDatabase()
        .then(() => {
            console.log('\n✅ Limpieza completada exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { cleanProductionDatabase };