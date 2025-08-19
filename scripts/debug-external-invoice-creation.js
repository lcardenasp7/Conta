#!/usr/bin/env node

/**
 * SCRIPT DE DEPURACIÓN: CREACIÓN DE FACTURA EXTERNA
 * Identifica por qué falla la creación de facturas externas
 */

console.log('🔍 DEPURANDO CREACIÓN DE FACTURA EXTERNA...\n');

const fs = require('fs');
const path = require('path');

function checkInvoiceRoutes() {
    console.log('1️⃣ Verificando rutas de facturas...');
    
    const routesPath = path.join(__dirname, '../routes/invoice.routes.js');
    
    if (!fs.existsSync(routesPath)) {
        console.log('   ❌ Archivo de rutas de facturas no encontrado');
        return false;
    }
    
    const content = fs.readFileSync(routesPath, 'utf8');
    
    const checks = [
        {
            name: 'Ruta POST /api/invoices existe',
            test: content.includes('router.post(') && content.includes('/invoices')
        },
        {
            name: 'Manejo de facturas externas',
            test: content.includes('isExternal') || content.includes('external')
        },
        {
            name: 'Validación de datos',
            test: content.includes('clientName') || content.includes('client')
        }
    ];
    
    checks.forEach(check => {
        if (check.test) {
            console.log(`   ✅ ${check.name}`);
        } else {
            console.log(`   ❌ ${check.name}`);
        }
    });
    
    return checks.every(check => check.test);
}

function addExternalInvoiceDebugging() {
    console.log('\n2️⃣ Agregando depuración a factura externa...');
    
    const invoicesPath = path.join(__dirname, '../public/js/invoices.js');
    let content = fs.readFileSync(invoicesPath, 'utf8');
    
    // Agregar función de prueba para datos de factura externa
    const testFunction = `
// Función de prueba para datos de factura externa
function testExternalInvoiceData() {
    console.log('🧪 PROBANDO DATOS DE FACTURA EXTERNA');
    
    const testData = {
        clientName: "Cliente Test",
        clientDocument: "12345678",
        clientEmail: "test@test.com",
        concept: "UNIFORM",
        dueDate: "2025-09-17",
        observations: "Test",
        fundId: "test-fund-id",
        items: [
            {
                description: "Producto test",
                quantity: 1,
                unitPrice: 50000
            }
        ],
        isExternal: true,
        type: 'OUTGOING',
        subtotal: 50000,
        tax: 0,
        total: 50000
    };
    
    console.log('Datos de prueba:', testData);
    
    // Validar estructura
    const requiredFields = ['clientName', 'clientDocument', 'concept', 'items', 'total'];
    const missingFields = requiredFields.filter(field => !testData[field]);
    
    if (missingFields.length > 0) {
        console.log('❌ Campos faltantes:', missingFields);
    } else {
        console.log('✅ Todos los campos requeridos presentes');
    }
    
    // Validar items
    if (testData.items && testData.items.length > 0) {
        const itemFields = ['description', 'quantity', 'unitPrice'];
        testData.items.forEach((item, index) => {
            const missingItemFields = itemFields.filter(field => !item[field]);
            if (missingItemFields.length > 0) {
                console.log(\`❌ Item \${index + 1} campos faltantes:\`, missingItemFields);
            } else {
                console.log(\`✅ Item \${index + 1} válido\`);
            }
        });
    }
    
    return testData;
}

window.testExternalInvoiceData = testExternalInvoiceData;
`;
    
    if (!content.includes('function testExternalInvoiceData')) {
        content += testFunction;
        fs.writeFileSync(invoicesPath, content);
        console.log('   ✅ Función de prueba agregada');
    } else {
        console.log('   ✅ Función de prueba ya presente');
    }
}

function generateTestInstructions() {
    console.log('\n📋 INSTRUCCIONES DE DEPURACIÓN:');
    console.log('');
    console.log('1. Reinicia el servidor si no está corriendo');
    console.log('2. Ve a http://localhost:3000 e inicia sesión');
    console.log('3. Ve a Facturación → Facturas');
    console.log('4. Abre las herramientas de desarrollador (F12)');
    console.log('5. En la consola, ejecuta: testExternalInvoiceData()');
    console.log('6. Verifica que los datos de prueba sean válidos');
    console.log('7. Intenta crear una factura externa');
    console.log('8. Observa los logs detallados en la consola');
    console.log('');
    console.log('🔍 LOGS ESPERADOS:');
    console.log('   • "💾 Procesando factura externa con fondo: [fund-id]"');
    console.log('   • "💾 Creando factura externa..." + datos');
    console.log('   • "✅ Factura externa creada:" + respuesta');
    console.log('');
    console.log('❌ SI VES ERROR 500:');
    console.log('   • Revisa los logs del servidor en la terminal');
    console.log('   • Verifica que todos los campos requeridos estén presentes');
    console.log('   • Comprueba que la estructura de datos sea correcta');
    console.log('');
    console.log('🔧 PARA REVISAR LOGS DEL SERVIDOR:');
    console.log('   • Ve a la terminal donde corre el servidor');
    console.log('   • Busca errores después de intentar crear la factura');
    console.log('   • Reporta el error exacto que aparece');
}

async function main() {
    try {
        const routesOk = checkInvoiceRoutes();
        addExternalInvoiceDebugging();
        generateTestInstructions();
        
        console.log('\n📊 RESUMEN:');
        console.log(`   Rutas de facturas: ${routesOk ? '✅' : '❌'}`);
        console.log('   Función de prueba: ✅');
        console.log('   Logs de depuración: ✅');
        
        if (!routesOk) {
            console.log('\n⚠️ PROBLEMA DETECTADO:');
            console.log('   Las rutas de facturas pueden no estar configuradas correctamente');
            console.log('   Revisa el archivo routes/invoice.routes.js');
        }
        
    } catch (error) {
        console.error('❌ Error durante la depuración:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };