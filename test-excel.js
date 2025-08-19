const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

console.log('🔍 DIAGNÓSTICO SIMPLE DEL EXCEL');
console.log('═══════════════════════════════');

try {
    // 1. Verificar si el archivo existe
    const filePath = path.join(__dirname, 'estudiantes.xlsx');
    console.log(`📁 Buscando archivo en: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
        console.log('✅ Archivo encontrado');
        
        // 2. Intentar leer el archivo
        console.log('📖 Leyendo archivo...');
        const workbook = XLSX.readFile(filePath);
        
        // 3. Mostrar las hojas disponibles
        console.log('📋 Hojas disponibles:');
        console.log(workbook.SheetNames);
        
        // 4. Leer la primera hoja (sea cual sea su nombre)
        const firstSheetName = workbook.SheetNames[0];
        console.log(`\n📄 Leyendo hoja: "${firstSheetName}"`);
        
        const sheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        console.log(`📊 Total de filas: ${data.length}`);
        
        // 5. Mostrar las primeras 5 filas completas
        console.log('\n📋 PRIMERAS 5 FILAS:');
        for (let i = 0; i < Math.min(5, data.length); i++) {
            console.log(`Fila ${i}: `, data[i]);
        }
        
        // 6. Mostrar información de la estructura
        if (data.length > 0) {
            console.log(`\n📐 Columnas en header: ${data[0]?.length || 0}`);
            console.log('📑 Header:', data[0]);
        }
        
    } else {
        console.log('❌ Archivo NO encontrado');
        console.log('\n🔍 Archivos .xlsx en el directorio actual:');
        
        const files = fs.readdirSync(__dirname);
        const excelFiles = files.filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));
        
        if (excelFiles.length > 0) {
            excelFiles.forEach(file => console.log(`  📄 ${file}`));
            console.log(`\n💡 Renombra uno de estos archivos a "estudiantes.xlsx"`);
        } else {
            console.log('  (No se encontraron archivos Excel)');
            console.log('\n💡 Asegúrate de colocar el archivo Excel en la raíz del proyecto');
        }
    }
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verifica que el archivo se llame exactamente "estudiantes.xlsx"');
    console.log('2. Verifica que el archivo esté en la raíz del proyecto');
    console.log('3. Verifica que el archivo no esté corrupto');
    console.log('4. Intenta abrir y guardar el archivo en Excel nuevamente');
}