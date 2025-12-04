import { Helpers } from '../utils/helpers.js';

/**
 * Employee model class
 */
export class Employee {
    constructor(data = {}) {
        this.id = data.id || Helpers.generateId();
        this.name = data.name || '';
        this.email = data.email || '';
        this.phone = data.phone || '';
        this.department = data.department || '';
        this.position = data.position || '';
        this.salary = data.salary || 0;
        this.hireDate = data.hireDate || new Date().toISOString();
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.avatar = data.avatar || this._generateAvatar();
        
        // Additional computed properties
        this.fullName = this.name;
        this.displaySalary = Helpers.formatCurrency(this.salary);
        this.formattedPhone = Helpers.formatPhone(this.phone);
    }

    /**
     * Generate avatar URL based on name
     * @returns {string} Avatar URL
     */
    _generateAvatar() {
        const initials = this.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        
        // Use a simple avatar service
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=2563eb&color=fff&size=40`;
    }

    /**
     * Validate employee data
     * @returns {Object} Validation result with isValid and errors
     */
    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length < 2) {
            errors.push('Name must be at least 2 characters long');
        }

        if (!this.email || !Helpers.isValidEmail(this.email)) {
            errors.push('Valid email address is required');
        }

        if (this.phone && !Helpers.isValidPhone(this.phone)) {
            errors.push('Phone number format is invalid');
        }

        if (!this.department || this.department.trim().length === 0) {
            errors.push('Department is required');
        }

        if (!this.position || this.position.trim().length < 2) {
            errors.push('Position must be at least 2 characters long');
        }

        if (this.salary && (isNaN(this.salary) || this.salary < 0)) {
            errors.push('Salary must be a positive number');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Update employee data
     * @param {Object} data - New data
     * @returns {Employee} Updated employee instance
     */
    update(data) {
        Object.keys(data).forEach(key => {
            if (this.hasOwnProperty(key) && key !== 'id') {
                this[key] = data[key];
            }
        });

        // Update computed properties
        this.fullName = this.name;
        this.displaySalary = Helpers.formatCurrency(this.salary);
        this.formattedPhone = Helpers.formatPhone(this.phone);
        this.avatar = this._generateAvatar();

        return this;
    }

    /**
     * Convert to plain object
     * @returns {Object} Plain object representation
     */
    toObject() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            phone: this.phone,
            department: this.department,
            position: this.position,
            salary: this.salary,
            hireDate: this.hireDate,
            isActive: this.isActive,
            avatar: this.avatar
        };
    }

    /**
     * Convert to JSON string
     * @returns {string} JSON representation
     */
    toJSON() {
        return JSON.stringify(this.toObject());
    }

    /**
     * Create Employee from API data
     * @param {Object} apiData - Data from external API
     * @returns {Employee} Employee instance
     */
    static fromApiData(apiData) {
        const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
        const positions = {
            'Engineering': ['Software Engineer', 'Senior Developer', 'Tech Lead', 'DevOps Engineer'],
            'Marketing': ['Marketing Manager', 'Content Creator', 'SEO Specialist', 'Brand Manager'],
            'Sales': ['Sales Representative', 'Account Manager', 'Sales Director', 'Business Development'],
            'HR': ['HR Manager', 'Recruiter', 'HR Specialist', 'People Operations'],
            'Finance': ['Financial Analyst', 'Accountant', 'Finance Manager', 'Controller'],
            'Operations': ['Operations Manager', 'Project Manager', 'Operations Analyst', 'Coordinator']
        };

        const randomDepartment = departments[Math.floor(Math.random() * departments.length)];
        const departmentPositions = positions[randomDepartment];
        const randomPosition = departmentPositions[Math.floor(Math.random() * departmentPositions.length)];
        const baseSalary = Math.floor(Math.random() * 80000) + 40000; // $40k - $120k

        return new Employee({
            id: apiData.id,
            name: apiData.name,
            email: apiData.email,
            phone: apiData.phone,
            department: randomDepartment,
            position: randomPosition,
            salary: baseSalary,
            hireDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 3).toISOString(), // Random date within last 3 years
            isActive: true
        });
    }

    /**
     * Get employee's years of service
     * @returns {number} Years of service
     */
    getYearsOfService() {
        const hireDate = new Date(this.hireDate);
        const now = new Date();
        return Math.floor((now - hireDate) / (365.25 * 24 * 60 * 60 * 1000));
    }

    /**
     * Get employee's initials
     * @returns {string} Initials
     */
    getInitials() {
        return this.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    /**
     * Check if employee matches search criteria
     * @param {string} searchTerm - Search term
     * @returns {boolean} Matches search
     */
    matchesSearch(searchTerm) {
        if (!searchTerm) return true;
        
        const term = searchTerm.toLowerCase();
        const searchFields = [
            this.name,
            this.email,
            this.department,
            this.position,
            this.phone
        ];

        return searchFields.some(field => 
            field && field.toString().toLowerCase().includes(term)
        );
    }

    /**
     * Check if employee belongs to department
     * @param {string} department - Department name
     * @returns {boolean} Belongs to department
     */
    belongsToDepartment(department) {
        if (!department) return true;
        return this.department === department;
    }
}