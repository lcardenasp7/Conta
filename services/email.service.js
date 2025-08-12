/**
 * Email Service
 * Servicio para envío de emails usando diferentes proveedores
 */

const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.init();
    }

    init() {
        // Configuración para diferentes proveedores de email
        const emailConfig = this.getEmailConfig();
        
        if (emailConfig) {
            this.transporter = nodemailer.createTransporter(emailConfig);
        } else {
            console.warn('⚠️  Email service no configurado - usando modo simulación');
        }
    }

    getEmailConfig() {
        const provider = process.env.EMAIL_PROVIDER || 'gmail';
        
        switch (provider.toLowerCase()) {
            case 'gmail':
                return this.getGmailConfig();
            case 'sendgrid':
                return this.getSendGridConfig();
            case 'smtp':
                return this.getSMTPConfig();
            default:
                return null;
        }
    }

    getGmailConfig() {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            return null;
        }

        return {
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS // App Password, no la contraseña normal
            }
        };
    }

    getSendGridConfig() {
        if (!process.env.SENDGRID_API_KEY) {
            return null;
        }

        return {
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: {
                user: 'apikey',
                pass: process.env.SENDGRID_API_KEY
            }
        };
    }

    getSMTPConfig() {
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            return null;
        }

        return {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        };
    }

    async sendEmail(to, subject, html, text = null) {
        try {
            // Si no hay transporter configurado, simular envío
            if (!this.transporter) {
                return this.simulateEmail(to, subject, html);
            }

            const mailOptions = {
                from: process.env.SMTP_FROM || `"Sistema Escolar" <${process.env.SMTP_USER}>`,
                to: to,
                subject: subject,
                html: html,
                text: text || this.htmlToText(html)
            };

            const result = await this.transporter.sendMail(mailOptions);
            
            console.log('✅ Email enviado exitosamente:', {
                to: to,
                subject: subject,
                messageId: result.messageId
            });

            return {
                success: true,
                messageId: result.messageId
            };

        } catch (error) {
            console.error('❌ Error enviando email:', error);
            
            // En desarrollo, simular envío si falla
            if (process.env.NODE_ENV !== 'production') {
                console.log('🔄 Simulando envío de email en desarrollo...');
                return this.simulateEmail(to, subject, html);
            }

            throw error;
        }
    }

    simulateEmail(to, subject, html) {
        console.log('\n📧 ========== EMAIL SIMULADO ==========');
        console.log(`Para: ${to}`);
        console.log(`Asunto: ${subject}`);
        console.log('Contenido HTML:');
        console.log(html);
        console.log('=====================================\n');

        return {
            success: true,
            messageId: 'simulated-' + Date.now(),
            simulated: true
        };
    }

    htmlToText(html) {
        // Conversión básica de HTML a texto plano
        return html
            .replace(/<[^>]*>/g, '') // Remover tags HTML
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
    }

    // Templates de email predefinidos
    getPasswordResetTemplate(userName, resetUrl) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">
                        <i style="font-size: 40px;">🔐</i><br>
                        Restablecer Contraseña
                    </h1>
                </div>
                
                <div style="padding: 30px; background-color: white;">
                    <h2 style="color: #2c3e50; margin-bottom: 20px;">Hola ${userName},</h2>
                    
                    <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                        Recibimos una solicitud para restablecer tu contraseña en el 
                        <strong>Sistema de Gestión Escolar</strong> de la I.E.D. Villas de San Pablo.
                    </p>
                    
                    <p style="color: #555; line-height: 1.6; margin-bottom: 30px;">
                        Haz clic en el siguiente botón para crear una nueva contraseña:
                    </p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${resetUrl}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 25px; 
                                  display: inline-block;
                                  font-weight: bold;
                                  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                            🔑 Restablecer Contraseña
                        </a>
                    </div>
                    
                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                        <p style="color: #856404; margin: 0; font-weight: bold;">
                            ⏰ Este enlace expira en 1 hora
                        </p>
                    </div>
                    
                    <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                        Si no solicitaste este cambio, puedes ignorar este email de forma segura.
                    </p>
                    
                    <p style="color: #555; line-height: 1.6;">
                        Si tienes problemas con el botón, copia y pega este enlace en tu navegador:
                    </p>
                    <p style="word-break: break-all; color: #667eea; font-size: 12px;">
                        ${resetUrl}
                    </p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
                    <p style="color: #6c757d; margin: 0; font-size: 12px;">
                        Sistema de Gestión Escolar<br>
                        I.E.D. Villas de San Pablo<br>
                        Barranquilla, Colombia
                    </p>
                </div>
            </div>
        `;
    }

    getPasswordChangedTemplate(userName) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">
                        <i style="font-size: 40px;">✅</i><br>
                        Contraseña Actualizada
                    </h1>
                </div>
                
                <div style="padding: 30px; background-color: white;">
                    <h2 style="color: #2c3e50; margin-bottom: 20px;">Hola ${userName},</h2>
                    
                    <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                        Tu contraseña ha sido <strong>actualizada exitosamente</strong> en el 
                        Sistema de Gestión Escolar.
                    </p>
                    
                    <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
                        <p style="color: #155724; margin: 0; font-weight: bold;">
                            🔒 Tu cuenta está segura
                        </p>
                    </div>
                    
                    <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                        Si <strong>NO</strong> realizaste este cambio, contacta inmediatamente 
                        al administrador del sistema.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <p style="color: #6c757d; font-size: 14px;">
                            Fecha y hora: ${new Date().toLocaleString('es-CO')}
                        </p>
                    </div>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
                    <p style="color: #6c757d; margin: 0; font-size: 12px;">
                        Sistema de Gestión Escolar<br>
                        I.E.D. Villas de San Pablo<br>
                        Barranquilla, Colombia
                    </p>
                </div>
            </div>
        `;
    }

    // Método para verificar la configuración
    async verifyConnection() {
        if (!this.transporter) {
            return { success: false, message: 'Email service no configurado' };
        }

        try {
            await this.transporter.verify();
            return { success: true, message: 'Conexión de email verificada' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// Singleton instance
const emailService = new EmailService();

module.exports = emailService;