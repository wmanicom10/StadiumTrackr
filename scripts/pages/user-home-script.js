/*  Imports  */
import { getAuthElements, ICON_IMAGE_PATH, MIN_LOADING_TIME, overlay, PROFILE_PIC_PATH, STADIUM_IMAGE_PATH } from "../constants.js";
import { addExistingPhotoPreview, createToast, createUserStadiumElement, filterAndRank, formatDate, formatEventDate, formatEventTime, getPageFromURL, initializeCustomSelects, isLoggedIn, isPro, openLightbox, renderPageNumbers, renderWithoutTransition, renderWithTransition, setupDeleteLogHandlers, setupEditLogHandlers, setupSearchAutocomplete, showLoggedInUI, syncSelectFromURL, timeAgo, toggleMenu, updateEditLogPhotoCount } from "../utils.js";
import { registerCommonEvents, registerEventListeners, registerUserLogOutEvents } from "../events.js";
import { userAPI } from "../api/user.js";
import { loadAPI } from "../api/load.js";
import { updateAPI } from "../api/update.js";

/*  Variables  */
const userHomeHeader = document.getElementById('user-home-header');
const userHomeHeaderSkeleton = document.getElementById('user-home-header-skeleton');

let allStadiums = [];
let currentData = null;
let allHomeMapStadiums = [];

/*  Async Functions  */
async function loadAchievementsTab(tab) {
    const token = localStorage.getItem('token');
    if (!token) return
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    const username = payload.username || '';
    document.title = username + "'s Achievements - StadiumTrackr";

    if (!payload.isPro) {
        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
        userHomeHeaderSkeleton.style.display = 'none';
        userHomeHeader.style.display = 'flex';
        document.getElementById('user-home-achievements-skeleton').style.display = 'none';
        document.getElementById('user-home-achievements-filters-container-skeleton').style.display = 'none';
        document.getElementById('user-home-achievements-upgrade').style.display = 'block';
        document.getElementById('user-home-achievements-tab-container').style.display = 'flex';
        return;
    }

    const elements = {
        achievementsFilter: document.getElementById('achievements-filter'),
        sortFilter: document.getElementById('achievements-sort-filter'),
        clearFiltersButton: document.getElementById('achievements-clear-filters'),
        stadiumsList: document.getElementById('user-home-achievements'),
        stadiumsPageSelector: document.getElementById('achievements-page-selector'),
        noStadiumsContainer: document.getElementById('user-home-no-achievements-container'),
    }

    setupAchievementsFilterHandlers(elements, tab);

    const params = new URLSearchParams(window.location.search);
    const achievement = params.get('achievement') || 'all';
    const sort = params.get('sort') || 'name-asc';

    syncSelectFromURL('achievements-filter', achievement);
    syncSelectFromURL('achievements-sort-filter', sort);

    document.getElementById('user-home-achievements-tab-container').style.display = 'flex';

    await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
    const result = await userAPI.loadUserAchievements(achievement, sort);
    const achievements = result.userAchievements;

    renderAchievementsTab(achievements, elements);

    userHomeHeaderSkeleton.style.display = 'none';
    userHomeHeader.style.display = 'flex';
    document.getElementById('user-home-achievements-skeleton').style.display = 'none';
    if (achievements.length > 0) document.getElementById('user-home-achievements').style.display = 'flex';
    document.getElementById('user-home-achievements-filters-container-skeleton').style.display = 'none';
    document.getElementById('user-home-achievements-filters-container').style.display = 'block';
}

async function loadActivityTab(tab) {
    const token = localStorage.getItem('token');
    if (!token) return
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    const username = payload.username || '';
    document.title = username + "'s Activity - StadiumTrackr";

    const elements = {
        activityFilter: document.getElementById('activity-filter'),
        sortFilter: document.getElementById('activity-sort-filter'),
        clearFiltersButton: document.getElementById('activity-clear-filters'),
        stadiumsList: document.getElementById('user-home-activity'),
        stadiumsPageSelector: document.getElementById('activity-page-selector'),
        noStadiumsContainer: document.getElementById('user-home-no-activity-container'),
        editLogMenu: document.getElementById('edit-log-menu'),
        closeEditLogMenu: document.getElementById('close-edit-log-menu'),
        editLogSaveButton: document.getElementById('edit-log-save-button'),
        editLogCancelButton: document.getElementById('edit-log-cancel-button'),
        editLogName: document.getElementById('edit-log-name'),
        editLogLocation: document.getElementById('edit-log-location'),
        editLogImage: document.getElementById('edit-log-image'),
        editLogDateVisited: document.getElementById('edit-log-date-visited'),
        editLogNote: document.getElementById('edit-log-note'),
        editLogPhotosInput: document.getElementById('edit-log-photos-input'),
        editLogPhotosPreview: document.getElementById('edit-log-photos-preview'),
        editLogPhotosCount: document.getElementById('edit-log-photos-count'),
        deleteLogMenu: document.getElementById('delete-log-menu'),
        closeDeleteLogMenu: document.getElementById('close-delete-log-menu'),
        deleteLogCancelButton: document.getElementById('delete-log-cancel-button'),
        deleteLogDeleteButton: document.getElementById('delete-log-delete-button')
    }

    setupActivityFilterHandlers(elements, tab);

    const params = new URLSearchParams(window.location.search);
    const activity = params.get('activity') || 'all';
    const sort = params.get('sort') || 'added-desc';

    syncSelectFromURL('activity-filter', activity);
    syncSelectFromURL('activity-sort-filter', sort);

    document.getElementById('user-home-activity-tab-container').style.display = 'flex';

    await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
    const result = await userAPI.loadUserActivity(activity, '', sort);
    const stadiums = result.userActivity;

    renderActivityTab(stadiums, elements);

    userHomeHeaderSkeleton.style.display = 'none';
    userHomeHeader.style.display = 'flex';
    document.getElementById('user-home-activity-skeleton').style.display = 'none';
    if (stadiums.length > 0) document.getElementById('user-home-activity').style.display = 'flex';
    document.getElementById('user-home-activity-filters-container-skeleton').style.display = 'none';
    document.getElementById('user-home-activity-filters-container').style.display = 'block';
}

async function loadEventsTab(tab) {
    const token = localStorage.getItem('token');
    if (!token) return
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
                                        const payload = JSON.parse(atob(base64));
    const username = payload.username || '';
    document.title = username + "'s Events - StadiumTrackr";
    
    const elements = {
        eventFilter: document.getElementById('event-filter'),
        sortFilter: document.getElementById('event-sort-filter'),
        clearFiltersButton: document.getElementById('events-clear-filters'),
        stadiumsList: document.getElementById('user-home-events'),
        stadiumsPageSelector: document.getElementById('user-home-events-page-selector'),
        noStadiumsContainer: document.getElementById('user-home-no-events-container'),
    }

    setupEventsFilterHandlers(elements, tab);

    const params = new URLSearchParams(window.location.search);
    const event = params.get('event') || 'all';
    const sort = params.get('sort') || 'date-asc';

    syncSelectFromURL('event-filter', event);
    syncSelectFromURL('event-sort-filter', sort);

    document.getElementById('user-home-events-tab-container').style.display = 'flex';

    await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
    const result = await loadAPI.loadUserEvents(event, sort);
    const events = result.stadiums;

    renderEventsTab(events, elements);

    userHomeHeaderSkeleton.style.display = 'none';
    userHomeHeader.style.display = 'flex';
    document.getElementById('user-home-events-skeleton').style.display = 'none';
    if (events.length > 0) document.getElementById('user-home-events').style.display = 'flex';
    document.getElementById('user-home-events-filters-container-skeleton').style.display = 'none';
    document.getElementById('user-home-events-filters-container').style.display = 'block';
}

