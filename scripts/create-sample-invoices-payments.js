const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleInvoicesAndPayments() {
    try {
        console.log('📄 Creando facturas y pagos de muestra...');
        
        // Get some students
        const students = await prisma.student.findMany({
            take: 20,
            include: {
                grade: true,
                group: true
            }
        });
        
        if (students.length === 0) {
            console.log('❌ No hay estudiantes en la base de datos');
            return;
        }
        
        // Get a user for the invoices
        const user = await prisma.user.findFirst({
            where: { isActive: true }
        });
        
        if (!user) {
            console.log('❌ No hay usuarios activos');
            return;
        }
        
        console.log(`👥 Encontrados ${students.length} estudiantes`);
        console.log(`👤 Usuario responsable: ${user.name}`);
        
        let invoicesCreated = 0;
        let paymentsCreated = 0;
        
        // Create invoices for students
        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            
            // Create 1-3 invoices per student
            const numInvoices = Math.floor(Math.random() * 3) + 1;
            
            for (let j = 0; j < numInvoices; j++) {
                const concepts = ['TUITION', 'MONTHLY', 'EVENT', 'UNIFORM', 'BOOKS'];
                const concept = concepts[Math.floor(Math.random() * concepts.length)];
                
                // Random date in the last 6 months
                const invoiceDate = new Date();
                invoiceDate.setMonth(invoiceDate.getMonth() - Math.floor(Math.random() * 6));
                
                // Due date 30 days after invoice date
                const dueDate = new Date(invoiceDate);
                dueDate.setDate(dueDate.getDate() + 30);
                
                // Random amount based on concept
                let amount;
                switch (concept) {
                    case 'TUITION': amount = 200000 + Math.random() * 100000; break;
                    case 'MONTHLY': amount = 150000 + Math.random() * 50000; break;
                    case 'EVENT': amount = 20000 + Math.random() * 30000; break;
                    case 'UNIFORM': amount = 80000 + Math.random() * 40000; break;
                    case 'BOOKS': amount = 100000 + Math.random() * 50000; break;
                    default: amount = 50000 + Math.random() * 100000;
                }
                
                const invoice = await prisma.invoice.create({
                    data: {
                        invoiceNumber: `INV-${Date.now()}-${invoicesCreated + 1}`,
                        date: invoiceDate,
                        dueDate: dueDate,
                        studentId: student.id,
                        concept: concept,
                        subtotal: amount,
                        tax: amount * 0.19, // 19% IVA
                        total: amount * 1.19,
                        status: Math.random() > 0.3 ? 'PENDING' : 'PAID',
                        userId: user.id,
                        type: 'OUTGOING'
                    }
                });
                
                // Create invoice items
                await prisma.invoiceItem.create({
                    data: {
                        invoiceId: invoice.id,
                        description: getConceptDescription(concept),
                        quantity: 1,
                        unitPrice: amount,
                        total: amount
                    }
                });
                
                invoicesCreated++;
                
                // Create payment for some invoices (70% chance)
                if (Math.random() > 0.3) {
                    const paymentDate = new Date(invoiceDate);
                    paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 45));
                    
                    // Sometimes partial payment, sometimes full
                    const paymentAmount = Math.random() > 0.2 ? invoice.total : invoice.total * (0.3 + Math.random() * 0.4);
                    
                    const payment = await prisma.payment.create({
                        data: {
                            paymentNumber: `PAY-${Date.now()}-${paymentsCreated + 1}`,
                            date: paymentDate,
                            studentId: student.id,
                            invoiceId: invoice.id,
                            amount: paymentAmount,
                            method: getRandomPaymentMethod(),
                            reference: `REF-${Math.floor(Math.random() * 1000000)}`,
                            userId: user.id,
                            status: 'COMPLETED'
                        }
                    });
                    
                    paymentsCreated++;
                    
                    // Update invoice status based on payment
                    const newStatus = paymentAmount >= invoice.total ? 'PAID' : 'PARTIAL';
                    await prisma.invoice.update({
                        where: { id: invoice.id },
                        data: { status: newStatus }
                    });
                }
                
                // Small delay to avoid timestamp conflicts
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        // Create some supplier invoices (expenses)
        console.log('🏢 Creando facturas de proveedores...');
        
        const suppliers = [
            { name: 'Papelería San José', nit: '900123456-7' },
            { name: 'Servicios Públicos EPM', nit: '890900274-3' },
            { name: 'Mantenimiento Integral SAS', nit: '901234567-8' },
            { name: 'Suministros Educativos Ltda', nit: '800987654-2' },
            { name: 'Limpieza Total', nit: '901876543-1' }
        ];
        
        let supplierInvoicesCreated = 0;
        
        for (let i = 0; i < 15; i++) {
            const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
            const concepts = ['OFFICE_SUPPLIES', 'UTILITIES', 'MAINTENANCE', 'EDUCATIONAL_MATERIALS', 'CLEANING_SUPPLIES'];
            const concept = concepts[Math.floor(Math.random() * concepts.length)];
            
            const invoiceDate = new Date();
            invoiceDate.setMonth(invoiceDate.getMonth() - Math.floor(Math.random() * 3));
            
            const dueDate = new Date(invoiceDate);
            dueDate.setDate(dueDate.getDate() + 30);
            
            let amount;
            switch (concept) {
                case 'UTILITIES': amount = 500000 + Math.random() * 300000; break;
                case 'MAINTENANCE': amount = 800000 + Math.random() * 500000; break;
                case 'OFFICE_SUPPLIES': amount = 200000 + Math.random() * 200000; break;
                case 'EDUCATIONAL_MATERIALS': amount = 1000000 + Math.random() * 500000; break;
                case 'CLEANING_SUPPLIES': amount = 300000 + Math.random() * 200000; break;
                default: amount = 400000 + Math.random() * 300000;
            }
            
            const invoice = await prisma.invoice.create({
                data: {
                    invoiceNumber: `PROV-${Date.now()}-${supplierInvoicesCreated + 1}`,
                    date: invoiceDate,
                    dueDate: dueDate,
                    concept: concept,
                    subtotal: amount,
                    tax: amount * 0.19,
                    total: amount * 1.19,
                    status: Math.random() > 0.4 ? 'PENDING' : 'PAID',
                    userId: user.id,
                    type: 'INCOMING',
                    supplierName: supplier.name,
                    supplierDocument: supplier.nit
                }
            });
            
            // Create invoice items
            await prisma.invoiceItem.create({
                data: {
                    invoiceId: invoice.id,
                    description: getSupplierConceptDescription(concept),
                    quantity: 1,
                    unitPrice: amount,
                    total: amount
                }
            });
            
            supplierInvoicesCreated++;
            
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        console.log('\n🎉 Datos de muestra creados exitosamente:');
        console.log(`   📄 Facturas de estudiantes: ${invoicesCreated}`);
        console.log(`   💰 Pagos registrados: ${paymentsCreated}`);
        console.log(`   🏢 Facturas de proveedores: ${supplierInvoicesCreated}`);
        console.log('\n✅ Ahora puedes probar los reportes financieros!');
        
    } catch (error) {
        console.error('❌ Error creando datos de muestra:', error);
    } finally {
        await prisma.$disconnect();
    }
}

function getConceptDescription(concept) {
    const descriptions = {
        'TUITION': 'Matrícula año académico 2025',
        'MONTHLY': 'Mensualidad escolar',
        'EVENT': 'Evento escolar - Derecho de grado',
        'UNIFORM': 'Uniforme escolar completo',
        'BOOKS': 'Kit de libros y materiales'
    };
    return descriptions[concept] || 'Concepto educativo';
}

function getSupplierConceptDescription(concept) {
    const descriptions = {
        'OFFICE_SUPPLIES': 'Útiles de oficina y papelería',
        'UTILITIES': 'Servicios públicos - Energía eléctrica',
        'MAINTENANCE': 'Mantenimiento de instalaciones',
        'EDUCATIONAL_MATERIALS': 'Material educativo y didáctico',
        'CLEANING_SUPPLIES': 'Insumos de aseo y limpieza'
    };
    return descriptions[concept] || 'Suministro institucional';
}

function getRandomPaymentMethod() {
    const methods = ['CASH', 'BANK_TRANSFER', 'CARD', 'CHECK'];
    return methods[Math.floor(Math.random() * methods.length)];
}

createSampleInvoicesAndPayments();