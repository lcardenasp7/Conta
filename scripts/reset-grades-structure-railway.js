#!/usr/bin/env node

/**
 * Script para resetear completamente la estructura de grados y grupos
 * 1. Crear grado temporal
 * 2. Mover todos los estudiantes al grado temporal
 * 3. Eliminar todos los grados y grupos
 * 4. Recrear estructura correcta desde cero
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetGradesStructure() {
    console.log('🔄 RESETEANDO ESTRUCTURA DE GRADOS COMPLETAMENTE');
    console.log('===============================================\n');

    try {
        // PASO 1: Crear grado y grupo temporal
        console.log('📋 PASO 1: Creando grado temporal...');
        
        let tempGrade;
        try {
            tempGrade = await prisma.grade.create({
                data: {
                    name: 'TEMPORAL_IMPORT',
                    level: 'OTRO',
                    order: 999
                }
            });
            console.log('✅ Grado temporal creado');
        } catch (error) {
            // Si ya existe, obtenerlo
            tempGrade = await prisma.grade.findFirst({
                where: { name: 'TEMPORAL_IMPORT' }
            });
            console.log('✅ Grado temporal ya existe');
        }

        let tempGroup;
        try {
            tempGroup = await prisma.group.create({
                data: {
                    name: 'TEMP',
                    gradeId: tempGrade.id,
                    year: new Date().getFullYear(),
                    capacity: 10000
                }
            });
            console.log('✅ Grupo temporal creado');
        } catch (error) {
            tempGroup = await prisma.group.findFirst({
                where: { gradeId: tempGrade.id }
            });
            console.log('✅ Grupo temporal ya existe');
        }

        // PASO 2: Mover todos los estudiantes al grupo temporal
        console.log('\n📋 PASO 2: Moviendo estudiantes al grupo temporal...');
        
        const studentCount = await prisma.student.count();
        console.log(`👥 Total estudiantes a mover: ${studentCount}`);

        if (studentCount > 0) {
            await prisma.student.updateMany({
                data: {
                    gradeId: tempGrade.id,
                    groupId: tempGroup.id
                }
            });
            console.log('✅ Todos los estudiantes movidos al grupo temporal');
        }

        // PASO 3: Eliminar todos los grados y grupos (excepto el temporal)
        console.log('\n📋 PASO 3: Eliminando estructura actual...');
        
        // Eliminar grupos (excepto el temporal)
        const deletedGroups = await prisma.group.deleteMany({
            where: {
                NOT: { id: tempGroup.id }
            }
        });
        console.log(`✅ ${deletedGroups.count} grupos eliminados`);

        // Eliminar grados (excepto el temporal)
        const deletedGrades = await prisma.grade.deleteMany({
            where: {
                NOT: { id: tempGrade.id }
            }
        });
        console.log(`✅ ${deletedGrades.count} grados eliminados`);

        // PASO 4: Recrear estructura correcta según Excel
        console.log('\n📋 PASO 4: Recreando estructura correcta...');
        
        // Estructura EXACTA según el análisis del Excel
        const correctStructure = {
            'Jardín': { level: 'PREESCOLAR', groups: ['1', '2', '3', '4', '5'], order: 1 },
            'Transición': { level: 'PREESCOLAR', groups: ['1', '2', '3', '4', '5', '6', '7', '8'], order: 2 },
            'Primero': { level: 'PRIMARIA', groups: ['1', '2', '3', '4', '5', '6', '7'], order: 3 },
            'Segundo': { level: 'PRIMARIA', groups: ['1', '2', '3', '4', '5', '6'], order: 4 },
            'Tercero': { level: 'PRIMARIA', groups: ['1', '2', '3', '4', '5', '6'], order: 5 },
            'Cuarto': { level: 'PRIMARIA', groups: ['1', '2', '3', '4', '5', '6'], order: 6 },
            'Quinto': { level: 'PRIMARIA', groups: ['1', '2', '3', '4', '5', '6'], order: 7 },
            'Sexto': { level: 'SECUNDARIA', groups: ['1', '2', '3', '4', '5', '6', '7'], order: 8 },
            'Séptimo': { level: 'SECUNDARIA', groups: ['1', '2', '3', '4', '5', '6', '7'], order: 9 },
            'Octavo': { level: 'SECUNDARIA', groups: ['1', '2', '3', '4', '5', '6'], order: 10 },
            'Noveno': { level: 'SECUNDARIA', groups: ['1', '2', '3', '4', '5', '6'], order: 11 },
            'Décimo': { level: 'MEDIA', groups: ['1', '2', '3', '4', '5', '6'], order: 12 },
            'Undécimo': { level: 'MEDIA', groups: ['1', '2', '3', '4'], order: 13 },
            'Brújula': { level: 'OTRO', groups: ['A', 'B'], order: 14 },
            'Aceleración': { level: 'OTRO', groups: ['A', 'B'], order: 15 },
            'Ciclo 3': { level: 'CICLO', groups: ['A', 'B'], order: 16 },
            'Ciclo 4': { level: 'CICLO', groups: ['A', 'B'], order: 17 },
            'Ciclo 5': { level: 'CICLO', groups: ['A', 'B'], order: 18 },
            'Ciclo 6': { level: 'CICLO', groups: ['A'], order: 19 }
        };

        const createdGrades = [];
        let totalGroups = 0;

        for (const [gradeName, gradeInfo] of Object.entries(correctStructure)) {
            console.log(`\n📚 Creando grado: ${gradeName}`);
            
            const grade = await prisma.grade.create({
                data: {
                    name: gradeName,
                    level: gradeInfo.level,
                    order: gradeInfo.order
                }
            });

            console.log(`✅ Grado creado: ${grade.name} (${grade.level})`);
            createdGrades.push(grade);

            // Crear grupos para este grado
            for (const groupName of gradeInfo.groups) {
                await prisma.group.create({
                    data: {
                        name: groupName,
                        gradeId: grade.id,
                        year: new Date().getFullYear(),
                        capacity: 30
                    }
                });
                totalGroups++;
            }

            console.log(`   📝 Grupos: [${gradeInfo.groups.join(', ')}] (${gradeInfo.groups.length} grupos)`);
        }

        console.log('\n📊 ESTRUCTURA RECREADA:');
        console.log('=======================');
        console.log(`✅ Grados creados: ${createdGrades.length}`);
        console.log(`✅ Grupos creados: ${totalGroups}`);

        // PASO 5: Eliminar grado temporal (esto moverá estudiantes a NULL temporalmente)
        console.log('\n📋 PASO 5: Limpiando grado temporal...');
        
        // Primero actualizar estudiantes para que no tengan gradeId ni groupId
        await prisma.student.updateMany({
            where: { gradeId: tempGrade.id },
            data: {
                gradeId: null,
                groupId: null
            }
        });
        console.log('✅ Estudiantes desasignados temporalmente');

        // Eliminar grupo temporal
        await prisma.group.delete({
            where: { id: tempGroup.id }
        });
        console.log('✅ Grupo temporal eliminado');

        // Eliminar grado temporal
        await prisma.grade.delete({
            where: { id: tempGrade.id }
        });
        console.log('✅ Grado temporal eliminado');

        // Verificación final
        const finalGrades = await prisma.grade.findMany({
            include: { groups: true },
            orderBy: { order: 'asc' }
        });

        console.log('\n📋 ESTRUCTURA FINAL VERIFICADA:');
        console.log('===============================');
        finalGrades.forEach(grade => {
            const groupNames = grade.groups.map(g => g.name).sort();
            console.log(`${grade.name} (${grade.level}): [${groupNames.join(', ')}] (${grade.groups.length} grupos)`);
        });

        const studentsWithoutGrade = await prisma.student.count({
            where: { gradeId: null }
        });

        console.log(`\n🎯 Estudiantes sin asignar: ${studentsWithoutGrade}`);
        console.log(`🎯 Total grados: ${finalGrades.length}`);
        console.log(`🎯 Total grupos: ${finalGrades.reduce((sum, g) => sum + g.groups.length, 0)}`);

        console.log('\n🎉 ¡ESTRUCTURA RESETEADA EXITOSAMENTE!');
        console.log('====================================');
        console.log('✅ Grados y grupos recreados desde cero');
        console.log('✅ Sin duplicados');
        console.log('✅ Estructura exacta según Excel');
        console.log('✅ Estudiantes preservados (sin asignar)');

        return {
            gradesCreated: createdGrades.length,
            groupsCreated: totalGroups,
            studentsPreserved: studentsWithoutGrade
        };

    } catch (error) {
        console.error('❌ Error reseteando estructura:', error);
        throw error;
    }
}

async function main() {
    try {
        const result = await resetGradesStructure();

        console.log('\n📋 PRÓXIMO PASO:');
        console.log('================');
        console.log('🔄 Ejecutar importación de estudiantes con estructura limpia');
        console.log('   Los estudiantes se reasignarán a los grados correctos');

    } catch (error) {
        console.error('❌ Error en proceso principal:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    main()
        .then(() => {
            console.log('\n✅ Reset de estructura completado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { resetGradesStructure };