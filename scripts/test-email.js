#!/usr/bin/env node

/**
 * Script para probar el servicio de email
 * Uso: node scripts/test-email.js [email-destino]
 */

require('dotenv').config();
const emailService = require('../services/email.service');

async function testEmailService() {
    const testEmail = process.argv[2] || 'test@example.com';
    
    console.log('📧 Probando servicio de email...');
    console.log(`📮 Email de destino: ${testEmail}`);
    console.log('=' .repeat(50));
    
    try {
        // 1. Verificar configuración
        console.log('🔧 Verificando configuración...');
        const verification = await emailService.verifyConnection();
        
        if (verification.success) {
            console.log('✅ Configuración de email válida');
        } else {
            console.log('⚠️  Configuración de email:', verification.message);
            console.log('🔄 Continuando con modo simulación...');
        }
        
        // 2. Probar email de reset de contraseña
        console.log('\n📧 Probando email de reset de contraseña...');
        const resetUrl = 'http://localhost:3000/reset-password.html?token=test-token-123';
        const resetHtml = emailService.getPasswordResetTemplate('Usuario de Prueba', resetUrl);
        
        const resetResult = await emailService.sendEmail(
            testEmail,
            'Prueba - Restablecer Contraseña',
            resetHtml
        );
        
        if (resetResult.success) {
            console.log('✅ Email de reset enviado exitosamente');
            if (resetResult.simulated) {
                console.log('ℹ️  Email simulado (revisar logs arriba)');
            } else {
                console.log(`📧 Message ID: ${resetResult.messageId}`);
            }
        }
        
        // 3. Probar email de confirmación
        console.log('\n📧 Probando email de confirmación...');
        const confirmHtml = emailService.getPasswordChangedTemplate('Usuario de Prueba');
        
        const confirmResult = await emailService.sendEmail(
            testEmail,
            'Prueba - Contraseña Actualizada',
            confirmHtml
        );
        
        if (confirmResult.success) {
            console.log('✅ Email de confirmación enviado exitosamente');
            if (confirmResult.simulated) {
                console.log('ℹ️  Email simulado (revisar logs arriba)');
            } else {
                console.log(`📧 Message ID: ${confirmResult.messageId}`);
            }
        }
        
        console.log('\n🎉 Prueba de email completada exitosamente');
        
        // Mostrar configuración actual
        console.log('\n📋 Configuración actual:');
        console.log(`   EMAIL_PROVIDER: ${process.env.EMAIL_PROVIDER || 'no configurado'}`);
        console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'no configurado'}`);
        console.log(`   SMTP_USER: ${process.env.SMTP_USER || 'no configurado'}`);
        console.log(`   SMTP_FROM: ${process.env.SMTP_FROM || 'no configurado'}`);
        
        if (!process.env.SMTP_USER) {
            console.log('\n💡 Para configurar email real:');
            console.log('   1. Copia .env.example a .env');
            console.log('   2. Configura las variables SMTP_*');
            console.log('   3. Para Gmail, usa App Password en SMTP_PASS');
            console.log('   4. Ejecuta este script nuevamente');
        }
        
    } catch (error) {
        console.error('❌ Error durante la prueba:', error.message);
        console.error('🔍 Detalles:', error);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testEmailService()
        .then(() => {
            console.log('\n✅ Prueba completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Prueba falló:', error);
            process.exit(1);
        });
}

module.exports = { testEmailService };