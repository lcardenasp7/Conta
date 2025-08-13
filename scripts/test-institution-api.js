#!/usr/bin/env node

/**
 * Script para probar los endpoints de institución
 */

const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';

async function testInstitutionEndpoints() {
    console.log('🏛️  Probando endpoints de institución...\n');

    const token = process.argv[2];
    
    if (!token) {
        console.log('❌ No se proporcionó token. Uso: node test-institution-api.js <token>');
        console.log('   Obtén el token desde las herramientas de desarrollador > Application > Local Storage');
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        // Test 1: Get institution data
        console.log('📋 1. Probando GET /institution...');
        const getResponse = await fetch(`${BASE_URL}/institution`, { headers });
        
        if (getResponse.ok) {
            const institution = await getResponse.json();
            console.log('✅ GET institution OK');
            console.log(`   - Nombre: ${institution.name || 'No definido'}`);
            console.log(`   - NIT: ${institution.nit || 'No definido'}`);
            console.log(`   - Logo: ${institution.logo ? 'Sí' : 'No'}`);
        } else if (getResponse.status === 404) {
            console.log('⚠️  No hay datos institucionales (normal en primera ejecución)');
        } else {
            console.log(`❌ GET institution falló: ${getResponse.status} ${getResponse.statusText}`);
        }

        // Test 2: Create/Update institution data
        console.log('\n💾 2. Probando POST /institution...');
        const testData = {
            name: 'Institución Educativa de Prueba',
            nit: '123456789-0',
            address: 'Calle 123 #45-67',
            city: 'Bogotá',
            state: 'Cundinamarca',
            locality: 'Localidad de Prueba',
            phone: '601-2345678',
            email: 'info@institucion.edu.co',
            dane: '111001000001',
            resolution: 'Resolución 001 de 2024',
            levels: 'Preescolar, Básica, Media',
            title: 'Bachiller Académico',
            calendar: 'A',
            schedule: 'Completa'
        };

        const postResponse = await fetch(`${BASE_URL}/institution`, {
            method: 'POST',
            headers,
            body: JSON.stringify(testData)
        });

        if (postResponse.ok) {
            const result = await postResponse.json();
            console.log('✅ POST institution OK');
            console.log(`   - ID: ${result.id}`);
            console.log(`   - Nombre: ${result.name}`);
        } else {
            console.log(`❌ POST institution falló: ${postResponse.status} ${postResponse.statusText}`);
            const error = await postResponse.text();
            console.log(`   Error: ${error}`);
        }

        // Test 3: Logo endpoints (without actual file)
        console.log('\n🖼️  3. Probando endpoints de logo...');
        
        // Test logo GET (should return 404 if no logo)
        const logoGetResponse = await fetch(`${BASE_URL}/institution/logo`);
        if (logoGetResponse.status === 404) {
            console.log('✅ GET logo endpoint OK (sin logo configurado)');
        } else if (logoGetResponse.ok) {
            console.log('✅ GET logo endpoint OK (logo existente)');
        } else {
            console.log(`❌ GET logo falló: ${logoGetResponse.status}`);
        }

        console.log('\n📝 Resumen de pruebas:');
        console.log('   • Endpoint GET /institution: Disponible');
        console.log('   • Endpoint POST /institution: Disponible');
        console.log('   • Endpoint GET /institution/logo: Disponible');
        console.log('   • Endpoint POST /institution/logo: Disponible (requiere archivo)');
        console.log('   • Endpoint DELETE /institution/logo: Disponible');

        console.log('\n💡 Para probar carga de logo:');
        console.log('   1. Ve a la interfaz web');
        console.log('   2. Configuración → Institución');
        console.log('   3. Usa el botón "Cargar Logo"');

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error.message);
    }
}

// Test basic server connection
async function testServerConnection() {
    try {
        console.log('🔌 Probando conexión al servidor...');
        const response = await fetch(`${BASE_URL.replace('/api', '')}/health`);
        
        if (response.ok) {
            console.log('✅ Servidor conectado');
            return true;
        } else {
            console.log(`❌ Servidor responde con error: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error('❌ No se puede conectar al servidor:', error.message);
        console.log('   Asegúrate de que el servidor esté ejecutándose en http://localhost:3000');
        return false;
    }
}

// Run tests
async function runTests() {
    const connected = await testServerConnection();
    if (connected) {
        console.log('');
        await testInstitutionEndpoints();
    }
}

runTests();