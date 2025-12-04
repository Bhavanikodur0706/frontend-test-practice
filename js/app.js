import { DataService } from './services/DataService.js';
import { TableComponent } from './components/TableComponent.js';
import { SearchComponent } from './components/SearchComponent.js';
import { PaginationComponent } from './components/PaginationComponent.js';
import { Helpers } from './utils/helpers.js';

/**
 * Main application class
 */
class EmployeeManagementApp {
    constructor() {
        this.dataService = new DataService();
        this.tableComponent = null;
        this.searchComponent = null;
        this.paginationComponent = null;
        
        // Modal elements
        this.employeeModal = null;
        this.confirmModal = null;
        this.employeeForm = null;
        
        // Current editing employee
        this.editingEmployeeId = null;
        
        // Filter elements
        this.departmentFilter = null;
        this.pageSizeSelect = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing Employee Management System...');
            
            // Initialize DOM elements
            this.initializeElements();
            
            // Initialize components
            this.initializeComponents();
            
            // Bind events
            this.bindEvents();
            
            // Initialize data service and load data
            await this.dataService.initialize();
            
            // Set up observers
            this.setupObservers();
            
            // Initial render
            this.render();
            
            console.log('Employee Management System initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            Helpers.showToast('Failed to initialize application. Please refresh the page.', 'error');
        }
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        // Modal elements
        this.employeeModal = document.getElementById('employeeModal');
        this.confirmModal = document.getElementById('confirmModal');
        this.employeeForm = document.getElementById('employeeForm');
        
        // Filter elements
        this.departmentFilter = document.getElementById('departmentFilter');
        this.pageSizeSelect = document.getElementById('pageSize');
        
        // Containers
        this.tableContainer = document.getElementById('tableContainer');
        this.searchContainer = document.getElementById('searchContainer');
        this.paginationContainer = document.getElementById('paginationContainer');
    }

    /**
     * Initialize components
     */
    initializeComponents() {
        // Initialize table component
        this.tableComponent = new TableComponent(this.tableContainer, {
            onEdit: (id) => this.editEmployee(id),
            onDelete: (id) => this.deleteEmployee(id),
            onSort: (field, direction) => this.handleSort(field, direction),
            virtualScrolling: true
        });

        // Initialize search component
        this.searchComponent = new SearchComponent(this.searchContainer, (searchTerm) => {
            this.dataService.searchEmployees(searchTerm);
        });

        // Initialize pagination component
        this.paginationComponent = new PaginationComponent(this.paginationContainer, (page) => {
            this.dataService.setCurrentPage(page);
        });
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Add employee button
        document.getElementById('addEmployeeBtn')?.addEventListener('click', () => {
            this.showAddEmployeeModal();
        });

        // Export buttons
        document.getElementById('exportBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleExportMenu();
        });

