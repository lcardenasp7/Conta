const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEvents() {
  try {
    const events = await prisma.event.findMany();
    console.log('📊 Eventos en base de datos:', events.length);
    
    if (events.length > 0) {
      console.log('📋 Lista:');
      events.forEach(e => console.log(`- ${e.name}`));
    } else {
      console.log('✅ Base de datos limpia - no hay eventos');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEvents();