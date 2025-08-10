import { loggedInHeader, loggedInHeaderUsername, logOutButton, sidebarToggleLoggedIn, sidebarLogOutButton, sidebarUsername } from "./constants.js";
import { createUserStadiumElement } from "./utils.js";

/*  Variables  */
const userHomeWelcomeText = document.getElementById('user-home-welcome-text')
const userStadiumsElement = document.getElementById('user-stadiums');
const userStadiumsNoStadiumsText = document.getElementById('user-stadiums-no-stadiums-text');
const userHomeStadiumsSeeAllButton = document.getElementById('user-home-stadiums-see-all-button');
const numStadiums = document.getElementById('num-stadiums');
const numCountries = document.getElementById('num-countries');
const numEvents = document.getElementById('num-events');
const userWishlistStadiumsElement = document.getElementById('user-wishlist-stadiums');
const userWishlistStadiumsNoStadiumsText = document.getElementById('user-wishlist-stadiums-no-stadiums-text');
const userHomeWishlistSeeAllButton = document.getElementById('user-home-wishlist-see-all-button');
const userAchievementsNoAchievementsText = document.getElementById('user-home-no-achievements-text');
const userAchievementsElement = document.getElementById('user-achievements');

/*  Functions  */
function showLoggedInUI() {
    let username = localStorage.getItem('username');
    userHomeWelcomeText.textContent = 'Welcome, ' + username + '!';
    if (username.length > 10) {
        username = username.slice(0,10) + '...';
    }
    loggedInHeaderUsername.textContent = username;
    loggedInHeader.style.display = 'flex';
    sidebarUsername.textContent = username;
}

/*  Async Functions  */
async function loadFullStadiumPage(username) {
    try {
        const userInfoPromise = loadUserInfo(username);
        const stadiumMapPromise = loadStadiumMap(username);

        const minimumLoadingTime = new Promise(resolve => setTimeout(resolve, 750));

        await Promise.all([
            userInfoPromise,
            stadiumMapPromise,
            minimumLoadingTime
        ]);

        document.getElementById('user-home-welcome-text-skeleton').style.display = 'none';
        document.getElementById('user-home-welcome-text').style.display = 'block';

        document.getElementById('user-home-stadiums-container-skeleton').style.display = 'none';
        document.getElementById('user-home-stadiums-container').style.display = 'block';

        document.getElementById('user-home-stats-container-skeleton').style.display = 'none';
        document.getElementById('user-home-stats-container').style.display = 'block';

        document.getElementById('user-home-wishlist-container-skeleton').style.display = 'none';
        document.getElementById('user-home-wishlist-container').style.display = 'block';

        document.getElementById('user-home-achievements-container-skeleton').style.display = 'none';
        document.getElementById('user-home-achievements-container').style.display = 'block';

    }
    catch (error) {
        alert('Failed to load stadium content: ' + error.message);
    }
}

async function loadStadiumMap(username) {
    try {
        const response = await fetch('http://localhost:3000/stadium/loadUserHomeMap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }

        const result = await response.json();

        const stadiums = result.formattedRows;

        const map = L.map('user-home-stadium-map').setView([40.8283, -96.5795], 4);

        const customIcon = L.icon({
            iconUrl: 'images/icons/pin-blue.png',
            iconSize: [25, 35],      
            iconAnchor: [16, 40],      
            popupAnchor: [-3, -40]
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
        }).addTo(map);

        stadiums.forEach(stadium => {
            L.marker(stadium.location, { icon: customIcon }).addTo(map)
            .bindPopup(`<div class="popup-card">
                            <h4>${stadium.stadium_name}</h4>
                            <p>${stadium.address}</p>
                            <a href="stadium.html?stadium=${encodeURIComponent(stadium.stadium_name)}"><img src=${`images/stadiums/${stadium.stadium_name.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '').replace(/\./g, '')}.jpg`} /></a>
                        </div>`)
        });
            
    } catch (error) {
        alert(error.message);
    }
}

