const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetGradesStructure() {
    console.log('🔄 Iniciando reset completo de la estructura de grados...');
    
    try {
        // Paso 1: Crear grado temporal
        console.log('📝 Paso 1: Creando grado temporal...');
        
        // Buscar si ya existe el grado temporal
        let tempGrade = await prisma.grade.findFirst({
            where: { name: 'TEMPORAL_RESET' }
        });
        
        if (!tempGrade) {
            tempGrade = await prisma.grade.create({
                data: {
                    name: 'TEMPORAL_RESET',
                    level: 'TEMPORAL',
                    order: 999
                }
            });
        }
        console.log(`✅ Grado temporal creado: ${tempGrade.name}`);

        // Paso 2: Crear grupo temporal en el grado temporal
        console.log('📝 Paso 2: Creando grupo temporal...');
        
        // Buscar si ya existe el grupo temporal
        let tempGroup = await prisma.group.findFirst({
            where: { name: 'GRUPO_TEMPORAL_RESET' }
        });
        
        if (!tempGroup) {
            tempGroup = await prisma.group.create({
                data: {
                    name: 'GRUPO_TEMPORAL_RESET',
                    gradeId: tempGrade.id
                }
            });
        }
        console.log(`✅ Grupo temporal creado: ${tempGroup.name}`);

        // Paso 3: Mover todos los estudiantes al grupo temporal
        console.log('📝 Paso 3: Moviendo todos los estudiantes al grupo temporal...');
        const studentsCount = await prisma.student.count();
        console.log(`📊 Total de estudiantes a mover: ${studentsCount}`);

        const updateResult = await prisma.student.updateMany({
            data: {
                gradeId: tempGrade.id,
                groupId: tempGroup.id
            }
        });
        console.log(`✅ ${updateResult.count} estudiantes movidos al grupo temporal`);

        // Paso 4: Eliminar todos los grupos (excepto el temporal)
        console.log('📝 Paso 4: Eliminando grupos existentes...');
        const groupsToDelete = await prisma.group.findMany({
            where: {
                NOT: {
                    name: 'GRUPO_TEMPORAL_RESET'
                }
            }
        });
        console.log(`📊 Grupos a eliminar: ${groupsToDelete.length}`);

        for (const group of groupsToDelete) {
            await prisma.group.delete({
                where: { id: group.id }
            });
            console.log(`🗑️ Grupo eliminado: ${group.name}`);
        }

        // Paso 5: Eliminar todos los grados (excepto el temporal)
        console.log('📝 Paso 5: Eliminando grados existentes...');
        const gradesToDelete = await prisma.grade.findMany({
            where: {
                NOT: {
                    name: 'TEMPORAL_RESET'
                }
            }
        });
        console.log(`📊 Grados a eliminar: ${gradesToDelete.length}`);

        for (const grade of gradesToDelete) {
            await prisma.grade.delete({
                where: { id: grade.id }
            });
            console.log(`🗑️ Grado eliminado: ${grade.name}`);
        }

        // Paso 6: Crear la estructura correcta de grados
        console.log('📝 Paso 6: Creando estructura correcta de grados...');
        
        const gradesStructure = [
            { name: 'Preescolar', groups: ['Jardín A', 'Jardín B', 'Transición A', 'Transición B'] },
            { name: 'Primero', groups: ['1A', '1B', '1C'] },
            { name: 'Segundo', groups: ['2A', '2B', '2C'] },
            { name: 'Tercero', groups: ['3A', '3B', '3C'] },
            { name: 'Cuarto', groups: ['4A', '4B', '4C'] },
            { name: 'Quinto', groups: ['5A', '5B', '5C'] },
            { name: 'Sexto', groups: ['6A', '6B', '6C'] },
            { name: 'Séptimo', groups: ['7A', '7B', '7C'] },
            { name: 'Octavo', groups: ['8A', '8B', '8C'] },
            { name: 'Noveno', groups: ['9A', '9B', '9C'] },
            { name: 'Décimo', groups: ['10A', '10B', '10C'] },
            { name: 'Once', groups: ['11A', '11B', '11C'] }
        ];

        const createdGrades = [];
        const createdGroups = [];

        for (const gradeData of gradesStructure) {
            // Crear grado
            const grade = await prisma.grade.create({
                data: {
                    name: gradeData.name,
                    level: gradeData.name,
                    order: gradesStructure.indexOf(gradeData) + 1
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
                console.log(`  ✅ Grupo creado: ${group.name}`);
            }
        }

        console.log(`\n📊 Resumen de creación:`);
        console.log(`✅ Grados creados: ${createdGrades.length}`);
        console.log(`✅ Grupos creados: ${createdGroups.length}`);

        // Paso 7: Verificar que todos los estudiantes están en el grupo temporal
        console.log('\n📝 Paso 7: Verificando estudiantes en grupo temporal...');
        const studentsInTemp = await prisma.student.count({
            where: {
                gradeId: tempGrade.id,
                groupId: tempGroup.id
            }
        });
        console.log(`📊 Estudiantes en grupo temporal: ${studentsInTemp}`);

        console.log('\n🎉 ¡Reset de estructura completado exitosamente!');
        console.log('\n📋 Próximos pasos:');
        console.log('1. Ejecutar el script de importación de estudiantes');
        console.log('2. Los estudiantes serán redistribuidos a sus grados correctos');
        console.log('3. El grado y grupo temporal serán eliminados automáticamente');

        return {
            success: true,
            tempGrade: tempGrade,
            tempGroup: tempGroup,
            studentsInTemp: studentsInTemp,
            gradesCreated: createdGrades.length,
            groupsCreated: createdGroups.length
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
    resetGradesStructure()
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

module.exports = { resetGradesStructure };