/*  Imports  */
import { getAuthElements, IS_PROD, MIN_LOADING_TIME } from "../constants.js";
import { createToast, createUserStadiumElement, initializeCustomSelects, isLoggedIn, isPro, rewriteUserHomeLinks, setupSearchAutocomplete, shakeOrReplace } from "../utils.js";
import { registerCommonEvents, registerEventListeners, registerUserLogOutEvents } from "../events.js";
import { userAPI } from "../api/user.js";

/*  Variables  */
const elements = {
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
    addStadiumCancelButton: document.getElementById('add-stadium-cancel-button')
}

let allStatsMapStadiums = [];

/*  Async Functions  */
async function loadStatsInfo() {
    try {
        const [userStats] = await Promise.all([
            userAPI.loadUserStats(),
            new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME))
        ]);

        allStatsMapStadiums = userStats.mapStadiums;
        window.userStatsMapData = { stadiums: userStats.mapStadiums };
        setupStatsMapFilterHandlers();

        renderStatsPage(userStats);
        if (window.userStatsMapData) {
            await renderMap();
        }

        document.getElementById('stats-hero-skeleton').style.display = 'none';
        document.getElementById('stats-hero').style.display = 'flex';
        document.getElementById('league-completion-container-skeleton').style.display = 'none';
        document.getElementById('league-completion-container').style.display = 'flex';
        document.getElementById('visit-history-container-skeleton').style.display = 'none';
        document.getElementById('visit-history-container').style.display = 'block';
        document.getElementById('most-visited-stadiums-container-skeleton').style.display = 'none';
        document.getElementById('most-visited-stadiums-container').style.display = 'flex';
        document.getElementById('stadium-records-container-skeleton').style.display = 'none';
        document.getElementById('stadium-records-container').style.display = 'flex';
        document.getElementById('geographic-breakdown-container-skeleton').style.display = 'none';
        document.getElementById('geographic-breakdown-container').style.display = 'block';
        document.getElementById('geographic-breakdown-stadiums-map').style.display = 'block';
        document.getElementById('stats-map-filters').style.display = 'flex';
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to load user stats.');
    }
}

async function renderMap(stadiums = null) {
    if (window.userStatsMapData) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const data = stadiums || window.userStatsMapData.stadiums;
        
        if (window.userStatsMap) {
            window.userStatsMap.remove();
            window.userStatsMap = null;
        }
        
        window.userStatsMap = L.map('geographic-breakdown-stadiums-map').setView([40.8283, -96.5795], 4);
        
        const customIcon = L.icon({
            iconUrl: '/images/icons/pin-blue.png',
            iconSize: [25, 35],
            iconAnchor: [16, 40],
            popupAnchor: [-3, -40]
        });
        
        L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
            attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            ext: 'jpg'
        }).addTo(window.userStatsMap);
        
        data.forEach(stadium => {
            L.marker(stadium.location, { icon: customIcon })
                .addTo(window.userStatsMap)
                .bindPopup(`
                    <div class="popup-card">
                        <h4>${stadium.stadium_name}</h4>
                        <p>${stadium.address}</p>
                        <a href="${IS_PROD && stadium.slug ? `/stadium/${stadium.slug}` : `stadium.html?id=${encodeURIComponent(stadium.stadium_id)}`}">
                            <img src="/images/stadiums/${stadium.image}" alt="${stadium.stadium_name}" />
                        </a>
                    </div>
                `);
        });
        
        setTimeout(() => {
            window.userStatsMap.invalidateSize();
        }, 100);
    }
}

/*  Functions  */
function filterStatsMapStadiums(stadiums) {
    const league = document.getElementById('stats-map-league-filter').value;
    const country = document.getElementById('stats-map-country-filter').value;
    return stadiums.filter(s => {
        if (league !== 'all' && s.league_name.toLowerCase() !== league) return false;
        if (country !== 'all') {
            const countryMap = { us: 'The United States of America', canada: 'Canada' };
            if (s.country_name !== countryMap[country]) return false;
        }
        return true;
    });
}

