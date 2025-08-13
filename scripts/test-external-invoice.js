#!/usr/bin/env node

/**
 * Script para probar la creación de facturas externas
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testExternalInvoice() {
    console.log('📄 Probando creación de factura externa...\n');

    const token = process.argv[2];
    
    if (!token) {
        console.log('❌ No se proporcionó token. Uso: node test-external-invoice.js <token>');
        console.log('   Obtén el token desde las herramientas de desarrollador > Application > Local Storage');
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        // Test data for external invoice
        const testInvoiceData = {
            clientName: 'Cliente de Prueba',
            clientDocument: '12345678-9',
            clientEmail: 'cliente@test.com',
            clientPhone: '300-123-4567',
            concept: 'UNIFORM',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            observations: 'Factura de prueba generada automáticamente',
            items: [
                {
                    description: 'Uniforme escolar completo',
                    quantity: 1,
                    unitPrice: 150000
                },
                {
                    description: 'Zapatos escolares',
                    quantity: 1,
                    unitPrice: 80000
                }
            ]
        };

        console.log('📋 Datos de prueba:', JSON.stringify(testInvoiceData, null, 2));

        // Create external invoice
        console.log('\n📤 Enviando solicitud...');
        const response = await fetch(`${BASE_URL}/invoices/external`, {
            method: 'POST',
            headers,
            body: JSON.stringify(testInvoiceData)
        });

        console.log(`📥 Respuesta del servidor: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Factura externa creada exitosamente:');
            console.log(`   - Número: ${result.invoice.invoiceNumber}`);
            console.log(`   - Cliente: ${result.invoice.clientName}`);
            console.log(`   - Total: $${result.invoice.total.toLocaleString()}`);
            console.log(`   - Items: ${result.invoice.items.length}`);
            console.log(`   - Estado: ${result.invoice.status}`);
        } else {
            const error = await response.text();
            console.log('❌ Error creando factura externa:');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${error}`);
            
            // Suggestions based on status code
            if (response.status === 400) {
                console.log('\n💡 Posibles causas (400 Bad Request):');
                console.log('   • Faltan campos requeridos');
                console.log('   • Formato de fecha incorrecto');
                console.log('   • Items vacíos o inválidos');
            } else if (response.status === 403) {
                console.log('\n💡 Posibles causas (403 Forbidden):');
                console.log('   • Usuario sin permisos de contabilidad');
                console.log('   • Token inválido o expirado');
            } else if (response.status === 500) {
                console.log('\n💡 Posibles causas (500 Internal Server Error):');
                console.log('   • Error en la base de datos');
                console.log('   • Problema con la generación del número de factura');
                console.log('   • Error en la transacción');
            }
        }

    } catch (error) {
        console.error('❌ Error durante la prueba:', error.message);
        console.log('\n🔧 Posibles soluciones:');
        console.log('   1. Verifica que el servidor esté ejecutándose');
        console.log('   2. Asegúrate de que el token sea válido');
        console.log('   3. Verifica la conexión a la base de datos');
        console.log('   4. Revisa los logs del servidor');
    }
}

// Test server connection first
async function testConnection() {
    try {
        console.log('🔌 Verificando conexión al servidor...');
        const response = await fetch(`${BASE_URL.replace('/api', '')}/health`);
        
        if (response.ok) {
            console.log('✅ Servidor conectado\n');
            return true;
        } else {
            console.log(`❌ Servidor responde con error: ${response.status}\n`);
            return false;
        }
    } catch (error) {
        console.error('❌ No se puede conectar al servidor:', error.message);
        console.log('   Asegúrate de que el servidor esté ejecutándose en http://localhost:3000\n');
        return false;
    }
}

// Run tests
async function runTest() {
    const connected = await testConnection();
    if (connected) {
        await testExternalInvoice();
    }
}

runTest();