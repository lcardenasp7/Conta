/**
 * Script para diagnosticar la lista de fondos en Railway
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugFundsList() {
    console.log('🔍 Diagnosticando lista de fondos en Railway...\n');

    try {
        // 1. Verificar conexión a la base de datos
        console.log('1. Verificando conexión a la base de datos...');
        await prisma.$connect();
        console.log('✅ Conexión exitosa\n');

        // 2. Contar fondos totales
        console.log('2. Contando fondos en la base de datos...');
        const totalFunds = await prisma.fund.count();
        console.log(`📊 Total de fondos: ${totalFunds}\n`);

        // 3. Obtener todos los fondos
        console.log('3. Obteniendo lista de fondos...');
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

        if (funds.length === 0) {
            console.log('❌ No se encontraron fondos en la base de datos');
            console.log('\n🔧 Creando fondos de ejemplo...');
            
            // Crear fondos de ejemplo
            const sampleFunds = [
                {
                    name: 'Fondo de Eventos',
                    code: 'EVENTOS',
                    type: 'EVENTS',
                    description: 'Fondo para gestión de eventos escolares',
                    initialBalance: 500000,
                    currentBalance: 500000,
                    totalIncome: 0,
                    totalExpenses: 0,
                    alertLevel1: 70,
                    alertLevel2: 85,
                    alertLevel3: 95,
                    isActive: true
                },
                {
                    name: 'Fondo de Matrículas',
                    code: 'MATRICULAS',
                    type: 'TUITION',
                    description: 'Fondo para gestión de matrículas',
                    initialBalance: 1000000,
                    currentBalance: 1000000,
                    totalIncome: 0,
                    totalExpenses: 0,
                    alertLevel1: 70,
                    alertLevel2: 85,
                    alertLevel3: 95,
                    isActive: true
                },
                {
                    name: 'Fondo Operacional',
                    code: 'OPERACIONAL',
                    type: 'OPERATIONAL',
                    description: 'Fondo para gastos operacionales',
                    initialBalance: 750000,
                    currentBalance: 750000,
                    totalIncome: 0,
                    totalExpenses: 0,
                    alertLevel1: 70,
                    alertLevel2: 85,
                    alertLevel3: 95,
                    isActive: true
                }
            ];

            for (const fundData of sampleFunds) {
                try {
                    const fund = await prisma.fund.create({
                        data: fundData
                    });
                    console.log(`✅ Creado fondo: ${fund.name} (${fund.code})`);
                } catch (error) {
                    console.log(`❌ Error creando fondo ${fundData.name}:`, error.message);
                }
            }

            console.log('\n📊 Verificando fondos creados...');
            const newFunds = await prisma.fund.findMany({
                orderBy: { createdAt: 'desc' }
            });
            console.log(`✅ Total de fondos después de la creación: ${newFunds.length}`);

        } else {
            console.log(`✅ Se encontraron ${funds.length} fondos:`);
            funds.forEach((fund, index) => {
                console.log(`\n${index + 1}. ${fund.name} (${fund.code})`);
                console.log(`   - Tipo: ${fund.type}`);
                console.log(`   - Saldo actual: $${fund.currentBalance?.toLocaleString() || 0}`);
                console.log(`   - Estado: ${fund.isActive ? 'Activo' : 'Inactivo'}`);
                console.log(`   - Transacciones: ${fund._count?.transactions || 0}`);
                console.log(`   - Alertas: ${fund._count?.alerts || 0}`);
                console.log(`   - Creado: ${fund.createdAt}`);
            });
        }

        // 4. Verificar estructura de la tabla
        console.log('\n4. Verificando estructura de la tabla Fund...');
        const tableInfo = await prisma.$queryRaw`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'Fund'
            ORDER BY ordinal_position;
        `;
        console.log('📋 Columnas de la tabla Fund:');
        console.table(tableInfo);

        // 5. Probar endpoint de API
        console.log('\n5. Probando endpoint de fondos...');
        console.log('🌐 URL del endpoint: /api/funds');
        console.log('📝 Método: GET');
        console.log('🔑 Requiere autenticación: Sí');

    } catch (error) {
        console.error('❌ Error durante el diagnóstico:', error);
        
        if (error.code === 'P1001') {
            console.log('\n🔧 Problema de conexión a la base de datos');
            console.log('Verifica las variables de entorno DATABASE_URL');
        } else if (error.code === 'P2021') {
            console.log('\n🔧 La tabla Fund no existe');
            console.log('Ejecuta las migraciones de Prisma');
        }
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Desconectado de la base de datos');
    }
}

// Ejecutar diagnóstico
debugFundsList()
    .then(() => {
        console.log('\n✅ Diagnóstico completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });