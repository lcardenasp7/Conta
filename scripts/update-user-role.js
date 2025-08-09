const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateUserRole() {
  try {
    const email = 'contabilidad@villasanpablo.edu.co';
    
    console.log(`Actualizando rol del usuario: ${email}`);
    
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: { role: 'ADMIN' } // Cambiar a ADMIN para tener todos los permisos
    });
    
    console.log('✅ Usuario actualizado:');
    console.log(`- Email: ${updatedUser.email}`);
    console.log(`- Nombre: ${updatedUser.name}`);
    console.log(`- Rol anterior: AUXILIARY_ACCOUNTANT`);
    console.log(`- Rol nuevo: ${updatedUser.role}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserRole();