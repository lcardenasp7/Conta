/**
 * Script para forzar la aplicación de las correcciones del header
 * Regenera el servicio y prueba inmediatamente
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function forceHeaderFix() {
    try {
        console.log('🔧 Forzando aplicación de correcciones del header...\n');

        // 1. Limpiar caché de require
        const servicePath = path.resolve(__dirname, '../services/invoice-generator.service.js');
        delete require.cache[servicePath];
        
        console.log('✅ Caché de servicio limpiado');

        // 2. Recargar el servicio
        const invoiceService = require('../services/invoice-generator.service.js');
        console.log('✅ Servicio recargado');

        // 3. Buscar factura existente
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
            throw new Error('No se encontraron facturas');
        }

        console.log(`📄 Usando factura: ${invoice.invoiceNumber}`);

        // 4. Generar PDF con correcciones forzadas
        console.log('🔧 Generando PDF con correcciones forzadas...');
        
        const pdfBuffer = await invoiceService.generateInvoicePDFBuffer(invoice.id);
        
        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('Error generando PDF');
        }

        // 5. Guardar PDF
        const fileName = `header-forzado-${Date.now()}.pdf`;
        const filePath = path.join(__dirname, fileName);
        
        fs.writeFileSync(filePath, pdfBuffer);
        
        console.log(`✅ PDF generado: ${fileName}`);
        console.log(`📁 Ubicación: ${filePath}`);
        console.log(`📊 Tamaño: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

        // 6. Verificar el código actual
        console.log('\n🔍 Verificando código actual...');
        
        const serviceCode = fs.readFileSync(servicePath, 'utf8');
        
        const checks = {
            'División por palabras': serviceCode.includes('words.length > 3'),
            'Tamaño 9pt': serviceCode.includes('fontSize(9)'),
            'Dirección específica': serviceCode.includes('Dg. 136 #9D - 60, Suroccidente, Barranquilla'),
            'Espaciado Y+26': serviceCode.includes('startY + 26'),
            'Línea Y+85': serviceCode.includes('startY + 85'),
            'Retorno Y+95': serviceCode.includes('return startY + 95')
        };

        console.log('\n📋 Estado de correcciones:');
        Object.entries(checks).forEach(([check, passed]) => {
            console.log(`   ${passed ? '✅' : '❌'} ${check}`);
        });

        const allPassed = Object.values(checks).every(Boolean);

        if (allPassed) {
            console.log('\n🎉 ¡Todas las correcciones están aplicadas!');
            console.log('💡 Si el problema persiste en la interfaz web:');
            console.log('   1. Limpia caché del navegador (Ctrl+Shift+R)');
            console.log('   2. Verifica que no hay otros servicios de PDF');
            console.log('   3. Reinicia completamente el servidor');
        } else {
            console.log('\n⚠️  Algunas correcciones faltan');
        }

        // 7. Mostrar información de la institución
        const institution = await prisma.institution.findFirst();
        if (institution) {
            console.log('\n🏫 Información de la institución:');
            console.log(`   Nombre: "${institution.name}"`);
            console.log(`   Palabras: ${institution.name.split(' ').length}`);
            console.log(`   Longitud: ${institution.name.length} caracteres`);
        }

        return {
            success: true,
            allCorrectionsApplied: allPassed,
            pdfPath: filePath,
            institutionName: institution?.name
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
    forceHeaderFix()
        .then(result => {
            console.log('\n✅ Proceso completado');
            if (result.allCorrectionsApplied) {
                console.log('🎯 Todas las correcciones están aplicadas');
                console.log('📄 Revisa el PDF generado para confirmar');
            }
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Error en el proceso:', error.message);
            process.exit(1);
        });
}

module.exports = { forceHeaderFix };