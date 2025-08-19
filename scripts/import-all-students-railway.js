#!/usr/bin/env node

/**
 * Script corregido para importar TODOS los estudiantes a Railway
 * Adaptado para las columnas reales del archivo Excel
 */

const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

// Función para generar email según el formato especificado
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

// Función para generar teléfono aleatorio colombiano
function generateRandomPhone() {
    const prefixes = ['300', '301', '302', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '322', '323'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 9000000) + 1000000;
    return `${prefix}${number}`;
}

// Función para mapear nombres de grados
function mapGradeName(gradeName) {
    const gradeMap = {
        'Jardín': 'Preescolar',
        'JARDÍN': 'Preescolar',
        'Transición': 'Preescolar',
        'TRANSICIÓN': 'Preescolar',
        'Preescolar': 'Preescolar',
        'PREESCOLAR': 'Preescolar',
        '0': 'Preescolar',
        '1': 'Primero',
        'Primero': 'Primero',
        'PRIMERO': 'Primero',
        '2': 'Segundo',
        'Segundo': 'Segundo',
        'SEGUNDO': 'Segundo',
        '3': 'Tercero',
        'Tercero': 'Tercero',
        'TERCERO': 'Tercero',
        '4': 'Cuarto',
        'Cuarto': 'Cuarto',
        'CUARTO': 'Cuarto',
        '5': 'Quinto',
        'Quinto': 'Quinto',
        'QUINTO': 'Quinto',
        '6': 'Sexto',
        'Sexto': 'Sexto',
        'SEXTO': 'Sexto',
        '7': 'Séptimo',
        'Séptimo': 'Séptimo',
        'SÉPTIMO': 'Séptimo',
        '8': 'Octavo',
        'Octavo': 'Octavo',
        'OCTAVO': 'Octavo',
        '9': 'Noveno',
        'Noveno': 'Noveno',
        'NOVENO': 'Noveno',
        '10': 'Décimo',
        'Décimo': 'Décimo',
        'DÉCIMO': 'Décimo',
        '11': 'Undécimo',
        'Undécimo': 'Undécimo',
        'UNDÉCIMO': 'Undécimo'
    };
    
    return gradeMap[gradeName] || gradeName;
}

async function importAllStudents() {
    console.log('📚 IMPORTANDO TODOS LOS ESTUDIANTES A RAILWAY');
    console.log('============================================\n');

    try {
        // Verificar archivo Excel
        const filePath = path.join(__dirname, '..', 'estudiantes.xlsx');
        console.log(`📁 Archivo: ${filePath}`);
        
        console.log('📖 Leyendo archivo Excel...');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const studentsData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`📊 Total de registros encontrados: ${studentsData.length}`);
        console.log('📋 Columnas disponibles:', Object.keys(studentsData[0] || {}));
        
        // Obtener grados existentes
        const existingGrades = await prisma.grade.findMany({
            include: { groups: true }
        });
        console.log('📚 Grados disponibles:', existingGrades.map(g => g.name));
        
        let imported = 0;
        let errors = 0;
        let skipped = 0;
        
        for (const [index, studentRow] of studentsData.entries()) {
            try {
                console.log(`\n📝 Procesando registro ${index + 1}/${studentsData.length}`);
                
                // Extraer datos usando las columnas REALES del archivo
                const document = studentRow['Identificación'];
                const nombreCompleto = studentRow['Estudiante'];
                const grado = studentRow['grado'];
                const curso = studentRow['curso'];
                
                // Validar campos requeridos
                if (!document || !nombreCompleto || !grado) {
                    console.log(`⚠️  Saltando registro ${index + 1}: datos incompletos`);
                    console.log(`   Documento: ${document}, Nombre: ${nombreCompleto}, Grado: ${grado}`);
                    errors++;
                    continue;
                }
                
                // Separar nombres y apellidos
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
                    console.log(`⚠️  Documento inválido: ${document} para ${nombres} ${apellidos}`);
                    errors++;
                    continue;
                }
                
                // Verificar si ya existe
                const existingStudent = await prisma.student.findUnique({
                    where: { document: cleanDocument }
                });
                
                if (existingStudent) {
                    console.log(`⚠️  Estudiante ya existe: ${nombres} ${apellidos} (${cleanDocument})`);
                    skipped++;
                    continue;
                }
                
                // Generar email y teléfono
                const email = generateEmail(nombres, apellidos, cleanDocument);
                const phone = generateRandomPhone();
                
                // Mapear grado
                const mappedGradeName = mapGradeName(grado);
                const grade = existingGrades.find(g => g.name === mappedGradeName);
                
                if (!grade) {
                    console.log(`⚠️  Grado no encontrado: ${grado} (${mappedGradeName}) para ${nombres} ${apellidos}`);
                    errors++;
                    continue;
                }
                
                // Determinar grupo
                let groupName = '01';
                if (curso) {
                    const cursoNum = parseInt(curso);
                    if (!isNaN(cursoNum) && cursoNum >= 1 && cursoNum <= 6) {
                        groupName = cursoNum.toString().padStart(2, '0');
                    }
                }
                
                const group = grade.groups.find(g => g.name === groupName);
                if (!group) {
                    console.log(`⚠️  Grupo no encontrado: ${groupName} para grado ${grade.name}`);
                    errors++;
                    continue;
                }
                
                console.log(`✅ Creando estudiante: ${nombres} ${apellidos}`);
                console.log(`   📧 Email: ${email}`);
                console.log(`   📱 Teléfono: ${phone}`);
                console.log(`   🎓 Grado: ${grade.name} - Grupo: ${group.name}`);
                
                // Crear estudiante
                await prisma.student.create({
                    data: {
                        documentType: 'TI',
                        document: cleanDocument,
                        firstName: nombres,
                        lastName: apellidos,
                        birthDate: new Date(2010, 0, 1), // Fecha genérica
                        gender: 'M', // Género genérico
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
                console.log(`✅ Importado exitosamente: ${nombres} ${apellidos}`);
                
                // Mostrar progreso cada 100 estudiantes
                if (imported % 100 === 0) {
                    console.log(`\n🎯 PROGRESO: ${imported}/${studentsData.length} estudiantes importados`);
                }
                
            } catch (error) {
                console.error(`❌ Error procesando registro ${index + 1}:`, error.message);
                errors++;
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('🎉 IMPORTACIÓN COMPLETADA');
        console.log('='.repeat(50));
        console.log(`✅ Estudiantes importados: ${imported}`);
        console.log(`⚠️  Estudiantes ya existentes: ${skipped}`);
        console.log(`❌ Errores: ${errors}`);
        console.log(`📊 Total procesados: ${studentsData.length}`);
        
        if (imported + skipped + errors === studentsData.length) {
            console.log('\n✅ ¡TODOS LOS REGISTROS FUERON PROCESADOS!');
        } else {
            console.log('\n⚠️ Algunos registros no fueron procesados');
        }
        
    } catch (error) {
        console.error('❌ Error durante la importación:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    importAllStudents()
        .then(() => {
            console.log('\n✅ Importación completada exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { importAllStudents };