function renderStatsPage(userStats) {
    // Hero
    document.getElementById('stats-hero-stadiums-number').textContent = userStats.heroStats.numStadiums;
    document.getElementById('stats-hero-visits-number').textContent = userStats.heroStats.numVisits;
    document.getElementById('stats-hero-cities-number').textContent = userStats.heroStats.numCities;
    document.getElementById('stats-hero-countries-number').textContent = userStats.heroStats.numCountries;
    document.getElementById('stats-hero-stadiums-percent-number').textContent = userStats.heroStats.percentOfAll + '%';

    // League Completion
    userStats.leagueCompletion.forEach(league => {
        const leagueCompletionItem = document.createElement('div');
        leagueCompletionItem.classList.add('league-completion-item');

        const leagueCompletionName = document.createElement('span');
        leagueCompletionName.classList.add('league-completion-name');
        leagueCompletionName.textContent = league.league_name;

        const leagueCompletionProgressBarContainer = document.createElement('div');
        leagueCompletionProgressBarContainer.classList.add('league-completion-progress-bar-container');

        const leagueCompletionProgressBarBlue = document.createElement('div');
        leagueCompletionProgressBarBlue.classList.add('league-completion-progress-bar-blue');
        leagueCompletionProgressBarBlue.style.width = (300 * (league.visitedStadiums / league.totalStadiums)) + 'px';

        const leagueCompletionProgressBar = document.createElement('div');
        leagueCompletionProgressBar.classList.add('league-completion-progress-bar');
        if (league.visitedStadiums === 0) {
            leagueCompletionProgressBarBlue.style.border = 'none';
            leagueCompletionProgressBar.style.borderTopLeftRadius = '5px';
            leagueCompletionProgressBar.style.borderBottomLeftRadius = '5px';
            leagueCompletionProgressBar.style.width = '300px';
        } else {
            leagueCompletionProgressBar.style.width = (300 - (300 * (league.visitedStadiums / league.totalStadiums))) + 'px';
        }

        if (league.visitedStadiums === league.totalStadiums) {
            leagueCompletionProgressBar.style.border = 'none';
            leagueCompletionProgressBarBlue.style.borderTopRightRadius = '5px';
            leagueCompletionProgressBarBlue.style.borderBottomRightRadius = '5px';
        }
        
        leagueCompletionProgressBarContainer.appendChild(leagueCompletionProgressBarBlue);
        leagueCompletionProgressBarContainer.appendChild(leagueCompletionProgressBar);

        const leagueCompletionProgress = document.createElement('span');
        leagueCompletionProgress.classList.add('league-completion-progress');
        leagueCompletionProgress.textContent = league.visitedStadiums + '/' + league.totalStadiums + ' (' + parseFloat(((league.visitedStadiums / league.totalStadiums) * 100).toFixed(1)) + '%)';

        leagueCompletionItem.appendChild(leagueCompletionName);
        leagueCompletionItem.appendChild(leagueCompletionProgressBarContainer);
        leagueCompletionItem.appendChild(leagueCompletionProgress);

        document.getElementById('league-completion-container').appendChild(leagueCompletionItem);
    });

    // Visit History
    if (userStats.visitsByYear.length > 0) {
        const minYear = userStats.visitsByYear[0].year;
        const maxYear = userStats.visitsByYear[userStats.visitsByYear.length - 1].year;
        const visitMap = Object.fromEntries(userStats.visitsByYear.map(y => [y.year, y.count]));

        const allYears = [];
        for (let year = minYear; year <= maxYear; year++) {
            allYears.push({ year, count: visitMap[year] || 0 });
        }

        const maxCount = Math.max(...allYears.map(y => y.count));
        const barsContainer = document.getElementById('visit-history-bars');
        barsContainer.innerHTML = '';

        const tooltip = document.getElementById('visit-history-tooltip');

        allYears.forEach(({ year, count }) => {
            const bar = document.createElement('div');
            bar.classList.add('visit-history-bar');
            bar.style.height = `${(count / maxCount) * 200}px`;

            bar.addEventListener('mouseenter', (e) => {
                tooltip.textContent = `${year} · ${count} visit${count !== 1 ? 's' : ''}`;
                tooltip.style.display = 'block';
            });

            bar.addEventListener('mousemove', (e) => {
                const tooltipWidth = tooltip.offsetWidth;
                const wouldOverflow = e.clientX + 12 + tooltipWidth > window.innerWidth;
                tooltip.style.left = wouldOverflow
                    ? `${e.clientX - tooltipWidth - 12}px`
                    : `${e.clientX + 12}px`;
                tooltip.style.top = `${e.clientY - 28}px`;
            });

            bar.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });

            barsContainer.appendChild(bar);
        });

        const yearsContainer = document.getElementById('visit-history-years');
        yearsContainer.innerHTML = '';

        const firstYear = document.createElement('span');
        firstYear.textContent = minYear;

        const lastYear = document.createElement('span');
        lastYear.textContent = maxYear;

        yearsContainer.appendChild(firstYear);
        yearsContainer.appendChild(lastYear);
    } else {
        document.getElementById('visit-history-bars').style.display = 'none';
        document.getElementById('visit-history-visits').style.display = 'none';
        document.getElementById('visit-history-stats').style.margin = '0 auto';
    }

    if (userStats.firstVisit) {
        const firstVisit = createUserStadiumElement(userStats.firstVisit, elements);
        document.getElementById('visit-history-first-visit').appendChild(firstVisit);
    }
    if (userStats.latestVisit) {
        const latestVisit = createUserStadiumElement(userStats.latestVisit, elements);
        document.getElementById('visit-history-latest-visit').appendChild(latestVisit);
    }

    document.getElementById('visit-history-favorite-month').textContent = userStats.favoriteMonth || '—';
    document.getElementById('visit-history-longest-streak').textContent = userStats.longestStreak ? userStats.longestStreak + (userStats.longestStreak === 1 ? ' week' : ' weeks') : '—';
    document.getElementById('visit-history-avg-visits').textContent = userStats.avgVisitsPerYear || '—';

    // Most Visited Stadiums
    if (userStats.mostVisited.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'Log visits to stadiums to see your most visited.';
        empty.style.color = 'var(--color-text-muted)';
        document.getElementById('most-visited-stadiums-container').appendChild(empty);
    }

    userStats.mostVisited.forEach(stadium => {
        const mostVisitedStadiumContainer = document.createElement('div');
        mostVisitedStadiumContainer.classList.add('most-visited-stadium');

        const mostVisitedStadium = createUserStadiumElement(stadium, elements);

        const mostVisitedStadiumNumber = document.createElement('span');
        mostVisitedStadiumNumber.classList.add('most-visited-stadium-number');
        mostVisitedStadiumNumber.textContent = stadium.visitCount + (stadium.visitCount === 1 ? ' time ' : ' times');

        mostVisitedStadiumContainer.appendChild(mostVisitedStadium);
        mostVisitedStadiumContainer.appendChild(mostVisitedStadiumNumber);

        document.getElementById('most-visited-stadiums-container').appendChild(mostVisitedStadiumContainer);
    });

    // Stadium Records
    const hasAnyRecord = Object.values(userStats.stadiumRecords).some(r => r !== null);
    if (!hasAnyRecord) {
        document.querySelectorAll('.stadium-record').forEach(el => el.style.display = 'none');
        const empty = document.createElement('p');
        empty.textContent = 'Visit stadiums to see your stadium records.';
        empty.style.color = 'var(--color-text-muted)';
        document.getElementById('stadium-records-container').appendChild(empty);
        document.getElementById('stadium-records-container').style.justifyContent = 'start';
        document.getElementById('geographic-breakdown-stats').style.gap = '0';
    }

    if (userStats.stadiumRecords.oldest) {
        document.getElementById('oldest-stadium').appendChild(createUserStadiumElement(userStats.stadiumRecords.oldest, elements));
    }

    if (userStats.stadiumRecords.newest) {
        document.getElementById('newest-stadium').appendChild(createUserStadiumElement(userStats.stadiumRecords.newest, elements));
    }

    if (userStats.stadiumRecords.highestCapacity) {
        document.getElementById('highest-capacity-stadium').appendChild(createUserStadiumElement(userStats.stadiumRecords.highestCapacity, elements));
    }

    if (userStats.stadiumRecords.lowestCapacity) {
        document.getElementById('lowest-capacity-stadium').appendChild(createUserStadiumElement(userStats.stadiumRecords.lowestCapacity, elements));
    }

    if (userStats.stadiumRecords.highestCost) {
        document.getElementById('highest-construction-cost-stadium').appendChild(createUserStadiumElement(userStats.stadiumRecords.highestCost, elements));
    }

    if (userStats.stadiumRecords.lowestCost) {
        document.getElementById('lowest-construction-cost-stadium').appendChild(createUserStadiumElement(userStats.stadiumRecords.lowestCost, elements));
    }

    if (userStats.stadiumRecords.mostPopular) {
        document.getElementById('most-popular-stadium').appendChild(createUserStadiumElement(userStats.stadiumRecords.mostPopular, elements));
    }

    if (userStats.stadiumRecords.leastPopular) {
        document.getElementById('least-popular-stadium').appendChild(createUserStadiumElement(userStats.stadiumRecords.leastPopular, elements));
    }

    // Geographic Breakdown
    if (userStats.topCountries.length === 0 && userStats.topCities.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'Visit stadiums to see your top countries and cities.';
        empty.style.color = 'var(--color-text-muted)';
        document.getElementById('geographic-breakdown-stats').appendChild(empty);
    }

    const maxCountryCount = userStats.topCountries[0]?.stadiumCount || 1;
    
    userStats.topCountries.forEach(country => {
        const item = document.createElement('div');
        item.classList.add('geographic-breakdown-country');

        const name = document.createElement('span');
        name.classList.add('geographic-breakdown-country-name');
        name.textContent = country.country_name;

        const bar = document.createElement('div');
        bar.classList.add('geographic-breakdown-country-progress-bar');
        bar.style.width = `${(country.stadiumCount / maxCountryCount) * 250}px`;

        const count = document.createElement('span');
        count.classList.add('geographic-breakdown-country-stadium-count');
        count.textContent = `${country.stadiumCount} stadium${country.stadiumCount !== 1 ? 's' : ''}`;

        item.appendChild(name);
        item.appendChild(bar);
        item.appendChild(count);

        document.getElementById('geographic-breakdown-top-countries').appendChild(item);
    });

    const maxCityCount = userStats.topCities[0]?.stadiumCount || 1;

    userStats.topCities.forEach(city => {
        const item = document.createElement('div');
        item.classList.add('geographic-breakdown-city');

        const name = document.createElement('span');
        name.classList.add('geographic-breakdown-city-name');
        name.textContent = `${city.city}, ${city.state}`;

        const bar = document.createElement('div');
        bar.classList.add('geographic-breakdown-city-progress-bar');
        bar.style.width = `${(city.stadiumCount / maxCityCount) * 250}px`;

        const count = document.createElement('span');
        count.classList.add('geographic-breakdown-city-stadium-count');
        count.textContent = `${city.stadiumCount} stadium${city.stadiumCount !== 1 ? 's' : ''}`;

        item.appendChild(name);
        item.appendChild(bar);
        item.appendChild(count);
        document.getElementById('geographic-breakdown-top-cities').appendChild(item);
    });
}

