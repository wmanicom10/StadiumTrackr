/*  Imports  */
import { getAuthElements, getHeaderElements, MIN_LOADING_TIME } from "../constants.js";
import { filterAndRank, getUsername, hideLoading, initializeCustomSelects, isLoggedIn, renderWithoutTransition, setupFilterHandlers, setupSearch, showLoading, showLoggedOutUI, syncSelectFromURL, truncateUsername } from "../utils.js";
import { registerCommonEvents, registerEventListeners, registerLogOutEvents } from "../events.js";
import { stadiumAPI } from "../api/stadium.js";

/*  Variables  */
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

/*  Async Functions  */
async function setView(league, country, sortBy) {
    try {
        showLoading(elements);
        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
        const result = await stadiumAPI.loadStadiums(league, country, sortBy);
        const stadiums = result.stadiums;

        allStadiums = stadiums;

        const query = document.getElementById('home-search-field').value.toLowerCase().trim();
        const filtered = query ? filterAndRank(allStadiums, query) : stadiums;

        const plural = filtered.length === 1 ? 'stadium' : 'stadiums';
        elements.stadiumCount.textContent = `Showing ${filtered.length} ${plural}`;

        renderWithoutTransition(elements, filtered);
        hideLoading(elements);
    } catch (err) {
        alert(err.message);
        hideLoading(elements);
    }
}

/*  Functions  */
function showLoggedInUI(username) {
    const { loggedInHeader, loggedOutHeader, loggedInHeaderUsername, sidebarUsername } = getHeaderElements();
    
    const displayName = truncateUsername(username);
    loggedInHeaderUsername.textContent = displayName;
    sidebarUsername.textContent = displayName;
    loggedOutHeader.style.display = 'none';
    loggedInHeader.style.display = 'flex';
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    registerEventListeners(getAuthElements());
    registerCommonEvents();
    registerLogOutEvents();
    initializeCustomSelects();
    setupFilterHandlers(elements);
    setupSearch(() => allStadiums, elements);
});

window.onload = async () => {
    const username = getUsername();
    if (isLoggedIn()) {
        showLoggedInUI(username);
    } else {
        showLoggedOutUI();
    }

    const params = new URLSearchParams(window.location.search);
    const league = params.get('league') || 'all';
    const country = params.get('country') || 'all';
    const sort = params.get('sort') || 'name-asc';
    
    syncSelectFromURL('league-filter', league);
    syncSelectFromURL('country-filter', country);
    syncSelectFromURL('sort-filter', sort);

    setView(league, country, sort);
};