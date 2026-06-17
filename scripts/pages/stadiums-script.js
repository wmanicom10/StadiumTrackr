/*  Imports  */
import { getAuthElements, MIN_LOADING_TIME } from "../constants.js";
import { createToast, filterAndRank, initializeCreateAccountCaptcha, initializeCustomSelects, isLoggedIn, renderWithoutTransition, setupFilterHandlers, setupSearch, setupSearchAutocomplete, showLoggedInUI, showLoggedOutUI, syncSelectFromURL } from "../utils.js";
import { registerCommonEvents, registerEventListeners, registerLogOutEvents } from "../events.js";
import { loadAPI } from "../api/load.js";

/*  Variables  */
const elements = {
    leagueFilter: document.getElementById('league-filter'),
    countryFilter: document.getElementById('country-filter'),
    sortFilter: document.getElementById('sort-filter'),
    clearFiltersButton: document.getElementById('clear-filters'),
    searchInput: document.getElementById('home-search-field'),
    stadiumCount: document.getElementById('results-count'),
    searchStadiums: document.getElementById('search-stadiums'),
    stadiumsList: document.getElementById('stadiums-list'),
    stadiumsPageSelector: document.getElementById('stadiums-page-selector'),
    noStadiumsContainer: document.getElementById('no-stadiums-container'),
    addStadiumMenu: document.getElementById('add-stadium-menu'),
    addStadiumDateVisited: document.getElementById('add-stadium-date-visited'),
    addStadiumNote: document.getElementById('add-stadium-note'),
    closeAddStadiumMenu: document.getElementById('close-add-stadium-menu'),
    addStadiumName: document.getElementById('add-stadium-name'),
    addStadiumLocation: document.getElementById('add-stadium-location'),
    addStadiumImage: document.getElementById('add-stadium-image'),
    addStadiumLogButton: document.getElementById('add-stadium-log-button'),
    addStadiumCancelButton: document.getElementById('add-stadium-cancel-button'),
};

let allStadiums = [];

/*  Async Functions  */
async function setView() {
    const params = new URLSearchParams(window.location.search);
    const league = params.get('league') || 'all';
    const country = params.get('country') || 'all';
    const sort = params.get('sort') || 'name-asc';

    if (!params.has('page')) {
        sessionStorage.removeItem('stadiumSearch');
    }

    setupFilterHandlers(elements);
    setupSearch(() => allStadiums, elements);
    
    syncSelectFromURL('league-filter', league);
    syncSelectFromURL('country-filter', country);
    syncSelectFromURL('sort-filter', sort);

    await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
    const result = await loadAPI.loadStadiums(league, country, sort);
    const stadiums = result.stadiums;

    allStadiums = stadiums;

    const query = sessionStorage.getItem('stadiumSearch') || '';
    const filtered = query ? filterAndRank(allStadiums, query) : stadiums;

    const plural = filtered.length === 1 ? 'stadium' : 'stadiums';
    elements.stadiumCount.textContent = `Showing ${filtered.length} ${plural}`;

    renderWithoutTransition(elements, filtered);

    document.getElementById('stadiums-container-skeleton').style.display = 'none';
    document.getElementById('stadiums-list').style.display = 'flex';
    document.getElementById('filter-bar-skeleton').style.display = 'none';
    document.getElementById('filter-bar').style.display = 'block';
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    registerEventListeners(getAuthElements());
    registerCommonEvents();
    registerLogOutEvents();
    initializeCustomSelects();
    initializeCreateAccountCaptcha();
    setupSearchAutocomplete('logged-out-nav-search', 'logged-out-search-field-nav', 'logged-out-nav-autocomplete-list');
    setupSearchAutocomplete('logged-out-sidebar-nav-search', 'logged-out-sidebar-search-field-nav', 'logged-out-sidebar-nav-autocomplete-list');
    setupSearchAutocomplete('logged-in-nav-search', 'logged-in-search-field-nav', 'logged-in-nav-autocomplete-list');
    setupSearchAutocomplete('logged-in-sidebar-nav-search', 'logged-in-sidebar-search-field-nav', 'logged-in-sidebar-nav-autocomplete-list');
});

window.onload = async () => {
    if (isLoggedIn()) {
        showLoggedInUI();
    } else {
        showLoggedOutUI();
    }
    const pending = sessionStorage.getItem('toast');
    if (pending) {
        const { type, message } = JSON.parse(pending);
        createToast(type, message);
        sessionStorage.removeItem('toast');
    }
    setView();
};