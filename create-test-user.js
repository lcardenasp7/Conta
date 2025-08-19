const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
    console.log('👤 Revisando usuarios existentes...');
    
    try {
        // Verificar todos los usuarios existentes
        const existingUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                isVerified: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        
        if (existingUsers.length > 0) {
            console.log(`✅ Se encontraron ${existingUsers.length} usuarios en la base de datos:`);
            console.log('═══════════════════════════════════════════════════════════');
            
            existingUsers.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Rol: ${user.role}`);
                console.log(`   Activo: ${user.isActive ? 'Sí' : 'No'}`);
                console.log(`   Verificado: ${user.isVerified ? 'Sí' : 'No'}`);
                console.log(`   Creado: ${user.createdAt.toLocaleDateString()}`);
                console.log('───────────────────────────────────────────────────────────');
            });
            
            console.log('\n🔐 Credenciales disponibles para login:');
            existingUsers.forEach((user, index) => {
                if (user.isActive) {
                    console.log(`${index + 1}. Email: ${user.email} | Rol: ${user.role}`);
                }
            });
            
            return;
        }
        
        // Crear usuario de prueba
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const user = await prisma.user.create({
            data: {
                email: 'admin@villas.edu.co',
                password: hashedPassword,
                name: 'Administrador Sistema',
                role: 'ADMIN',
                isActive: true,
                isVerified: true
            }
        });
        
        console.log('✅ Usuario de prueba creado exitosamente:');
        console.log(`   Email: ${user.email}`);
        console.log(`   Contraseña: admin123`);
        console.log(`   Nombre: ${user.name}`);
        console.log(`   Rol: ${user.role}`);
        
        console.log('\n🔐 Credenciales para login:');
        console.log('   Email: admin@villas.edu.co');
        console.log('   Contraseña: admin123');
        
    } catch (error) {
        console.error('❌ Error al crear usuario:', error);
        
        if (error.code === 'P2002') {
            console.log('ℹ️ El usuario ya existe');
        }
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    createTestUser()
        .then(() => {
            console.log('\n✅ Proceso completado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { createTestUser };