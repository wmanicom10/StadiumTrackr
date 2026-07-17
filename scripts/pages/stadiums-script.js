/*  Imports  */
import { getAuthElements, MIN_LOADING_TIME } from "../constants.js";
import { createToast, filterAndRank, initializeCreateAccountCaptcha, initializeCustomSelects, isLoggedIn, isPro, renderWithoutTransition, setupFilterHandlers, setupSearch, setupSearchAutocomplete, showLoggedInUI, showLoggedOutUI, syncSelectFromURL } from "../utils.js";
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
    addStadiumPhotosInput: document.getElementById('add-stadium-photos-input'),
    addStadiumPhotosPreview: document.getElementById('add-stadium-photos-preview'),
    addStadiumPhotosCount: document.getElementById('add-stadium-photos-count'),
    addStadiumLogButton: document.getElementById('add-stadium-log-button'),
    addStadiumCancelButton: document.getElementById('add-stadium-cancel-button'),
};

let allStadiums = [];
let showSelections = new Set(['all']);
let allMapStadiums = [];
let mapShowSelections = new Set(['all']);

/*  Async Functions  */
async function loadMapStadiums() {
    try {
        const result = await loadAPI.loadMapStadiums();
        allMapStadiums = result.rows;
        renderMap(allMapStadiums);
    } catch (error) {
        console.error(error);
    }
}

async function setView() {
    const params = new URLSearchParams(window.location.search);
    const showParam = params.get('show');
    if (showParam) {
        showSelections.clear();
        showParam.split(',').forEach(v => showSelections.add(v));
    } else {
        showSelections.clear();
        showSelections.add('all');
    }
    const show = [...showSelections];
    const league = params.get('league') || 'all';
    const country = params.get('country') || 'all';
    const sort = params.get('sort') || 'name-asc';

    if (isLoggedIn()) syncShowFilter();

    if (!params.has('page')) {
        sessionStorage.removeItem('stadiumSearch');
    }

    setupFilterHandlers(elements, () => {
        showSelections.clear();
        showSelections.add('all');
    });
    setupSearch(() => allStadiums, elements);
    
    syncSelectFromURL('league-filter', league);
    syncSelectFromURL('country-filter', country);
    syncSelectFromURL('sort-filter', sort);

    await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
    const result = await loadAPI.loadStadiums(show, league, country, sort);
    const stadiums = result.stadiums;

    allStadiums = stadiums;

    const query = sessionStorage.getItem('stadiumSearch') || '';
    const filtered = query ? filterAndRank(allStadiums, query) : stadiums;

    const plural = filtered.length === 1 ? 'stadium' : 'stadiums';
    elements.stadiumCount.textContent = `Showing ${filtered.length} ${plural}`;

    renderWithoutTransition(elements, filtered);

    loadMapStadiums();

    document.getElementById('stadiums-container-skeleton').style.display = 'none';
    document.getElementById('stadiums-list').style.display = 'flex';
    document.getElementById('filter-bar-skeleton').style.display = 'none';
    document.getElementById('filter-bar').style.display = 'block';

    if (isLoggedIn()) {
        if (isPro()) {
            document.getElementById('stadiums-map-filters').style.display = 'flex';
        } else {
            document.getElementById('stadiums-map-upgrade').style.display = 'block';
        }
    }
    document.getElementById('stadiums-map-filters-skeleton').style.display = 'none';
    document.getElementById('stadiums-stadium-map-skeleton').style.display = 'none';
    document.getElementById('stadiums-stadium-map').style.display = 'block';
}

/*  Functions  */
function applyShowFilter() {
    const params = new URLSearchParams(window.location.search);
    params.set('page', '1');
    if (showSelections.has('all')) {
        params.delete('show');
    } else {
        params.set('show', [...showSelections].join(','));
    }
    window.location.search = params.toString();
}

function filterMapStadiums(stadiums, filters) {
    return stadiums.filter(s => {
        if (filters.league !== 'all' && s.league.toLowerCase() !== filters.league) return false;
        if (filters.country !== 'all') {
            const countryMap = { us: 'The United States of America', canada: 'Canada' };
            if (s.country !== countryMap[filters.country]) return false;
        }
        if (!mapShowSelections.has('all')) {
            const visitedOk = mapShowSelections.has('visited') ? s.visited === 1 : mapShowSelections.has('not-visited') ? s.visited === 0 : true;
            const wishlistOk = mapShowSelections.has('wishlist') ? s.wishlist === 1 : mapShowSelections.has('not-wishlist') ? s.wishlist === 0 : true;
            if (!visitedOk || !wishlistOk) return false;
        }
        return true;
    });
}

function getMapFilters() {
    return {
        league: document.getElementById('map-league-filter').value,
        country: document.getElementById('map-country-filter').value
    };
}

function renderMap(stadiums) {
    if (window.stadiumsMap) {
        window.stadiumsMap.remove();
        window.stadiumsMap = null;
    }

    window.stadiumsMap = L.map('stadiums-stadium-map').setView([42.8283, -96.5795], 4);

    const customIcon = L.icon({
        iconUrl: '/images/icons/pin-blue.png',
        iconSize: [25, 35],
        iconAnchor: [16, 40],
        popupAnchor: [-3, -40]
    });

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
        attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        ext: 'jpg'
    }).addTo(window.stadiumsMap);

    stadiums.forEach(stadium => {
        L.marker(stadium.location, { icon: customIcon })
            .addTo(window.stadiumsMap)
            .bindPopup(`
                <div class="popup-card">
                    <h4>${stadium.stadium_name}</h4>
                    <p>${stadium.address}</p>
                    <a href="/stadium/${stadium.stadium_id}">
                        <img src="/images/stadiums/${stadium.image}" alt="${stadium.stadium_name}" />
                    </a>
                </div>
            `);
    });
}

function setupMapFilterHandlers() {
    ['map-league-filter', 'map-country-filter'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            document.getElementById('map-show-dropdown').classList.remove('active');
            document.getElementById('map-show-trigger').classList.remove('active');

            const select = document.getElementById(id);
            const wrapper = select.closest('.custom-select-wrapper');
            const valueDisplay = wrapper.querySelector('.custom-select-value');
            const options = wrapper.querySelectorAll('.custom-select-option');

            options.forEach(o => {
                o.classList.remove('selected');
                if (o.dataset.value === select.value) o.classList.add('selected');
            });

            if (valueDisplay) {
                const selectedOption = wrapper.querySelector(`.custom-select-option[data-value="${select.value}"]`);
                if (selectedOption) valueDisplay.textContent = selectedOption.textContent;
            }

            const filtered = filterMapStadiums(allMapStadiums, getMapFilters());
            renderMap(filtered);
        });
    });
}

function setupMapShowFilter() {
    const trigger = document.getElementById('map-show-trigger');
    const dropdown = document.getElementById('map-show-dropdown');
    const valueDisplay = document.getElementById('map-show-value');
    const options = dropdown.querySelectorAll('.custom-select-option');

    document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('map-show-wrapper');
        if (!wrapper.contains(e.target)) {
            dropdown.classList.remove('active');
            trigger.classList.remove('active');
        }
    });

    document.querySelectorAll('#stadiums-map-filters .custom-select-trigger').forEach(t => {
        t.addEventListener('click', () => {
            dropdown.classList.remove('active');
            trigger.classList.remove('active');
        });
    });

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.custom-select-dropdown.active').forEach(d => {
            d.classList.remove('active');
            d.parentElement.querySelector('.custom-select-trigger').classList.remove('active');
        });
        dropdown.classList.toggle('active');
        trigger.classList.toggle('active');
    });

    options.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = option.dataset.value;

            if (value === 'all') {
                mapShowSelections.clear();
                mapShowSelections.add('all');
                options.forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
            } else {
                mapShowSelections.delete('all');
                options[0].classList.remove('selected');

                if (value === 'visited') mapShowSelections.delete('not-visited');
                if (value === 'not-visited') mapShowSelections.delete('visited');
                if (value === 'wishlist') mapShowSelections.delete('not-wishlist');
                if (value === 'not-wishlist') mapShowSelections.delete('wishlist');

                if (mapShowSelections.has(value)) {
                    mapShowSelections.delete(value);
                    option.classList.remove('selected');
                } else {
                    mapShowSelections.add(value);
                    option.classList.add('selected');
                }

                options.forEach(o => {
                    if (o.dataset.value !== 'all') {
                        o.classList.toggle('selected', mapShowSelections.has(o.dataset.value));
                    }
                });

                if (mapShowSelections.size === 0) {
                    mapShowSelections.add('all');
                    options[0].classList.add('selected');
                }
            }

            if (mapShowSelections.has('all')) {
                valueDisplay.textContent = 'All';
            } else {
                const labels = {
                    visited: 'Visited',
                    'not-visited': 'Not Visited',
                    wishlist: 'Wishlist',
                    'not-wishlist': 'Not In Wishlist'
                };
                valueDisplay.textContent = [...mapShowSelections].map(v => labels[v]).join(', ');
            }

            const filtered = filterMapStadiums(allMapStadiums, getMapFilters());
            renderMap(filtered);
        });
    });
}

