// API Configuration
const API_BASE_URL = '/api';

// CORREGIDO: Eliminados datos simulados - usando solo datos reales del backend

// API Helper Class
class API {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    // Set authorization token
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // Remove authorization token
    removeToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    // Get headers with authorization
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            showLoading();
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                // Handle validation errors specifically
                if (response.status === 400 && data.errors) {
                    const errorMessages = data.errors.map(err => err.msg).join(', ');
                    throw new Error(`Errores de validación: ${errorMessages}`);
                }
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        } finally {
            hideLoading();
        }
    }

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // PATCH request
    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    // Authentication endpoints
    async login(email, password) {
        return this.post('/auth/login', { email, password });
    }

    async logout() {
        try {
            await this.post('/auth/logout', {});
        } catch (error) {
            console.log('Logout endpoint not available, proceeding with local cleanup');
        } finally {
            this.removeToken();
            // Redirect to login or reload
            window.location.reload();
        }
    }

    // Dashboard endpoints
    async getDashboardStats() {
        return this.get('/dashboard/stats');
    }

    async getDashboardActivities() {
        return this.get('/dashboard/recent-activities');
    }

    async getDashboardChartData(chartType) {
        return this.get(`/dashboard/charts/${chartType}`);
    }

    // Institution endpoints
    async getInstitution() {
        return this.get('/institution');
    }

    async updateInstitution(data) {
        return this.put('/institution', data);
    }

    async uploadLogo(formData) {
        const token = localStorage.getItem('token');
        return fetch('/api/institution/logo', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        });
    }

    async deleteLogo() {
        return this.delete('/institution/logo');
    }

    async getMonthlyIncomeChart(year = new Date().getFullYear()) {
        return this.get(`/dashboard/charts/monthly-income?year=${year}`);
    }

    async getStudentsByGradeChart() {
        return this.get('/dashboard/charts/students-by-grade');
    }

    // Students endpoints
    async getStudents(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/students${queryString ? '?' + queryString : ''}`);
    }

    async getStudent(id) {
        return this.get(`/students/${id}`);
    }

    async searchStudents(query) {
        const response = await this.get(`/students?search=${encodeURIComponent(query)}&limit=20`);
        return response.students || response || [];
    }

    async getStudentInvoices(studentId) {
        return this.get(`/invoices?studentId=${studentId}`);
    }

    async getStudentEventAssignments(studentId) {
        return this.get(`/events/assignments?studentId=${studentId}`);
    }

    async createStudent(data) {
        return this.post('/students', data);
    }

    async updateStudent(id, data) {
        return this.put(`/students/${id}`, data);
    }

    async deleteStudent(id) {
        return this.delete(`/students/${id}`);
    }

    // Grades endpoints
    async getGrades() {
        return this.get('/grades');
    }

    async getGrade(id) {
        return this.get(`/grades/${id}`);
    }

    async createGrade(data) {
        return this.post('/grades', data);
    }

    async updateGrade(id, data) {
        return this.put(`/grades/${id}`, data);
    }

    async deleteGrade(id) {
        return this.delete(`/grades/${id}`);
    }

    async getGradeStats(id) {
        return this.get(`/grades/${id}/stats`);
    }

    // Groups endpoints
    async getGroups(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/groups${queryString ? '?' + queryString : ''}`);
    }

    async getGroup(id) {
        return this.get(`/groups/${id}`);
    }

    async createGroup(data) {
        return this.post('/groups', data);
    }

    async updateGroup(id, data) {
        return this.put(`/groups/${id}`, data);
    }

    async deleteGroup(id) {
        return this.delete(`/groups/${id}`);
    }

    // Invoices endpoints
    async getInvoices(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/invoices${queryString ? '?' + queryString : ''}`);
    }

    async getInvoice(id) {
        return this.get(`/invoices/${id}`);
    }

    async createInvoice(data) {
        return this.post('/invoices', data);
    }

    async updateInvoice(id, data) {
        return this.put(`/invoices/${id}`, data);
    }

    async deleteInvoice(id) {
        return this.delete(`/invoices/${id}`);
    }

    async getInvoiceStats() {
        return this.get('/invoices/stats/summary');
    }

    async createBulkInvoices(data) {
        return this.post('/invoices/bulk', data);
    }

    async generateMonthlyInvoices(data) {
        return this.post('/invoices/generate/monthly', data);
    }

    async generateEventInvoices(eventId) {
        return this.post(`/invoices/generate/event/${eventId}`);
    }

    async getInvoiceTemplates() {
        return this.get('/invoices/templates');
    }

    async createExternalInvoice(data) {
        return this.post('/invoices/external', data);
    }

    async createStudentInvoice(data) {
        return this.post('/invoices/student', data);
    }

    // Debts endpoints
    async getDebts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/invoices/debts${queryString ? '?' + queryString : ''}`);
    }

    async getDebtsStats() {
        return this.get('/invoices/debts/stats');
    }

    // Payments endpoints
    async getPayments(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/payments${queryString ? '?' + queryString : ''}`);
    }

    async getPayment(id) {
        return this.get(`/payments/${id}`);
    }

    async createPayment(data) {
        return this.post('/payments', data);
    }

    async updatePayment(id, data) {
        return this.put(`/payments/${id}`, data);
    }

    async cancelPayment(id, reason) {
        return this.patch(`/payments/${id}/cancel`, { reason });
    }

    async getPaymentStats() {
        return this.get('/payments/stats/summary');
    }

    // ================================
    // GESTIÓN DE FONDOS - NUEVOS ENDPOINTS
    // ================================

    // Fondos básicos
    async getFunds(params = {}) {
        console.log('📋 Getting funds with params:', params);
        const queryString = new URLSearchParams(params).toString();
        const response = await this.get(`/funds${queryString ? '?' + queryString : ''}`);
        console.log(`✅ Retrieved ${response.funds?.length || 0} funds`);
        return response;
    }

    async getFund(id) {
        console.log('🔍 Getting fund:', id);
        const response = await this.get(`/funds/${id}`);
        console.log('✅ Fund retrieved with details');
        return response.fund;
    }

    async createFund(data) {
        console.log('📝 Creating fund:', data);
        const response = await this.post('/funds', data);
        console.log('✅ Fund created successfully');
        return response.fund;
    }

    async updateFund(id, data) {
        console.log('📝 Updating fund:', id, data);
        const response = await this.put(`/funds/${id}`, data);
        console.log('✅ Fund updated successfully');
        return response.fund;
    }

    // Obtener fondos activos con saldo
    async getActiveFunds() {
        console.log('🔍 Getting active funds with balance');
        const response = await this.getFunds({ 
            isActive: 'true', 
            withBalance: 'true' 
        });
        return response.funds || [];
    }

    // Operaciones de dinero en fondos
    async addMoneyToFund(fundId, data) {
        console.log('💰 Adding money to fund:', fundId, data);
        const response = await this.post(`/funds/${fundId}/transactions`, data);
        console.log('✅ Money added successfully');
        return response;
    }

    async withdrawMoneyFromFund(fundId, data) {
        console.log('💸 Withdrawing money from fund:', fundId, data);
        const response = await this.post(`/funds/${fundId}/transactions`, data);
        console.log('✅ Money withdrawn successfully');
        return response;
    }

    // Transacciones de fondos
    async getFundTransactions(fundId, params = {}) {
        console.log('📋 Getting fund transactions:', fundId);
        const queryString = new URLSearchParams(params).toString();
        const response = await this.get(`/funds/${fundId}/transactions${queryString ? '?' + queryString : ''}`);
        console.log(`✅ Retrieved ${response.transactions?.length || 0} transactions`);
        return response;
    }

    // Estadísticas de fondos
    async getFundStatistics(fundId, period = '30') {
        console.log('📊 Getting fund statistics:', fundId);
        const response = await this.get(`/funds/${fundId}?period=${period}`);
        console.log('✅ Fund statistics calculated');
        return response.statistics;
    }

    // Dashboard de fondos
    async getFundsDashboard() {
        console.log('📊 Getting funds dashboard summary');
        const response = await this.get('/funds');
        console.log('✅ Dashboard summary generated');
        return response.summary;
    }

    // ================================
    // PRÉSTAMOS ENTRE FONDOS
    // ================================

    // Préstamos básicos
    async getFundLoans(params = {}) {
        console.log('📋 Getting fund loans with params:', params);
        const queryString = new URLSearchParams(params).toString();
        // Usar la ruta correcta del backend limpio
        const response = await this.get(`/funds/loans/all${queryString ? '?' + queryString : ''}`);
        console.log(`✅ Retrieved ${response?.length || 0} loans`);
        return response;
    }

    async getFundLoan(id) {
        console.log('🔍 Getting fund loan:', id);
        const response = await this.get(`/funds/loans/${id}`);
        console.log('✅ Loan retrieved with details');
        return response.loan;
    }

    async createFundLoan(data) {
        console.log('📝 Creating fund loan:', data);
        const response = await this.post('/funds/loans', data);
        console.log('✅ Loan request created');
        return response;
    }

    // Gestión de aprobaciones
    async getPendingLoanApprovals() {
        console.log('⏳ Getting pending loan approvals');
        const response = await this.get('/funds/loans/pending-approvals');
        console.log(`✅ Found ${response.loans?.length || 0} pending loans`);
        return response.loans || [];
    }

    async approveFundLoan(loanId, data = {}) {
        console.log('✅ Approving fund loan:', loanId);
        const response = await this.patch(`/funds/loans/${loanId}/approve`, data);
        console.log('✅ Loan approved successfully');
        return response.loan;
    }

    async rejectFundLoan(loanId, reason) {
        console.log('❌ Rejecting fund loan:', loanId);
        const response = await this.patch(`/funds/loans/${loanId}/reject`, { reason });
        console.log('✅ Loan rejected');
        return response.loan;
    }

    // Gestión de pagos de préstamos
    async createLoanPayment(loanId, data) {
        console.log('💳 Creating loan payment:', loanId, data);
        const response = await this.post(`/funds/loans/${loanId}/payments`, data);
        console.log('✅ Loan payment recorded');
        return response;
    }

    async getLoanPaymentHistory(loanId) {
        console.log('📋 Getting loan payment history:', loanId);
        const response = await this.get(`/funds/loans/${loanId}/payments`);
        console.log(`✅ Retrieved ${response.payments?.length || 0} payments`);
        return response;
    }

    // Consultas especializadas de préstamos
    async getOverdueLoans() {
        console.log('⚠️ Getting overdue loans');
        const response = await this.get('/funds/loans/overdue/list');
        console.log(`✅ Found ${response.loans?.length || 0} overdue loans`);
        return response.loans || [];
    }

    async getLoanStatistics(fundId = null) {
        console.log('📊 Getting loan statistics');
        const queryParams = fundId ? `?fundId=${fundId}` : '';
        const response = await this.get(`/funds/loans/statistics/general${queryParams}`);
        console.log('✅ Loan statistics calculated');
        return response.statistics;
    }

    // Gestión administrativa de préstamos
    async cancelFundLoan(loanId, reason) {
        console.log('🚫 Cancelling fund loan:', loanId);
        const response = await this.patch(`/funds/loans/${loanId}/cancel`, { reason });
        console.log('✅ Loan cancelled');
        return response.loan;
    }

    async updateLoanObservations(loanId, observations) {
        console.log('📝 Updating loan observations:', loanId);
        const response = await this.patch(`/funds/loans/${loanId}/observations`, { observations });
        console.log('✅ Observations updated');
        return response.loan;
    }

    async extendLoanDueDate(loanId, newDueDate, reason) {
        console.log('📅 Extending loan due date:', loanId);
        const response = await this.patch(`/funds/loans/${loanId}/extend-due-date`, {
            newDueDate,
            reason
        });
        console.log('✅ Due date extended');
        return response.loan;
    }

    // Exportación de préstamos
    async exportLoansToCSV(params = {}) {
        console.log('📤 Exporting loans to CSV');
        const queryString = new URLSearchParams(params).toString();
        
        const response = await fetch(`${API_BASE_URL}/funds/loans/export/csv${queryString ? '?' + queryString : ''}`, {
            method: 'GET',
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error('Error al exportar préstamos');
        }

        // Descargar archivo
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prestamos_fondos_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('✅ CSV export completed');
    }

    // Sistema de alertas
    async getFundAlertsAttentionRequired() {
        console.log('🚨 Getting fund alerts requiring attention');
        const response = await this.get('/funds/alerts/all');
        console.log(`✅ Retrieved ${response?.length || 0} alerts`);
        return response;
    }

    // ================================
    // MÉTODOS DE UTILIDAD PARA FONDOS
    // ================================

    // Validar si un fondo puede prestar dinero
    async canFundLend(fundId, amount) {
        try {
            const fund = await this.getFund(fundId);
            const maxLoanAmount = Math.floor(fund.currentBalance * 0.30); // 30% máximo
            
            return {
                canLend: fund.currentBalance >= amount && amount <= maxLoanAmount && fund.isActive,
                availableBalance: fund.currentBalance,
                maxLoanAmount,
                shortfall: amount > fund.currentBalance ? amount - fund.currentBalance : 0,
                exceedsLimit: amount > maxLoanAmount,
                limitExcess: amount > maxLoanAmount ? amount - maxLoanAmount : 0
            };
        } catch (error) {
            console.error('Error checking fund lending capacity:', error);
            throw error;
        }
    }

    // Obtener fondos disponibles para préstamo
    async getFundsAvailableForLending(minimumAmount = 0) {
        const response = await this.getFunds({ 
            isActive: 'true', 
            withBalance: 'true' 
        });
        
        return (response.funds || []).filter(fund => {
            const maxLoanAmount = Math.floor(fund.currentBalance * 0.30);
            return maxLoanAmount >= minimumAmount;
        });
    }

    // Formatear moneda
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    }

    // Calcular nivel de alerta de un fondo
    calculateFundAlertLevel(fund) {
        const usagePercentage = fund.initialBalance > 0 
            ? Math.round(((fund.initialBalance - fund.currentBalance) / fund.initialBalance) * 100)
            : 0;

        if (usagePercentage >= 95) return { level: 'critical', percentage: usagePercentage };
        if (usagePercentage >= 85) return { level: 'warning', percentage: usagePercentage };
        if (usagePercentage >= 70) return { level: 'attention', percentage: usagePercentage };
        return { level: 'safe', percentage: usagePercentage };
    }

    // ================================
    // EVENTOS - ENDPOINTS COMPLETOS
    // ================================

    // Events basic CRUD
    async getEvents(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/events${queryString ? '?' + queryString : ''}`);
    }

    async getEvent(id) {
        return this.get(`/events/${id}`);
    }

    async createEvent(data) {
        return this.post('/events', data);
    }

    async updateEvent(id, data) {
        return this.put(`/events/${id}`, data);
    }

    async deleteEvent(id) {
        return this.delete(`/events/${id}`);
    }

    async getEventStats(id) {
        return this.get(`/events/${id}/stats`);
    }

    // Events Dashboard
    async getEventsDashboard() {
        return this.get('/events/dashboard/summary');
    }

    // CORREGIDO: Event Assignments - Solo datos reales del backend
    async getEventAssignments(eventId, params = {}) {
        console.log(`🔍 Loading assignments for event ${eventId}`);
        const queryString = new URLSearchParams(params).toString();
        const assignments = await this.get(`/events/${eventId}/assignments${queryString ? '?' + queryString : ''}`);
        
        console.log(`✅ Loaded ${assignments.length} assignments from backend`);
        return assignments;
    }

    async createEventAssignment(eventId, data) {
        return this.post(`/events/${eventId}/assignments`, data);
    }

    async createBulkEventAssignment(eventId, data) {
        return this.post(`/events/${eventId}/assignments/bulk`, data);
    }

    async createBulkEventAssignments(eventId, data) {
        return this.post(`/events/${eventId}/assignments/bulk`, data);
    }

    async updateEventAssignment(eventId, assignmentId, data) {
        return this.put(`/events/${eventId}/assignments/${assignmentId}`, data);
    }

    async deleteEventAssignment(eventId, assignmentId) {
        return this.delete(`/events/${eventId}/assignments/${assignmentId}`);
    }

    // CORREGIDO: Event Payments
    async getEventPayments(eventId) {
        console.log(`🔍 Getting payments for event ${eventId}`);
        const eventPayments = await this.get(`/events/${eventId}/payments`);
        console.log(`✅ Found ${eventPayments.length} payments for event`);
        return eventPayments;
    }

    async createEventPayment(eventId, data) {
        console.log(`💰 Creating payment for event ${eventId}:`, data);
        const result = await this.post(`/events/${eventId}/payments`, data);
        console.log(`✅ Payment created:`, result);
        return result;
    }

    // CORREGIDO: Payment History - Usar endpoint existente y filtrar
    async getPaymentHistory(eventId, studentId) {
        console.log(`📋 Fetching payment history for event ${eventId}, student ${studentId}`);
        const allPayments = await this.get(`/events/${eventId}/payments`);
        const history = allPayments.filter(payment => payment.studentId === studentId);
        console.log(`✅ Found ${history.length} payments in history for student ${studentId}`);
        return history;
    }

    // CORREGIDO: Add Partial Payment - usar endpoint correcto
    async addPartialPayment(eventId, studentId, data) {
        console.log(`💳 Adding partial payment for event ${eventId}, student ${studentId}:`, data);
        const result = await this.post(`/events/${eventId}/payments`, {
            studentId,
            ...data
        });
        console.log(`✅ Partial payment added:`, result);
        return result;
    }

    // CORREGIDO: Delete Payment - Solo backend real
    async deletePayment(paymentId) {
        console.log(`🗑️ Attempting to delete payment ${paymentId}`);
        const result = await this.delete(`/payments/${paymentId}`);
        console.log(`✅ Payment deleted successfully:`, result);
        return result;
    }

    // Get all event assignments (for reports)
    async getAllEventAssignments(filters = {}) {
        // Filter out null/undefined values
        const cleanFilters = {};
        Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                cleanFilters[key] = filters[key];
            }
        });
        
        const queryString = new URLSearchParams(cleanFilters).toString();
        return this.get(`/events/assignments/all${queryString ? '?' + queryString : ''}`);
    }

    // Get all event payments (for reports)
    async getAllEventPayments(filters = {}) {
        // Filter out null/undefined values
        const cleanFilters = {};
        Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                cleanFilters[key] = filters[key];
            }
        });
        
        const queryString = new URLSearchParams(cleanFilters).toString();
        return this.get(`/events/payments/all${queryString ? '?' + queryString : ''}`);
    }

    // Reports endpoints
    async getFinancialReport(startDate, endDate) {
        return this.get(`/reports/financial?startDate=${startDate}&endDate=${endDate}`);
    }

    // User endpoints
    async getUsers() {
        return this.get('/users');
    }

    async getUser(id) {
        return this.get(`/users/${id}`);
    }

    async createUser(data) {
        return this.post('/users', data);
    }

    async updateUser(id, data) {
        return this.put(`/users/${id}`, data);
    }

    async deleteUser(id) {
        return this.delete(`/users/${id}`);
    }

    // Utility methods
    async healthCheck() {
        return this.get('/health');
    }

    // File upload (if needed)
    async uploadFile(endpoint, file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {};
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        try {
            showLoading();
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('File upload error:', error);
            throw error;
        } finally {
            hideLoading();
        }
    }

    // ==========================================
    // ACCIONES DE PRÉSTAMOS
    // ==========================================
    
    // Aprobar préstamo
    async approveLoan(loanId, approvalNotes = '') {
        console.log(`✅ Aprobando préstamo: ${loanId}`);
        return this.request(`/funds/loans/${loanId}/approve`, {
            method: 'POST',
            body: JSON.stringify({ approvalNotes })
        });
    }
    
    // Rechazar préstamo
    async rejectLoan(loanId, rejectionReason) {
        console.log(`❌ Rechazando préstamo: ${loanId}`);
        return this.request(`/funds/loans/${loanId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ rejectionReason })
        });
    }
    
    // Desembolsar préstamo
    async disburseLoan(loanId, disbursementNotes = '') {
        console.log(`💰 Desembolsando préstamo: ${loanId}`);
        return this.request(`/funds/loans/${loanId}/disburse`, {
            method: 'POST',
            body: JSON.stringify({ disbursementNotes })
        });
    }
    
    // Crear préstamo
    async createLoan(loanData) {
        console.log('➕ Creando nuevo préstamo');
        return this.request('/funds/loans', {
            method: 'POST',
            body: JSON.stringify(loanData)
        });
    }
    
    // ==========================================
    // ACCIONES DE FONDOS
    // ==========================================
    
    // Crear fondo
    async createFund(fundData) {
        console.log('➕ Creando nuevo fondo');
        return this.request('/funds', {
            method: 'POST',
            body: JSON.stringify(fundData)
        });
    }
    
    // Actualizar fondo
    async updateFund(fundId, fundData) {
        console.log(`📝 Actualizando fondo: ${fundId}`);
        return this.request(`/funds/${fundId}`, {
            method: 'PUT',
            body: JSON.stringify(fundData)
        });
    }
    
    // Cambiar estado del fondo
    async toggleFundStatus(fundId, isActive) {
        console.log(`🔄 Cambiando estado del fondo: ${fundId}`);
        return this.request(`/funds/${fundId}`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive })
        });
    }


    // Validar transferencia entre fondos
    async validateTransfer(sourceFundId, targetFundId, amount) {
        console.log(`🔍 Validando transferencia: ${amount} de ${sourceFundId} a ${targetFundId}`);
        return this.request('/funds', {
            method: 'POST',
            body: JSON.stringify({ sourceFundId, targetFundId, amount })
        });
    }

    // Crear transacción de fondo
    async createFundTransaction(transactionData) {
        console.log('💰 Creating fund transaction:', transactionData);
        return this.request('/funds/transactions', {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
    }

    // Crear transferencia entre fondos
    async createFundTransfer(transferData) {
        console.log('🔄 Creating fund transfer:', transferData);
        return this.request('/funds/transfer', {
            method: 'POST',
            body: JSON.stringify(transferData)
        });
    }

}

// Create global API instance
const api = new API();