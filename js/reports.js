// Reports Management Module
const ReportsManager = {
    currentFilters: {
        dateStart: null,
        dateEnd: null,
        status: '',
        technicianId: '',
        searchTerm: ''
    },

    // Initialize reports
    init() {
        this.bindEvents();
        this.loadInitialData();
        this.setupDateFilters();
    },

    // Bind all event listeners
    bindEvents() {
        // Export buttons
        document.getElementById('exportPDF').addEventListener('click', () => this.exportReport('pdf'));
        document.getElementById('exportExcel').addEventListener('click', () => this.exportReport('excel'));

        // Filter inputs
        const filterInputs = document.querySelectorAll('input[type="date"], select');
        filterInputs.forEach(input => {
            input.addEventListener('change', () => this.handleFilterChange());
        });

        // Search input
        const searchInput = document.querySelector('input[type="text"]');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => this.handleFilterChange(), 300));
        }

        // Listen for maintenance updates
        App.EventManager.on('maintenanceUpdated', () => {
            this.loadInitialData();
        });
    },

    // Load initial data and statistics
    loadInitialData() {
        this.updateStatistics();
        this.applyFilters();
    },

    // Setup date filters with default values
    setupDateFilters() {
        const dateInputs = document.querySelectorAll('input[type="date"]');
        if (dateInputs.length >= 2) {
            const today = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);

            dateInputs[0].value = thirtyDaysAgo.toISOString().split('T')[0];
            dateInputs[1].value = today.toISOString().split('T')[0];

            this.currentFilters.dateStart = thirtyDaysAgo;
            this.currentFilters.dateEnd = today;
        }
    },

    // Update dashboard statistics
    updateStatistics() {
        const maintenances = App.StorageManager.getMaintenances();
        
        const stats = {
            total: maintenances.length,
            completed: maintenances.filter(m => m.status === 'completed').length,
            pending: maintenances.filter(m => m.status === 'pending').length,
            delayed: maintenances.filter(m => m.status === 'delayed').length
        };

        // Update statistics cards
        Object.entries(stats).forEach(([key, value]) => {
            const element = document.querySelector(`[data-stat="${key}"]`);
            if (element) {
                element.textContent = value;
            }
        });
    },

    // Handle filter changes
    handleFilterChange() {
        const dateInputs = document.querySelectorAll('input[type="date"]');
        const statusSelect = document.querySelector('select[name="status"]');
        const technicianSelect = document.querySelector('select[name="technician"]');
        const searchInput = document.querySelector('input[type="text"]');

        this.currentFilters = {
            dateStart: dateInputs[0]?.value ? new Date(dateInputs[0].value) : null,
            dateEnd: dateInputs[1]?.value ? new Date(dateInputs[1].value) : null,
            status: statusSelect?.value || '',
            technicianId: technicianSelect?.value || '',
            searchTerm: searchInput?.value || ''
        };

        this.applyFilters();
    },

    // Apply filters to maintenance data
    applyFilters() {
        let maintenances = App.StorageManager.getMaintenances();

        // Apply date filter
        if (this.currentFilters.dateStart && this.currentFilters.dateEnd) {
            maintenances = maintenances.filter(maintenance => {
                const maintenanceDate = new Date(maintenance.date);
                return maintenanceDate >= this.currentFilters.dateStart &&
                       maintenanceDate <= this.currentFilters.dateEnd;
            });
        }

        // Apply status filter
        if (this.currentFilters.status) {
            maintenances = maintenances.filter(m => m.status === this.currentFilters.status);
        }

        // Apply technician filter
        if (this.currentFilters.technicianId) {
            maintenances = maintenances.filter(m => 
                m.technicianIds.includes(this.currentFilters.technicianId)
            );
        }

        // Apply search filter
        if (this.currentFilters.searchTerm) {
            const searchTerm = this.currentFilters.searchTerm.toLowerCase();
            maintenances = maintenances.filter(m =>
                m.title.toLowerCase().includes(searchTerm) ||
                m.location.toLowerCase().includes(searchTerm) ||
                m.description.toLowerCase().includes(searchTerm)
            );
        }

        this.renderMaintenanceTable(maintenances);
    },

    // Render maintenance table
    renderMaintenanceTable(maintenances) {
        const tbody = document.querySelector('tbody');
        if (!tbody) return;

        if (maintenances.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        Nenhuma manutenção encontrada
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = maintenances.map(maintenance => {
            const technicians = App.StorageManager.getTechnicians()
                .filter(t => maintenance.technicianIds.includes(t.id))
                .map(t => t.name)
                .join(', ');

            return `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        #${maintenance.id}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${maintenance.title}</div>
                        <div class="text-sm text-gray-500">${maintenance.description.substring(0, 50)}...</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${App.Utils.formatDate(maintenance.date)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${maintenance.location}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${technicians || 'Não atribuído'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${this.createStatusBadge(maintenance.status)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button class="text-blue-600 hover:text-blue-900 mr-3" onclick="ReportsManager.viewDetails('${maintenance.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="text-gray-600 hover:text-gray-900" onclick="ReportsManager.downloadReport('${maintenance.id}')">
                            <i class="fas fa-download"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    // Create status badge HTML
    createStatusBadge(status) {
        const statusClasses = {
            pending: 'bg-yellow-100 text-yellow-800',
            'in-progress': 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            delayed: 'bg-red-100 text-red-800'
        };

        const statusText = {
            pending: 'Pendente',
            'in-progress': 'Em Andamento',
            completed: 'Concluída',
            delayed: 'Atrasada'
        };

        return `
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status]}">
                ${statusText[status]}
            </span>
        `;
    },

    // View maintenance details
    viewDetails(maintenanceId) {
        const maintenance = App.StorageManager.getMaintenances().find(m => m.id === maintenanceId);
        if (!maintenance) return;

        // Implementation for viewing details
        // This could open a modal or redirect to a details page
        window.location.href = `maintenance-detail.html?id=${maintenanceId}`;
    },

    // Download individual maintenance report
    downloadReport(maintenanceId) {
        const maintenance = App.StorageManager.getMaintenances().find(m => m.id === maintenanceId);
        if (!maintenance) return;

        this.generateReport([maintenance]);
    },

    // Export report in specified format
    exportReport(format) {
        const maintenances = this.getFilteredMaintenances();
        
        switch (format) {
            case 'pdf':
                this.exportToPDF(maintenances);
                break;
            case 'excel':
                this.exportToExcel(maintenances);
                break;
        }
    },

    // Get currently filtered maintenances
    getFilteredMaintenances() {
        let maintenances = App.StorageManager.getMaintenances();

        // Apply current filters
        if (this.currentFilters.dateStart && this.currentFilters.dateEnd) {
            maintenances = maintenances.filter(maintenance => {
                const maintenanceDate = new Date(maintenance.date);
                return maintenanceDate >= this.currentFilters.dateStart &&
                       maintenanceDate <= this.currentFilters.dateEnd;
            });
        }

        if (this.currentFilters.status) {
            maintenances = maintenances.filter(m => m.status === this.currentFilters.status);
        }

        if (this.currentFilters.technicianId) {
            maintenances = maintenances.filter(m => 
                m.technicianIds.includes(this.currentFilters.technicianId)
            );
        }

        if (this.currentFilters.searchTerm) {
            const searchTerm = this.currentFilters.searchTerm.toLowerCase();
            maintenances = maintenances.filter(m =>
                m.title.toLowerCase().includes(searchTerm) ||
                m.location.toLowerCase().includes(searchTerm) ||
                m.description.toLowerCase().includes(searchTerm)
            );
        }

        return maintenances;
    },

    // Export to PDF format
    exportToPDF(maintenances) {
        // Implementation for PDF export
        console.log('Exporting to PDF:', maintenances);
        App.Utils.showNotification('Exportação para PDF em desenvolvimento');
    },

    // Export to Excel format
    exportToExcel(maintenances) {
        // Implementation for Excel export
        console.log('Exporting to Excel:', maintenances);
        App.Utils.showNotification('Exportação para Excel em desenvolvimento');
    },

    // Utility function to debounce filter changes
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Initialize reports when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    ReportsManager.init();
});

// Export the module
window.ReportsManager = ReportsManager;
