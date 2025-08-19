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
        { name: 'Jardín', level: 'PREESCOLAR', order: 0 },
        { name: 'Transición', level: 'PREESCOLAR', order: 1 },
        { name: 'Primero', level: 'PRIMARIA', order: 2 },
        { name: 'Segundo', level: 'PRIMARIA', order: 3 },
        { name: 'Tercero', level: 'PRIMARIA', order: 4 },
        { name: 'Cuarto', level: 'PRIMARIA', order: 5 },
        { name: 'Quinto', level: 'PRIMARIA', order: 6 },
        { name: 'Sexto', level: 'SECUNDARIA', order: 7 },
        { name: 'Séptimo', level: 'SECUNDARIA', order: 8 },
        { name: 'Octavo', level: 'SECUNDARIA', order: 9 },
        { name: 'Noveno', level: 'SECUNDARIA', order: 10 },
        { name: 'Décimo', level: 'MEDIA', order: 11 },
        { name: 'Undécimo', level: 'MEDIA', order: 12 },
        { name: 'Brújula', level: 'OTRO', order: 13 },
        { name: 'Aceleración', level: 'OTRO', order: 14 },
        { name: 'Ciclo 3', level: 'CICLO', order: 15 },
        { name: 'Ciclo 4', level: 'CICLO', order: 16 },
        { name: 'Ciclo 5', level: 'CICLO', order: 17 },
        { name: 'Ciclo 6', level: 'CICLO', order: 18 }
    ];

    const createdGrades = [];
    for (const gradeData of grades) {
        const grade = await prisma.grade.create({
            data: gradeData
        });
        createdGrades.push(grade);

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

    // ==========================================
    // 🆕 NUEVO: SISTEMA DE FONDOS
    // ==========================================

    // 5. Create Fund System
    const currentYear = new Date().getFullYear();

    // Crear fondos principales
    const fundsData = [
        {
            name: `Matrículas ${currentYear}`,
            code: `MAT${currentYear}`,
            type: 'TUITION',
            description: `Fondos generados por matrículas del año académico ${currentYear}`,
            academicYear: currentYear
        },
        {
            name: `Mensualidades ${currentYear}`,
            code: `MEN${currentYear}`,
            type: 'MONTHLY_FEES',
            description: `Fondos generados por mensualidades del año académico ${currentYear}`,
            academicYear: currentYear
        },
        {
            name: `Eventos Escolares ${currentYear}`,
            code: `EVE${currentYear}`,
            type: 'EVENTS',
            description: 'Fondos generados por eventos escolares (rifas, bingos, festivales)',
            academicYear: currentYear
        },
        {
            name: `Fondo Operacional ${currentYear}`,
            code: `OPE${currentYear}`,
            type: 'OPERATIONAL',
            description: 'Fondo para gastos operacionales de la institución',
            academicYear: currentYear
        },
        {
            name: 'Fondo de Emergencia',
            code: `EME${currentYear}`,
            type: 'EMERGENCY',
            description: 'Fondo de reserva para situaciones de emergencia',
            academicYear: currentYear
        },
        {
            name: `Fondos Externos ${currentYear}`,
            code: `EXT${currentYear}`,
            type: 'EXTERNAL',
            description: 'Fondos provenientes de donaciones y aportes externos',
            academicYear: currentYear
        }
    ];

    const createdFunds = [];
    for (const fundData of fundsData) {
        const fund = await prisma.fund.create({
            data: fundData
        });
        createdFunds.push(fund);
        console.log(`✅ Fund created: ${fund.name}`);
    }

    // 6. Create sample students (30 students for testing)
    const allGroups = await prisma.group.findMany({
        include: { grade: true }
    });

    const sampleStudents = [];
    let studentCounter = 1;

    // Crear 30 estudiantes distribuidos en diferentes grados
    for (let i = 0; i < 30; i++) {
        const randomGroup = allGroups[Math.floor(Math.random() * allGroups.length)];
        
        const student = await prisma.student.create({
            data: {
                documentType: 'TI',
                document: `${1000000000 + studentCounter}`,
                firstName: `Estudiante${studentCounter}`,
                lastName: `Apellido${studentCounter}`,
                birthDate: new Date(2010 + Math.floor(Math.random() * 5), 
                                  Math.floor(Math.random() * 12), 
                                  Math.floor(Math.random() * 28) + 1),
                gender: studentCounter % 2 === 0 ? 'M' : 'F',
                email: `estudiante${studentCounter}@villasanpablo.edu.co`,
                phone: `300${String(studentCounter).padStart(7, '0')}`,
                address: `Dirección ${studentCounter}, Villas de San Pablo`,
                gradeId: randomGroup.gradeId,
                groupId: randomGroup.id,
                guardianName: `Acudiente ${studentCounter}`,
                guardianPhone: `310${String(studentCounter).padStart(7, '0')}`,
                status: 'ACTIVE',
                enrollmentDate: new Date(`${currentYear}-02-01`)
            }
        });
        
        sampleStudents.push(student);
        studentCounter++;
    }
    console.log(`✅ Created ${sampleStudents.length} sample students`);

    // 7. Create sample events
    const eventsData = [
        {
            name: 'Gran Rifa Navideña 2024',
            type: 'RAFFLE',
            description: 'Rifa benéfica para recaudar fondos para mejoras en la institución',
            eventDate: new Date(`${currentYear}-12-15T14:00:00`),
            location: 'Patio Principal',
            ticketPrice: 5000,
            fundraisingGoal: 2000000,
            responsible: 'Coordinador de Eventos',
            responsibleId: rector.id,
            status: 'PLANNING',
            assignmentType: 'BY_GRADE'
        },
        {
            name: 'Bingo Familiar',
            type: 'BINGO',
            description: 'Noche de bingo familiar para recaudar fondos',
            eventDate: new Date(`${currentYear}-09-20T18:00:00`),
            location: 'Salón de Actos',
            ticketPrice: 3000,
            fundraisingGoal: 1500000,
            responsible: 'Coordinador de Eventos',
            responsibleId: auxiliary.id,
            status: 'ACTIVE',
            assignmentType: 'MIXED'
        },
        {
            name: 'Festival Cultural Villas de San Pablo',
            type: 'CULTURAL',
            description: 'Festival anual de cultura y artes',
            eventDate: new Date(`${currentYear}-10-31T09:00:00`),
            location: 'Todas las instalaciones',
            ticketPrice: 0,
            fundraisingGoal: 500000,
            responsible: 'Coordinador Cultural',
            responsibleId: rector.id,
            status: 'PLANNING',
            assignmentType: 'BY_GRADE'
        }
    ];

    const eventsFund = createdFunds.find(f => f.type === 'EVENTS');
    
    for (const eventData of eventsData) {
        const event = await prisma.event.create({
            data: {
                ...eventData,
                fundId: eventsFund.id
            }
        });
        console.log(`✅ Event created: ${event.name}`);
    }

    // 8. Create sample financial transactions to populate funds
    
    // Simular algunos pagos de matrícula
    const matriculasFund = createdFunds.find(f => f.type === 'TUITION');
    const matriculaAmount = 150000;
    let totalMatriculas = 0;

    for (let i = 0; i < 20; i++) {
        const student = sampleStudents[i];
        
        // Crear factura de matrícula
        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber: `MAT-${currentYear}-${String(i + 1).padStart(6, '0')}`,
                date: new Date(`${currentYear}-02-01`),
                dueDate: new Date(`${currentYear}-02-15`),
                studentId: student.id,
                concept: 'TUITION',
                subtotal: matriculaAmount,
                tax: 0,
                total: matriculaAmount,
                status: 'PAID',
                userId: auxiliary.id,
                type: 'OUTGOING'
            }
        });

        // Crear items de la factura
        await prisma.invoiceItem.create({
            data: {
                invoiceId: invoice.id,
                description: `Matrícula ${currentYear} - ${student.firstName} ${student.lastName}`,
                quantity: 1,
                unitPrice: matriculaAmount,
                total: matriculaAmount
            }
        });

        // Crear pago
        const payment = await prisma.payment.create({
            data: {
                paymentNumber: `PAG-${currentYear}-${String(i + 1).padStart(6, '0')}`,
                date: new Date(`${currentYear}-02-05`),
                studentId: student.id,
                invoiceId: invoice.id,
                amount: matriculaAmount,
                method: 'BANK_TRANSFER',
                reference: `Transfer-${i + 1}`,
                userId: auxiliary.id,
                status: 'COMPLETED',
                fundTargetId: matriculasFund.id
            }
        });

        // Crear transacción de fondo
        await prisma.fundTransaction.create({
            data: {
                fundId: matriculasFund.id,
                type: 'INCOME',
                amount: matriculaAmount,
                description: `Matrícula ${currentYear} - ${student.firstName} ${student.lastName}`,
                paymentId: payment.id,
                userId: auxiliary.id,
                performedBy: auxiliary.id,
                balanceAfter: (i + 1) * matriculaAmount,
                isApproved: true
            }
        });

        totalMatriculas += matriculaAmount;
    }

    // Actualizar saldo del fondo de matrículas
    await prisma.fund.update({
        where: { id: matriculasFund.id },
        data: {
            currentBalance: totalMatriculas,
            totalIncome: totalMatriculas,
            balance: totalMatriculas
        }
    });

    console.log(`✅ Created sample financial data - Matrículas: $${totalMatriculas.toLocaleString()}`);

    // Crear una transferencia de ejemplo entre fondos
    const operationalFund = createdFunds.find(f => f.type === 'OPERATIONAL');
    const transferAmount = 500000;

    // Transacción de salida del fondo de matrículas
    await prisma.fundTransaction.create({
        data: {
            fundId: matriculasFund.id,
            type: 'TRANSFER_OUT',
            amount: transferAmount,
            description: 'Transferencia para gastos operacionales',
            sourceFundId: matriculasFund.id,
            targetFundId: operationalFund.id,
            userId: rector.id,
            performedBy: rector.id,
            balanceAfter: totalMatriculas - transferAmount,
            isApproved: true
        }
    });

    // Transacción de entrada al fondo operacional
    await prisma.fundTransaction.create({
        data: {
            fundId: operationalFund.id,
            type: 'TRANSFER_IN',
            amount: transferAmount,
            description: 'Transferencia desde fondo de matrículas',
            sourceFundId: matriculasFund.id,
            targetFundId: operationalFund.id,
            userId: rector.id,
            performedBy: rector.id,
            balanceAfter: transferAmount,
            isApproved: true
        }
    });

    // Actualizar saldos
    await prisma.fund.update({
        where: { id: matriculasFund.id },
        data: {
            currentBalance: totalMatriculas - transferAmount,
            totalExpenses: transferAmount,
            balance: totalMatriculas - transferAmount
        }
    });

    await prisma.fund.update({
        where: { id: operationalFund.id },
        data: {
            currentBalance: transferAmount,
            totalIncome: transferAmount,
            balance: transferAmount
        }
    });

    console.log(`✅ Created sample fund transfer: $${transferAmount.toLocaleString()}`);

    // Mostrar resumen final
    console.log('\n🎉 Database seeded successfully with Fund System!');
    console.log('\n📊 RESUMEN DEL SISTEMA DE FONDOS:');
    
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

    fundsSummary.forEach(fund => {
        console.log(`💰 ${fund.name} (${fund.code}): $${fund.currentBalance.toLocaleString()}`);
        console.log(`   Ingresos: $${fund.totalIncome.toLocaleString()} | Gastos: $${fund.totalExpenses.toLocaleString()}`);
    });

    console.log(`\n👥 Total Students: ${sampleStudents.length}`);
    console.log(`📅 Total Events: ${eventsData.length}`);
    console.log(`💼 Total Funds: ${createdFunds.length}`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });