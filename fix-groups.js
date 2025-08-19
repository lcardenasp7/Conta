const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Función para analizar grupos reales del Excel
async function analyzeExcelGroups() {
    console.log('🔍 ANALIZANDO GRUPOS REALES DEL EXCEL');
    console.log('═══════════════════════════════════');
    
    try {
        const filePath = path.join(__dirname, 'estudiantes.xlsx');
        if (!fs.existsSync(filePath)) {
            throw new Error(`Archivo no encontrado: ${filePath}`);
        }
        
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // Analizar grupos por grado
        const gradeGroups = new Map();
        
        for (const row of data.slice(1)) {
            if (row[3] && row[4]) { // grado y curso
                const grade = row[3].toString().trim();
                const group = row[4].toString().trim();
                
                if (!gradeGroups.has(grade)) {
                    gradeGroups.set(grade, new Set());
                }
                gradeGroups.get(grade).add(group);
            }
        }
        
        // Convertir a estructura ordenada
        const result = {};
        for (const [grade, groupsSet] of gradeGroups) {
            result[grade] = Array.from(groupsSet).sort((a, b) => {
                // Ordenar números primero, luego letras
                if (!isNaN(a) && !isNaN(b)) return parseInt(a) - parseInt(b);
                if (!isNaN(a) && isNaN(b)) return -1;
                if (isNaN(a) && !isNaN(b)) return 1;
                return a.localeCompare(b);
            });
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Error analizando Excel:', error);
        return null;
    }
}

// Función para recrear grupos según el Excel
async function recreateGroups() {
    console.log('🔧 RECREANDO GRUPOS SEGÚN EL EXCEL');
    console.log('═══════════════════════════════════');
    
    try {
        // 1. Analizar grupos del Excel
        const excelGroups = await analyzeExcelGroups();
        if (!excelGroups) {
            throw new Error('No se pudo analizar el Excel');
        }
        
        // 2. Mostrar análisis
        console.log('\n📊 GRUPOS ENCONTRADOS EN EL EXCEL:');
        for (const [grade, groups] of Object.entries(excelGroups)) {
            console.log(`  ${grade}: [${groups.join(', ')}] (${groups.length} grupos)`);
        }
        
        // 3. Obtener grados existentes
        const existingGrades = await prisma.grade.findMany({
            select: { id: true, name: true }
        });
        
        const gradeMap = new Map();
        existingGrades.forEach(g => gradeMap.set(g.name, g.id));
        
        // 4. Eliminar grupos existentes (solo si no tienen estudiantes asignados)
        console.log('\n🗑️ Eliminando grupos existentes...');
        await prisma.group.deleteMany({
            where: {
                students: { none: {} } // Solo eliminar grupos sin estudiantes
            }
        });
        
        // 5. Crear nuevos grupos
        console.log('\n➕ Creando nuevos grupos...');
        let createdCount = 0;
        
        for (const [gradeName, groups] of Object.entries(excelGroups)) {
            const gradeId = gradeMap.get(gradeName);
            
            if (!gradeId) {
                console.warn(`⚠️ Grado no encontrado en BD: ${gradeName}`);
                continue;
            }
            
            for (const groupName of groups) {
                try {
                    await prisma.group.create({
                        data: {
                            name: groupName,
                            gradeId: gradeId,
                            capacity: 35, // Capacidad estándar
                            year: new Date().getFullYear()
                        }
                    });
                    createdCount++;
                    console.log(`  ✅ ${gradeName} - Grupo ${groupName}`);
                } catch (error) {
                    console.log(`  ⚠️ Ya existe: ${gradeName} - Grupo ${groupName}`);
                }
            }
        }
        
        console.log(`\n✅ COMPLETADO: ${createdCount} grupos creados`);
        
        // 6. Verificar resultado
        console.log('\n🔍 VERIFICACIÓN FINAL:');
        const finalGroups = await prisma.grade.findMany({
            include: {
                groups: {
                    orderBy: { name: 'asc' }
                }
            },
            orderBy: { order: 'asc' }
        });
        
        finalGroups.forEach(grade => {
            if (grade.groups.length > 0) {
                const groupNames = grade.groups.map(g => g.name);
                console.log(`  ${grade.name}: [${groupNames.join(', ')}]`);
            }
        });
        
        return true;
        
    } catch (error) {
        console.error('❌ Error recreando grupos:', error);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

// Función para limpiar estudiantes de prueba
async function cleanTestStudents() {
    console.log('🧹 LIMPIANDO ESTUDIANTES DE PRUEBA');
    console.log('═══════════════════════════════════');
    
    try {
        // Eliminar estudiantes que claramente son de prueba
        const result = await prisma.student.deleteMany({
            where: {
                OR: [
                    { firstName: { startsWith: 'Estudiante' } },
                    { email: { contains: 'estudiante' } },
                    { document: { gte: '1000000001', lte: '1000000030' } }
                ]
            }
        });
        
        console.log(`✅ ${result.count} estudiantes de prueba eliminados`);
        return true;
        
    } catch (error) {
        console.error('❌ Error limpiando estudiantes:', error);
        return false;
    }
}

// Función principal
async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'analyze':
            const groups = await analyzeExcelGroups();
            if (groups) {
                console.log('\n📊 ANÁLISIS COMPLETADO');
                console.log('Use: node fix-groups.js recreate');
            }
            break;
            
        case 'clean':
            await cleanTestStudents();
            break;
            
        case 'recreate':
            const success = await recreateGroups();
            if (success) {
                console.log('\n🎉 GRUPOS RECREADOS EXITOSAMENTE');
                console.log('Ahora puedes ejecutar: node import-students.js import');
            }
            break;
            
        case 'full':
            console.log('🚀 PROCESO COMPLETO DE CORRECCIÓN');
            console.log('═══════════════════════════════════');
            
            console.log('\n1️⃣ Limpiando estudiantes de prueba...');
            await cleanTestStudents();
            
            console.log('\n2️⃣ Recreando grupos...');
            const fullSuccess = await recreateGroups();
            
            if (fullSuccess) {
                console.log('\n🎉 PROCESO COMPLETO EXITOSO');
                console.log('✅ Base de datos lista para importación');
                console.log('🔄 Ejecuta: node import-students.js import');
            }
            break;
            
        default:
            console.log('🔧 SCRIPT DE CORRECCIÓN DE GRUPOS');
            console.log('═══════════════════════════════════');
            console.log('Comandos disponibles:');
            console.log('  node fix-groups.js analyze  - Analizar grupos del Excel');
            console.log('  node fix-groups.js clean    - Limpiar estudiantes de prueba');
            console.log('  node fix-groups.js recreate - Recrear grupos según Excel');
            console.log('  node fix-groups.js full     - Proceso completo (recomendado)');
            console.log('\nRecomendación: Ejecuta "full" para corregir todo de una vez');
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    analyzeExcelGroups,
    recreateGroups,
    cleanTestStudents
};