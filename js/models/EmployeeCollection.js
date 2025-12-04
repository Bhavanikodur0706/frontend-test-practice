import { Employee } from './Employee.js';
import { Helpers } from '../utils/helpers.js';

/**
 * Employee collection class for managing multiple employees
 */
export class EmployeeCollection {
    constructor() {
        this.employees = [];
        this.filteredEmployees = [];
        this.currentPage = 1;
        this.pageSize = 25;
        this.sortField = 'name';
        this.sortDirection = 'asc';
        this.searchTerm = '';
        this.departmentFilters = [];
        this.observers = [];
    }

    /**
     * Add observer for collection changes
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
     * Notify all observers of changes
     */
    notifyObservers() {
        this.observers.forEach(callback => callback(this));
    }

    /**
     * Add employee to collection
     * @param {Employee|Object} employeeData - Employee instance or data
     * @returns {Employee} Added employee
     */
    addEmployee(employeeData) {
        const employee = employeeData instanceof Employee 
            ? employeeData 
            : new Employee(employeeData);

        // Check for duplicate email
        if (this.findByEmail(employee.email)) {
            throw new Error('Employee with this email already exists');
        }

        this.employees.push(employee);
        this.applyFilters();
        this.notifyObservers();
        return employee;
    }

    /**
     * Update employee in collection
     * @param {string} id - Employee ID
     * @param {Object} data - Updated data
     * @returns {Employee|null} Updated employee
     */
    updateEmployee(id, data) {
        const employee = this.findById(id);
        if (!employee) return null;

        // Check for duplicate email (excluding current employee)
        if (data.email && data.email !== employee.email && this.findByEmail(data.email)) {
            throw new Error('Employee with this email already exists');
        }

        employee.update(data);
        this.applyFilters();
        this.notifyObservers();
        return employee;
    }

    /**
     * Remove employee from collection
     * @param {string} id - Employee ID
     * @returns {boolean} Success status
     */
    removeEmployee(id) {
        const index = this.employees.findIndex(emp => emp.id === id);
        if (index === -1) return false;

        this.employees.splice(index, 1);
        this.applyFilters();
        this.notifyObservers();
        return true;
    }

    /**
     * Soft delete employee (mark as inactive)
     * @param {string} id - Employee ID
     * @returns {boolean} Success status
     */
    deactivateEmployee(id) {
        const employee = this.findById(id);
        if (!employee) return false;

        employee.isActive = false;
        this.applyFilters();
        this.notifyObservers();
        return true;
    }

    /**
     * Find employee by ID
     * @param {string} id - Employee ID
     * @returns {Employee|null} Found employee
     */
    findById(id) {
        return this.employees.find(emp => emp.id === id) || null;
    }

    /**
     * Find employee by email
     * @param {string} email - Employee email
     * @returns {Employee|null} Found employee
     */
    findByEmail(email) {
        return this.employees.find(emp => emp.email.toLowerCase() === email.toLowerCase()) || null;
    }

    /**
     * Get all employees
     * @param {boolean} includeInactive - Include inactive employees
     * @returns {Array} Array of employees
     */
    getAllEmployees(includeInactive = true) {
        return includeInactive 
            ? [...this.employees] 
            : this.employees.filter(emp => emp.isActive);
    }

