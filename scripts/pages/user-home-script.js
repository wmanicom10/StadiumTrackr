/*  Imports  */
import { getHeaderElements, MIN_LOADING_TIME } from "../constants.js";
import { createUserStadiumElement, getUsername, truncateUsername } from "../utils.js";
import { registerCommonEvents, registerUserLogOutEvents } from "../events.js";
import { userAPI } from "../api/user.js";
import { stadiumAPI } from "../api/stadium.js";

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
    userHomeWelcomeText: document.getElementById('user-home-welcome-text'),
    userStadiumsElement: document.getElementById('user-stadiums'),
    userStadiumsNoStadiumsText: document.getElementById('user-stadiums-no-stadiums-text'),
    userHomeStadiumsSeeAllButton: document.getElementById('user-home-stadiums-see-all-button'),
    numStadiums: document.getElementById('num-stadiums'),
    numCountries: document.getElementById('num-countries'),
    numEvents: document.getElementById('num-events'),
    userWishlistStadiumsElement: document.getElementById('user-wishlist-stadiums'),
    userWishlistStadiumsNoStadiumsText: document.getElementById('user-wishlist-stadiums-no-stadiums-text'),
    userHomeWishlistSeeAllButton: document.getElementById('user-home-wishlist-see-all-button'),
    userAchievementsNoAchievementsText: document.getElementById('user-home-no-achievements-text'),
    userAchievementsElement: document.getElementById('user-achievements')
};

/*  Async Functions  */
async function loadFullUserHomePage(username) {
    try {
        await Promise.all([
            loadUserInfo(username),
            loadStadiumMap(username),
            new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME))
        ]);

        hideSkeletons();
        showContent();

        if (window.userHomeMapData) {
            await new Promise(resolve => setTimeout(resolve, 100));
            initializeUserHomeMap(window.userHomeMapData.stadiums);
        }
    } catch (error) {
        alert('Failed to load user home content: ' + error.message);
    }
}

async function loadStadiumMap(username) {
    try {
        const result = await stadiumAPI.loadUserHomeMap(username);
        
        window.userHomeMapData = {
            stadiums: result.formattedRows
        };

    } catch (error) {
        alert(error.message);
    }
}

async function loadUserInfo(username) {
    try {
        const result = await userAPI.loadUserInfo(username);

        console.log(result.userStadiums);
        console.log(result.wishlistItems);

        renderStadiumSection(
            result.userStadiums,
            elements.userStadiumsElement,
            elements.userStadiumsNoStadiumsText,
            elements.userHomeStadiumsSeeAllButton
        );

        elements.numStadiums.textContent = result.numStadiumsVisited;
        elements.numCountries.textContent = result.numCountriesVisited;
        elements.numEvents.textContent = result.numEventsAttended;

        renderStadiumSection(
            result.wishlistItems,
            elements.userWishlistStadiumsElement,
            elements.userWishlistStadiumsNoStadiumsText,
            elements.userHomeWishlistSeeAllButton
        );

        renderAchievements(result.userAchievements);

    } catch (error) {
        alert(error.message);
    }
}

/*  Functions  */
function createAchievementElement(achievement) {
    const container = document.createElement('div');
    container.classList.add('user-achievement');

    const img = document.createElement('img');
    img.classList.add('user-achievement-image');
    img.src = achievement.achievement_image;
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

    return container;
}

function hideSkeletons() {
    const skeletons = [
        'user-home-welcome-text-skeleton',
        'user-home-stadiums-container-skeleton',
        'user-home-stats-container-skeleton',
        'user-home-wishlist-container-skeleton',
        'user-home-achievements-container-skeleton',
        'user-home-stadium-map-container-skeleton'
    ];

    skeletons.forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
}

function initializeUserHomeMap(stadiums) {
    const map = L.map('user-home-stadium-map').setView([40.8283, -96.5795], 4);

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

    stadiums.forEach(stadium => {
        const imageSlug = stadium.stadium_name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/'/g, '')
            .replace(/\./g, '');

        L.marker(stadium.location, { icon: customIcon })
            .addTo(map)
            .bindPopup(`
                <div class="popup-card">
                    <h4>${stadium.stadium_name}</h4>
                    <p>${stadium.address}</p>
                    <a href="stadium.html?id=${encodeURIComponent(stadium.stadium_id)}">
                        <img src="images/stadiums/${imageSlug}.jpg" alt="${stadium.stadium_name}" />
                    </a>
                </div>
            `);
    });

    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

function renderAchievements(achievements) {
    if (achievements.length === 0) {
        elements.userAchievementsNoAchievementsText.style.display = 'block';
        return;
    }

    elements.userAchievementsElement.innerHTML = '';
    achievements.forEach(achievement => {
        const element = createAchievementElement(achievement);
        elements.userAchievementsElement.appendChild(element);
    });
}

function renderStadiumSection(stadiums, container, noStadiumsText, seeAllButton) {
    if (stadiums.length === 0) {
        noStadiumsText.style.display = 'block';
        seeAllButton.style.display = 'none';
        return;
    }

    stadiums.forEach(stadium => {
        const element = createUserStadiumElement(stadium, elements);
        container.appendChild(element);
    });

    if (stadiums.length === 1) {
        container.style.justifyContent = 'center';
    }
}

function showContent() {
    const containers = [
        'user-home-welcome-text',
        'user-home-stadiums-container',
        'user-home-stats-container',
        'user-home-wishlist-container',
        'user-home-achievements-container',
        'user-home-stadium-map-container'
    ];

    containers.forEach(id => {
        document.getElementById(id).style.display = 'block';
    });
}

function showLoggedInUI(username) {
    const { loggedInHeader, loggedInHeaderUsername, sidebarUsername } = getHeaderElements();
    
    elements.userHomeWelcomeText.textContent = `Welcome, ${username}!`;
    
    const displayName = truncateUsername(username);
    loggedInHeaderUsername.textContent = displayName;
    sidebarUsername.textContent = displayName;
    loggedInHeader.style.display = 'flex';
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    registerCommonEvents();
    registerUserLogOutEvents();
});

window.onload = async () => {
    const username = getUsername();
    showLoggedInUI(username);
    loadFullUserHomePage(username);
};