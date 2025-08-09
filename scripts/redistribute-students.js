const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Function to map grade names to our system
function mapGrade(gradeName) {
    const gradeMap = {
        '6': 'Sexto',
        'SEXTO': 'Sexto',
        '6°': 'Sexto',
        '7': 'Séptimo',
        'SÉPTIMO': 'Séptimo',
        'SEPTIMO': 'Séptimo',
        '7°': 'Séptimo',
        '8': 'Octavo',
        'OCTAVO': 'Octavo',
        '8°': 'Octavo',
        '9': 'Noveno',
        'NOVENO': 'Noveno',
        '9°': 'Noveno',
        '10': 'Décimo',
        'DÉCIMO': 'Décimo',
        'DECIMO': 'Décimo',
        '10°': 'Décimo',
        '11': 'Undécimo',
        'UNDÉCIMO': 'Undécimo',
        'ONCE': 'Undécimo',
        '11°': 'Undécimo'
    };
    
    const normalizedGrade = gradeName.toString().toUpperCase().trim();
    return gradeMap[normalizedGrade] || gradeName;
}

async function redistributeStudents() {
    try {
        console.log('🔄 REDISTRIBUYENDO ESTUDIANTES A GRUPOS CORRECTOS');
        console.log('=' .repeat(60));
        
        // Path to the Excel file
        const filePath = path.join(process.env.USERPROFILE, 'Documents', 'BASE DE DATOS ESTUDIANTES.xlsx');
        
        if (!fs.existsSync(filePath)) {
            console.error('❌ No se encontró el archivo BASE DE DATOS ESTUDIANTES.xlsx');
            return;
        }
        
        console.log('📖 Leyendo archivo Excel...');
        
        // Read the Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const studentsData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`📊 Encontrados ${studentsData.length} estudiantes en el archivo`);
        
        // Get existing grades and groups
        const existingGrades = await prisma.grade.findMany({
            include: { groups: true }
        });
        
        let updated = 0;
        let errors = 0;
        
        for (const studentRow of studentsData) {
            try {
                let document = studentRow['Identificación'] || studentRow['DOCUMENTO'] || studentRow['DOC'] || studentRow['CEDULA'] || studentRow['ID'];
                const fullName = studentRow['Nombre Completo'] || studentRow['NOMBRES'] || studentRow['NOMBRE'];
                const gradeName = studentRow['GRADO'] || studentRow['CURSO'] || studentRow['GRADE'];
                const groupName = studentRow['CURSO'] || studentRow['GRUPO'] || studentRow['SECCION'] || studentRow['GROUP'] || '1';
                
                if (!document || !fullName || !gradeName) {
                    continue;
                }
                
                // Handle documents starting with 'N'
                if (document.toString().startsWith('N')) {
                    document = document.toString().substring(1);
                }
                
                // Map grade name
                const mappedGradeName = mapGrade(gradeName);
                
                // Find grade in database
                const grade = existingGrades.find(g => g.name === mappedGradeName);
                if (!grade) {
                    continue;
                }
                
                // Map course number to group name (1->01, 2->02, etc.)
                let groupNumber = '01';
                if (groupName) {
                    const courseNum = parseInt(groupName.toString());
                    if (courseNum >= 1 && courseNum <= 7) {
                        groupNumber = courseNum.toString().padStart(2, '0');
                    }
                }
                
                // Find the correct group
                const targetGroup = grade.groups.find(g => g.name === groupNumber);
                if (!targetGroup) {
                    console.log(`⚠️  Grupo ${groupNumber} no encontrado en ${grade.name}`);
                    errors++;
                    continue;
                }
                
                // Find student in database
                const student = await prisma.student.findUnique({
                    where: { document: document.toString() }
                });
                
                if (!student) {
                    continue; // Student not found, skip
                }
                
                // Check if student is already in the correct group
                if (student.groupId === targetGroup.id) {
                    continue; // Already in correct group
                }
                
                // Update student's group
                await prisma.student.update({
                    where: { id: student.id },
                    data: { groupId: targetGroup.id }
                });
                
                console.log(`✅ ${fullName} → ${grade.name} Grupo ${groupNumber}`);
                updated++;
                
            } catch (error) {
                console.error(`❌ Error procesando estudiante: ${error.message}`);
                errors++;
            }
        }
        
        console.log('\n📊 RESUMEN DE REDISTRIBUCIÓN:');
        console.log(`✅ Estudiantes redistribuidos: ${updated}`);
        console.log(`❌ Errores: ${errors}`);
        
        // Show final distribution
        console.log('\n📋 DISTRIBUCIÓN FINAL:');
        const finalGrades = await prisma.grade.findMany({
            include: {
                groups: {
                    include: {
                        students: true
                    },
                    orderBy: { name: 'asc' }
                }
            },
            orderBy: { order: 'asc' }
        });
        
        finalGrades.forEach(grade => {
            const totalStudents = grade.groups.reduce((sum, group) => sum + group.students.length, 0);
            if (totalStudents > 0) {
                console.log(`\n${grade.name} (${totalStudents} estudiantes):`);
                grade.groups.forEach(group => {
                    if (group.students.length > 0) {
                        console.log(`  - Grupo ${group.name}: ${group.students.length} estudiantes`);
                    }
                });
            }
        });
        
        console.log('\n' + '='.repeat(60));
        
    } catch (error) {
        console.error('❌ Error en redistribución:', error);
    } finally {
        await prisma.$disconnect();
    }
}

redistributeStudents();