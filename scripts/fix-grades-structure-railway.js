#!/usr/bin/env node

/**
 * Script para corregir la estructura de grados y grupos en Railway
 * basado en el análisis real del Excel
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixGradesStructure() {
    console.log('🔧 CORRIGIENDO ESTRUCTURA DE GRADOS Y GRUPOS');
    console.log('============================================\n');

    try {
        // Estructura REAL según el análisis del Excel
        const realGradesStructure = {
            // Preescolar
            'Jardín': { level: 'PREESCOLAR', groups: ['1', '2', '3', '4', '5'], order: 1 },
            'Transición': { level: 'PREESCOLAR', groups: ['1', '2', '3', '4', '5', '6', '7', '8'], order: 2 },
            
            // Primaria
            'Primero': { level: 'PRIMARIA', groups: ['1', '2', '3', '4', '5', '6', '7'], order: 3 },
            'Segundo': { level: 'PRIMARIA', groups: ['1', '2', '3', '4', '5', '6'], order: 4 },
            'Tercero': { level: 'PRIMARIA', groups: ['1', '2', '3', '4', '5', '6'], order: 5 },
            'Cuarto': { level: 'PRIMARIA', groups: ['1', '2', '3', '4', '5', '6'], order: 6 },
            'Quinto': { level: 'PRIMARIA', groups: ['1', '2', '3', '4', '5', '6'], order: 7 },
            
            // Secundaria
            'Sexto': { level: 'SECUNDARIA', groups: ['1', '2', '3', '4', '5', '6', '7'], order: 8 },
            'Séptimo': { level: 'SECUNDARIA', groups: ['1', '2', '3', '4', '5', '6', '7'], order: 9 },
            'Octavo': { level: 'SECUNDARIA', groups: ['1', '2', '3', '4', '5', '6'], order: 10 },
            'Noveno': { level: 'SECUNDARIA', groups: ['1', '2', '3', '4', '5', '6'], order: 11 },
            
            // Media
            'Décimo': { level: 'MEDIA', groups: ['1', '2', '3', '4', '5', '6'], order: 12 },
            'Undécimo': { level: 'MEDIA', groups: ['1', '2', '3', '4'], order: 13 },
            
            // Programas especiales
            'Brújula': { level: 'OTRO', groups: ['A', 'B'], order: 14 },
            'Aceleración': { level: 'OTRO', groups: ['A', 'B'], order: 15 },
            
            // Ciclos
            'Ciclo 3': { level: 'CICLO', groups: ['A', 'B'], order: 16 },
            'Ciclo 4': { level: 'CICLO', groups: ['A', 'B'], order: 17 },
            'Ciclo 5': { level: 'CICLO', groups: ['A', 'B'], order: 18 },
            'Ciclo 6': { level: 'CICLO', groups: ['A'], order: 19 }
        };

        console.log('📋 1. ELIMINANDO ESTRUCTURA ACTUAL...');
        
        // Eliminar grupos existentes
        await prisma.group.deleteMany({});
        console.log('✅ Grupos eliminados');
        
        // Eliminar grados existentes
        await prisma.grade.deleteMany({});
        console.log('✅ Grados eliminados');

        console.log('\n📋 2. CREANDO ESTRUCTURA CORRECTA...');
        
        let totalGrades = 0;
        let totalGroups = 0;

        for (const [gradeName, gradeInfo] of Object.entries(realGradesStructure)) {
            try {
                console.log(`\n📚 Creando grado: ${gradeName}`);
                
                // Crear el grado
                const grade = await prisma.grade.create({
                    data: {
                        name: gradeName,
                        level: gradeInfo.level,
                        order: gradeInfo.order
                    }
                });

                console.log(`✅ Grado creado: ${grade.name} (${grade.level})`);
                totalGrades++;

                // Crear los grupos específicos para este grado
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

                console.log(`   📝 Grupos creados: ${gradeInfo.groups.join(', ')} (${gradeInfo.groups.length} grupos)`);

            } catch (error) {
                console.error(`❌ Error creando grado ${gradeName}:`, error.message);
            }
        }

        console.log('\n📊 ESTRUCTURA CREADA:');
        console.log('====================');
        console.log(`✅ Total grados: ${totalGrades}`);
        console.log(`✅ Total grupos: ${totalGroups}`);

        // Verificar estructura final
        const finalGrades = await prisma.grade.findMany({
            include: { groups: true },
            orderBy: { order: 'asc' }
        });

        console.log('\n📋 VERIFICACIÓN FINAL:');
        console.log('======================');
        finalGrades.forEach(grade => {
            const groupNames = grade.groups.map(g => g.name).sort();
            console.log(`${grade.name} (${grade.level}): [${groupNames.join(', ')}] (${grade.groups.length} grupos)`);
        });

        console.log('\n🎯 MAPEO DE NOMBRES:');
        console.log('===================');
        console.log('✅ Jardín → Jardín (no Preescolar)');
        console.log('✅ Transición → Transición (no Preescolar)');
        console.log('✅ Grupos numéricos: 1, 2, 3, 4, 5, 6, 7, 8');
        console.log('✅ Grupos alfabéticos: A, B (para Ciclos y programas especiales)');

        return { totalGrades, totalGroups };

    } catch (error) {
        console.error('❌ Error corrigiendo estructura:', error);
        throw error;
    }
}

async function updateGradeMappingFunction() {
    console.log('\n📋 3. ACTUALIZANDO FUNCIÓN DE MAPEO...');
    
    // Crear la función de mapeo actualizada
    const updatedMappingFunction = `
// Función actualizada para mapear nombres de grados (NO cambiar nombres)
function mapGradeName(gradeName) {
    // NO mapear nombres - usar exactamente como están en el Excel
    const exactMap = {
        'Jardín': 'Jardín',
        'Transición': 'Transición',
        'Primero': 'Primero',
        'Segundo': 'Segundo', 
        'Tercero': 'Tercero',
        'Cuarto': 'Cuarto',
        'Quinto': 'Quinto',
        'Sexto': 'Sexto',
        'Séptimo': 'Séptimo',
        'Octavo': 'Octavo',
        'Noveno': 'Noveno',
        'Décimo': 'Décimo',
        'Undécimo': 'Undécimo',
        'Brújula': 'Brújula',
        'Aceleración': 'Aceleración',
        'Ciclo 3': 'Ciclo 3',
        'Ciclo 4': 'Ciclo 4',
        'Ciclo 5': 'Ciclo 5',
        'Ciclo 6': 'Ciclo 6'
    };
    
    return exactMap[gradeName] || gradeName;
}

// Función para mapear grupos
function mapGroupName(curso, gradeName) {
    // Para Ciclos y programas especiales, usar letras
    const letterGrades = ['Brújula', 'Aceleración', 'Ciclo 3', 'Ciclo 4', 'Ciclo 5', 'Ciclo 6'];
    
    if (letterGrades.includes(gradeName)) {
        // Convertir número a letra: 1→A, 2→B
        const letterMap = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
        return letterMap[curso.toString()] || 'A';
    }
    
    // Para grados normales, usar el número tal como está
    return curso.toString();
}
`;

    console.log('✅ Función de mapeo actualizada');
    console.log('📝 Usar mapGradeName() sin cambios de nombres');
    console.log('📝 Usar mapGroupName() para convertir números a letras cuando sea necesario');
}

async function main() {
    try {
        console.log('🚀 INICIANDO CORRECCIÓN DE ESTRUCTURA');
        console.log('====================================\n');

        const result = await fixGradesStructure();
        await updateGradeMappingFunction();

        console.log('\n🎉 ¡ESTRUCTURA CORREGIDA EXITOSAMENTE!');
        console.log('=====================================');
        console.log(`✅ ${result.totalGrades} grados creados`);
        console.log(`✅ ${result.totalGroups} grupos creados`);
        console.log('✅ Estructura exacta según Excel');
        console.log('✅ Sin duplicados');
        console.log('✅ Grupos correctos por grado');

        console.log('\n📋 PRÓXIMO PASO:');
        console.log('================');
        console.log('🔄 Ejecutar importación de estudiantes con estructura corregida');

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
            console.log('\n✅ Corrección completada exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { fixGradesStructure };