        document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
            this.exportData('csv');
            this.hideExportMenu();
        });

        document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
            this.exportData('json');
            this.hideExportMenu();
        });

        // Close export menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.export-dropdown')) {
                this.hideExportMenu();
            }
        });

        // Department filter
        // this.departmentFilter?.addEventListener('change', () => {
        //     const selectedDepartments = Array.from(this.departmentFilter.selectedOptions)
        //         .map(option => option.value)
        //         .filter(value => value !== '');
        // Department filter - Fixed to handle "All Departments" correctly
        // this.departmentFilter?.addEventListener('change', () => {
        //     const selectedOptions = Array.from(this.departmentFilter.selectedOptions);
        //     let selectedDepartments = selectedOptions
        //         .map(option => option.value)
        //         .filter(value => value !== ''); // Remove empty values
            
        //     // If "All Departments" is selected or no specific departments are selected, show all
        //     if (selectedDepartments.length === 0 || selectedOptions.some(opt => opt.value === '')) {
        //         selectedDepartments = [];
        //     }
            
        //     this.dataService.filterByDepartments(selectedDepartments);
        // });

    //    trying new filter
          this.departmentFilter?.addEventListener('change', () => {
    const selectedOptions = Array.from(this.departmentFilter.selectedOptions)
        .map(option => option.value)
        .filter(value => value !== ''); // Ignore empty value ("All Departments")

    // If nothing selected, show all departments
    const departmentsToFilter = selectedOptions.length > 0 ? selectedOptions : [];

    this.dataService.filterByDepartments(departmentsToFilter);
});




        // Page size selector
        this.pageSizeSelect?.addEventListener('change', () => {
            this.dataService.setPageSize(parseInt(this.pageSizeSelect.value));
        });

        // Modal events
        this.bindModalEvents();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    /**
     * Bind modal event listeners
     */
    bindModalEvents() {
        // Employee modal
        document.getElementById('modalClose')?.addEventListener('click', () => {
            this.hideEmployeeModal();
        });

        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            this.hideEmployeeModal();
        });

        this.employeeForm?.addEventListener('submit', (e) => {
            this.handleEmployeeFormSubmit(e);
        });

        // Confirm modal
        document.getElementById('confirmModalClose')?.addEventListener('click', () => {
            this.hideConfirmModal();
        });

        document.getElementById('confirmCancelBtn')?.addEventListener('click', () => {
            this.hideConfirmModal();
        });

        document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
            this.confirmDelete();
        });

        // Close modals when clicking outside
        this.employeeModal?.addEventListener('click', (e) => {
            if (e.target === this.employeeModal) {
                this.hideEmployeeModal();
            }
        });

        this.confirmModal?.addEventListener('click', (e) => {
            if (e.target === this.confirmModal) {
                this.hideConfirmModal();
            }
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideEmployeeModal();
                this.hideConfirmModal();
            }
        });
    }

    /**
     * Setup data service observers
     */
    setupObservers() {
        // Listen to collection changes
        this.dataService.getEmployeeCollection().addObserver(() => {
            this.render();
        });

        // Listen to service events
        this.dataService.addObserver((event, data) => {
            this.handleDataServiceEvent(event, data);
        });
    }

    /**
     * Handle data service events
     * @param {string} event - Event type
     * @param {*} data - Event data
     */
    handleDataServiceEvent(event, data) {
        switch (event) {
            case 'loading_changed':
                this.handleLoadingChange(data.isLoading);
                break;
            case 'init_complete':
                this.updateDepartmentFilter();
                break;
            case 'add_complete':
            case 'update_complete':
            case 'delete_complete':
                this.updateDepartmentFilter();
                break;
        }
    }

    /**
     * Handle loading state changes
     * @param {boolean} isLoading - Loading state
     */
    handleLoadingChange(isLoading) {
        // Update components loading state
        this.tableComponent?.setLoading(isLoading);
        this.paginationComponent?.setLoading(isLoading);
        this.searchComponent?.setDisabled(isLoading);
        
        // Update filter controls
        if (this.departmentFilter) {
            this.departmentFilter.disabled = isLoading;
        }
        if (this.pageSizeSelect) {
            this.pageSizeSelect.disabled = isLoading;
        }
    }

    /**
     * Render the application
     */
    render() {
        const collection = this.dataService.getEmployeeCollection();
        const employees = collection.getCurrentPageEmployees();
        const paginationInfo = collection.getPaginationInfo();
        const sortInfo = {
            field: collection.sortField,
            direction: collection.sortDirection
        };

        // Update components
        this.tableComponent.update(employees, sortInfo);
        this.paginationComponent.update(paginationInfo);
    }

    /**
     * Show add employee modal
     */
    showAddEmployeeModal() {
        this.editingEmployeeId = null;
        document.getElementById('modalTitle').textContent = 'Add New Employee';
        document.getElementById('saveBtn').textContent = 'Save Employee';
        
        this.employeeForm.reset();
        this.clearFormErrors();
        this.showEmployeeModal();
    }

    /**
     * Edit employee
     * @param {string} id - Employee ID
     */
    editEmployee(id) {
        const employee = this.dataService.getEmployeeCollection().findById(id);
        if (!employee) {
            Helpers.showToast('Employee not found', 'error');
            return;
        }

        this.editingEmployeeId = id;
        document.getElementById('modalTitle').textContent = 'Edit Employee';
        document.getElementById('saveBtn').textContent = 'Update Employee';

        // Populate form
        document.getElementById('employeeName').value = employee.name;
        document.getElementById('employeeEmail').value = employee.email;
        document.getElementById('employeePhone').value = employee.phone;
        document.getElementById('employeeDepartment').value = employee.department;
        document.getElementById('employeePosition').value = employee.position;
        document.getElementById('employeeSalary').value = employee.salary;

        this.clearFormErrors();
        this.showEmployeeModal();
    }

    /**
     * Delete employee
     * @param {string} id - Employee ID
     */
    deleteEmployee(id) {
        const employee = this.dataService.getEmployeeCollection().findById(id);
        if (!employee) {
            Helpers.showToast('Employee not found', 'error');
            return;
        }

        this.deletingEmployeeId = id;
        document.getElementById('confirmMessage').textContent = 
            `Are you sure you want to delete ${employee.name}? This action cannot be undone.`;
        
        this.showConfirmModal();
    }

    /**
     * Handle employee form submission
     * @param {Event} event - Form submit event
     */
    async handleEmployeeFormSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(this.employeeForm);
        const employeeData = {
            name: formData.get('name').trim(),
            email: formData.get('email').trim(),
            phone: formData.get('phone').trim(),
            department: formData.get('department'),
            position: formData.get('position').trim(),
            salary: formData.get('salary') ? parseInt(formData.get('salary')) : 0
        };

        try {
            if (this.editingEmployeeId) {
                await this.dataService.updateEmployee(this.editingEmployeeId, employeeData);
            } else {
                await this.dataService.addEmployee(employeeData);
            }
            
            this.hideEmployeeModal();
        } catch (error) {
            this.displayFormErrors(error.message);
        }
    }

    /**
     * Confirm delete action
     */
    async confirmDelete() {
        if (this.deletingEmployeeId) {
            try {
                await this.dataService.deleteEmployee(this.deletingEmployeeId);
                this.hideConfirmModal();
            } catch (error) {
                console.error('Delete failed:', error);
            }
        }
    }

    /**
     * Handle sorting
     * @param {string} field - Sort field
     * @param {string} direction - Sort direction
     */
    handleSort(field, direction) {
        this.dataService.sortEmployees(field, direction);
    }

    /**
     * Handle keyboard shortcuts
     * @param {Event} event - Keyboard event
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + K to focus search
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            this.searchComponent.focus();
        }
        
        // Ctrl/Cmd + N to add new employee
        if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
            event.preventDefault();
            this.showAddEmployeeModal();
        }
    }

    /**
     * Export data
     * @param {string} format - Export format (csv, json)
     */
    exportData(format) {
        try {
            if (format === 'csv') {
                this.dataService.exportAsCSV();
            } else if (format === 'json') {
                this.dataService.exportAsJSON();
            }
        } catch (error) {
            console.error('Export failed:', error);
        }
    }

    /**
     * Update department filter options
     */
    // updateDepartmentFilter() {
    //     if (!this.departmentFilter) return;

    //     const departments = this.dataService.getEmployeeCollection().getUniqueDepartments();
    //     const currentValues = Array.from(this.departmentFilter.selectedOptions).map(opt => opt.value);
        
    //     // Clear existing options except "All Departments"
    //     while (this.departmentFilter.children.length > 1) {
    //         this.departmentFilter.removeChild(this.departmentFilter.lastChild);
    //     }
        
    //     // Add department options
    //     // departments.forEach(department => {
    //     //     const option = document.createElement('option');
    //     //     option.value = department;
    //     //     option.textContent = department;
    //     //     option.selected = currentValues.includes(department);
    //     //     this.departmentFilter.appendChild(option);
    //     // });
    //     departments.forEach(department => {
    //         const option = document.createElement('option');
    //         option.value = department;
    //         option.textContent = department;
    //         // Only select if it was previously selected and not the "All Departments" option
    //         option.selected = currentValues.includes(department) && !currentValues.includes('');
    //         this.departmentFilter.appendChild(option);
    //     });
        
    //     // Ensure "All Departments" is selected by default if no specific departments are selected
    //     if (currentValues.length === 0 || currentValues.includes('')) {
    //         this.departmentFilter.children[0].selected = true;
    //         // Clear any other selections
    //         for (let i = 1; i < this.departmentFilter.children.length; i++) {
    //             this.departmentFilter.children[i].selected = false;
    //         }
    //     }
    // }
    // new trying update
    updateDepartmentFilter() {
    if (!this.departmentFilter) return;

    const departments = this.dataService.getEmployeeCollection().getUniqueDepartments();
    const currentValues = Array.from(this.departmentFilter.selectedOptions).map(opt => opt.value);

    // Clear existing options
    this.departmentFilter.innerHTML = '';

    // Add "All Departments" option
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'All Departments';
    allOption.selected = currentValues.length === 0 || currentValues.includes('');
    this.departmentFilter.appendChild(allOption);

    // Add unique department options
    departments.forEach(department => {
        const option = document.createElement('option');
        option.value = department;
        option.textContent = department;
        option.selected = currentValues.includes(department);
        this.departmentFilter.appendChild(option);
    });
}



    /**
     * Show employee modal
     */
    showEmployeeModal() {
        this.employeeModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        setTimeout(() => {
            document.getElementById('employeeName')?.focus();
        }, 100);
    }

    /**
     * Hide employee modal
     */
    hideEmployeeModal() {
        this.employeeModal.classList.remove('show');
        document.body.style.overflow = '';
        this.editingEmployeeId = null;
        this.clearFormErrors();
    }

    /**
     * Show confirm modal
     */
    showConfirmModal() {
        this.confirmModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Hide confirm modal
     */
    hideConfirmModal() {
        this.confirmModal.classList.remove('show');
        document.body.style.overflow = '';
        this.deletingEmployeeId = null;
    }

    /**
     * Toggle export menu
     */
    toggleExportMenu() {
        const menu = document.getElementById('exportMenu');
        menu.classList.toggle('show');
    }

    /**
     * Hide export menu
     */
    hideExportMenu() {
        const menu = document.getElementById('exportMenu');
        menu.classList.remove('show');
    }

    /**
     * Display form validation errors
     * @param {string} errorMessage - Error message
     */
    displayFormErrors(errorMessage) {
        // Clear previous errors
        this.clearFormErrors();
        
        // Show general error
        Helpers.showToast(errorMessage, 'error');
        
        // You could also highlight specific fields here based on the error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = errorMessage;
        
        const firstInput = this.employeeForm.querySelector('input');
        if (firstInput) {
            firstInput.parentElement.appendChild(errorDiv);
            firstInput.classList.add('error');
        }
    }

    /**
     * Clear form validation errors
     */
    clearFormErrors() {
        const errorMessages = this.employeeForm.querySelectorAll('.error-message');
        errorMessages.forEach(error => error.remove());
        
        const errorInputs = this.employeeForm.querySelectorAll('.error');
        errorInputs.forEach(input => input.classList.remove('error'));
    }

    /**
     * Get application statistics
     * @returns {Object} Application statistics
     */
    getStatistics() {
        return this.dataService.getStatistics();
    }

    /**
     * Refresh data
     */
    async refreshData() {
        try {
            await this.dataService.refresh();
        } catch (error) {
            console.error('Refresh failed:', error);
        }
    }

    /**
     * Destroy the application
     */
    destroy() {
        // Cleanup components
        this.tableComponent?.destroy();
        this.searchComponent?.destroy();
        this.paginationComponent?.destroy();
        
        // Cleanup data service
        this.dataService?.destroy();
        
        // Remove global reference
        delete window.employeeApp;
        
        console.log('Employee Management App destroyed');
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.employeeApp = new EmployeeManagementApp();
        console.log('Employee Management System loaded successfully');
    } catch (error) {
        console.error('Failed to load Employee Management System:', error);
        Helpers.showToast('Failed to load application. Please refresh the page.', 'error');
    }
});

// Export for module usage
export default EmployeeManagementApp;