async function loadHomeTab() {
    document.title = 'Home - StadiumTrackr';

    document.getElementById('user-home-home-tab-container').style.display = 'flex';

    const [result, activity, mapData] = await Promise.all([
        userAPI.loadUserInfo(),
        userAPI.loadUserActivity('all', '', 'added-desc', 5),
        userAPI.loadUserHomeMap(),
        new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME))
    ]);

    allHomeMapStadiums = mapData.formattedRows;
    window.userHomeMapData = { stadiums: mapData.formattedRows };
    if (isPro()) setupHomeMapFilterHandlers();

    const favoriteStadiums = result.userFavoriteStadiums;
    renderHomeTabFavoriteStadiums(favoriteStadiums);

    const userStadiums = result.userStadiums;
    renderHomeTabUserStadiums(userStadiums);

    const userActivity = activity.userActivity;
    renderHomeTabRecentActivity(userActivity);

    const userWishlist = result.wishlistItems;
    renderHomeTabWishlist(userWishlist);

    const userAchievements = result.userAchievements;
    renderHomeTabAchievements(userAchievements);

    if (window.userHomeMapData) {
        await renderHomeTabMap();
    }

    userHomeHeaderSkeleton.style.display = 'none';
    userHomeHeader.style.display = 'flex';
    document.getElementById('user-favorite-stadiums-skeleton').style.display = 'none';
    document.getElementById('user-favorite-stadiums').style.display = 'flex';
    if (userStadiums.length > 0) document.getElementById('user-home-stadiums-see-all-button').style.display = 'block';
    document.getElementById('user-stadiums-skeleton').style.display = 'none';
    document.getElementById('user-stadiums').style.display = 'flex';
    document.getElementById('user-activity-skeleton').style.display = 'none';
    document.getElementById('user-activity').style.display = 'flex';
    if (userActivity.length > 0) document.getElementById('user-home-activity-see-all-button').style.display = 'block';
    document.getElementById('user-wishlist-stadiums-skeleton').style.display = 'none';
    document.getElementById('user-wishlist-stadiums').style.display = 'flex';
    if (userWishlist.length > 0) document.getElementById('user-home-wishlist-see-all-button').style.display = 'block';
    document.getElementById('user-achievements-skeleton').style.display = 'none';
    document.getElementById('user-achievements').style.display = 'flex';
    if (userAchievements.length > 0 && isPro()) document.getElementById('user-home-achievements-see-all-button').style.display = 'block';
    if (isPro()) {
        document.getElementById('user-home-map-filters').style.display = 'flex';
    }
    document.getElementById('user-home-map-filters-skeleton').style.display = 'none';
    document.getElementById('user-home-stadium-map-skeleton').style.display = 'none';
    document.getElementById('user-home-stadium-map').style.display = 'block';
}

async function loadListsTab(tab) {
    const token = localStorage.getItem('token');
    if (!token) return
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    const username = payload.username || '';
    document.title = username + "'s Lists - StadiumTrackr";

    if (!payload.isPro) {
        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
        userHomeHeaderSkeleton.style.display = 'none';
        userHomeHeader.style.display = 'flex';
        document.getElementById('user-home-lists-skeleton').style.display = 'none';
        document.getElementById('user-home-lists-filters-container-skeleton').style.display = 'none';
        document.getElementById('user-home-lists-upgrade').style.display = 'block';
        document.getElementById('user-home-lists-tab-container').style.display = 'flex';
        return;
    }

    const elements = {
        sortFilter: document.getElementById('lists-sort-filter'),
        clearFiltersButton: document.getElementById('lists-clear-filters'),
        stadiumsList: document.getElementById('user-home-lists'),
        stadiumsPageSelector: document.getElementById('lists-page-selector'),
        noStadiumsContainer: document.getElementById('user-home-no-lists-container'),
    }

    setupListsFilterHandlers(elements, tab);

    const params = new URLSearchParams(window.location.search);
    const sort = params.get('sort') || 'updated-desc';

    syncSelectFromURL('lists-sort-filter', sort);

    document.getElementById('user-home-lists-tab-container').style.display = 'flex';

    const [result] = await Promise.all([
        userAPI.loadUserLists(sort),
        new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME))
    ]);
    const lists = result.userLists;

    renderListsTab(lists, elements);

    userHomeHeaderSkeleton.style.display = 'none';
    userHomeHeader.style.display = 'flex';
    document.getElementById('user-home-lists-skeleton').style.display = 'none';
    if (lists.length > 0) document.getElementById('user-home-lists').style.display = 'flex';
    document.getElementById('user-home-lists-filters-container-skeleton').style.display = 'none';
    document.getElementById('user-home-lists-filters-container').style.display = 'block';
}

async function loadStadiumsTab(tab) {
    const token = localStorage.getItem('token');
    if (!token) return
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    const username = payload.username || '';
    document.title = username + "'s Stadiums - StadiumTrackr";

    const elements = {
        leagueFilter: document.getElementById('stadiums-league-filter'),
        countryFilter: document.getElementById('stadiums-country-filter'),
        sortFilter: document.getElementById('stadiums-sort-filter'),
        clearFiltersButton: document.getElementById('stadiums-clear-filters'),
        searchInput: document.getElementById('home-search-field'),
        stadiumCount: document.getElementById('stadiums-results-count'),
        searchStadiums: document.getElementById('stadiums-search-stadiums'),
        stadiumsList: document.getElementById('user-home-stadiums'),
        stadiumsPageSelector: document.getElementById('user-home-stadiums-page-selector'),
        noStadiumsContainer: document.getElementById('user-home-no-stadiums-container'),
        addStadiumMenu: document.getElementById('add-stadium-menu'),
        addStadiumDateVisited: document.getElementById('add-stadium-date-visited'),
        addStadiumNote: document.getElementById('add-stadium-note'),
        addStadiumPhotosInput: document.getElementById('add-stadium-photos-input'),
        addStadiumPhotosPreview: document.getElementById('add-stadium-photos-preview'),
        addStadiumPhotosCount: document.getElementById('add-stadium-photos-count'),
        closeAddStadiumMenu: document.getElementById('close-add-stadium-menu'),
        addStadiumName: document.getElementById('add-stadium-name'),
        addStadiumLocation: document.getElementById('add-stadium-location'),
        addStadiumImage: document.getElementById('add-stadium-image'),
        addStadiumLogButton: document.getElementById('add-stadium-log-button'),
        addStadiumCancelButton: document.getElementById('add-stadium-cancel-button')
    }

    const params = new URLSearchParams(window.location.search);
    const league = params.get('league') || 'all';
    const country = params.get('country') || 'all';
    const sort = params.get('sort') || 'added-desc';

    if (!params.has('page')) {
        sessionStorage.removeItem('userStadiumSearch');
    }

    setupFilterHandlers(elements, tab);
    setupSearch(() => allStadiums, elements, 'userStadiumsSearch');
    
    syncSelectFromURL('stadiums-league-filter', league);
    syncSelectFromURL('stadiums-country-filter', country);
    syncSelectFromURL('stadiums-sort-filter', sort);
    
    document.getElementById('user-home-stadiums-tab-container').style.display = 'flex';

    await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
    const result = await userAPI.loadUserStadiums(league, country, sort);
    const stadiums = result.userStadiums;

    allStadiums = stadiums;

    const query = document.getElementById('home-search-field').value.toLowerCase().trim();
    const filtered = query ? filterAndRank(allStadiums, query) : stadiums;

    const plural = filtered.length === 1 ? 'stadium' : 'stadiums';
    elements.stadiumCount.textContent = `Showing ${filtered.length} ${plural}`;

    renderWithoutTransition(elements, filtered);

    userHomeHeaderSkeleton.style.display = 'none';
    userHomeHeader.style.display = 'flex';
    document.getElementById('user-home-stadiums-skeleton').style.display = 'none';
    if (filtered.length > 0) document.getElementById('user-home-stadiums').style.display = 'flex';
    document.getElementById('user-home-stadiums-filters-container-skeleton').style.display = 'none';
    document.getElementById('user-home-stadiums-filters-container').style.display = 'block';
}

async function loadTab(tab) {
    switch (tab) {
        case "home":
            await loadHomeTab();
            break;
        case "stadiums":
            await loadStadiumsTab(tab);
            break;
        case "visits":
            await loadVisitsTab(tab);
            break;
        case "events":
            await loadEventsTab(tab);
            break;
        case "wishlist":
            await loadWishlistTab(tab);
            break;
        case "lists":
            await loadListsTab(tab);
            break;
        case "activity":
            await loadActivityTab(tab);
            break;
        case "achievements":
            await loadAchievementsTab(tab);
            break;
        default:
            await loadHomeTab();
            break;
    }
}

async function loadUserHeader() {
    try {
        const result = await userAPI.loadUserInfo();

        const token = localStorage.getItem('token');
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
                                        const payload = JSON.parse(atob(base64));
        const profilePic = payload.profilePic;
        const numStadiums = result.numStadiumsVisited;
        const numCountries = result.numCountriesVisited;
        const numEvents = result.numEventsAttended;

        if (result.userFavoriteStadiums.length > 0) {
            document.getElementById('user-home-header').classList.add('with-background-image');
            const userHomeImage = document.createElement('img');
            userHomeImage.id = 'user-home-image';
            userHomeImage.src = STADIUM_IMAGE_PATH + result.userFavoriteStadiums[0].image;
            document.querySelector('main').prepend(userHomeImage);

            userHomeImage.onload = () => {
                userHomeImage.classList.add('loaded');
            };
        }

        document.getElementById('user-home-profile-pic').src = PROFILE_PIC_PATH + profilePic;
        document.getElementById('user-home-username').textContent = payload.username;
        document.getElementById('num-stadiums').textContent = numStadiums;
        document.getElementById('num-events').textContent = numEvents;
        document.getElementById('num-countries').textContent = numCountries;

    } catch (error) {
        console.error(error);
    }
}

async function loadVisitsTab(tab) {
    const token = localStorage.getItem('token');
    if (!token) return
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    const username = payload.username || '';
    document.title = username + "'s Visits - StadiumTrackr";

    const elements = {
        leagueFilter: document.getElementById('visits-league-filter'),
        countryFilter: document.getElementById('visits-country-filter'),
        sortFilter: document.getElementById('visits-sort-filter'),
        clearFiltersButton: document.getElementById('visits-clear-filters'),
        stadiumsList: document.getElementById('user-home-visits'),
        stadiumsPageSelector: document.getElementById('visits-page-selector'),
        noStadiumsContainer: document.getElementById('no-visits-container'),
        editLogMenu: document.getElementById('edit-log-menu'),
        closeEditLogMenu: document.getElementById('close-edit-log-menu'),
        editLogSaveButton: document.getElementById('edit-log-save-button'),
        editLogCancelButton: document.getElementById('edit-log-cancel-button'),
        editLogName: document.getElementById('edit-log-name'),
        editLogLocation: document.getElementById('edit-log-location'),
        editLogImage: document.getElementById('edit-log-image'),
        editLogDateVisited: document.getElementById('edit-log-date-visited'),
        editLogNote: document.getElementById('edit-log-note'),
        editLogPhotosInput: document.getElementById('edit-log-photos-input'),
        editLogPhotosPreview: document.getElementById('edit-log-photos-preview'),
        editLogPhotosCount: document.getElementById('edit-log-photos-count'),
        deleteLogMenu: document.getElementById('delete-log-menu'),
        closeDeleteLogMenu: document.getElementById('close-delete-log-menu'),
        deleteLogCancelButton: document.getElementById('delete-log-cancel-button'),
        deleteLogDeleteButton: document.getElementById('delete-log-delete-button')
    }

    setupFilterHandlers(elements, tab);

    const params = new URLSearchParams(window.location.search);
    const league = params.get('league') || 'all';
    const country = params.get('country') || 'all';
    const sort = params.get('sort') || 'visited-desc';
    
    syncSelectFromURL('visits-league-filter', league);
    syncSelectFromURL('visits-country-filter', country);
    syncSelectFromURL('visits-sort-filter', sort);
    
    document.getElementById('user-home-visits-tab-container').style.display = 'flex';

    await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
    const result = await userAPI.loadUserVisits(league, country, sort);
    const stadiums = result.userVisits;

    const loggedStadiums = stadiums.filter(stadium => stadium.visited_on);
    renderVisitsTab(loggedStadiums, elements);

    userHomeHeaderSkeleton.style.display = 'none';
    userHomeHeader.style.display = 'flex';
    document.getElementById('user-home-visits-skeleton').style.display = 'none';
    if (loggedStadiums.length > 0) document.getElementById('user-home-visits').style.display = 'flex';
    document.getElementById('user-home-visits-filters-container-skeleton').style.display = 'none';
    document.getElementById('user-home-visits-filters-container').style.display = 'block';
}

async function loadWishlistTab(tab) {
    const token = localStorage.getItem('token');
    if (!token) return
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    const username = payload.username || '';
    document.title = username + "'s Wishlist - StadiumTrackr";

    const elements = {
        leagueFilter: document.getElementById('wishlist-league-filter'),
        countryFilter: document.getElementById('wishlist-country-filter'),
        sortFilter: document.getElementById('wishlist-sort-filter'),
        clearFiltersButton: document.getElementById('wishlist-clear-filters'),
        searchInput: document.getElementById('wishlist-search-field'),
        stadiumCount: document.getElementById('wishlist-results-count'),
        searchStadiums: document.getElementById('search-wishlist-stadiums'),
        stadiumsList: document.getElementById('user-home-wishlist'),
        stadiumsPageSelector: document.getElementById('user-home-wishlist-page-selector'),
        noStadiumsContainer: document.getElementById('user-home-no-wishlist-container'),
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

    const params = new URLSearchParams(window.location.search);
    const league = params.get('league') || 'all';
    const country = params.get('country') || 'all';
    const sort = params.get('sort') || 'added-desc';

    if (!params.has('page')) {
        sessionStorage.removeItem('userWishlistSearch');
    }

    setupFilterHandlers(elements, tab);
    setupSearch(() => allStadiums, elements, 'userWishlistSearch');

    syncSelectFromURL('wishlist-league-filter', league);
    syncSelectFromURL('wishlist-country-filter', country);
    syncSelectFromURL('wishlist-sort-filter', sort);

    document.getElementById('user-home-wishlist-tab-container').style.display = 'flex';

    await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
    const result = await userAPI.loadUserWishlist(league, country, sort);
    const stadiums = result.userWishlist;

    allStadiums = stadiums;

    const query = document.getElementById('wishlist-search-field').value.toLowerCase().trim();
    const filtered = query ? filterAndRank(allStadiums, query) : stadiums;

    const plural = filtered.length === 1 ? 'stadium' : 'stadiums';
    elements.stadiumCount.textContent = `Showing ${filtered.length} ${plural}`;

    renderWithoutTransition(elements, filtered);

    userHomeHeaderSkeleton.style.display = 'none';
    userHomeHeader.style.display = 'flex';
    document.getElementById('user-home-wishlist-skeleton').style.display = 'none';
    if (filtered.length > 0) document.getElementById('user-home-wishlist').style.display = 'flex';
    document.getElementById('user-home-wishlist-filters-container-skeleton').style.display = 'none';
    document.getElementById('user-home-wishlist-filters-container').style.display = 'block';
}

async function renderHomeTabMap(stadiums = null) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const data = stadiums || window.userHomeMapData.stadiums;
    
    if (window.userHomeMap) {
        window.userHomeMap.remove();
        window.userHomeMap = null;
    }
    
    window.userHomeMap = L.map('user-home-stadium-map').setView([40.8283, -96.5795], 4);
    
    const customIcon = L.icon({
        iconUrl: '/images/icons/pin-blue.png',
        iconSize: [25, 35],
        iconAnchor: [16, 40],
        popupAnchor: [-3, -40]
    });
    
    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
        attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        ext: 'jpg'
    }).addTo(window.userHomeMap);
    
    data.forEach(stadium => {
        L.marker(stadium.location, { icon: customIcon })
            .addTo(window.userHomeMap)
            .bindPopup(`
                <div class="popup-card">
                    <h4>${stadium.stadium_name}</h4>
                    <p>${stadium.address}</p>
                    <a href="stadium.html?id=${encodeURIComponent(stadium.stadium_id)}">
                        <img src="/images/stadiums/${stadium.image}" alt="${stadium.stadium_name}" />
                    </a>
                </div>
            `);
    });
    
    setTimeout(() => {
        window.userHomeMap.invalidateSize();
    }, 100);
}

/*  Functions  */
function filterHomeMapStadiums(stadiums) {
    const league = document.getElementById('home-map-league-filter').value;
    const country = document.getElementById('home-map-country-filter').value;
    return stadiums.filter(s => {
        if (league !== 'all' && s.league.toLowerCase() !== league) return false;
        if (country !== 'all') {
            const countryMap = { us: 'The United States of America', canada: 'Canada' };
            if (s.country !== countryMap[country]) return false;
        }
        return true;
    });
}

function renderAchievementsTab(achievements, elements) {
    if (achievements.length === 0) {
        elements.stadiumsList.style.display = 'none';
        elements.stadiumsPageSelector.style.display = 'none';
        elements.noStadiumsContainer.style.display = 'block';
    } else {
        elements.stadiumsList.style.display = 'flex';
        elements.stadiumsPageSelector.style.display = 'flex';
        elements.noStadiumsContainer.style.display = 'none';

        const perPage = 18;
        const pageCount = Math.ceil(achievements.length / perPage);
        let currentPage = Math.min(getPageFromURL(), pageCount);

        function renderPage(page) {
            elements.stadiumsList.innerHTML = '';
            const start = (page - 1) * perPage;
            const end = start + perPage;
            achievements.slice(start, end).forEach(achievement => {
                const userHomeAchievement = document.createElement('div');
                userHomeAchievement.classList.add('user-home-achievement');

                const userHomeAchievementHeader = document.createElement('div');
                userHomeAchievementHeader.classList.add('user-home-achievement-header');
                
                const userHomeAchievementName = document.createElement('h3');
                userHomeAchievementName.classList.add('user-home-achievement-name');
                userHomeAchievementName.textContent = achievement.achievement_name;

                const userHomeAchievementPercent = document.createElement('h3');
                userHomeAchievementPercent.classList.add('user-home-achievement-percent');
                const progressValue = achievement.progress_value ?? 0;
                const progressPercent = Math.min((progressValue / achievement.progress_goal) * 100, 100);
                userHomeAchievementPercent.textContent = `${progressPercent.toFixed(0)}%`;

                userHomeAchievementHeader.appendChild(userHomeAchievementName);
                userHomeAchievementHeader.appendChild(userHomeAchievementPercent);

                const userHomeAchievementInfo = document.createElement('div');
                userHomeAchievementInfo.classList.add('user-home-achievement-info');

                const userHomeAchievementImage = document.createElement('img');
                userHomeAchievementImage.classList.add('user-home-achievement-image');
                userHomeAchievementImage.src = ICON_IMAGE_PATH + achievement.achievement_image;

                const userHomeAchievementDescription = document.createElement('p');
                userHomeAchievementDescription.classList.add('user-home-achievement-description');
                userHomeAchievementDescription.textContent = achievement.achievement_description;

                userHomeAchievementInfo.appendChild(userHomeAchievementImage);
                userHomeAchievementInfo.appendChild(userHomeAchievementDescription);

                const userHomeAchievementProgressContainer = document.createElement('div');
                userHomeAchievementProgressContainer.classList.add('user-home-achievement-progress-container');

                const userHomeAchievementProgressBar = document.createElement('div');
                userHomeAchievementProgressBar.classList.add('user-home-achievement-progress-bar');

                const barWidth = 241;
                const blueWidth = (progressPercent / 100) * barWidth;
                const grayWidth = barWidth - blueWidth;

                const blueBar = document.createElement('div');
                blueBar.className = 'user-home-achievement-progress-bar-blue';
                blueBar.style.width = `${blueWidth}px`;
                if (blueWidth >= 241) blueBar.style.borderRadius = '25px';

                const grayBar = document.createElement('div');
                grayBar.className = 'user-home-achievement-progress-bar-gray';
                grayBar.style.width = `${grayWidth}px`;
                if (grayWidth >= 241) grayBar.style.borderRadius = '25px';
                if (grayWidth === 0) grayBar.style.border = 'none';

                userHomeAchievementProgressBar.appendChild(blueBar);
                userHomeAchievementProgressBar.appendChild(grayBar);

                const userHomeAchievementProgress = document.createElement('span');
                userHomeAchievementProgress.classList.add('user-home-achievement-progress');
                userHomeAchievementProgress.textContent = `${Math.min(progressValue, achievement.progress_goal)}/${achievement.progress_goal}`;

                userHomeAchievementProgressContainer.appendChild(userHomeAchievementProgressBar)
                userHomeAchievementProgressContainer.appendChild(userHomeAchievementProgress);

                const unlockedText = achievement.unlocked
                    ? `Unlocked on ${formatDate(achievement.unlocked_on)}`
                    : 'Not Yet Unlocked';

                const userHomeAchievementUnlockedText = document.createElement('h4');
                userHomeAchievementUnlockedText.classList.add('user-home-achievement-unlocked-text');
                userHomeAchievementUnlockedText.textContent = unlockedText;

                userHomeAchievement.appendChild(userHomeAchievementHeader);
                userHomeAchievement.appendChild(userHomeAchievementInfo);
                userHomeAchievement.appendChild(userHomeAchievementProgressContainer);
                userHomeAchievement.appendChild(userHomeAchievementUnlockedText);

                elements.stadiumsList.appendChild(userHomeAchievement);
            });
        }

        renderPage(currentPage);
        renderPageNumbers(elements, currentPage, pageCount);
    }
}

