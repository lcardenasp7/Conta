/**
 * Script para probar el dashboard financiero corregido
 */

const express = require('express');
const path = require('path');

// Crear servidor de prueba simple
const app = express();
const PORT = 3001;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Ruta de prueba para el dashboard
app.get('/test-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/test-dashboard-complete.html'));
});

// API simulada para el dashboard
app.get('/api/financial-dashboard/overview', (req, res) => {
    console.log('📊 Solicitud de overview financiero recibida');
    
    const mockData = {
        summary: {
            totalIncome: 15750000,
            totalExpenses: 8920000,
            netCashFlow: 6830000,
            pendingAmount: 2450000,
            pendingCount: 12
        },
        period: {
            name: 'Enero 2025',
            start: '2025-01-01',
            end: '2025-01-31'
        },
        income: {
            byCategory: {
                'TUITION': { total: 8500000, count: 45 },
                'MONTHLY': { total: 6200000, count: 78 },
                'EVENT': { total: 850000, count: 12 },
                'TRANSPORT': { total: 200000, count: 8 }
            }
        },
        expenses: {
            byCategory: {
                'OFFICE_SUPPLIES': { total: 1200000, count: 15 },
                'MAINTENANCE': { total: 2800000, count: 8 },
                'UTILITIES': { total: 1920000, count: 12 },
                'PROFESSIONAL_SERVICES': { total: 3000000, count: 6 }
            }
        },
        trends: [
            { monthName: 'Oct 2024', income: 14200000, expenses: 7800000, net: 6400000 },
            { monthName: 'Nov 2024', income: 15100000, expenses: 8200000, net: 6900000 },
            { monthName: 'Dec 2024', income: 16800000, expenses: 9100000, net: 7700000 },
            { monthName: 'Ene 2025', income: 15750000, expenses: 8920000, net: 6830000 }
        ],
        recentActivity: [
            {
                type: 'income',
                description: 'Pago mensualidad - Juan Pérez',
                category: 'MONTHLY',
                amount: 180000,
                date: '2025-01-12'
            },
            {
                type: 'expense',
                description: 'Compra útiles de oficina',
                category: 'OFFICE_SUPPLIES',
                amount: 85000,
                date: '2025-01-11'
            },
            {
                type: 'income',
                description: 'Matrícula - María González',
                category: 'TUITION',
                amount: 350000,
                date: '2025-01-10'
            }
        ],
        pending: {
            invoices: [
                {
                    invoiceNumber: 'FAC-2025-001',
                    total: 180000,
                    dueDate: '2025-01-20',
                    student: { firstName: 'Carlos', lastName: 'Rodríguez' }
                },
                {
                    invoiceNumber: 'FAC-2025-002',
                    total: 350000,
                    dueDate: '2025-01-15',
                    student: { firstName: 'Ana', lastName: 'Martínez' }
                },
                {
                    invoiceNumber: 'FAC-2025-003',
                    total: 120000,
                    dueDate: '2025-01-08',
                    student: { firstName: 'Luis', lastName: 'García' }
                }
            ]
        }
    };
    
    // Simular delay de red
    setTimeout(() => {
        res.json(mockData);
    }, 300);
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('🚀 Servidor de prueba iniciado');
    console.log(`📊 Dashboard disponible en: http://localhost:${PORT}/test-dashboard`);
    console.log('🔧 Presiona Ctrl+C para detener');
});