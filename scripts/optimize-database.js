#!/usr/bin/env node

/**
 * Script para optimizar la base de datos con índices críticos
 * Uso: node scripts/optimize-database.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createOptimizationIndexes() {
    console.log('🔧 Iniciando optimización de base de datos...');
    
    try {
        // Índices críticos para performance
        const indexes = [
            // Estudiantes - Búsquedas frecuentes
            {
                name: 'idx_student_document',
                sql: 'CREATE INDEX IF NOT EXISTS "idx_student_document" ON "Student"("document");'
            },
            {
                name: 'idx_student_grade_group',
                sql: 'CREATE INDEX IF NOT EXISTS "idx_student_grade_group" ON "Student"("gradeId", "groupId");'
            },
            {
                name: 'idx_student_status',
                sql: 'CREATE INDEX IF NOT EXISTS "idx_student_status" ON "Student"("status");'
            },
            {
                name: 'idx_student_name',
                sql: 'CREATE INDEX IF NOT EXISTS "idx_student_name" ON "Student"("firstName", "lastName");'
            },
            
            // Eventos - Consultas de estado y fecha
            {
                name: 'idx_event_status_date',
                sql: 'CREATE INDEX IF NOT EXISTS "idx_event_status_date" ON "Event"("status", "eventDate");'
            },
            {
                name: 'idx_event_type',
                sql: 'CREATE INDEX IF NOT EXISTS "idx_event_type" ON "Event"("type");'
            },
            
            // Asignaciones de eventos
            {
                name: 'idx_event_assignment_student',
                sql: 'CREATE INDEX IF NOT EXISTS "idx_event_assignment_student" ON "EventAssignment"("studentId");'
            },
            {
                name: 'idx_event_assignment_event',
                sql: 'CREATE INDEX IF NOT EXISTS "idx_event_assignment_event" ON "EventAssignment"("eventId");'
            },
            
            // Pagos - Consultas por estudiante y fecha
            {
                name: 'idx_payment_student_date',
                sql: 'CREATE INDEX IF NOT EXISTS "idx_payment_student_date" ON "Payment"("studentId", "date");'
            },
            {
                name: 'idx_payment_status',
                sql: 'CREATE INDEX IF NOT EXISTS "idx_payment_status" ON "Payment"("status");'
            },
            {
                name: 'idx_payment_method',
                sql: 'CREATE INDEX IF NOT EXISTS "idx_payment_method" ON "Payment"("method");'
            },
            
            // Facturas - Consultas por estudiante y estado
            {
                name: 'idx_invoice_student_status',
                sql: 'CREATE INDEX IF NOT EXISTS "idx_invoice_student_status" ON "Invoice"("studentId", "status");'
            },
            {
                name: 'idx_invoice_date',
                sql: 'CREATE INDEX IF NOT EXISTS "idx_invoice_date" ON "Invoice"("date");'
            },
            {
                name: 'idx_invoice_due_date',
                sql: 'CREATE INDEX IF NOT EXISTS "idx_invoice_due_date" ON "Invoice"("dueDate");'
            },
            
            // Usuarios - Autenticación
            {
                name: 'idx_user_email',
                sql: 'CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");'
            },
            {
                name: 'idx_user_role_active',
                sql: 'CREATE INDEX IF NOT EXISTS "idx_user_role_active" ON "User"("role", "isActive");'
            },
            
            // Transacciones - Consultas contables
            {
                name: 'idx_transaction_date',
                sql: 'CREATE INDEX IF NOT EXISTS "idx_transaction_date" ON "Transaction"("date");'
            },
            {
                name: 'idx_transaction_accounts',
                sql: 'CREATE INDEX IF NOT EXISTS "idx_transaction_accounts" ON "Transaction"("debitAccountId", "creditAccountId");'
            }
        ];
        
        console.log(`📊 Creando ${indexes.length} índices de optimización...`);
        
        for (const index of indexes) {
            try {
                await prisma.$executeRawUnsafe(index.sql);
                console.log(`✅ ${index.name} - Creado exitosamente`);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`ℹ️  ${index.name} - Ya existe`);
                } else {
                    console.error(`❌ ${index.name} - Error:`, error.message);
                }
            }
        }
        
        // Actualizar estadísticas de la base de datos
        console.log('📈 Actualizando estadísticas de la base de datos...');
        await prisma.$executeRaw`ANALYZE;`;
        
        console.log('✅ Optimización de base de datos completada');
        
        // Mostrar estadísticas
        await showDatabaseStats();
        
    } catch (error) {
        console.error('❌ Error durante la optimización:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

async function showDatabaseStats() {
    try {
        console.log('\n📊 Estadísticas de la base de datos:');
        console.log('=' .repeat(50));
        
        const stats = await Promise.all([
            prisma.student.count(),
            prisma.event.count(),
            prisma.payment.count(),
            prisma.invoice.count(),
            prisma.user.count()
        ]);
        
        console.log(`👥 Estudiantes: ${stats[0].toLocaleString()}`);
        console.log(`🎯 Eventos: ${stats[1].toLocaleString()}`);
        console.log(`💰 Pagos: ${stats[2].toLocaleString()}`);
        console.log(`📄 Facturas: ${stats[3].toLocaleString()}`);
        console.log(`👤 Usuarios: ${stats[4].toLocaleString()}`);
        
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error.message);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    createOptimizationIndexes()
        .then(() => {
            console.log('🎉 Proceso completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Proceso falló:', error);
            process.exit(1);
        });
}

module.exports = { createOptimizationIndexes, showDatabaseStats };