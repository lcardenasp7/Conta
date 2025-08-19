#!/usr/bin/env node

/**
 * Script para diagnosticar errores 500 en Railway
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugRailwayErrors() {
    console.log('🔍 DIAGNOSTICANDO ERRORES 500 EN RAILWAY');
    console.log('========================================\n');

    try {
        // 1. Verificar conexión a base de datos
        console.log('📋 1. VERIFICANDO CONEXIÓN A BASE DE DATOS...');
        
        await prisma.$connect();
        console.log('✅ Conexión a base de datos exitosa');
        
        // 2. Verificar tablas críticas
        console.log('\n📋 2. VERIFICANDO TABLAS CRÍTICAS...');
        
        const tables = [
            { name: 'Event', model: prisma.event },
            { name: 'Invoice', model: prisma.invoice },
            { name: 'Payment', model: prisma.payment },
            { name: 'Student', model: prisma.student },
            { name: 'User', model: prisma.user },
            { name: 'Fund', model: prisma.fund }
        ];
        
        for (const table of tables) {
            try {
                const count = await table.model.count();
                console.log(`✅ ${table.name}: ${count} registros`);
            } catch (error) {
                console.log(`❌ ${table.name}: Error - ${error.message}`);
            }
        }
        
        // 3. Verificar relaciones problemáticas
        console.log('\n📋 3. VERIFICANDO RELACIONES...');
        
        // Verificar eventos con usuarios
        try {
            const eventsWithUsers = await prisma.event.findMany({
                include: { user: true },
                take: 5
            });
            console.log(`✅ Eventos con usuarios: ${eventsWithUsers.length}`);
        } catch (error) {
            console.log(`❌ Eventos con usuarios: ${error.message}`);
        }
        
        // Verificar facturas con estudiantes
        try {
            const invoicesWithStudents = await prisma.invoice.findMany({
                include: { student: true },
                take: 5
            });
            console.log(`✅ Facturas con estudiantes: ${invoicesWithStudents.length}`);
        } catch (error) {
            console.log(`❌ Facturas con estudiantes: ${error.message}`);
        }
        
        // Verificar pagos con facturas
        try {
            const paymentsWithInvoices = await prisma.payment.findMany({
                include: { invoice: true },
                take: 5
            });
            console.log(`✅ Pagos con facturas: ${paymentsWithInvoices.length}`);
        } catch (error) {
            console.log(`❌ Pagos con facturas: ${error.message}`);
        }
        
        // 4. Verificar datos inconsistentes
        console.log('\n📋 4. VERIFICANDO INCONSISTENCIAS...');
        
        // Facturas sin estudiante válido
        try {
            const orphanInvoices = await prisma.invoice.findMany({
                where: {
                    student: null
                }
            });
            if (orphanInvoices.length > 0) {
                console.log(`⚠️ Facturas huérfanas: ${orphanInvoices.length}`);
            } else {
                console.log('✅ No hay facturas huérfanas');
            }
        } catch (error) {
            console.log(`❌ Error verificando facturas huérfanas: ${error.message}`);
        }
        
        // Pagos sin factura válida
        try {
            const orphanPayments = await prisma.payment.findMany({
                where: {
                    invoice: null
                }
            });
            if (orphanPayments.length > 0) {
                console.log(`⚠️ Pagos huérfanos: ${orphanPayments.length}`);
            } else {
                console.log('✅ No hay pagos huérfanos');
            }
        } catch (error) {
            console.log(`❌ Error verificando pagos huérfanos: ${error.message}`);
        }
        
        // 5. Verificar esquema de base de datos
        console.log('\n📋 5. VERIFICANDO ESQUEMA...');
        
        try {
            // Verificar que las columnas críticas existen
            const sampleEvent = await prisma.event.findFirst();
            const sampleInvoice = await prisma.invoice.findFirst();
            const samplePayment = await prisma.payment.findFirst();
            
            console.log('✅ Esquema de Event parece correcto');
            console.log('✅ Esquema de Invoice parece correcto');
            console.log('✅ Esquema de Payment parece correcto');
        } catch (error) {
            console.log(`❌ Error en esquema: ${error.message}`);
        }
        
        console.log('\n📋 RECOMENDACIONES:');
        console.log('==================');
        console.log('1. 🧹 Ejecutar limpieza: railway run node scripts/railway-clean-production.js');
        console.log('2. 🔄 Reiniciar servicio en Railway');
        console.log('3. 📊 Verificar logs de Railway para errores específicos');
        console.log('4. 🔍 Probar endpoints individualmente');
        
    } catch (error) {
        console.error('❌ Error durante diagnóstico:', error);
        
        console.log('\n🚨 POSIBLES CAUSAS:');
        console.log('==================');
        console.log('1. Base de datos no migrada correctamente');
        console.log('2. Variables de entorno incorrectas');
        console.log('3. Datos inconsistentes en la base de datos');
        console.log('4. Problemas de conexión a PostgreSQL');
        console.log('5. Esquema de Prisma desactualizado');
        
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    debugRailwayErrors()
        .then(() => {
            console.log('\n✅ Diagnóstico completado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { debugRailwayErrors };