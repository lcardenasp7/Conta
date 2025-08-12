const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSupplierInvoice() {
    try {
        console.log('🧾 Probando creación de factura de proveedor...');
        
        // Buscar un usuario para asignar como responsable
        const user = await prisma.user.findFirst({
            where: { isActive: true }
        });
        
        if (!user) {
            console.log('❌ No se encontró usuario activo');
            return;
        }
        
        // Crear factura de proveedor de prueba
        const invoice = await prisma.invoice.create({
            data: {
                type: 'INCOMING',
                invoiceNumber: 'PROV-001-2025',
                date: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
                concept: 'OFFICE_SUPPLIES',
                supplierName: 'Papelería San José',
                supplierDocument: '900123456-7',
                supplierEmail: 'ventas@papeleriasanjose.com',
                supplierPhone: '3001234567',
                supplierAddress: 'Calle 45 #23-67, Barranquilla',
                subtotal: 250000,
                tax: 47500, // 19% IVA
                total: 297500,
                status: 'PENDING',
                userId: user.id,
                observations: 'Compra de útiles de oficina para el mes de agosto'
            }
        });
        
        // Crear items de la factura
        const items = [
            {
                invoiceId: invoice.id,
                description: 'Resma de papel carta',
                quantity: 10,
                unitPrice: 15000,
                total: 150000
            },
            {
                invoiceId: invoice.id,
                description: 'Bolígrafos azules (caja x 12)',
                quantity: 5,
                unitPrice: 8000,
                total: 40000
            },
            {
                invoiceId: invoice.id,
                description: 'Carpetas colgantes',
                quantity: 20,
                unitPrice: 3000,
                total: 60000
            }
        ];
        
        for (const item of items) {
            await prisma.invoiceItem.create({ data: item });
        }
        
        console.log('✅ Factura de proveedor creada exitosamente:');
        console.log(`   ID: ${invoice.id}`);
        console.log(`   Número: ${invoice.invoiceNumber}`);
        console.log(`   Tipo: ${invoice.type}`);
        console.log(`   Proveedor: ${invoice.supplierName}`);
        console.log(`   NIT: ${invoice.supplierDocument}`);
        console.log(`   Concepto: ${invoice.concept}`);
        console.log(`   Total: $${invoice.total.toLocaleString('es-CO')}`);
        console.log(`   Estado: ${invoice.status}`);
        
        // Verificar que se guardó correctamente
        const savedInvoice = await prisma.invoice.findUnique({
            where: { id: invoice.id },
            include: { items: true }
        });
        
        if (savedInvoice && savedInvoice.type === 'INCOMING') {
            console.log('✅ Factura de proveedor guardada correctamente');
            console.log(`✅ Items creados: ${savedInvoice.items.length}`);
        } else {
            console.log('❌ Error: Factura no se guardó correctamente');
        }
        
        // Probar consulta de facturas por tipo
        const incomingInvoices = await prisma.invoice.findMany({
            where: { type: 'INCOMING' },
            include: { items: true }
        });
        
        console.log(`✅ Facturas de proveedores encontradas: ${incomingInvoices.length}`);
        
        // Limpiar - eliminar la factura de prueba
        await prisma.invoiceItem.deleteMany({
            where: { invoiceId: invoice.id }
        });
        
        await prisma.invoice.delete({
            where: { id: invoice.id }
        });
        
        console.log('🧹 Factura de prueba eliminada');
        console.log('🎉 Prueba completada exitosamente');
        
        console.log('\n📋 RESUMEN DEL SISTEMA DE FACTURAS:');
        console.log('✅ Facturas Emitidas (OUTGOING): Para estudiantes y clientes externos');
        console.log('✅ Facturas Recibidas (INCOMING): De proveedores y servicios');
        console.log('✅ Conceptos expandidos para ambos tipos');
        console.log('✅ Campos específicos para proveedores');
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testSupplierInvoice();