function renderActivityTab(stadiums, elements) {
    if (stadiums.length === 0) {
        elements.stadiumsList.style.display = 'none';
        elements.stadiumsPageSelector.style.display = 'none';
        elements.noStadiumsContainer.style.display = 'block';
    } else {
        elements.stadiumsList.style.display = 'flex';
        elements.stadiumsPageSelector.style.display = 'flex';
        elements.noStadiumsContainer.style.display = 'none';

        const perPage = 18;
        const pageCount = Math.ceil(stadiums.length / perPage);
        let currentPage = Math.min(getPageFromURL(), pageCount);

        const hasLoggedVisits = stadiums.some(s => s.activity_type === "stadium" && s.visited_on);
        if (hasLoggedVisits) {
            setupEditLogHandlers(elements, () => currentData);
            setupDeleteLogHandlers(elements, () => currentData);
        }

        function renderPage(page) {
            elements.stadiumsList.innerHTML = '';
            const start = (page - 1) * perPage;
            const end = start + perPage;
            stadiums.slice(start, end).forEach(stadium => {
                if (stadium.activity_type === "stadium" && stadium.visited_on) {
                    const userHomeLogActivity = document.createElement('div');
                    userHomeLogActivity.classList.add('user-home-log-activity');

                    const userHomeLogActivityHeader = document.createElement('div');
                    userHomeLogActivityHeader.classList.add('user-home-log-activity-header');

                    const userHomeLogActivityTitle = document.createElement('h3');
                    userHomeLogActivityTitle.textContent = 'Logged visit to ';

                    const userHomeLogActivityTitleLink = document.createElement('a');
                    userHomeLogActivityTitleLink.href = `stadium.html?id=${stadium.stadium_id}`;
                    userHomeLogActivityTitleLink.textContent = stadium.stadium_name;

                    userHomeLogActivityTitle.appendChild(userHomeLogActivityTitleLink);

                    const userHomeActivityDate = document.createElement('h4');
                    userHomeActivityDate.classList.add('user-home-activity-date');
                    userHomeActivityDate.textContent = timeAgo(stadium.added_on);

                    userHomeLogActivityHeader.appendChild(userHomeLogActivityTitle);
                    userHomeLogActivityHeader.appendChild(userHomeActivityDate);

                    const userHomeLogActivityInfoContainer = document.createElement('div');
                    userHomeLogActivityInfoContainer.classList.add('user-home-log-activity-info-container');

                    const userHomeActivityLogImage = document.createElement('img');
                    userHomeActivityLogImage.classList.add('user-home-activity-log-image');
                    userHomeActivityLogImage.src = STADIUM_IMAGE_PATH + stadium.image;

                    const userHomeLogActivityInfo = document.createElement('div');
                    userHomeLogActivityInfo.classList.add('user-home-log-activity-info');

                    const userHomeLogActivityDetails = document.createElement('div');
                    userHomeLogActivityDetails.classList.add('user-home-log-activity-details');

                    const dateContainer = document.createElement('div');

                    const dateVisited = document.createElement('h5');
                    dateVisited.textContent = 'Date Visited';

                    const date = document.createElement('h4');
                    date.textContent = formatDate(stadium.visited_on);

                    dateContainer.appendChild(dateVisited);
                    dateContainer.appendChild(date);

                    const noteContainer = document.createElement('div');

                    const noteTitle = document.createElement('h5');
                    noteTitle.textContent = 'Note';

                    const note = document.createElement('h4');
                    if (stadium.user_note) {
                        note.textContent = stadium.user_note;
                    } else {
                        note.style.color = 'var(--color-text-muted)';
                        note.style.fontStyle = 'italic';
                        note.textContent = 'No note added';
                    }

                    noteContainer.appendChild(noteTitle);
                    noteContainer.appendChild(note);

                    userHomeLogActivityDetails.appendChild(dateContainer);
                    userHomeLogActivityDetails.appendChild(noteContainer);

                    const userHomeLogActivityButtons = document.createElement('div');
                    userHomeLogActivityButtons.classList.add('user-home-log-activity-buttons');

                    const userHomeLogActivityEditLogButton = document.createElement('button');
                    userHomeLogActivityEditLogButton.classList.add('user-home-log-activity-edit-log-button');
                    userHomeLogActivityEditLogButton.textContent = 'Edit Log';

                    userHomeLogActivityEditLogButton.addEventListener('click', async () => {
                        currentData = { visit_id: stadium.visit_id };
                        elements.editLogName.textContent = stadium.stadium_name;
                        elements.editLogLocation.textContent = stadium.city + ', ' + stadium.state;
                        elements.editLogImage.src = STADIUM_IMAGE_PATH + stadium.image;
                        elements.editLogDateVisited.value = stadium.visited_on.split('T')[0];
                        const now = new Date();
                        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                        elements.editLogDateVisited.setAttribute('max', today);
                        elements.editLogNote.value = stadium.user_note || '';

                        elements.editLogPhotosPreview.innerHTML = '';
                        if (stadium.photos && stadium.photos.length > 0) {
                            stadium.photos.forEach(photo => {
                                addExistingPhotoPreview(photo, elements);
                            });
                        }
                        updateEditLogPhotoCount(elements);

                        toggleMenu(elements.editLogMenu, true, overlay);
                    });

                    const userHomeLogActivityRemoveButton = document.createElement('button');
                    userHomeLogActivityRemoveButton.classList.add('user-home-log-activity-remove-button');
                    userHomeLogActivityRemoveButton.textContent = 'Remove';

                    userHomeLogActivityRemoveButton.addEventListener('click', () => {
                        currentData = { visit_id: stadium.visit_id };
                        toggleMenu(elements.deleteLogMenu, true, overlay);
                    });

                    userHomeLogActivityButtons.appendChild(userHomeLogActivityEditLogButton);
                    userHomeLogActivityButtons.appendChild(userHomeLogActivityRemoveButton);

                    userHomeLogActivityInfo.appendChild(userHomeLogActivityDetails);
                    userHomeLogActivityInfo.appendChild(userHomeLogActivityButtons);

                    userHomeLogActivityInfoContainer.appendChild(userHomeActivityLogImage);
                    userHomeLogActivityInfoContainer.appendChild(userHomeLogActivityInfo);

                    if (stadium.photos && stadium.photos.length > 0) {
                        const photosContainer = document.createElement('div');
                        photosContainer.classList.add('activity-photos-container');

                        const photosContainerHeader = document.createElement('h5');
                        photosContainerHeader.classList.add('photos-container-header');
                        photosContainerHeader.textContent = 'Photos';

                        photosContainer.appendChild(photosContainerHeader);

                        stadium.photos.forEach(photo => {
                            const img = document.createElement('img');
                            img.src = `/images/visit-photos/${photo.filename}`;
                            img.classList.add('activity-photo');
                            img.addEventListener('click', () => openLightbox(img.src));
                            img.style.cursor = 'pointer';
                            photosContainer.appendChild(img);
                        });

                        userHomeLogActivityInfoContainer.appendChild(photosContainer);
                    }

                    userHomeLogActivity.appendChild(userHomeLogActivityHeader);
                    userHomeLogActivity.appendChild(userHomeLogActivityInfoContainer);

                    elements.stadiumsList.appendChild(userHomeLogActivity);
                } else if (stadium.activity_type === "stadium") {
                    const userHomeVisitActivity = document.createElement('div');
                    userHomeVisitActivity.classList.add('user-home-visit-activity');

                    const userHomeVisitActivityTitle = document.createElement('h3');
                    userHomeVisitActivityTitle.textContent = 'Marked ';

                    const link = document.createElement('a');
                    link.href = `stadium.html?id=${stadium.stadium_id}`;
                    link.textContent = stadium.stadium_name;

                    userHomeVisitActivityTitle.appendChild(link);
                    userHomeVisitActivityTitle.appendChild(document.createTextNode(' as visited'));

                    const userHomeActivityDate = document.createElement('h4');
                    userHomeActivityDate.textContent = timeAgo(stadium.added_on);

                    userHomeVisitActivity.appendChild(userHomeVisitActivityTitle);
                    userHomeVisitActivity.appendChild(userHomeActivityDate);

                    elements.stadiumsList.appendChild(userHomeVisitActivity);
                } else if (stadium.activity_type === "wishlist") {
                    const userHomeWishlistActivity = document.createElement('div');
                    userHomeWishlistActivity.classList.add('user-home-wishlist-activity');

                    const userHomeWishlistActivityTitle = document.createElement('h3');
                    userHomeWishlistActivityTitle.textContent = 'Added ';

                    const link = document.createElement('a');
                    link.href = `stadium.html?id=${stadium.stadium_id}`;
                    link.textContent = stadium.stadium_name;

                    userHomeWishlistActivityTitle.appendChild(link);
                    userHomeWishlistActivityTitle.appendChild(document.createTextNode(' to your wishlist'));

                    const userHomeActivityDate = document.createElement('h4');
                    userHomeActivityDate.textContent = timeAgo(stadium.added_on);

                    userHomeWishlistActivity.appendChild(userHomeWishlistActivityTitle);
                    userHomeWishlistActivity.appendChild(userHomeActivityDate);

                    elements.stadiumsList.appendChild(userHomeWishlistActivity);
                }
            });
        }

        renderPage(currentPage);
        renderPageNumbers(elements, currentPage, pageCount);
    }
}

function renderEventsTab(events, elements) {
    if (events.length === 0) {
        elements.stadiumsList.style.display = 'none';
        elements.stadiumsPageSelector.style.display = 'none';
        elements.noStadiumsContainer.style.display = 'block';
    } else {
        elements.stadiumsList.style.display = 'flex';
        elements.stadiumsPageSelector.style.display = 'flex';
        elements.noStadiumsContainer.style.display = 'none';

        const perPage = 18;
        const pageCount = Math.ceil(events.length / perPage);
        let currentPage = Math.min(getPageFromURL(), pageCount);

        function renderPage(page) {
            elements.stadiumsList.innerHTML = '';
            const start = (page - 1) * perPage;
            const end = start + perPage;
            events.slice(start, end).forEach(event => {
                const userHomeEvent = document.createElement('div');
                userHomeEvent.classList.add('user-home-event');

                const header = document.createElement('div');
                header.classList.add('user-home-event-header');

                const headerName = document.createElement('h3');
                headerName.classList.add('user-home-event-header-name');
                const headerLink = document.createElement('a');
                headerLink.href = `stadium.html?id=${event.stadium_id}`;
                headerLink.textContent = event.stadium_name;
                headerName.appendChild(headerLink);

                const headerLocation = document.createElement('h4');
                headerLocation.classList.add('user-home-event-header-location');
                headerLocation.textContent = `${event.city}, ${event.state}`;

                header.appendChild(headerName);
                header.appendChild(headerLocation);

                const infoContainer = document.createElement('div');
                infoContainer.classList.add('user-home-event-info-container');

                const image = document.createElement('img');
                image.src = STADIUM_IMAGE_PATH + event.image;
                image.classList.add('user-home-event-image');

                const info = document.createElement('div');
                info.classList.add('user-home-event-info');

                const eventName = document.createElement('h3');
                eventName.classList.add('user-home-event-name');
                eventName.textContent = event.nextEvent.name;

                const datetime = document.createElement('div');
                datetime.classList.add('user-home-event-datetime');

                const date = document.createElement('h4');
                date.classList.add('user-home-event-date');
                date.textContent = formatEventDate(event.nextEvent.dates.start.localDate);

                const time = document.createElement('h4');
                time.classList.add('user-home-event-time');
                time.textContent = formatEventTime(event.nextEvent.dates.start.dateTime, event.nextEvent.dates.timezone);

                datetime.appendChild(date);
                datetime.appendChild(time);
                info.appendChild(eventName);
                info.appendChild(datetime);

                const link = document.createElement('a');
                link.href = event.nextEvent.url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.classList.add('user-home-event-link');
                link.textContent = 'Buy Tickets →';

                infoContainer.appendChild(image);
                infoContainer.appendChild(info);
                infoContainer.appendChild(link);

                userHomeEvent.appendChild(header);
                userHomeEvent.appendChild(infoContainer);
                elements.stadiumsList.appendChild(userHomeEvent);
            });
        }

        renderPage(currentPage);
        renderPageNumbers(elements, currentPage, pageCount);
    }
}

function renderHomeTabAchievements(achievements) {
    if (!isPro()) {
        const upgradeText = document.createElement('h3');
        upgradeText.classList.add('user-home-tab-achievements-upgrade')
        upgradeText.textContent = 'Achievements is a Pro feature';

        const upgradeDescription = document.createElement('p');
        upgradeDescription.textContent = 'Upgrade to Pro to earn and track achievements.';

        const upgradeButton = document.createElement('a');
        upgradeButton.href = 'pro';
        upgradeButton.className = 'upgrade-pro-button';
        upgradeButton.textContent = 'Upgrade';

        const container = document.getElementById('user-achievements');
        container.appendChild(upgradeText);
        container.appendChild(upgradeDescription);
        container.appendChild(upgradeButton);
        return;
    }

    if (achievements.length === 0) {
        document.getElementById('user-home-no-achievements-text').style.display = 'block';
        return;
    }

    document.getElementById('user-achievements').innerHTML = '';
    achievements.forEach(achievement => {
        const container = document.createElement('div');
        container.classList.add('user-achievement');

        const img = document.createElement('img');
        img.classList.add('user-achievement-image');
        img.src = ICON_IMAGE_PATH + achievement.achievement_image;
        img.alt = achievement.achievement_name;

        const textDiv = document.createElement('div');
        textDiv.classList.add('user-achievement-text');

        const name = document.createElement('h3');
        name.textContent = achievement.achievement_name;

        const description = document.createElement('h4');
        description.textContent = achievement.achievement_description;

        textDiv.appendChild(name);
        textDiv.appendChild(description);
        container.appendChild(img);
        container.appendChild(textDiv);
        document.getElementById('user-achievements').appendChild(container);
    });
}

function renderHomeTabFavoriteStadiums(stadiums) {
    if (stadiums.length === 0) {
        document.getElementById('user-favorite-stadiums-no-favorites-text').style.display = 'block';
        document.getElementById('user-home-header-skeleton').style.marginTop = '50px';
        return;
    }

    stadiums.forEach(stadium => {
        const userFavoriteStadium = document.createElement('div');
        userFavoriteStadium.classList.add('user-favorite-stadium');

        const userFavoriteStadiumLink = document.createElement('a');
        userFavoriteStadiumLink.href = `stadium.html?id=${encodeURIComponent(stadium.stadium_id)}`;

        const userFavoriteStadiumImage = document.createElement('img');
        userFavoriteStadiumImage.src = STADIUM_IMAGE_PATH + stadium.image;
        userFavoriteStadiumImage.alt = stadium.stadium_name;
        userFavoriteStadiumLink.appendChild(userFavoriteStadiumImage);

        const userFavoriteStadiumText = document.createElement('div');
        userFavoriteStadiumText.classList.add('user-favorite-stadium-text');

        const userFavoriteStadiumName = document.createElement('h3');
        userFavoriteStadiumName.textContent = stadium.stadium_name;
        userFavoriteStadiumText.appendChild(userFavoriteStadiumName);

        const userFavoriteStadiumLocation = document.createElement('h4');
        userFavoriteStadiumLocation.textContent = `${stadium.city}, ${stadium.state}`;
        userFavoriteStadiumText.appendChild(userFavoriteStadiumLocation);

        userFavoriteStadiumLink.appendChild(userFavoriteStadiumText);

        userFavoriteStadium.appendChild(userFavoriteStadiumLink);

        document.getElementById('user-favorite-stadiums').appendChild(userFavoriteStadium);
    })

    for (let i = 0; i < 4 - stadiums.length; i++) {
        const userFavoriteStadiumEmpty = document.createElement('div');
        userFavoriteStadiumEmpty.classList.add('user-favorite-stadium-empty');
        document.getElementById('user-favorite-stadiums').appendChild(userFavoriteStadiumEmpty);
    }   
}

function renderHomeTabRecentActivity(activity) {
    if (activity.length === 0) {
        document.getElementById('user-activity-no-activity-text').style.display = 'block';
        return;
    }    

    activity.forEach(activity => {
        const userActivity = document.createElement('div');
        userActivity.classList.add('user-activity-text');

        let activityText = document.createElement('h4');
        if (activity.visited_on) {
            const link = document.createElement('a');
            link.href = `user-activity.html?id=${activity.stadium_id}`;
            link.textContent = activity.stadium_name;
            
            activityText.appendChild(document.createTextNode('Visited '));
            activityText.appendChild(link);
            activityText.appendChild(document.createTextNode(' on ' + formatDate(activity.visited_on)));
        } else if (activity.activity_type === 'wishlist') {
            const link = document.createElement('a');
            link.href = `stadium.html?id=${activity.stadium_id}`;
            link.textContent = activity.stadium_name;
            
            activityText.appendChild(document.createTextNode('Added '));
            activityText.appendChild(link);
            activityText.appendChild(document.createTextNode(' to your wishlist'));
        } else {
            const link = document.createElement('a');
            link.href = `stadium.html?id=${activity.stadium_id}`;
            link.textContent = activity.stadium_name;
            
            activityText.appendChild(document.createTextNode('Marked '));
            activityText.appendChild(link);
            activityText.appendChild(document.createTextNode(' as visited'));
        }
        userActivity.appendChild(activityText);

        const activityTime = document.createElement('h5');
        activityTime.textContent = timeAgo(activity.added_on).replace(' ago', '');
        userActivity.appendChild(activityTime);

        document.getElementById('user-activity').appendChild(userActivity);
    })
}

function renderHomeTabUserStadiums(stadiums) {
    if (stadiums.length === 0) {
        document.getElementById('user-stadiums-no-stadiums-text').style.display = 'block';
        return;
    }

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

    stadiums.forEach(stadium => {
        const element = createUserStadiumElement(stadium, elements);
        document.getElementById('user-stadiums').appendChild(element);
    });
}

function renderHomeTabWishlist(stadiums) {
    if (stadiums.length === 0) {
        document.getElementById('user-wishlist-stadiums-no-stadiums-text').style.display = 'block';
        return;
    }

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

    stadiums.forEach(stadium => {
        const element = createUserStadiumElement(stadium, elements);
        document.getElementById('user-wishlist-stadiums').appendChild(element);
    });
}

function renderListsTab(lists, elements) {
    if (lists.length === 0) {
        elements.stadiumsList.style.display = 'none';
        elements.stadiumsPageSelector.style.display = 'none';
        elements.noStadiumsContainer.style.display = 'block';
    } else {
        elements.stadiumsList.style.display = 'flex';
        elements.stadiumsPageSelector.style.display = 'flex';
        elements.noStadiumsContainer.style.display = 'none';

        const perPage = 18;
        const pageCount = Math.ceil(lists.length / perPage);
        let currentPage = Math.min(getPageFromURL(), pageCount);

        function renderPage(page) {
            elements.stadiumsList.innerHTML = '';
            const start = (page - 1) * perPage;
            const end = start + perPage;
            lists.slice(start, end).forEach(list => {
                const userHomeList = document.createElement('div');
                userHomeList.classList.add('user-home-list');

                const userHomeListHeader = document.createElement('div');
                userHomeListHeader.classList.add('user-home-list-header');

                const userHomeListHeaderName = document.createElement('a');
                userHomeListHeaderName.classList.add('user-home-list-header-name');
                userHomeListHeaderName.href = `list.html?mode=view&id=${list.list_id}`;
                userHomeListHeaderName.textContent = list.list_name;

                const userHomeListHeaderCount = document.createElement('span');
                userHomeListHeaderCount.classList.add('user-home-list-header-count');
                userHomeListHeaderCount.textContent = list.stadium_count + ' Stadiums'

                userHomeListHeader.appendChild(userHomeListHeaderName);
                userHomeListHeader.appendChild(userHomeListHeaderCount)

                userHomeList.appendChild(userHomeListHeader);

                const userHomeListStadiumsContainer = document.createElement('div');
                userHomeListStadiumsContainer.classList.add('user-home-list-stadiums-container');

                const userHomeListLink = document.createElement('a');
                userHomeListLink.href = `list.html?mode=view&id=${list.list_id}`;

                const userHomeListImages = document.createElement('div');
                userHomeListImages.classList.add('user-home-list-images');

                const totalSlots = 5;
                const imagesToShow = list.images.slice(0, 5);

                imagesToShow.forEach((image, index) => {
                    const userHomeListImage = document.createElement('img');
                    userHomeListImage.classList.add('user-home-list-image');
                    userHomeListImage.src = STADIUM_IMAGE_PATH + image;
                    userHomeListImage.style.zIndex = totalSlots - index;
                    userHomeListImage.style.position = 'relative';
                    userHomeListImages.appendChild(userHomeListImage);
                });

                for (let i = 0; i < totalSlots - imagesToShow.length; i++) {
                    const userHomeListImageEmpty = document.createElement('div');
                    userHomeListImageEmpty.classList.add('user-home-list-image-empty');
                    userHomeListImageEmpty.style.zIndex = totalSlots - imagesToShow.length - i;
                    userHomeListImageEmpty.style.position = 'relative';
                    userHomeListImages.appendChild(userHomeListImageEmpty);
                }

                userHomeListLink.appendChild(userHomeListImages)

                const userHomeListEditListButton = document.createElement('a');
                userHomeListEditListButton.classList.add('user-home-list-edit-list-button');
                userHomeListEditListButton.href = `list.html?mode=edit&id=${list.list_id}`;

                const editImg = document.createElement('img');
                editImg.src = ICON_IMAGE_PATH + 'edit.png';

                userHomeListEditListButton.appendChild(editImg);

                userHomeListStadiumsContainer.appendChild(userHomeListLink);
                userHomeListStadiumsContainer.appendChild(userHomeListEditListButton);

                userHomeList.appendChild(userHomeListStadiumsContainer);

                elements.stadiumsList.appendChild(userHomeList);

            });
        }

        renderPage(currentPage);
        renderPageNumbers(elements, currentPage, pageCount);
    }
}

