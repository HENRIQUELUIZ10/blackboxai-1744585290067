// Data Storage Management
const StorageManager = {
    // Keys for localStorage
    KEYS: {
        MAINTENANCES: 'maintenances',
        TECHNICIANS: 'technicians',
        CHECKLISTS: 'checklists'
    },

    // Initialize storage with default values if empty
    init() {
        if (!localStorage.getItem(this.KEYS.MAINTENANCES)) {
            localStorage.setItem(this.KEYS.MAINTENANCES, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.TECHNICIANS)) {
            localStorage.setItem(this.KEYS.TECHNICIANS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.CHECKLISTS)) {
            localStorage.setItem(this.KEYS.CHECKLISTS, JSON.stringify([]));
        }
    },

    // Generic get method
    get(key) {
        const data = localStorage.getItem(key);
        return JSON.parse(data);
    },

    // Generic set method
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    // Maintenance specific methods
    getMaintenances() {
        return this.get(this.KEYS.MAINTENANCES) || [];
    },

    addMaintenance(maintenance) {
        const maintenances = this.getMaintenances();
        maintenance.id = this.generateId();
        maintenances.push(maintenance);
        this.set(this.KEYS.MAINTENANCES, maintenances);
        return maintenance;
    },

    updateMaintenance(id, updatedMaintenance) {
        const maintenances = this.getMaintenances();
        const index = maintenances.findIndex(m => m.id === id);
        if (index !== -1) {
            maintenances[index] = { ...maintenances[index], ...updatedMaintenance };
            this.set(this.KEYS.MAINTENANCES, maintenances);
            return true;
        }
        return false;
    },

    deleteMaintenance(id) {
        const maintenances = this.getMaintenances();
        const filtered = maintenances.filter(m => m.id !== id);
        this.set(this.KEYS.MAINTENANCES, filtered);
    },

    // Technician specific methods
    getTechnicians() {
        return this.get(this.KEYS.TECHNICIANS) || [];
    },

    addTechnician(technician) {
        const technicians = this.getTechnicians();
        technician.id = this.generateId();
        technicians.push(technician);
        this.set(this.KEYS.TECHNICIANS, technicians);
        return technician;
    },

    updateTechnician(id, updatedTechnician) {
        const technicians = this.getTechnicians();
        const index = technicians.findIndex(t => t.id === id);
        if (index !== -1) {
            technicians[index] = { ...technicians[index], ...updatedTechnician };
            this.set(this.KEYS.TECHNICIANS, technicians);
            return true;
        }
        return false;
    },

    deleteTechnician(id) {
        const technicians = this.getTechnicians();
        const filtered = technicians.filter(t => t.id !== id);
        this.set(this.KEYS.TECHNICIANS, filtered);
    },

    // Checklist specific methods
    getChecklists() {
        return this.get(this.KEYS.CHECKLISTS) || [];
    },

    addChecklist(checklist) {
        const checklists = this.getChecklists();
        checklist.id = this.generateId();
        checklists.push(checklist);
        this.set(this.KEYS.CHECKLISTS, checklists);
        return checklist;
    },

    updateChecklist(id, updatedChecklist) {
        const checklists = this.getChecklists();
        const index = checklists.findIndex(c => c.id === id);
        if (index !== -1) {
            checklists[index] = { ...checklists[index], ...updatedChecklist };
            this.set(this.KEYS.CHECKLISTS, checklists);
            return true;
        }
        return false;
    },

    deleteChecklist(id) {
        const checklists = this.getChecklists();
        const filtered = checklists.filter(c => c.id !== id);
        this.set(this.KEYS.CHECKLISTS, filtered);
    },

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

    showNotification(message, type = 'success') {
        // Implementation will depend on the UI notification system chosen
        alert(message);
    }
};

// Event Management
const EventManager = {
    events: {},

    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    },

    emit(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => callback(data));
        }
    },

    remove(eventName, callback) {
        if (this.events[eventName]) {
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
        }
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

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    StorageManager.init();

    // Set up global event listeners
    document.addEventListener('click', (e) => {
        // Handle navigation menu for mobile devices
        if (e.target.matches('[data-mobile-menu-button]')) {
            const mobileMenu = document.querySelector('[data-mobile-menu]');
            mobileMenu.classList.toggle('hidden');
        }
    });

    // Initialize page-specific functionality
    const currentPage = window.location.pathname.split('/').pop();
    
    switch (currentPage) {
        case 'index.html':
            // Initialize dashboard
            updateDashboardStats();
            break;
        case 'calendar.html':
            // Initialize calendar
            initializeCalendar();
            break;
        case 'reports.html':
            // Initialize reports
            loadReportsData();
            break;
    }
});

// Dashboard Functions
function updateDashboardStats() {
    const maintenances = StorageManager.getMaintenances();
    const technicians = StorageManager.getTechnicians();

    // Update statistics
    const stats = {
        total: maintenances.length,
        pending: maintenances.filter(m => m.status === 'pending').length,
        completed: maintenances.filter(m => m.status === 'completed').length,
        technicians: technicians.length
    };

    // Update UI elements
    for (const [key, value] of Object.entries(stats)) {
        const element = document.querySelector(`[data-stat="${key}"]`);
        if (element) {
            element.textContent = value;
        }
    }
}

// Calendar Functions
function initializeCalendar() {
    // Calendar initialization logic will be implemented in calendar.js
}

// Reports Functions
function loadReportsData() {
    // Reports initialization logic will be implemented in reports.js
}

// Export the modules for use in other files
window.App = {
    StorageManager,
    Utils,
    EventManager,
    FormValidator
};