async function loadUserInfo(username) {
    try {
        const response = await fetch('http://localhost:3000/user/loadUserInfo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }

        const result = await response.json();

        const userStadiums = result.userStadiums;

        if (userStadiums.length === 0) {
            userStadiumsNoStadiumsText.style.display = 'block';
            userHomeStadiumsSeeAllButton.style.display = 'none';
        } 
        else {
            const stadiumsToShow = userStadiums.length === 1 ? userStadiums : userStadiums.slice(0, 2);

            stadiumsToShow.forEach(stadium => {
                const stadiumElement = createUserStadiumElement(stadium);
                userStadiumsElement.appendChild(stadiumElement);

                if (userStadiums.length === 1) {
                    userStadiumsElement.style.justifyContent = 'center';
                    stadiumElement.style.marginRight = '0';

                    if (window.matchMedia("(max-width: 947px)")) {
                        stadiumElement.style.margin = '0 auto';
                    }
                }
            });
        }

        const numStadiumsVisited = result.numStadiumsVisited;
        const numCountriesVisited = result.numCountriesVisited;
        const numEventsAttended = result.numEventsAttended;

        numStadiums.textContent = numStadiumsVisited
        numCountries.textContent = numCountriesVisited;
        numEvents.textContent = numEventsAttended;

        const userWishlistStadiums = result.wishlistItems;

        if (userWishlistStadiums.length === 0) {
            userWishlistStadiumsNoStadiumsText.style.display = 'block';
            userHomeWishlistSeeAllButton.style.display = 'none';
        }
        else {
            const stadiumsToShow = userWishlistStadiums.length === 1 ? userWishlistStadiums : userWishlistStadiums.slice(0, 2);

            stadiumsToShow.forEach(stadium => {
                const stadiumElement = createUserStadiumElement(stadium);
                userWishlistStadiumsElement.appendChild(stadiumElement);

                if (userWishlistStadiums.length === 1) {
                    userWishlistStadiumsElement.style.justifyContent = 'center';
                    stadiumElement.style.marginRight = '0';

                    if (window.matchMedia("(max-width: 947px)")) {
                        stadiumElement.style.margin = '0 auto';
                    }
                }
            });
        }

        const userAchievements = result.userAchievements;

        console.log(userAchievements);

        if (userAchievements.length === 0) {
            userAchievementsNoAchievementsText.style.display = 'block';
        }
        else {
            userAchievementsElement.innerHTML = '';
            userAchievements.forEach(achievement => {
                const userAchievement = document.createElement('div');
                userAchievement.classList.add('user-achievement');

                const userAchievementImage = document.createElement('img');
                userAchievementImage.classList.add('user-achievement-image');
                userAchievementImage.src = achievement.achievement_image;

                const userAchievementText = document.createElement('div');
                userAchievementText.classList.add('user-achievement-text');

                const userAchievementName = document.createElement('h3');
                userAchievementName.textContent = achievement.achievement_name;

                userAchievementText.appendChild(userAchievementName);

                userAchievement.appendChild(userAchievementImage);
                userAchievement.appendChild(userAchievementText);

                userAchievementsElement.appendChild(userAchievement);

            })
        }
            
    } catch (error) {
        alert(error.message);
    }
}

/*  Events  */
window.onload = async () => {
    const username = localStorage.getItem('username');
    showLoggedInUI();
    loadFullStadiumPage(username);
};

window.addEventListener("resize", () => {
    if (sidebarToggleLoggedIn.checked) {
        sidebarToggleLoggedIn.checked = false;
    }
});

logOutButton.addEventListener('click', () => {
    localStorage.setItem('username', '');
    window.location.replace('index.html');
});

sidebarLogOutButton.addEventListener('click', () => {
    localStorage.setItem('username', '');
    window.location.replace('index.html');
})