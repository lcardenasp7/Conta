// API Configuration
const API_BASE_URL = '/api';

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

    async getDashboardActivities() {
        return this.get('/dashboard/recent-activities');
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

    // Event Assignments
    async getEventAssignments(eventId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/events/${eventId}/assignments${queryString ? '?' + queryString : ''}`);
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

    // Event Payments
    async getEventPayments(eventId) {
        return this.get(`/events/${eventId}/payments`);
    }

    async createEventPayment(eventId, data) {
        return this.post(`/events/${eventId}/payments`, data);
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

    // Institution endpoints
    async getInstitution() {
        return this.get('/institution');
    }

    async updateInstitution(data) {
        return this.put('/institution', data);
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
}

// Create global API instance
const api = new API();