// Maintenance Management Module
const MaintenanceManager = {
    // Constants for maintenance status
    STATUS: {
        PENDING: 'pending',
        IN_PROGRESS: 'in-progress',
        COMPLETED: 'completed',
        DELAYED: 'delayed'
    },

    // Initialize maintenance form and events
    init() {
        this.bindFormEvents();
        this.loadTechniciansForSelect();
        this.initializeCustomPeriodicity();
    },

    // Bind form events
    bindFormEvents() {
        const form = document.getElementById('maintenanceForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleMaintenanceSubmit(e);
        });

        // Handle technician selection
        const addTechnicianBtn = document.getElementById('addTechnician');
        if (addTechnicianBtn) {
            addTechnicianBtn.addEventListener('click', () => {
                this.showTechnicianSelectionModal();
            });
        }

        // Handle periodicity changes
        const periodicitySelect = document.getElementById('periodicity');
        if (periodicitySelect) {
            periodicitySelect.addEventListener('change', (e) => {
                this.handlePeriodicityChange(e.target.value);
            });
        }
    },

    // Handle maintenance form submission
    handleMaintenanceSubmit(e) {
        const formData = new FormData(e.target);
        const maintenanceData = {
            title: formData.get('title'),
            date: formData.get('date'),
            periodicity: formData.get('periodicity'),
            location: formData.get('location'),
            description: formData.get('description'),
            notes: formData.get('notes'),
            technicianIds: this.getSelectedTechnicians(),
            status: App.StorageManager.STATUS.PENDING,
            createdAt: new Date().toISOString(),
            checklist: []
        };

        // Add custom periodicity if selected
        if (maintenanceData.periodicity === 'custom') {
            maintenanceData.customPeriodicity = {
                value: formData.get('customValue'),
                unit: formData.get('customUnit')
            };
        }

        // Validate form data
        const validation = App.FormValidator.validateForm(maintenanceData, {
            title: { required: true },
            date: { required: true, date: true },
            location: { required: true },
            description: { required: true }
        });

        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        // Save maintenance
        try {
            const savedMaintenance = App.StorageManager.addMaintenance(maintenanceData);
            App.Utils.showNotification('Manutenção cadastrada com sucesso!');
            this.createDefaultChecklist(savedMaintenance.id);
            window.location.href = 'index.html';
        } catch (error) {
            App.Utils.showNotification('Erro ao cadastrar manutenção', 'error');
            console.error('Error saving maintenance:', error);
        }
    },

    // Create default checklist for new maintenance
    createDefaultChecklist(maintenanceId) {
        const defaultChecklist = {
            maintenanceId,
            items: [
                {
                    description: 'Inspeção Visual',
                    status: 'pending',
                    comments: '',
                    required: true
                },
                {
                    description: 'Verificação de Segurança',
                    status: 'pending',
                    comments: '',
                    required: true
                },
                {
                    description: 'Teste de Funcionamento',
                    status: 'pending',
                    comments: '',
                    required: true
                }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        App.StorageManager.addChecklist(defaultChecklist);
    },

    // Load technicians for selection
    loadTechniciansForSelect() {
        const technicians = App.StorageManager.getTechnicians();
        const technicianList = document.getElementById('technicianList');
        
        if (!technicianList) return;

        technicianList.innerHTML = technicians.map(technician => `
            <div class="p-2 hover:bg-gray-100 rounded cursor-pointer" data-technician-id="${technician.id}">
                <p class="font-medium">${technician.name}</p>
                <p class="text-sm text-gray-600">Especialidade: ${technician.specialty}</p>
            </div>
        `).join('');

        // Add click events to technician items
        technicianList.querySelectorAll('[data-technician-id]').forEach(item => {
            item.addEventListener('click', () => {
                this.selectTechnician(item.dataset.technicianId);
            });
        });
    },

    // Handle technician selection
    selectTechnician(technicianId) {
        const technician = App.StorageManager.getTechnicians().find(t => t.id === technicianId);
        const selectedTechnicians = document.getElementById('selectedTechnicians');
        
        if (!selectedTechnicians || !technician) return;

        // Check if technician is already selected
        if (selectedTechnicians.querySelector(`[data-technician-id="${technicianId}"]`)) {
            return;
        }

        // Add technician to selected list
        const technicianElement = document.createElement('div');
        technicianElement.className = 'inline-flex items-center bg-blue-100 rounded-full px-3 py-1 text-sm';
        technicianElement.dataset.technicianId = technicianId;
        technicianElement.innerHTML = `
            <span>${technician.name}</span>
            <button type="button" class="ml-2 text-blue-600 hover:text-blue-800">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add remove event
        technicianElement.querySelector('button').addEventListener('click', () => {
            technicianElement.remove();
        });

        selectedTechnicians.appendChild(technicianElement);
    },

    // Get selected technicians
    getSelectedTechnicians() {
        const selectedTechnicians = document.getElementById('selectedTechnicians');
        if (!selectedTechnicians) return [];

        return Array.from(selectedTechnicians.querySelectorAll('[data-technician-id]'))
            .map(element => element.dataset.technicianId);
    },

    // Handle periodicity change
    handlePeriodicityChange(value) {
        const customContainer = document.getElementById('customPeriodicityContainer');
        if (customContainer) {
            customContainer.style.display = value === 'custom' ? 'block' : 'none';
        }
    },

    // Initialize custom periodicity fields
    initializeCustomPeriodicity() {
        const periodicitySelect = document.getElementById('periodicity');
        if (periodicitySelect) {
            this.handlePeriodicityChange(periodicitySelect.value);
        }
    },

    // Show validation errors
    showValidationErrors(errors) {
        for (const [field, message] of Object.entries(errors)) {
            const element = document.getElementById(field);
            if (element) {
                element.classList.add('border-red-500');
                
                // Add error message
                let errorDiv = element.nextElementSibling;
                if (!errorDiv || !errorDiv.classList.contains('error-message')) {
                    errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message text-red-500 text-sm mt-1';
                    element.parentNode.insertBefore(errorDiv, element.nextSibling);
                }
                errorDiv.textContent = message;
            }
        }
    },

    // Show technician selection modal
    showTechnicianSelectionModal() {
        const modal = document.getElementById('technicianModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    },

    // Load maintenance details
    loadMaintenanceDetails(maintenanceId) {
        const maintenance = App.StorageManager.getMaintenances().find(m => m.id === maintenanceId);
        if (!maintenance) return;

        // Populate form fields
        const form = document.getElementById('maintenanceForm');
        if (!form) return;

        form.title.value = maintenance.title;
        form.date.value = maintenance.date;
        form.periodicity.value = maintenance.periodicity;
        form.location.value = maintenance.location;
        form.description.value = maintenance.description;
        form.notes.value = maintenance.notes || '';

        // Load selected technicians
        maintenance.technicianIds.forEach(id => this.selectTechnician(id));

        // Handle custom periodicity
        if (maintenance.periodicity === 'custom' && maintenance.customPeriodicity) {
            form.customValue.value = maintenance.customPeriodicity.value;
            form.customUnit.value = maintenance.customPeriodicity.unit;
            this.handlePeriodicityChange('custom');
        }
    },

    // Update maintenance status
    updateMaintenanceStatus(maintenanceId, status) {
        try {
            App.StorageManager.updateMaintenance(maintenanceId, { status });
            App.Utils.showNotification('Status atualizado com sucesso!');
            App.EventManager.emit('maintenanceUpdated', { id: maintenanceId, status });
        } catch (error) {
            App.Utils.showNotification('Erro ao atualizar status', 'error');
            console.error('Error updating maintenance status:', error);
        }
    }
};

// Initialize maintenance management when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    MaintenanceManager.init();

    // Check if we're editing an existing maintenance
    const urlParams = new URLSearchParams(window.location.search);
    const maintenanceId = urlParams.get('id');
    
    if (maintenanceId) {
        MaintenanceManager.loadMaintenanceDetails(maintenanceId);
    }
});

// Export the module
window.MaintenanceManager = MaintenanceManager;
