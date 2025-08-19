const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Función para generar teléfonos aleatorios colombianos
function generateColombianPhone() {
    const operators = ['300', '301', '302', '304', '305', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '322', '323'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    const number = Math.floor(1000000 + Math.random() * 9000000);
    return `${operator}${number}`;
}

// Función mejorada para generar email institucional
function generateEmail(fullName, documentId) {
    try {
        const cleanName = fullName.trim().toUpperCase();
        const nameParts = cleanName.split(' ').filter(part => part.length > 0);
        
        if (nameParts.length < 2) {
            console.warn(`⚠️ Nombre incompleto: ${fullName}`);
            return null;
        }
        
        // Lógica mejorada para nombres colombianos
        let nombres = [];
        let apellidos = [];
        
        // Casos especiales de apellidos compuestos
        const compoundPatterns = [
            'DE LA CRUZ', 'DE LA HOZ', 'DE LOS RIOS', 'DE LAS CASAS',
            'DEL CASTILLO', 'DEL RIO', 'DEL VALLE', 'DE LA TORRE',
            'VAN DER BERG', 'DE LA ROSA', 'DE LA PEÑA', 'DEL CARMEN',
            'DE JESUS', 'DEL MAR'
        ];
        
        // Verificar apellidos compuestos al final
        let compoundFound = false;
        for (const pattern of compoundPatterns) {
            const patternParts = pattern.split(' ');
            const patternLength = patternParts.length;
            
            if (nameParts.length > patternLength) {
                const possibleCompound = nameParts.slice(-patternLength).join(' ');
                
                if (possibleCompound === pattern) {
                    apellidos = patternParts;
                    nombres = nameParts.slice(0, -patternLength);
                    compoundFound = true;
                    break;
                }
            }
        }
        
        if (!compoundFound) {
            // División estándar para nombres no compuestos
            if (nameParts.length === 2) {
                nombres = [nameParts[0]];
                apellidos = [nameParts[1]];
            } else if (nameParts.length === 3) {
                nombres = [nameParts[0]];
                apellidos = [nameParts[1], nameParts[2]];
            } else if (nameParts.length === 4) {
                nombres = [nameParts[0], nameParts[1]];
                apellidos = [nameParts[2], nameParts[3]];
            } else {
                // Para nombres más largos, últimos 2 son apellidos
                apellidos = nameParts.slice(-2);
                nombres = nameParts.slice(0, -2);
            }
        }
        
        // Validación mínima
        if (nombres.length === 0 || apellidos.length === 0) {
            console.warn(`⚠️ No se pudo dividir: ${fullName}`);
            nombres = [nameParts[0]];
            apellidos = nameParts.slice(1);
        }
        
        // Primer nombre y primer apellido
        const firstName = nombres[0];
        const firstLastName = apellidos[0];
        
        // Limpieza de caracteres
        const firstLetter = firstName.charAt(0).toLowerCase().replace('ñ', 'n');
        const cleanLastName = firstLastName.toLowerCase()
            .replace('ñ', 'n')
            .replace(/[^a-z]/g, '');
        
        // Últimos 4 dígitos del documento
        const docString = documentId.toString();
        const lastFourDigits = docString.slice(-4);
        
        // Construir email
        const email = `${firstLetter}${cleanLastName}${lastFourDigits}e@villasanpablo.edu.co`;
        
        return email;
    } catch (error) {
        console.error(`Error generando email para ${fullName}:`, error);
        return null;
    }
}

// Función para normalizar nombres de grados
function normalizeGradeName(originalGrade) {
    if (!originalGrade || originalGrade === 'undefined') return null;
    
    const normalized = originalGrade.trim();
    
    // Correcciones específicas
    const gradeMapping = {
        'Primero ': 'Primero',
        'undefined': null,
        'Jardín': 'Jardín',
        'Transición': 'Transición',
        'Aceleración': 'Aceleración',
        'Brújula': 'Brújula',
        'Ciclo 3': 'Ciclo 3',
        'Ciclo 4': 'Ciclo 4',
        'Ciclo 5': 'Ciclo 5',
        'Ciclo 6': 'Ciclo 6'
    };
    
    return gradeMapping[normalized] || normalized;
}

// Función mejorada para determinar el grupo correcto
function determineCorrectGroup(gradeName, courseNumber) {
    // Grados con grupos alfabéticos (A, B)
    const alphaGroupGrades = [
        'Aceleración', 'Brújula', 'Ciclo 3', 'Ciclo 4', 'Ciclo 5', 'Ciclo 6'
    ];
    
    // Grados con grupos numéricos (01, 02, etc.)
    const numericGroupGrades = [
        'Jardín', 'Transición', 'Primero', 'Segundo', 'Tercero', 
        'Cuarto', 'Quinto', 'Sexto', 'Séptimo', 'Octavo', 
        'Noveno', 'Décimo', 'Undécimo'
    ];
    
    // Convertir a string si es número
    const courseStr = courseNumber.toString().toUpperCase().trim();
    
    if (alphaGroupGrades.includes(gradeName)) {
        // Grupos alfabéticos (A -> 01, B -> 02)
        if (courseStr === 'A' || courseStr === '1') return '01';
        if (courseStr === 'B' || courseStr === '2') return '02';
        return '01'; // Por defecto
    } else if (numericGroupGrades.includes(gradeName)) {
        // Grupos numéricos (1 -> 01, 2 -> 02, etc.)
        const num = parseInt(courseStr) || 1;
        return num.toString().padStart(2, '0');
    } else {
        console.warn(`Grado no reconocido: ${gradeName}, usando grupo por defecto`);
        return '01';
    }
}

// Función para determinar tipo de documento
function determineDocumentType(documentId) {
    const docString = documentId.toString();
    if (docString.length >= 10) return 'CC';
    if (docString.length >= 8) return 'TI';
    return 'RC';
}

// Función para generar fecha de nacimiento aproximada
function generateApproximateBirthDate(grade) {
    const currentYear = new Date().getFullYear();
    const gradeAgeMapping = {
        'Jardín': 4, 'Transición': 5, 'Primero': 6, 'Segundo': 7, 'Tercero': 8,
        'Cuarto': 9, 'Quinto': 10, 'Sexto': 11, 'Séptimo': 12, 'Octavo': 13,
        'Noveno': 14, 'Décimo': 15, 'Undécimo': 16,
        'Aceleración': 12, 'Brújula': 10, 'Ciclo 3': 13, 'Ciclo 4': 14, 'Ciclo 5': 15, 'Ciclo 6': 16
    };
    
    const baseAge = gradeAgeMapping[grade] || 10;
    const birthYear = currentYear - baseAge;
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    
    return new Date(birthYear, month - 1, day);
}

// Función principal de importación mejorada
async function importStudents() {
    console.log('📚 INICIANDO IMPORTACIÓN DE ESTUDIANTES');
    console.log('═══════════════════════════════════════');
    
    try {
        // 1. Verificar archivo
        const filePath = path.join(__dirname, 'estudiantes.xlsx');
        if (!fs.existsSync(filePath)) {
            throw new Error(`Archivo no encontrado: ${filePath}`);
        }
        
        // 2. Leer Excel
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // 3. Filtrar datos válidos
        const studentData = data.slice(1).filter(row => row[1] && row[2] && row[3]);
        console.log(`📊 Total estudiantes a procesar: ${studentData.length}`);
        
        // 4. Cargar estructura de la base de datos
        console.log('🏫 Cargando grados y grupos...');
        const grades = await prisma.grade.findMany({ include: { groups: true } });
        
        const gradeMap = new Map();
        const groupMap = new Map();
        
        grades.forEach(grade => {
            gradeMap.set(grade.name, grade);
            grade.groups.forEach(group => {
                groupMap.set(`${grade.name}-${group.name}`, group);
            });
        });
        
        // 5. Procesar estudiantes
        console.log('\n👥 PROCESANDO ESTUDIANTES...');
        let processedCount = 0;
        let errorCount = 0;
        const errors = [];
        
        for (const [index, row] of studentData.entries()) {
            try {
                const [nro, documentId, fullName, originalGrade, courseNumber] = row;
                
                // Validar grado
                const cleanGrade = normalizeGradeName(originalGrade);
                if (!cleanGrade) {
                    errors.push(`Fila ${index + 2}: Grado inválido "${originalGrade}"`);
                    errorCount++;
                    continue;
                }
                
                // Buscar grado en DB
                const grade = gradeMap.get(cleanGrade);
                if (!grade) {
                    errors.push(`Fila ${index + 2}: Grado "${cleanGrade}" no existe`);
                    errorCount++;
                    continue;
                }
                
                // Determinar grupo correcto
                const groupName = determineCorrectGroup(cleanGrade, courseNumber);
                const groupKey = `${cleanGrade}-${groupName}`;
                const group = groupMap.get(groupKey);
                
                if (!group) {
                    errors.push(`Fila ${index + 2}: Grupo "${groupName}" no existe para "${cleanGrade}"`);
                    errorCount++;
                    continue;
                }
                
                // Procesar nombre completo
                const nameParts = fullName.trim().split(' ');
                let firstName, lastName;
                
                if (nameParts.length >= 4) {
                    // Formato: APELLIDO1 APELLIDO2 NOMBRE1 NOMBRE2
                    lastName = nameParts.slice(0, 2).join(' ');
                    firstName = nameParts.slice(2).join(' ');
                } else if (nameParts.length === 3) {
                    // APELLIDO1 APELLIDO2 NOMBRE o APELLIDO NOMBRE1 NOMBRE2
                    lastName = nameParts.slice(0, 2).join(' ');
                    firstName = nameParts[2];
                } else if (nameParts.length === 2) {
                    // APELLIDO NOMBRE
                    lastName = nameParts[0];
                    firstName = nameParts[1];
                } else {
                    // Caso inesperado
                    firstName = nameParts[0] || 'NOMBRE';
                    lastName = nameParts.slice(1).join(' ') || 'APELLIDO';
                }
                
                // Generar datos adicionales
                const email = generateEmail(fullName, documentId);
                const phone = generateColombianPhone();
                const guardianPhone = generateColombianPhone();
                const birthDate = generateApproximateBirthDate(cleanGrade);
                const documentType = determineDocumentType(documentId);
                
                // Verificar si ya existe
                const existingStudent = await prisma.student.findUnique({
                    where: { document: documentId.toString() }
                });
                
                if (existingStudent) {
                    console.log(`⚠️ Estudiante existe: ${fullName} (${documentId})`);
                    continue;
                }
                
                // Crear estudiante
                await prisma.student.create({
                    data: {
                        documentType,
                        document: documentId.toString(),
                        firstName,
                        lastName,
                        birthDate,
                        gender: 'M', // Por defecto
                        email,
                        phone,
                        address: 'Barrio Villas de San Pablo, Barranquilla',
                        gradeId: grade.id,
                        groupId: group.id,
                        guardianName: `Acudiente de ${firstName}`,
                        guardianPhone,
                        status: 'ACTIVE',
                        enrollmentDate: new Date()
                    }
                });
                
                processedCount++;
                if (processedCount % 50 === 0) {
                    console.log(`✅ Procesados: ${processedCount}/${studentData.length}`);
                }
                
            } catch (error) {
                errorCount++;
                errors.push(`Fila ${index + 2}: ${error.message}`);
                console.error(`❌ Error en fila ${index + 2}:`, error.message);
            }
        }
        
        // 6. Reporte final
        console.log('\n📊 REPORTE FINAL');
        console.log('═══════════════════════════════════');
        console.log(`✅ Importados: ${processedCount}`);
        console.log(`❌ Errores: ${errorCount}`);
        console.log(`📁 Total: ${studentData.length}`);
        
        if (errors.length > 0) {
            console.log('\n🚨 PRIMEROS 10 ERRORES:');
            errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
            if (errors.length > 10) console.log(`  ... y ${errors.length - 10} más`);
        }
        
        // 7. Estadísticas
        console.log('\n📈 ESTADÍSTICAS POR GRADO:');
        const stats = await prisma.student.groupBy({
            by: ['gradeId'],
            _count: { id: true }
        });
        
        for (const stat of stats) {
            const grade = await prisma.grade.findUnique({ where: { id: stat.gradeId } });
            console.log(`  ${grade.name}: ${stat._count.id} estudiantes`);
        }
        
        console.log('\n🎉 IMPORTACIÓN COMPLETADA!');
        
    } catch (error) {
        console.error('❌ Error durante la importación:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Función para limpiar estudiantes
async function clearStudents() {
    console.log('🧹 INICIANDO LIMPIEZA COMPLETA DE ESTUDIANTES');
    
    try {
        // 1. Desactivar verificaciones de clave foránea (PostgreSQL)
        console.log('🔧 Desactivando restricciones temporalmente...');
        await prisma.$executeRaw`SET session_replication_role = 'replica'`;
        
        // 2. Eliminar TODOS los registros relacionados en orden adecuado
        console.log('🗑️ Eliminando transacciones de fondos relacionadas...');
        await prisma.fundTransaction.deleteMany({
            where: {
                OR: [
                    { payment: { studentId: { not: null } } },
                    { invoice: { studentId: { not: null } } }
                ]
            }
        });
        
        console.log('🗑️ Eliminando pagos de estudiantes...');
        await prisma.payment.deleteMany({
            where: { studentId: { not: null } }
        });
        
        console.log('🗑️ Eliminando facturas de estudiantes...');
        await prisma.invoice.deleteMany({
            where: { studentId: { not: null } }
        });
        
        console.log('🗑️ Eliminando ítems de facturas...');
        await prisma.invoiceItem.deleteMany();
        
        console.log('🗑️ Eliminando asignaciones de eventos...');
        await prisma.eventAssignment.deleteMany();
        
        console.log('🗑️ Eliminando asistencias...');
        await prisma.attendance.deleteMany();
        
        console.log('🗑️ Eliminando inscripciones...');
        await prisma.enrollment.deleteMany();
        
        // 3. Finalmente eliminar estudiantes
        console.log('👨‍🎓 Eliminando estudiantes...');
        const result = await prisma.student.deleteMany();
        
        // 4. Reactivar verificaciones
        console.log('🔧 Reactivando restricciones...');
        await prisma.$executeRaw`SET session_replication_role = 'origin'`;
        
        console.log(`✅ ÉXITO: ${result.count} estudiantes eliminados`);
        console.log('💡 Base de datos lista para nueva importación');
    } catch (error) {
        console.error('❌ ERROR CRÍTICO:', error.message);
        console.log('⚠️ Si el error persiste, prueba:');
        console.log('1. npx prisma migrate reset (resetea toda la BD)');
        console.log('2. Revisa las relaciones en schema.prisma');
    } finally {
        await prisma.$disconnect();
    }
}

// Función para mostrar estadísticas
async function showStats() {
    console.log('📊 ESTADÍSTICAS');
    console.log('═══════════════════════');
    
    const total = await prisma.student.count();
    console.log(`👥 Total estudiantes: ${total}`);
    
    const stats = await prisma.grade.findMany({
        include: { _count: { select: { students: true } } },
        orderBy: { order: 'asc' }
    });
    
    console.log('\n📚 Por grado:');
    stats.forEach(g => console.log(`  ${g.name}: ${g._count.students}`));
    await prisma.$disconnect();
}

// Función para corregir emails
async function fixExistingEmails() {
    console.log('🔧 CORRIGIENDO EMAILS');
    console.log('═══════════════════════════════');
    
    try {
        const students = await prisma.student.findMany({
            select: { id: true, document: true, firstName: true, lastName: true, email: true }
        });
        
        console.log(`📊 Total a revisar: ${students.length}`);
        let corrected = 0;
        
        for (const s of students) {
            const fullName = `${s.lastName} ${s.firstName}`;
            const newEmail = generateEmail(fullName, s.document);
            
            if (newEmail && s.email !== newEmail) {
                await prisma.student.update({
                    where: { id: s.id },
                    data: { email: newEmail }
                });
                corrected++;
            }
        }
        
        console.log(`\n✅ ${corrected} emails corregidos`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Manejo de comandos
const command = process.argv[2];

switch (command) {
    case 'import':
        importStudents();
        break;
    case 'clear':
        clearStudents();
        break;
    case 'stats':
        showStats();
        break;
    case 'fix-emails':
        fixExistingEmails();
        break;
    default:
        console.log('📚 SCRIPT DE IMPORTACIÓN');
        console.log('═══════════════════════════════════════');
        console.log('Uso:');
        console.log('  node import-students.js import     - Importar desde Excel');
        console.log('  node import-students.js clear      - Limpiar estudiantes');
        console.log('  node import-students.js stats      - Mostrar estadísticas');
        console.log('  node import-students.js fix-emails - Corregir emails');
        console.log('\nRequisitos:');
        console.log('1. Archivo estudiantes.xlsx en la raíz');
        console.log('2. Base de datos configurada con grados/grupos');
        break;
}

module.exports = {
    importStudents,
    clearStudents,
    showStats,
    generateEmail,
    generateColombianPhone,
    fixExistingEmails
};