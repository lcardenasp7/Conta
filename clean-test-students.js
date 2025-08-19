const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanTestStudents() {
    console.log('🧹 LIMPIANDO ESTUDIANTES DE PRUEBA');
    console.log('═══════════════════════════════════');
    
    try {
        // 1. Primero, identificar estudiantes de prueba
        console.log('🔍 Identificando estudiantes de prueba...');
        
        const testStudents = await prisma.student.findMany({
            where: {
                OR: [
                    { firstName: { startsWith: 'Estudiante' } },
                    { email: { contains: 'estudiante' } },
                    { document: { gte: '1000000001', lte: '1000000050' } },
                    { firstName: { contains: 'Estudiante' } },
                    { lastName: { contains: 'Apellido' } }
                ]
            },
            select: {
                id: true,
                document: true,
                firstName: true,
                lastName: true,
                email: true
            }
        });
        
        console.log(`📊 Estudiantes de prueba encontrados: ${testStudents.length}`);
        
        if (testStudents.length === 0) {
            console.log('✅ No hay estudiantes de prueba para eliminar');
            return;
        }
        
        // Mostrar los estudiantes que se van a eliminar
        console.log('\n👥 ESTUDIANTES A ELIMINAR:');
        testStudents.slice(0, 10).forEach(s => {
            console.log(`  - ${s.firstName} ${s.lastName} (${s.document}) - ${s.email}`);
        });
        if (testStudents.length > 10) {
            console.log(`  ... y ${testStudents.length - 10} más`);
        }
        
        // 2. Eliminar registros relacionados primero
        const testStudentIds = testStudents.map(s => s.id);
        
        console.log('\n🗑️ Eliminando registros relacionados...');
        
        // Eliminar asistencias
        const deletedAttendances = await prisma.attendance.deleteMany({
            where: { studentId: { in: testStudentIds } }
        });
        console.log(`  ✅ Asistencias eliminadas: ${deletedAttendances.count}`);
        
        // Eliminar inscripciones
        const deletedEnrollments = await prisma.enrollment.deleteMany({
            where: { studentId: { in: testStudentIds } }
        });
        console.log(`  ✅ Inscripciones eliminadas: ${deletedEnrollments.count}`);
        
        // Eliminar asignaciones de eventos
        const deletedEventAssignments = await prisma.eventAssignment.deleteMany({
            where: { studentId: { in: testStudentIds } }
        });
        console.log(`  ✅ Asignaciones de eventos eliminadas: ${deletedEventAssignments.count}`);
        
        // Eliminar transacciones de fondos relacionadas con pagos/facturas de estos estudiantes
        console.log('🗑️ Eliminando transacciones de fondos relacionadas...');
        await prisma.fundTransaction.deleteMany({
            where: {
                OR: [
                    { Payment: { studentId: { in: testStudentIds } } },
                    { Invoice: { studentId: { in: testStudentIds } } }
                ]
            }
        });
        
        // Eliminar pagos
        const deletedPayments = await prisma.payment.deleteMany({
            where: { studentId: { in: testStudentIds } }
        });
        console.log(`  ✅ Pagos eliminados: ${deletedPayments.count}`);
        
        // Eliminar ítems de facturas relacionadas
        await prisma.invoiceItem.deleteMany({
            where: {
                invoice: { studentId: { in: testStudentIds } }
            }
        });
        
        // Eliminar facturas
        const deletedInvoices = await prisma.invoice.deleteMany({
            where: { studentId: { in: testStudentIds } }
        });
        console.log(`  ✅ Facturas eliminadas: ${deletedInvoices.count}`);
        
        // 3. Finalmente eliminar estudiantes
        console.log('\n👨‍🎓 Eliminando estudiantes de prueba...');
        const deletedStudents = await prisma.student.deleteMany({
            where: { id: { in: testStudentIds } }
        });
        
        console.log(`✅ ÉXITO: ${deletedStudents.count} estudiantes de prueba eliminados`);
        
        // 4. Verificar resultado
        const remainingStudents = await prisma.student.count();
        console.log(`👥 Estudiantes restantes: ${remainingStudents}`);
        
        // 5. Mostrar estadísticas por grado después de la limpieza
        console.log('\n📊 ESTADÍSTICAS ACTUALIZADAS:');
        const stats = await prisma.grade.findMany({
            include: {
                _count: { select: { students: true } }
            },
            orderBy: { order: 'asc' }
        });
        
        stats.forEach(grade => {
            if (grade._count.students > 0) {
                console.log(`  ${grade.name}: ${grade._count.students} estudiantes`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error limpiando estudiantes de prueba:', error);
        
        // Si hay error de constraint, intentar con método más específico
        if (error.code === 'P2003') {
            console.log('\n🔧 Reintentando con método específico...');
            await cleanWithSpecificMethod();
        }
    } finally {
        await prisma.$disconnect();
    }
}

async function cleanWithSpecificMethod() {
    try {
        // Método más específico para casos complicados
        console.log('🔧 Usando método específico para eliminar estudiantes de prueba...');
        
        // Obtener IDs de estudiantes de prueba
        const testStudentIds = await prisma.student.findMany({
            where: {
                OR: [
                    { firstName: { startsWith: 'Estudiante' } },
                    { document: { gte: '1000000001', lte: '1000000050' } }
                ]
            },
            select: { id: true }
        }).then(students => students.map(s => s.id));
        
        if (testStudentIds.length === 0) {
            console.log('✅ No hay estudiantes de prueba para eliminar');
            return;
        }
        
        // Eliminar uno por uno para evitar problemas de constraints
        for (const studentId of testStudentIds) {
            try {
                // Eliminar todas las relaciones del estudiante
                await prisma.attendance.deleteMany({
                    where: { studentId }
                });
                
                await prisma.enrollment.deleteMany({
                    where: { studentId }
                });
                
                await prisma.eventAssignment.deleteMany({
                    where: { studentId }
                });
                
                // Eliminar transacciones relacionadas con este estudiante
                await prisma.fundTransaction.deleteMany({
                    where: {
                        OR: [
                            { Payment: { studentId } },
                            { Invoice: { studentId } }
                        ]
                    }
                });
                
                await prisma.payment.deleteMany({
                    where: { studentId }
                });
                
                await prisma.invoiceItem.deleteMany({
                    where: { invoice: { studentId } }
                });
                
                await prisma.invoice.deleteMany({
                    where: { studentId }
                });
                
                // Finalmente eliminar el estudiante
                await prisma.student.delete({
                    where: { id: studentId }
                });
                
            } catch (err) {
                console.log(`⚠️ No se pudo eliminar estudiante ${studentId}: ${err.message}`);
            }
        }
        
        console.log('✅ Limpieza específica completada');
        
    } catch (error) {
        console.error('❌ Error en método específico:', error);
    }
}

async function cleanEmptyGroups() {
    console.log('\n🧹 LIMPIANDO GRUPOS VACÍOS DEL SEED');
    console.log('═══════════════════════════════════');
    
    try {
        // Encontrar grupos sin estudiantes que tengan formato "01", "02", etc.
        const emptyGroups = await prisma.group.findMany({
            where: {
                AND: [
                    { students: { none: {} } }, // Sin estudiantes
                    { name: { in: ['01', '02', '03', '04', '05', '06'] } } // Solo grupos del seed
                ]
            },
            include: {
                grade: true,
                _count: { select: { students: true } }
            }
        });
        
        console.log(`📊 Grupos vacíos del seed encontrados: ${emptyGroups.length}`);
        
        if (emptyGroups.length > 0) {
            console.log('\n🗑️ GRUPOS A ELIMINAR:');
            emptyGroups.forEach(group => {
                console.log(`  - ${group.grade.name} - Grupo ${group.name} (${group._count.students} estudiantes)`);
            });
            
            const deletedGroups = await prisma.group.deleteMany({
                where: {
                    id: { in: emptyGroups.map(g => g.id) }
                }
            });
            
            console.log(`✅ ${deletedGroups.count} grupos vacíos eliminados`);
        } else {
            console.log('✅ No hay grupos vacíos del seed para eliminar');
        }
        
    } catch (error) {
        console.error('❌ Error limpiando grupos vacíos:', error);
    }
}

// Función principal
async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'students':
            await cleanTestStudents();
            break;
        case 'groups':
            await cleanEmptyGroups();
            break;
        case 'all':
            await cleanTestStudents();
            await cleanEmptyGroups();
            break;
        default:
            console.log('🧹 SCRIPT DE LIMPIEZA');
            console.log('═══════════════════════');
            console.log('Comandos:');
            console.log('  node clean-test-students.js students - Limpiar estudiantes de prueba');
            console.log('  node clean-test-students.js groups   - Limpiar grupos vacíos del seed');
            console.log('  node clean-test-students.js all      - Limpiar todo (recomendado)');
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    cleanTestStudents,
    cleanEmptyGroups
};