function setupShowFilter() {
    const trigger = document.getElementById('show-trigger');
    const dropdown = document.getElementById('show-dropdown');
    const valueDisplay = document.getElementById('show-value');
    const options = dropdown.querySelectorAll('.custom-select-option');

    document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('show-wrapper');
        if (!wrapper.contains(e.target)) {
            dropdown.classList.remove('active');
            trigger.classList.remove('active');
        }
    });

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.custom-select-dropdown.active').forEach(d => {
            d.classList.remove('active');
            d.parentElement.querySelector('.custom-select-trigger')?.classList.remove('active');
        });
        dropdown.classList.toggle('active');
        trigger.classList.toggle('active');
    });

    options.forEach(option => {
        option.addEventListener('click', async (e) => {
            e.stopPropagation();
            const value = option.dataset.value;

            if (value === 'all') {
                showSelections.clear();
                showSelections.add('all');
                options.forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
            } else {
                showSelections.delete('all');
                options[0].classList.remove('selected');

                if (value === 'visited') showSelections.delete('not-visited');
                if (value === 'not-visited') showSelections.delete('visited');
                if (value === 'wishlist') showSelections.delete('not-wishlist');
                if (value === 'not-wishlist') showSelections.delete('wishlist');

                if (showSelections.has(value)) {
                    showSelections.delete(value);
                    option.classList.remove('selected');
                } else {
                    showSelections.add(value);
                    option.classList.add('selected');
                }

                options.forEach(o => {
                    if (o.dataset.value !== 'all') {
                        o.classList.toggle('selected', showSelections.has(o.dataset.value));
                    }
                });

                if (showSelections.size === 0) {
                    showSelections.add('all');
                    options[0].classList.add('selected');
                }
            }

            if (showSelections.has('all')) {
                valueDisplay.textContent = 'All';
            } else {
                const labels = {
                    visited: 'Visited',
                    'not-visited': 'Not Visited',
                    wishlist: 'Wishlist',
                    'not-wishlist': 'Not In Wishlist'
                };
                valueDisplay.textContent = [...showSelections].map(v => labels[v]).join(', ');
            }

            applyShowFilter();
        });
    });
}

function syncShowFilter() {
    const options = document.querySelectorAll('#show-dropdown .custom-select-option');
    const valueDisplay = document.getElementById('show-value');
    if (!valueDisplay) return;

    options.forEach(o => {
        o.classList.toggle('selected', showSelections.has(o.dataset.value));
    });

    if (showSelections.has('all')) {
        valueDisplay.textContent = 'All';
    } else {
        const labels = {
            visited: 'Visited',
            'not-visited': 'Not Visited',
            wishlist: 'Wishlist',
            'not-wishlist': 'Not In Wishlist'
        };
        valueDisplay.textContent = [...showSelections].map(v => labels[v]).join(', ');
    }
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
        document.getElementById('show-filter-group').style.display = 'flex';
        setupShowFilter();
        if (isPro()) {
            setupMapShowFilter();
            setupMapFilterHandlers();
        }
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