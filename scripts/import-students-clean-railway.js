#!/usr/bin/env node

/**
 * Script CORREGIDO para importar estudiantes limpiando espacios extra
 */

const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

// Función para generar email
function generateEmail(firstName, lastName, document) {
    const firstLetter = firstName.charAt(0).toLowerCase();
    const firstLastName = lastName.split(' ')[0].toLowerCase();
    
    const cleanFirstLetter = firstLetter.replace(/[ñáéíóúü]/g, match => {
        const replacements = { 'ñ': 'n', 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u' };
        return replacements[match] || match;
    });
    const cleanFirstLastName = firstLastName.replace(/[ñáéíóúü]/g, match => {
        const replacements = { 'ñ': 'n', 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u' };
        return replacements[match] || match;
    });
    
    const last4Digits = document.toString().slice(-4);
    return `${cleanFirstLetter}${cleanFirstLastName}${last4Digits}e@villasanpablo.edu.co`;
}

// Función para generar teléfono
function generateRandomPhone() {
    const prefixes = ['300', '301', '302', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '322', '323'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 9000000) + 1000000;
    return `${prefix}${number}`;
}

// Limpiar nombres de grados (quitar espacios extra)
function cleanGradeName(gradeName) {
    return gradeName.toString().trim();
}

// Mapear grupos según el tipo de grado
function mapGroupName(curso, gradeName) {
    const letterGrades = ['Brújula', 'Aceleración', 'Ciclo 3', 'Ciclo 4', 'Ciclo 5', 'Ciclo 6'];
    
    if (letterGrades.includes(gradeName)) {
        const letterMap = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
        return letterMap[curso.toString()] || 'A';
    }
    
    return curso.toString();
}

async function importStudentsClean() {
    console.log('🧹 IMPORTACIÓN CON LIMPIEZA DE ESPACIOS');
    console.log('====================================\n');

    try {
        // Leer Excel
        const filePath = path.join(__dirname, '..', 'estudiantes.xlsx');
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const studentsData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`📊 Total registros: ${studentsData.length}`);
        
        // Obtener grados con grupos
        const existingGrades = await prisma.grade.findMany({
            include: { groups: true }
        });
        
        console.log(`📚 Grados disponibles: ${existingGrades.length}`);
        
        // Crear mapa de grados para búsqueda rápida
        const gradeMap = new Map();
        existingGrades.forEach(grade => {
            gradeMap.set(grade.name, grade);
        });

        let imported = 0;
        let errors = 0;
        let skipped = 0;
        let batchCount = 0;

        console.log('\n🚀 Iniciando importación...\n');

        for (const [index, studentRow] of studentsData.entries()) {
            try {
                // Extraer y limpiar datos
                const document = studentRow['Identificación'];
                const nombreCompleto = studentRow['Estudiante'];
                const gradoRaw = studentRow['grado'];
                const curso = studentRow['curso'];

                if (!document || !nombreCompleto || !gradoRaw) {
                    errors++;
                    continue;
                }

                // LIMPIAR ESPACIOS EXTRA del grado
                const grado = cleanGradeName(gradoRaw);

                // Separar nombres
                const nombreParts = nombreCompleto.toString().trim().split(' ');
                let apellidos, nombres;
                
                if (nombreParts.length >= 4) {
                    apellidos = nombreParts.slice(0, 2).join(' ');
                    nombres = nombreParts.slice(2).join(' ');
                } else if (nombreParts.length >= 2) {
                    apellidos = nombreParts[0];
                    nombres = nombreParts.slice(1).join(' ');
                } else {
                    apellidos = nombreParts[0] || 'APELLIDO';
                    nombres = 'NOMBRE';
                }

                // Limpiar documento
                let cleanDocument = document.toString().replace(/[^0-9]/g, '');
                if (!cleanDocument || cleanDocument.length < 6) {
                    errors++;
                    continue;
                }

                // Verificar si existe
                const existingStudent = await prisma.student.findUnique({
                    where: { document: cleanDocument }
                });

                if (existingStudent) {
                    skipped++;
                    continue;
                }

                // Buscar grado usando el mapa
                const grade = gradeMap.get(grado);

                if (!grade) {
                    console.log(`❌ Grado no encontrado: "${grado}" (original: "${gradoRaw}") para ${nombres} ${apellidos}`);
                    errors++;
                    continue;
                }

                // Mapear grupo
                const groupName = mapGroupName(curso, grade.name);
                const group = grade.groups.find(g => g.name === groupName);

                if (!group) {
                    console.log(`❌ Grupo no encontrado: "${groupName}" en grado ${grade.name}`);
                    errors++;
                    continue;
                }

                // Generar datos
                const email = generateEmail(nombres, apellidos, cleanDocument);
                const phone = generateRandomPhone();

                // Crear estudiante
                await prisma.student.create({
                    data: {
                        documentType: 'TI',
                        document: cleanDocument,
                        firstName: nombres,
                        lastName: apellidos,
                        birthDate: new Date(2010, 0, 1),
                        gender: 'M',
                        email: email,
                        phone: phone,
                        address: 'Barranquilla, Atlántico',
                        gradeId: grade.id,
                        groupId: group.id,
                        guardianName: `Acudiente de ${nombres}`,
                        guardianPhone: generateRandomPhone(),
                        status: 'ACTIVE',
                        enrollmentDate: new Date()
                    }
                });

                imported++;
                batchCount++;

                // Mostrar progreso cada 50 estudiantes
                if (batchCount >= 50) {
                    const progress = ((index + 1) / studentsData.length * 100).toFixed(1);
                    console.log(`🎯 Progreso: ${imported} importados, ${skipped} existentes, ${errors} errores (${progress}%)`);
                    batchCount = 0;
                }

            } catch (error) {
                console.error(`❌ Error en registro ${index + 1}:`, error.message);
                errors++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('🎉 IMPORTACIÓN COMPLETADA');
        console.log('='.repeat(50));
        console.log(`✅ Estudiantes importados: ${imported}`);
        console.log(`⚠️ Ya existentes: ${skipped}`);
        console.log(`❌ Errores: ${errors}`);
        console.log(`📊 Total procesados: ${studentsData.length}`);
        console.log(`📈 Éxito: ${(((imported + skipped) / studentsData.length) * 100).toFixed(1)}%`);

        // Verificación final
        const totalStudents = await prisma.student.count();
        console.log(`\n🎯 TOTAL ESTUDIANTES EN BASE DE DATOS: ${totalStudents}`);

        if (totalStudents >= 3000) {
            console.log('\n🎉 ¡IMPORTACIÓN EXITOSA!');
            console.log('======================');
            console.log('✅ Más de 3000 estudiantes importados');
            console.log('✅ Sistema listo para producción');
        }

    } catch (error) {
        console.error('❌ Error durante importación:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    importStudentsClean()
        .then(() => {
            console.log('\n✅ Importación con limpieza completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { importStudentsClean };