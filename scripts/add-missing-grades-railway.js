#!/usr/bin/env node

/**
 * Script para agregar solo los grados y grupos faltantes
 * sin eliminar los existentes que ya tienen estudiantes
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMissingGrades() {
    console.log('➕ AGREGANDO GRADOS Y GRUPOS FALTANTES');
    console.log('====================================\n');

    try {
        // Grados que necesitamos según el Excel
        const requiredGrades = {
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

        // Obtener grados existentes
        const existingGrades = await prisma.grade.findMany({
            include: { groups: true }
        });

        console.log('📋 Grados existentes:');
        existingGrades.forEach(grade => {
            const groupNames = grade.groups.map(g => g.name).join(', ');
            console.log(`   ${grade.name}: [${groupNames}]`);
        });

        let gradesCreated = 0;
        let groupsCreated = 0;

        for (const [gradeName, gradeInfo] of Object.entries(requiredGrades)) {
            // Verificar si el grado ya existe
            let grade = existingGrades.find(g => g.name === gradeName);

            if (!grade) {
                // Crear el grado si no existe
                console.log(`\n➕ Creando grado: ${gradeName}`);
                grade = await prisma.grade.create({
                    data: {
                        name: gradeName,
                        level: gradeInfo.level,
                        order: gradeInfo.order
                    }
                });
                console.log(`✅ Grado creado: ${grade.name}`);
                gradesCreated++;
                
                // Agregar a la lista para verificar grupos
                grade.groups = [];
            } else {
                console.log(`\n✅ Grado ya existe: ${gradeName}`);
            }

            // Verificar y crear grupos faltantes
            const existingGroupNames = grade.groups.map(g => g.name);
            const missingGroups = gradeInfo.groups.filter(groupName => 
                !existingGroupNames.includes(groupName)
            );

            if (missingGroups.length > 0) {
                console.log(`   ➕ Creando grupos faltantes: ${missingGroups.join(', ')}`);
                
                for (const groupName of missingGroups) {
                    await prisma.group.create({
                        data: {
                            name: groupName,
                            gradeId: grade.id,
                            year: new Date().getFullYear(),
                            capacity: 30
                        }
                    });
                    groupsCreated++;
                }
                console.log(`   ✅ ${missingGroups.length} grupos creados`);
            } else {
                console.log(`   ✅ Todos los grupos ya existen`);
            }
        }

        console.log('\n📊 RESUMEN:');
        console.log('===========');
        console.log(`✅ Grados creados: ${gradesCreated}`);
        console.log(`✅ Grupos creados: ${groupsCreated}`);

        // Verificación final
        const finalGrades = await prisma.grade.findMany({
            include: { groups: true },
            orderBy: { order: 'asc' }
        });

        console.log('\n📋 ESTRUCTURA FINAL:');
        console.log('====================');
        finalGrades.forEach(grade => {
            const groupNames = grade.groups.map(g => g.name).sort();
            console.log(`${grade.name} (${grade.level}): [${groupNames.join(', ')}] (${grade.groups.length} grupos)`);
        });

        console.log(`\n🎯 Total grados: ${finalGrades.length}`);
        console.log(`🎯 Total grupos: ${finalGrades.reduce((sum, g) => sum + g.groups.length, 0)}`);

        return { gradesCreated, groupsCreated };

    } catch (error) {
        console.error('❌ Error agregando grados:', error);
        throw error;
    }
}

async function main() {
    try {
        const result = await addMissingGrades();

        console.log('\n🎉 ¡GRADOS Y GRUPOS AGREGADOS EXITOSAMENTE!');
        console.log('==========================================');
        console.log(`✅ ${result.gradesCreated} grados nuevos`);
        console.log(`✅ ${result.groupsCreated} grupos nuevos`);
        console.log('✅ Estructura completa según Excel');
        console.log('✅ Estudiantes existentes preservados');

        console.log('\n📋 PRÓXIMO PASO:');
        console.log('================');
        console.log('🔄 Ejecutar importación final de estudiantes');

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
            console.log('\n✅ Proceso completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { addMissingGrades };