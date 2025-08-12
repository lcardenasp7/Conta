const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const userId = 'cmdt7n6c900043t1jx4653654';
    console.log('Buscando usuario con ID:', userId);
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (user) {
      console.log('✅ Usuario encontrado:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified
      });
    } else {
      console.log('❌ Usuario NO encontrado');
      
      // Vamos a ver qué usuarios existen
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });
      
      console.log('\n📋 Usuarios existentes:');
      allUsers.forEach(u => {
        console.log(`- ${u.email} (${u.role}) - ID: ${u.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();