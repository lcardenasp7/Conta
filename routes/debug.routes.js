/**
 * Rutas de debug para Railway
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

console.log('🔧 Cargando rutas de debug...');

// GET /api/debug/funds - Diagnosticar fondos
router.get('/funds', authenticateToken, async (req, res) => {
    try {
        console.log('🔍 Iniciando diagnóstico de fondos...');

        // 1. Contar fondos totales
        const totalFunds = await prisma.fund.count();
        console.log(`📊 Total de fondos: ${totalFunds}`);

        // 2. Obtener todos los fondos
        const funds = await prisma.fund.findMany({
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

        // 3. Si no hay fondos, crear algunos de ejemplo
        if (funds.length === 0) {
            console.log('❌ No se encontraron fondos, creando fondos de ejemplo...');
            
            const sampleFunds = [
                {
                    name: 'Fondo de Eventos Escolares',
                    code: 'EVE2025',
                    type: 'EVENTS',
                    description: 'Fondo destinado a la organización de eventos escolares',
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
                    name: 'Fondo de Matrículas',
                    code: 'MAT2025',
                    type: 'TUITION',
                    description: 'Fondo para el manejo de matrículas',
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
                    name: 'Fondo Operacional',
                    code: 'OPE2025',
                    type: 'OPERATIONAL',
                    description: 'Fondo para gastos operacionales',
                    initialBalance: 1200000,
                    currentBalance: 1200000,
                    totalIncome: 0,
                    totalExpenses: 0,
                    alertLevel1: 75,
                    alertLevel2: 88,
                    alertLevel3: 95,
                    isActive: true,
                    academicYear: 2025
                }
            ];

            const createdFunds = [];
            for (const fundData of sampleFunds) {
                try {
                    const fund = await prisma.fund.create({
                        data: fundData
                    });
                    createdFunds.push(fund);
                    console.log(`✅ Creado fondo: ${fund.name}`);
                } catch (error) {
                    console.log(`❌ Error creando fondo ${fundData.name}:`, error.message);
                }
            }

            // Obtener fondos actualizados
            const updatedFunds = await prisma.fund.findMany({
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

            res.json({
                success: true,
                message: 'Fondos de ejemplo creados exitosamente',
                data: {
                    totalFunds: updatedFunds.length,
                    fundsCreated: createdFunds.length,
                    funds: updatedFunds
                }
            });

        } else {
            console.log(`✅ Se encontraron ${funds.length} fondos`);
            
            res.json({
                success: true,
                message: 'Fondos encontrados en la base de datos',
                data: {
                    totalFunds: funds.length,
                    funds: funds
                }
            });
        }

    } catch (error) {
        console.error('❌ Error en diagnóstico de fondos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al diagnosticar fondos',
            details: error.message
        });
    }
});

// GET /api/debug/database - Verificar conexión a la base de datos
router.get('/database', authenticateToken, async (req, res) => {
    try {
        console.log('🔍 Verificando conexión a la base de datos...');

        // Probar conexión
        await prisma.$connect();
        
        // Obtener información de la base de datos
        const result = await prisma.$queryRaw`SELECT version() as version`;
        
        res.json({
            success: true,
            message: 'Conexión a la base de datos exitosa',
            data: {
                connected: true,
                version: result[0]?.version || 'Unknown',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error de conexión a la base de datos:', error);
        res.status(500).json({
            success: false,
            error: 'Error de conexión a la base de datos',
            details: error.message
        });
    }
});

// POST /api/debug/create-sample-funds - Crear fondos de ejemplo
router.post('/create-sample-funds', authenticateToken, async (req, res) => {
    try {
        console.log('🏗️ Creando fondos de ejemplo...');

        // Limpiar fondos existentes si se solicita
        if (req.body.clearExisting) {
            const deleted = await prisma.fund.deleteMany({});
            console.log(`🗑️ Eliminados ${deleted.count} fondos existentes`);
        }

        const sampleFunds = [
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
        for (const fundData of sampleFunds) {
            try {
                const fund = await prisma.fund.create({
                    data: fundData
                });
                createdFunds.push(fund);
                console.log(`✅ Creado: ${fund.name}`);
            } catch (error) {
                console.log(`❌ Error creando ${fundData.name}:`, error.message);
            }
        }

        res.json({
            success: true,
            message: `${createdFunds.length} fondos de ejemplo creados exitosamente`,
            data: {
                fundsCreated: createdFunds.length,
                funds: createdFunds
            }
        });

    } catch (error) {
        console.error('❌ Error creando fondos de ejemplo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear fondos de ejemplo',
            details: error.message
        });
    }
});

console.log('✅ Rutas de debug cargadas correctamente');

module.exports = router;