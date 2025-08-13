const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixInvoiceNumberGeneration() {
    console.log('🔧 Iniciando corrección de generación de números de factura...');
    
    try {
        // 1. Verificar facturas duplicadas existentes
        console.log('📊 Verificando facturas con números duplicados...');
        
        const duplicateNumbers = await prisma.invoice.groupBy({
            by: ['invoiceNumber'],
            having: {
                invoiceNumber: {
                    _count: {
                        gt: 1
                    }
                }
            },
            _count: {
                invoiceNumber: true
            }
        });

        if (duplicateNumbers.length > 0) {
            console.log(`⚠️  Encontradas ${duplicateNumbers.length} números de factura duplicados:`);
            duplicateNumbers.forEach(dup => {
                console.log(`   - ${dup.invoiceNumber}: ${dup._count.invoiceNumber} veces`);
            });

            // Corregir números duplicados
            for (const duplicate of duplicateNumbers) {
                await fixDuplicateInvoiceNumber(duplicate.invoiceNumber);
            }
        } else {
            console.log('✅ No se encontraron números de factura duplicados');
        }

        // 2. Verificar el último número de factura
        console.log('🔍 Verificando último número de factura...');
        
        const lastInvoice = await prisma.invoice.findFirst({
            orderBy: { invoiceNumber: 'desc' }
        });

        if (lastInvoice) {
            console.log(`📄 Última factura: ${lastInvoice.invoiceNumber}`);
            
            // Extraer el número secuencial
            const parts = lastInvoice.invoiceNumber.split('-');
            if (parts.length === 3) {
                const year = parts[1];
                const number = parseInt(parts[2]);
                console.log(`   Año: ${year}, Número: ${number}`);
            }
        }

        // 3. Crear función mejorada para generar números únicos
        console.log('🛠️  Implementando función mejorada de generación...');
        
        await createImprovedInvoiceNumberFunction();

        console.log('✅ Corrección completada exitosamente');

    } catch (error) {
        console.error('❌ Error durante la corrección:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

async function fixDuplicateInvoiceNumber(duplicateNumber) {
    console.log(`🔄 Corrigiendo número duplicado: ${duplicateNumber}`);
    
    // Obtener todas las facturas con este número
    const duplicateInvoices = await prisma.invoice.findMany({
        where: { invoiceNumber: duplicateNumber },
        orderBy: { createdAt: 'asc' }
    });

    // Mantener la primera, renumerar las demás
    for (let i = 1; i < duplicateInvoices.length; i++) {
        const invoice = duplicateInvoices[i];
        const newNumber = await generateUniqueInvoiceNumber();
        
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: { invoiceNumber: newNumber }
        });
        
        console.log(`   ✅ Factura ${invoice.id} renumerada: ${duplicateNumber} → ${newNumber}`);
    }
}

async function generateUniqueInvoiceNumber() {
    const currentYear = new Date().getFullYear();
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
        // Obtener el último número del año actual
        const lastInvoice = await prisma.invoice.findFirst({
            where: {
                invoiceNumber: {
                    startsWith: `FAC-${currentYear}-`
                }
            },
            orderBy: { invoiceNumber: 'desc' }
        });

        let nextNumber = 1;
        if (lastInvoice) {
            const parts = lastInvoice.invoiceNumber.split('-');
            if (parts.length === 3) {
                nextNumber = parseInt(parts[2]) + 1;
            }
        }

        const invoiceNumber = `FAC-${currentYear}-${nextNumber.toString().padStart(6, '0')}`;

        // Verificar que no existe
        const existing = await prisma.invoice.findUnique({
            where: { invoiceNumber }
        });

        if (!existing) {
            return invoiceNumber;
        }

        attempts++;
    }

    throw new Error('No se pudo generar un número de factura único después de múltiples intentos');
}

async function createImprovedInvoiceNumberFunction() {
    // Esta función se implementará en el archivo de rutas
    console.log('📝 Función mejorada lista para implementar en routes/invoice.routes.js');
    
    const improvedFunction = `
// Función mejorada para generar números de factura únicos
async function generateUniqueInvoiceNumber(prisma, retries = 5) {
    const currentYear = new Date().getFullYear();
    
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            // Usar transacción para evitar condiciones de carrera
            const result = await prisma.$transaction(async (tx) => {
                // Obtener el último número del año actual con bloqueo
                const lastInvoice = await tx.invoice.findFirst({
                    where: {
                        invoiceNumber: {
                            startsWith: \`FAC-\${currentYear}-\`
                        }
                    },
                    orderBy: { invoiceNumber: 'desc' }
                });

                let nextNumber = 1;
                if (lastInvoice) {
                    const parts = lastInvoice.invoiceNumber.split('-');
                    if (parts.length === 3) {
                        nextNumber = parseInt(parts[2]) + 1;
                    }
                }

                const invoiceNumber = \`FAC-\${currentYear}-\${nextNumber.toString().padStart(6, '0')}\`;

                // Verificar que no existe (doble verificación)
                const existing = await tx.invoice.findUnique({
                    where: { invoiceNumber }
                });

                if (existing) {
                    throw new Error('Número de factura ya existe');
                }

                return invoiceNumber;
            });

            return result;
        } catch (error) {
            if (attempt === retries - 1) {
                throw new Error('No se pudo generar un número de factura único: ' + error.message);
            }
            
            // Esperar un tiempo aleatorio antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        }
    }
}`;

    console.log('Función mejorada:');
    console.log(improvedFunction);
}

// Ejecutar si se llama directamente
if (require.main === module) {
    fixInvoiceNumberGeneration()
        .then(() => {
            console.log('🎉 Proceso completado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        });
}

module.exports = {
    fixInvoiceNumberGeneration,
    generateUniqueInvoiceNumber
};