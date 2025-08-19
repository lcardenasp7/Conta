const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function createExactGroups() {
    console.log('🎯 CREANDO GRUPOS EXACTOS SEGÚN EXCEL');
    console.log('════════════════════════════════════');
    
    try {
        // 1. Leer Excel y obtener grupos reales
        const filePath = path.join(__dirname, 'estudiantes.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets['Hoja1'];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        console.log('📊 Analizando grupos del Excel...');
        
        // 2. Mapear grupos reales
        const gradeGroupMap = new Map();
        const studentData = data.slice(1);
        
        for (const row of studentData) {
            const [nro, identificacion, estudiante, grado, curso] = row;
            if (!grado || !curso) continue;
            
            const gradeName = grado.toString().trim();
            const groupName = curso.toString().trim();
            
            if (!gradeGroupMap.has(gradeName)) {
                gradeGroupMap.set(gradeName, new Set());
            }
            gradeGroupMap.get(gradeName).add(groupName);
        }
        
        console.log('✅ Análisis completado');
        
        // 3. Obtener grados de la base de datos
        const grades = await prisma.grade.findMany({
            include: { groups: true }
        });
        
        const gradeDbMap = new Map();
        grades.forEach(grade => {
            gradeDbMap.set(grade.name, grade);
        });
        
        console.log('\n🆕 CREANDO GRUPOS FALTANTES...');
        let createdCount = 0;
        let existingCount = 0;
        let errorCount = 0;
        
        // 4. Crear grupos para cada grado
        for (const [gradeName, requiredGroups] of gradeGroupMap) {
            const grade = gradeDbMap.get(gradeName);
            if (!grade) {
                console.log(`❌ Grado "${gradeName}" no encontrado en DB`);
                console.log(`   🔍 Grados disponibles: ${Array.from(gradeDbMap.keys()).join(', ')}`);
                errorCount++;
                continue;
            }
            
            console.log(`\n📚 ${gradeName}:`);
            
            const existingGroupNames = grade.groups.map(g => g.name);
            const sortedGroups = Array.from(requiredGroups).sort((a, b) => {
                if (!isNaN(a) && !isNaN(b)) return parseInt(a) - parseInt(b);
                return a.localeCompare(b);
            });
            
            for (const groupName of sortedGroups) {
                if (!existingGroupNames.includes(groupName)) {
                    try {
                        // ✅ Usando solo los campos que existen en el esquema
                        await prisma.group.create({
                            data: {
                                name: groupName,
                                gradeId: grade.id
                                // Campos removidos: capacity, isActive (no existen en el esquema)
                                // Campos opcionales: id, teacherName, classroom, year, createdAt, updatedAt se manejan automáticamente
                            }
                        });
                        
                        console.log(`  ✅ Creado: ${groupName}`);
                        createdCount++;
                    } catch (error) {
                        console.log(`  ❌ Error creando ${groupName}: ${error.message}`);
                        errorCount++;
                    }
                } else {
                    console.log(`  ℹ️  Ya existe: ${groupName}`);
                    existingCount++;
                }
            }
        }
        
        // 5. Eliminar grupos que YA NO SE USAN
        console.log('\n🗑️  ELIMINANDO GRUPOS OBSOLETOS...');
        
        const gruposObsoletos = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
        let deletedCount = 0;
        
        for (const grade of grades) {
            const requiredGroups = gradeGroupMap.get(grade.name);
            if (!requiredGroups) continue;
            
            const requiredGroupsArray = Array.from(requiredGroups);
            
            for (const group of grade.groups) {
                if (!requiredGroupsArray.includes(group.name) && gruposObsoletos.includes(group.name)) {
                    try {
                        const studentCount = await prisma.student.count({
                            where: { groupId: group.id }
                        });
                        
                        if (studentCount === 0) {
                            await prisma.group.delete({
                                where: { id: group.id }
                            });
                            console.log(`  🗑️  Eliminado grupo obsoleto: ${grade.name} - ${group.name}`);
                            deletedCount++;
                        } else {
                            console.log(`  ⚠️  No se puede eliminar ${grade.name} - ${group.name}: tiene ${studentCount} estudiantes`);
                        }
                    } catch (error) {
                        console.log(`  ❌ Error eliminando ${grade.name} - ${group.name}: ${error.message}`);
                    }
                }
            }
        }
        
        // 6. Resumen final
        console.log('\n📊 RESUMEN FINAL:');
        console.log('═════════════════');
        console.log(`✅ Grupos creados: ${createdCount}`);
        console.log(`ℹ️  Grupos existentes: ${existingCount}`);
        console.log(`🗑️  Grupos eliminados: ${deletedCount}`);
        console.log(`❌ Errores: ${errorCount}`);
        
        // 7. Mostrar estructura final
        const finalStats = await prisma.grade.findMany({
            include: {
                groups: { orderBy: { name: 'asc' } }
            },
            orderBy: { order: 'asc' }
        });
        
        console.log('\n🎯 ESTRUCTURA FINAL DE GRUPOS:');
        console.log('══════════════════════════════');
        finalStats.forEach(grade => {
            const groupNames = grade.groups.map(g => g.name);
            
            const sortedNames = groupNames.sort((a, b) => {
                if (!isNaN(a) && !isNaN(b)) return parseInt(a) - parseInt(b);
                return a.localeCompare(b);
            });
            
            console.log(`${grade.name}: [${sortedNames.join(', ')}] (${groupNames.length} grupos)`);
        });
        
        console.log('\n🎉 ¡GRUPOS CORREGIDOS!');
        console.log('Ahora ejecuta: node import-students.js import');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createExactGroups();