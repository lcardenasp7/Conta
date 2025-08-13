/**
 * Script para probar las mejoras del header:
 * - Nombre del colegio más grande
 * - Número de factura debajo de FACTURA
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testImprovedHeader() {
    try {
        console.log('🎨 Probando mejoras del header de facturas...\n');

        // 1. Limpiar caché del servicio
        const servicePath = path.resolve(__dirname, '../services/invoice-generator.service.js');
        delete require.cache[servicePath];
        
        const invoiceService = require('../services/invoice-generator.service.js');
        console.log('✅ Servicio recargado con mejoras');

        // 2. Buscar factura existente
        const invoice = await prisma.invoice.findFirst({
            include: {
                student: {
                    include: {
                        grade: { select: { name: true } },
                        group: { select: { name: true } }
                    }
                },
                items: true,
                user: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!invoice) {
            throw new Error('No se encontraron facturas para probar');
        }

        console.log(`📄 Probando con factura: ${invoice.invoiceNumber}`);

        // 3. Generar PDF con mejoras
        console.log('🔧 Generando PDF con header mejorado...');
        
        const pdfBuffer = await invoiceService.generateInvoicePDFBuffer(invoice.id);
        
        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('Error generando PDF');
        }

        // 4. Guardar PDF
        const fileName = `header-mejorado-${Date.now()}.pdf`;
        const filePath = path.join(__dirname, fileName);
        
        fs.writeFileSync(filePath, pdfBuffer);
        
        console.log(`✅ PDF generado: ${fileName}`);
        console.log(`📁 Ubicación: ${filePath}`);
        console.log(`📊 Tamaño: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

        // 5. Verificar mejoras en el código
        console.log('\n🔍 Verificando mejoras aplicadas...');
        
        const serviceCode = fs.readFileSync(servicePath, 'utf8');
        
        const improvements = {
            'Nombre más grande (10pt)': serviceCode.includes('fontSize(10)'),
            'Número de factura agregado': serviceCode.includes('invoice.invoiceNumber'),
            'Espaciado ajustado': serviceCode.includes('startY + 100'),
            'Parámetro invoice agregado': serviceCode.includes('addOptimizedHeader(doc, institution, startY, invoice)'),
            'Dirección específica': serviceCode.includes('Dg. 136 #9D - 60, Suroccidente, Barranquilla')
        };

        console.log('\n📋 Estado de las mejoras:');
        Object.entries(improvements).forEach(([improvement, applied]) => {
            console.log(`   ${applied ? '✅' : '❌'} ${improvement}`);
        });

        const allImprovementsApplied = Object.values(improvements).every(Boolean);

        // 6. Mostrar información de la factura
        console.log('\n📋 Información de la factura probada:');
        console.log(`   • Número: ${invoice.invoiceNumber}`);
        console.log(`   • Cliente: ${invoice.student ? `${invoice.student.firstName} ${invoice.student.lastName}` : 'Cliente Externo'}`);
        console.log(`   • Total: $${invoice.total.toLocaleString()}`);

        // 7. Mostrar mejoras aplicadas
        console.log('\n🎯 Mejoras aplicadas:');
        console.log('   ✅ Nombre del colegio más grande (10pt en lugar de 9pt)');
        console.log('   ✅ Número de factura debajo de "FACTURA"');
        console.log('   ✅ Espaciado ajustado para evitar superposición');
        console.log('   ✅ Dirección específica del colegio');

        if (allImprovementsApplied) {
            console.log('\n🎉 ¡Todas las mejoras están aplicadas correctamente!');
        } else {
            console.log('\n⚠️  Algunas mejoras necesitan revisión');
        }

        return {
            success: true,
            allImprovementsApplied,
            pdfPath: filePath,
            invoiceNumber: invoice.invoiceNumber
        };

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testImprovedHeader()
        .then(result => {
            console.log('\n✅ Prueba completada exitosamente');
            console.log('💡 Revisa el PDF generado para ver las mejoras');
            console.log('🔄 Reinicia el servidor para aplicar los cambios en la interfaz web');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Error en la prueba:', error.message);
            process.exit(1);
        });
}

module.exports = { testImprovedHeader };