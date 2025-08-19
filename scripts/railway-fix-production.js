#!/usr/bin/env node

/**
 * Script para arreglar Railway - Limpiar datos de prueba y corregir errores
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixRailwayProduction() {
    console.log('🔧 ARREGLANDO RAILWAY - LIMPIANDO DATOS DE PRUEBA');
    console.log('================================================\n');

    try {
        console.log('🧹 PASO 1: LIMPIANDO DATOS TRANSACCIONALES...');
        
        // Eliminar en orden correcto para evitar errores de FK
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
        
        await prisma.student.deleteMany({});
        console.log('✅ Estudiantes de prueba eliminados');
        
        console.log('\n💰 PASO 2: RESETEANDO FONDOS...');
        
        // Resetear todos los fondos a $0
        const funds = await prisma.fund.findMany();
        for (const fund of funds) {
            await prisma.fund.update({
                where: { id: fund.id },
                data: {
                    currentBalance: 0,
                    totalIncome: 0,
                    totalExpenses: 0,
                    balance: 0
                }
            });
            console.log(`✅ ${fund.name}: Saldo reseteado a $0`);
        }
        
        console.log('\n📊 PASO 3: VERIFICANDO ESTADO FINAL...');
        
        // Verificar conteos
        const counts = {
            students: await prisma.student.count(),
            invoices: await prisma.invoice.count(),
            payments: await prisma.payment.count(),
            events: await prisma.event.count(),
            transactions: await prisma.fundTransaction.count(),
            users: await prisma.user.count(),
            grades: await prisma.grade.count(),
            groups: await prisma.group.count(),
            funds: await prisma.fund.count(),
            accounts: await prisma.account.count()
        };
        
        console.log('📋 ESTADO ACTUAL:');
        console.log(`👥 Estudiantes: ${counts.students} (debe ser 0)`);
        console.log(`🧾 Facturas: ${counts.invoices} (debe ser 0)`);
        console.log(`💳 Pagos: ${counts.payments} (debe ser 0)`);
        console.log(`🎯 Eventos: ${counts.events} (debe ser 0)`);
        console.log(`💸 Transacciones: ${counts.transactions} (debe ser 0)`);
        console.log(`👤 Usuarios: ${counts.users} (debe ser 2)`);
        console.log(`📚 Grados: ${counts.grades}`);
        console.log(`👥 Grupos: ${counts.groups}`);
        console.log(`💰 Fondos: ${counts.funds}`);
        console.log(`📊 Cuentas: ${counts.accounts}`);
        
        // Verificar fondos
        const fundsSummary = await prisma.fund.findMany({
            select: {
                name: true,
                code: true,
                currentBalance: true,
                totalIncome: true,
                totalExpenses: true
            }
        });
        
        console.log('\n💰 ESTADO DE FONDOS:');
        fundsSummary.forEach(fund => {
            const balance = fund.currentBalance || 0;
            const income = fund.totalIncome || 0;
            const expenses = fund.totalExpenses || 0;
            console.log(`${fund.name} (${fund.code}): $${balance.toLocaleString()} (I:$${income.toLocaleString()}, G:$${expenses.toLocaleString()})`);
        });
        
        // Verificar usuarios
        const users = await prisma.user.findMany({
            select: { email: true, name: true, role: true, isActive: true }
        });
        
        console.log('\n👤 USUARIOS ADMINISTRATIVOS:');
        users.forEach(user => {
            console.log(`${user.name} (${user.email}) - ${user.role} - ${user.isActive ? 'Activo' : 'Inactivo'}`);
        });
        
        // Verificar institución
        const institution = await prisma.institution.findFirst();
        if (institution) {
            console.log(`\n🏫 INSTITUCIÓN: ${institution.name}`);
            console.log(`📧 Email: ${institution.email}`);
            console.log(`📞 Teléfono: ${institution.phone}`);
        }
        
        const isClean = counts.students === 0 && 
                       counts.invoices === 0 && 
                       counts.payments === 0 && 
                       counts.events === 0 && 
                       counts.transactions === 0;
        
        if (isClean) {
            console.log('\n🎉 ¡RAILWAY LIMPIO Y LISTO!');
            console.log('===========================');
            console.log('✅ Todos los datos de prueba eliminados');
            console.log('✅ Fondos reseteados a $0');
            console.log('✅ Sistema listo para datos reales');
            console.log('✅ Estructura institucional intacta');
            
            console.log('\n📋 PRÓXIMOS PASOS:');
            console.log('1. 👥 Importar estudiantes reales');
            console.log('2. 🎯 Crear eventos académicos reales');
            console.log('3. 🧾 Generar facturas reales');
            console.log('4. 💳 Registrar pagos reales');
            
        } else {
            console.log('\n⚠️ ALGUNOS DATOS NO SE LIMPIARON COMPLETAMENTE');
            console.log('Revisar manualmente si es necesario');
        }
        
    } catch (error) {
        console.error('❌ Error arreglando Railway:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    fixRailwayProduction()
        .then(() => {
            console.log('\n✅ Railway arreglado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { fixRailwayProduction };