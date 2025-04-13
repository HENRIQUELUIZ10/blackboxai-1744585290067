// Technician Management Module
const TechnicianManager = {
    // Constants for technician status
    STATUS: {
        AVAILABLE: 'available',
        BUSY: 'busy',
        VACATION: 'vacation',
        LEAVE: 'leave'
    },

    // Initialize technician management
    init() {
        this.bindEvents();
        this.loadTechnicians();
    },

    // Bind all necessary events
    bindEvents() {
        // Add technician button
        const addButton = document.getElementById('addTechnicianBtn');
        if (addButton) {
            addButton.addEventListener('click', () => this.showTechnicianModal());
        }

        // Form submission
        const form = document.getElementById('technicianForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleTechnicianSubmit(e));
        }

        // Modal close buttons
        const closeButtons = document.querySelectorAll('#closeTechnicianModal, #cancelTechnicianBtn');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => this.hideTechnicianModal());
        });

        // Delete confirmation
        const confirmDelete = document.getElementById('confirmDelete');
        if (confirmDelete) {
            confirmDelete.addEventListener('click', () => this.confirmDeleteTechnician());
        }

        // Cancel delete
        const cancelDelete = document.getElementById('cancelDelete');
        if (cancelDelete) {
            cancelDelete.addEventListener('click', () => this.hideDeleteModal());
        }
    },

    // Load and display technicians
    loadTechnicians() {
        const technicians = App.StorageManager.getTechnicians();
        const tbody = document.querySelector('#techniciansList');
        
        if (!tbody) return;

        tbody.innerHTML = technicians.length ? technicians.map(technician => this.createTechnicianRow(technician)).join('')
            : '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Nenhum técnico cadastrado</td></tr>';
    },

    // Create HTML for technician table row
    createTechnicianRow(technician) {
        return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <i class="fas fa-user text-gray-500"></i>
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${technician.name}</div>
                            <div class="text-sm text-gray-500">ID: #${technician.id}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${technician.specialty}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${technician.phone}</div>
                    <div class="text-sm text-gray-500">${technician.email}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${this.createStatusBadge(technician.availability)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 mr-3" onclick="TechnicianManager.editTechnician('${technician.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900" onclick="TechnicianManager.deleteTechnician('${technician.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    },

    // Create status badge HTML
    createStatusBadge(status) {
        const statusClasses = {
            available: 'bg-green-100 text-green-800',
            busy: 'bg-yellow-100 text-yellow-800',
            vacation: 'bg-blue-100 text-blue-800',
            leave: 'bg-red-100 text-red-800'
        };

        const statusText = {
            available: 'Disponível',
            busy: 'Ocupado',
            vacation: 'Férias',
            leave: 'Licença'
        };

        return `
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status]}">
                ${statusText[status]}
            </span>
        `;
    },

    // Handle technician form submission
    handleTechnicianSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const technicianData = {
            name: formData.get('name'),
            specialty: formData.get('specialty'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            availability: formData.get('availability'),
            notes: formData.get('notes')
        };

        // Validate form data
        const validation = App.FormValidator.validateForm(technicianData, {
            name: { required: true },
            specialty: { required: true },
            phone: { required: true, phone: true },
            email: { required: true, email: true }
        });

        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        // Check if editing or creating new
        const technicianId = e.target.dataset.technicianId;

        try {
            if (technicianId) {
                App.StorageManager.updateTechnician(technicianId, technicianData);
                App.Utils.showNotification('Técnico atualizado com sucesso!');
            } else {
                App.StorageManager.addTechnician(technicianData);
                App.Utils.showNotification('Técnico cadastrado com sucesso!');
            }

            this.hideTechnicianModal();
            this.loadTechnicians();
            App.EventManager.emit('technicianUpdated');
        } catch (error) {
            App.Utils.showNotification('Erro ao salvar técnico', 'error');
            console.error('Error saving technician:', error);
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

    // Show technician modal for adding/editing
    showTechnicianModal(technicianId = null) {
        const modal = document.getElementById('technicianModal');
        const form = document.getElementById('technicianForm');
        const title = document.getElementById('modalTitle');

        if (!modal || !form || !title) return;

        // Reset form
        form.reset();
        form.dataset.technicianId = technicianId || '';
        
        // Clear previous error messages
        form.querySelectorAll('.error-message').forEach(error => error.remove());
        form.querySelectorAll('.border-red-500').forEach(field => field.classList.remove('border-red-500'));

        if (technicianId) {
            // Load technician data for editing
            const technician = App.StorageManager.getTechnicians().find(t => t.id === technicianId);
            if (technician) {
                title.textContent = 'Editar Técnico';
                form.name.value = technician.name;
                form.specialty.value = technician.specialty;
                form.phone.value = technician.phone;
                form.email.value = technician.email;
                form.availability.value = technician.availability;
                form.notes.value = technician.notes || '';
            }
        } else {
            title.textContent = 'Adicionar Novo Técnico';
        }

        modal.classList.remove('hidden');
    },

    // Hide technician modal
    hideTechnicianModal() {
        const modal = document.getElementById('technicianModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    // Edit technician
    editTechnician(id) {
        this.showTechnicianModal(id);
    },

    // Delete technician
    deleteTechnician(id) {
        this.technicianToDelete = id;
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.classList.remove('hidden');
        }
    },

    // Confirm technician deletion
    confirmDeleteTechnician() {
        if (!this.technicianToDelete) return;

        try {
            App.StorageManager.deleteTechnician(this.technicianToDelete);
            App.Utils.showNotification('Técnico excluído com sucesso!');
            this.loadTechnicians();
            App.EventManager.emit('technicianDeleted', this.technicianToDelete);
        } catch (error) {
            App.Utils.showNotification('Erro ao excluir técnico', 'error');
            console.error('Error deleting technician:', error);
        }

        this.hideDeleteModal();
        this.technicianToDelete = null;
    },

    // Hide delete confirmation modal
    hideDeleteModal() {
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.classList.add('hidden');
        }
    },

    // Get technician availability status
    getTechnicianAvailability(technicianId) {
        const technician = App.StorageManager.getTechnicians().find(t => t.id === technicianId);
        return technician ? technician.availability : null;
    },

    // Update technician availability
    updateTechnicianAvailability(technicianId, availability) {
        try {
            App.StorageManager.updateTechnician(technicianId, { availability });
            App.Utils.showNotification('Disponibilidade atualizada com sucesso!');
            this.loadTechnicians();
            App.EventManager.emit('technicianAvailabilityUpdated', { id: technicianId, availability });
        } catch (error) {
            App.Utils.showNotification('Erro ao atualizar disponibilidade', 'error');
            console.error('Error updating technician availability:', error);
        }
    },

    // Get technician assignments
    getTechnicianAssignments(technicianId) {
        const maintenances = App.StorageManager.getMaintenances();
        return maintenances.filter(m => m.technicianIds.includes(technicianId));
    }
};

// Initialize technician management when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    TechnicianManager.init();
});

// Export the module
window.TechnicianManager = TechnicianManager;