    /**
     * Get employees for current page
     * @returns {Array} Paginated employees
     */
    getCurrentPageEmployees() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        return this.filteredEmployees.slice(startIndex, endIndex);
    }

    /**
     * Set search term and apply filters
     * @param {string} term - Search term
     */
    setSearchTerm(term) {
        this.searchTerm = term;
        this.currentPage = 1; // Reset to first page
        this.applyFilters();
        this.notifyObservers();
    }

    /**
     * Set department filters
     * @param {Array} departments - Array of department names
     */
    setDepartmentFilters(departments) {
        // this.departmentFilters = departments;
        this.departmentFilters = Array.isArray(departments) ? departments : [];
        this.currentPage = 1; // Reset to first page
        this.applyFilters();
        this.notifyObservers();
    }

    /**
     * Set sorting
     * @param {string} field - Field to sort by
     * @param {string} direction - Sort direction (asc, desc)
     */
    setSorting(field, direction = 'asc') {
        this.sortField = field;
        this.sortDirection = direction;
        this.applyFilters();
        this.notifyObservers();
    }

    /**
     * Set page size
     * @param {number} size - Page size
     */
    setPageSize(size) {
        this.pageSize = parseInt(size);
        this.currentPage = 1; // Reset to first page
        this.notifyObservers();
    }

    /**
     * Set current page
     * @param {number} page - Page number
     */
    setCurrentPage(page) {
        const totalPages = this.getTotalPages();
        this.currentPage = Math.max(1, Math.min(page, totalPages));
        this.notifyObservers();
    }

    /**
     * Apply all filters and sorting
     */
    applyFilters() {
        let filtered = this.employees.filter(emp => emp.isActive);

        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(emp => emp.matchesSearch(this.searchTerm));
        }

        // Apply department filters
        if (this.departmentFilters.length > 0) {
            filtered = filtered.filter(emp => 
                this.departmentFilters.includes(emp.department)
            );
        }

        // Apply sorting
        filtered = Helpers.sortByProperty(filtered, this.sortField, this.sortDirection);

        this.filteredEmployees = filtered;
    }

    /**
     * Get total number of pages
     * @returns {number} Total pages
     */
    getTotalPages() {
        return Math.ceil(this.filteredEmployees.length / this.pageSize);
    }

    /**
     * Get pagination info
     * @returns {Object} Pagination information
     */
    getPaginationInfo() {
        const totalItems = this.filteredEmployees.length;
        const totalPages = this.getTotalPages();
        const startIndex = (this.currentPage - 1) * this.pageSize + 1;
        const endIndex = Math.min(startIndex + this.pageSize - 1, totalItems);

        return {
            currentPage: this.currentPage,
            totalPages,
            totalItems,
            pageSize: this.pageSize,
            startIndex: totalItems > 0 ? startIndex : 0,
            endIndex: totalItems > 0 ? endIndex : 0,
            hasNext: this.currentPage < totalPages,
            hasPrevious: this.currentPage > 1
        };
    }

    /**
     * Get unique departments
     * @returns {Array} Array of unique departments
     */
    getUniqueDepartments() {
        const departments = this.employees
            .filter(emp => emp.isActive)
            .map(emp => emp.department)
            .filter(dept => dept && dept.trim());
        
        return [...new Set(departments)].sort();
    }

    /**
     * Get statistics
     * @returns {Object} Collection statistics
     */
    getStatistics() {
        const activeEmployees = this.employees.filter(emp => emp.isActive);
        const totalEmployees = activeEmployees.length;
        
        const departmentCounts = {};
        const salarySum = activeEmployees.reduce((sum, emp) => {
            // Count by department
            departmentCounts[emp.department] = (departmentCounts[emp.department] || 0) + 1;
            return sum + (emp.salary || 0);
        }, 0);

        const avgSalary = totalEmployees > 0 ? salarySum / totalEmployees : 0;

        return {
            totalEmployees,
            totalFiltered: this.filteredEmployees.length,
            departmentCounts,
            averageSalary: avgSalary,
            totalSalaryBudget: salarySum
        };
    }

    /**
     * Export data as CSV
     * @returns {string} CSV string
     */
    exportAsCSV() {
        const data = this.filteredEmployees.map(emp => ({
            'Name': emp.name,
            'Email': emp.email,
            'Phone': emp.formattedPhone,
            'Department': emp.department,
            'Position': emp.position,
            'Salary': emp.displaySalary,
            'Hire Date': Helpers.formatDate(emp.hireDate),
            'Years of Service': emp.getYearsOfService()
        }));

        return Helpers.objectToCSV(data);
    }

    /**
     * Export data as JSON
     * @returns {string} JSON string
     */
    exportAsJSON() {
        const data = this.filteredEmployees.map(emp => emp.toObject());
        return JSON.stringify(data, null, 2);
    }

    /**
     * Load employees from array
     * @param {Array} employeesData - Array of employee data
     */
    loadEmployees(employeesData) {
        this.employees = employeesData.map(data => 
            data instanceof Employee ? data : new Employee(data)
        );
        this.applyFilters();
        this.notifyObservers();
    }

    /**
     * Clear all employees
     */
    clear() {
        this.employees = [];
        this.filteredEmployees = [];
        this.currentPage = 1;
        this.notifyObservers();
    }

    /**
     * Get next page
     */
    nextPage() {
        if (this.currentPage < this.getTotalPages()) {
            this.setCurrentPage(this.currentPage + 1);
        }
    }

    /**
     * Get previous page
     */
    previousPage() {
        if (this.currentPage > 1) {
            this.setCurrentPage(this.currentPage - 1);
        }
    }

     /**
     * Clear all filters
     */
    clearAllFilters() {
        this.searchTerm = '';
        this.departmentFilters = [];
        this.currentPage = 1;
        this.applyFilters();
        this.notifyObservers();
    }

    /**
     * Check if any filters are active
     * @returns {boolean} True if filters are active
     */
    hasActiveFilters() {
        return this.searchTerm.length > 0 || this.departmentFilters.length > 0;
    }
}