import { Helpers } from '../utils/helpers.js';

/**
 * Search component for filtering employees
 */
export class SearchComponent {
    constructor(container, onSearch) {
        this.container = container;
        this.onSearch = onSearch;
        this.searchInput = null;
        this.debouncedSearch = Helpers.debounce(this.handleSearch.bind(this), 300);
        this.init();
    }

    /**
     * Initialize the search component
     */
    init() {
        this.render();
        this.bindEvents();
    }

    /**
     * Render the search component
     */
    render() {
        this.container.innerHTML = `
            <div class="search-wrapper">
                <input 
                    type="text" 
                    id="employeeSearch" 
                    class="search-input" 
                    placeholder="Search employees by name, email, department, or position..."
                    autocomplete="off"
                >
                <div class="search-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                </div>
            </div>
        `;

        this.searchInput = this.container.querySelector('#employeeSearch');
        
        // Add search wrapper styles
        const style = document.createElement('style');
        style.textContent = `
            .search-wrapper {
                position: relative;
                width: 100%;
            }
            
            .search-icon {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: #6b7280;
                pointer-events: none;
            }
            
            .search-input {
                padding-right: 40px !important;
            }
            
            .search-input:focus + .search-icon {
                color: #2563eb;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.debouncedSearch);
            this.searchInput.addEventListener('keydown', this.handleKeyDown.bind(this));
            this.searchInput.addEventListener('focus', this.handleFocus.bind(this));
            this.searchInput.addEventListener('blur', this.handleBlur.bind(this));
        }
    }

    /**
     * Handle search input
     */
    handleSearch() {
        const searchTerm = this.searchInput.value.trim();
        this.onSearch(searchTerm);
    }

    /**
     * Handle keydown events
     * @param {Event} event - Keydown event
     */
    handleKeyDown(event) {
        if (event.key === 'Escape') {
            this.clearSearch();
        } else if (event.key === 'Enter') {
            event.preventDefault();
            this.handleSearch();
        }
    }

    /**
     * Handle focus event
     */
    handleFocus() {
        this.searchInput.parentElement.classList.add('focused');
    }

    /**
     * Handle blur event
     */
    handleBlur() {
        this.searchInput.parentElement.classList.remove('focused');
    }

    /**
     * Clear search input
     */
    clearSearch() {
        this.searchInput.value = '';
        this.handleSearch();
        this.searchInput.focus();
    }

    /**
     * Set search value
     * @param {string} value - Search value
     */
    setValue(value) {
        if (this.searchInput) {
            this.searchInput.value = value;
        }
    }

    /**
     * Get current search value
     * @returns {string} Current search value
     */
    getValue() {
        return this.searchInput ? this.searchInput.value.trim() : '';
    }

    /**
     * Focus the search input
     */
    focus() {
        if (this.searchInput) {
            this.searchInput.focus();
        }
    }

    /**
     * Disable the search input
     * @param {boolean} disabled - Disabled state
     */
    setDisabled(disabled) {
        if (this.searchInput) {
            this.searchInput.disabled = disabled;
        }
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.searchInput) {
            this.searchInput.removeEventListener('input', this.debouncedSearch);
            this.searchInput.removeEventListener('keydown', this.handleKeyDown);
            this.searchInput.removeEventListener('focus', this.handleFocus);
            this.searchInput.removeEventListener('blur', this.handleBlur);
        }
        this.container.innerHTML = '';
    }
}