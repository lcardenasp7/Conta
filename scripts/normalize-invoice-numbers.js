const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function normalizeInvoiceNumbers() {
    console.log('🔧 Iniciando normalización de números de factura...');
    
    try {
        // 1. Obtener todas las facturas
        console.log('📊 Obteniendo todas las facturas...');
        
        const allInvoices = await prisma.invoice.findMany({
            orderBy: { createdAt: 'asc' }
        });

        console.log(`📄 Encontradas ${allInvoices.length} facturas`);

        // 2. Identificar facturas con formato incorrecto
        const incorrectFormatInvoices = allInvoices.filter(invoice => 
            !invoice.invoiceNumber.startsWith('FAC-')
        );

        console.log(`⚠️  Facturas con formato incorrecto: ${incorrectFormatInvoices.length}`);

        if (incorrectFormatInvoices.length > 0) {
            console.log('Ejemplos de formatos incorrectos:');
            incorrectFormatInvoices.slice(0, 5).forEach(invoice => {
                console.log(`   - ${invoice.invoiceNumber} (${invoice.createdAt.toISOString().split('T')[0]})`);
            });
        }

        // 3. Renumerar todas las facturas con formato correcto
        console.log('🔄 Renumerando facturas...');
        
        const currentYear = new Date().getFullYear();
        let counter = 1;

        for (const invoice of allInvoices) {
            const year = invoice.createdAt.getFullYear();
            const newInvoiceNumber = `FAC-${year}-${counter.toString().padStart(6, '0')}`;
            
            // Verificar que el nuevo número no existe
            const existing = await prisma.invoice.findUnique({
                where: { 
                    invoiceNumber: newInvoiceNumber,
                    NOT: { id: invoice.id }
                }
            });

            if (!existing) {
                await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: { invoiceNumber: newInvoiceNumber }
                });

                console.log(`   ✅ ${invoice.invoiceNumber} → ${newInvoiceNumber}`);
            } else {
                console.log(`   ⚠️  Saltando ${invoice.invoiceNumber} (${newInvoiceNumber} ya existe)`);
            }

            counter++;
        }

        // 4. Verificar resultado
        console.log('🔍 Verificando resultado...');
        
        const updatedInvoices = await prisma.invoice.findMany({
            orderBy: { invoiceNumber: 'desc' },
            take: 5
        });

        console.log('Últimas 5 facturas después de la normalización:');
        updatedInvoices.forEach(invoice => {
            console.log(`   - ${invoice.invoiceNumber} (${invoice.createdAt.toISOString().split('T')[0]})`);
        });

        console.log('✅ Normalización completada exitosamente');

    } catch (error) {
        console.error('❌ Error durante la normalización:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Función alternativa más conservadora que solo corrige formatos obviamente incorrectos
async function fixObviouslyIncorrectNumbers() {
    console.log('🔧 Corrigiendo solo números obviamente incorrectos...');
    
    try {
        // Buscar facturas con formatos claramente incorrectos
        const incorrectInvoices = await prisma.invoice.findMany({
            where: {
                OR: [
                    { invoiceNumber: { startsWith: 'PROV-' } },
                    { invoiceNumber: { startsWith: 'INV-' } },
                    { invoiceNumber: { contains: '1755030335140' } }, // Timestamp incorrecto
                    { invoiceNumber: { not: { startsWith: 'FAC-' } } }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });

        console.log(`⚠️  Encontradas ${incorrectInvoices.length} facturas con formato incorrecto`);

        if (incorrectInvoices.length === 0) {
            console.log('✅ No hay facturas con formato incorrecto');
            return;
        }

        // Obtener el último número FAC- válido
        const lastValidInvoice = await prisma.invoice.findFirst({
            where: {
                invoiceNumber: { startsWith: 'FAC-' }
            },
            orderBy: { invoiceNumber: 'desc' }
        });

        let nextNumber = 1;
        if (lastValidInvoice) {
            const parts = lastValidInvoice.invoiceNumber.split('-');
            if (parts.length === 3) {
                nextNumber = parseInt(parts[2]) + 1;
            }
        }

        console.log(`🔢 Comenzando numeración desde: ${nextNumber}`);

        // Corregir cada factura
        for (const invoice of incorrectInvoices) {
            const year = invoice.createdAt.getFullYear();
            const newInvoiceNumber = `FAC-${year}-${nextNumber.toString().padStart(6, '0')}`;
            
            // Verificar que no existe
            const existing = await prisma.invoice.findUnique({
                where: { invoiceNumber: newInvoiceNumber }
            });

            if (!existing) {
                await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: { invoiceNumber: newInvoiceNumber }
                });

                console.log(`   ✅ ${invoice.invoiceNumber} → ${newInvoiceNumber}`);
                nextNumber++;
            } else {
                console.log(`   ⚠️  ${newInvoiceNumber} ya existe, incrementando...`);
                nextNumber++;
                // Reintentar con el siguiente número
                const retryNumber = `FAC-${year}-${nextNumber.toString().padStart(6, '0')}`;
                await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: { invoiceNumber: retryNumber }
                });
                console.log(`   ✅ ${invoice.invoiceNumber} → ${retryNumber}`);
                nextNumber++;
            }
        }

        console.log('✅ Corrección completada');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const args = process.argv.slice(2);
    const mode = args[0] || 'conservative';

    if (mode === 'full') {
        normalizeInvoiceNumbers()
            .then(() => {
                console.log('🎉 Normalización completa terminada');
                process.exit(0);
            })
            .catch((error) => {
                console.error('💥 Error fatal:', error);
                process.exit(1);
            });
    } else {
        fixObviouslyIncorrectNumbers()
            .then(() => {
                console.log('🎉 Corrección conservadora terminada');
                process.exit(0);
            })
            .catch((error) => {
                console.error('💥 Error fatal:', error);
                process.exit(1);
            });
    }
}

module.exports = {
    normalizeInvoiceNumbers,
    fixObviouslyIncorrectNumbers
};