const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Function to generate email based on the format specified
function generateEmail(firstName, lastName, document) {
    // Get first letter of first name
    const firstLetter = firstName.charAt(0).toLowerCase();
    
    // Get first last name (split by spaces and take first part)
    const firstLastName = lastName.split(' ')[0].toLowerCase();
    
    // Replace ñ with n for email compatibility
    const cleanFirstLetter = firstLetter.replace(/ñ/g, 'n');
    const cleanFirstLastName = firstLastName.replace(/ñ/g, 'n');
    
    // Get last 4 digits of document
    const last4Digits = document.toString().slice(-4);
    
    // Generate email: firstLetter + firstLastName + last4digits + e@villasanpablo.edu.co
    return `${cleanFirstLetter}${cleanFirstLastName}${last4Digits}e@villasanpablo.edu.co`;
}

// Function to generate random phone number
function generateRandomPhone() {
    const prefixes = ['300', '301', '302', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '322', '323'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 9000000) + 1000000; // 7 digit number
    return `${prefix}${number}`;
}

// Function to map grade names to our system
function mapGrade(gradeName) {
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

async function importStudents() {
    try {
        console.log('🔍 Buscando archivo de estudiantes...');
        
        // Path to the Excel file
        const filePath = path.join(process.env.USERPROFILE, 'Documents', 'BASE DE DATOS ESTUDIANTES.xlsx');
        
        if (!fs.existsSync(filePath)) {
            console.error('❌ No se encontró el archivo BASE DE DATOS ESTUDIANTES.xlsx');
            return;
        }
        
        console.log('📖 Leyendo archivo Excel...');
        
        // Read the Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Get first sheet
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const studentsData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`📊 Encontrados ${studentsData.length} estudiantes en el archivo`);
        
        // Filter only students with documents starting with 'N' or those that failed before
        const pendingStudents = studentsData.filter(student => {
            const document = student['Identificación'] || student['DOCUMENTO'] || student['DOC'] || student['CEDULA'] || student['ID'];
            return document && document.toString().startsWith('N');
        });
        
        console.log(`🔍 Procesando solo ${pendingStudents.length} estudiantes con documentos tipo 'N'`);
        
        // Get existing grades from database
        const existingGrades = await prisma.grade.findMany({
            include: { groups: true }
        });
        
        console.log('📚 Grados disponibles:', existingGrades.map(g => g.name));
        
        let imported = 0;
        let errors = 0;
        
        for (const studentRow of studentsData) {
            try {
                // Extract data from Excel row (adjust column names as needed)
                const document = studentRow['Identificación'] || studentRow['DOCUMENTO'] || studentRow['DOC'] || studentRow['CEDULA'] || studentRow['ID'];
                const fullName = studentRow['Nombre Completo'] || studentRow['NOMBRES'] || studentRow['NOMBRE'];
                const gradeName = studentRow['GRADO'] || studentRow['CURSO'] || studentRow['GRADE'];
                const groupName = studentRow['CURSO'] || studentRow['GRUPO'] || studentRow['SECCION'] || studentRow['GROUP'] || 'A';
                const birthDate = studentRow['FECHA_NACIMIENTO'] || studentRow['NACIMIENTO'] || studentRow['BIRTH_DATE'];
                const gender = studentRow['GENERO'] || studentRow['SEXO'] || studentRow['GENDER'] || 'M';
                const address = studentRow['DIRECCION'] || studentRow['ADDRESS'] || 'Dirección por actualizar';
                
                // Extract names and surnames from separate columns
                const firstName = studentRow['NOMBRES'] || studentRow['PRIMER_NOMBRE'] || '';
                const lastName = studentRow['APELLIDOS'] || studentRow['PRIMER_APELLIDO'] || '';
                
                // If names are in a single column, parse them
                let finalFirstName = firstName;
                let finalLastName = lastName;
                
                if (!firstName && !lastName && fullName) {
                    const nameParts = fullName.toString().trim().split(' ');
                    if (nameParts.length >= 4) {
                        // Assume first 2 are first names, last 2 are last names
                        finalFirstName = nameParts.slice(0, 2).join(' ');
                        finalLastName = nameParts.slice(2).join(' ');
                    } else if (nameParts.length >= 2) {
                        // Take first part as first name, rest as last name
                        finalFirstName = nameParts[0];
                        finalLastName = nameParts.slice(1).join(' ');
                    } else {
                        finalFirstName = nameParts[0] || '';
                        finalLastName = 'APELLIDO';
                    }
                } else {
                    finalFirstName = firstName.toString().trim();
                    finalLastName = lastName.toString().trim();
                }
                
                // Validate required fields and document format
                if (!document || !fullName || !gradeName) {
                    console.log(`⚠️  Saltando estudiante con datos incompletos:`, studentRow);
                    errors++;
                    continue;
                }
                
                // Handle documents that start with 'N' (extract numeric part)
                let numericDocument = document.toString();
                if (numericDocument.startsWith('N')) {
                    // Extract numeric part from documents like "N49095011417"
                    numericDocument = numericDocument.replace(/^N/, '');
                    console.log(`🔧 Procesando documento con N: ${document} → ${numericDocument} para ${fullName}`);
                }
                
                // Ensure document is numeric and clean it
                numericDocument = numericDocument.replace(/[^0-9]/g, '');
                if (!numericDocument || numericDocument.length < 6) {
                    console.log(`⚠️  Documento inválido: ${document} para ${fullName}`);
                    errors++;
                    continue;
                }
                
                // Use existing email or generate new one
                let email = studentRow['EMAIL'] || studentRow['CORREO'] || studentRow['CORREO_ELECTRONICO'] || '';
                if (!email) {
                    email = generateEmail(finalFirstName, finalLastName, numericDocument);
                }
                
                // Generate random phone
                const phone = generateRandomPhone();
                
                // Map grade name
                const mappedGradeName = mapGrade(gradeName);
                
                // Find grade in database
                const grade = existingGrades.find(g => g.name === mappedGradeName);
                if (!grade) {
                    console.log(`⚠️  Grado no encontrado: ${mappedGradeName} para estudiante ${firstName} ${lastName}`);
                    errors++;
                    continue;
                }
                
                // Use the actual group number from the file
                let actualGroupName = groupName ? groupName.toString().padStart(2, '0') : '01';
                
                console.log(`📝 Procesando: ${finalFirstName} ${finalLastName} - Grado: ${gradeName} (${mappedGradeName}) - Grupo: ${actualGroupName}`);
                
                // Find group in grade by the actual group number
                const group = grade.groups.find(g => g.name === actualGroupName) || grade.groups[0];
                if (!group) {
                    console.log(`⚠️  Grupo no encontrado: ${actualGroupName} en grado ${grade.name}`);
                    errors++;
                    continue;
                }
                
                // Parse birth date
                let parsedBirthDate = new Date();
                if (birthDate) {
                    if (typeof birthDate === 'number') {
                        // Excel date number
                        parsedBirthDate = new Date((birthDate - 25569) * 86400 * 1000);
                    } else {
                        parsedBirthDate = new Date(birthDate);
                    }
                }
                
                // Check if student already exists
                const existingStudent = await prisma.student.findUnique({
                    where: { document: numericDocument }
                });
                
                if (existingStudent) {
                    console.log(`⚠️  Estudiante ya existe: ${finalFirstName} ${finalLastName} (${document})`);
                    continue;
                }
                
                // Create student
                const student = await prisma.student.create({
                    data: {
                        documentType: 'TI', // Default to TI, can be updated later
                        document: numericDocument,
                        firstName: finalFirstName.toString().trim(),
                        lastName: finalLastName.toString().trim(),
                        birthDate: parsedBirthDate,
                        gender: gender.toString().toUpperCase().startsWith('F') ? 'F' : 'M',
                        email: email,
                        phone: phone,
                        address: address.toString(),
                        gradeId: grade.id,
                        groupId: group.id,
                        status: 'ACTIVE'
                    }
                });
                
                // Create enrollment for current year
                await prisma.enrollment.create({
                    data: {
                        studentId: student.id,
                        year: new Date().getFullYear(),
                        gradeId: grade.id,
                        groupId: group.id,
                        status: 'ACTIVE'
                    }
                });
                
                console.log(`✅ Importado: ${finalFirstName} ${finalLastName} - ${email} - ${grade.name} ${group.name}`);
                imported++;
                
            } catch (error) {
                console.error(`❌ Error importando estudiante:`, error.message);
                errors++;
            }
        }
        
        console.log(`\n🎉 Importación completada:`);
        console.log(`   ✅ Estudiantes importados: ${imported}`);
        console.log(`   ❌ Errores: ${errors}`);
        
    } catch (error) {
        console.error('❌ Error general:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the import
importStudents();