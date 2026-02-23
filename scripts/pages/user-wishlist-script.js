/*  Imports  */
import { MIN_LOADING_TIME } from "../constants.js";
import { filterAndRank, getUsername, hideLoading, initializeCustomSelects, renderWithoutTransition, setupFilterHandlers, setupSearch, showLoading, showLoggedInUI, syncSelectFromURL } from "../utils.js";
import { registerCommonEvents, registerUserLogOutEvents } from "../events.js";
import { userAPI } from "../api/user.js";

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
async function setView(username, league, country, sortBy) {
    try {
        showLoading(elements);
        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
        const result = await userAPI.loadUserWishlist(username, league, country, sortBy);
        const stadiums = result.userWishlist;

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

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    registerCommonEvents();
    registerUserLogOutEvents();
    initializeCustomSelects();
    setupFilterHandlers(elements);
    setupSearch(() => allStadiums, elements);
});

window.onload = async () => {
    const username = getUsername();
    showLoggedInUI(username);

    const params = new URLSearchParams(window.location.search);
    const league = params.get('league') || 'all';
    const country = params.get('country') || 'all';
    const sort = params.get('sort') || 'name-asc';
    
    syncSelectFromURL('league-filter', league);
    syncSelectFromURL('country-filter', country);
    syncSelectFromURL('sort-filter', sort);

    setView(username, league, country, sort);
};