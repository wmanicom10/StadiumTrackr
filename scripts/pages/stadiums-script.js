import { getAuthElements, getHeaderElements, getSearchElements, MIN_LOADING_TIME, DEBOUNCE_TIME } from "../constants.js";
import { searchStadiums, debounce, getUsername, isLoggedIn, truncateUsername, formatLocation, clearUsername } from "../utils.js";
import { registerEventListeners, registerCommonEvents } from "../events.js";
import { stadiumAPI } from "../api/stadium.js";

const elements = {
    stadiumsList: document.getElementById('stadiums-list'),
    stadiumsPageSelector: document.getElementById('stadiums-page-selector'),
    noStadiumsContainer: document.getElementById('no-stadiums-container'),
    clearFiltersButton: document.getElementById('clear-filters'),
    stadiumCount: document.getElementById('results-count'),
    stadiumsSkeleton: document.getElementById('stadiums-skeleton'),
    stadiumsListContainer: document.getElementById('stadiums-list-container'),
    filterBar: document.getElementById('filter-bar'),
    leagueFilter: document.getElementById('league-filter'),
    countryFilter: document.getElementById('country-filter'),
    sortFilter: document.getElementById('sort-filter')
};

function showLoggedInUI(username) {
    const { loggedInHeader, loggedOutHeader, loggedInHeaderUsername, sidebarUsername } = getHeaderElements();
    
    const displayName = truncateUsername(username);
    loggedInHeaderUsername.textContent = displayName;
    sidebarUsername.textContent = displayName;
    loggedOutHeader.style.display = 'none';
    loggedInHeader.style.display = 'flex';
}

function showLoggedOutUI() {
    const { loggedInHeader, loggedOutHeader } = getHeaderElements();
    loggedInHeader.style.display = 'none';
    loggedOutHeader.style.display = 'flex';
}

function showLoading() {
    elements.stadiumsSkeleton.style.display = 'block';
    elements.stadiumsListContainer.style.display = 'none';
    elements.filterBar.style.display = 'none';
}

function hideLoading() {
    elements.stadiumsSkeleton.style.display = 'none';
    elements.stadiumsListContainer.style.display = 'block';
    elements.filterBar.style.display = 'block';
}

function createStadiumCard(stadium) {
    const card = document.createElement('div');
    card.classList.add('stadiums-list-stadium');
    
    const link = document.createElement('a');
    link.href = `stadium.html?id=${encodeURIComponent(stadium.stadium_id)}`;
    
    const img = document.createElement('img');
    img.src = stadium.image;
    img.alt = stadium.stadium_name;
    
    const textDiv = document.createElement('div');
    textDiv.classList.add('stadiums-list-stadium-text');
    
    const name = document.createElement('h3');
    name.textContent = stadium.stadium_name;
    
    const location = document.createElement('h4');
    location.textContent = formatLocation(stadium.city, stadium.state);
    
    textDiv.appendChild(name);
    textDiv.appendChild(location);
    link.appendChild(img);
    link.appendChild(textDiv);
    card.appendChild(link);
    
    return card;
}

function createPagination(stadiums, perPage = 18, scrollTop = 460) {
    let currentPage = 1;
    const pageCount = Math.ceil(stadiums.length / perPage);

    function renderPage(page) {
        elements.stadiumsList.innerHTML = '';
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const pageStadiums = stadiums.slice(start, end);

        pageStadiums.forEach(stadium => {
            const card = createStadiumCard(stadium);
            elements.stadiumsList.appendChild(card);
        });
    }

    function renderPageNumbers() {
        elements.stadiumsPageSelector.innerHTML = '';

        const prevBtn = createNavigationButton('←', currentPage === 1, () => {
            if (currentPage > 1) {
                currentPage--;
                renderPage(currentPage);
                renderPageNumbers();
                scrollToTop(scrollTop);
            }
        });
        elements.stadiumsPageSelector.appendChild(prevBtn);

        const pageButtons = calculatePageButtons(currentPage, pageCount);
        pageButtons.forEach(item => {
            if (item === '...') {
                elements.stadiumsPageSelector.appendChild(createEllipsis());
            } else {
                elements.stadiumsPageSelector.appendChild(createPageButton(item));
            }
        });

        const nextBtn = createNavigationButton('→', currentPage === pageCount, () => {
            if (currentPage < pageCount) {
                currentPage++;
                renderPage(currentPage);
                renderPageNumbers();
                scrollToTop(scrollTop);
            }
        });
        elements.stadiumsPageSelector.appendChild(nextBtn);
    }

    function createPageButton(pageNum) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = pageNum;
        btn.dataset.page = pageNum;
        if (pageNum === currentPage) btn.classList.add('active');
        btn.addEventListener('click', () => {
            currentPage = pageNum;
            renderPage(currentPage);
            renderPageNumbers();
            scrollToTop(scrollTop);
        });
        return btn;
    }

    function createNavigationButton(text, disabled, onClick) {
        const btn = document.createElement('button');
        btn.className = 'page-btn arrow';
        btn.textContent = text;
        btn.disabled = disabled;
        if (!disabled) btn.addEventListener('click', onClick);
        return btn;
    }

    function createEllipsis() {
        const span = document.createElement('span');
        span.className = 'page-ellipsis';
        span.textContent = '...';
        return span;
    }

    function calculatePageButtons(current, total) {
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        
        if (current <= 3) {
            return [1, 2, 3, 4, 5, '...', total];
        }
        
        if (current >= total - 2) {
            return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
        }
        
        return [1, '...', current - 1, current, current + 1, '...', total];
    }

    function scrollToTop(position) {
        requestAnimationFrame(() => {
            window.scrollTo({ top: position, behavior: 'smooth' });
        });
    }

    renderPage(currentPage);
    renderPageNumbers();
}

