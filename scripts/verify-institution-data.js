#!/usr/bin/env node

/**
 * Script para verificar los datos de la institución en la base de datos
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyInstitutionData() {
    try {
        console.log('🏫 Verificando datos de la institución...\n');

        // Obtener datos de la institución
        const institution = await prisma.institution.findFirst();

        if (!institution) {
            console.log('❌ No se encontraron datos de la institución en la base de datos');
            console.log('💡 Necesitas configurar los datos de la institución primero');
            return;
        }

        console.log('📋 Datos actuales de la institución:');
        console.log(`• Nombre: ${institution.name || 'N/A'}`);
        console.log(`• NIT: ${institution.nit || 'N/A'}`);
        console.log(`• Email: ${institution.email || 'N/A'}`);
        console.log(`• Teléfono: ${institution.phone || 'N/A'}`);
        console.log(`• Dirección: ${institution.address || 'N/A'}`);
        console.log(`• Ciudad: ${institution.city || 'N/A'}`);
        console.log(`• Resolución DIAN: ${institution.resolution || 'N/A'}`);

        console.log('\n🔍 Verificación de datos:');
        
        // Verificar nombre
        const expectedName = 'INSTITUCIÓN EDUCATIVA DISTRITAL VILLAS DE SAN PABLO';
        if (institution.name === expectedName) {
            console.log('✅ Nombre correcto');
        } else {
            console.log(`⚠️ Nombre actual: ${institution.name}`);
            console.log(`📝 Nombre esperado: ${expectedName}`);
        }

        // Verificar NIT
        const expectedNIT = '901.079.125-0';
        if (institution.nit === expectedNIT) {
            console.log('✅ NIT correcto');
        } else {
            console.log(`⚠️ NIT actual: ${institution.nit}`);
            console.log(`📝 NIT esperado: ${expectedNIT}`);
        }

        // Verificar email
        const expectedEmail = 'contabilidad@villasanpablo.edu.co';
        if (institution.email === expectedEmail) {
            console.log('✅ Email correcto');
        } else {
            console.log(`⚠️ Email actual: ${institution.email}`);
            console.log(`📝 Email esperado: ${expectedEmail}`);
        }

        // Verificar teléfonos
        const expectedPhone = '3004566968-3012678548';
        if (institution.phone === expectedPhone) {
            console.log('✅ Teléfonos correctos');
        } else {
            console.log(`⚠️ Teléfonos actuales: ${institution.phone}`);
            console.log(`📝 Teléfonos esperados: ${expectedPhone}`);
        }

        console.log('\n💡 Recomendaciones:');
        console.log('1. Si los datos no son correctos, actualízalos desde la interfaz de administración');
        console.log('2. Los datos mostrados en la factura vienen de la base de datos');
        console.log('3. Algunos datos están hardcodeados en el generador de facturas para consistencia');

    } catch (error) {
        console.error('❌ Error verificando datos de la institución:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    verifyInstitutionData();
}

module.exports = { verifyInstitutionData };