function setupStatsMapFilterHandlers() {
    ['stats-map-league-filter', 'stats-map-country-filter'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            const select = document.getElementById(id);
            const wrapper = select.closest('.custom-select-wrapper');
            const options = wrapper.querySelectorAll('.custom-select-option');
            const valueDisplay = wrapper.querySelector('.custom-select-value');
            options.forEach(o => {
                o.classList.remove('selected');
                if (o.dataset.value === select.value) o.classList.add('selected');
            });
            if (valueDisplay) {
                const selectedOption = wrapper.querySelector(`.custom-select-option[data-value="${select.value}"]`);
                if (selectedOption) valueDisplay.textContent = selectedOption.textContent;
            }
            renderMap(filterStatsMapStadiums(allStatsMapStadiums));
        });
    });
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    rewriteUserHomeLinks();
    registerEventListeners(getAuthElements());
    registerCommonEvents();
    registerUserLogOutEvents();
    initializeCustomSelects();
    setupSearchAutocomplete('logged-in-nav-search', 'logged-in-search-field-nav', 'logged-in-nav-autocomplete-list');
    setupSearchAutocomplete('logged-in-sidebar-nav-search', 'logged-in-sidebar-search-field-nav', 'logged-in-sidebar-nav-autocomplete-list');
});

window.onload = async () => {
    if (!isLoggedIn()) {
        window.location.replace('/');
        return;
    }

    if (!isPro()) {
        window.location.replace('pro');
        return;
    }

    const pending = sessionStorage.getItem('toast');
    if (pending) {
        const { type, message } = JSON.parse(pending);
        createToast(type, message);
        sessionStorage.removeItem('toast');
    }

    await loadStatsInfo();
};