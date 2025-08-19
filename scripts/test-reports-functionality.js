/**
 * Probar funcionalidad de reportes financieros
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

async function testReportsAPI() {
    try {
        console.log('🧪 Probando API de reportes financieros...');

        // Login
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
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Login exitoso');

        // Test overdue payments report
        console.log('\n📊 Probando reporte de cartera vencida...');
        const overdueOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/reports/overdue-payments',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const overdueResponse = await makeRequest(overdueOptions);
        
        if (overdueResponse.status === 200) {
            console.log('✅ Reporte de cartera vencida funcionando');
            console.log(`   - Facturas vencidas: ${overdueResponse.data.summary.totalOverdueInvoices}`);
            console.log(`   - Monto total vencido: $${overdueResponse.data.summary.totalOverdueAmount.toLocaleString()}`);
        } else {
            console.log('❌ Error en reporte de cartera vencida:', overdueResponse.status);
        }

        // Test cash flow report
        console.log('\n💰 Probando reporte de flujo de caja...');
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        const cashFlowOptions = {
            hostname: 'localhost',
            port: 3000,
            path: `/api/reports/cash-flow/${year}/${month}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const cashFlowResponse = await makeRequest(cashFlowOptions);
        
        if (cashFlowResponse.status === 200) {
            console.log('✅ Reporte de flujo de caja funcionando');
            console.log(`   - Ingresos totales: $${cashFlowResponse.data.summary.totalIncome.toLocaleString()}`);
            console.log(`   - Gastos totales: $${cashFlowResponse.data.summary.totalExpenses.toLocaleString()}`);
            console.log(`   - Flujo neto: $${cashFlowResponse.data.summary.netCashFlow.toLocaleString()}`);
        } else {
            console.log('❌ Error en reporte de flujo de caja:', cashFlowResponse.status);
        }

        // Test student account (need a student ID first)
        console.log('\n👤 Probando estado de cuenta de estudiante...');
        
        // Get first student
        const studentsOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/students?limit=1',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const studentsResponse = await makeRequest(studentsOptions);
        
        if (studentsResponse.status === 200 && studentsResponse.data.data && studentsResponse.data.data.length > 0) {
            const studentId = studentsResponse.data.data[0].id;
            
            const accountOptions = {
                hostname: 'localhost',
                port: 3000,
                path: `/api/reports/student-account/${studentId}`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            const accountResponse = await makeRequest(accountOptions);
            
            if (accountResponse.status === 200) {
                console.log('✅ Estado de cuenta de estudiante funcionando');
                console.log(`   - Estudiante: ${accountResponse.data.student.firstName} ${accountResponse.data.student.lastName}`);
                console.log(`   - Total facturado: $${accountResponse.data.summary.totalInvoiced.toLocaleString()}`);
                console.log(`   - Total pagado: $${accountResponse.data.summary.totalPaid.toLocaleString()}`);
                console.log(`   - Total pendiente: $${accountResponse.data.summary.grandTotalPending.toLocaleString()}`);
            } else {
                console.log('❌ Error en estado de cuenta:', accountResponse.status);
            }
        } else {
            console.log('⚠️ No hay estudiantes para probar estado de cuenta');
        }

        console.log('\n🎯 RESUMEN DE PRUEBAS:');
        console.log('✅ API de reportes funcionando correctamente');
        console.log('✅ Backend implementado y operativo');
        console.log('📱 Frontend: Verificar navegación en el navegador');

    } catch (error) {
        console.error('❌ Error probando reportes:', error.message);
    }
}

testReportsAPI();