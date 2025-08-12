const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function autoLogin() {
    try {
        console.log('🔐 Iniciando auto-login...');
        
        // Buscar usuario rector
        const user = await prisma.user.findUnique({
            where: { email: 'rector@villasanpablo.edu.co' }
        });
        
        if (!user) {
            console.log('❌ Usuario rector no encontrado');
            return;
        }
        
        console.log(`👤 Usuario encontrado: ${user.name} (${user.email})`);
        
        // Generar token
        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        console.log('\n✅ Token generado exitosamente');
        console.log('\n📋 INSTRUCCIONES PARA EL NAVEGADOR:');
        console.log('1. Abre la consola del navegador (F12 → Console)');
        console.log('2. Ejecuta este comando:');
        console.log(`\nlocalStorage.setItem('token', '${token}');\n`);
        console.log('3. Recarga la página (F5)');
        
        console.log('\n🔑 Credenciales de acceso:');
        console.log('Email: rector@villasanpablo.edu.co');
        console.log('Password: VillasSP2024!');
        
        console.log('\n📊 Resumen del sistema:');
        const studentCount = await prisma.student.count();
        const gradeCount = await prisma.grade.count();
        const groupCount = await prisma.group.count();
        
        console.log(`- Estudiantes: ${studentCount}`);
        console.log(`- Grados: ${gradeCount}`);
        console.log(`- Grupos: ${groupCount}`);
        
    } catch (error) {
        console.error('❌ Error en auto-login:', error);
    } finally {
        await prisma.$disconnect();
    }
}

autoLogin();