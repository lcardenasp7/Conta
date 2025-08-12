const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteCurrentEvents() {
    try {
        console.log('🗑️  Eliminando eventos actuales...');
        
        // Obtener todos los eventos actuales
        const currentEvents = await prisma.event.findMany({
            select: {
                id: true,
                name: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        if (currentEvents.length === 0) {
            console.log('✅ No hay eventos para eliminar');
            return;
        }
        
        console.log(`📋 Eventos encontrados: ${currentEvents.length}`);
        currentEvents.forEach((event, index) => {
            console.log(`${index + 1}. ${event.name} (${event.createdAt.toLocaleDateString()})`);
        });
        
        const eventIds = currentEvents.map(e => e.id);
        
        // Eliminar asignaciones
        console.log('\n🔄 Eliminando asignaciones...');
        const deletedAssignments = await prisma.eventAssignment.deleteMany({
            where: {
                eventId: {
                    in: eventIds
                }
            }
        });
        console.log(`✅ ${deletedAssignments.count} asignaciones eliminadas`);
        
        // Eliminar eventos
        console.log('🔄 Eliminando eventos...');
        const deletedEvents = await prisma.event.deleteMany({
            where: {
                id: {
                    in: eventIds
                }
            }
        });
        console.log(`✅ ${deletedEvents.count} eventos eliminados`);
        
        console.log('\n🎉 Todos los eventos han sido eliminados!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteCurrentEvents();