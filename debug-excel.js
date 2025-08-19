const XLSX = require('xlsx');
const path = require('path');

console.log('🔍 ANÁLISIS REAL DE GRUPOS DEL EXCEL');
console.log('══════════════════════════════════');

try {
    // 1. Leer el archivo
    const filePath = path.join(__dirname, 'estudiantes.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets['Hoja1'];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // 2. Procesar datos (omitir header)
    const studentData = data.slice(1);
    console.log(`📊 Total estudiantes: ${studentData.length}`);
    
    // 3. Mapear grados y grupos
    const gradeGroupMap = new Map();
    
    for (const [index, row] of studentData.entries()) {
        const [nro, identificacion, estudiante, grado, curso] = row;
        
        // Filtrar filas vacías
        if (!grado || !curso) continue;
        
        const gradeName = grado.toString().trim();
        const groupName = curso.toString().trim();
        
        // Debug para las primeras 10 filas
        if (index < 10) {
            console.log(`Fila ${index + 2}: ${gradeName} - Grupo: "${groupName}"`);
        }
        
        // Guardar combinación
        if (!gradeGroupMap.has(gradeName)) {
            gradeGroupMap.set(gradeName, new Set());
        }
        gradeGroupMap.get(gradeName).add(groupName);
    }
    
    // 4. Mostrar resultados ordenados
    console.log('\n📊 GRUPOS REALES POR GRADO:');
    console.log('═══════════════════════════');
    
    // Ordenar grados
    const sortedGrades = Array.from(gradeGroupMap.keys()).sort();
    
    for (const grade of sortedGrades) {
        const groups = gradeGroupMap.get(grade);
        
        // Ordenar grupos: números primero, luego letras
        const sortedGroups = Array.from(groups).sort((a, b) => {
            // Si ambos son números
            if (!isNaN(a) && !isNaN(b)) {
                return parseInt(a) - parseInt(b);
            }
            // Si es A o B
            if (a === 'A' && b === 'B') return -1;
            if (a === 'B' && b === 'A') return 1;
            // Orden general
            return a.localeCompare(b);
        });
        
        console.log(`${grade}: [${sortedGroups.join(', ')}] (${groups.size} grupos)`);
    }
    
    // 5. Casos específicos mencionados
    console.log('\n🎯 VERIFICACIÓN DE CASOS ESPECÍFICOS:');
    console.log('═══════════════════════════════════');
    
    const casosEspecificos = [
        'Transición', 'Primero', 'Segundo', 'Undécimo', // Deberían tener 1-8
        'Brújula', 'Aceleración', 'Ciclo 3', 'Ciclo 4', 'Ciclo 5', 'Ciclo 6' // Deberían tener A,B
    ];
    
    for (const caso of casosEspecificos) {
        if (gradeGroupMap.has(caso)) {
            const grupos = Array.from(gradeGroupMap.get(caso)).sort();
            const tieneNumeros = grupos.some(g => !isNaN(g));
            const tieneLetras = grupos.some(g => isNaN(g));
            
            console.log(`${caso}: [${grupos.join(', ')}] ${tieneNumeros ? '(números)' : ''}${tieneLetras ? '(letras)' : ''}`);
        } else {
            console.log(`❌ ${caso}: NO ENCONTRADO`);
        }
    }
    
    // 6. Estadísticas generales
    console.log('\n📈 ESTADÍSTICAS:');
    console.log('═══════════════');
    
    let gradosConNumeros = 0;
    let gradosConLetras = 0;
    
    for (const [grade, groups] of gradeGroupMap) {
        const gruposArray = Array.from(groups);
        const tieneNumeros = gruposArray.some(g => !isNaN(g));
        const tieneLetras = gruposArray.some(g => isNaN(g));
        
        if (tieneNumeros) gradosConNumeros++;
        if (tieneLetras) gradosConLetras++;
    }
    
    console.log(`📊 Grados con grupos numéricos: ${gradosConNumeros}`);
    console.log(`📊 Grados con grupos por letras: ${gradosConLetras}`);
    console.log(`📊 Total grados: ${gradeGroupMap.size}`);
    
} catch (error) {
    console.error('❌ Error:', error);
}