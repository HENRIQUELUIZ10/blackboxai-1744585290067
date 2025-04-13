// API Communication Module
const API = {
    // Base URL for API endpoints
    baseUrl: '/api',

    // Generic fetch wrapper with error handling
    async fetch(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro na requisição');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Technicians API
    technicians: {
        async getAll() {
            return API.fetch('/tecnicos.php');
        },

        async getById(id) {
            return API.fetch(`/tecnicos.php?id=${id}`);
        },

        async create(technician) {
            return API.fetch('/tecnicos.php', {
                method: 'POST',
                body: JSON.stringify(technician)
            });
        },

        async update(id, technician) {
            return API.fetch(`/tecnicos.php?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify(technician)
            });
        },

        async delete(id) {
            return API.fetch(`/tecnicos.php?id=${id}`, {
                method: 'DELETE'
            });
        }
    },

    // Maintenance API
    maintenance: {
        async getAll(filters = {}) {
            const params = new URLSearchParams(filters);
            return API.fetch(`/manutencoes.php?${params}`);
        },

        async getById(id) {
            return API.fetch(`/manutencoes.php?id=${id}`);
        },

        async create(maintenance) {
            return API.fetch('/manutencoes.php', {
                method: 'POST',
                body: JSON.stringify(maintenance)
            });
        },

        async update(id, maintenance) {
            return API.fetch(`/manutencoes.php?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify(maintenance)
            });
        },

        async delete(id) {
            return API.fetch(`/manutencoes.php?id=${id}`, {
                method: 'DELETE'
            });
        }
    },

    // Checklist API
    checklist: {
        async getByMaintenance(maintenanceId) {
            return API.fetch(`/checklist.php?manutencao_id=${maintenanceId}`);
        },

        async create(item) {
            return API.fetch('/checklist.php', {
                method: 'POST',
                body: JSON.stringify(item)
            });
        },

        async update(id, item) {
            return API.fetch(`/checklist.php?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify(item)
            });
        },

        async delete(id) {
            return API.fetch(`/checklist.php?id=${id}`, {
                method: 'DELETE'
            });
        }
    },

    // Reports API
    reports: {
        async getGeneral() {
            return API.fetch('/relatorios.php?type=general');
        },

        async getMaintenanceHistory(startDate, endDate) {
            const params = new URLSearchParams({
                type: 'maintenance_history',
                start_date: startDate,
                end_date: endDate
            });
            return API.fetch(`/relatorios.php?${params}`);
        },

        async getTechnicianPerformance() {
            return API.fetch('/relatorios.php?type=technician_performance');
        },

        async getLocationStatistics() {
            return API.fetch('/relatorios.php?type=location_statistics');
        },

        async getFullReport(startDate, endDate) {
            const params = new URLSearchParams({
                type: 'full_report',
                start_date: startDate,
                end_date: endDate
            });
            return API.fetch(`/relatorios.php?${params}`);
        }
    }
};

// Utility Functions
const Utils = {
    formatDate(date) {
        return new Date(date).toLocaleDateString('pt-BR');
    },

    formatDateTime(date) {
        return new Date(date).toLocaleString('pt-BR');
    },

    getStatusColor(status) {
        const colors = {
            'pending': 'yellow',
            'in-progress': 'blue',
            'completed': 'green',
            'delayed': 'red'
        };
        return colors[status] || 'gray';
    },

    getStatusText(status) {
        const texts = {
            'pending': 'Pendente',
            'in-progress': 'Em Andamento',
            'completed': 'Concluída',
            'delayed': 'Atrasada'
        };
        return texts[status] || 'Desconhecido';
    },

    showNotification(message, type = 'success') {
        // Implementation will depend on the UI notification system chosen
        alert(message);
    }
};

// Form Validation
const FormValidator = {
    validateRequired(value) {
        return value !== null && value !== undefined && value.trim() !== '';
    },

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    validatePhone(phone) {
        const re = /^\(\d{2}\) \d{4,5}-\d{4}$/;
        return re.test(phone);
    },

    validateDate(date) {
        return !isNaN(new Date(date).getTime());
    },

    validateForm(formData, rules) {
        const errors = {};
        
        for (const field in rules) {
            const value = formData[field];
            const fieldRules = rules[field];

            if (fieldRules.required && !this.validateRequired(value)) {
                errors[field] = 'Este campo é obrigatório';
                continue;
            }

            if (fieldRules.email && !this.validateEmail(value)) {
                errors[field] = 'Email inválido';
            }

            if (fieldRules.phone && !this.validatePhone(value)) {
                errors[field] = 'Telefone inválido';
            }

            if (fieldRules.date && !this.validateDate(value)) {
                errors[field] = 'Data inválida';
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};

// Export modules
window.API = API;
window.Utils = Utils;
window.FormValidator = FormValidator;
