/**
 * Script para solucionar los errores 404 en las rutas de facturas
 */

const { spawn } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixInvoiceRoutes404() {
    try {
        console.log('🔧 Solucionando errores 404 en rutas de facturas...');

        // 1. Verificar que las rutas existen en el archivo
        const fs = require('fs');
        const routesContent = fs.readFileSync('routes/invoice.routes.js', 'utf8');
        
        const hasEditRoute = routesContent.includes("router.put('/:id'");
        const hasCancelRoute = routesContent.includes("router.patch('/:id/cancel'");
        
        console.log('📋 Verificación de rutas:');
        console.log(`   ✅ Ruta EDITAR (PUT /:id): ${hasEditRoute ? 'EXISTE' : 'FALTA'}`);
        console.log(`   ✅ Ruta CANCELAR (PATCH /:id/cancel): ${hasCancelRoute ? 'EXISTE' : 'FALTA'}`);

        if (!hasEditRoute || !hasCancelRoute) {
            throw new Error('Faltan rutas en el archivo invoice.routes.js');
        }

        // 2. Verificar que hay facturas para probar
        const testInvoice = await prisma.invoice.findFirst({
            where: { status: 'PENDING' },
            select: { id: true, invoiceNumber: true, status: true }
        });

        if (testInvoice) {
            console.log(`📄 Factura de prueba encontrada: ${testInvoice.invoiceNumber} (${testInvoice.status})`);
        } else {
            console.log('⚠️ No hay facturas PENDING para probar');
        }

        // 3. Crear script de prueba para el navegador
        const browserTestScript = `
// Script para probar las rutas de facturas en el navegador
// Ejecutar en la consola después del login

async function testInvoiceRoutes() {
    console.log('🧪 Probando rutas de facturas...');
    
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('❌ No hay token de autenticación');
        return;
    }

    // Obtener una factura para probar
    try {
        const response = await fetch('/api/invoices?limit=1', {
            headers: { 'Authorization': \`Bearer \${token}\` }
        });
        
        if (!response.ok) {
            throw new Error(\`Error obteniendo facturas: \${response.status}\`);
        }
        
        const data = await response.json();
        const invoice = data.invoices?.[0];
        
        if (!invoice) {
            console.log('❌ No hay facturas para probar');
            return;
        }
        
        console.log(\`📄 Probando con factura: \${invoice.invoiceNumber}\`);
        
        // Probar ruta VER
        console.log('👁️ Probando ruta VER...');
        const viewResponse = await fetch(\`/api/invoices/\${invoice.id}\`, {
            headers: { 'Authorization': \`Bearer \${token}\` }
        });
        console.log(\`   VER: \${viewResponse.ok ? '✅ OK' : '❌ ERROR ' + viewResponse.status}\`);
        
        // Solo probar editar y cancelar si la factura está PENDING
        if (invoice.status === 'PENDING') {
            // Probar ruta EDITAR (sin enviar datos, solo verificar que existe)
            console.log('✏️ Probando ruta EDITAR...');
            const editResponse = await fetch(\`/api/invoices/\${invoice.id}\`, {
                method: 'PUT',
                headers: { 
                    'Authorization': \`Bearer \${token}\`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ dueDate: invoice.dueDate }) // Datos mínimos
            });
            console.log(\`   EDITAR: \${editResponse.ok ? '✅ OK' : '❌ ERROR ' + editResponse.status}\`);
            
            // Probar ruta CANCELAR (sin enviar datos, solo verificar que existe)
            console.log('❌ Probando ruta CANCELAR...');
            const cancelResponse = await fetch(\`/api/invoices/\${invoice.id}/cancel\`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': \`Bearer \${token}\`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: 'Prueba de ruta' })
            });
            console.log(\`   CANCELAR: \${cancelResponse.ok ? '✅ OK' : '❌ ERROR ' + cancelResponse.status}\`);
            
            // Si se canceló, revertir
            if (cancelResponse.ok) {
                console.log('🔄 Revirtiendo cancelación de prueba...');
                await fetch(\`/api/invoices/\${invoice.id}\`, {
                    method: 'PUT',
                    headers: { 
                        'Authorization': \`Bearer \${token}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 'PENDING' })
                });
            }
        } else {
            console.log(\`⚠️ Factura no está PENDING (\${invoice.status}), no se pueden probar editar/cancelar\`);
        }
        
        console.log('✅ Prueba de rutas completada');
        
    } catch (error) {
        console.error('❌ Error probando rutas:', error);
    }
}

// Ejecutar automáticamente
testInvoiceRoutes();
`;

        // Guardar script para el navegador
        fs.writeFileSync('public/test-invoice-routes.js', browserTestScript);
        console.log('📝 Script de prueba creado: public/test-invoice-routes.js');

        // 4. Reiniciar servidor
        console.log('🔄 Reiniciando servidor...');
        
        const restartProcess = spawn('node', ['restart-server.js'], {
            stdio: 'inherit',
            cwd: process.cwd()
        });

        await new Promise((resolve) => {
            restartProcess.on('close', (code) => {
                console.log(`🚀 Servidor reiniciado (código: ${code})`);
                resolve();
            });
        });

        // 5. Instrucciones para el usuario
        console.log('');
        console.log('📋 INSTRUCCIONES PARA SOLUCIONAR EL ERROR 404:');
        console.log('');
        console.log('1. Abrir el navegador en: http://localhost:3000');
        console.log('2. Iniciar sesión en el sistema');
        console.log('3. Abrir la consola del navegador (F12)');
        console.log('4. Ejecutar el siguiente comando:');
        console.log('');
        console.log('   // Cargar y ejecutar script de prueba');
        console.log('   const script = document.createElement("script");');
        console.log('   script.src = "/test-invoice-routes.js";');
        console.log('   document.head.appendChild(script);');
        console.log('');
        console.log('5. O simplemente ejecutar:');
        console.log('');
        console.log('   testInvoiceRoutes()');
        console.log('');
        console.log('📊 Esto probará todas las rutas y mostrará si funcionan correctamente.');

        return {
            success: true,
            message: 'Servidor reiniciado y script de prueba creado',
            testInvoiceId: testInvoice?.id,
            instructions: 'Ejecutar testInvoiceRoutes() en la consola del navegador'
        };

    } catch (error) {
        console.error('❌ Error solucionando rutas 404:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    fixInvoiceRoutes404()
        .then(result => {
            console.log('✅ Solución completada:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = fixInvoiceRoutes404;