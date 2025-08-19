#!/usr/bin/env node

/**
 * Script para crear los grados faltantes en Railway
 * y luego importar los estudiantes que fallaron
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createMissingGrades() {
    console.log('📚 CREANDO GRADOS FALTANTES EN RAILWAY');
    console.log('====================================\n');

    try {
        // Grados adicionales que aparecen en el Excel
        const additionalGrades = [
            { name: 'Ciclo 3', level: 'CICLO', order: 19 },
            { name: 'Ciclo 4', level: 'CICLO', order: 20 },
            { name: 'Ciclo 5', level: 'CICLO', order: 21 },
            { name: 'Ciclo 6', level: 'CICLO', order: 22 },
            { name: 'Brújula', level: 'OTRO', order: 23 },
            { name: 'Aceleración', level: 'OTRO', order: 24 },
            { name: 'Adultos', level: 'OTRO', order: 25 },
            { name: 'Nocturna', level: 'OTRO', order: 26 }
        ];

        console.log('📋 Verificando grados existentes...');
        const existingGrades = await prisma.grade.findMany();
        console.log(`✅ Grados actuales: ${existingGrades.length}`);
        existingGrades.forEach(grade => {
            console.log(`   - ${grade.name} (${grade.level})`);
        });

        console.log('\n📋 Creando grados faltantes...');
        let createdCount = 0;

        for (const gradeData of additionalGrades) {
            try {
                // Verificar si ya existe
                const existing = existingGrades.find(g => g.name === gradeData.name);
                if (existing) {
                    console.log(`⚠️ Grado ya existe: ${gradeData.name}`);
                    continue;
                }

                // Crear el grado
                const grade = await prisma.grade.create({
                    data: gradeData
                });

                console.log(`✅ Grado creado: ${grade.name} (${grade.level})`);

                // Crear grupos para el grado
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

                console.log(`   📝 Grupos creados: ${groups.join(', ')}`);
                createdCount++;

            } catch (error) {
                console.error(`❌ Error creando grado ${gradeData.name}:`, error.message);
            }
        }

        console.log(`\n🎉 Grados creados: ${createdCount}`);

        // Verificar estado final
        const finalGrades = await prisma.grade.findMany({
            include: { groups: true }
        });

        console.log('\n📊 ESTADO FINAL DE GRADOS:');
        console.log('==========================');
        finalGrades.forEach(grade => {
            console.log(`${grade.name} (${grade.level}): ${grade.groups.length} grupos`);
        });

        console.log(`\n✅ Total de grados: ${finalGrades.length}`);
        console.log(`✅ Total de grupos: ${finalGrades.reduce((sum, g) => sum + g.groups.length, 0)}`);

        return createdCount;

    } catch (error) {
        console.error('❌ Error creando grados:', error);
        throw error;
    }
}

async function retryFailedStudents() {
    console.log('\n🔄 REINTENTANDO IMPORTACIÓN DE ESTUDIANTES FALLIDOS');
    console.log('==================================================\n');

    try {
        // Ejecutar el script de importación nuevamente
        const { importAllStudents } = require('./import-all-students-railway.js');
        await importAllStudents();

    } catch (error) {
        console.error('❌ Error reintentando importación:', error);
        throw error;
    }
}

async function main() {
    try {
        console.log('🚀 COMPLETANDO IMPORTACIÓN DE ESTUDIANTES');
        console.log('=========================================\n');

        // 1. Crear grados faltantes
        const createdGrades = await createMissingGrades();

        if (createdGrades > 0) {
            console.log('\n⏳ Esperando 2 segundos para que se propaguen los cambios...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 2. Reintentar importación de estudiantes fallidos
            await retryFailedStudents();
        } else {
            console.log('\n✅ No se crearon grados nuevos, no es necesario reintentar');
        }

        // 3. Verificación final
        console.log('\n📊 VERIFICACIÓN FINAL');
        console.log('====================');

        const totalStudents = await prisma.student.count();
        const totalGrades = await prisma.grade.count();
        const totalGroups = await prisma.group.count();

        console.log(`✅ Total estudiantes: ${totalStudents}`);
        console.log(`✅ Total grados: ${totalGrades}`);
        console.log(`✅ Total grupos: ${totalGroups}`);

        if (totalStudents >= 3000) {
            console.log('\n🎉 ¡IMPORTACIÓN COMPLETA EXITOSA!');
            console.log('================================');
            console.log('✅ Todos los estudiantes han sido importados');
            console.log('✅ Sistema listo para operación');
        } else {
            console.log('\n⚠️ Aún faltan algunos estudiantes por importar');
            console.log(`   Se esperaban ~3174, se tienen ${totalStudents}`);
        }

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

module.exports = { createMissingGrades, retryFailedStudents };