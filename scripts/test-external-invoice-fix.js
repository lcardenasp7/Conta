const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testExternalInvoiceCreation() {
    console.log('🧪 Probando creación de facturas externas...');
    
    try {
        // 1. Verificar el último número de factura
        console.log('📊 Verificando último número de factura...');
        
        const lastInvoice = await prisma.invoice.findFirst({
            where: {
                invoiceNumber: {
                    startsWith: 'FAC-2025-'
                }
            },
            orderBy: { invoiceNumber: 'desc' }
        });

        if (lastInvoice) {
            console.log(`📄 Última factura: ${lastInvoice.invoiceNumber}`);
        } else {
            console.log('📄 No se encontraron facturas con formato FAC-2025-');
        }

        // 2. Simular la función de generación de números únicos
        console.log('🔢 Probando generación de número único...');
        
        const uniqueNumber = await generateUniqueInvoiceNumber();
        console.log(`✅ Número generado: ${uniqueNumber}`);

        // 3. Verificar que no existe
        const existing = await prisma.invoice.findUnique({
            where: { invoiceNumber: uniqueNumber }
        });

        if (existing) {
            console.log('❌ ERROR: El número generado ya existe!');
        } else {
            console.log('✅ El número generado es único');
        }

        // 4. Crear una factura de prueba
        console.log('📝 Creando factura de prueba...');
        
        // Buscar un usuario válido
        const user = await prisma.user.findFirst({
            where: { isActive: true }
        });

        if (!user) {
            console.log('❌ No se encontró un usuario válido para la prueba');
            return;
        }

        const testInvoice = await prisma.invoice.create({
            data: {
                invoiceNumber: uniqueNumber,
                concept: 'OTHER',
                subtotal: 100000,
                tax: 0,
                total: 100000,
                status: 'PENDING',
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                userId: user.id,
                type: 'OUTGOING',
                clientName: 'Cliente de Prueba',
                clientDocument: '12345678',
                clientEmail: 'test@example.com',
                isExternal: true,
                items: {
                    create: [{
                        description: 'Producto de prueba',
                        quantity: 1,
                        unitPrice: 100000,
                        total: 100000
                    }]
                }
            },
            include: {
                items: true
            }
        });

        console.log(`✅ Factura de prueba creada: ${testInvoice.invoiceNumber}`);

        // 5. Limpiar - eliminar la factura de prueba
        console.log('🧹 Limpiando factura de prueba...');
        
        await prisma.invoice.delete({
            where: { id: testInvoice.id }
        });

        console.log('✅ Factura de prueba eliminada');

        // 6. Probar creación múltiple simultánea
        console.log('🔄 Probando creación múltiple simultánea...');
        
        const promises = [];
        for (let i = 0; i < 3; i++) {
            promises.push(createTestInvoice(user.id, i + 1));
        }

        const results = await Promise.allSettled(promises);
        
        let successCount = 0;
        let errorCount = 0;
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                console.log(`   ✅ Factura ${index + 1}: ${result.value.invoiceNumber}`);
                successCount++;
            } else {
                console.log(`   ❌ Factura ${index + 1}: ${result.reason.message}`);
                errorCount++;
            }
        });

        console.log(`📊 Resultados: ${successCount} exitosas, ${errorCount} fallidas`);

        // Limpiar facturas de prueba
        const testInvoices = await prisma.invoice.findMany({
            where: {
                clientName: { startsWith: 'Cliente Prueba' }
            }
        });

        if (testInvoices.length > 0) {
            await prisma.invoice.deleteMany({
                where: {
                    clientName: { startsWith: 'Cliente Prueba' }
                }
            });
            console.log(`🧹 Eliminadas ${testInvoices.length} facturas de prueba`);
        }

        console.log('✅ Prueba completada exitosamente');

    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

async function generateUniqueInvoiceNumber(retries = 5) {
    const currentYear = new Date().getFullYear();
    
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const result = await prisma.$transaction(async (tx) => {
                const lastInvoice = await tx.invoice.findFirst({
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
            
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        }
    }
}

async function createTestInvoice(userId, index) {
    const invoiceNumber = await generateUniqueInvoiceNumber();
    
    return await prisma.invoice.create({
        data: {
            invoiceNumber,
            concept: 'OTHER',
            subtotal: 50000,
            tax: 0,
            total: 50000,
            status: 'PENDING',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            userId: userId,
            type: 'OUTGOING',
            clientName: `Cliente Prueba ${index}`,
            clientDocument: `1234567${index}`,
            isExternal: true,
            items: {
                create: [{
                    description: `Producto de prueba ${index}`,
                    quantity: 1,
                    unitPrice: 50000,
                    total: 50000
                }]
            }
        },
        include: {
            items: true
        }
    });
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testExternalInvoiceCreation()
        .then(() => {
            console.log('🎉 Todas las pruebas completadas');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error en las pruebas:', error);
            process.exit(1);
        });
}

module.exports = {
    testExternalInvoiceCreation,
    generateUniqueInvoiceNumber
};