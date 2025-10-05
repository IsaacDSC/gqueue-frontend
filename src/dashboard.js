// Dashboard Management System
class Dashboard {
    constructor() {
        this.isDarkMode = false;
        this.isElectron = window.electronAPI !== undefined;
        this.events = JSON.parse(localStorage.getItem('gqueue-events') || '[]');

        // Add sample events if none exist
        if (this.events.length === 0) {
            this.addSampleEvents();
        }
        this.charts = {};

        this.init();
    }

    init() {
        this.initializeTheme();
        this.initializeCharts();
        this.bindEvents();
        this.renderEventsList();
        this.startDataSimulation();
    }

    // Theme Management
    initializeTheme() {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (systemPrefersDark) {
            this.enableDarkMode();
        } else {
            this.enableLightMode();
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (e.matches) {
                this.enableDarkMode();
            } else {
                this.enableLightMode();
            }
        });

        // Listen for Electron theme updates
        if (this.isElectron) {
            window.electronAPI.onThemeUpdated((event, isDark) => {
                if (isDark) {
                    this.enableDarkMode();
                } else {
                    this.enableLightMode();
                }
            });
        }
    }

    enableDarkMode() {
        document.documentElement.classList.add('dark');
        this.isDarkMode = true;
        this.updateChartsTheme();
    }

    enableLightMode() {
        document.documentElement.classList.remove('dark');
        this.isDarkMode = false;
        this.updateChartsTheme();
    }

    updateChartsTheme() {
        const textColor = this.isDarkMode ? '#f3f4f6' : '#374151';
        const gridColor = this.isDarkMode ? '#374151' : '#e5e7eb';

        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.options.scales.x.ticks.color = textColor;
                chart.options.scales.y.ticks.color = textColor;
                chart.options.scales.x.grid.color = gridColor;
                chart.options.scales.y.grid.color = gridColor;
                chart.options.plugins.legend.labels.color = textColor;
                chart.update();
            }
        });
    }

    // Charts Initialization
    initializeCharts() {
        Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
        Chart.defaults.font.size = 12;

        this.initRPMChart();
        this.initLagChart();
        this.initDLQChart();
    }

    initRPMChart() {
        const ctx = document.getElementById('rpmChart').getContext('2d');
        const textColor = this.isDarkMode ? '#f3f4f6' : '#374151';
        const gridColor = this.isDarkMode ? '#374151' : '#e5e7eb';

        this.charts.rpm = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'RPM',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        display: true,
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    y: {
                        display: true,
                        ticks: { color: textColor },
                        grid: { color: gridColor },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    initLagChart() {
        const ctx = document.getElementById('lagChart').getContext('2d');
        const textColor = this.isDarkMode ? '#f3f4f6' : '#374151';
        const gridColor = this.isDarkMode ? '#374151' : '#e5e7eb';

        this.charts.lag = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Latency (ms)',
                    data: [],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        display: true,
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    y: {
                        display: true,
                        ticks: { color: textColor },
                        grid: { color: gridColor },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    initDLQChart() {
        const ctx = document.getElementById('dlqChart').getContext('2d');
        const textColor = this.isDarkMode ? '#f3f4f6' : '#374151';
        const gridColor = this.isDarkMode ? '#374151' : '#e5e7eb';

        this.charts.dlq = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'DLQ RPM',
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        display: true,
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    y: {
                        display: true,
                        ticks: { color: textColor },
                        grid: { color: gridColor },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Event Handlers
    bindEvents() {
        // Theme toggle buttons
        document.getElementById('toggle-theme').addEventListener('click', async () => {
            if (this.isElectron) {
                const newTheme = await window.electronAPI.toggleDarkMode();
                if (newTheme) {
                    this.enableDarkMode();
                } else {
                    this.enableLightMode();
                }
            } else {
                if (this.isDarkMode) {
                    this.enableLightMode();
                } else {
                    this.enableDarkMode();
                }
            }
        });

        document.getElementById('system-theme').addEventListener('click', async () => {
            if (this.isElectron) {
                await window.electronAPI.useSystemTheme();
            }
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (systemPrefersDark) {
                this.enableDarkMode();
            } else {
                this.enableLightMode();
            }
        });

        // Modal handlers
        document.getElementById('add-event-btn').addEventListener('click', () => {
            this.openModal();
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.closeModal();
        });

        // Form submission
        document.getElementById('event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Close modal on background click
        document.getElementById('event-modal').addEventListener('click', (e) => {
            if (e.target.id === 'event-modal') {
                this.closeModal();
            }
        });
    }

    // Modal Management
    openModal() {
        document.getElementById('event-modal').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('event-modal').classList.remove('show');
        document.body.style.overflow = 'auto';
        this.resetForm();
    }

    resetForm() {
        document.getElementById('event-form').reset();
        document.getElementById('trigger-type').value = 'persistent';
        document.getElementById('queue-type').value = 'external.medium';
        document.getElementById('max-retries').value = '3';
        document.getElementById('retention').value = '168h';
        document.getElementById('unique-ttl').value = '60s';
    }

    // Form Handling
    handleFormSubmit() {
        const formData = new FormData(document.getElementById('event-form'));
        const event = {
            name: formData.get('name'),
            service_name: formData.get('service_name'),
            repo_url: formData.get('repo_url'),
            team_owner: formData.get('team_owner'),
            triggers: [{
                service_name: formData.get('trigger_service_name'),
                type: formData.get('trigger_type'),
                host: formData.get('trigger_host'),
                path: formData.get('trigger_path'),
                headers: {
                    "Content-Type": "application/json"
                },
                option: {
                    queue_type: formData.get('queue_type'),
                    max_retries: parseInt(formData.get('max_retries')),
                    retention: formData.get('retention'),
                    unique_ttl: formData.get('unique_ttl')
                }
            }],
            created_at: new Date().toISOString()
        };

        this.addEvent(event);
        this.closeModal();
    }

    // Event Management
    addEvent(event) {
        this.events.push(event);
        this.saveEvents();
        this.renderEventsList();
    }

    deleteEvent(index) {
        if (confirm('Are you sure you want to delete this event?')) {
            this.events.splice(index, 1);
            this.saveEvents();
            this.renderEventsList();
        }
    }

    saveEvents() {
        localStorage.setItem('gqueue-events', JSON.stringify(this.events));
    }

    getQueueTypeColor(queueType) {
        const colors = {
            'external.high': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            'external.medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            'external.low': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            'internal.medium': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        };
        return colors[queueType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }

    renderEventsList() {
        const container = document.getElementById('events-list');
        const noEventsMessage = document.getElementById('no-events');

        if (this.events.length === 0) {
            container.innerHTML = '';
            noEventsMessage.style.display = 'block';
            return;
        }

        noEventsMessage.style.display = 'none';
        container.innerHTML = this.events.map((event, index) => {
            const queueTypeColor = this.getQueueTypeColor(event.triggers[0].option.queue_type);
            const typeColor = event.triggers[0].type === 'persistent' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';

            return `
            <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-lg transition-all duration-200">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <div class="flex items-center flex-wrap gap-3 mb-3">
                            <h4 class="text-xl font-bold text-gray-900 dark:text-white">${event.name}</h4>
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                ${event.service_name}
                            </span>
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeColor}">
                                ${event.triggers[0].type}
                            </span>
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${queueTypeColor}">
                                ${event.triggers[0].option.queue_type}
                            </span>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 text-sm">
                            <div class="flex items-center space-x-2">
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                <span class="text
