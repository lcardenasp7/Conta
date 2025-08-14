#!/usr/bin/env node

/**
 * Railway Production Seed
 * Solo datos esenciales para producción - sin datos de prueba
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Inicializando base de datos de producción...');

    // 1. Crear Institución
    const institution = await prisma.institution.upsert({
        where: { nit: '901.079.125-0' },
        update: {},
        create: {
            name: 'Institución Educativa Distrital Villas de San Pablo',
            nit: '901.079.125-0',
            address: 'Diagonal 136 Nº 9D-60, Barrio Villas de San Pablo',
            city: 'Barranquilla',
            state: 'Atlántico',
            locality: 'Occidental',
            phone: '313 537 40 16',
            email: 'yasminricodc@gmail.com',
            dane: '108001800065',
            resolution: '06584 de 23 junio de 2017',
            levels: 'Preescolar, Básica Primaria, Básica Secundaria y Media',
            title: 'Bachiller Académico',
            calendar: 'A',
            schedule: 'Única'
        }
    });
    console.log('✅ Institución creada:', institution.name);

    // 2. Crear Usuarios Administrativos
    const hashedPasswordRector = await bcrypt.hash('VillasSP2024!', 10);
    const hashedPasswordAux = await bcrypt.hash('ContaVSP2024!', 10);

    const rector = await prisma.user.upsert({
        where: { email: 'rector@villasanpablo.edu.co' },
        update: {},
        create: {
            email: 'rector@villasanpablo.edu.co',
            password: hashedPasswordRector,
            name: 'Yasmin Rico',
            role: 'RECTOR',
            isActive: true,
            isVerified: true
        }
    });
    console.log('✅ Usuario rector creado:', rector.name);

    const auxiliary = await prisma.user.upsert({
        where: { email: 'contabilidad@villasanpablo.edu.co' },
        update: {},
        create: {
            email: 'contabilidad@villasanpablo.edu.co',
            password: hashedPasswordAux,
            name: 'Auxiliar Contable',
            role: 'AUXILIARY_ACCOUNTANT',
            isActive: true,
            isVerified: true
        }
    });
    console.log('✅ Usuario auxiliar contable creado:', auxiliary.name);

    // 3. Crear Grados y Grupos
    const grades = [
        { name: 'Preescolar', level: 'PREESCOLAR', order: 0 },
        { name: 'Primero', level: 'PRIMARIA', order: 1 },
        { name: 'Segundo', level: 'PRIMARIA', order: 2 },
        { name: 'Tercero', level: 'PRIMARIA', order: 3 },
        { name: 'Cuarto', level: 'PRIMARIA', order: 4 },
        { name: 'Quinto', level: 'PRIMARIA', order: 5 },
        { name: 'Sexto', level: 'SECUNDARIA', order: 6 },
        { name: 'Séptimo', level: 'SECUNDARIA', order: 7 },
        { name: 'Octavo', level: 'SECUNDARIA', order: 8 },
        { name: 'Noveno', level: 'SECUNDARIA', order: 9 },
        { name: 'Décimo', level: 'MEDIA', order: 10 },
        { name: 'Undécimo', level: 'MEDIA', order: 11 }
    ];

    for (const gradeData of grades) {
        const grade = await prisma.grade.create({
            data: gradeData
        });

        // Crear grupos para cada grado
        const groups = ['01', '02', '03', '04', '05', '06'];
        for (const groupName of groups) {
            await prisma.group.create({
                data: {
                    name: groupName,
                    gradeId: grade.id,
                    year: new Date().getFullYear(),
                    capacity: 30
                }
            });
        }
    }
    console.log('✅ Grados y grupos creados');

    // 4. Plan de Cuentas Básico (solo cuentas principales)
    const accounts = [
        // ACTIVOS
        { code: '1', name: 'ACTIVOS', type: 'ASSET', category: 'PRINCIPAL' },
        { code: '11', name: 'DISPONIBLE', type: 'ASSET', category: 'GRUPO', parent: '1' },
        { code: '1105', name: 'Caja', type: 'ASSET', category: 'CUENTA', parent: '11' },
        { code: '1110', name: 'Bancos', type: 'ASSET', category: 'CUENTA', parent: '11' },
        
        { code: '13', name: 'DEUDORES', type: 'ASSET', category: 'GRUPO', parent: '1' },
        { code: '1305', name: 'Cuentas por Cobrar Estudiantes', type: 'ASSET', category: 'CUENTA', parent: '13' },

        // PASIVOS
        { code: '2', name: 'PASIVOS', type: 'LIABILITY', category: 'PRINCIPAL' },
        { code: '23', name: 'CUENTAS POR PAGAR', type: 'LIABILITY', category: 'GRUPO', parent: '2' },
        { code: '2335', name: 'Costos y Gastos por Pagar', type: 'LIABILITY', category: 'CUENTA', parent: '23' },

        // PATRIMONIO
        { code: '3', name: 'PATRIMONIO', type: 'EQUITY', category: 'PRINCIPAL' },
        { code: '31', name: 'CAPITAL SOCIAL', type: 'EQUITY', category: 'GRUPO', parent: '3' },
        { code: '3105', name: 'Capital Institucional', type: 'EQUITY', category: 'CUENTA', parent: '31' },

        // INGRESOS
        { code: '4', name: 'INGRESOS', type: 'INCOME', category: 'PRINCIPAL' },
        { code: '41', name: 'OPERACIONALES', type: 'INCOME', category: 'GRUPO', parent: '4' },
        { code: '4105', name: 'Ingresos por Matrículas', type: 'INCOME', category: 'CUENTA', parent: '41' },
        { code: '4110', name: 'Ingresos por Mensualidades', type: 'INCOME', category: 'CUENTA', parent: '41' },
        { code: '4115', name: 'Ingresos por Eventos', type: 'INCOME', category: 'CUENTA', parent: '41' },

        // GASTOS
        { code: '5', name: 'GASTOS', type: 'EXPENSE', category: 'PRINCIPAL' },
        { code: '51', name: 'OPERACIONALES DE ADMINISTRACIÓN', type: 'EXPENSE', category: 'GRUPO', parent: '5' },
        { code: '5105', name: 'Gastos de Personal', type: 'EXPENSE', category: 'CUENTA', parent: '51' },
        { code: '5135', name: 'Servicios', type: 'EXPENSE', category: 'CUENTA', parent: '51' }
    ];

    // Crear cuentas en orden
    for (const accountData of accounts.filter(acc => !acc.parent)) {
        await prisma.account.upsert({
            where: { code: accountData.code },
            update: {},
            create: {
                code: accountData.code,
                name: accountData.name,
                type: accountData.type,
                category: accountData.category
            }
        });
    }

    for (const accountData of accounts.filter(acc => acc.parent && accounts.find(p => p.code === acc.parent && !p.parent))) {
        await prisma.account.upsert({
            where: { code: accountData.code },
            update: {},
            create: {
                code: accountData.code,
                name: accountData.name,
                type: accountData.type,
                category: accountData.category,
                parent: accountData.parent
            }
        });
    }

    for (const accountData of accounts.filter(acc => acc.parent && accounts.find(p => p.code === acc.parent && p.parent))) {
        await prisma.account.upsert({
            where: { code: accountData.code },
            update: {},
            create: {
                code: accountData.code,
                name: accountData.name,
                type: accountData.type,
                category: accountData.category,
                parent: accountData.parent
            }
        });
    }

    console.log('✅ Plan de cuentas básico creado');

    // 5. Importar estudiantes reales (si existe el archivo)
    try {
        const studentsScript = require('./import-students-villas.js');
        console.log('📚 Importando estudiantes...');
        // El script de importación se ejecutará por separado
        console.log('ℹ️  Para importar estudiantes, ejecuta: npm run import:students');
    } catch (error) {
        console.log('ℹ️  Script de importación de estudiantes no encontrado');
    }

    console.log('\n🎉 ¡Base de datos de producción inicializada!');
    console.log('\n👤 Credenciales de acceso:');
    console.log('   📧 rector@villasanpablo.edu.co');
    console.log('   🔑 VillasSP2024!');
    console.log('');
    console.log('   📧 contabilidad@villasanpablo.edu.co');
    console.log('   🔑 ContaVSP2024!');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Importar estudiantes reales');
    console.log('   2. Configurar eventos académicos');
    console.log('   3. Comenzar operación normal');
}

main()
    .catch((e) => {
        console.error('❌ Error inicializando base de datos:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });