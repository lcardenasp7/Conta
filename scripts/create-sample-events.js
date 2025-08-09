const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleEvents() {
  try {
    console.log('🎯 Creating sample events...');

    // Buscar un usuario activo para asignar como responsable
    const user = await prisma.user.findFirst({
      where: { isActive: true }
    });

    if (!user) {
      console.log('❌ No active user found. Please create a user first.');
      return;
    }

    console.log(`👤 Using user: ${user.name} (${user.email})`);

    // Crear eventos de muestra
    const sampleEvents = [
      {
        name: 'Bingo Navideño 2024',
        type: 'BINGO',
        description: 'Bingo para recaudar fondos para la celebración navideña del colegio',
        eventDate: new Date('2024-12-15T19:00:00Z'),
        location: 'Auditorio Principal',
        ticketPrice: 5000,
        fundraisingGoal: 500000,
        totalRaised: 0,
        responsible: user.name,
        responsibleId: user.id,
        status: 'ACTIVE'
      },
      {
        name: 'Rifa del Día del Estudiante',
        type: 'RAFFLE',
        description: 'Rifa con premios especiales para celebrar el día del estudiante',
        eventDate: new Date('2024-09-15T14:00:00Z'),
        location: 'Patio Central',
        ticketPrice: 2000,
        fundraisingGoal: 300000,
        totalRaised: 280000,
        responsible: user.name,
        responsibleId: user.id,
        status: 'COMPLETED'
      },
      {
        name: 'Concurso de Talentos 2024',
        type: 'CULTURAL',
        description: 'Concurso anual de talentos estudiantiles con participación de todos los grados',
        eventDate: new Date('2024-10-30T18:00:00Z'),
        location: 'Teatro del Colegio',
        ticketPrice: 8000,
        fundraisingGoal: 400000,
        totalRaised: 0,
        responsible: user.name,
        responsibleId: user.id,
        status: 'PLANNING'
      },
      {
        name: 'Festival Deportivo',
        type: 'SPORTS',
        description: 'Festival deportivo inter-cursos con actividades para toda la familia',
        eventDate: new Date('2024-11-20T08:00:00Z'),
        location: 'Cancha Múltiple',
        ticketPrice: 3000,
        fundraisingGoal: 200000,
        totalRaised: 45000,
        responsible: user.name,
        responsibleId: user.id,
        status: 'ACTIVE'
      },
      {
        name: 'Grado 11 - Recaudación de Fondos',
        type: 'FUNDRAISING',
        description: 'Evento especial para recaudar fondos para la ceremonia de graduación',
        eventDate: new Date('2024-11-30T16:00:00Z'),
        location: 'Salón de Eventos',
        ticketPrice: 10000,
        fundraisingGoal: 800000,
        totalRaised: 120000,
        responsible: user.name,
        responsibleId: user.id,
        status: 'ACTIVE'
      }
    ];

    // Crear eventos
    const createdEvents = [];
    for (const eventData of sampleEvents) {
      const event = await prisma.event.create({
        data: eventData,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });
      createdEvents.push(event);
      console.log(`✅ Created event: ${event.name}`);
    }

    console.log(`\n🎉 Successfully created ${createdEvents.length} sample events!`);

    // Mostrar resumen
    console.log('\n📊 Events Summary:');
    createdEvents.forEach(event => {
      console.log(`- ${event.name} (${event.type}) - ${event.status}`);
    });

    return createdEvents;

  } catch (error) {
    console.error('❌ Error creating sample events:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Función para crear asignaciones de muestra
async function createSampleAssignments() {
  try {
    console.log('\n🎯 Creating sample event assignments...');

    // Obtener eventos activos
    const activeEvents = await prisma.event.findMany({
      where: { status: { in: ['ACTIVE', 'PLANNING'] } }
    });

    if (activeEvents.length === 0) {
      console.log('❌ No active events found');
      return;
    }

    // Obtener algunos estudiantes activos
    const students = await prisma.student.findMany({
      where: { status: 'ACTIVE' },
      take: 20, // Solo los primeros 20 para prueba
      include: {
        grade: { select: { name: true } },
        group: { select: { name: true } }
      }
    });

    if (students.length === 0) {
      console.log('❌ No active students found');
      return;
    }

    console.log(`👥 Found ${students.length} students`);

    // Crear asignaciones para el primer evento activo
    const targetEvent = activeEvents[0];
    console.log(`🎯 Creating assignments for: ${targetEvent.name}`);

    const assignments = [];
    for (let i = 0; i < Math.min(students.length, 15); i++) {
      const student = students[i];
      const ticketsAssigned = Math.floor(Math.random() * 5) + 1; // 1-5 boletos
      const ticketsSold = Math.floor(Math.random() * ticketsAssigned); // 0 a ticketsAssigned

      try {
        const assignment = await prisma.eventAssignment.create({
          data: {
            eventId: targetEvent.id,
            studentId: student.id,
            ticketsAssigned,
            ticketsSold,
            amountRaised: ticketsSold * targetEvent.ticketPrice,
            status: ticketsSold === ticketsAssigned ? 'COMPLETED' : 
                    ticketsSold > 0 ? 'PARTIAL' : 'PENDING'
          },
          include: {
            student: {
              include: {
                grade: { select: { name: true } },
                group: { select: { name: true } }
              }
            }
          }
        });

        assignments.push(assignment);
        console.log(`✅ Assigned ${ticketsAssigned} tickets to ${student.firstName} ${student.lastName} (${student.grade.name}-${student.group.name})`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Assignment already exists for ${student.firstName} ${student.lastName}`);
        } else {
          console.error(`❌ Error creating assignment for ${student.firstName} ${student.lastName}:`, error);
        }
      }
    }

    // Actualizar el total recaudado del evento
    const totalRaised = assignments.reduce((sum, a) => sum + a.amountRaised, 0);
    await prisma.event.update({
      where: { id: targetEvent.id },
      data: { totalRaised }
    });

    console.log(`\n🎉 Created ${assignments.length} assignments for ${targetEvent.name}`);
    console.log(`💰 Total raised: $${totalRaised.toLocaleString()}`);

    return assignments;

  } catch (error) {
    console.error('❌ Error creating sample assignments:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createSampleEvents()
    .then(() => createSampleAssignments())
    .then(() => {
      console.log('\n✅ Sample events and assignments created successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { createSampleEvents, createSampleAssignments };