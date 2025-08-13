#!/usr/bin/env node

/**
 * Script para instalar las nuevas dependencias necesarias
 * para la generación de PDFs y carga de archivos
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Instalando nuevas dependencias...');

try {
    // Instalar dependencias
    console.log('📦 Instalando multer para carga de archivos...');
    execSync('npm install multer@1.4.5-lts.1', { stdio: 'inherit' });
    
    console.log('📄 Instalando pdfkit para generación de PDFs...');
    execSync('npm install pdfkit@0.15.0', { stdio: 'inherit' });
    
    // Crear directorio de uploads si no existe
    const uploadsDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('📁 Directorio de uploads creado');
    }
    
    // Crear archivo .gitkeep si no existe
    const gitkeepPath = path.join(uploadsDir, '.gitkeep');
    if (!fs.existsSync(gitkeepPath)) {
        fs.writeFileSync(gitkeepPath, '# Directory for uploaded files (logos, documents, etc.)');
        console.log('📝 Archivo .gitkeep creado');
    }
    
    console.log('✅ Dependencias instaladas exitosamente');
    console.log('');
    console.log('🎉 Nuevas funcionalidades disponibles:');
    console.log('   • Generación de facturas en PDF');
    console.log('   • Carga de logo institucional');
    console.log('   • Dashboard con categorización de ingresos/egresos');
    console.log('   • Actualización en tiempo real del dashboard');
    console.log('');
    console.log('📋 Para usar estas funcionalidades:');
    console.log('   1. Reinicia el servidor: npm start');
    console.log('   2. Ve a Configuración > Institución para cargar el logo');
    console.log('   3. Las facturas ahora se pueden descargar en PDF');
    console.log('   4. El dashboard muestra categorías de ingresos y gastos');

} catch (error) {
    console.error('❌ Error instalando dependencias:', error.message);
    process.exit(1);
}