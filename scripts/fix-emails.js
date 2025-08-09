const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Function to generate email based on the correct format
function generateEmail(firstName, lastName, document) {
    // Get first letter of first name
    const firstLetter = firstName.charAt(0).toLowerCase();
    
    // Get first last name (split by spaces and take first part)
    const firstLastName = lastName.split(' ')[0].toLowerCase();
    
    // Replace ñ with n for email compatibility
    const cleanFirstLetter = firstLetter.replace(/ñ/g, 'n');
    const cleanFirstLastName = firstLastName.replace(/ñ/g, 'n');
    
    // Get last 4 digits of document
    const last4Digits = document.toString().slice(-4);
    
    // Generate email: firstLetter + firstLastName + last4digits + e@villasanpablo.edu.co
    return `${cleanFirstLetter}${cleanFirstLastName}${last4Digits}e@villasanpablo.edu.co`;
}

async function fixEmails() {
  try {
    console.log('📧 Iniciando corrección de emails...');
    
    // Get all students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        document: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });
    
    console.log(`📊 Total de estudiantes a procesar: ${students.length}`);
    
    let corrected = 0;
    
    // Process in batches
    const batchSize = 100;
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      
      await prisma.$transaction(async (tx) => {
        for (const student of batch) {
          // Generate new email with correct names
          const newEmail = generateEmail(student.firstName, student.lastName, student.document);
          
          // Update only if email is different
          if (student.email !== newEmail) {
            await tx.student.update({
              where: { id: student.id },
              data: { email: newEmail }
            });
            
            corrected++;
          }
        }
      });
      
      console.log(`✅ Procesados: ${Math.min(i + batchSize, students.length)}/${students.length}`);
    }
    
    console.log(`🎉 ¡Corrección de emails completada! Total corregidos: ${corrected}`);
    
    // Show some examples
    console.log('\n📧 Ejemplos de emails corregidos:');
    const examples = await prisma.student.findMany({
      take: 5,
      select: {
        document: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });
    
    examples.forEach(s => {
      console.log(`${s.firstName} ${s.lastName} (${s.document})`);
      console.log(`Email: ${s.email}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error al corregir emails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEmails();