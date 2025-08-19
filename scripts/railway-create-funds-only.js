#!/usr/bin/env node

/**
 * Script para crear solo los fondos institucionales en Railway
 * Sin datos de prueba, solo estructura
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createFundsOnly() {
    console.log('💰 CREANDO FONDOS INSTITUCIONALES EN RAILWAY');
    console.log('============================================\n');

    try {
        const currentYear = new Date().getFullYear();

        // Crear fondos principales (solo estructura, sin dinero)
        const fundsData = [
            {
                name: `Matrículas ${currentYear}`,
                code: `MAT${currentYear}`,
                type: 'TUITION',
                description: `Fondos generados por matrículas del año académico ${currentYear}`,
                academicYear: currentYear,
                currentBalance: 0,
                totalIncome: 0,
                totalExpenses: 0,
                balance: 0
            },
            {
                name: `Mensualidades ${currentYear}`,
                code: `MEN${currentYear}`,
                type: 'MONTHLY_FEES',
                description: `Fondos generados por mensualidades del año académico ${currentYear}`,
                academicYear: currentYear,
                currentBalance: 0,
                totalIncome: 0,
                totalExpenses: 0,
                balance: 0
            },
            {
                name: `Eventos Escolares ${currentYear}`,
                code: `EVE${currentYear}`,
                type: 'EVENTS',
                description: 'Fondos generados por eventos escolares (rifas, bingos, festivales)',
                academicYear: currentYear,
                currentBalance: 0,
                totalIncome: 0,
                totalExpenses: 0,
                balance: 0
            },
            {
                name: `Fondo Operacional ${currentYear}`,
                code: `OPE${currentYear}`,
                type: 'OPERATIONAL',
                description: 'Fondo para gastos operacionales de la institución',
                academicYear: currentYear,
                currentBalance: 0,
                totalIncome: 0,
                totalExpenses: 0,
                balance: 0
            },
            {
                name: 'Fondo de Emergencia',
                code: `EME${currentYear}`,
                type: 'EMERGENCY',
                description: 'Fondo de reserva para situaciones de emergencia',
                academicYear: currentYear,
                currentBalance: 0,
                totalIncome: 0,
                totalExpenses: 0,
                balance: 0
            },
            {
                name: `Fondos Externos ${currentYear}`,
                code: `EXT${currentYear}`,
                type: 'EXTERNAL',
                description: 'Fondos provenientes de donaciones y aportes externos',
                academicYear: currentYear,
                currentBalance: 0,
                totalIncome: 0,
                totalExpenses: 0,
                balance: 0
            }
        ];

        console.log('💰 Creando fondos institucionales...');
        
        const createdFunds = [];
        for (const fundData of fundsData) {
            try {
                const fund = await prisma.fund.create({
                    data: fundData
                });
                createdFunds.push(fund);
                console.log(`✅ ${fund.name} (${fund.code}): $${fund.currentBalance.toLocaleString()}`);
            } catch (error) {
                if (error.code === 'P2002') {
                    console.log(`⚠️ Fondo ${fundData.name} ya existe`);
                } else {
                    console.error(`❌ Error creando fondo ${fundData.name}:`, error.message);
                }
            }
        }

        console.log('\n📊 RESUMEN DE FONDOS CREADOS:');
        console.log('============================');
        
        const allFunds = await prisma.fund.findMany({
            select: {
                name: true,
                code: true,
                type: true,
                currentBalance: true,
                totalIncome: true,
                totalExpenses: true,
                description: true
            }
        });

        allFunds.forEach(fund => {
            console.log(`💰 ${fund.name} (${fund.code})`);
            console.log(`   Tipo: ${fund.type}`);
            console.log(`   Saldo: $${fund.currentBalance.toLocaleString()}`);
            console.log(`   Descripción: ${fund.description}`);
            console.log('');
        });

        console.log('🎉 ¡FONDOS INSTITUCIONALES CREADOS EXITOSAMENTE!');
        console.log('===============================================');
        console.log(`✅ Total de fondos: ${allFunds.length}`);
        console.log('✅ Todos los fondos tienen saldo $0');
        console.log('✅ Listos para recibir transacciones reales');
        console.log('✅ Sin datos de prueba o simulados');

        console.log('\n📋 PRÓXIMOS PASOS:');
        console.log('==================');
        console.log('1. 👥 Importar estudiantes reales');
        console.log('2. 🧾 Generar facturas reales');
        console.log('3. 💳 Registrar pagos reales');
        console.log('4. 🎯 Crear eventos académicos');
        console.log('5. 💸 Realizar transacciones entre fondos');

    } catch (error) {
        console.error('❌ Error creando fondos:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    createFundsOnly()
        .then(() => {
            console.log('\n✅ Fondos creados exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { createFundsOnly };