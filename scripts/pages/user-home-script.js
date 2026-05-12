/*  Imports  */
import { getHeaderElements, MIN_LOADING_TIME } from "../constants.js";
import { createUserStadiumElement, formatDate, getUsername, timeAgo } from "../utils.js";
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
    userFavoriteStadiumsElement: document.getElementById('user-favorite-stadiums'),
    userFavoriteStadiumsNoFavoritesText: document.getElementById('user-favorite-stadiums-no-favorites-text'),
    userStadiumsElement: document.getElementById('user-stadiums'),
    userStadiumsNoStadiumsText: document.getElementById('user-stadiums-no-stadiums-text'),
    userHomeStadiumsSeeAllButton: document.getElementById('user-home-stadiums-see-all-button'),
    userWishlistStadiumsElement: document.getElementById('user-wishlist-stadiums'),
    userWishlistStadiumsNoStadiumsText: document.getElementById('user-wishlist-stadiums-no-stadiums-text'),
    userHomeWishlistSeeAllButton: document.getElementById('user-home-wishlist-see-all-button'),
    userAchievementsNoAchievementsText: document.getElementById('user-home-no-achievements-text'),
    userAchievementsElement: document.getElementById('user-achievements'),
    userActivityContainer: document.getElementById('user-activity'),
    userActivityNoActivityText: document.getElementById('user-activity-no-activity-text')
};

/*  Async Functions  */
async function loadFullUserHomePage(username, profilePic) {
    try {
        await Promise.all([
            loadUserInfo(username, profilePic),
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

async function loadUserInfo(username, profilePic) {
    try {
        const result = await userAPI.loadUserInfo(username);
        const activity = await userAPI.loadUserActivity(username, 'all', '', 'added-desc', 5, 0);

        if (result.userFavoriteStadiums.length > 0) {
            document.getElementById('user-home-header').classList.add('with-background-image');
            const userHomeImage = document.createElement('img');
            userHomeImage.id = 'user-home-image';
            userHomeImage.src = result.userFavoriteStadiums[0].image;
            document.querySelector('main').prepend(userHomeImage);
        }

        renderHeaderSection(
            username,
            profilePic,
            result.numStadiumsVisited,
            result.numCountriesVisited,
            result.numEventsAttended
        );

        renderFavoritesSection(
            result.userFavoriteStadiums,
            elements.userFavoriteStadiumsElement,
            elements.userFavoriteStadiumsNoFavoritesText
        )

        renderStadiumSection(
            result.userStadiums,
            elements.userStadiumsElement,
            elements.userStadiumsNoStadiumsText,
            elements.userHomeStadiumsSeeAllButton
        );

        renderStadiumSection(
            result.wishlistItems,
            elements.userWishlistStadiumsElement,
            elements.userWishlistStadiumsNoStadiumsText,
            elements.userHomeWishlistSeeAllButton
        );

        renderActivity(
            activity.userActivity
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
        'user-home-header-skeleton',
        'user-favorite-stadiums-skeleton',
        'user-stadiums-skeleton',
        'user-activity-skeleton',
        'user-wishlist-stadiums-skeleton',
        'user-achievements-skeleton',
        'user-home-stadium-map-skeleton'
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

function renderActivity(activity) {
    if (activity.length === 0) elements.userActivityNoActivityText.style.display = 'block';

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

        elements.userActivityContainer.appendChild(userActivity);
    })
}

function renderFavoritesSection(stadiums, container, noFavoritesText) {
    if (stadiums.length === 0) {
        noFavoritesText.style.display = 'block';
        document.getElementById('user-home-header-skeleton').style.marginTop ='50px';
        return;
    }

    stadiums.forEach(stadium => {
        const userFavoriteStadium = document.createElement('div');
        userFavoriteStadium.classList.add('user-favorite-stadium');

        const userFavoriteStadiumLink = document.createElement('a');
        userFavoriteStadiumLink.href = `stadium.html?id=${encodeURIComponent(stadium.stadium_id)}`;

        const userFavoriteStadiumImage = document.createElement('img');
        userFavoriteStadiumImage.src = stadium.image;
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

        container.appendChild(userFavoriteStadium);
    })

    for (let i = 0; i < 4 - stadiums.length; i++) {
        const userFavoriteStadiumEmpty = document.createElement('div');
        userFavoriteStadiumEmpty.classList.add('user-favorite-stadium-empty');
        container.appendChild(userFavoriteStadiumEmpty);
    }   
}

function renderHeaderSection(username, profilePic, numStadiumsVisited, numCountriesVisited, numEventsAttended) {
    document.getElementById('user-home-profile-pic').src = profilePic
    document.getElementById('user-home-username').textContent = username;
    document.getElementById('num-stadiums').textContent = numStadiumsVisited;
    document.getElementById('num-events').textContent = numEventsAttended;
    document.getElementById('num-countries').textContent = numCountriesVisited;
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
}

function showContent() {
    const containers = [
        'user-home-header',
        'user-favorite-stadiums',
        'user-stadiums',
        'user-activity',
        'user-wishlist-stadiums',
        'user-achievements',
        'user-home-stadium-map'
    ];

    containers.forEach(id => {
        if (id === 'user-home-stadium-map') {
            document.getElementById(id).style.display = 'block'
        } else {
            document.getElementById(id).style.display = 'flex';
        }
    });
}

function showLoggedInUI() {
    const { loggedInHeader } = getHeaderElements();
    loggedInHeader.style.display = 'flex';
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    registerCommonEvents();
    registerUserLogOutEvents();
});

window.onload = async () => {
    const username = getUsername();
    const profilePic = localStorage.getItem('profilePic');
    showLoggedInUI();
    loadFullUserHomePage(username, profilePic);
};