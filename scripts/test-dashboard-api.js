#!/usr/bin/env node

/**
 * Script para probar los endpoints del dashboard
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

// Test function
async function testDashboardEndpoints() {
    console.log('🧪 Probando endpoints del dashboard...\n');

    // You'll need to get a valid token first
    console.log('⚠️  Para probar los endpoints protegidos, necesitas un token válido.');
    console.log('   1. Inicia sesión en la aplicación');
    console.log('   2. Abre las herramientas de desarrollador (F12)');
    console.log('   3. Ve a Application > Local Storage > token');
    console.log('   4. Copia el token y úsalo en este script\n');

    const token = process.argv[2];
    
    if (!token) {
        console.log('❌ No se proporcionó token. Uso: node test-dashboard-api.js <token>');
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        // Test dashboard stats
        console.log('📊 Probando /dashboard/stats...');
        const statsResponse = await fetch(`${BASE_URL}/dashboard/stats`, { headers });
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log('✅ Dashboard stats OK');
            console.log(`   - Estudiantes activos: ${stats.summary?.activeStudents || 0}`);
            console.log(`   - Ingresos del mes: $${stats.income?.thisMonth || 0}`);
            console.log(`   - Gastos del mes: $${stats.expenses?.thisMonth || 0}`);
            console.log(`   - Balance del mes: $${stats.balance?.thisMonth || 0}`);
        } else {
            console.log(`❌ Dashboard stats falló: ${statsResponse.status} ${statsResponse.statusText}`);
            const error = await statsResponse.text();
            console.log(`   Error: ${error}`);
        }

        // Test chart endpoint
        console.log('\n📈 Probando /dashboard/charts/monthly-income-expense...');
        const chartResponse = await fetch(`${BASE_URL}/dashboard/charts/monthly-income-expense`, { headers });
        
        if (chartResponse.ok) {
            const chartData = await chartResponse.json();
            console.log('✅ Chart data OK');
            console.log(`   - Meses: ${chartData.labels?.length || 0}`);
            console.log(`   - Datos de ingresos: ${chartData.income?.length || 0}`);
            console.log(`   - Datos de gastos: ${chartData.expenses?.length || 0}`);
        } else {
            console.log(`❌ Chart data falló: ${chartResponse.status} ${chartResponse.statusText}`);
        }

        // Test recent activities
        console.log('\n📋 Probando /dashboard/recent-activities...');
        const activitiesResponse = await fetch(`${BASE_URL}/dashboard/recent-activities`, { headers });
        
        if (activitiesResponse.ok) {
            const activities = await activitiesResponse.json();
            console.log('✅ Recent activities OK');
            console.log(`   - Pagos recientes: ${activities.recentPayments?.length || 0}`);
            console.log(`   - Facturas recientes: ${activities.recentInvoices?.length || 0}`);
            console.log(`   - Eventos próximos: ${activities.upcomingEvents?.length || 0}`);
        } else {
            console.log(`❌ Recent activities falló: ${activitiesResponse.status} ${activitiesResponse.statusText}`);
        }

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error.message);
    }

    console.log('\n🏁 Pruebas completadas');
}

// Test without authentication (health check)
async function testHealthCheck() {
    try {
        console.log('🏥 Probando health check...');
        const response = await fetch(`${BASE_URL.replace('/api', '')}/health`);
        
        if (response.ok) {
            const health = await response.json();
            console.log('✅ Servidor funcionando');
            console.log(`   - Servicio: ${health.service}`);
            console.log(`   - Versión: ${health.version}`);
            console.log(`   - Base de datos: ${health.database}`);
        } else {
            console.log(`❌ Health check falló: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Servidor no responde:', error.message);
        console.log('   Asegúrate de que el servidor esté ejecutándose en http://localhost:3000');
    }
}

// Run tests
async function runTests() {
    await testHealthCheck();
    console.log('');
    await testDashboardEndpoints();
}

runTests();