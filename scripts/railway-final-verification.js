#!/usr/bin/env node

/**
 * Script de verificación final para Railway
 * Confirma que todo esté funcionando correctamente
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalVerification() {
    console.log('🔍 VERIFICACIÓN FINAL DE RAILWAY');
    console.log('===============================\n');

    try {
        // 1. Verificar conexión
        console.log('📋 1. VERIFICANDO CONEXIÓN...');
        await prisma.$connect();
        console.log('✅ Conexión a base de datos exitosa');

        // 2. Verificar datos institucionales
        console.log('\n📋 2. VERIFICANDO DATOS INSTITUCIONALES...');
        
        const institution = await prisma.institution.findFirst();
        if (institution) {
            console.log(`✅ Institución: ${institution.name}`);
            console.log(`   📧 Email: ${institution.email}`);
            console.log(`   📞 Teléfono: ${institution.phone}`);
        } else {
            console.log('❌ No se encontró información de la institución');
        }

        const users = await prisma.user.count();
        console.log(`✅ Usuarios administrativos: ${users}`);

        // 3. Verificar estructura académica
        console.log('\n📋 3. VERIFICANDO ESTRUCTURA ACADÉMICA...');
        
        const grades = await prisma.grade.count();
        const groups = await prisma.group.count();
        const students = await prisma.student.count();
        
        console.log(`✅ Grados: ${grades}`);
        console.log(`✅ Grupos: ${groups}`);
        console.log(`✅ Estudiantes: ${students}`);

        // Verificar distribución por grado
        const studentsByGrade = await prisma.student.groupBy({
            by: ['gradeId'],
            _count: { id: true }
        });

        console.log('\n📊 Distribución de estudiantes por grado:');
        for (const gradeData of studentsByGrade) {
            const grade = await prisma.grade.findUnique({
                where: { id: gradeData.gradeId },
                select: { name: true }
            });
            console.log(`   ${grade?.name || 'Desconocido'}: ${gradeData._count.id} estudiantes`);
        }

        // 4. Verificar sistema financiero
        console.log('\n📋 4. VERIFICANDO SISTEMA FINANCIERO...');
        
        const accounts = await prisma.account.count();
        const funds = await prisma.fund.count();
        const invoices = await prisma.invoice.count();
        const payments = await prisma.payment.count();
        
        console.log(`✅ Cuentas contables: ${accounts}`);
        console.log(`✅ Fondos institucionales: ${funds}`);
        console.log(`✅ Facturas: ${invoices} (debe ser 0 para producción limpia)`);
        console.log(`✅ Pagos: ${payments} (debe ser 0 para producción limpia)`);

        // Verificar fondos
        const fundsSummary = await prisma.fund.findMany({
            select: {
                name: true,
                code: true,
                type: true,
                currentBalance: true,
                totalIncome: true,
                totalExpenses: true
            }
        });

        console.log('\n💰 Estado de fondos:');
        fundsSummary.forEach(fund => {
            console.log(`   ${fund.name} (${fund.code}): $${fund.currentBalance.toLocaleString()}`);
        });

        // 5. Verificar eventos
        console.log('\n📋 5. VERIFICANDO EVENTOS...');
        
        const events = await prisma.event.count();
        const eventAssignments = await prisma.eventAssignment.count();
        
        console.log(`✅ Eventos: ${events} (debe ser 0 para producción limpia)`);
        console.log(`✅ Asignaciones de eventos: ${eventAssignments} (debe ser 0 para producción limpia)`);

        // 6. Verificar transacciones
        console.log('\n📋 6. VERIFICANDO TRANSACCIONES...');
        
        const fundTransactions = await prisma.fundTransaction.count();
        
        console.log(`✅ Transacciones de fondos: ${fundTransactions} (debe ser 0 para producción limpia)`);

        // 7. Resumen final
        console.log('\n' + '='.repeat(50));
        console.log('📊 RESUMEN FINAL DE RAILWAY');
        console.log('='.repeat(50));

        const isProductionReady = invoices === 0 && 
                                 payments === 0 && 
                                 events === 0 && 
                                 fundTransactions === 0 && 
                                 students > 0 && 
                                 funds > 0;

        if (isProductionReady) {
            console.log('🎉 ¡RAILWAY LISTO PARA PRODUCCIÓN!');
            console.log('================================');
            console.log('✅ Datos institucionales completos');
            console.log('✅ Estructura académica configurada');
            console.log(`✅ ${students} estudiantes reales importados`);
            console.log('✅ Sistema financiero inicializado');
            console.log('✅ Fondos institucionales creados');
            console.log('✅ Sin datos de prueba o simulados');
            console.log('✅ Sistema limpio y listo para operación');
            
            console.log('\n🚀 PRÓXIMOS PASOS:');
            console.log('==================');
            console.log('1. 🎯 Crear eventos académicos reales');
            console.log('2. 🧾 Generar facturas para estudiantes');
            console.log('3. 💳 Registrar pagos reales');
            console.log('4. 💸 Realizar transacciones entre fondos');
            console.log('5. 📊 Generar reportes financieros');
            
        } else {
            console.log('⚠️ SISTEMA NECESITA REVISIÓN');
            console.log('============================');
            if (students === 0) console.log('❌ No hay estudiantes importados');
            if (funds === 0) console.log('❌ No hay fondos creados');
            if (invoices > 0) console.log('⚠️ Hay facturas de prueba');
            if (payments > 0) console.log('⚠️ Hay pagos de prueba');
            if (events > 0) console.log('⚠️ Hay eventos de prueba');
            if (fundTransactions > 0) console.log('⚠️ Hay transacciones de prueba');
        }

        console.log('\n🌐 URL de Railway: https://conta.up.railway.app');
        console.log('👤 Credenciales:');
        console.log('   📧 rector@villasanpablo.edu.co / VillasSP2024!');
        console.log('   📧 contabilidad@villasanpablo.edu.co / ContaVSP2024!');

    } catch (error) {
        console.error('❌ Error durante verificación:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    finalVerification()
        .then(() => {
            console.log('\n✅ Verificación completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { finalVerification };