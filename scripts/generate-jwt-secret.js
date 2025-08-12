#!/usr/bin/env node

/**
 * Script para generar JWT_SECRET seguro para producción
 * Uso: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

function generateSecureJWTSecret() {
    // Generar 64 bytes aleatorios y convertir a hex (128 caracteres)
    const secret = crypto.randomBytes(64).toString('hex');
    
    console.log('🔐 JWT_SECRET Seguro Generado:');
    console.log('=' .repeat(80));
    console.log(secret);
    console.log('=' .repeat(80));
    console.log('');
    console.log('📋 Para usar en Railway:');
    console.log(`JWT_SECRET=${secret}`);
    console.log('');
    console.log('⚠️  IMPORTANTE:');
    console.log('- Guarda esta clave de forma segura');
    console.log('- No la compartas en repositorios públicos');
    console.log('- Úsala solo en variables de entorno de producción');
    console.log('- Si la pierdes, todos los tokens existentes serán inválidos');
    
    return secret;
}

// Ejecutar si se llama directamente
if (require.main === module) {
    generateSecureJWTSecret();
}

module.exports = { generateSecureJWTSecret };