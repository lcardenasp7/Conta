const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanTestEvents() {
    try {
        console.log('🧹 Limpiando eventos de prueba...');
        
        // Obtener todos los eventos
        const allEvents = await prisma.event.findMany({
            select: {
                id: true,
                name: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        console.log(`📊 Total de eventos encontrados: ${allEvents.length}`);
        
        if (allEvents.length === 0) {
            console.log('✅ No hay eventos para eliminar');
            return;
        }
        
        // Mostrar lista de eventos
        console.log('\n📋 Lista de eventos:');
        allEvents.forEach((event, index) => {
            console.log(`${index + 1}. ${event.name} (${event.createdAt.toLocaleDateString()})`);
        });
        
        // Eliminar eventos de prueba (que contengan palabras clave de prueba)
        const testKeywords = ['prueba', 'test', 'demo', 'ejemplo', 'derecho de grado 2024'];
        
        const testEvents = allEvents.filter(event => 
            testKeywords.some(keyword => 
                event.name.toLowerCase().includes(keyword.toLowerCase())
            )
        );
        
        if (testEvents.length === 0) {
            console.log('✅ No se encontraron eventos de prueba para eliminar');
            return;
        }
        
        console.log(`\n🎯 Eventos de prueba encontrados: ${testEvents.length}`);
        testEvents.forEach(event => {
            console.log(`- ${event.name}`);
        });
        
        // Eliminar asignaciones primero (por integridad referencial)
        console.log('\n🔄 Eliminando asignaciones de eventos de prueba...');
        const deletedAssignments = await prisma.eventAssignment.deleteMany({
            where: {
                eventId: {
                    in: testEvents.map(e => e.id)
                }
            }
        });
        console.log(`✅ ${deletedAssignments.count} asignaciones eliminadas`);
        
        // Eliminar pagos de eventos (si existen)
        console.log('🔄 Eliminando pagos de eventos de prueba...');
        const deletedPayments = await prisma.eventPayment.deleteMany({
            where: {
                eventId: {
                    in: testEvents.map(e => e.id)
                }
            }
        });
        console.log(`✅ ${deletedPayments.count} pagos eliminados`);
        
        // Eliminar los eventos
        console.log('🔄 Eliminando eventos de prueba...');
        const deletedEvents = await prisma.event.deleteMany({
            where: {
                id: {
                    in: testEvents.map(e => e.id)
                }
            }
        });
        console.log(`✅ ${deletedEvents.count} eventos eliminados`);
        
        // Verificar resultado final
        const remainingEvents = await prisma.event.count();
        console.log(`\n📊 Eventos restantes en la base de datos: ${remainingEvents}`);
        
        console.log('\n🎉 Limpieza completada exitosamente!');
        
    } catch (error) {
        console.error('❌ Error limpiando eventos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Función para eliminar TODOS los eventos (usar con cuidado)
async function deleteAllEvents() {
    try {
        console.log('⚠️  ELIMINANDO TODOS LOS EVENTOS...');
        
        // Eliminar todas las asignaciones
        const deletedAssignments = await prisma.eventAssignment.deleteMany();
        console.log(`✅ ${deletedAssignments.count} asignaciones eliminadas`);
        
        // Eliminar todos los pagos de eventos
        const deletedPayments = await prisma.eventPayment.deleteMany();
        console.log(`✅ ${deletedPayments.count} pagos eliminados`);
        
        // Eliminar todos los eventos
        const deletedEvents = await prisma.event.deleteMany();
        console.log(`✅ ${deletedEvents.count} eventos eliminados`);
        
        console.log('\n🎉 Todos los eventos han sido eliminados!');
        
    } catch (error) {
        console.error('❌ Error eliminando todos los eventos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar según el argumento
const action = process.argv[2];

if (action === 'all') {
    console.log('⚠️  ¿Estás seguro de que quieres eliminar TODOS los eventos?');
    console.log('⚠️  Esta acción no se puede deshacer.');
    console.log('⚠️  Ejecuta: node scripts/clean-test-events.js confirm-all');
} else if (action === 'confirm-all') {
    deleteAllEvents();
} else {
    cleanTestEvents();
}