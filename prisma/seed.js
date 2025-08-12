const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // 1. Create Institution
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
    console.log('✅ Institution created:', institution.name);

    // 2. Create Users
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
    console.log('✅ Rector user created:', rector.name);

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
    console.log('✅ Auxiliary accountant created:', auxiliary.name);

    // 3. Create Grades
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

        // Create groups for each grade with numeric format
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
    console.log('✅ Grades and groups created');

    // 4. Create Chart of Accounts (Colombian standard)
    const accounts = [
        // ACTIVOS (1)
        { code: '1', name: 'ACTIVOS', type: 'ASSET', category: 'PRINCIPAL' },
        { code: '11', name: 'DISPONIBLE', type: 'ASSET', category: 'GRUPO', parent: '1' },
        { code: '1105', name: 'Caja', type: 'ASSET', category: 'CUENTA', parent: '11' },
        { code: '1110', name: 'Bancos', type: 'ASSET', category: 'CUENTA', parent: '11' },
        { code: '1120', name: 'Cuentas de Ahorro', type: 'ASSET', category: 'CUENTA', parent: '11' },

        { code: '13', name: 'DEUDORES', type: 'ASSET', category: 'GRUPO', parent: '1' },
        { code: '1305', name: 'Cuentas por Cobrar Estudiantes', type: 'ASSET', category: 'CUENTA', parent: '13' },
        { code: '1330', name: 'Anticipos y Avances', type: 'ASSET', category: 'CUENTA', parent: '13' },

        { code: '15', name: 'PROPIEDADES PLANTA Y EQUIPO', type: 'ASSET', category: 'GRUPO', parent: '1' },
        { code: '1504', name: 'Terrenos', type: 'ASSET', category: 'CUENTA', parent: '15' },
        { code: '1516', name: 'Construcciones y Edificaciones', type: 'ASSET', category: 'CUENTA', parent: '15' },
        { code: '1520', name: 'Maquinaria y Equipo', type: 'ASSET', category: 'CUENTA', parent: '15' },
        { code: '1524', name: 'Equipo de Oficina', type: 'ASSET', category: 'CUENTA', parent: '15' },
        { code: '1528', name: 'Equipo de Computación', type: 'ASSET', category: 'CUENTA', parent: '15' },

        // PASIVOS (2)
        { code: '2', name: 'PASIVOS', type: 'LIABILITY', category: 'PRINCIPAL' },
        { code: '21', name: 'OBLIGACIONES FINANCIERAS', type: 'LIABILITY', category: 'GRUPO', parent: '2' },
        { code: '2105', name: 'Bancos Nacionales', type: 'LIABILITY', category: 'CUENTA', parent: '21' },

        { code: '23', name: 'CUENTAS POR PAGAR', type: 'LIABILITY', category: 'GRUPO', parent: '2' },
        { code: '2335', name: 'Costos y Gastos por Pagar', type: 'LIABILITY', category: 'CUENTA', parent: '23' },
        { code: '2365', name: 'Retención en la Fuente', type: 'LIABILITY', category: 'CUENTA', parent: '23' },
        { code: '2370', name: 'Retenciones y Aportes de Nómina', type: 'LIABILITY', category: 'CUENTA', parent: '23' },

        { code: '25', name: 'OBLIGACIONES LABORALES', type: 'LIABILITY', category: 'GRUPO', parent: '2' },
        { code: '2505', name: 'Salarios por Pagar', type: 'LIABILITY', category: 'CUENTA', parent: '25' },
        { code: '2510', name: 'Cesantías Consolidadas', type: 'LIABILITY', category: 'CUENTA', parent: '25' },

        // PATRIMONIO (3)
        { code: '3', name: 'PATRIMONIO', type: 'EQUITY', category: 'PRINCIPAL' },
        { code: '31', name: 'CAPITAL SOCIAL', type: 'EQUITY', category: 'GRUPO', parent: '3' },
        { code: '3105', name: 'Capital Institucional', type: 'EQUITY', category: 'CUENTA', parent: '31' },

        { code: '36', name: 'RESULTADOS DEL EJERCICIO', type: 'EQUITY', category: 'GRUPO', parent: '3' },
        { code: '3605', name: 'Utilidad del Ejercicio', type: 'EQUITY', category: 'CUENTA', parent: '36' },
        { code: '3610', name: 'Pérdida del Ejercicio', type: 'EQUITY', category: 'CUENTA', parent: '36' },

        // INGRESOS (4)
        { code: '4', name: 'INGRESOS', type: 'INCOME', category: 'PRINCIPAL' },
        { code: '41', name: 'OPERACIONALES', type: 'INCOME', category: 'GRUPO', parent: '4' },
        { code: '4105', name: 'Ingresos por Matrículas', type: 'INCOME', category: 'CUENTA', parent: '41' },
        { code: '4110', name: 'Ingresos por Mensualidades', type: 'INCOME', category: 'CUENTA', parent: '41' },
        { code: '4115', name: 'Ingresos por Eventos', type: 'INCOME', category: 'CUENTA', parent: '41' },
        { code: '4120', name: 'Otros Servicios Educativos', type: 'INCOME', category: 'CUENTA', parent: '41' },

        { code: '42', name: 'NO OPERACIONALES', type: 'INCOME', category: 'GRUPO', parent: '4' },
        { code: '4210', name: 'Financieros', type: 'INCOME', category: 'CUENTA', parent: '42' },
        { code: '4250', name: 'Recuperaciones', type: 'INCOME', category: 'CUENTA', parent: '42' },
        { code: '4295', name: 'Diversos', type: 'INCOME', category: 'CUENTA', parent: '42' },

        // GASTOS (5)
        { code: '5', name: 'GASTOS', type: 'EXPENSE', category: 'PRINCIPAL' },
        { code: '51', name: 'OPERACIONALES DE ADMINISTRACIÓN', type: 'EXPENSE', category: 'GRUPO', parent: '5' },
        { code: '5105', name: 'Gastos de Personal', type: 'EXPENSE', category: 'CUENTA', parent: '51' },
        { code: '5110', name: 'Honorarios', type: 'EXPENSE', category: 'CUENTA', parent: '51' },
        { code: '5115', name: 'Impuestos', type: 'EXPENSE', category: 'CUENTA', parent: '51' },
        { code: '5120', name: 'Arrendamientos', type: 'EXPENSE', category: 'CUENTA', parent: '51' },
        { code: '5135', name: 'Servicios', type: 'EXPENSE', category: 'CUENTA', parent: '51' },
        { code: '5140', name: 'Gastos Legales', type: 'EXPENSE', category: 'CUENTA', parent: '51' },
        { code: '5195', name: 'Diversos', type: 'EXPENSE', category: 'CUENTA', parent: '51' },

        { code: '53', name: 'NO OPERACIONALES', type: 'EXPENSE', category: 'GRUPO', parent: '5' },
        { code: '5305', name: 'Financieros', type: 'EXPENSE', category: 'CUENTA', parent: '53' },
        { code: '5395', name: 'Gastos Extraordinarios', type: 'EXPENSE', category: 'CUENTA', parent: '53' }
    ];

    // Create accounts in order (parents first)
    const accountMap = new Map();

    // First pass: create principal accounts (no parent)
    for (const accountData of accounts.filter(acc => !acc.parent)) {
        const account = await prisma.account.upsert({
            where: { code: accountData.code },
            update: {},
            create: {
                code: accountData.code,
                name: accountData.name,
                type: accountData.type,
                category: accountData.category
            }
        });
        accountMap.set(accountData.code, account.id);
    }

    // Second pass: create group accounts (with principal parents)
    for (const accountData of accounts.filter(acc => acc.parent && accounts.find(p => p.code === acc.parent && !p.parent))) {
        const account = await prisma.account.upsert({
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
        accountMap.set(accountData.code, account.id);
    }

    // Third pass: create cuenta accounts (with group parents)
    for (const accountData of accounts.filter(acc => acc.parent && accounts.find(p => p.code === acc.parent && p.parent))) {
        const account = await prisma.account.upsert({
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
        accountMap.set(accountData.code, account.id);
    }

    console.log('✅ Chart of accounts created');

    // 5. Create Academic Year (commented out - model doesn't exist yet)
    // const currentYear = new Date().getFullYear();
    // const academicYear = await prisma.academicYear.upsert({
    //     where: { year: currentYear },
    //     update: {},
    //     create: {
    //         year: currentYear,
    //         startDate: new Date(`${currentYear}-02-01`),
    //         endDate: new Date(`${currentYear}-11-30`),
    //         isActive: true
    //     }
    // });
    // console.log('✅ Academic year created:', academicYear.year);

    console.log('🎉 Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });