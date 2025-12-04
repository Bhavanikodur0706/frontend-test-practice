import { EmployeeAPI } from '../api/EmployeeAPI.js';
import { EmployeeCollection } from '../models/EmployeeCollection.js';
import { Employee } from '../models/Employee.js';
import { Helpers } from '../utils/helpers.js';

/**
 * Data service class - coordinates between API and UI
 */
export class DataService {
    constructor() {
        this.api = new EmployeeAPI();
        this.employeeCollection = new EmployeeCollection();
        this.isLoading = false;
        this.lastSync = null;
        this.syncInterval = null;
        this.observers = [];
    }

    /**
     * Add observer for service events
     * @param {Function} callback - Callback function
     */
    addObserver(callback) {
        this.observers.push(callback);
    }

    /**
     * Remove observer
     * @param {Function} callback - Callback function to remove
     */
    removeObserver(callback) {
        this.observers = this.observers.filter(obs => obs !== callback);
    }

    /**
     * Notify observers of service events
     * @param {string} event - Event type
     * @param {*} data - Event data
     */
    notifyObservers(event, data) {
        this.observers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Observer callback error:', error);
            }
        });
    }

    /**
     * Initialize the service and load initial data
     * @returns {Promise} Initialization promise
     */
    async initialize() {
        try {
            this.setLoading(true);
            this.notifyObservers('init_start');

            console.log('Initializing DataService...');
            
            // Check API health
            const apiHealthy = await this.api.healthCheck();
            if (!apiHealthy) {
                console.warn('API health check failed, using mock data');
            }

            // Load employees
            await this.loadEmployees();
            
            this.lastSync = new Date();
            this.notifyObservers('init_complete', {
                employeeCount: this.employeeCollection.getAllEmployees().length
            });

            console.log('DataService initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize DataService:', error);
            this.notifyObservers('init_error', error);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Load employees from API
     * @param {boolean} forceRefresh - Force refresh from API
     * @returns {Promise} Load promise
     */
    async loadEmployees(forceRefresh = false) {
        try {
            this.setLoading(true);
            this.notifyObservers('load_start');

            let employees;
            
            if (forceRefresh) {
                this.api.clearCache();
            }

            employees = await this.api.fetchEmployees();
            
            // Load into collection
            this.employeeCollection.loadEmployees(employees);
            
            this.lastSync = new Date();
            this.notifyObservers('load_complete', {
                employeeCount: employees.length
            });

            Helpers.showToast(`Loaded ${employees.length} employees successfully`, 'success');
            
        } catch (error) {
            console.error('Failed to load employees:', error);
            this.notifyObservers('load_error', error);
            Helpers.showToast('Failed to load employees. Using cached data.', 'warning');
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Add new employee
     * @param {Object} employeeData - Employee data
     * @returns {Promise<Employee>} Created employee
     */
    async addEmployee(employeeData) {
        try {
            this.setLoading(true);
            this.notifyObservers('add_start', employeeData);

            // Validate data
            const employee = new Employee(employeeData);
            const validation = employee.validate();
            
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }

            // Try to create via API (simulated)
            try {
                await this.api.createEmployee(employee.toObject());
            } catch (apiError) {
                console.warn('API create failed, continuing with local add:', apiError.message);
            }

            // Add to collection
            const addedEmployee = this.employeeCollection.addEmployee(employee);
            
            this.notifyObservers('add_complete', addedEmployee);
            Helpers.showToast(`Employee ${addedEmployee.name} added successfully`, 'success');
            
            return addedEmployee;
            
        } catch (error) {
            console.error('Failed to add employee:', error);
            this.notifyObservers('add_error', error);
            Helpers.showToast(`Failed to add employee: ${error.message}`, 'error');
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Update existing employee
     * @param {string} id - Employee ID
     * @param {Object} employeeData - Updated employee data
     * @returns {Promise<Employee>} Updated employee
     */
    async updateEmployee(id, employeeData) {
        try {
            this.setLoading(true);
            this.notifyObservers('update_start', { id, data: employeeData });

            // Validate data
            const tempEmployee = new Employee({ ...employeeData, id });
            const validation = tempEmployee.validate();
            
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }

            // Try to update via API (simulated)
            try {
                await this.api.updateEmployee(id, employeeData);
            } catch (apiError) {
                console.warn('API update failed, continuing with local update:', apiError.message);
            }

            // Update in collection
            const updatedEmployee = this.employeeCollection.updateEmployee(id, employeeData);
            
            if (!updatedEmployee) {
                throw new Error('Employee not found');
            }
            
            this.notifyObservers('update_complete', updatedEmployee);
            Helpers.showToast(`Employee ${updatedEmployee.name} updated successfully`, 'success');
            
            return updatedEmployee;
            
        } catch (error) {
            console.error('Failed to update employee:', error);
            this.notifyObservers('update_error', error);
            Helpers.showToast(`Failed to update employee: ${error.message}`, 'error');
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Delete employee
     * @param {string} id - Employee ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteEmployee(id) {
        try {
            this.setLoading(true);
            
            const employee = this.employeeCollection.findById(id);
            if (!employee) {
                throw new Error('Employee not found');
            }

            this.notifyObservers('delete_start', { id, employee });

            // Try to delete via API (simulated)
            try {
                await this.api.deleteEmployee(id);
            } catch (apiError) {
                console.warn('API delete failed, continuing with local delete:', apiError.message);
            }

            // Remove from collection
            const success = this.employeeCollection.removeEmployee(id);
            
            if (!success) {
                throw new Error('Failed to remove employee from collection');
            }
            
            this.notifyObservers('delete_complete', { id, employee });
            Helpers.showToast(`Employee ${employee.name} deleted successfully`, 'success');
            
            return true;
            
        } catch (error) {
            console.error('Failed to delete employee:', error);
            this.notifyObservers('delete_error', error);
            Helpers.showToast(`Failed to delete employee: ${error.message}`, 'error');
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Search employees
     * @param {string} searchTerm - Search term
     */
    searchEmployees(searchTerm) {
        this.employeeCollection.setSearchTerm(searchTerm);
        this.notifyObservers('search_applied', { searchTerm });
    }

    /**
     * Filter employees by departments
     * @param {Array} departments - Array of department names
     */
    filterByDepartments(departments) {
        this.employeeCollection.setDepartmentFilters(departments);
        this.notifyObservers('filter_applied', { departments });
    }

    /**
     * Sort employees
     * @param {string} field - Field to sort by
     * @param {string} direction - Sort direction
     */
    sortEmployees(field, direction) {
        this.employeeCollection.setSorting(field, direction);
        this.notifyObservers('sort_applied', { field, direction });
    }

    /**
     * Set page size
     * @param {number} size - Page size
     */
    setPageSize(size) {
        this.employeeCollection.setPageSize(size);
        this.notifyObservers('page_size_changed', { size });
    }

    /**
     * Set current page
     * @param {number} page - Page number
     */
    setCurrentPage(page) {
        this.employeeCollection.setCurrentPage(page);
        this.notifyObservers('page_changed', { page });
    }

    /**
     * Export employees as CSV
     * @returns {string} CSV data
     */
    exportAsCSV() {
        try {
            const csv = this.employeeCollection.exportAsCSV();
            const filename = `employees_${new Date().toISOString().split('T')[0]}.csv`;
            Helpers.downloadFile(csv, filename, 'text/csv');
            
            this.notifyObservers('export_complete', { format: 'csv', filename });
            Helpers.showToast('Employee data exported as CSV', 'success');
            
            return csv;
        } catch (error) {
            console.error('Failed to export CSV:', error);
            Helpers.showToast('Failed to export CSV data', 'error');
            throw error;
        }
    }

    /**
     * Export employees as JSON
     * @returns {string} JSON data
     */
    exportAsJSON() {
        try {
            const json = this.employeeCollection.exportAsJSON();
            const filename = `employees_${new Date().toISOString().split('T')[0]}.json`;
            Helpers.downloadFile(json, filename, 'application/json');
            
            this.notifyObservers('export_complete', { format: 'json', filename });
            Helpers.showToast('Employee data exported as JSON', 'success');
            
            return json;
        } catch (error) {
            console.error('Failed to export JSON:', error);
            Helpers.showToast('Failed to export JSON data', 'error');
            throw error;
        }
    }

    /**
     * Get employee collection
     * @returns {EmployeeCollection} Employee collection
     */
    getEmployeeCollection() {
        return this.employeeCollection;
    }

    /**
     * Get service statistics
     * @returns {Object} Service statistics
     */
    getStatistics() {
        return {
            ...this.employeeCollection.getStatistics(),
            lastSync: this.lastSync,
            isLoading: this.isLoading,
            apiCacheStats: this.api.getCacheStats()
        };
    }

    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoading(loading) {
        if (this.isLoading !== loading) {
            this.isLoading = loading;
            this.notifyObservers('loading_changed', { isLoading: loading });
            Helpers.showLoading(loading);
        }
    }

    /**
     * Refresh data from API
     * @returns {Promise} Refresh promise
     */
    async refresh() {
        return await this.loadEmployees(true);
    }

    /**
     * Start auto-sync interval
     * @param {number} intervalMs - Interval in milliseconds
     */
    startAutoSync(intervalMs = 5 * 60 * 1000) { // 5 minutes default
        this.stopAutoSync();
        this.syncInterval = setInterval(async () => {
            try {
                console.log('Auto-syncing employee data...');
                await this.loadEmployees(true);
            } catch (error) {
                console.error('Auto-sync failed:', error);
            }
        }, intervalMs);
        
        console.log(`Auto-sync started with ${intervalMs}ms interval`);
    }

    /**
     * Stop auto-sync interval
     */
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('Auto-sync stopped');
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stopAutoSync();
        this.observers = [];
        this.api.clearCache();
        console.log('DataService destroyed');
    }
}