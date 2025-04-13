// Calendar Management Module
const CalendarManager = {
    currentDate: new Date(),
    selectedDate: null,
    events: [],

    // Initialize calendar
    init() {
        this.loadEvents();
        this.renderCalendar();
        this.bindEvents();
    },

    // Bind calendar events
    bindEvents() {
        // Month navigation
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.navigateMonth(-1);
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.navigateMonth(1);
        });

        // Today button
        const todayButton = document.querySelector('button:contains("Hoje")');
        if (todayButton) {
            todayButton.addEventListener('click', () => {
                this.currentDate = new Date();
                this.renderCalendar();
            });
        }

        // View change
        const viewSelect = document.querySelector('select');
        if (viewSelect) {
            viewSelect.addEventListener('change', (e) => {
                this.changeView(e.target.value);
            });
        }

        // Listen for maintenance updates
        App.EventManager.on('maintenanceUpdated', () => {
            this.loadEvents();
            this.renderCalendar();
        });
    },

    // Load maintenance events
    loadEvents() {
        const maintenances = App.StorageManager.getMaintenances();
        this.events = maintenances.map(maintenance => ({
            id: maintenance.id,
            title: maintenance.title,
            date: new Date(maintenance.date),
            location: maintenance.location,
            status: maintenance.status,
            technicianIds: maintenance.technicianIds
        }));
    },

    // Navigate between months
    navigateMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    },

    // Change calendar view (month/week/day)
    changeView(view) {
        // Implementation for different views can be added here
        this.renderCalendar();
    },

    // Render calendar
    renderCalendar() {
        this.updateCalendarHeader();
        this.renderDays();
    },

    // Update calendar header with current month and year
    updateCalendarHeader() {
        const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];

        const headerElement = document.getElementById('currentMonth');
        if (headerElement) {
            headerElement.textContent = `${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        }
    },

    // Get days in month
    getDaysInMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    },

    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    getFirstDayOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    },

    // Get events for a specific date
    getEventsForDate(date) {
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getDate() === date.getDate() &&
                   eventDate.getMonth() === date.getMonth() &&
                   eventDate.getFullYear() === date.getFullYear();
        });
    },

    // Create event element
    createEventElement(event) {
        const statusColors = {
            pending: 'blue',
            'in-progress': 'yellow',
            completed: 'green',
            delayed: 'red'
        };

        const color = statusColors[event.status] || 'gray';

        return `
            <div class="bg-${color}-100 rounded p-1 text-xs mb-1 cursor-pointer hover:bg-${color}-200"
                 onclick="CalendarManager.showEventDetails('${event.id}')">
                <div class="flex items-center">
                    <div class="maintenance-dot bg-${color}-500 mr-1"></div>
                    <span class="truncate">${event.title}</span>
                </div>
                <div class="text-gray-600 ml-3 truncate">${event.location}</div>
            </div>
        `;
    },

    // Render calendar days
    renderDays() {
        const daysContainer = document.querySelector('.calendar-days');
        if (!daysContainer) return;

        const daysInMonth = this.getDaysInMonth(this.currentDate);
        const firstDay = this.getFirstDayOfMonth(this.currentDate);
        
        let html = '';

        // Previous month days
        const prevMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 0);
        const prevMonthDays = prevMonth.getDate();
        
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            html += `
                <div class="bg-gray-50 calendar-day p-2">
                    <div class="text-gray-400">${day}</div>
                </div>
            `;
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const events = this.getEventsForDate(date);
            const isToday = this.isToday(date);
            
            html += `
                <div class="bg-white calendar-day p-2 ${isToday ? 'ring-2 ring-blue-500' : ''}">
                    <div class="font-medium ${isToday ? 'text-blue-600' : ''}">${day}</div>
                    <div class="mt-1">
                        ${events.map(event => this.createEventElement(event)).join('')}
                    </div>
                </div>
            `;
        }

        // Next month days
        const remainingDays = 42 - (firstDay + daysInMonth); // 42 = 6 rows × 7 days
        for (let day = 1; day <= remainingDays; day++) {
            html += `
                <div class="bg-gray-50 calendar-day p-2">
                    <div class="text-gray-400">${day}</div>
                </div>
            `;
        }

        daysContainer.innerHTML = html;
    },

    // Check if date is today
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    },

    // Show event details in modal
    showEventDetails(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        const maintenance = App.StorageManager.getMaintenances().find(m => m.id === eventId);
        if (!maintenance) return;

        const technicians = App.StorageManager.getTechnicians()
            .filter(t => maintenance.technicianIds.includes(t.id))
            .map(t => t.name)
            .join(', ');

        const modal = document.getElementById('maintenanceModal');
        if (!modal) return;

        // Update modal content
        modal.querySelector('h3').textContent = event.title;
        
        const modalContent = modal.querySelector('.space-y-4');
        modalContent.innerHTML = `
            <div>
                <h4 class="text-sm font-medium text-gray-500">Data e Hora</h4>
                <p class="text-base">${App.Utils.formatDateTime(event.date)}</p>
            </div>
            <div>
                <h4 class="text-sm font-medium text-gray-500">Local</h4>
                <p class="text-base">${event.location}</p>
            </div>
            <div>
                <h4 class="text-sm font-medium text-gray-500">Técnico(s) Responsável(is)</h4>
                <p class="text-base">${technicians || 'Nenhum técnico designado'}</p>
            </div>
            <div>
                <h4 class="text-sm font-medium text-gray-500">Status</h4>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${this.getStatusColor(event.status)}-100 text-${this.getStatusColor(event.status)}-800">
                    ${this.getStatusText(event.status)}
                </span>
            </div>
            <div>
                <h4 class="text-sm font-medium text-gray-500">Descrição</h4>
                <p class="text-base">${maintenance.description}</p>
            </div>
        `;

        modal.classList.remove('hidden');
    },

    // Get status color
    getStatusColor(status) {
        const colors = {
            pending: 'yellow',
            'in-progress': 'blue',
            completed: 'green',
            delayed: 'red'
        };
        return colors[status] || 'gray';
    },

    // Get status text
    getStatusText(status) {
        const texts = {
            pending: 'Pendente',
            'in-progress': 'Em Andamento',
            completed: 'Concluída',
            delayed: 'Atrasada'
        };
        return texts[status] || 'Desconhecido';
    },

    // Hide event details modal
    hideEventDetails() {
        const modal = document.getElementById('maintenanceModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
};

// Initialize calendar when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    CalendarManager.init();

    // Add modal close handler
    const closeButton = document.getElementById('closeMaintenanceModal');
    if (closeButton) {
        closeButton.addEventListener('click', () => CalendarManager.hideEventDetails());
    }
});

// Export the module
window.CalendarManager = CalendarManager;
