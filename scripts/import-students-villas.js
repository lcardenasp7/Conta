const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Función para generar email según el formato especificado
function generateEmail(firstName, lastName, document) {
    // Primera letra del nombre
    const firstLetter = firstName.charAt(0).toLowerCase();
    
    // Primer apellido (tomar hasta el primer espacio)
    const firstLastName = lastName.split(' ')[0].toLowerCase();
    
    // Limpiar caracteres especiales para email
    const cleanFirstLetter = firstLetter.replace(/[ñáéíóúü]/g, match => {
        const replacements = { 'ñ': 'n', 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u' };
        return replacements[match] || match;
    });
    const cleanFirstLastName = firstLastName.replace(/[ñáéíóúü]/g, match => {
        const replacements = { 'ñ': 'n', 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u' };
        return replacements[match] || match;
    });
    
    // Últimos 4 dígitos del documento
    const last4Digits = document.toString().slice(-4);
    
    // Formato: primeraLetra + primerApellido + ultimos4digitos + e@villasanpablo.edu.co
    return `${cleanFirstLetter}${cleanFirstLastName}${last4Digits}e@villasanpablo.edu.co`;
}

// Función para generar teléfono aleatorio colombiano
function generateRandomPhone() {
    const prefixes = ['300', '301', '302', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '322', '323'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 9000000) + 1000000; // 7 dígitos
    return `${prefix}${number}`;
}

// Función para mapear nombres de grados
function mapGradeName(gradeName) {
    const gradeMap = {
        '0': 'Preescolar',
        'PREESCOLAR': 'Preescolar',
        'PREJARDÍN': 'Preescolar',
        'JARDÍN': 'Preescolar',
        'TRANSICIÓN': 'Preescolar',
        '1': 'Primero',
        'PRIMERO': 'Primero',
        '1°': 'Primero',
        '2': 'Segundo',
        'SEGUNDO': 'Segundo',
        '2°': 'Segundo',
        '3': 'Tercero',
        'TERCERO': 'Tercero',
        '3°': 'Tercero',
        '4': 'Cuarto',
        'CUARTO': 'Cuarto',
        '4°': 'Cuarto',
        '5': 'Quinto',
        'QUINTO': 'Quinto',
        '5°': 'Quinto',
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

async function importStudentsFromExcel() {
    try {
        console.log('🔍 Buscando archivo BASE DE DATOS ESTUDIANTES.xlsx...');
        
        const filePath = path.join(process.env.USERPROFILE, 'Documents', 'BASE DE DATOS ESTUDIANTES.xlsx');
        
        if (!fs.existsSync(filePath)) {
            console.error('❌ No se encontró el archivo BASE DE DATOS ESTUDIANTES.xlsx en Documentos');
            return;
        }
        
        console.log('📖 Leyendo archivo Excel...');
        
        // Leer archivo Excel
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON
        const studentsData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`📊 Encontrados ${studentsData.length} registros en el archivo`);
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
                console.log('Datos del registro:', studentRow);
                
                // Extraer datos del Excel (ajustar nombres de columnas según el archivo real)
                const document = studentRow['Identificación'] || studentRow['DOCUMENTO'] || studentRow['Documento'] || studentRow['ID'];
                const nombreCompleto = studentRow['Nombre Completo'] || studentRow['NOMBRE_COMPLETO'] || studentRow['NOMBRES'];
                const grado = studentRow['GRADO'] || studentRow['Grado'] || studentRow['CURSO'];
                const curso = studentRow['CURSO'] || studentRow['Curso'] || studentRow['GRUPO'] || studentRow['Seccion'];
                
                // Validar campos requeridos
                if (!document || !nombreCompleto || !grado) {
                    console.log(`⚠️  Saltando registro ${index + 1}: datos incompletos`);
                    console.log(`   Documento: ${document}, Nombre: ${nombreCompleto}, Grado: ${grado}`);
                    errors++;
                    continue;
                }
                
                // Separar nombres y apellidos del nombre completo
                // Formato esperado: "APELLIDOS NOMBRES" 
                const nombreParts = nombreCompleto.toString().trim().split(' ');
                let apellidos, nombres;
                
                if (nombreParts.length >= 4) {
                    // Asumir que los primeros 2 son apellidos y el resto nombres
                    apellidos = nombreParts.slice(0, 2).join(' ');
                    nombres = nombreParts.slice(2).join(' ');
                } else if (nombreParts.length >= 2) {
                    // Tomar la primera parte como apellido, el resto como nombres
                    apellidos = nombreParts[0];
                    nombres = nombreParts.slice(1).join(' ');
                } else {
                    apellidos = nombreParts[0] || 'APELLIDO';
                    nombres = 'NOMBRE';
                }
                
                // Limpiar documento (remover caracteres no numéricos)
                let cleanDocument = document.toString().replace(/[^0-9]/g, '');
                if (!cleanDocument || cleanDocument.length < 6) {
                    console.log(`⚠️  Documento inválido: ${document} para ${nombres} ${apellidos}`);
                    errors++;
                    continue;
                }
                
                // Verificar si el estudiante ya existe
                const existingStudent = await prisma.student.findUnique({
                    where: { document: cleanDocument }
                });
                
                if (existingStudent) {
                    console.log(`⚠️  Estudiante ya existe: ${nombres} ${apellidos} (${cleanDocument})`);
                    skipped++;
                    continue;
                }
                
                // Generar email según formato especificado
                const email = generateEmail(nombres, apellidos, cleanDocument);
                
                // Generar teléfono aleatorio
                const phone = generateRandomPhone();
                
                // Mapear grado
                const mappedGradeName = mapGradeName(grado);
                const grade = existingGrades.find(g => g.name === mappedGradeName);
                
                if (!grade) {
                    console.log(`⚠️  Grado no encontrado: ${grado} (${mappedGradeName}) para ${nombres} ${apellidos}`);
                    errors++;
                    continue;
                }
                
                // Determinar grupo - usar curso con formato numérico (01, 02, 03, etc.)
                let groupName = '01'; // Grupo por defecto
                if (curso) {
                    const cursoNum = parseInt(curso.toString());
                    if (!isNaN(cursoNum) && cursoNum >= 1 && cursoNum <= 99) {
                        // Formatear como 01, 02, 03, etc.
                        groupName = cursoNum.toString().padStart(2, '0');
                    } else {
                        // Si no es numérico, intentar usar tal como está
                        groupName = curso.toString().padStart(2, '0');
                    }
                }
                
                const group = grade.groups.find(g => g.name === groupName) || grade.groups[0];
                
                if (!group) {
                    console.log(`⚠️  Grupo no encontrado: ${groupName} en grado ${grade.name}`);
                    errors++;
                    continue;
                }
                
                // Generar fecha de nacimiento aproximada (basada en el grado)
                const currentYear = new Date().getFullYear();
                const gradeOrder = grade.order;
                const approximateAge = gradeOrder <= 0 ? 5 : (gradeOrder + 5); // Preescolar ~5 años, Primero ~6, etc.
                const birthYear = currentYear - approximateAge;
                const birthDate = new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
                
                console.log(`✅ Creando estudiante: ${nombres} ${apellidos}`);
                console.log(`   📧 Email: ${email}`);
                console.log(`   📱 Teléfono: ${phone}`);
                console.log(`   🎓 Grado: ${grade.name} - Grupo: ${group.name}`);
                
                // Crear estudiante
                const student = await prisma.student.create({
                    data: {
                        documentType: 'TI',
                        document: cleanDocument,
                        firstName: nombres.toString().trim(),
                        lastName: apellidos.toString().trim(),
                        birthDate: birthDate,
                        gender: Math.random() > 0.5 ? 'M' : 'F', // Aleatorio por ahora
                        email: email,
                        phone: phone,
                        address: 'Dirección por actualizar',
                        gradeId: grade.id,
                        groupId: group.id,
                        status: 'ACTIVE'
                    }
                });
                
                // Crear matrícula para el año actual
                await prisma.enrollment.create({
                    data: {
                        studentId: student.id,
                        year: currentYear,
                        gradeId: grade.id,
                        groupId: group.id,
                        status: 'ACTIVE'
                    }
                });
                
                imported++;
                console.log(`✅ Importado exitosamente: ${nombres} ${apellidos}`);
                
            } catch (error) {
                console.error(`❌ Error procesando registro ${index + 1}:`, error.message);
                errors++;
            }
        }
        
        console.log(`\n🎉 Importación completada:`);
        console.log(`   ✅ Estudiantes importados: ${imported}`);
        console.log(`   ⚠️  Estudiantes ya existentes: ${skipped}`);
        console.log(`   ❌ Errores: ${errors}`);
        console.log(`   📊 Total procesados: ${imported + skipped + errors}`);
        
    } catch (error) {
        console.error('❌ Error general:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar importación
importStudentsFromExcel();