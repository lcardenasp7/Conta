/**
 * SERVICIO DE GESTIÓN DE FONDOS - FRONTEND
 * Maneja la lógica de negocio para la trazabilidad completa de fondos
 * Autor: Sistema de Trazabilidad VSP
 * Fecha: 2024-01-15
 */

class FundManagementService {
    
    constructor() {
        this.apiBase = '/api/funds';
    }
    
    // ==========================================
    // GESTIÓN BÁSICA DE FONDOS
    // ==========================================
    
    /**
     * Obtener todos los fondos con estadísticas
     */
    async getAllFunds(filters = {}) {
        try {
            console.log('📊 Obteniendo fondos con filtros:', filters);
            
            const queryParams = new URLSearchParams();
            if (filters.type) queryParams.append('type', filters.type);
            if (filters.academicYear) queryParams.append('academicYear', filters.academicYear);
            if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive);
            
            const response = await api.get(`${this.apiBase}?${queryParams.toString()}`);
            
            console.log(`✅ Obtenidos ${response.funds?.length || 0} fondos`);
            return response.funds || [];
            
        } catch (error) {
            console.error('❌ Error obteniendo fondos:', error);
            throw new Error(`Error al obtener fondos: ${error.message}`);
        }
    }
    
    /**
     * Obtener un fondo específico con detalles completos
     */
    async getFundById(fundId) {
        try {
            console.log('🔍 Obteniendo fondo:', fundId);
            
            const response = await api.get(`${this.apiBase}/${fundId}`);
            
            console.log('✅ Fondo obtenido con detalles completos');
            return response.fund;
            
        } catch (error) {
            console.error('❌ Error obteniendo fondo:', error);
            throw new Error(`Error al obtener fondo: ${error.message}`);
        }
    }
    
    /**
     * Crear un nuevo fondo
     */
    async createFund(fundData) {
        try {
            console.log('➕ Creando nuevo fondo:', fundData);
            
            const response = await api.post(this.apiBase, fundData);
            
            console.log('✅ Fondo creado exitosamente');
            return response.fund;
            
        } catch (error) {
            console.error('❌ Error creando fondo:', error);
            throw new Error(`Error al crear fondo: ${error.message}`);
        }
    }
    
    /**
     * Actualizar un fondo existente
     */
    async updateFund(fundId, fundData) {
        try {
            console.log('📝 Actualizando fondo:', fundId);
            
            const response = await api.put(`${this.apiBase}/${fundId}`, fundData);
            
            console.log('✅ Fondo actualizado exitosamente');
            return response.fund;
            
        } catch (error) {
            console.error('❌ Error actualizando fondo:', error);
            throw new Error(`Error al actualizar fondo: ${error.message}`);
        }
    }
    
    // ==========================================
    // VALIDACIONES DE FONDOS
    // ==========================================
    
    /**
     * Validar si un fondo tiene saldo suficiente para una transacción
     */
    async validateSufficientBalance(fundId, amount, excludeCommittedLoans = false) {
        try {
            console.log(`💰 Validando saldo suficiente - Fondo: ${fundId}, Monto: ${amount}`);
            
            const response = await api.post(`${this.apiBase}/${fundId}/validate-balance`, {
                amount,
                excludeCommittedLoans
            });
            
            console.log(`${response.isValid ? '✅' : '❌'} Validación de saldo:`, response);
            return response;
            
        } catch (error) {
            console.error('❌ Error validando saldo:', error);
            throw new Error(`Error al validar saldo: ${error.message}`);
        }
    }
    
    /**
     * Validar transferencia entre fondos
     */
    async validateFundTransfer(sourceFundId, targetFundId, amount) {
        try {
            console.log('🔄 Validando transferencia entre fondos');
            
            const response = await api.post(`${this.apiBase}/validate-transfer`, {
                sourceFundId,
                targetFundId,
                amount
            });
            
            console.log('✅ Transferencia validada:', response);
            return response;
            
        } catch (error) {
            console.error('❌ Error validando transferencia:', error);
            throw new Error(`Error al validar transferencia: ${error.message}`);
        }
    }
    
    // ==========================================
    // TRANSACCIONES DE FONDOS
    // ==========================================
    
    /**
     * Registrar ingreso a un fondo
     */
    async recordIncome(fundId, transactionData) {
        try {
            console.log('💰 Registrando ingreso al fondo:', fundId);
            
            const response = await api.post(`${this.apiBase}/${fundId}/income`, transactionData);
            
            console.log('✅ Ingreso registrado exitosamente');
            return response.transaction;
            
        } catch (error) {
            console.error('❌ Error registrando ingreso:', error);
            throw new Error(`Error al registrar ingreso: ${error.message}`);
        }
    }
    
    /**
     * Registrar gasto de un fondo
     */
    async recordExpense(fundId, transactionData) {
        try {
            console.log('💸 Registrando gasto del fondo:', fundId);
            
            const response = await api.post(`${this.apiBase}/${fundId}/expense`, transactionData);
            
            console.log('✅ Gasto registrado exitosamente');
            return response.transaction;
            
        } catch (error) {
            console.error('❌ Error registrando gasto:', error);
            throw new Error(`Error al registrar gasto: ${error.message}`);
        }
    }
    
    /**
     * Transferir entre fondos
     */
    async transferBetweenFunds(transferData) {
        try {
            console.log('🔄 Iniciando transferencia entre fondos');
            
            const response = await api.post(`${this.apiBase}/transfer`, transferData);
            
            console.log('✅ Transferencia completada exitosamente');
            return response;
            
        } catch (error) {
            console.error('❌ Error en transferencia:', error);
            throw new Error(`Error al transferir fondos: ${error.message}`);
        }
    }
    
    /**
     * Obtener historial de transacciones de un fondo
     */
    async getFundTransactions(fundId, filters = {}) {
        try {
            console.log('📋 Obteniendo transacciones del fondo:', fundId);
            
            const queryParams = new URLSearchParams();
            if (filters.type) queryParams.append('type', filters.type);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            if (filters.page) queryParams.append('page', filters.page);
            if (filters.limit) queryParams.append('limit', filters.limit);
            
            const response = await api.get(`${this.apiBase}/${fundId}/transactions?${queryParams.toString()}`);
            
            console.log(`✅ Obtenidas ${response.transactions?.length || 0} transacciones`);
            return response;
            
        } catch (error) {
            console.error('❌ Error obteniendo transacciones:', error);
            throw new Error(`Error al obtener transacciones: ${error.message}`);
        }
    }
    
    // ==========================================
    // SISTEMA DE ALERTAS
    // ==========================================
    
    /**
     * Obtener alertas activas
     */
    async getActiveAlerts(filters = {}) {
        try {
            console.log('🔔 Obteniendo alertas activas');
            
            const queryParams = new URLSearchParams();
            if (filters.fundId) queryParams.append('fundId', filters.fundId);
            if (filters.level) queryParams.append('level', filters.level);
            if (filters.unreadOnly) queryParams.append('unreadOnly', filters.unreadOnly);
            
            const response = await api.get(`${this.apiBase}/alerts?${queryParams.toString()}`);
            
            console.log(`✅ Obtenidas ${response.alerts?.length || 0} alertas`);
            return response.alerts || [];
            
        } catch (error) {
            console.error('❌ Error obteniendo alertas:', error);
            throw new Error(`Error al obtener alertas: ${error.message}`);
        }
    }
    
    /**
     * Marcar alerta como leída
     */
    async markAlertAsRead(alertId) {
        try {
            console.log('✅ Marcando alerta como leída:', alertId);
            
            const response = await api.patch(`${this.apiBase}/alerts/${alertId}/read`);
            
            console.log('✅ Alerta marcada como leída');
            return response.alert;
            
        } catch (error) {
            console.error('❌ Error marcando alerta:', error);
            throw new Error(`Error al marcar alerta: ${error.message}`);
        }
    }
    
    /**
     * Desactivar alerta
     */
    async deactivateAlert(alertId) {
        try {
            console.log('🔕 Desactivando alerta:', alertId);
            
            const response = await api.patch(`${this.apiBase}/alerts/${alertId}/deactivate`);
            
            console.log('✅ Alerta desactivada');
            return response.alert;
            
        } catch (error) {
            console.error('❌ Error desactivando alerta:', error);
            throw new Error(`Error al desactivar alerta: ${error.message}`);
        }
    }
    
    // ==========================================
    // REPORTES Y ESTADÍSTICAS
    // ==========================================
    
    /**
     * Obtener resumen financiero de fondos
     */
    async getFinancialSummary(filters = {}) {
        try {
            console.log('📊 Obteniendo resumen financiero');
            
            const queryParams = new URLSearchParams();
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            if (filters.fundType) queryParams.append('fundType', filters.fundType);
            
            const response = await api.get(`${this.apiBase}/summary?${queryParams.toString()}`);
            
            console.log('✅ Resumen financiero obtenido');
            return response;
            
        } catch (error) {
            console.error('❌ Error obteniendo resumen:', error);
            throw new Error(`Error al obtener resumen: ${error.message}`);
        }
    }
    
    /**
     * Obtener tendencias mensuales
     */
    async getMonthlyTrends(fundId, months = 12) {
        try {
            console.log('📈 Obteniendo tendencias mensuales');
            
            const response = await api.get(`${this.apiBase}/${fundId}/trends?months=${months}`);
            
            console.log('✅ Tendencias obtenidas');
            return response.trends;
            
        } catch (error) {
            console.error('❌ Error obteniendo tendencias:', error);
            throw new Error(`Error al obtener tendencias: ${error.message}`);
        }
    }
    
    /**
     * Obtener proyecciones de fondos
     */
    async getFundProjections(fundId, projectionMonths = 6) {
        try {
            console.log('🔮 Obteniendo proyecciones del fondo');
            
            const response = await api.get(`${this.apiBase}/${fundId}/projections?months=${projectionMonths}`);
            
            console.log('✅ Proyecciones obtenidas');
            return response.projections;
            
        } catch (error) {
            console.error('❌ Error obteniendo proyecciones:', error);
            throw new Error(`Error al obtener proyecciones: ${error.message}`);
        }
    }
    
    // ==========================================
    // FUNCIONES DE UTILIDAD
    // ==========================================
    
    /**
     * Calcular porcentaje de uso de un fondo
     */
    calculateUsagePercentage(fund) {
        if (!fund.totalIncome || fund.totalIncome <= 0) return 0;
        return Math.round((fund.totalExpenses / fund.totalIncome) * 100 * 100) / 100;
    }
    
    /**
     * Obtener nivel de alerta actual
     */
    getCurrentAlertLevel(fund) {
        const usage = this.calculateUsagePercentage(fund);
        
        if (usage >= (fund.alertLevel3 || 95)) return 3;
        if (usage >= (fund.alertLevel2 || 85)) return 2;
        if (usage >= (fund.alertLevel1 || 70)) return 1;
        return 0;
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
     * Obtener color de alerta según el nivel
     */
    getAlertColor(level) {
        switch (level) {
            case 3: return '#dc3545'; // Rojo - Crítico
            case 2: return '#fd7e14'; // Naranja - Alto
            case 1: return '#ffc107'; // Amarillo - Advertencia
            default: return '#28a745'; // Verde - Normal
        }
    }
    
    /**
     * Obtener texto de alerta según el nivel
     */
    getAlertText(level) {
        switch (level) {
            case 3: return 'Crítico';
            case 2: return 'Alto';
            case 1: return 'Advertencia';
            default: return 'Normal';
        }
    }
    
    /**
     * Validar datos de fondo
     */
    validateFundData(fundData) {
        const errors = [];
        
        if (!fundData.name || fundData.name.trim().length < 3) {
            errors.push('El nombre del fondo debe tener al menos 3 caracteres');
        }
        
        if (!fundData.code || fundData.code.trim().length < 2) {
            errors.push('El código del fondo debe tener al menos 2 caracteres');
        }
        
        if (!fundData.type) {
            errors.push('Debe seleccionar un tipo de fondo');
        }
        
        if (fundData.alertLevel1 && (fundData.alertLevel1 < 0 || fundData.alertLevel1 > 100)) {
            errors.push('El nivel de alerta 1 debe estar entre 0 y 100');
        }
        
        if (fundData.alertLevel2 && (fundData.alertLevel2 < 0 || fundData.alertLevel2 > 100)) {
            errors.push('El nivel de alerta 2 debe estar entre 0 y 100');
        }
        
        if (fundData.alertLevel3 && (fundData.alertLevel3 < 0 || fundData.alertLevel3 > 100)) {
            errors.push('El nivel de alerta 3 debe estar entre 0 y 100');
        }
        
        if (fundData.alertLevel1 && fundData.alertLevel2 && fundData.alertLevel1 > fundData.alertLevel2) {
            errors.push('El nivel de alerta 1 debe ser menor al nivel 2');
        }
        
        if (fundData.alertLevel2 && fundData.alertLevel3 && fundData.alertLevel2 > fundData.alertLevel3) {
            errors.push('El nivel de alerta 2 debe ser menor al nivel 3');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Exportar datos de fondo a CSV
     */
    exportFundDataToCSV(fund, transactions) {
        try {
            console.log('📥 Exportando datos del fondo a CSV');
            
            let csvContent = "data:text/csv;charset=utf-8,";
            
            // Headers
            csvContent += "Fecha,Tipo,Monto,Descripción,Referencia,Usuario\n";
            
            // Data
            transactions.forEach(tx => {
                const row = [
                    new Date(tx.createdAt).toLocaleDateString('es-CO'),
                    tx.type,
                    tx.amount,
                    `"${tx.description.replace(/"/g, '""')}"`,
                    tx.reference || '',
                    tx.user?.name || ''
                ].join(',');
                csvContent += row + '\n';
            });
            
            // Download
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${fund.code}_transacciones_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('✅ Exportación completada');
            
        } catch (error) {
            console.error('❌ Error exportando datos:', error);
            throw new Error(`Error al exportar datos: ${error.message}`);
        }
    }
}

// Crear instancia global
const fundManagementService = new FundManagementService();

// Exponer para uso global
window.fundManagementService = fundManagementService;