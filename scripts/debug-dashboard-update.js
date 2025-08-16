/**
 * Script para debuggear por qué el dashboard no se actualiza
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugDashboardUpdate() {
    try {
        console.log('🔍 Debuggeando actualización del dashboard...');

        // 1. Verificar facturas canceladas recientemente
        const cancelledInvoices = await prisma.invoice.findMany({
            where: {
                status: 'CANCELLED',
                updatedAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: 5,
            select: {
                id: true,
                invoiceNumber: true,
                total: true,
                status: true,
                updatedAt: true,
                observations: true
            }
        });

        console.log('📋 Facturas canceladas recientemente:');
        cancelledInvoices.forEach(invoice => {
            console.log(`   ${invoice.invoiceNumber}: $${invoice.total.toLocaleString()} - ${invoice.updatedAt}`);
        });

        // 2. Verificar totales actuales
        const [totalPending, totalCancelled, totalPaid] = await Promise.all([
            prisma.invoice.aggregate({
                _sum: { total: true },
                _count: { id: true },
                where: { status: 'PENDING' }
            }),
            prisma.invoice.aggregate({
                _sum: { total: true },
                _count: { id: true },
                where: { status: 'CANCELLED' }
            }),
            prisma.invoice.aggregate({
                _sum: { total: true },
                _count: { id: true },
                where: { status: 'PAID' }
            })
        ]);

        console.log('\n📊 Estado actual de facturas:');
        console.log(`   PENDIENTES: ${totalPending._count.id} facturas - $${(totalPending._sum.total || 0).toLocaleString()}`);
        console.log(`   CANCELADAS: ${totalCancelled._count.id} facturas - $${(totalCancelled._sum.total || 0).toLocaleString()}`);
        console.log(`   PAGADAS: ${totalPaid._count.id} facturas - $${(totalPaid._sum.total || 0).toLocaleString()}`);

        // 3. Crear script de debugging para el navegador
        const browserDebugScript = `
// Script de debugging para el dashboard en el navegador
console.log('🔍 Iniciando debugging del dashboard...');

// 1. Verificar si las funciones están disponibles
console.log('📋 Verificando funciones disponibles:');
const functions = [
    'loadFinancialOverview',
    'updateFinancialDashboard', 
    'notifyFinancialChange'
];

functions.forEach(func => {
    const available = typeof window[func] === 'function';
    console.log(\`   \${available ? '✅' : '❌'} \${func}: \${available ? 'DISPONIBLE' : 'NO DISPONIBLE'}\`);
});

// 2. Verificar si hay event listeners
console.log('\\n👂 Verificando event listeners:');
const hasFinancialListener = document._events && document._events['financialDataChanged'];
console.log(\`   Event listener financialDataChanged: \${hasFinancialListener ? '✅ EXISTE' : '❌ NO EXISTE'}\`);

// 3. Probar emisión manual de evento
function testManualEvent() {
    console.log('\\n🧪 Probando emisión manual de evento...');
    
    const event = new CustomEvent('financialDataChanged', {
        detail: {
            type: 'invoice_cancelled',
            data: {
                invoiceId: 'test-123',
                amount: 150000,
                reason: 'Prueba manual'
            },
            timestamp: new Date()
        }
    });
    
    document.dispatchEvent(event);
    console.log('✅ Evento emitido manualmente');
}

// 4. Probar actualización directa del dashboard
function testDirectUpdate() {
    console.log('\\n🔄 Probando actualización directa...');
    
    if (typeof window.loadFinancialOverview === 'function') {
        window.loadFinancialOverview()
            .then(() => console.log('✅ Dashboard actualizado directamente'))
            .catch(error => console.error('❌ Error actualizando dashboard:', error));
    } else {
        console.log('❌ Función loadFinancialOverview no disponible');
    }
}

// 5. Verificar API del dashboard
async function testDashboardAPI() {
    console.log('\\n🌐 Probando API del dashboard...');
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/financial-dashboard/overview?period=current-month', {
            headers: {
                'Authorization': \`Bearer \${token}\`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API del dashboard funciona:', data.summary);
        } else {
            console.error('❌ Error en API del dashboard:', response.status);
        }
    } catch (error) {
        console.error('❌ Error llamando API:', error);
    }
}

// 6. Monitorear eventos en tiempo real
function monitorEvents() {
    console.log('\\n👀 Monitoreando eventos financieros...');
    
    document.addEventListener('financialDataChanged', function(event) {
        console.log('📢 EVENTO RECIBIDO:', {
            type: event.detail.type,
            data: event.detail.data,
            timestamp: event.detail.timestamp
        });
    });
    
    console.log('✅ Monitor de eventos activado');
}

// Ejecutar pruebas automáticamente
console.log('\\n🚀 Ejecutando pruebas automáticas...');

// Activar monitor primero
monitorEvents();

// Probar después de 1 segundo
setTimeout(() => {
    testManualEvent();
}, 1000);

// Probar actualización directa después de 3 segundos
setTimeout(() => {
    testDirectUpdate();
}, 3000);

// Probar API después de 5 segundos
setTimeout(() => {
    testDashboardAPI();
}, 5000);

console.log('\\n🔧 Funciones disponibles para prueba manual:');
console.log('   - testManualEvent()');
console.log('   - testDirectUpdate()');
console.log('   - testDashboardAPI()');
console.log('   - monitorEvents()');

// Hacer funciones globales
window.testManualEvent = testManualEvent;
window.testDirectUpdate = testDirectUpdate;
window.testDashboardAPI = testDashboardAPI;
window.monitorEvents = monitorEvents;
`;

        const fs = require('fs');
        fs.writeFileSync('public/debug-dashboard.js', browserDebugScript);
        console.log('\n📝 Script de debugging creado: public/debug-dashboard.js');

        // 4. Instrucciones
        console.log('\n📋 INSTRUCCIONES PARA DEBUGGING:');
        console.log('');
        console.log('1. Abrir el dashboard en el navegador');
        console.log('2. Abrir consola del navegador (F12)');
        console.log('3. Ejecutar:');
        console.log('');
        console.log('   const script = document.createElement("script");');
        console.log('   script.src = "/debug-dashboard.js";');
        console.log('   document.head.appendChild(script);');
        console.log('');
        console.log('4. Revisar los logs para identificar el problema');
        console.log('');
        console.log('🔍 POSIBLES CAUSAS:');
        console.log('   • Event listeners no configurados correctamente');
        console.log('   • Funciones no disponibles globalmente');
        console.log('   • API del dashboard no funcionando');
        console.log('   • Eventos no siendo emitidos');
        console.log('   • Cache del navegador');

        return {
            success: true,
            cancelledInvoices: cancelledInvoices.length,
            totalPending: totalPending._count.id,
            totalCancelled: totalCancelled._count.id,
            debugScriptCreated: true
        };

    } catch (error) {
        console.error('❌ Error en debugging:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    debugDashboardUpdate()
        .then(result => {
            console.log('\n📊 Resultado del debugging:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = debugDashboardUpdate;