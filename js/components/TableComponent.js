import { Helpers } from '../utils/helpers.js';

/**
 * Table component with virtual scrolling for employee data
 */
export class TableComponent {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            onEdit: options.onEdit || (() => {}),
            onDelete: options.onDelete || (() => {}),
            onSort: options.onSort || (() => {}),
            virtualScrolling: options.virtualScrolling || false,
            rowHeight: options.rowHeight || 49,
            ...options
        };
        
        this.employees = [];
        this.sortField = 'name';
        this.sortDirection = 'asc';
        this.visibleRange = { start: 0, end: 0 };
        this.scrollContainer = null;
        this.tableBody = null;
        this.virtualContainer = null;
        
        this.init();
    }

    /**
     * Initialize the table component
     */
    init() {
        this.render();
        this.bindEvents();
    }

    /**
     * Update table with new employee data
     * @param {Array} employees - Array of employees
     * @param {Object} sortInfo - Sort information
     */
    update(employees, sortInfo = {}) {
        this.employees = employees || [];
        
        if (sortInfo.field) {
            this.sortField = sortInfo.field;
            this.sortDirection = sortInfo.direction || 'asc';
        }
        
        this.renderTableBody();
        this.updateSortHeaders();
    }

    /**
     * Render the table structure
     */
    render() {
        this.container.innerHTML = `
            <div class="table-wrapper">
                <table class="employee-table">
                    <thead>
                        <tr>
                            <th data-sort="name" class="sortable">
                                Name
                            </th>
                            <th data-sort="email" class="sortable">
                                Email
                            </th>
                            <th data-sort="phone">
                                Phone
                            </th>
                            <th data-sort="department" class="sortable">
                                Department
                            </th>
                            <th data-sort="position" class="sortable">
                                Position
                            </th>
                            <th data-sort="salary" class="sortable">
                                Salary
                            </th>
                            <th class="actions-column">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody id="employeeTableBody">
                        <!-- Employee rows will be rendered here -->
                    </tbody>
                </table>
                ${this.employees.length === 0 ? this.renderEmptyState() : ''}
            </div>
        `;

        this.tableBody = this.container.querySelector('#employeeTableBody');
        this.scrollContainer = this.container.querySelector('.table-wrapper');
        
        // Add table-specific styles
        this.addTableStyles();
    }

    /**
     * Render table body with employee rows
     */
    renderTableBody() {
        if (!this.tableBody) return;

        if (this.employees.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-cell">
                        ${this.renderEmptyState()}
                    </td>
                </tr>
            `;
            return;
        }

        if (this.options.virtualScrolling && this.employees.length > 50) {
            this.renderVirtualRows();
        } else {
            this.renderAllRows();
        }
    }

    /**
     * Render all rows (non-virtual scrolling)
     */
    renderAllRows() {
        const rows = this.employees.map(employee => this.createEmployeeRow(employee)).join('');
        this.tableBody.innerHTML = rows;
    }

    /**
     * Render virtual rows (for performance with large datasets)
     */
    renderVirtualRows() {
        const containerHeight = this.scrollContainer.clientHeight;
        const rowHeight = this.options.rowHeight;
        const visibleRows = Math.ceil(containerHeight / rowHeight) + 5; // Buffer rows
        const scrollTop = this.scrollContainer.scrollTop;
        
        const startIndex = Math.floor(scrollTop / rowHeight);
        const endIndex = Math.min(startIndex + visibleRows, this.employees.length);
        
        this.visibleRange = { start: startIndex, end: endIndex };
        
        // Create virtual container if not exists
        if (!this.virtualContainer) {
            this.virtualContainer = document.createElement('div');
            this.virtualContainer.style.height = `${this.employees.length * rowHeight}px`;
            this.virtualContainer.style.position = 'relative';
            this.tableBody.appendChild(this.virtualContainer);
        } else {
            this.virtualContainer.style.height = `${this.employees.length * rowHeight}px`;
        }
        
        // Render visible rows
        const visibleEmployees = this.employees.slice(startIndex, endIndex);
        const rows = visibleEmployees.map((employee, index) => {
            const actualIndex = startIndex + index;
            const row = this.createEmployeeRow(employee);
            return `<tr style="position: absolute; top: ${actualIndex * rowHeight}px; width: 100%;">${row}</tr>`;
        }).join('');
        
        this.virtualContainer.innerHTML = rows;
    }

    /**
     * Create HTML for employee row
     * @param {Employee} employee - Employee object
     * @returns {string} HTML string for table row
     */
    createEmployeeRow(employee) {
        const escapedName = Helpers.escapeHtml(employee.name);
        const escapedEmail = Helpers.escapeHtml(employee.email);
        const escapedDepartment = Helpers.escapeHtml(employee.department);
        const escapedPosition = Helpers.escapeHtml(employee.position);
        
        return `
        <tr>
            <td class="employee-name">
                <div class="employee-info">
                    <img src="${employee.avatar}" alt="${escapedName}" class="employee-avatar" loading="lazy">
                    <div class="employee-details">
                        <div class="name">${escapedName}</div>
                        <div class="hire-date">Hired: ${Helpers.formatDate(employee.hireDate)}</div>
                    </div>
                </div>
            </td>
            <td class="employee-email">
                <a href="mailto:${escapedEmail}" class="email-link">${escapedEmail}</a>
            </td>
            <td class="employee-phone">
                ${employee.formattedPhone ? `<a href="tel:${employee.phone}" class="phone-link">${employee.formattedPhone}</a>` : '-'}
            </td>
            <td class="employee-department">
                <span class="department-badge" data-department="${escapedDepartment}">${escapedDepartment}</span>
            </td>
            <td class="employee-position">
                ${escapedPosition}
            </td>
            <td class="employee-salary">
                <span class="salary-amount">${employee.displaySalary}</span>
            </td>
            <td class="employee-actions">
                <div class="action-buttons">
                    <button class="btn btn-small btn-secondary" onclick="window.employeeApp.editEmployee('${employee.id}')" title="Edit Employee">
                        <span class="btn-icon">✏️</span>
                        Edit
                    </button>
                    <button class="btn btn-small btn-danger" onclick="window.employeeApp.deleteEmployee('${employee.id}')" title="Delete Employee">
                        <span class="btn-icon">🗑️</span>
                        Delete
                    </button>
                </div>
            </td>
            </tr>
        `;
    }

    /**
     * Render empty state
     * @returns {string} Empty state HTML
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>No employees found</h3>
                <p>Try adjusting your search or filter criteria, or add a new employee to get started.</p>
                <button class="btn btn-primary" onclick="window.employeeApp.showAddEmployeeModal()">
                    <span class="btn-icon">+</span>
                    Add First Employee
                </button>
            </div>
        `;
    }

    /**
     * Update sort headers
     */
    updateSortHeaders() {
        const headers = this.container.querySelectorAll('th[data-sort]');
        headers.forEach(header => {
            const field = header.dataset.sort;
            header.classList.remove('sort-asc', 'sort-desc');
            
            if (field === this.sortField) {
                header.classList.add(`sort-${this.sortDirection}`);
            }
        });
    }

    /**
     * Add table-specific styles
     */
    addTableStyles() {
        if (document.querySelector('#table-styles')) return;

        const style = document.createElement('style');
        style.id = 'table-styles';
        style.textContent = `
            .table-wrapper {
                overflow: auto;
                max-height: 600px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
            }
            
            .employee-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .employee-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid #e5e7eb;
            }
            
            .employee-details .name {
                font-weight: 600;
                color: #1f2937;
            }
            
            .employee-details .hire-date {
                font-size: 12px;
                color: #6b7280;
            }
            
            .email-link {
                color: #2563eb;
                text-decoration: none;
            }
            
            .email-link:hover {
                text-decoration: underline;
            }
            
            .phone-link {
                color: #059669;
                text-decoration: none;
            }
            
            .phone-link:hover {
                text-decoration: underline;
            }
            
            .department-badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .department-badge[data-department="Engineering"] {
                background-color: #dbeafe;
                color: #1d4ed8;
            }
            
            .department-badge[data-department="Marketing"] {
                background-color: #fef3c7;
                color: #d97706;
            }
            
            .department-badge[data-department="Sales"] {
                background-color: #d1fae5;
                color: #059669;
            }
            
            .department-badge[data-department="HR"] {
                background-color: #fce7f3;
                color: #be185d;
            }
            
            .department-badge[data-department="Finance"] {
                background-color: #e0e7ff;
                color: #4338ca;
            }
            
            .department-badge[data-department="Operations"] {
                background-color: #f3e8ff;
                color: #7c3aed;
            }
            
            .salary-amount {
                font-weight: 600;
                color: #059669;
            }
            
            .actions-column {
                width: 180px;
                text-align: center;
            }
            
            .empty-cell {
                padding: 0 !important;
                border: none !important;
            }
            
            .empty-icon {
                font-size: 48px;
                margin-bottom: 16px;
            }
            
            @media (max-width: 768px) {
                .employee-table {
                    font-size: 12px;
                }
                
                .employee-info {
                    gap: 8px;
                }
                
                .employee-avatar {
                    width: 32px;
                    height: 32px;
                }
                
                .employee-details .name {
                    font-size: 13px;
                }
                
                .employee-details .hire-date {
                    font-size: 10px;
                }
                
                .action-buttons {
                    flex-direction: column;
                    gap: 4px;
                }
                
                .btn-small {
                    padding: 4px 8px;
                    font-size: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Sort headers
        const sortHeaders = this.container.querySelectorAll('th.sortable');
        sortHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const field = header.dataset.sort;
                const newDirection = (this.sortField === field && this.sortDirection === 'asc') ? 'desc' : 'asc';
                this.options.onSort(field, newDirection);
            });
        });

        // Virtual scrolling
        if (this.options.virtualScrolling && this.scrollContainer) {
            const throttledScroll = Helpers.throttle(() => {
                if (this.employees.length > 50) {
                    this.renderVirtualRows();
                }
            }, 16); // ~60fps

            this.scrollContainer.addEventListener('scroll', throttledScroll);
        }

        // Row hover effects
        this.tableBody?.addEventListener('mouseenter', (event) => {
            if (event.target.tagName === 'TR') {
                event.target.classList.add('hovered');
            }
        }, true);

        this.tableBody?.addEventListener('mouseleave', (event) => {
            if (event.target.tagName === 'TR') {
                event.target.classList.remove('hovered');
            }
        }, true);
    }

    /**
     * Scroll to top of table
     */
    scrollToTop() {
        if (this.scrollContainer) {
            this.scrollContainer.scrollTop = 0;
        }
    }

    /**
     * Get current sort information
     * @returns {Object} Sort information
     */
    getSortInfo() {
        return {
            field: this.sortField,
            direction: this.sortDirection
        };
    }

    /**
     * Show loading state
     * @param {boolean} loading - Loading state
     */
    setLoading(loading) {
        if (loading) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 60px;">
                        <div class="loading-spinner" style="margin: 0 auto 16px;"></div>
                        <p>Loading employees...</p>
                    </td>
                </tr>
            `;
        }
    }

    /**
     * Highlight search terms in table
     * @param {string} searchTerm - Search term to highlight
     */
    highlightSearchTerm(searchTerm) {
        if (!searchTerm) return;

        const cells = this.tableBody.querySelectorAll('td');
        cells.forEach(cell => {
            const text = cell.textContent;
            if (text.toLowerCase().includes(searchTerm.toLowerCase())) {
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                const highlightedText = text.replace(regex, '<mark>$1</mark>');
                
                // Only update if it's a text cell (not containing buttons or complex HTML)
                if (!cell.querySelector('button') && !cell.querySelector('img')) {
                    cell.innerHTML = highlightedText;
                }
            }
        });
    }

    /**
     * Export visible table data
     * @returns {Array} Array of visible employee data
     */
    getVisibleData() {
        return this.employees.map(employee => ({
            name: employee.name,
            email: employee.email,
            phone: employee.formattedPhone,
            department: employee.department,
            position: employee.position,
            salary: employee.displaySalary,
            hireDate: Helpers.formatDate(employee.hireDate)
        }));
    }

    /**
     * Destroy the component
     */
    destroy() {
        this.container.innerHTML = '';
        this.employees = [];
        this.tableBody = null;
        this.scrollContainer = null;
        this.virtualContainer = null;
    }
}