function renderVisitsTab(stadiums, elements) {
    if (stadiums.length === 0) {
        elements.stadiumsList.style.display = 'none';
        elements.stadiumsPageSelector.style.display = 'none';
        elements.noStadiumsContainer.style.display = 'block';
    } else {
        elements.stadiumsList.style.display = 'flex';
        elements.stadiumsPageSelector.style.display = 'flex';
        elements.noStadiumsContainer.style.display = 'none';

        const params = new URLSearchParams(window.location.search);
        const sort = params.get('sort') || 'visited-desc';
        const showYearHeaders = sort === 'visited-desc' || sort === 'visited-asc';

        const stadiumsByYear = Object.entries(
            stadiums.reduce((acc, stadium) => {
                const year = new Date(stadium.visited_on).getFullYear();
                if (!acc[year]) acc[year] = [];
                acc[year].push(stadium);
                return acc;
            }, {})
        ).map(([year, stadiums]) => ({ year, stadiums }))
        .sort((a, b) => sort === 'visited-asc' ? a.year - b.year : b.year - a.year);

        const perPage = 10;
        const pageCount = Math.ceil(stadiums.length / perPage);
        let currentPage = Math.min(getPageFromURL(), pageCount);

        setupEditLogHandlers(elements, () => currentData);
        setupDeleteLogHandlers(elements, () => currentData);

        function createVisitElement(stadium) {
            const userHomeVisit = document.createElement('div');
            userHomeVisit.classList.add('user-home-visit');

            const userHomeVisitDate = document.createElement('div');
            userHomeVisitDate.classList.add('user-home-visit-date');

            const userHomeVisitMonth = document.createElement('h3');
            userHomeVisitMonth.classList.add('user-home-visit-month');
            const date = new Date(stadium.visited_on);
            const month = date.toLocaleString('en-US', { month: 'short' });
            userHomeVisitMonth.textContent = month;

            const userHomeVisitDay = document.createElement('h3');
            userHomeVisitDay.classList.add('user-home-visit-day');
            const day = date.getDate();
            userHomeVisitDay.textContent = day;

            userHomeVisitDate.appendChild(userHomeVisitMonth);
            userHomeVisitDate.appendChild(userHomeVisitDay);
            userHomeVisit.appendChild(userHomeVisitDate);

            const userHomeVisitImage = document.createElement('img');
            userHomeVisitImage.classList.add('user-home-visit-image');
            userHomeVisitImage.src = STADIUM_IMAGE_PATH + stadium.image;
            userHomeVisitImage.alt = stadium.stadium_name;
            userHomeVisit.appendChild(userHomeVisitImage);

            const userHomeVisitInfo = document.createElement('div');
            userHomeVisitInfo.classList.add('user-home-visit-info');

            const userHomeVisitName = document.createElement('a');
            userHomeVisitName.classList.add('user-home-visit-name');
            userHomeVisitName.href = `stadium.html?id=${stadium.stadium_id}`;
            userHomeVisitName.textContent = stadium.stadium_name;

            const userHomeVisitLocation = document.createElement('h4');
            userHomeVisitLocation.classList.add('user-home-visit-location');
            userHomeVisitLocation.textContent = stadium.city + ', ' + stadium.state;

            userHomeVisitInfo.appendChild(userHomeVisitName);
            userHomeVisitInfo.appendChild(userHomeVisitLocation);
            userHomeVisit.appendChild(userHomeVisitInfo);

            const userHomeVisitButtons = document.createElement('div');
            userHomeVisitButtons.classList.add('user-home-visit-buttons');

            const userHomeVisitEditLogButton = document.createElement('button');
            userHomeVisitEditLogButton.classList.add('user-home-visit-edit-log-button');
            const editImage = document.createElement('img');
            editImage.src = '/images/icons/edit.png';
            userHomeVisitEditLogButton.appendChild(editImage);

            userHomeVisitEditLogButton.addEventListener('click', () => {
                currentData = { visit_id: stadium.visit_id };
                elements.editLogName.textContent = stadium.stadium_name;
                elements.editLogLocation.textContent = stadium.city + ', ' + stadium.state;
                elements.editLogImage.src = STADIUM_IMAGE_PATH + stadium.image;
                elements.editLogDateVisited.value = stadium.visited_on.split('T')[0];
                const now = new Date();
                const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                elements.editLogDateVisited.setAttribute('max', today);
                elements.editLogNote.value = stadium.user_note || '';

                elements.editLogPhotosPreview.innerHTML = '';
                if (stadium.photos && stadium.photos.length > 0) {
                    stadium.photos.forEach(photo => {
                        addExistingPhotoPreview(photo, elements);
                    });
                }
                updateEditLogPhotoCount(elements);

                toggleMenu(elements.editLogMenu, true, overlay);
            });

            const userHomeVisitRemoveButton = document.createElement('button');
            userHomeVisitRemoveButton.classList.add('user-home-visit-remove-button');
            const removeImage = document.createElement('img');
            removeImage.src = '/images/icons/trash.png';
            userHomeVisitRemoveButton.appendChild(removeImage);

            userHomeVisitRemoveButton.addEventListener('click', () => {
                currentData = { visit_id: stadium.visit_id };
                toggleMenu(elements.deleteLogMenu, true, overlay);
            });

            userHomeVisitButtons.appendChild(userHomeVisitEditLogButton);
            userHomeVisitButtons.appendChild(userHomeVisitRemoveButton);
            userHomeVisit.appendChild(userHomeVisitButtons);

            return userHomeVisit;
        }

        function renderPage(page) {
            elements.stadiumsList.innerHTML = '';
            const start = (page - 1) * perPage;
            const end = start + perPage;
            
            if (showYearHeaders) {
                let itemCount = 0;
                let currentYear = null;
                let previousItemYear = null;
                
                for (const { year, stadiums: yearStadiums } of stadiumsByYear) {
                    for (const stadium of yearStadiums) {
                        if (itemCount === start - 1) {
                            previousItemYear = year;
                        }
                        if (itemCount >= start) break;
                        itemCount++;
                    }
                    if (itemCount >= start) break;
                }
                
                itemCount = 0;
                
                for (const { year, stadiums: yearStadiums } of stadiumsByYear) {
                    for (const stadium of yearStadiums) {
                        if (itemCount < start) {
                            itemCount++;
                            continue;
                        }
                        
                        if (itemCount >= end) {
                            break;
                        }
                        
                        if (currentYear !== year && previousItemYear !== year) {
                            const yearHeader = document.createElement('h2');
                            yearHeader.classList.add('visits-year-header');
                            yearHeader.textContent = year;
                            elements.stadiumsList.appendChild(yearHeader);
                            currentYear = year;
                        } else if (currentYear !== year) {
                            currentYear = year;
                        }
                        
                        elements.stadiumsList.appendChild(createVisitElement(stadium));
                        itemCount++;
                    }
                    
                    if (itemCount >= end) {
                        break;
                    }
                }
            } else {
                stadiums.slice(start, end).forEach(stadium => {
                    elements.stadiumsList.appendChild(createVisitElement(stadium));
                });
            }
        }

        renderPage(currentPage);
        renderPageNumbers(elements, currentPage, pageCount);
    }
}

