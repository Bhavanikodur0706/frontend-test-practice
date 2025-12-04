import { Employee } from '../models/Employee.js';

/**
 * Employee API class for handling HTTP requests
 */
export class EmployeeAPI {
    constructor() {
        this.baseURL = 'https://jsonplaceholder.typicode.com';
        this.endpoints = {
            users: '/users',
            posts: '/posts',
            albums: '/albums'
        };
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Generic HTTP request method
     * @param {string} url - Request URL
     * @param {Object} options - Request options
     * @returns {Promise} Response promise
     */
    async request(url, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw new Error(`Network request failed: ${error.message}`);
        }
    }

    /**
     * GET request with caching
     * @param {string} endpoint - API endpoint
     * @param {boolean} useCache - Whether to use cache
     * @returns {Promise} Response data
     */
    async get(endpoint, useCache = true) {
        const url = `${this.baseURL}${endpoint}`;
        const cacheKey = `GET_${url}`;

        // Check cache first
        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('Returning cached data for:', endpoint);
                return cached.data;
            }
        }

        const data = await this.request(url, { method: 'GET' });

        // Cache the result
        if (useCache) {
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
        }

        return data;
    }

    /**
     * POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @returns {Promise} Response data
     */
    async post(endpoint, data) {
        const url = `${this.baseURL}${endpoint}`;
        return await this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @returns {Promise} Response data
     */
    async put(endpoint, data) {
        const url = `${this.baseURL}${endpoint}`;
        return await this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     * @param {string} endpoint - API endpoint
     * @returns {Promise} Response data
     */
    async delete(endpoint) {
        const url = `${this.baseURL}${endpoint}`;
        return await this.request(url, { method: 'DELETE' });
    }

    /**
     * Fetch all users from JSONPlaceholder
     * @returns {Promise<Array>} Array of user data
     */
    async fetchUsers() {
        try {
            console.log('Fetching users from JSONPlaceholder API...');
            const users = await this.get(this.endpoints.users);
            console.log(`Successfully fetched ${users.length} users`);
            return users;
        } catch (error) {
            console.error('Failed to fetch users:', error);
            throw error;
        }
    }

    /**
     * Fetch single user by ID
     * @param {number} id - User ID
     * @returns {Promise<Object>} User data
     */
    async fetchUser(id) {
        try {
            const user = await this.get(`${this.endpoints.users}/${id}`);
            return user;
        } catch (error) {
            console.error(`Failed to fetch user ${id}:`, error);
            throw error;
        }
    }

    /**
     * Convert API users to Employee instances
     * @returns {Promise<Array>} Array of Employee instances
     */
    async fetchEmployees() {
        try {
            const users = await this.fetchUsers();
            const employees = users.map(user => Employee.fromApiData(user));
            
            console.log(`Converted ${employees.length} users to employees`);
            return employees;
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            // Return mock data if API fails
            return this.getMockEmployees();
        }
    }

    /**
     * Simulate creating a new employee (JSONPlaceholder doesn't persist)
     * @param {Object} employeeData - Employee data
     * @returns {Promise<Object>} Created employee data
     */
    async createEmployee(employeeData) {
        try {
            // Simulate API call
            const response = await this.post(this.endpoints.users, employeeData);
            console.log('Employee created (simulated):', response);
            
            // Since JSONPlaceholder doesn't persist, return the data with a fake ID
            return {
                ...employeeData,
                id: Date.now() // Use timestamp as fake ID
            };
        } catch (error) {
            console.error('Failed to create employee:', error);
            throw error;
        }
    }

    /**
     * Simulate updating an employee
     * @param {string} id - Employee ID
     * @param {Object} employeeData - Updated employee data
     * @returns {Promise<Object>} Updated employee data
     */
    async updateEmployee(id, employeeData) {
        try {
            const response = await this.put(`${this.endpoints.users}/${id}`, employeeData);
            console.log('Employee updated (simulated):', response);
            return { ...employeeData, id };
        } catch (error) {
            console.error(`Failed to update employee ${id}:`, error);
            throw error;
        }
    }

    /**
     * Simulate deleting an employee
     * @param {string} id - Employee ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteEmployee(id) {
        try {
            await this.delete(`${this.endpoints.users}/${id}`);
            console.log(`Employee ${id} deleted (simulated)`);
            return true;
        } catch (error) {
            console.error(`Failed to delete employee ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get mock employee data as fallback
     * @returns {Array} Array of Employee instances
     */
    getMockEmployees() {
        const mockData = [
            {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@company.com',
                phone: '(555) 123-4567',
                department: 'Engineering',
                position: 'Senior Software Engineer',
                salary: 95000,
                hireDate: '2021-03-15T00:00:00.000Z'
            },
            {
                id: 2,
                name: 'Jane Smith',
                email: 'jane.smith@company.com',
                phone: '(555) 234-5678',
                department: 'Marketing',
                position: 'Marketing Manager',
                salary: 75000,
                hireDate: '2020-08-22T00:00:00.000Z'
            },
            {
                id: 3,
                name: 'Mike Johnson',
                email: 'mike.johnson@company.com',
                phone: '(555) 345-6789',
                department: 'Sales',
                position: 'Sales Representative',
                salary: 60000,
                hireDate: '2022-01-10T00:00:00.000Z'
            },
            {
                id: 4,
                name: 'Sarah Wilson',
                email: 'sarah.wilson@company.com',
                phone: '(555) 456-7890',
                department: 'HR',
                position: 'HR Manager',
                salary: 70000,
                hireDate: '2019-11-05T00:00:00.000Z'
            },
            {
                id: 5,
                name: 'David Brown',
                email: 'david.brown@company.com',
                phone: '(555) 567-8901',
                department: 'Finance',
                position: 'Financial Analyst',
                salary: 65000,
                hireDate: '2021-09-18T00:00:00.000Z'
            }
        ];

        console.log('Using mock employee data');
        return mockData.map(data => new Employee(data));
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('API cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    /**
     * Simulate network delay for testing
     * @param {number} ms - Delay in milliseconds
     * @returns {Promise} Delay promise
     */
    async delay(ms = 1000) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Health check for API
     * @returns {Promise<boolean>} API health status
     */
    async healthCheck() {
        try {
            await this.get('/posts/1', false); // Don't use cache for health check
            return true;
        } catch (error) {
            console.warn('API health check failed:', error.message);
            return false;
        }
    }
}