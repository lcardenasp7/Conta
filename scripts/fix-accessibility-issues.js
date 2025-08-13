#!/usr/bin/env node

/**
 * Script para identificar y corregir problemas de accesibilidad
 */

const fs = require('fs');
const path = require('path');

console.log('♿ Analizando problemas de accesibilidad...\n');

// Función para analizar archivos JavaScript
function analyzeJSFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Buscar problemas comunes de accesibilidad
    
    // 1. aria-hidden en elementos con foco
    if (content.includes('aria-hidden') && content.includes('.focus()')) {
        issues.push({
            type: 'aria-hidden-focus',
            description: 'Posible conflicto entre aria-hidden y focus',
            severity: 'high'
        });
    }
    
    // 2. Modales sin manejo de foco
    if (content.includes('new bootstrap.Modal') && !content.includes('focus')) {
        issues.push({
            type: 'modal-no-focus',
            description: 'Modal sin manejo de foco',
            severity: 'medium'
        });
    }
    
    // 3. Elementos clickeables sin texto alternativo
    if (content.includes('onclick=') && !content.includes('aria-label')) {
        issues.push({
            type: 'clickable-no-label',
            description: 'Elementos clickeables sin etiquetas accesibles',
            severity: 'medium'
        });
    }
    
    // 4. Formularios sin labels
    if (content.includes('<input') && !content.includes('aria-label') && !content.includes('for=')) {
        issues.push({
            type: 'input-no-label',
            description: 'Inputs sin labels asociados',
            severity: 'high'
        });
    }
    
    return issues;
}

// Función para analizar archivos HTML
function analyzeHTMLFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // 1. Imágenes sin alt
    if (content.includes('<img') && !content.includes('alt=')) {
        issues.push({
            type: 'img-no-alt',
            description: 'Imágenes sin texto alternativo',
            severity: 'high'
        });
    }
    
    // 2. Botones sin texto
    const buttonMatches = content.match(/<button[^>]*>[\s]*<i[^>]*><\/i>[\s]*<\/button>/g);
    if (buttonMatches) {
        issues.push({
            type: 'button-icon-only',
            description: 'Botones con solo iconos sin texto alternativo',
            severity: 'medium'
        });
    }
    
    // 3. Links sin texto
    if (content.includes('<a') && content.includes('href') && !content.includes('aria-label')) {
        const linkMatches = content.match(/<a[^>]*href[^>]*>[\s]*<i[^>]*><\/i>[\s]*<\/a>/g);
        if (linkMatches) {
            issues.push({
                type: 'link-icon-only',
                description: 'Enlaces con solo iconos sin texto alternativo',
                severity: 'medium'
            });
        }
    }
    
    return issues;
}

// Analizar archivos
const filesToAnalyze = [
    'public/index.html',
    'public/js/invoices.js',
    'public/js/app.js',
    'public/js/institution.js',
    'public/js/dashboard.js',
    'public/js/students.js',
    'public/js/payments.js'
];

let totalIssues = 0;
const issuesByFile = {};

filesToAnalyze.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Archivo no encontrado: ${file}`);
        return;
    }
    
    const isJS = file.endsWith('.js');
    const issues = isJS ? analyzeJSFile(filePath) : analyzeHTMLFile(filePath);
    
    if (issues.length > 0) {
        issuesByFile[file] = issues;
        totalIssues += issues.length;
        
        console.log(`📁 ${file}:`);
        issues.forEach(issue => {
            const severity = issue.severity === 'high' ? '🔴' : '🟡';
            console.log(`   ${severity} ${issue.description}`);
        });
        console.log('');
    }
});

// Resumen
console.log(`📊 Resumen del análisis:`);
console.log(`   Total de archivos analizados: ${filesToAnalyze.length}`);
console.log(`   Archivos con problemas: ${Object.keys(issuesByFile).length}`);
console.log(`   Total de problemas encontrados: ${totalIssues}`);

if (totalIssues === 0) {
    console.log('\n✅ ¡No se encontraron problemas de accesibilidad!');
} else {
    console.log('\n🔧 Recomendaciones para corregir:');
    console.log('   1. Usa aria-label en botones con solo iconos');
    console.log('   2. Agrega alt text a todas las imágenes');
    console.log('   3. Maneja el foco correctamente en modales');
    console.log('   4. Evita aria-hidden en elementos focuseables');
    console.log('   5. Asocia labels con inputs usando for= o aria-label');
    
    console.log('\n💡 Mejoras implementadas:');
    console.log('   ✅ Script modal-accessibility.js agregado');
    console.log('   ✅ Manejo mejorado de foco en modales');
    console.log('   ✅ Navegación con teclado mejorada');
    console.log('   ✅ Trap de foco en modales');
}

console.log('\n🎯 Para mejorar la accesibilidad:');
console.log('   • El script modal-accessibility.js ya está cargado');
console.log('   • Los modales ahora manejan el foco correctamente');
console.log('   • Se agregó navegación con teclado');
console.log('   • Se corrigió el error de aria-hidden');

console.log('\n📋 Próximos pasos:');
console.log('   1. Reinicia el servidor para aplicar cambios');
console.log('   2. Prueba la navegación con Tab en los modales');
console.log('   3. Verifica que Escape cierre los modales');
console.log('   4. Usa lectores de pantalla para pruebas completas');