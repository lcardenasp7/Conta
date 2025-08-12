const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteSpecificEvents() {
    try {
        console.log('🎯 Eliminando eventos específicos...');
        
        // Eventos a eliminar (puedes modificar esta lista)
        const eventsToDelete = [
            'dia',
            'Grado 11 - Recaudación de Fondos',
            'Festival Deportivo',
            'Concurso de Talentos 2024',
            'Rifa del Día del Estudiante',
            'Bingo Navideño 2024'
        ];
        
        console.log('📋 Eventos marcados para eliminación:');
        eventsToDelete.forEach((name, index) => {
            console.log(`${index + 1}. ${name}`);
        });
        
        // Buscar eventos que coincidan
        const foundEvents = await prisma.event.findMany({
            where: {
                name: {
                    in: eventsToDelete
                }
            },
            select: {
                id: true,
                name: true
            }
        });
        
        if (foundEvents.length === 0) {
            console.log('✅ No se encontraron eventos para eliminar');
            return;
        }
        
        console.log(`\n🎯 Eventos encontrados para eliminar: ${foundEvents.length}`);
        foundEvents.forEach(event => {
            console.log(`- ${event.name}`);
        });
        
        const eventIds = foundEvents.map(e => e.id);
        
        // Eliminar asignaciones primero
        console.log('\n🔄 Eliminando asignaciones...');
        const deletedAssignments = await prisma.eventAssignment.deleteMany({
            where: {
                eventId: {
                    in: eventIds
                }
            }
        });
        console.log(`✅ ${deletedAssignments.count} asignaciones eliminadas`);
        
        // Eliminar pagos de eventos (si la tabla existe)
        console.log('🔄 Eliminando pagos...');
        try {
            const deletedPayments = await prisma.eventPayment.deleteMany({
                where: {
                    eventId: {
                        in: eventIds
                    }
                }
            });
            console.log(`✅ ${deletedPayments.count} pagos eliminados`);
        } catch (error) {
            console.log('ℹ️  Tabla de pagos no existe o está vacía');
        }
        
        // Eliminar los eventos
        console.log('🔄 Eliminando eventos...');
        const deletedEvents = await prisma.event.deleteMany({
            where: {
                id: {
                    in: eventIds
                }
            }
        });
        console.log(`✅ ${deletedEvents.count} eventos eliminados`);
        
        // Verificar resultado
        const remainingEvents = await prisma.event.count();
        console.log(`\n📊 Eventos restantes: ${remainingEvents}`);
        
        console.log('\n🎉 Eliminación completada!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteSpecificEvents();