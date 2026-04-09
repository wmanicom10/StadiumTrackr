/*  Imports  */
import { createAccountMenu, getAuthElements, getHeaderElements, MIN_LOADING_TIME, overlay } from "../constants.js";
import { formatDate, formatEventDate, formatEventTime, formatLocation, getEventIcon, getUsername, isLoggedIn, showLoggedOutUI, toggleMenu, truncateUsername } from "../utils.js";
import { registerCommonEvents, registerEventListeners, registerLogOutEvents } from "../events.js";
import { stadiumAPI } from "../api/stadium.js";
import { activityAPI } from "../api/activity.js";

/*  Variables  */
const elements = {
    addStadiumMenu: document.getElementById('add-stadium-menu'),
    addStadiumDateVisited: document.getElementById('add-stadium-date-visited'),
    addStadiumNote: document.getElementById('add-stadium-note'),
    closeAddStadiumMenu: document.getElementById('close-add-stadium-menu'),
    addStadiumName: document.getElementById('add-stadium-name'),
    addStadiumImage: document.getElementById('add-stadium-image'),
    addStadiumLogButton: document.getElementById('add-stadium-log-button'),
    addStadiumCancelButton: document.getElementById('add-stadium-cancel-button'),
    stadiumName: document.getElementById('stadium-name'),
    stadiumImage: document.getElementById('stadium-image'),
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
async function loadFullStadiumPage(id, username) {
    try {
        await loadStadiumInfo(id, username);
        
        await Promise.all([
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

        if (hasNoUpcomingEvents) {
            elements.noUpcomingEventsContainer.style.display = 'block';
            hasNoUpcomingEvents = false;
        }

        if (stadiumMapData) {
            const { latitude, longitude, name: stadiumName } = stadiumMapData;
            initializeStadiumMap(latitude, longitude, stadiumName);
        }
    } catch (error) {
        alert('Failed to load stadium content: ' + error.message);
    }
}

async function loadStadiumInfo(id, username) {
    try {
        const result = await stadiumAPI.loadStadiumInfo(id, username);
        const { stadium, teams, userVisited, userWishlist } = result.stadiumInfo;

        elements.stadiumName.textContent = stadium.name;
        elements.stadiumImage.src = stadium.image;

        document.title = `${stadium.name} - StadiumTrackr`;
        
        await new Promise(resolve => {
            if (elements.stadiumImage.complete) resolve();
            else {
                elements.stadiumImage.onload = elements.stadiumImage.onerror = resolve;
            }
        });

        elements.stadiumLocation.textContent = formatLocation(stadium.city, stadium.state);
        elements.stadiumOpenedDate.textContent = formatDate(stadium.openedDate);
        elements.stadiumTeams.textContent = teams.map(t => t.team_name).join(', ');
        elements.stadiumCapacity.textContent = stadium.capacity;
        elements.stadiumConstructionCost.textContent = stadium.constructionCost;
        elements.stadiumVisits.textContent = stadium.visits;
        elements.upcomingEventsStadiumLink.href = `events.html?id=${stadium.id}`

        setupUserControls(id, username, userVisited, userWishlist);
        setupAddStadiumModal(id, stadium.name, username, stadium.image);

    } catch (error) {
        alert(error.message);
    }
}

async function loadStadiumMap(id) {
    try {
        const result = await stadiumAPI.loadStadiumMap(id);
        const stadium = result.result;

        stadiumMapData = {
            latitude: stadium.latitude,
            longitude: stadium.longitude,
            name: stadium.stadium_name
        };
    } catch (error) {
        alert(error.message);
    }
}

async function loadUpcomingEvents(id) {
    try {
        const result = await stadiumAPI.loadUpcomingEvents(id);

        console.log(result.events)
        renderUpcomingEvents(result.events);
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

/*  Functions  */
function animateWishlistRemoval() {
    elements.stadiumUserControlWishlist.classList.add('animating');
    
    setTimeout(() => {
        updateWishlistUI(false);
    }, 200);
    
    setTimeout(() => {
        elements.stadiumUserControlWishlist.classList.remove('animating');
    }, 400);
}

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

function initializeStadiumMap(latitude, longitude, stadiumName) {
    const map = L.map('stadium-map').setView([latitude, longitude], 6);

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

    L.marker([latitude, longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(`<div class="popup-card"><h4>${stadiumName}</h4></div>`);
}

function renderUpcomingEvents(events) {
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
}

function replaceVisitedWithLoggedLink(stadiumId) {
    const visitLink = document.createElement('a');
    visitLink.href = `user-activity.html?id=${encodeURIComponent(stadiumId)}`;
    visitLink.className = 'stadium-user-control';
    visitLink.id = 'stadium-user-control-visited';
    visitLink.innerHTML = `
        <img src="images/icons/check.png" alt="Check icon" id="user-visited-image">
        <h3 id="stadium-user-control-visited-text">Logged</h3>
    `;
    elements.stadiumUserControlVisited.parentNode.replaceChild(visitLink, elements.stadiumUserControlVisited);
}

function setupAddStadiumModal(stadiumId, stadiumName, username, stadiumImage) {
    elements.addStadiumName.textContent = stadiumName;
    elements.addStadiumImage.src = stadiumImage;

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    elements.addStadiumDateVisited.setAttribute('max', today);
    elements.addStadiumDateVisited.value = today;

    elements.addStadiumLogButton.addEventListener('click', async () => {
        const dateVisited = elements.addStadiumDateVisited.value;
        const note = elements.addStadiumNote.value.trim() || null;

        try {
            await activityAPI.addStadium(stadiumId, username, dateVisited, note);
            window.location.reload();
        } catch (error) {
            alert(error.message);
        }
    });

    elements.addStadiumCancelButton.addEventListener('click', () => {
        toggleMenu(elements.addStadiumMenu, false, overlay);
    });

    elements.closeAddStadiumMenu.addEventListener('click', () => {
        toggleMenu(elements.addStadiumMenu, false, overlay);
    });
}

function setupStadiumButtons(stadiumId, username) {
    elements.stadiumLogButton.addEventListener('click', () => {
        console.log(username)

        if (username === "") {
            toggleMenu(createAccountMenu, true, overlay);
        } else {
            toggleMenu(elements.addStadiumMenu, true, overlay);
        }
    });

    elements.stadiumActivityButton.addEventListener('click', (e) => {
        if (username === "") {
            e.preventDefault();
            toggleMenu(createAccountMenu, true, overlay);
        }
    });

    elements.stadiumActivityButton.href = `user-activity.html?id=${encodeURIComponent(stadiumId)}`;
}

function setupUserControls(stadiumId, username, userVisited, userWishlist) {
    const hasLogged = userVisited.some(activity => activity.visited_on !== null);
    let isWishlist = userWishlist.length > 0;
    let isVisited = userVisited.length > 0;

    updateWishlistUI(isWishlist);
    
    if (hasLogged) {
        replaceVisitedWithLoggedLink(stadiumId);
    } else {
        updateVisitedUI(isVisited);
        setupVisitedClickHandler(stadiumId, username, isVisited, isWishlist);
    }

    setupWishlistClickHandler(stadiumId, username, isWishlist);
    setupStadiumButtons(stadiumId, username);
}

function setupVisitedClickHandler(stadiumId, username, initialIsVisited, initialIsWishlist) {
    let isVisited = initialIsVisited;
    let isWishlist = initialIsWishlist;

    elements.stadiumUserControlVisited.addEventListener('click', async () => {
        if (!username) {
            toggleMenu(createAccountMenu, true, overlay);
            return;
        }

        elements.stadiumUserControlVisited.classList.add('animating');
        const newIsVisited = !isVisited;

        setTimeout(() => {
            updateVisitedUI(newIsVisited);
            
            if (newIsVisited && isWishlist) {
                animateWishlistRemoval();
                activityAPI.updateUserWishlist(stadiumId, username, true)
                    .catch(error => alert(error.message));
                isWishlist = false;
            }
        }, 200);

        setTimeout(() => {
            elements.stadiumUserControlVisited.classList.remove('animating');
        }, 400);

        try {
            await activityAPI.updateUserStadium(stadiumId, username, isVisited);
            isVisited = newIsVisited;
        } catch (error) {
            alert(error.message);
        }
    });
}

function setupWishlistClickHandler(stadiumId, username, initialIsWishlist) {
    let isWishlist = initialIsWishlist;

    elements.stadiumUserControlWishlist.addEventListener('click', async () => {
        if (!username) {
            toggleMenu(createAccountMenu, true, overlay);
            return;
        }

        elements.stadiumUserControlWishlist.classList.add('animating');
        const newIsWishlist = !isWishlist;

        setTimeout(() => {
            updateWishlistUI(newIsWishlist);
        }, 200);

        setTimeout(() => {
            elements.stadiumUserControlWishlist.classList.remove('animating');
        }, 400);

        try {
            await activityAPI.updateUserWishlist(stadiumId, username, isWishlist);
            isWishlist = newIsWishlist;
        } catch (error) {
            alert(error.message);
        }
    });
}

function showLoggedInUI(username) {
    const { loggedInHeader, loggedOutHeader, loggedInHeaderUsername, sidebarUsername } = getHeaderElements();
    
    const displayName = truncateUsername(username);
    loggedInHeaderUsername.textContent = displayName;
    sidebarUsername.textContent = displayName;
    loggedOutHeader.style.display = 'none';
    loggedInHeader.style.display = 'flex';
    elements.stadiumUserControls.style.display = 'flex';
}

function updateVisitedUI(isVisited) {
    elements.stadiumUserControlVisitedText.textContent = isVisited ? 'Visited' : 'Visit';
    elements.userVisitedImage.src = isVisited ? 'images/icons/check.png' : 'images/icons/plus.png';
}

function updateWishlistUI(isWishlist) {
    elements.stadiumUserControlWishlistText.textContent = isWishlist ? 'In Wishlist' : 'Add to Wishlist';
    elements.userWishlistImage.src = isWishlist ? 'images/icons/heart-check.png' : 'images/icons/heart-plus.png';
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    registerEventListeners(getAuthElements());
    registerCommonEvents();
    registerLogOutEvents();
});

window.onload = async () => {
    const username = getUsername();
    
    if (isLoggedIn()) {
        showLoggedInUI(username);
    } else {
        showLoggedOutUI();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    loadFullStadiumPage(id, username);
};