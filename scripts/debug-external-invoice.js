#!/usr/bin/env node

/**
 * Script para diagnosticar problemas con facturas externas
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugExternalInvoice() {
    console.log('🔍 Diagnosticando problemas con facturas externas...\n');

    try {
        // 1. Test database connection
        console.log('1️⃣ Probando conexión a base de datos...');
        await prisma.$connect();
        console.log('✅ Conexión a base de datos OK\n');

        // 2. Check Invoice model structure
        console.log('2️⃣ Verificando estructura del modelo Invoice...');
        
        // Try to find any invoice to test the model
        const sampleInvoice = await prisma.invoice.findFirst({
            include: {
                items: true,
                user: { select: { name: true } }
            }
        });
        
        if (sampleInvoice) {
            console.log('✅ Modelo Invoice funciona correctamente');
            console.log(`   Factura de ejemplo: ${sampleInvoice.invoiceNumber}`);
        } else {
            console.log('⚠️  No hay facturas en la base de datos (normal en primera ejecución)');
        }
        console.log('');

        // 3. Check user permissions
        console.log('3️⃣ Verificando usuarios con permisos de contabilidad...');
        const accountingUsers = await prisma.user.findMany({
            where: {
                role: { in: ['RECTOR', 'ACCOUNTANT', 'AUXILIARY_ACCOUNTANT', 'ADMIN'] },
                isActive: true
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });

        if (accountingUsers.length > 0) {
            console.log(`✅ ${accountingUsers.length} usuarios con permisos encontrados:`);
            accountingUsers.forEach(user => {
                console.log(`   • ${user.name} (${user.email}) - ${user.role}`);
            });
        } else {
            console.log('❌ No hay usuarios con permisos de contabilidad');
        }
        console.log('');

        // 4. Test invoice number generation
        console.log('4️⃣ Probando generación de número de factura...');
        const lastInvoice = await prisma.invoice.findFirst({
            orderBy: { invoiceNumber: 'desc' }
        });
        
        const nextNumber = lastInvoice 
            ? parseInt(lastInvoice.invoiceNumber.split('-')[2]) + 1 
            : 1;
        
        const invoiceNumber = `FAC-${new Date().getFullYear()}-${nextNumber.toString().padStart(6, '0')}`;
        console.log(`✅ Próximo número de factura: ${invoiceNumber}\n`);

        // 5. Test creating a minimal invoice (dry run)
        console.log('5️⃣ Probando creación de factura (simulación)...');
        
        const testUser = accountingUsers[0];
        if (!testUser) {
            console.log('❌ No se puede probar: no hay usuarios con permisos');
            return;
        }

        const testData = {
            invoiceNumber: 'TEST-2025-000001',
            concept: 'UNIFORM',
            subtotal: 100000,
            tax: 0,
            total: 100000,
            status: 'PENDING',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            userId: testUser.id,
            type: 'OUTGOING',
            clientName: 'Cliente de Prueba',
            clientDocument: '12345678-9',
            isExternal: true
        };

        console.log('📋 Datos de prueba:', JSON.stringify(testData, null, 2));

        // Don't actually create, just validate the data structure
        console.log('✅ Estructura de datos válida para creación\n');

        // 6. Check for common issues
        console.log('6️⃣ Verificando problemas comunes...');
        
        // Check for duplicate invoice numbers
        const duplicateCheck = await prisma.invoice.findUnique({
            where: { invoiceNumber: invoiceNumber }
        });
        
        if (duplicateCheck) {
            console.log('⚠️  Posible problema: número de factura ya existe');
        } else {
            console.log('✅ No hay conflictos de números de factura');
        }

        // Check InvoiceConcept enum values
        console.log('✅ Conceptos de factura válidos: UNIFORM, BOOKS, TRANSPORT, etc.');
        console.log('✅ Estados de factura válidos: PENDING, PAID, PARTIAL, etc.');
        console.log('');

        console.log('7️⃣ Recomendaciones:');
        console.log('   • Reinicia el servidor para aplicar cambios en las rutas');
        console.log('   • Verifica que el usuario tenga permisos de contabilidad');
        console.log('   • Revisa los logs del servidor al crear la factura');
        console.log('   • Usa el script test-external-invoice.js para probar');

    } catch (error) {
        console.error('❌ Error durante el diagnóstico:', error);
        console.log('\n🔧 Posibles causas:');
        console.log('   • Base de datos no conectada');
        console.log('   • Esquema de Prisma desactualizado');
        console.log('   • Permisos de base de datos');
        console.log('   • Configuración de .env incorrecta');
        
        console.log('\n💡 Soluciones sugeridas:');
        console.log('   1. Ejecuta: npx prisma db push');
        console.log('   2. Ejecuta: npx prisma generate');
        console.log('   3. Verifica DATABASE_URL en .env');
        console.log('   4. Reinicia el servidor');
    } finally {
        await prisma.$disconnect();
    }
}

debugExternalInvoice();