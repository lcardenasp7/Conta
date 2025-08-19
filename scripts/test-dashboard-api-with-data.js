/**
 * Probar API del dashboard financiero con datos de muestra
 */

const http = require('http');

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });
        
        req.on('error', reject);
        
        if (postData) {
            req.write(postData);
        }
        
        req.end();
    });
}

async function testDashboardAPI() {
    try {
        console.log('🧪 Probando API del dashboard financiero...');

        // Primero hacer login para obtener token
        const loginOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const loginResponse = await makeRequest(loginOptions, JSON.stringify({
            email: 'rector@villasanpablo.edu.co',
            password: 'VillasSP2024!'
        }));

        if (loginResponse.status !== 200) {
            console.log('❌ Error en login:', loginResponse.status);
            console.log('Response:', loginResponse.data);
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Login exitoso');

        // Probar endpoint del dashboard
        const dashboardOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/financial-dashboard/overview',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const dashboardResponse = await makeRequest(dashboardOptions);

        if (dashboardResponse.status !== 200) {
            console.log('❌ Error en dashboard API:', dashboardResponse.status);
            console.log('Error details:', dashboardResponse.data);
            return;
        }

        const dashboardData = dashboardResponse.data;
        console.log('✅ Dashboard API respondió correctamente');
        
        console.log('\n📊 DATOS RECIBIDOS:');
        console.log('===================');
        console.log('Período:', dashboardData.period);
        console.log('Resumen:', dashboardData.summary);
        console.log('Ingresos por categoría:', Object.keys(dashboardData.incomeByCategory || {}));
        console.log('Gastos por categoría:', Object.keys(dashboardData.expensesByCategory || {}));
        console.log('Tendencias:', dashboardData.trends?.length || 0, 'meses');
        console.log('Actividad reciente:', dashboardData.recentActivity?.length || 0, 'elementos');

        // Mostrar detalles de categorías
        if (dashboardData.incomeByCategory) {
            console.log('\n💰 INGRESOS POR CATEGORÍA:');
            Object.entries(dashboardData.incomeByCategory).forEach(([category, data]) => {
                console.log(`- ${category}: $${data.total.toLocaleString()} (${data.count} transacciones)`);
            });
        }

        if (dashboardData.expensesByCategory) {
            console.log('\n💸 GASTOS POR CATEGORÍA:');
            Object.entries(dashboardData.expensesByCategory).forEach(([category, data]) => {
                console.log(`- ${category}: $${data.total.toLocaleString()} (${data.count} transacciones)`);
            });
        }

        if (dashboardData.trends && dashboardData.trends.length > 0) {
            console.log('\n📈 TENDENCIAS:');
            dashboardData.trends.forEach(trend => {
                console.log(`- ${trend.monthName}: Ingresos $${trend.income.toLocaleString()}, Gastos $${trend.expenses.toLocaleString()}`);
            });
        }

    } catch (error) {
        console.error('❌ Error probando API:', error.message);
    }
}

testDashboardAPI();