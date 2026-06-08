/*  Imports  */
import { createAccountMenu, getAuthElements, MIN_LOADING_TIME, overlay, STADIUM_IMAGE_PATH } from "../constants.js";
import { createToast, formatDate, formatEventDate, formatEventTime, formatLocation, getEventIcon, isLoggedIn, setupAddStadiumModal, setupSearchAutocomplete, shakeOrReplace, showLoggedInUI, showLoggedOutUI, toggleMenu } from "../utils.js";
import { registerCommonEvents, registerEventListeners, registerLogOutEvents } from "../events.js";
import { loadAPI } from "../api/load.js";
import { updateAPI } from "../api/update.js";
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
    addStadiumLogButton: document.getElementById('add-stadium-log-button'),
    addStadiumCancelButton: document.getElementById('add-stadium-cancel-button'),
    stadiumName: document.getElementById('stadium-name'),
    stadiumUserControls: document.getElementById('stadium-user-controls'),
    stadiumVisits: document.getElementById('stadium-visits'),
    stadiumLocation: document.getElementById('stadium-location'),
    stadiumOpenedDate: document.getElementById('stadium-opened-date'),
    stadiumTeams: document.getElementById('stadium-teams'),
    stadiumCapacity: document.getElementById('stadium-capacity'),
    stadiumConstructionCost: document.getElementById('stadium-construction-cost'),
    stadiumUserControlVisited: document.getElementById('stadium-user-control-visited'),
    stadiumUserControlWishlist: document.getElementById('stadium-user-control-wishlist'),
    stadiumUserControlVisitedText: document.getElementById('stadium-user-control-visited-text'),
    stadiumUserControlWishlistText: document.getElementById('stadium-user-control-wishlist-text'),
    stadiumLogButton: document.getElementById('stadium-log-button'),
    stadiumActivityButton: document.getElementById('stadium-activity-button'),
    upcomingEventsContainer: document.getElementById('upcoming-events'),
    upcomingEventsStadiumLink: document.getElementById('upcoming-events-stadium-link'),
    noUpcomingEventsContainer: document.getElementById('no-upcoming-events-container'),
    userVisitedImage: document.getElementById('user-visited-image'),
    userWishlistImage: document.getElementById('user-wishlist-image')
};

let hasNoUpcomingEvents = false;
let stadiumMapData = null;

/*  Async Functions  */
async function loadFullStadiumPage(id) {
    try {
        const [result] = await Promise.all([
            loadStadiumInfo(id),
            loadStadiumMap(id),
            loadUpcomingEvents(id),
            new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME))
        ]);

        document.getElementById('stadium-skeleton').style.display = 'none';
        document.getElementById('stadium-content').style.display = 'block';
        document.getElementById('upcoming-events-skeleton').style.display = 'none';
        document.getElementById('upcoming-events').style.display = 'block';
        document.getElementById('stadium-map-skeleton').style.display = 'none';
        document.getElementById('stadium-map').style.display = 'block';

        const pending = sessionStorage.getItem('toast');
        if (pending) {
            const { type, message } = JSON.parse(pending);
            createToast(type, message);
            sessionStorage.removeItem('toast');
        }

        if (hasNoUpcomingEvents) {
            elements.noUpcomingEventsContainer.style.display = 'block';
            hasNoUpcomingEvents = false;
        }

        if (stadiumMapData) initializeStadiumMap(stadiumMapData);
        
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to load stadium content');
    }
}

async function loadStadiumInfo(id) {
    try {
        const result = await loadAPI.loadStadiumInfo(id);
        const { stadium, teams, userVisited, userWishlist } = result.stadiumInfo;

        const stadiumImage = document.createElement('img');
        stadiumImage.id = 'stadium-image';
        stadiumImage.src = STADIUM_IMAGE_PATH + stadium.image;
        document.querySelector('main').prepend(stadiumImage);
        stadiumImage.onload = () => {
            stadiumImage.classList.add('loaded');
        };
        
        elements.stadiumName.textContent = stadium.name;

        document.title = `${stadium.name} - StadiumTrackr`;

        elements.stadiumLocation.textContent = formatLocation(stadium.city, stadium.state);
        elements.stadiumOpenedDate.textContent = formatDate(stadium.openedDate);
        elements.stadiumTeams.textContent = [...new Set(teams.map(t => t.team_name))].join(', ');
        elements.stadiumCapacity.textContent = stadium.capacity ? stadium.capacity.toLocaleString() : 'Unknown';
        elements.stadiumConstructionCost.textContent = formatConstructionCost(stadium.constructionCost);
        elements.stadiumVisits.textContent = stadium.visits;
        elements.upcomingEventsStadiumLink.href = `events.html?id=${stadium.id}`

        setupUserControls(id, userVisited, userWishlist);
        setupAddStadiumModal(id, stadium.name, stadium.city, stadium.state, stadium.image, elements);

    } catch (error) {
        console.error(error);
    }
}

