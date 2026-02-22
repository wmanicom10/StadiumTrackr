import { getHeaderElements, MIN_LOADING_TIME } from "../constants.js";
import { getUsername, truncateUsername, formatLocation, clearUsername } from "../utils.js";
import { registerCommonEvents } from "../events.js";
import { userAPI } from "../api/user.js";

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

let allStadiums = [];
let initialLoadComplete = false;

function showLoggedInUI(username) {
    const { loggedInHeader, loggedInHeaderUsername, sidebarUsername } = getHeaderElements();
    const displayName = truncateUsername(username);
    loggedInHeaderUsername.textContent = displayName;
    sidebarUsername.textContent = displayName;
    loggedInHeader.style.display = 'flex';
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

function renderWithTransition(stadiums) {
    const list = elements.stadiumsList;
    list.style.transition = 'opacity 0.2s ease';
    list.style.opacity = '0';

    setTimeout(() => {
        if (stadiums.length === 0) {
            showNoResults();
        } else {
            elements.noStadiumsContainer.style.display = 'none';
            elements.stadiumsPageSelector.style.display = 'flex';
            list.style.display = 'flex';
            list.style.opacity = '0';
            createPagination(stadiums);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    list.style.opacity = '1';
                });
            });
        }
    }, 150);
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

function createPagination(stadiums, perPage = 18, scrollTop = 0) {
    let currentPage = 1;
    const pageCount = Math.ceil(stadiums.length / perPage);

    function renderPage(page) {
        elements.stadiumsList.innerHTML = '';
        const start = (page - 1) * perPage;
        const end = start + perPage;
        stadiums.slice(start, end).forEach(stadium => {
            elements.stadiumsList.appendChild(createStadiumCard(stadium));
        });
    }

    function renderPageNumbers() {
        elements.stadiumsPageSelector.innerHTML = '';
        const prevBtn = createNavigationButton('←', currentPage === 1, () => {
            if (currentPage > 1) { currentPage--; renderPage(currentPage); renderPageNumbers(); scrollToTop(scrollTop); }
        });
        elements.stadiumsPageSelector.appendChild(prevBtn);
        calculatePageButtons(currentPage, pageCount).forEach(item => {
            elements.stadiumsPageSelector.appendChild(item === '...' ? createEllipsis() : createPageButton(item));
        });
        const nextBtn = createNavigationButton('→', currentPage === pageCount, () => {
            if (currentPage < pageCount) { currentPage++; renderPage(currentPage); renderPageNumbers(); scrollToTop(scrollTop); }
        });
        elements.stadiumsPageSelector.appendChild(nextBtn);
    }

    function createPageButton(pageNum) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = pageNum;
        btn.dataset.page = pageNum;
        if (pageNum === currentPage) btn.classList.add('active');
        btn.addEventListener('click', () => { currentPage = pageNum; renderPage(currentPage); renderPageNumbers(); scrollToTop(scrollTop); });
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
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        if (current <= 3) return [1, 2, 3, 4, 5, '...', total];
        if (current >= total - 2) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
        return [1, '...', current - 1, current, current + 1, '...', total];
    }

    function scrollToTop(position) {
        requestAnimationFrame(() => window.scrollTo({ top: position, behavior: 'smooth' }));
    }

    renderPage(currentPage);
    renderPageNumbers();
}

async function setView(username, league, country, sortBy) {
    try {
        showLoading();
        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
        const result = await userAPI.loadUserStadiums(username, league, country, sortBy);
        const stadiums = result.userStadiums;

        allStadiums = stadiums;

        const query = document.getElementById('home-search-field').value.toLowerCase();
        const filtered = query
            ? stadiums.filter(s => s.stadium_name.toLowerCase().includes(query))
            : stadiums;

        const plural = filtered.length === 1 ? 'stadium' : 'stadiums';
        elements.stadiumCount.textContent = `Showing ${filtered.length} ${plural}`;

        if (!initialLoadComplete) {
            if (filtered.length === 0) showNoResults();
            else { showResults(); createPagination(filtered); }
            initialLoadComplete = true;
        } else {
            renderWithTransition(filtered);
        }

        hideLoading();
    } catch (err) {
        alert(err.message);
        hideLoading();
    }
}

function filterAndRank(query) {
    if (!query) return allStadiums;
    const lower = query.toLowerCase();
    return allStadiums
        .filter(s => {
            const name = s.stadium_name.toLowerCase();
            const city = s.city.toLowerCase();
            const state = s.state.toLowerCase();
            return name.includes(lower) || city.includes(lower) || state.includes(lower);
        })
        .map(s => {
            const name = s.stadium_name.toLowerCase();
            const city = s.city.toLowerCase();
            let rank;
            if (name === lower)           rank = 1;
            else if (city === lower)       rank = 2;
            else if (name.includes(lower)) rank = 3;
            else if (city.includes(lower)) rank = 4;
            else                           rank = 5;
            return { ...s, rank };
        })
        .sort((a, b) => a.rank - b.rank || a.stadium_name.localeCompare(b.stadium_name));
}

function setupSearch() {
    const searchInput = document.getElementById('home-search-field');

    searchInput.addEventListener('input', () => {
        const filtered = filterAndRank(searchInput.value.trim());
        const plural = filtered.length === 1 ? 'stadium' : 'stadiums';
        elements.stadiumCount.textContent = `Showing ${filtered.length} ${plural}`;

        renderWithTransition(filtered);
    });

    [elements.leagueFilter, elements.countryFilter, elements.sortFilter].forEach(el => {
        el.addEventListener('change', () => { searchInput.value = ''; });
    });

    elements.clearFiltersButton.addEventListener('click', () => { searchInput.value = ''; });
    document.getElementById('search-stadiums')?.addEventListener('submit', e => e.preventDefault());
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

function setupFilterHandlers() {
    const username = getUsername();
    const getFilters = () => ({
        league: elements.leagueFilter.value,
        country: elements.countryFilter.value,
        sort: elements.sortFilter.value
    });
    elements.leagueFilter.addEventListener('change', () => { const { league, country, sort } = getFilters(); setView(username, league, country, sort); });
    elements.countryFilter.addEventListener('change', () => { const { league, country, sort } = getFilters(); setView(username, league, country, sort); });
    elements.sortFilter.addEventListener('change', () => { const { league, country, sort } = getFilters(); setView(username, league, country, sort); });
    elements.clearFiltersButton.addEventListener('click', () => { resetFilters(); setView(username, 'all', 'all', 'name-asc'); });
}

document.addEventListener('DOMContentLoaded', () => {
    registerCommonEvents();
    initializeCustomSelects();
    setupFilterHandlers();
    setupSearch();
});

window.onload = async () => {
    const username = getUsername();
    showLoggedInUI(username);
    setView(username, 'all', 'all', 'name-asc');
};

const { logOutButton, sidebarLogOutButton } = getHeaderElements();
logOutButton?.addEventListener('click', () => { clearUsername(); window.location.replace('index.html'); });
sidebarLogOutButton?.addEventListener('click', () => { clearUsername(); window.location.replace('index.html'); });