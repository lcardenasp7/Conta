/**
 * Script para verificar que las correcciones del header están funcionando
 * Usa una factura existente para generar PDF y verificar cambios
 */

const { PrismaClient } = require('@prisma/client');
const invoiceService = require('../services/invoice-generator.service.js');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function verifyHeaderCorrections() {
    try {
        console.log('🔍 Verificando correcciones del header de facturas...\n');

        // 1. Buscar una factura existente
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
            throw new Error('No se encontraron facturas para verificar');
        }

        console.log(`📄 Verificando con factura: ${invoice.invoiceNumber}`);
        console.log(`👤 Cliente: ${invoice.student ? `${invoice.student.firstName} ${invoice.student.lastName}` : 'Cliente Externo'}`);

        // 2. Generar PDF con las correcciones
        console.log('\n🔧 Generando PDF con correcciones aplicadas...');
        
        const pdfBuffer = await invoiceService.generateInvoicePDFBuffer(invoice.id);
        
        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('Error generando PDF');
        }

        // 3. Guardar PDF de verificación
        const fileName = `verificacion-header-${invoice.invoiceNumber}-${Date.now()}.pdf`;
        const filePath = path.join(__dirname, fileName);
        
        fs.writeFileSync(filePath, pdfBuffer);
        
        console.log(`✅ PDF de verificación generado: ${fileName}`);
        console.log(`📁 Ubicación: ${filePath}`);
        console.log(`📊 Tamaño: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

        // 4. Verificar que el servicio tiene las correcciones
        console.log('\n🔍 Verificando código del servicio...');
        
        const serviceCode = fs.readFileSync(path.join(__dirname, '../services/invoice-generator.service.js'), 'utf8');
        
        const corrections = {
            'Nombre dividido en líneas': serviceCode.includes('words.slice(0, midPoint)'),
            'Tamaño de fuente 9pt': serviceCode.includes('fontSize(9)'),
            'Dirección específica': serviceCode.includes('Dg. 136 #9D - 60, Suroccidente, Barranquilla'),
            'Espaciado ajustado': serviceCode.includes('startY + 26') && serviceCode.includes('startY + 95')
        };

        console.log('\n📋 Estado de las correcciones en el código:');
        Object.entries(corrections).forEach(([correction, applied]) => {
            console.log(`   ${applied ? '✅' : '❌'} ${correction}`);
        });

        const allCorrectionsApplied = Object.values(corrections).every(Boolean);

        if (allCorrectionsApplied) {
            console.log('\n🎉 ¡Todas las correcciones están aplicadas en el código!');
            console.log('💡 Si el problema persiste, puede ser necesario:');
            console.log('   1. Reiniciar completamente el servidor');
            console.log('   2. Limpiar caché del navegador');
            console.log('   3. Verificar que no hay otros archivos de servicio');
        } else {
            console.log('\n⚠️  Algunas correcciones no están aplicadas en el código');
            console.log('🔧 Revisa el archivo services/invoice-generator.service.js');
        }

        // 5. Mostrar instrucciones
        console.log('\n📖 Para aplicar completamente los cambios:');
        console.log('   1. Detén el servidor actual (Ctrl+C)');
        console.log('   2. Ejecuta: node server.js');
        console.log('   3. Crea una nueva factura desde la interfaz web');
        console.log('   4. Descarga el PDF para verificar las correcciones');

        return {
            success: true,
            correctionsApplied: allCorrectionsApplied,
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
    verifyHeaderCorrections()
        .then(result => {
            console.log('\n✅ Verificación completada');
            if (result.correctionsApplied) {
                console.log('🎯 Las correcciones están aplicadas correctamente');
            } else {
                console.log('⚠️  Revisa las correcciones pendientes');
            }
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Error en la verificación:', error.message);
            process.exit(1);
        });
}

module.exports = { verifyHeaderCorrections };