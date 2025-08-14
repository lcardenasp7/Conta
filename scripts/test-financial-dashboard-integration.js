/**
 * Script para probar la integración completa del dashboard financiero
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testFinancialDashboardIntegration() {
    try {
        console.log('🧪 Probando integración del dashboard financiero...\n');

        // 1. Verificar archivos necesarios
        console.log('📁 Verificando archivos...');
        
        const requiredFiles = [
            'public/js/financial-dashboard.js',
            'routes/financial-dashboard.routes.js',
            'public/index.html'
        ];

        const missingFiles = [];
        for (const file of requiredFiles) {
            if (!fs.existsSync(path.join(__dirname, '..', file))) {
                missingFiles.push(file);
            }
        }

        if (missingFiles.length > 0) {
            console.error('❌ Archivos faltantes:', missingFiles);
            throw new Error('Archivos requeridos no encontrados');
        }

        console.log('✅ Todos los archivos necesarios están presentes');

        // 2. Verificar que el menú esté actualizado
        console.log('\n🔍 Verificando menú del sidebar...');
        
        const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'public/index.html'), 'utf8');
        
        const menuChecks = {
            'Opción en menú': htmlContent.includes('data-page="financial-dashboard"'),
            'Icono correcto': htmlContent.includes('bi-cash-stack'),
            'Texto correcto': htmlContent.includes('Dashboard Financiero')
        };

        console.log('📋 Estado del menú:');
        Object.entries(menuChecks).forEach(([check, passed]) => {
            console.log(`   ${passed ? '✅' : '❌'} ${check}`);
        });

        // 3. Verificar que app.js tenga el caso
        console.log('\n🔍 Verificando app.js...');
        
        const appJsContent = fs.readFileSync(path.join(__dirname, '..', 'public/js/app.js'), 'utf8');
        
        const appChecks = {
            'Caso financial-dashboard': appJsContent.includes('case \'financial-dashboard\''),
            'Llamada a initFinancialDashboard': appJsContent.includes('initFinancialDashboard')
        };

        console.log('📋 Estado de app.js:');
        Object.entries(appChecks).forEach(([check, passed]) => {
            console.log(`   ${passed ? '✅' : '❌'} ${check}`);
        });

        // 4. Verificar que server.js tenga la ruta
        console.log('\n🔍 Verificando server.js...');
        
        const serverJsContent = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
        
        const serverChecks = {
            'Import de ruta': serverJsContent.includes('financial-dashboard.routes'),
            'Registro de ruta': serverJsContent.includes('/api/financial-dashboard')
        };

        console.log('📋 Estado de server.js:');
        Object.entries(serverChecks).forEach(([check, passed]) => {
            console.log(`   ${passed ? '✅' : '❌'} ${check}`);
        });

        // 5. Verificar script en HTML
        console.log('\n🔍 Verificando carga de script...');
        
        const scriptCheck = htmlContent.includes('js/financial-dashboard.js');
        console.log(`   ${scriptCheck ? '✅' : '❌'} Script incluido en HTML`);

        // 6. Verificar datos de prueba en la base de datos
        console.log('\n📊 Verificando datos de prueba...');
        
        const [invoiceCount, paymentCount, studentCount] = await Promise.all([
            prisma.invoice.count(),
            prisma.payment.count(),
            prisma.student.count()
        ]);

        console.log(`   📄 Facturas: ${invoiceCount}`);
        console.log(`   💰 Pagos: ${paymentCount}`);
        console.log(`   👥 Estudiantes: ${studentCount}`);

        // 7. Resumen final
        const allChecks = [
            ...Object.values(menuChecks),
            ...Object.values(appChecks),
            ...Object.values(serverChecks),
            scriptCheck
        ];

        const allPassed = allChecks.every(Boolean);

        console.log('\n📋 Resumen de integración:');
        console.log(`   ✅ Archivos creados: ${requiredFiles.length}/${requiredFiles.length}`);
        console.log(`   ✅ Verificaciones pasadas: ${allChecks.filter(Boolean).length}/${allChecks.length}`);

        if (allPassed) {
            console.log('\n🎉 ¡Integración completada exitosamente!');
            console.log('💡 Instrucciones para usar:');
            console.log('   1. Reinicia el servidor: node server.js');
            console.log('   2. Ve a la interfaz web');
            console.log('   3. En el menú Facturación, busca "Dashboard Financiero"');
            console.log('   4. Haz clic para acceder al dashboard');
        } else {
            console.log('\n⚠️  Hay algunos problemas que necesitan corrección');
        }

        return {
            success: allPassed,
            checks: {
                menu: menuChecks,
                app: appChecks,
                server: serverChecks,
                script: scriptCheck
            },
            data: {
                invoices: invoiceCount,
                payments: paymentCount,
                students: studentCount
            }
        };

    } catch (error) {
        console.error('❌ Error en la prueba de integración:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testFinancialDashboardIntegration()
        .then(result => {
            console.log('\n✅ Prueba de integración completada');
            if (result.success) {
                console.log('🎯 Dashboard financiero listo para usar');
            }
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Error en la prueba:', error.message);
            process.exit(1);
        });
}

module.exports = { testFinancialDashboardIntegration };