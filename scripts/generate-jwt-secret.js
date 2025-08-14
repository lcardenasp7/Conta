/**
 * Generador de JWT Secret seguro para producción
 */

const crypto = require('crypto');

console.log('🔐 GENERADOR DE JWT SECRET PARA PRODUCCIÓN');
console.log('==========================================');

// Generar un secret de 64 bytes (512 bits)
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('\n🔑 JWT SECRET GENERADO:');
console.log('=======================');
console.log(jwtSecret);
console.log('=======================');

console.log('\n📋 INSTRUCCIONES:');
console.log('1. Copia el JWT_SECRET de arriba');
console.log('2. En tu plataforma de deployment (Railway/Heroku/Vercel):');
console.log('   - Ve a Variables de Entorno');
console.log('   - Agrega: JWT_SECRET = [el valor generado arriba]');
console.log('3. También agrega: NODE_ENV = production');

console.log('\n⚠️  IMPORTANTE:');
console.log('- NUNCA compartas este secret públicamente');
console.log('- Guárdalo en un lugar seguro');
console.log('- Úsalo solo en variables de entorno de producción');

console.log('\n🔒 CARACTERÍSTICAS DEL SECRET:');
console.log(`- Longitud: ${jwtSecret.length} caracteres`);
console.log('- Entropía: 512 bits');
console.log('- Formato: Hexadecimal');
console.log('- Seguridad: Criptográficamente seguro');

console.log('\n✅ SECRET LISTO PARA PRODUCCIÓN');