async function loadStadiumMap(id) {
    try {
        const result = await loadAPI.loadStadiumMap(id);
        const stadium = result.result;

        stadiumMapData = {
            latitude: stadium.latitude,
            longitude: stadium.longitude,
            name: stadium.stadium_name,
            address: stadium.street_address,
            city: stadium.city,
            state: stadium.state,
            zip: stadium.zip
        };
    } catch (error) {
        console.error(error);
    }
}

async function loadUpcomingEvents(id) {
    try {
        const result = await loadAPI.loadStadiumEvents(id);
        const events = result.events;

        if (!events || events.length === 0) {
            hasNoUpcomingEvents = true;
            return;
        }

        const maxEvents = Math.min(events.length, 3);
        for (let i = 0; i < maxEvents; i++) {
            const event = events[i];
            const eventElement = createEventElement(event);
            elements.upcomingEventsContainer.appendChild(eventElement);
        }
    } catch (error) {
        console.error(error);
    }
}

/*  Functions  */
function createEventElement(event) {
    const container = document.createElement('div');
    container.classList.add('upcoming-event');

    const icon = document.createElement('img');
    icon.src = getEventIcon(event.classifications[0].genre.name);

    const info = document.createElement('div');
    info.classList.add('event-info');

    const name = document.createElement('h4');
    name.textContent = event.name;
    name.classList.add('event-stadium-name');

    const infoContainer = document.createElement('div');
    infoContainer.classList.add('event-info-container');

    const date = document.createElement('h4');
    date.textContent = formatEventDate(event.dates.start.localDate);

    const time = document.createElement('h4');
    time.textContent = formatEventTime(event.dates.start.dateTime, event.dates.timezone);

    const link = document.createElement('a');
    link.classList.add('upcoming-event-link')
    link.href = event.url;
    link.target = '_blank';
    link.textContent = 'Buy Tickets →'

    infoContainer.appendChild(date);
    infoContainer.appendChild(time);
    info.appendChild(name);
    info.appendChild(infoContainer);
    container.appendChild(icon);
    container.appendChild(info);
    container.appendChild(link);

    return container;
}

function formatConstructionCost(cost) {
    if (cost === null || cost === undefined) return 'Unknown';
    if (cost === 0) return '$0';
    if (cost >= 1_000_000_000) return `$${(cost / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '')} Billion`;
    if (cost >= 1_000_000) return `$${(cost / 1_000_000).toFixed(2).replace(/\.?0+$/, '')} Million`;
    return `$${cost.toLocaleString()}`;
}

function initializeStadiumMap(stadiumMapData) {
    const map = L.map('stadium-map').setView([stadiumMapData.latitude, stadiumMapData.longitude], 6);

    const customIcon = L.icon({
        iconUrl: 'images/icons/pin-blue.png',
        iconSize: [25, 35],
        iconAnchor: [16, 40],
        popupAnchor: [-3, -40]
    });

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
        attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        ext: 'jpg'
    }).addTo(map);

    L.marker([stadiumMapData.latitude, stadiumMapData.longitude], { icon: customIcon })
    .addTo(map)
    .bindPopup(`
        <div class="popup-card">
            <h4>${stadiumMapData.name}</h4>
            <p>
                <a href="https://maps.google.com/?q=${encodeURIComponent(stadiumMapData.address + ', ' + stadiumMapData.city + ', ' + stadiumMapData.state + ' ' + stadiumMapData.zip)}" target="_blank" rel="noopener noreferrer">
                    ${stadiumMapData.address}, ${stadiumMapData.city}, ${stadiumMapData.state} ${stadiumMapData.zip}
                </a>
            </p>
        </div>
    `);
}