function setupAchievementsFilterHandlers(elements, tab) {
    const getFilters = () => ({
        achievement: elements.achievementsFilter.value,
        sort: elements.sortFilter.value
    });

    function applyFilter() {
        const { achievement, sort } = getFilters();
        const params = new URLSearchParams();
        params.set('tab', tab);
        params.set('page', '1');
        params.set('achievement', achievement);
        params.set('sort', sort);
        window.location.search = params.toString();
    }

    elements.achievementsFilter.addEventListener('change', applyFilter);
    elements.sortFilter.addEventListener('change', applyFilter);
    
    elements.clearFiltersButton.addEventListener('click', () => {
        elements.achievementsFilter.value = 'all';
        elements.sortFilter.value = 'name-asc';
        const params = new URLSearchParams();
        params.set('tab', tab);
        window.location.search = params.toString();
    });
}

function setupActivityFilterHandlers(elements, tab) {
    const getFilters = () => ({
        activity: elements.activityFilter.value,
        sort: elements.sortFilter.value
    });

    function applyFilter() {
        const { activity, sort } = getFilters();
        const params = new URLSearchParams();
        params.set('tab', tab);
        params.set('page', '1');
        params.set('activity', activity);
        params.set('sort', sort);
        window.location.search = params.toString();
    }

    elements.activityFilter.addEventListener('change', applyFilter);
    elements.sortFilter.addEventListener('change', applyFilter);
    
    elements.clearFiltersButton.addEventListener('click', () => {
        elements.activityFilter.value = 'all';
        elements.sortFilter.value = 'added-desc';
        const params = new URLSearchParams();
        params.set('tab', tab);
        window.location.search = params.toString();
    });
}

function setupEventsFilterHandlers(elements, tab) {
    const getFilters = () => ({
        event: elements.eventFilter.value,
        sort: elements.sortFilter.value
    });

    function applyFilter() {
        const { event, sort } = getFilters();
        const params = new URLSearchParams();
        params.set('tab', tab);
        params.set('page', '1');
        params.set('event', event);
        params.set('sort', sort);
        window.location.search = params.toString();
    }

    elements.eventFilter.addEventListener('change', applyFilter);
    elements.sortFilter.addEventListener('change', applyFilter);
    
    elements.clearFiltersButton.addEventListener('click', () => {
        elements.eventFilter.value = 'all';
        elements.sortFilter.value = 'date-desc';
        const params = new URLSearchParams();
        params.set('tab', tab);
        window.location.search = params.toString();
    });
}

function setupFilterHandlers(elements, tab) {
    const getFilters = () => ({
        league: elements.leagueFilter.value,
        country: elements.countryFilter.value,
        sort: elements.sortFilter.value
    });

    function applyFilter() {
        const { league, country, sort } = getFilters();
        const params = new URLSearchParams();
        params.set('tab', tab);
        params.set('page', '1');
        if (league !== 'all')      params.set('league', league);
        if (country !== 'all')     params.set('country', country);
        params.set('sort', sort);
        window.location.search = params.toString();
    }

    elements.leagueFilter.addEventListener('change', applyFilter);
    elements.countryFilter.addEventListener('change', applyFilter);
    elements.sortFilter.addEventListener('change', applyFilter);
    
    elements.clearFiltersButton.addEventListener('click', () => {
        elements.leagueFilter.value = 'all';
        elements.countryFilter.value = 'all';
        if (tab === "visits") {
            elements.sortFilter.value = 'date-desc';
        }
        else {
            elements.sortFilter.value = 'added-desc';
        }
        const params = new URLSearchParams();
        params.set('tab', tab);
        window.location.search = params.toString();
    });
}

function setupHomeMapFilterHandlers() {
    ['home-map-league-filter', 'home-map-country-filter'].forEach(id => {
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
            renderHomeTabMap(filterHomeMapStadiums(allHomeMapStadiums));
        });
    });
}

function setupListsFilterHandlers(elements, tab) {
    const getFilters = () => ({
        sort: elements.sortFilter.value
    });

    function applyFilter() {
        const { sort } = getFilters();
        const params = new URLSearchParams();
        params.set('tab', tab);
        params.set('page', '1');
        params.set('sort', sort);
        window.location.search = params.toString();
    }

    elements.sortFilter.addEventListener('change', applyFilter);
    
    elements.clearFiltersButton.addEventListener('click', () => {
        elements.sortFilter.value = 'updated-desc';
        const params = new URLSearchParams();
        params.set('tab', tab);
        window.location.search = params.toString();
    });
}

function setupSearch(getAllStadiums, elements, searchKey) {
    const searchValue = sessionStorage.getItem(searchKey);
    if (searchValue) elements.searchInput.value = searchValue;

    elements.searchInput.addEventListener('input', () => {
        const val = elements.searchInput.value.trim();
        if (val) {
            sessionStorage.setItem(searchKey, val);
        } else {
            sessionStorage.removeItem(searchKey);
        }

        const filtered = filterAndRank(getAllStadiums(), val);

        const url = new URL(window.location.href);
        const totalPages = Math.max(1, Math.ceil(filtered.length / 18));
        const currentPage = parseInt(url.searchParams.get('page')) || 1;
        if (currentPage > totalPages) {
            url.searchParams.set('page', totalPages);
            history.replaceState(null, '', url.toString());
        }

        const plural = filtered.length === 1 ? 'stadium' : 'stadiums';
        elements.stadiumCount.textContent = `Showing ${filtered.length} ${plural}`;
        renderWithTransition(elements, filtered);
    });

    [elements.leagueFilter, elements.countryFilter, elements.sortFilter].forEach(el => {
        el.addEventListener('change', () => { 
            elements.searchInput.value = '';
            sessionStorage.removeItem(searchKey);
        });
    });

    elements.clearFiltersButton.addEventListener('click', () => { 
        elements.searchInput.value = '';
        sessionStorage.removeItem(searchKey);
    });
    elements.searchStadiums?.addEventListener('submit', e => e.preventDefault());
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    registerCommonEvents();
    registerEventListeners(getAuthElements());
    registerUserLogOutEvents();
    initializeCustomSelects();
    setupSearchAutocomplete('logged-in-nav-search', 'logged-in-search-field-nav', 'logged-in-nav-autocomplete-list');
    setupSearchAutocomplete('logged-in-sidebar-nav-search', 'logged-in-sidebar-search-field-nav', 'logged-in-sidebar-nav-autocomplete-list');

    if (!isPro()) {
        const advancedSortValues = ['opened-desc', 'opened-asc', 'cost-desc', 'cost-asc', 'capacity-desc', 'capacity-asc'];
        advancedSortValues.forEach(value => {
            document.querySelectorAll(`[data-value="${value}"], option[value="${value}"]`).forEach(el => el.remove());
        });
    }
});

window.onload = async () => {
    if (!isLoggedIn()) {
        window.location.replace('/');
        return;
    }

    showLoggedInUI();
    loadUserHeader();
    
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') || 'home';
    const pending = sessionStorage.getItem('toast');
    if (pending) {
        const { type, message } = JSON.parse(pending);
        createToast(type, message);
        sessionStorage.removeItem('toast');
    }
    loadTab(tab);
};

Array.from(document.getElementsByClassName('user-home-nav-bar-tab')).forEach(tab => {
    tab.addEventListener('click', () => {
        const activeTab = tab.dataset.tab;
        
        document.querySelectorAll('.user-home-nav-bar-tab').forEach(t => {
            t.classList.remove('active-tab');
            if (t.dataset.tab === activeTab) {
                t.classList.add('active-tab');
            }
        });
        
        const params = new URLSearchParams();
        params.set('tab', activeTab);
        window.location.search = params.toString();
    });
});