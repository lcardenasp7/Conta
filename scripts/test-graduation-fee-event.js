const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testGraduationFeeEvent() {
    try {
        console.log('🎓 Probando creación de evento "Derecho de Grado"...');
        
        // Buscar un usuario para asignar como responsable
        const user = await prisma.user.findFirst({
            where: { isActive: true }
        });
        
        if (!user) {
            console.log('❌ No se encontró usuario activo');
            return;
        }
        
        // Crear evento de prueba
        const event = await prisma.event.create({
            data: {
                name: 'Derecho de Grado 2025',
                type: 'GRADUATION_FEE',
                description: 'Pago de derecho de grado para estudiantes de undécimo',
                eventDate: new Date('2025-11-15'),
                location: 'Secretaría Académica',
                ticketPrice: 150000, // $150,000 COP
                fundraisingGoal: 0,
                totalRaised: 0,
                responsible: user.name,
                responsibleId: user.id,
                status: 'PLANNING',
                assignmentType: 'BY_GRADE'
            }
        });
        
        console.log('✅ Evento creado exitosamente:');
        console.log(`   ID: ${event.id}`);
        console.log(`   Nombre: ${event.name}`);
        console.log(`   Tipo: ${event.type}`);
        console.log(`   Precio: $${event.ticketPrice.toLocaleString('es-CO')}`);
        console.log(`   Fecha: ${event.eventDate.toLocaleDateString('es-CO')}`);
        console.log(`   Responsable: ${event.responsible}`);
        
        // Verificar que el tipo se guardó correctamente
        const savedEvent = await prisma.event.findUnique({
            where: { id: event.id }
        });
        
        if (savedEvent && savedEvent.type === 'GRADUATION_FEE') {
            console.log('✅ Tipo de evento "GRADUATION_FEE" guardado correctamente');
        } else {
            console.log('❌ Error: Tipo de evento no se guardó correctamente');
        }
        
        // Limpiar - eliminar el evento de prueba
        await prisma.event.delete({
            where: { id: event.id }
        });
        
        console.log('🧹 Evento de prueba eliminado');
        console.log('🎉 Prueba completada exitosamente');
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testGraduationFeeEvent();