function setupUserControls(stadiumId, userVisited, userWishlist) {
    const hasLogged = userVisited.some(activity => activity.visited_on !== null);
    let isWishlist = userWishlist.length > 0;
    let isVisited = userVisited.length > 0;

    elements.stadiumUserControlWishlistText.textContent = isWishlist ? 'In Wishlist' : 'Add to Wishlist';
    elements.userWishlistImage.src = isWishlist ? 'images/icons/heart-check.png' : 'images/icons/heart-plus.png';
    
    if (hasLogged) {
        const visitLink = document.createElement('a');
        visitLink.href = `user-activity.html?id=${encodeURIComponent(stadiumId)}`;
        visitLink.className = 'stadium-user-control';
        visitLink.id = 'stadium-user-control-visited';
        visitLink.innerHTML = `
            <img src="images/icons/check.png" alt="Check icon" id="user-visited-image">
            <h3 id="stadium-user-control-visited-text">Logged</h3>
        `;
        elements.stadiumUserControlVisited.parentNode.replaceChild(visitLink, elements.stadiumUserControlVisited);
    } else {
        elements.stadiumUserControlVisitedText.textContent = isVisited ? 'Visited' : 'Visit';
        elements.userVisitedImage.src = isVisited ? 'images/icons/check.png' : 'images/icons/plus.png';
        setupVisitedClickHandler(stadiumId, isVisited, isWishlist);
    }

    setupWishlistClickHandler(stadiumId, isWishlist);

    elements.stadiumLogButton.addEventListener('click', () => {
        if (!isLoggedIn()) {
            toggleMenu(createAccountMenu, true, overlay);
        } else {
            toggleMenu(elements.addStadiumMenu, true, overlay);
        }
    });

    elements.stadiumActivityButton.addEventListener('click', (e) => {
        if (!isLoggedIn()) {
            e.preventDefault();
            toggleMenu(createAccountMenu, true, overlay);
        }
    });

    elements.stadiumActivityButton.href = `user-activity.html?id=${encodeURIComponent(stadiumId)}`;
}

function setupVisitedClickHandler(stadiumId, initialIsVisited, initialIsWishlist) {
    let isVisited = initialIsVisited;
    let isWishlist = initialIsWishlist;

    elements.stadiumUserControlVisited.addEventListener('click', async () => {
        if (!isLoggedIn()) {
            toggleMenu(createAccountMenu, true, overlay);
            return;
        }

        elements.stadiumUserControlVisited.classList.add('animating');
        const newIsVisited = !isVisited;

        setTimeout(() => {
            elements.stadiumUserControlVisitedText.textContent = newIsVisited ? 'Visited' : 'Visit';
            elements.userVisitedImage.src = newIsVisited ? 'images/icons/check.png' : 'images/icons/plus.png';
            
            if (newIsVisited && isWishlist) {
                elements.stadiumUserControlWishlist.classList.add('animating');
    
                setTimeout(() => {
                    elements.stadiumUserControlWishlistText.textContent = 'Add to Wishlist';
                    elements.userWishlistImage.src = 'images/icons/heart-plus.png';
                }, 200);
                
                setTimeout(() => {
                    elements.stadiumUserControlWishlist.classList.remove('animating');
                }, 400);

                updateAPI.updateUserWishlist(stadiumId, true)
                    .catch(error => {
                        console.error(error);
                        shakeOrReplace(error.message || 'Failed to update wishlist. Please try again.');
                    });
                isWishlist = false;
            }
        }, 200);

        setTimeout(() => {
            elements.stadiumUserControlVisited.classList.remove('animating');
        }, 400);

        try {
            await updateAPI.updateUserStadium(stadiumId, isVisited);
            isVisited = newIsVisited;
        } catch (error) {
            console.error(error);
            shakeOrReplace(error.message || 'Failed to update visit status. Please try again.');
        }
    });
}

function setupWishlistClickHandler(stadiumId, initialIsWishlist) {
    let isWishlist = initialIsWishlist;

    elements.stadiumUserControlWishlist.addEventListener('click', async () => {
        if (!isLoggedIn()) {
            toggleMenu(createAccountMenu, true, overlay);
            return;
        }

        elements.stadiumUserControlWishlist.classList.add('animating');
        const newIsWishlist = !isWishlist;

        setTimeout(() => {
            elements.stadiumUserControlWishlistText.textContent = newIsWishlist ? 'In Wishlist' : 'Add to Wishlist';
            elements.userWishlistImage.src = newIsWishlist ? 'images/icons/heart-check.png' : 'images/icons/heart-plus.png';
        }, 200);

        setTimeout(() => {
            elements.stadiumUserControlWishlist.classList.remove('animating');
        }, 400);

        try {
            await updateAPI.updateUserWishlist(stadiumId, isWishlist);
            isWishlist = newIsWishlist;
        } catch (error) {
            console.error(error);
            shakeOrReplace(error.message || 'Failed to update wishlist. Please try again.');
        }
    });
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    registerEventListeners(getAuthElements());
    registerCommonEvents();
    registerLogOutEvents();
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

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    loadFullStadiumPage(id);
};