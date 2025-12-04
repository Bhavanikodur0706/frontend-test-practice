/**
 * Pagination component for employee table
 */
export class PaginationComponent {
    constructor(container, onPageChange) {
        this.container = container;
        this.onPageChange = onPageChange;
        this.paginationInfo = {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            pageSize: 25,
            startIndex: 0,
            endIndex: 0,
            hasNext: false,
            hasPrevious: false
        };
        this.init();
    }

    /**
     * Initialize the pagination component
     */
    init() {
        this.render();
        this.bindEvents();
    }

    /**
     * Update pagination info and re-render
     * @param {Object} paginationInfo - Pagination information
     */
    update(paginationInfo) {
        this.paginationInfo = { ...paginationInfo };
        this.render();
        this.bindEvents();
    }

    /**
     * Render the pagination component
     */
    render() {
        const { 
            currentPage, 
            totalPages, 
            totalItems, 
            startIndex, 
            endIndex, 
            hasNext, 
            hasPrevious 
        } = this.paginationInfo;

        if (totalItems === 0) {
            this.container.innerHTML = `
                <div class="pagination-info">
                    <span>No employees found</span>
                </div>
            `;
            return;
        }

        // Generate page numbers
        const pageNumbers = this.generatePageNumbers();

        this.container.innerHTML = `
            <div class="pagination-info">
                <span>Showing ${startIndex} to ${endIndex} of ${totalItems} employees</span>
            </div>
            <div class="pagination-controls">
                <button 
                    class="pagination-btn" 
                    data-action="first" 
                    ${!hasPrevious ? 'disabled' : ''}
                    title="First page"
                >
                    ««
                </button>
                <button 
                    class="pagination-btn" 
                    data-action="previous" 
                    ${!hasPrevious ? 'disabled' : ''}
                    title="Previous page"
                >
                    ‹
                </button>
                
                ${pageNumbers.map(page => {
                    if (page === '...') {
                        return '<span class="pagination-ellipsis">...</span>';
                    }
                    return `
                        <button 
                            class="pagination-btn ${page === currentPage ? 'active' : ''}" 
                            data-action="page" 
                            data-page="${page}"
                            title="Page ${page}"
                        >
                            ${page}
                        </button>
                    `;
                }).join('')}
                
                <button 
                    class="pagination-btn" 
                    data-action="next" 
                    ${!hasNext ? 'disabled' : ''}
                    title="Next page"
                >
                    ›
                </button>
                <button 
                    class="pagination-btn" 
                    data-action="last" 
                    ${!hasNext ? 'disabled' : ''}
                    title="Last page"
                >
                    »»
                </button>
            </div>
        `;

        // Add pagination styles if not already added
        this.addStyles();
    }

    /**
     * Generate page numbers for pagination
     * @returns {Array} Array of page numbers and ellipsis
     */
    generatePageNumbers() {
        const { currentPage, totalPages } = this.paginationInfo;
        const pages = [];
        const maxVisible = 7; // Maximum visible page numbers

        if (totalPages <= maxVisible) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage <= 4) {
                // Near the beginning
                for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
                    pages.push(i);
                }
                if (totalPages > 5) {
                    pages.push('...');
                }
            } else if (currentPage >= totalPages - 3) {
                // Near the end
                if (totalPages > 5) {
                    pages.push('...');
                }
                for (let i = Math.max(totalPages - 4, 2); i <= totalPages - 1; i++) {
                    pages.push(i);
                }
            } else {
                // In the middle
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
            }

            // Always show last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    }

    /**
     * Add pagination styles
     */
    addStyles() {
        if (document.querySelector('#pagination-styles')) return;

        const style = document.createElement('style');
        style.id = 'pagination-styles';
        style.textContent = `
            .pagination-ellipsis {
                padding: 8px 4px;
                color: #6b7280;
                font-size: 14px;
                user-select: none;
            }
            
            .pagination-controls {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .pagination-btn:first-child,
            .pagination-btn:last-child {
                font-weight: bold;
            }
            
            @media (max-width: 640px) {
                .pagination-controls {
                    gap: 2px;
                }
                
                .pagination-btn {
                    padding: 6px 8px;
                    font-size: 12px;
                    min-width: 32px;
                }
                
                .pagination-ellipsis {
                    padding: 6px 2px;
                    font-size: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        const buttons = this.container.querySelectorAll('.pagination-btn');
        buttons.forEach(button => {
            button.addEventListener('click', this.handleButtonClick.bind(this));
        });

        // Add keyboard navigation
        this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    /**
     * Handle button click events
     * @param {Event} event - Click event
     */
    handleButtonClick(event) {
        const button = event.target;
        const action = button.dataset.action;
        const { currentPage, totalPages } = this.paginationInfo;

        let newPage = currentPage;

        switch (action) {
            case 'first':
                newPage = 1;
                break;
            case 'previous':
                newPage = Math.max(1, currentPage - 1);
                break;
            case 'next':
                newPage = Math.min(totalPages, currentPage + 1);
                break;
            case 'last':
                newPage = totalPages;
                break;
            case 'page':
                newPage = parseInt(button.dataset.page);
                break;
        }

        if (newPage !== currentPage && newPage >= 1 && newPage <= totalPages) {
            this.onPageChange(newPage);
        }
    }

    /**
     * Handle keyboard navigation
     * @param {Event} event - Keydown event
     */
    handleKeyDown(event) {
        const { currentPage, totalPages, hasPrevious, hasNext } = this.paginationInfo;

        switch (event.key) {
            case 'ArrowLeft':
                if (hasPrevious) {
                    event.preventDefault();
                    this.onPageChange(currentPage - 1);
                }
                break;
            case 'ArrowRight':
                if (hasNext) {
                    event.preventDefault();
                    this.onPageChange(currentPage + 1);
                }
                break;
            case 'Home':
                if (currentPage !== 1) {
                    event.preventDefault();
                    this.onPageChange(1);
                }
                break;
            case 'End':
                if (currentPage !== totalPages) {
                    event.preventDefault();
                    this.onPageChange(totalPages);
                }
                break;
        }
    }

    /**
     * Go to specific page
     * @param {number} page - Page number
     */
    goToPage(page) {
        const { totalPages } = this.paginationInfo;
        if (page >= 1 && page <= totalPages) {
            this.onPageChange(page);
        }
    }

    /**
     * Go to next page
     */
    nextPage() {
        const { currentPage, hasNext } = this.paginationInfo;
        if (hasNext) {
            this.onPageChange(currentPage + 1);
        }
    }

    /**
     * Go to previous page
     */
    previousPage() {
        const { currentPage, hasPrevious } = this.paginationInfo;
        if (hasPrevious) {
            this.onPageChange(currentPage - 1);
        }
    }

    /**
     * Go to first page
     */
    firstPage() {
        this.onPageChange(1);
    }

    /**
     * Go to last page
     */
    lastPage() {
        const { totalPages } = this.paginationInfo;
        this.onPageChange(totalPages);
    }

    /**
     * Get current pagination info
     * @returns {Object} Pagination information
     */
    getPaginationInfo() {
        return { ...this.paginationInfo };
    }

    /**
     * Show loading state
     * @param {boolean} loading - Loading state
     */
    setLoading(loading) {
        const buttons = this.container.querySelectorAll('.pagination-btn');
        buttons.forEach(button => {
            button.disabled = loading;
        });
    }

    /**
     * Destroy the component
     */
    destroy() {
        this.container.innerHTML = '';
    }
}