/**
 * SERVICIO DE PRÉSTAMOS ENTRE FONDOS - FRONTEND
 * Maneja la lógica completa de préstamos con aprobación automática/manual
 * Autor: Sistema de Trazabilidad VSP
 * Fecha: 2024-01-15
 */

class FundLoanService {
    
    constructor() {
        this.apiBase = '/api/fund-loans';
    }
    
    // ==========================================
    // GESTIÓN DE PRÉSTAMOS
    // ==========================================
    
    /**
     * Obtener todos los préstamos con filtros
     */
    async getAllLoans(filters = {}) {
        try {
            console.log('📋 Obteniendo préstamos con filtros:', filters);
            
            const queryParams = new URLSearchParams();
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.lenderFundId) queryParams.append('lenderFundId', filters.lenderFundId);
            if (filters.borrowerFundId) queryParams.append('borrowerFundId', filters.borrowerFundId);
            if (filters.requestedBy) queryParams.append('requestedBy', filters.requestedBy);
            if (filters.overdue) queryParams.append('overdue', filters.overdue);
            if (filters.page) queryParams.append('page', filters.page);
            if (filters.limit) queryParams.append('limit', filters.limit);
            
            const response = await api.get(`${this.apiBase}?${queryParams.toString()}`);
            
            console.log(`✅ Obtenidos ${response.loans?.length || 0} préstamos`);
            return response;
            
        } catch (error) {
            console.error('❌ Error obteniendo préstamos:', error);
            throw new Error(`Error al obtener préstamos: ${error.message}`);
        }
    }
    
    /**
     * Obtener un préstamo específico
     */
    async getLoanById(loanId) {
        try {
            console.log('🔍 Obteniendo préstamo:', loanId);
            
            const response = await api.get(`${this.apiBase}/${loanId}`);
            
            console.log('✅ Préstamo obtenido con detalles completos');
            return response.loan;
            
        } catch (error) {
            console.error('❌ Error obteniendo préstamo:', error);
            throw new Error(`Error al obtener préstamo: ${error.message}`);
        }
    }
    
    /**
     * Crear solicitud de préstamo
     */
    async createLoanRequest(loanData) {
        try {
            console.log('📝 Creando solicitud de préstamo:', loanData);
            
            const response = await api.post(this.apiBase, loanData);
            
            console.log('✅ Solicitud de préstamo creada');
            return response.loan;
            
        } catch (error) {
            console.error('❌ Error creando solicitud:', error);
            throw new Error(`Error al crear solicitud: ${error.message}`);
        }
    }
    
    /**
     * Aprobar préstamo (solo rector para >$1,000,000)
     */
    async approveLoan(loanId, approvalData = {}) {
        try {
            console.log('✅ Aprobando préstamo:', loanId);
            
            const response = await api.patch(`${this.apiBase}/${loanId}/approve`, approvalData);
            
            console.log('✅ Préstamo aprobado exitosamente');
            return response.loan;
            
        } catch (error) {
            console.error('❌ Error aprobando préstamo:', error);
            throw new Error(`Error al aprobar préstamo: ${error.message}`);
        }
    }
    
    /**
     * Rechazar préstamo
     */
    async rejectLoan(loanId, rejectionReason) {
        try {
            console.log('❌ Rechazando préstamo:', loanId);
            
            const response = await api.patch(`${this.apiBase}/${loanId}/reject`, {
                reason: rejectionReason
            });
            
            console.log('✅ Préstamo rechazado');
            return response.loan;
            
        } catch (error) {
            console.error('❌ Error rechazando préstamo:', error);
            throw new Error(`Error al rechazar préstamo: ${error.message}`);
        }
    }
    
    /**
     * Desembolsar préstamo aprobado
     */
    async disburseLoan(loanId) {
        try {
            console.log('💰 Desembolsando préstamo:', loanId);
            
            const response = await api.patch(`${this.apiBase}/${loanId}/disburse`);
            
            console.log('✅ Préstamo desembolsado exitosamente');
            return response.loan;
            
        } catch (error) {
            console.error('❌ Error desembolsando préstamo:', error);
            throw new Error(`Error al desembolsar préstamo: ${error.message}`);
        }
    }
    
    /**
     * Registrar pago de préstamo
     */
    async recordLoanPayment(loanId, paymentData) {
        try {
            console.log('💳 Registrando pago de préstamo:', loanId);
            
            const response = await api.post(`${this.apiBase}/${loanId}/payments`, paymentData);
            
            console.log('✅ Pago de préstamo registrado');
            return response.payment;
            
        } catch (error) {
            console.error('❌ Error registrando pago:', error);
            throw new Error(`Error al registrar pago: ${error.message}`);
        }
    }
    
    /**
     * Cancelar préstamo pendiente
     */
    async cancelLoan(loanId, cancelReason) {
        try {
            console.log('🚫 Cancelando préstamo:', loanId);
            
            const response = await api.patch(`${this.apiBase}/${loanId}/cancel`, {
                reason: cancelReason
            });
            
            console.log('✅ Préstamo cancelado');
            return response.loan;
            
        } catch (error) {
            console.error('❌ Error cancelando préstamo:', error);
            throw new Error(`Error al cancelar préstamo: ${error.message}`);
        }
    }
    
    // ==========================================
    // CONSULTAS Y REPORTES
    // ==========================================
    
    /**
     * Obtener préstamos pendientes de aprobación
     */
    async getPendingApprovals() {
        try {
            console.log('⏳ Obteniendo préstamos pendientes de aprobación');
            
            const response = await api.get(`${this.apiBase}/pending-approvals`);
            
            console.log(`✅ Encontrados ${response.loans?.length || 0} préstamos pendientes`);
            return response.loans || [];
            
        } catch (error) {
            console.error('❌ Error obteniendo pendientes:', error);
            throw new Error(`Error al obtener pendientes: ${error.message}`);
        }
    }
    
    /**
     * Obtener préstamos activos (disbursed/repaying)
     */
    async getActiveLoans(fundId = null) {
        try {
            console.log('🔄 Obteniendo préstamos activos');
            
            const filters = {
                status: 'DISBURSED,REPAYING',
                ...(fundId && { fundId })
            };
            
            const response = await this.getAllLoans(filters);
            return response.loans || [];
            
        } catch (error) {
            console.error('❌ Error obteniendo préstamos activos:', error);
            throw new Error(`Error al obtener préstamos activos: ${error.message}`);
        }
    }
    
    /**
     * Obtener préstamos vencidos
     */
    async getOverdueLoans() {
        try {
            console.log('⚠️ Obteniendo préstamos vencidos');
            
            const response = await api.get(`${this.apiBase}/overdue`);
            
            console.log(`✅ Encontrados ${response.loans?.length || 0} préstamos vencidos`);
            return response.loans || [];
            
        } catch (error) {
            console.error('❌ Error obteniendo vencidos:', error);
            throw new Error(`Error al obtener préstamos vencidos: ${error.message}`);
        }
    }
    
    /**
     * Obtener historial de pagos de un préstamo
     */
    async getLoanPaymentHistory(loanId) {
        try {
            console.log('📋 Obteniendo historial de pagos:', loanId);
            
            const response = await api.get(`${this.apiBase}/${loanId}/payments`);
            
            console.log(`✅ Obtenidos ${response.payments?.length || 0} pagos`);
            return response.payments || [];
            
        } catch (error) {
            console.error('❌ Error obteniendo historial:', error);
            throw new Error(`Error al obtener historial de pagos: ${error.message}`);
        }
    }
    
    /**
     * Obtener estadísticas de préstamos
     */
    async getLoanStatistics(fundId = null) {
        try {
            console.log('📊 Obteniendo estadísticas de préstamos');
            
            const queryParams = new URLSearchParams();
            if (fundId) queryParams.append('fundId', fundId);
            
            const response = await api.get(`${this.apiBase}/statistics?${queryParams.toString()}`);
            
            console.log('✅ Estadísticas obtenidas');
            return response.statistics;
            
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }
    
    // ==========================================
    // VALIDACIONES
    // ==========================================
    
    /**
     * Validar solicitud de préstamo
     */
    validateLoanRequest(loanData) {
        const errors = [];
        
        if (!loanData.lenderFundId) {
            errors.push('Debe seleccionar el fondo prestamista');
        }
        
        if (!loanData.borrowerFundId) {
            errors.push('Debe seleccionar el fondo que recibe el préstamo');
        }
        
        if (loanData.lenderFundId === loanData.borrowerFundId) {
            errors.push('El fondo prestamista y receptor no pueden ser el mismo');
        }
        
        if (!loanData.amount || loanData.amount <= 0) {
            errors.push('El monto debe ser mayor a cero');
        }
        
        if (loanData.amount > 50000000) { // $50 millones
            errors.push('El monto no puede exceder $50,000,000');
        }
        
        if (!loanData.reason || loanData.reason.trim().length < 10) {
            errors.push('Debe proporcionar una razón de al menos 10 caracteres');
        }
        
        if (!loanData.dueDate) {
            errors.push('Debe especificar una fecha de vencimiento');
        } else {
            const dueDate = new Date(loanData.dueDate);
            const minDate = new Date();
            minDate.setDate(minDate.getDate() + 7); // Mínimo 7 días
            
            if (dueDate < minDate) {
                errors.push('La fecha de vencimiento debe ser al menos 7 días en el futuro');
            }
            
            const maxDate = new Date();
            maxDate.setFullYear(maxDate.getFullYear() + 2); // Máximo 2 años
            
            if (dueDate > maxDate) {
                errors.push('La fecha de vencimiento no puede ser mayor a 2 años');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Verificar si un préstamo requiere aprobación del rector
     */
    requiresRectorApproval(amount) {
        return amount >= 1000000; // $1,000,000
    }
    
    /**
     * Calcular límite máximo de préstamo para un fondo
     */
    calculateMaxLoanAmount(fund) {
        // Un fondo puede prestar máximo el 30% de su saldo actual
        const maxPercentage = 0.30;
        return Math.floor(fund.currentBalance * maxPercentage);
    }
    
    /**
     * Verificar si un fondo puede otorgar un préstamo
     */
    canFundLend(fund, amount) {
        const maxLoanAmount = this.calculateMaxLoanAmount(fund);
        
        return {
            canLend: fund.currentBalance >= amount && amount <= maxLoanAmount,
            availableBalance: fund.currentBalance,
            maxLoanAmount,
            shortfall: amount > fund.currentBalance ? amount - fund.currentBalance : 0,
            exceedsLimit: amount > maxLoanAmount,
            limitExcess: amount > maxLoanAmount ? amount - maxLoanAmount : 0
        };
    }
    
    // ==========================================
    // FUNCIONES DE UTILIDAD
    // ==========================================
    
    /**
     * Formatear estado del préstamo
     */
    formatLoanStatus(status) {
        const statusMap = {
            'PENDING': { text: 'Pendiente', class: 'warning', icon: 'clock' },
            'APPROVED': { text: 'Aprobado', class: 'info', icon: 'check-circle' },
            'DISBURSED': { text: 'Desembolsado', class: 'primary', icon: 'arrow-right-circle' },
            'REPAYING': { text: 'En Pago', class: 'success', icon: 'credit-card' },
            'FULLY_REPAID': { text: 'Pagado', class: 'success', icon: 'check-square' },
            'OVERDUE': { text: 'Vencido', class: 'danger', icon: 'exclamation-triangle' },
            'CANCELLED': { text: 'Cancelado', class: 'secondary', icon: 'x-circle' }
        };
        
        return statusMap[status] || { text: status, class: 'secondary', icon: 'question-circle' };
    }
    
    /**
     * Calcular días hasta vencimiento
     */
    calculateDaysUntilDue(dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
            days: diffDays,
            isOverdue: diffDays < 0,
            isNearDue: diffDays >= 0 && diffDays <= 7
        };
    }
    
    /**
     * Calcular progreso de pago
     */
    calculatePaymentProgress(loan) {
        if (!loan.amount || loan.amount === 0) return 0;
        
        const paidAmount = loan.totalRepaid || 0;
        const percentage = Math.round((paidAmount / loan.amount) * 100);
        
        return {
            percentage: Math.min(percentage, 100),
            paidAmount,
            pendingAmount: loan.pendingAmount || (loan.amount - paidAmount),
            isFullyPaid: loan.isFullyRepaid || false
        };
    }
    
    /**
     * Generar resumen de préstamo
     */
    generateLoanSummary(loan) {
        const status = this.formatLoanStatus(loan.status);
        const dueInfo = this.calculateDaysUntilDue(loan.dueDate);
        const progress = this.calculatePaymentProgress(loan);
        
        return {
            ...loan,
            statusFormatted: status,
            dueInfo,
            progress,
            requiresApproval: this.requiresRectorApproval(loan.amount),
            formattedAmount: this.formatCurrency(loan.amount),
            formattedPendingAmount: this.formatCurrency(loan.pendingAmount || 0),
            formattedTotalRepaid: this.formatCurrency(loan.totalRepaid || 0)
        };
    }
    
    /**
     * Formatear moneda
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    }
    
    /**
     * Obtener color de estado
     */
    getStatusColor(status) {
        const colors = {
            'PENDING': '#ffc107',
            'APPROVED': '#17a2b8',
            'DISBURSED': '#007bff',
            'REPAYING': '#28a745',
            'FULLY_REPAID': '#28a745',
            'OVERDUE': '#dc3545',
            'CANCELLED': '#6c757d'
        };
        
        return colors[status] || '#6c757d';
    }
    
    /**
     * Exportar préstamos a CSV
     */
    exportLoansToCSV(loans, filename = null) {
        try {
            console.log('📥 Exportando préstamos a CSV');
            
            if (!loans || loans.length === 0) {
                throw new Error('No hay préstamos para exportar');
            }
            
            let csvContent = "data:text/csv;charset=utf-8,";
            
            // Headers
            const headers = [
                'ID',
                'Fondo Prestamista',
                'Fondo Receptor',
                'Monto',
                'Estado',
                'Fecha Solicitud',
                'Fecha Vencimiento',
                'Total Pagado',
                'Monto Pendiente',
                'Solicitado Por',
                'Aprobado Por',
                'Razón'
            ];
            csvContent += headers.join(',') + '\n';
            
            // Data
            loans.forEach(loan => {
                const row = [
                    loan.id,
                    `"${loan.lenderFund?.name || 'N/A'}"`,
                    `"${loan.borrowerFund?.name || 'N/A'}"`,
                    loan.amount || 0,
                    loan.status,
                    new Date(loan.requestDate).toLocaleDateString('es-CO'),
                    new Date(loan.dueDate).toLocaleDateString('es-CO'),
                    loan.totalRepaid || 0,
                    loan.pendingAmount || 0,
                    `"${loan.requester?.name || 'N/A'}"`,
                    `"${loan.approver?.name || 'N/A'}"`,
                    `"${(loan.reason || '').replace(/"/g, '""')}"`
                ];
                csvContent += row.join(',') + '\n';
            });
            
            // Download
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            
            const defaultFilename = `prestamos_fondos_${new Date().toISOString().split('T')[0]}.csv`;
            link.setAttribute("download", filename || defaultFilename);
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('✅ Exportación completada');
            
        } catch (error) {
            console.error('❌ Error exportando préstamos:', error);
            throw new Error(`Error al exportar préstamos: ${error.message}`);
        }
    }
    
    /**
     * Generar reporte de préstamos
     */
    generateLoanReport(loans, filters = {}) {
        try {
            const report = {
                summary: {
                    totalLoans: loans.length,
                    totalAmount: loans.reduce((sum, loan) => sum + (loan.amount || 0), 0),
                    totalRepaid: loans.reduce((sum, loan) => sum + (loan.totalRepaid || 0), 0),
                    totalPending: loans.reduce((sum, loan) => sum + (loan.pendingAmount || 0), 0)
                },
                byStatus: {},
                byFund: {},
                overdue: loans.filter(loan => {
                    const dueInfo = this.calculateDaysUntilDue(loan.dueDate);
                    return dueInfo.isOverdue && ['DISBURSED', 'REPAYING'].includes(loan.status);
                }),
                nearDue: loans.filter(loan => {
                    const dueInfo = this.calculateDaysUntilDue(loan.dueDate);
                    return dueInfo.isNearDue && ['DISBURSED', 'REPAYING'].includes(loan.status);
                })
            };
            
            // Agrupar por estado
            loans.forEach(loan => {
                const status = loan.status;
                if (!report.byStatus[status]) {
                    report.byStatus[status] = {
                        count: 0,
                        totalAmount: 0,
                        loans: []
                    };
                }
                
                report.byStatus[status].count++;
                report.byStatus[status].totalAmount += loan.amount || 0;
                report.byStatus[status].loans.push(loan);
            });
            
            // Agrupar por fondo
            loans.forEach(loan => {
                const lenderFund = loan.lenderFund?.name || 'Desconocido';
                const borrowerFund = loan.borrowerFund?.name || 'Desconocido';
                
                // Fondo prestamista
                if (!report.byFund[lenderFund]) {
                    report.byFund[lenderFund] = { asLender: 0, asBorrower: 0, lentAmount: 0, borrowedAmount: 0 };
                }
                report.byFund[lenderFund].asLender++;
                report.byFund[lenderFund].lentAmount += loan.amount || 0;
                
                // Fondo receptor
                if (!report.byFund[borrowerFund]) {
                    report.byFund[borrowerFund] = { asLender: 0, asBorrower: 0, lentAmount: 0, borrowedAmount: 0 };
                }
                report.byFund[borrowerFund].asBorrower++;
                report.byFund[borrowerFund].borrowedAmount += loan.amount || 0;
            });
            
            return report;
            
        } catch (error) {
            console.error('❌ Error generando reporte:', error);
            throw new Error(`Error al generar reporte: ${error.message}`);
        }
    }
}

// Crear instancia global
const fundLoanService = new FundLoanService();

// Exponer para uso global
window.fundLoanService = fundLoanService;