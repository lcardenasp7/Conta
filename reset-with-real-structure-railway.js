const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetWithRealStructure() {
    console.log('🔄 Iniciando reset completo con estructura REAL...');
    
    try {
        // Paso 1: Eliminar dependencias de estudiantes
        console.log('📝 Paso 1: Eliminando dependencias de estudiantes...');
        
        // Eliminar enrollments
        const enrollmentsCount = await prisma.enrollment.count();
        console.log(`📊 Enrollments a eliminar: ${enrollmentsCount}`);
        await prisma.enrollment.deleteMany({});
        console.log(`✅ ${enrollmentsCount} enrollments eliminados`);

        // Eliminar attendances
        const attendancesCount = await prisma.attendance.count();
        console.log(`📊 Attendances a eliminar: ${attendancesCount}`);
        await prisma.attendance.deleteMany({});
        console.log(`✅ ${attendancesCount} attendances eliminados`);

        // Eliminar event assignments
        const eventAssignmentsCount = await prisma.eventAssignment.count();
        console.log(`📊 Event assignments a eliminar: ${eventAssignmentsCount}`);
        await prisma.eventAssignment.deleteMany({});
        console.log(`✅ ${eventAssignmentsCount} event assignments eliminados`);

        // Eliminar payments de estudiantes
        const studentPaymentsCount = await prisma.payment.count({
            where: { studentId: { not: null } }
        });
        console.log(`📊 Student payments a eliminar: ${studentPaymentsCount}`);
        await prisma.payment.deleteMany({
            where: { studentId: { not: null } }
        });
        console.log(`✅ ${studentPaymentsCount} student payments eliminados`);

        // Eliminar invoices de estudiantes
        const studentInvoicesCount = await prisma.invoice.count({
            where: { studentId: { not: null } }
        });
        console.log(`📊 Student invoices a eliminar: ${studentInvoicesCount}`);
        await prisma.invoice.deleteMany({
            where: { studentId: { not: null } }
        });
        console.log(`✅ ${studentInvoicesCount} student invoices eliminados`);

        // Paso 2: Eliminar TODOS los estudiantes
        console.log('📝 Paso 2: Eliminando todos los estudiantes...');
        const studentsCount = await prisma.student.count();
        console.log(`📊 Total de estudiantes a eliminar: ${studentsCount}`);

        await prisma.student.deleteMany({});
        console.log(`✅ ${studentsCount} estudiantes eliminados`);

        // Paso 3: Eliminar todos los grupos
        console.log('📝 Paso 3: Eliminando todos los grupos...');
        const groupsCount = await prisma.group.count();
        console.log(`📊 Total de grupos a eliminar: ${groupsCount}`);

        await prisma.group.deleteMany({});
        console.log(`✅ ${groupsCount} grupos eliminados`);

        // Paso 4: Eliminar todos los grados
        console.log('📝 Paso 4: Eliminando todos los grados...');
        const gradesCount = await prisma.grade.count();
        console.log(`📊 Total de grados a eliminar: ${gradesCount}`);

        await prisma.grade.deleteMany({});
        console.log(`✅ ${gradesCount} grados eliminados`);

        // Paso 5: Crear la estructura REAL de grados y grupos
        console.log('📝 Paso 5: Creando estructura REAL de grados y grupos...');
        
        const realGradesStructure = [
            { name: 'Jardín', groups: ['1', '2', '3', '4', '5'], order: 1 },
            { name: 'Transición', groups: ['1', '2', '3', '4', '5', '6', '7', '8'], order: 2 },
            { name: 'Primero', groups: ['1', '2', '3', '4', '5', '6', '7'], order: 3 },
            { name: 'Segundo', groups: ['1', '2', '3', '4', '5', '6'], order: 4 },
            { name: 'Tercero', groups: ['1', '2', '3', '4', '5', '6'], order: 5 },
            { name: 'Cuarto', groups: ['1', '2', '3', '4', '5', '6'], order: 6 },
            { name: 'Quinto', groups: ['1', '2', '3', '4', '5', '6'], order: 7 },
            { name: 'Sexto', groups: ['1', '2', '3', '4', '5', '6', '7'], order: 8 },
            { name: 'Séptimo', groups: ['1', '2', '3', '4', '5', '6', '7'], order: 9 },
            { name: 'Octavo', groups: ['1', '2', '3', '4', '5', '6'], order: 10 },
            { name: 'Noveno', groups: ['1', '2', '3', '4', '5', '6'], order: 11 },
            { name: 'Décimo', groups: ['1', '2', '3', '4', '5', '6'], order: 12 },
            { name: 'Undécimo', groups: ['1', '2', '3', '4'], order: 13 },
            { name: 'Aceleración', groups: ['A', 'B'], order: 14 },
            { name: 'Brújula', groups: ['A', 'B'], order: 15 },
            { name: 'Ciclo 3', groups: ['A', 'B'], order: 16 },
            { name: 'Ciclo 4', groups: ['A', 'B'], order: 17 },
            { name: 'Ciclo 5', groups: ['A', 'B'], order: 18 },
            { name: 'Ciclo 6', groups: ['A'], order: 19 }
        ];

        const createdGrades = [];
        const createdGroups = [];

        for (const gradeData of realGradesStructure) {
            // Crear grado
            const grade = await prisma.grade.create({
                data: {
                    name: gradeData.name,
                    level: gradeData.name,
                    order: gradeData.order
                }
            });
            createdGrades.push(grade);
            console.log(`✅ Grado creado: ${grade.name}`);

            // Crear grupos para este grado
            for (const groupName of gradeData.groups) {
                const group = await prisma.group.create({
                    data: {
                        name: groupName,
                        gradeId: grade.id
                    }
                });
                createdGroups.push(group);
                console.log(`  ✅ Grupo creado: ${grade.name} - ${group.name}`);
            }
        }

        console.log(`\n📊 Resumen de creación:`);
        console.log(`✅ Grados creados: ${createdGrades.length}`);
        console.log(`✅ Grupos creados: ${createdGroups.length}`);

        // Paso 6: Mostrar estructura creada
        console.log('\n📋 Estructura REAL creada:');
        for (const gradeData of realGradesStructure) {
            console.log(`${gradeData.name}: [${gradeData.groups.join(', ')}] (${gradeData.groups.length} grupos)`);
        }

        console.log('\n🎉 ¡Reset con estructura REAL completado exitosamente!');
        console.log('\n📋 Próximos pasos:');
        console.log('1. Ejecutar el script de importación de estudiantes desde Excel');
        console.log('2. Los estudiantes serán asignados a sus grados y grupos correctos');
        console.log('3. La base de datos quedará completamente limpia y organizada');

        return {
            success: true,
            studentsDeleted: studentsCount,
            gradesCreated: createdGrades.length,
            groupsCreated: createdGroups.length,
            structure: realGradesStructure
        };

    } catch (error) {
        console.error('❌ Error durante el reset:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    resetWithRealStructure()
        .then((result) => {
            console.log('\n✅ Script completado exitosamente');
            console.log('📊 Resultado:', result);
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { resetWithRealStructure };