async function setView(league, country, sortBy) {
    try {
        showLoading();
        
        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
        
        const result = await stadiumAPI.loadStadiums(league, country, sortBy);
        const stadiums = result.stadiums;

        const plural = stadiums.length === 1 ? 'stadium' : 'stadiums';
        elements.stadiumCount.textContent = `Showing ${stadiums.length} ${plural}`;

        if (stadiums.length === 0) {
            showNoResults();
        } else {
            showResults();
            createPagination(stadiums);
        }

        hideLoading();
    } catch (err) {
        alert(err.message);
        hideLoading();
    }
}

function showNoResults() {
    elements.stadiumsList.style.display = 'none';
    elements.stadiumsPageSelector.style.display = 'none';
    elements.noStadiumsContainer.style.display = 'block';
}

function showResults() {
    elements.stadiumsList.style.display = 'flex';
    elements.stadiumsPageSelector.style.display = 'flex';
    elements.noStadiumsContainer.style.display = 'none';
}

function initializeCustomSelects() {
    const triggers = document.querySelectorAll('.custom-select-trigger');
    
    triggers.forEach(trigger => {
        const wrapper = trigger.parentElement;
        const dropdown = wrapper.querySelector('.custom-select-dropdown');
        const options = dropdown.querySelectorAll('.custom-select-option');
        const valueDisplay = wrapper.querySelector('.custom-select-value');
        const hiddenSelect = wrapper.querySelector('.filter-select');
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns(dropdown);
            dropdown.classList.toggle('active');
            trigger.classList.toggle('active');
        });
        
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                selectOption(option, options, valueDisplay, hiddenSelect, dropdown, trigger);
            });
        });
    });
    
    document.addEventListener('click', () => closeAllDropdowns());
}

function closeAllDropdowns(except = null) {
    document.querySelectorAll('.custom-select-dropdown.active').forEach(d => {
        if (d !== except) {
            d.classList.remove('active');
            d.parentElement.querySelector('.custom-select-trigger').classList.remove('active');
        }
    });
}

function selectOption(option, allOptions, valueDisplay, hiddenSelect, dropdown, trigger) {
    allOptions.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    valueDisplay.textContent = option.textContent;
    hiddenSelect.value = option.dataset.value;
    hiddenSelect.dispatchEvent(new Event('change'));
    dropdown.classList.remove('active');
    trigger.classList.remove('active');
}

function resetFilters() {
    document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => {
        const firstOption = wrapper.querySelector('.custom-select-option[data-value="all"], .custom-select-option[data-value="name-asc"]');
        const valueDisplay = wrapper.querySelector('.custom-select-value');
        const hiddenSelect = wrapper.querySelector('.filter-select');
        const allOptions = wrapper.querySelectorAll('.custom-select-option');
        
        allOptions.forEach(opt => opt.classList.remove('selected'));
        if (firstOption) {
            firstOption.classList.add('selected');
            valueDisplay.textContent = firstOption.textContent;
            hiddenSelect.value = firstOption.dataset.value;
        }
    });
}

function setupSearchAutocomplete() {
    const { searchValue, suggestionsContainer, searchStadiumsForm } = getSearchElements();

    const debouncedSearch = debounce((name) => {
        if (name) {
            searchStadiums(name, suggestionsContainer, searchValue);
        } else {
            hideSearchSuggestions(suggestionsContainer, searchValue);
        }
    }, DEBOUNCE_TIME);

    searchValue.addEventListener('input', (event) => {
        debouncedSearch(event.target.value);
    });

    document.addEventListener('click', (event) => {
        const isClickInside = searchValue.contains(event.target) || 
                            suggestionsContainer.contains(event.target);
        if (!isClickInside) {
            hideSearchSuggestions(suggestionsContainer, searchValue);
        }
    });

    searchStadiumsForm?.addEventListener('submit', (e) => e.preventDefault());
}

function hideSearchSuggestions(container, input) {
    container.classList.remove('active');
    input.value = '';
}

function setupFilterHandlers() {
    const getFilters = () => ({
        league: elements.leagueFilter.value,
        country: elements.countryFilter.value,
        sort: elements.sortFilter.value
    });

    elements.leagueFilter.addEventListener('change', () => {
        const { league, country, sort } = getFilters();
        setView(league, country, sort);
    });

    elements.countryFilter.addEventListener('change', () => {
        const { league, country, sort } = getFilters();
        setView(league, country, sort);
    });

    elements.sortFilter.addEventListener('change', () => {
        const { league, country, sort } = getFilters();
        setView(league, country, sort);
    });

    elements.clearFiltersButton.addEventListener('click', () => {
        resetFilters();
        setView('all', 'all', 'name-asc');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    registerEventListeners(getAuthElements());
    registerCommonEvents();
    initializeCustomSelects();
    setupFilterHandlers();
    setupSearchAutocomplete();
});

window.onload = async () => {
    const username = getUsername();
    
    if (isLoggedIn()) {
        showLoggedInUI(username);
    } else {
        showLoggedOutUI();
    }
    
    setView('all', 'all', 'name-asc');
};

const { logOutButton, sidebarLogOutButton } = getHeaderElements();

logOutButton?.addEventListener('click', () => {
    clearUsername();
    window.location.reload();
});

sidebarLogOutButton?.addEventListener('click', () => {
    clearUsername();
    window.location.reload();
});