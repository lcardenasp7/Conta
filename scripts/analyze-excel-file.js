#!/usr/bin/env node

/**
 * Script para analizar el archivo Excel de estudiantes
 * y ver cuántos registros realmente tiene
 */

const XLSX = require('xlsx');
const path = require('path');

console.log('📊 ANALIZANDO ARCHIVO EXCEL DE ESTUDIANTES');
console.log('==========================================\n');

try {
    // Leer el archivo Excel
    const excelPath = path.join(__dirname, '..', 'estudiantes.xlsx');
    console.log(`📁 Archivo: ${excelPath}`);
    
    const workbook = XLSX.readFile(excelPath);
    console.log(`📋 Hojas encontradas: ${workbook.SheetNames.join(', ')}`);
    
    // Analizar cada hoja
    workbook.SheetNames.forEach((sheetName, index) => {
        console.log(`\n📄 HOJA ${index + 1}: ${sheetName}`);
        console.log('='.repeat(40));
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`📊 Total de registros: ${jsonData.length}`);
        
        if (jsonData.length > 0) {
            console.log('📋 Columnas encontradas:');
            const columns = Object.keys(jsonData[0]);
            columns.forEach(col => console.log(`   - ${col}`));
            
            console.log('\n📝 Primeros 3 registros:');
            jsonData.slice(0, 3).forEach((row, i) => {
                console.log(`   ${i + 1}. ${JSON.stringify(row, null, 2)}`);
            });
            
            // Verificar si hay registros vacíos o incompletos
            const incompleteRecords = jsonData.filter(row => {
                return !row['Identificación'] || !row['Nombre Completo'] || !row['GRADO'];
            });
            
            console.log(`\n⚠️ Registros incompletos: ${incompleteRecords.length}`);
            
            if (incompleteRecords.length > 0 && incompleteRecords.length <= 5) {
                console.log('📋 Registros incompletos encontrados:');
                incompleteRecords.forEach((row, i) => {
                    console.log(`   ${i + 1}. ${JSON.stringify(row, null, 2)}`);
                });
            }
            
            // Verificar distribución por grado
            const gradeDistribution = {};
            jsonData.forEach(row => {
                const grade = row['GRADO'] || 'Sin grado';
                gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
            });
            
            console.log('\n📊 Distribución por grado:');
            Object.entries(gradeDistribution).forEach(([grade, count]) => {
                console.log(`   Grado ${grade}: ${count} estudiantes`);
            });
            
            // Verificar duplicados por identificación
            const identifications = jsonData.map(row => row['Identificación']).filter(id => id);
            const uniqueIds = new Set(identifications);
            const duplicates = identifications.length - uniqueIds.size;
            
            console.log(`\n🔍 Análisis de duplicados:`);
            console.log(`   Total identificaciones: ${identifications.length}`);
            console.log(`   Identificaciones únicas: ${uniqueIds.size}`);
            console.log(`   Duplicados: ${duplicates}`);
        }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN GENERAL');
    console.log('='.repeat(50));
    
    let totalStudents = 0;
    workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        totalStudents += jsonData.length;
        console.log(`📄 ${sheetName}: ${jsonData.length} registros`);
    });
    
    console.log(`\n🎯 TOTAL DE ESTUDIANTES EN EL ARCHIVO: ${totalStudents}`);
    
    if (totalStudents > 1340) {
        console.log('\n⚠️ PROBLEMA DETECTADO:');
        console.log(`❌ El archivo tiene ${totalStudents} estudiantes`);
        console.log(`❌ Solo se importaron 1340 estudiantes`);
        console.log(`❌ Faltan ${totalStudents - 1340} estudiantes por importar`);
        
        console.log('\n🔧 POSIBLES CAUSAS:');
        console.log('1. El script se detuvo antes de completar');
        console.log('2. Hay registros duplicados que se saltaron');
        console.log('3. Hay registros con datos incompletos');
        console.log('4. El script tiene un límite configurado');
    } else {
        console.log('\n✅ La importación parece completa');
    }
    
} catch (error) {
    console.error('❌ Error analizando archivo Excel:', error.message);
}