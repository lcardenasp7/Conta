/**
 * Verificar usuarios existentes en la base de datos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    try {
        console.log('👥 Verificando usuarios en la base de datos...');

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });

        if (users.length === 0) {
            console.log('❌ No hay usuarios en la base de datos');
            return;
        }

        console.log(`✅ Encontrados ${users.length} usuarios:`);
        users.forEach((user, index) => {
            console.log(`${index + 1}. Email: ${user.email}`);
            console.log(`   Nombre: ${user.name}`);
            console.log(`   Rol: ${user.role}`);
            console.log(`   Creado: ${user.createdAt.toLocaleDateString()}`);
            console.log('   ---');
        });

        // Mostrar el primer usuario para usar en las pruebas
        if (users.length > 0) {
            console.log('💡 Para las pruebas, usa:');
            console.log(`   Email: ${users[0].email}`);
            console.log('   Password: (la contraseña que configuraste)');
        }

    } catch (error) {
        console.error('❌ Error verificando usuarios:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();