/**
 * MODAL SELECTOR DE FONDOS - SISTEMA DE TRAZABILIDAD
 * Modal elegante para seleccionar fondos al realizar pagos
 * Autor: Sistema de Trazabilidad VSP
 * Fecha: 2024-01-15
 */

// FundSelectorModal.js
class FundSelectorModal {
    constructor() {
        this.selectedFunds = new Map(); // fondoId -> monto
        this.availableFunds = [];
        this.totalAmount = 0;
        this.onConfirm = null;
        this.isVisible = false;
        this.initialized = false;
    }

    /**
     * Inicializar el modal (lazy loading)
     */
    init() {
        if (this.initialized) return;
        
        this.createModalHTML();
        this.attachEventListeners();
        this.initialized = true;
        console.log('🎯 FundSelectorModal inicializado');
    }

    /**
     * Crear estructura HTML del modal
     */
    createModalHTML() {
        const modalHTML = `
            <div id="fundSelectorModal" class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 hidden">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        <!-- Header -->
                        <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h2 class="text-2xl font-bold">💰 Selector de Fondos</h2>
                                    <p class="text-blue-100 mt-1">Selecciona de qué fondo(s) realizar el pago</p>
                                </div>
                                <button id="closeFundModal" class="text-white hover:text-gray-200 transition-colors">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                            
                            <!-- Amount Summary -->
                            <div class="mt-4 bg-white bg-opacity-20 rounded-lg p-4">
                                <div class="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div class="text-sm text-blue-100">Monto Total</div>
                                        <div id="totalAmountDisplay" class="text-xl font-bold">$0</div>
                                    </div>
                                    <div>
                                        <div class="text-sm text-blue-100">Asignado</div>
                                        <div id="assignedAmountDisplay" class="text-xl font-bold">$0</div>
                                    </div>
                                    <div>
                                        <div class="text-sm text-blue-100">Pendiente</div>
                                        <div id="remainingAmountDisplay" class="text-xl font-bold text-yellow-200">$0</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Content -->
                        <div class="flex flex-col h-full max-h-[60vh]">
                            <!-- Search and Filters -->
                            <div class="p-6 border-b border-gray-200">
                                <div class="flex gap-4 items-center">
                                    <div class="flex-1 relative">
                                        <input 
                                            type="text" 
                                            id="fundSearchInput" 
                                            placeholder="🔍 Buscar fondo..."
                                            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                        <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                        </svg>
                                    </div>
                                    <select id="fundTypeFilter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                        <option value="">Todos los tipos</option>
                                        <option value="EVENTS">📅 Eventos</option>
                                        <option value="TUITION">🎓 Matrículas</option>
                                        <option value="MONTHLY_FEES">📆 Mensualidades</option>
                                        <option value="EXTERNAL">🏢 Externo</option>
                                        <option value="OPERATIONAL">⚙️ Operacional</option>
                                        <option value="EMERGENCY">🚨 Emergencia</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Funds List -->
                            <div id="fundsContainer" class="flex-1 overflow-y-auto p-6">
                                <div id="fundsGrid" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <!-- Los fondos se cargan aquí dinámicamente -->
                                </div>
                                
                                <div id="loadingFunds" class="flex items-center justify-center py-12">
                                    <div class="text-center">
                                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                        <p class="text-gray-500 mt-4">Cargando fondos disponibles...</p>
                                    </div>
                                </div>

                                <div id="noFunds" class="text-center py-12 hidden">
                                    <div class="text-gray-400 text-6xl mb-4">💰</div>
                                    <h3 class="text-xl font-semibold text-gray-600 mb-2">No hay fondos disponibles</h3>
                                    <p class="text-gray-500">No se encontraron fondos que coincidan con los criterios de búsqueda.</p>
                                </div>
                            </div>

                            <!-- Actions -->
                            <div class="border-t border-gray-200 p-6">
                                <div class="flex justify-between items-center">
                                    <div class="text-sm text-gray-500">
                                        <span id="selectedFundsCount">0</span> fondo(s) seleccionado(s)
                                    </div>
                                    <div class="flex gap-3">
                                        <button id="clearSelectionBtn" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                            🔄 Limpiar
                                        </button>
                                        <button id="cancelFundSelectionBtn" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                            ❌ Cancelar
                                        </button>
                                        <button id="confirmFundSelectionBtn" class="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" disabled>
                                            ✅ Confirmar Pago
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Adjuntar event listeners
     */
    attachEventListeners() {
        // Cerrar modal
        const closeBtn = document.getElementById('closeFundModal');
        const cancelBtn = document.getElementById('cancelFundSelectionBtn');
        
        closeBtn?.addEventListener('click', () => this.hide());
        cancelBtn?.addEventListener('click', () => this.hide());

        // Búsqueda y filtros
        const searchInput = document.getElementById('fundSearchInput');
        const typeFilter = document.getElementById('fundTypeFilter');

        searchInput?.addEventListener('input', () => this.filterFunds());
        typeFilter?.addEventListener('change', () => this.filterFunds());

        // Botones de acción
        document.getElementById('clearSelectionBtn')?.addEventListener('click', () => this.clearSelection());
        document.getElementById('confirmFundSelectionBtn')?.addEventListener('click', () => this.confirmSelection());

        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // Prevenir cierre al hacer clic dentro del modal
        document.getElementById('fundSelectorModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'fundSelectorModal') {
                this.hide();
            }
        });
    }

    /**
     * Mostrar modal con configuración
     */
    async show({ totalAmount, invoiceData = null, onConfirm }) {
        try {
            console.log('🎯 Mostrando selector de fondos:', { totalAmount, invoiceData });

            // Inicializar modal si no está inicializado
            if (!this.initialized) {
                this.init();
            }

            this.totalAmount = totalAmount;
            this.onConfirm = onConfirm;
            this.invoiceData = invoiceData;
            this.selectedFunds.clear();

            // Actualizar displays
            this.updateAmountDisplays();

            // Cargar fondos disponibles
            await this.loadAvailableFunds();

            // Mostrar modal
            const modal = document.getElementById('fundSelectorModal');
            modal?.classList.remove('hidden');
            this.isVisible = true;

            // Animación de entrada
            setTimeout(() => {
                modal?.classList.add('opacity-100');
            }, 10);

        } catch (error) {
            console.error('❌ Error mostrando modal de fondos:', error);
            showAlert('Error al cargar fondos disponibles', 'error');
        }
    }

    /**
     * Ocultar modal
     */
    hide() {
        const modal = document.getElementById('fundSelectorModal');
        modal?.classList.add('hidden');
        this.isVisible = false;
        
        // Limpiar selección
        this.selectedFunds.clear();
        this.updateAmountDisplays();
        
        console.log('🎯 Modal de fondos ocultado');
    }

    /**
     * Cargar fondos disponibles
     */
    async loadAvailableFunds() {
        try {
            console.log('📋 Cargando fondos disponibles...');
            
            const loadingEl = document.getElementById('loadingFunds');
            const gridEl = document.getElementById('fundsGrid');
            const noFundsEl = document.getElementById('noFunds');

            loadingEl?.classList.remove('hidden');
            gridEl?.classList.add('hidden');
            noFundsEl?.classList.add('hidden');

            // Obtener fondos activos con saldo
            const response = await api.getActiveFunds();
            this.availableFunds = response || [];

            console.log(`✅ Cargados ${this.availableFunds.length} fondos`);

            loadingEl?.classList.add('hidden');
            
            if (this.availableFunds.length > 0) {
                this.renderFunds();
                gridEl?.classList.remove('hidden');
            } else {
                noFundsEl?.classList.remove('hidden');
            }

        } catch (error) {
            console.error('❌ Error cargando fondos:', error);
            document.getElementById('loadingFunds')?.classList.add('hidden');
            document.getElementById('noFunds')?.classList.remove('hidden');
            
            showAlert('Error al cargar fondos disponibles', 'error');
        }
    }

    /**
     * Renderizar lista de fondos
     */
    renderFunds() {
        const container = document.getElementById('fundsGrid');
        if (!container) return;

        const filteredFunds = this.getFilteredFunds();
        
        container.innerHTML = filteredFunds.map(fund => this.createFundCardHTML(fund)).join('');

        // Agregar event listeners a las tarjetas
        filteredFunds.forEach(fund => {
            this.attachFundCardListeners(fund);
        });
    }

    /**
     * Crear HTML de tarjeta de fondo
     */
    createFundCardHTML(fund) {
        const alertLevel = this.calculateAlertLevel(fund);
        const alertInfo = this.getAlertInfo(alertLevel);
        const isSelected = this.selectedFunds.has(fund.id);
        const selectedAmount = this.selectedFunds.get(fund.id) || 0;

        return `
            <div id="fund-card-${fund.id}" class="fund-card border-2 rounded-xl p-4 cursor-pointer transition-all transform hover:scale-105 hover:shadow-lg ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300'}">
                <!-- Fund Header -->
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <span class="text-lg">${this.getFundTypeIcon(fund.type)}</span>
                            <h3 class="font-semibold text-gray-800 truncate">${fund.name}</h3>
                        </div>
                        <p class="text-sm text-gray-500">${fund.code} • ${this.formatFundType(fund.type)}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        ${alertInfo.badge}
                        ${isSelected ? '<div class="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</div>' : ''}
                    </div>
                </div>

                <!-- Balance Display -->
                <div class="mb-3">
                    <div class="text-2xl font-bold text-gray-800">
                        ${this.formatCurrency(fund.currentBalance)}
                    </div>
                    <div class="text-sm text-gray-500">
                        Saldo disponible
                    </div>
                </div>

                <!-- Usage Indicator -->
                <div class="mb-3">
                    <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Uso: ${alertLevel.percentage}%</span>
                        <span>${alertLevel.percentage >= 70 ? alertInfo.label : '✅ Saludable'}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="h-2 rounded-full transition-all duration-300 ${alertInfo.barColor}" style="width: ${Math.min(alertLevel.percentage, 100)}%"></div>
                    </div>
                </div>

                <!-- Selection Controls -->
                <div class="space-y-3">
                    ${isSelected ? `
                        <div class="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium text-green-800">💰 Monto asignado</span>
                                <button class="text-red-500 hover:text-red-700" onclick="getFundSelector().removeFund('${fund.id}')"
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </button>
                            </div>
                            <input 
                                type="number" 
                                id="amount-${fund.id}"
                                value="${selectedAmount}" 
                                min="0" 
                                max="${fund.currentBalance}"
                                class="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                onchange="getFundSelector().updateFundAmount('${fund.id}', this.value)"
                            >
                        </div>
                    ` : `
                        <button 
                            class="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600"
                            onclick="getFundSelector().selectFund('${fund.id}')"
                        >
                            ➕ Seleccionar Fondo
                        </button>
                    `}

                    <!-- Quick Amount Buttons -->
                    <div class="flex gap-2">
                        <button class="flex-1 text-xs py-1 px-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                                onclick="getFundSelector().quickSelect('${fund.id}', ${Math.min(fund.currentBalance, this.totalAmount)})">
                            Todo (${this.formatCurrency(Math.min(fund.currentBalance, this.totalAmount))})
                        </button>
                        <button class="flex-1 text-xs py-1 px-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                                onclick="getFundSelector().quickSelect('${fund.id}', ${Math.min(fund.currentBalance * 0.5, this.totalAmount)})">
                            50%
                        </button>
                    </div>
                </div>

                ${fund.description ? `
                    <div class="mt-3 pt-3 border-t border-gray-100">
                        <p class="text-xs text-gray-500">${fund.description}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Adjuntar listeners a tarjeta de fondo
     */
    attachFundCardListeners(fund) {
        // Los listeners ya están en el HTML como onclick
        // Esto es para mantener compatibilidad con sistemas más complejos
    }

    /**
     * Seleccionar un fondo
     */
    selectFund(fundId) {
        console.log('✅ Seleccionando fondo:', fundId);
        
        const fund = this.availableFunds.find(f => f.id === fundId);
        if (!fund) return;

        const remainingAmount = this.getRemainingAmount();
        const suggestedAmount = Math.min(fund.currentBalance, remainingAmount);

        this.selectedFunds.set(fundId, suggestedAmount);
        this.updateDisplays();
        this.renderFunds(); // Re-render para mostrar controles de selección
    }

    /**
     * Remover un fondo de la selección
     */
    removeFund(fundId) {
        console.log('❌ Removiendo fondo de selección:', fundId);
        
        this.selectedFunds.delete(fundId);
        this.updateDisplays();
        this.renderFunds();
    }

    /**
     * Actualizar monto de un fondo seleccionado
     */
    updateFundAmount(fundId, newAmount) {
        const amount = parseFloat(newAmount) || 0;
        const fund = this.availableFunds.find(f => f.id === fundId);
        
        if (!fund) return;

        // Validar límites
        if (amount > fund.currentBalance) {
            showAlert(`El monto no puede exceder el saldo disponible (${this.formatCurrency(fund.currentBalance)})`, 'warning');
            document.getElementById(`amount-${fundId}`).value = fund.currentBalance;
            return;
        }

        if (amount <= 0) {
            this.removeFund(fundId);
            return;
        }

        console.log(`💰 Actualizando monto para fondo ${fundId}: ${this.formatCurrency(amount)}`);
        
        this.selectedFunds.set(fundId, amount);
        this.updateDisplays();
    }

    /**
     * Selección rápida de monto
     */
    quickSelect(fundId, amount) {
        console.log(`⚡ Selección rápida fondo ${fundId}: ${this.formatCurrency(amount)}`);
        
        if (!this.selectedFunds.has(fundId)) {
            this.selectFund(fundId);
        }
        
        this.updateFundAmount(fundId, amount);
    }

    /**
     * Limpiar toda la selección
     */
    clearSelection() {
        console.log('🔄 Limpiando selección de fondos');
        
        this.selectedFunds.clear();
        this.updateDisplays();
        this.renderFunds();
    }

    /**
     * Confirmar selección
     */
    confirmSelection() {
        try {
            const selectedCount = this.selectedFunds.size;
            const totalAssigned = this.getTotalAssigned();
            const remaining = this.getRemainingAmount();

            console.log('✅ Confirmando selección de fondos:', {
                selectedCount,
                totalAssigned,
                remaining,
                totalAmount: this.totalAmount
            });

            if (selectedCount === 0) {
                showAlert('Debe seleccionar al menos un fondo', 'warning');
                return;
            }

            if (Math.abs(remaining) > 0.01) { // Tolerancia de 1 centavo
                showAlert(`El monto total asignado (${this.formatCurrency(totalAssigned)}) debe igual al monto a pagar (${this.formatCurrency(this.totalAmount)})`, 'warning');
                return;
            }

            // Preparar datos para el callback
            const fundSelections = Array.from(this.selectedFunds.entries()).map(([fundId, amount]) => {
                const fund = this.availableFunds.find(f => f.id === fundId);
                return {
                    fundId,
                    fundName: fund.name,
                    fundCode: fund.code,
                    amount,
                    percentage: Math.round((amount / this.totalAmount) * 100)
                };
            });

            // Ejecutar callback
            if (this.onConfirm) {
                this.onConfirm(fundSelections);
            }

            // Ocultar modal
            this.hide();

            showAlert(`Pago asignado exitosamente a ${selectedCount} fondo(s)`, 'success');

        } catch (error) {
            console.error('❌ Error confirmando selección:', error);
            showAlert('Error al confirmar la selección de fondos', 'error');
        }
    }

    /**
     * Obtener fondos filtrados
     */
    getFilteredFunds() {
        const searchTerm = document.getElementById('fundSearchInput')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('fundTypeFilter')?.value || '';

        return this.availableFunds.filter(fund => {
            const matchesSearch = !searchTerm || 
                fund.name.toLowerCase().includes(searchTerm) ||
                fund.code.toLowerCase().includes(searchTerm) ||
                fund.description?.toLowerCase().includes(searchTerm);

            const matchesType = !typeFilter || fund.type === typeFilter;

            return matchesSearch && matchesType && fund.isActive && fund.currentBalance > 0;
        });
    }

    /**
     * Filtrar fondos (llamado por eventos)
     */
    filterFunds() {
        this.renderFunds();
    }

    /**
     * Actualizar todos los displays
     */
    updateDisplays() {
        this.updateAmountDisplays();
        this.updateConfirmButton();
        this.updateSelectedCount();
    }

    /**
     * Actualizar displays de montos
     */
    updateAmountDisplays() {
        const totalEl = document.getElementById('totalAmountDisplay');
        const assignedEl = document.getElementById('assignedAmountDisplay');
        const remainingEl = document.getElementById('remainingAmountDisplay');

        const totalAssigned = this.getTotalAssigned();
        const remaining = this.getRemainingAmount();

        if (totalEl) totalEl.textContent = this.formatCurrency(this.totalAmount);
        if (assignedEl) assignedEl.textContent = this.formatCurrency(totalAssigned);
        
        if (remainingEl) {
            remainingEl.textContent = this.formatCurrency(remaining);
            remainingEl.className = `text-xl font-bold ${remaining > 0.01 ? 'text-yellow-300' : remaining < -0.01 ? 'text-red-300' : 'text-green-300'}`;
        }
    }

    /**
     * Actualizar botón de confirmar
     */
    updateConfirmButton() {
        const btn = document.getElementById('confirmFundSelectionBtn');
        if (!btn) return;

        const hasSelections = this.selectedFunds.size > 0;
        const isBalanced = Math.abs(this.getRemainingAmount()) <= 0.01;

        btn.disabled = !hasSelections || !isBalanced;
        
        if (hasSelections && isBalanced) {
            btn.textContent = `✅ Confirmar Pago (${this.selectedFunds.size} fondo${this.selectedFunds.size > 1 ? 's' : ''})`;
        } else {
            btn.textContent = '✅ Confirmar Pago';
        }
    }

    /**
     * Actualizar contador de fondos seleccionados
     */
    updateSelectedCount() {
        const countEl = document.getElementById('selectedFundsCount');
        if (countEl) {
            countEl.textContent = this.selectedFunds.size.toString();
        }
    }

    /**
     * Obtener monto total asignado
     */
    getTotalAssigned() {
        return Array.from(this.selectedFunds.values()).reduce((sum, amount) => sum + amount, 0);
    }

    /**
     * Obtener monto restante por asignar
     */
    getRemainingAmount() {
        return this.totalAmount - this.getTotalAssigned();
    }

    /**
     * Calcular nivel de alerta de un fondo
     */
    calculateAlertLevel(fund) {
        const percentage = fund.totalIncome > 0 
            ? Math.round(((fund.totalIncome - fund.currentBalance) / fund.totalIncome) * 100)
            : 0;

        return { percentage };
    }

    /**
     * Obtener información de alerta
     */
    getAlertInfo(alertLevel) {
        const percentage = alertLevel.percentage;
        
        if (percentage >= 95) {
            return {
                level: 'critical',
                label: '🔴 Crítico',
                badge: '<span class="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">🔴 CRÍTICO</span>',
                barColor: 'bg-red-500'
            };
        } else if (percentage >= 85) {
            return {
                level: 'warning',
                label: '🟠 Alerta',
                badge: '<span class="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">🟠 ALERTA</span>',
                barColor: 'bg-orange-500'
            };
        } else if (percentage >= 70) {
            return {
                level: 'attention',
                label: '🟡 Atención',
                badge: '<span class="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">🟡 ATENCIÓN</span>',
                barColor: 'bg-yellow-500'
            };
        }
        
        return {
            level: 'safe',
            label: '🟢 Saludable',
            badge: '',
            barColor: 'bg-green-500'
        };
    }

    /**
     * Obtener icono por tipo de fondo
     */
    getFundTypeIcon(type) {
        const icons = {
            'EVENTS': '📅',
            'TUITION': '🎓',
            'MONTHLY_FEES': '📆',
            'EXTERNAL': '🏢',
            'OPERATIONAL': '⚙️',
            'EMERGENCY': '🚨'
        };
        return icons[type] || '💰';
    }

    /**
     * Formatear tipo de fondo
     */
    formatFundType(type) {
        const types = {
            'EVENTS': 'Eventos',
            'TUITION': 'Matrículas',
            'MONTHLY_FEES': 'Mensualidades',
            'EXTERNAL': 'Externo',
            'OPERATIONAL': 'Operacional',
            'EMERGENCY': 'Emergencia'
        };
        return types[type] || type;
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
}

// ==============================================
// INTEGRACIÓN CON EL SISTEMA DE PAGOS ACTUAL
// ==============================================

// Instancia global del selector de fondos (lazy loading)
let fundSelector = null;

// Función para obtener la instancia del selector
function getFundSelector() {
    if (!fundSelector) {
        fundSelector = new FundSelectorModal();
    }
    return fundSelector;
}

/**
 * Función de integración para usar en el sistema de pagos actual
 * Llamar esta función cuando se vaya a realizar un pago
 */
async function showFundSelector({ totalAmount, invoiceData = null, paymentType = 'invoice' }) {
    return new Promise((resolve, reject) => {
        try {
            console.log('🎯 Iniciando selector de fondos:', { totalAmount, invoiceData, paymentType });

            // Mostrar modal con callback
            getFundSelector().show({
                totalAmount,
                invoiceData,
                onConfirm: (fundSelections) => {
                    console.log('✅ Fondos seleccionados:', fundSelections);
                    resolve(fundSelections);
                }
            });

        } catch (error) {
            console.error('❌ Error mostrando selector de fondos:', error);
            reject(error);
        }
    });
}

/**
 * Función para integrar con el pago de facturas de proveedores
 * Se llama desde el modal de "Registrar Factura de Proveedor"
 */
async function payInvoiceWithFundSelection(invoiceData) {
    try {
        console.log('💳 Iniciando pago de factura con selección de fondos:', invoiceData);

        // Calcular monto total
        const totalAmount = invoiceData.items?.reduce((sum, item) => 
            sum + (item.quantity * item.unitPrice), 0
        ) || invoiceData.total || 0;

        if (totalAmount <= 0) {
            showAlert('El monto total debe ser mayor a cero', 'warning');
            return null;
        }

        // Mostrar selector de fondos
        const fundSelections = await showFundSelector({
            totalAmount,
            invoiceData,
            paymentType: 'supplier_invoice'
        });

        // Procesar pago con los fondos seleccionados
        const paymentResult = await processMultiFundPayment({
            invoiceData,
            fundSelections,
            totalAmount,
            paymentType: 'supplier_invoice'
        });

        console.log('✅ Pago procesado exitosamente:', paymentResult);
        return paymentResult;

    } catch (error) {
        console.error('❌ Error en pago con selección de fondos:', error);
        showAlert('Error al procesar el pago: ' + error.message, 'error');
        return null;
    }
}

/**
 * Función para integrar con el pago de facturas de estudiantes
 */
async function payStudentInvoiceWithFundSelection(invoiceData) {
    try {
        console.log('💳 Iniciando pago de factura estudiantil:', invoiceData);

        const totalAmount = invoiceData.totalAmount || invoiceData.amount || 0;

        if (totalAmount <= 0) {
            showAlert('El monto total debe ser mayor a cero', 'warning');
            return null;
        }

        const fundSelections = await showFundSelector({
            totalAmount,
            invoiceData,
            paymentType: 'student_invoice'
        });

        const paymentResult = await processMultiFundPayment({
            invoiceData,
            fundSelections,
            totalAmount,
            paymentType: 'student_invoice'
        });

        console.log('✅ Pago de factura estudiantil procesado:', paymentResult);
        return paymentResult;

    } catch (error) {
        console.error('❌ Error en pago de factura estudiantil:', error);
        showAlert('Error al procesar el pago: ' + error.message, 'error');
        return null;
    }
}

/**
 * Procesar pago con múltiples fondos
 */
async function processMultiFundPayment({ invoiceData, fundSelections, totalAmount, paymentType }) {
    try {
        console.log('⚡ Procesando pago multi-fondo:', {
            fundSelections,
            totalAmount,
            paymentType
        });

        // Validar fondos antes del pago
        const validationResults = await validateFundsBeforePayment(fundSelections);
        
        if (!validationResults.isValid) {
            throw new Error(validationResults.error);
        }

        // Crear el pago principal
        const mainPaymentData = {
            ...invoiceData,
            totalAmount,
            paymentMethod: 'FUND_TRANSFER',
            fundSelections,
            paymentType,
            notes: `Pago distribuido entre ${fundSelections.length} fondo(s): ${fundSelections.map(f => f.fundCode).join(', ')}`
        };

        // Procesar según el tipo de pago
        let paymentResult;
        
        switch (paymentType) {
            case 'supplier_invoice':
                paymentResult = await processSupplierInvoicePayment(mainPaymentData);
                break;
            case 'student_invoice':
                paymentResult = await processStudentInvoicePayment(mainPaymentData);
                break;
            case 'expense':
                paymentResult = await processExpensePayment(mainPaymentData);
                break;
            default:
                paymentResult = await processGenericPayment(mainPaymentData);
        }

        // Registrar transacciones en cada fondo
        const fundTransactions = await Promise.all(
            fundSelections.map(selection => registerFundTransaction(selection, paymentResult))
        );

        console.log('✅ Transacciones de fondos registradas:', fundTransactions);

        return {
            payment: paymentResult,
            fundTransactions,
            fundSelections,
            totalAmount
        };

    } catch (error) {
        console.error('❌ Error procesando pago multi-fondo:', error);
        throw error;
    }
}

/**
 * Validar fondos antes del pago
 */
async function validateFundsBeforePayment(fundSelections) {
    try {
        console.log('🔍 Validando fondos antes del pago...');

        const validationPromises = fundSelections.map(async (selection) => {
            const response = await api.post(`/funds/${selection.fundId}/validate-balance`, {
                amount: selection.amount
            });
            
            return {
                fundId: selection.fundId,
                fundName: selection.fundName,
                isValid: response.isValid,
                availableBalance: response.availableBalance,
                shortfall: response.shortfall
            };
        });

        const validationResults = await Promise.all(validationPromises);
        const invalidFunds = validationResults.filter(r => !r.isValid);

        if (invalidFunds.length > 0) {
            const errorMessages = invalidFunds.map(f => 
                `${f.fundName}: insuficiente (falta ${getFundSelector().formatCurrency(f.shortfall)})`
            );
            
            return {
                isValid: false,
                error: `Fondos insuficientes:\n${errorMessages.join('\n')}`
            };
        }

        console.log('✅ Todos los fondos validados correctamente');
        return { isValid: true };

    } catch (error) {
        console.error('❌ Error validando fondos:', error);
        return {
            isValid: false,
            error: 'Error al validar disponibilidad de fondos: ' + error.message
        };
    }
}

/**
 * Registrar transacción en un fondo
 */
async function registerFundTransaction(fundSelection, paymentResult) {
    try {
        console.log(`💰 Registrando transacción en fondo ${fundSelection.fundCode}:`, fundSelection.amount);

        const transactionData = {
            amount: fundSelection.amount,
            description: `Pago factura ${paymentResult.invoiceNumber || 'N/A'} - ${fundSelection.percentage}% del total`,
            reference: paymentResult.paymentNumber || paymentResult.id,
            paymentId: paymentResult.id,
            invoiceId: paymentResult.invoiceId
        };

        const transaction = await api.post(`/funds/${fundSelection.fundId}/expense`, transactionData);
        
        console.log(`✅ Transacción registrada en fondo ${fundSelection.fundCode}`);
        return transaction;

    } catch (error) {
        console.error(`❌ Error registrando transacción en fondo ${fundSelection.fundCode}:`, error);
        throw error;
    }
}

/**
 * Procesar pago de factura de proveedor
 */
async function processSupplierInvoicePayment(paymentData) {
    try {
        console.log('🏢 Procesando pago de factura de proveedor...');

        // Crear factura de proveedor
        const invoice = await api.post('/invoices/external', {
            supplierName: paymentData.supplierName || paymentData.providerName,
            supplierDocument: paymentData.supplierDocument || paymentData.providerDocument,
            supplierEmail: paymentData.supplierEmail || paymentData.email,
            supplierPhone: paymentData.supplierPhone || paymentData.phone,
            supplierAddress: paymentData.supplierAddress || paymentData.address,
            invoiceNumber: paymentData.invoiceNumber,
            invoiceDate: paymentData.invoiceDate || new Date().toISOString().split('T')[0],
            dueDate: paymentData.dueDate,
            concept: paymentData.concept || 'Factura de Proveedor',
            items: paymentData.items || [{
                description: paymentData.concept || 'Servicio/Producto',
                quantity: 1,
                unitPrice: paymentData.totalAmount
            }],
            totalAmount: paymentData.totalAmount,
            notes: paymentData.notes
        });

        // Crear pago
        const payment = await api.post('/payments', {
            invoiceId: invoice.id,
            amount: paymentData.totalAmount,
            paymentMethod: 'FUND_TRANSFER',
            notes: paymentData.notes,
            fundSelections: paymentData.fundSelections
        });

        console.log('✅ Pago de factura de proveedor procesado');
        return { ...payment, invoiceId: invoice.id, invoiceNumber: paymentData.invoiceNumber };

    } catch (error) {
        console.error('❌ Error procesando pago de proveedor:', error);
        throw error;
    }
}

/**
 * Procesar pago de factura de estudiante
 */
async function processStudentInvoicePayment(paymentData) {
    try {
        console.log('🎓 Procesando pago de factura de estudiante...');

        const payment = await api.post('/payments', {
            invoiceId: paymentData.invoiceId,
            amount: paymentData.totalAmount,
            paymentMethod: 'FUND_TRANSFER',
            notes: paymentData.notes,
            fundSelections: paymentData.fundSelections
        });

        console.log('✅ Pago de factura de estudiante procesado');
        return payment;

    } catch (error) {
        console.error('❌ Error procesando pago de estudiante:', error);
        throw error;
    }
}

/**
 * Procesar gasto general
 */
async function processExpensePayment(paymentData) {
    try {
        console.log('💸 Procesando gasto general...');

        // Crear factura externa para gastos generales
        const invoice = await api.post('/invoices/external', {
            supplierName: 'Gasto General',
            concept: paymentData.concept || 'Gasto Operacional',
            totalAmount: paymentData.totalAmount,
            items: [{
                description: paymentData.concept || 'Gasto General',
                quantity: 1,
                unitPrice: paymentData.totalAmount
            }],
            invoiceDate: new Date().toISOString().split('T')[0]
        });

        const payment = await api.post('/payments', {
            invoiceId: invoice.id,
            amount: paymentData.totalAmount,
            paymentMethod: 'FUND_TRANSFER',
            notes: paymentData.notes,
            fundSelections: paymentData.fundSelections
        });

        console.log('✅ Gasto general procesado');
        return { ...payment, invoiceId: invoice.id };

    } catch (error) {
        console.error('❌ Error procesando gasto:', error);
        throw error;
    }
}

/**
 * Procesar pago genérico
 */
async function processGenericPayment(paymentData) {
    console.log('⚡ Procesando pago genérico...');
    
    // Implementación por defecto
    return processExpensePayment(paymentData);
}

// ==============================================
// FUNCIONES DE UTILIDAD PARA INTEGRACIÓN
// ==============================================

/**
 * Integrar botón de "Pagar con Fondos" en formularios existentes
 */
function addFundPaymentButton(formSelector, options = {}) {
    try {
        console.log('🔧 Integrando botón de pago con fondos en:', formSelector);

        const form = document.querySelector(formSelector);
        if (!form) {
            console.warn('⚠️ Formulario no encontrado:', formSelector);
            return;
        }

        // Crear botón
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-primary bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105';
        button.innerHTML = '💰 Pagar con Fondos';
        
        // Event listener
        button.addEventListener('click', async () => {
            try {
                const formData = new FormData(form);
                const invoiceData = Object.fromEntries(formData.entries());
                
                // Calcular total
                let totalAmount = options.getTotalAmount ? 
                    options.getTotalAmount(invoiceData) : 
                    parseFloat(invoiceData.total || invoiceData.totalAmount || 0);

                if (totalAmount <= 0) {
                    showAlert('Debe especificar un monto válido', 'warning');
                    return;
                }

                const result = await payInvoiceWithFundSelection({
                    ...invoiceData,
                    totalAmount
                });

                if (result && options.onSuccess) {
                    options.onSuccess(result);
                }

            } catch (error) {
                console.error('❌ Error en pago con fondos:', error);
                showAlert('Error al procesar el pago', 'error');
            }
        });

        // Agregar al formulario
        const targetContainer = form.querySelector(options.buttonContainer || '.form-actions, .modal-footer, form > div:last-child') || form;
        targetContainer.appendChild(button);

        console.log('✅ Botón de pago con fondos integrado');

    } catch (error) {
        console.error('❌ Error integrando botón de pago:', error);
    }
}

/**
 * Mostrar resumen de transacciones de fondos después del pago
 */
function showFundTransactionSummary(paymentResult) {
    try {
        console.log('📊 Mostrando resumen de transacciones de fondos');

        const { fundSelections, totalAmount, fundTransactions } = paymentResult;
        
        const summaryHTML = `
            <div class="fund-transaction-summary bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <h4 class="text-lg font-semibold text-green-800 mb-3">✅ Pago Realizado Exitosamente</h4>
                
                <div class="mb-4">
                    <div class="text-sm text-gray-600">Monto Total: <span class="font-bold text-green-800">${getFundSelector().formatCurrency(totalAmount)}</span></div>
                    <div class="text-sm text-gray-600">Distribuido entre ${fundSelections.length} fondo(s)</div>
                </div>

                <div class="space-y-2">
                    ${fundSelections.map((selection, index) => `
                        <div class="flex items-center justify-between py-2 px-3 bg-white rounded border">
                            <div class="flex items-center gap-2">
                                <span class="text-lg">${getFundSelector().getFundTypeIcon(selection.fundType || 'OPERATIONAL')}</span>
                                <div>
                                    <div class="font-medium text-gray-800">${selection.fundName}</div>
                                    <div class="text-xs text-gray-500">${selection.fundCode}</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="font-bold text-gray-800">${getFundSelector().formatCurrency(selection.amount)}</div>
                                <div class="text-xs text-gray-500">${selection.percentage}%</div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="mt-3 pt-3 border-t border-green-200 text-xs text-gray-500">
                    <div>🕒 Procesado: ${new Date().toLocaleString()}</div>
                    <div>📝 ID de Pago: ${paymentResult.payment?.id || 'N/A'}</div>
                </div>
            </div>
        `;

        // Agregar al DOM (buscar contenedor apropiado)
        const containers = [
            '.payment-result', 
            '.modal-body', 
            '.form-container',
            'main',
            'body'
        ];

        for (const selector of containers) {
            const container = document.querySelector(selector);
            if (container) {
                container.insertAdjacentHTML('beforeend', summaryHTML);
                break;
            }
        }

    } catch (error) {
        console.error('❌ Error mostrando resumen:', error);
    }
}

// ==============================================
// AUTO-INICIALIZACIÓN Y EVENTOS GLOBALES
// ==============================================

// Auto-integración cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 FundSelectorModal: Sistema de trazabilidad de fondos disponible');
    
    // La función getFundSelector() ya está disponible globalmente
    // No necesitamos inicializar nada aquí, se hace lazy loading
    
    // El sistema está listo para usar cuando sea necesario
    console.log('✅ FundSelectorModal: Sistema listo para usar');
});

// Exportar funciones para uso global
window.getFundSelector = getFundSelector;
window.showFundSelector = showFundSelector;
window.payInvoiceWithFundSelection = payInvoiceWithFundSelection;
window.payStudentInvoiceWithFundSelection = payStudentInvoiceWithFundSelection;
window.addFundPaymentButton = addFundPaymentButton;

console.log('🎯 FundSelectorModal: Sistema de trazabilidad de fondos cargado correctamente');