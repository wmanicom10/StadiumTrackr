import { loggedOutHeader, loggedInHeader, loggedInHeaderUsername, logOutButton, overlay, logInMenu, logInForm, logIn, signInLink, createAccountMenu, createAccountForm, signUp, signUpLink, closeButtons, logInButton, createAccountButton, sidebarToggle, sidebarToggleLoggedIn, sidebarLogInButton, sidebarSignUpButton, sidebarLogOutButton, sidebarUsername } from "./constants.js";
import { toggleMenu } from "./utils.js";
import { registerEventListeners } from "./events.js";

/*  Variables  */
const addStadiumMenu = document.getElementById('add-stadium-menu');
const addStadiumDateVisited = document.getElementById('add-stadium-date-visited');
const addStadiumNote = document.getElementById('add-stadium-note')
const closeAddStadiumMenu = document.getElementById('close-add-stadium-menu');
const addStadiumName = document.getElementById('add-stadium-name');
const addStadiumImage = document.getElementById('add-stadium-image');
const addStadiumSubmitButton = document.getElementById('add-stadium-submit-button');
const stadiumName = document.getElementById('stadium-name');
const stadiumImage = document.getElementById('stadium-image');
const stadiumUserControls = document.getElementById('stadium-user-controls')
const stadiumVisits = document.getElementById('stadium-visits');
const stadiumLocation = document.getElementById('stadium-location');
const stadiumOpenedDate = document.getElementById('stadium-opened-date');
const stadiumTeams = document.getElementById('stadium-teams');
const stadiumCapacity = document.getElementById('stadium-capacity');
const stadiumConstructionCost = document.getElementById('stadium-construction-cost');
const stadiumUserControlVisited = document.getElementById('stadium-user-control-visited');
const stadiumUserControlWishlist = document.getElementById('stadium-user-control-wishlist');
const stadiumUserControlVisitedText = document.getElementById('stadium-user-control-visited-text');
const stadiumUserControlWishlistText = document.getElementById('stadium-user-control-wishlist-text');
const stadiumLogButton = document.getElementById('stadium-log-button');
const stadiumActivityButton = document.getElementById('stadium-activity-button')
const upcomingEventsContainer = document.getElementById('upcoming-events');
const noUpcomingEventsContainer = document.getElementById('no-upcoming-events-container');
const userVisitedImage = document.getElementById('user-visited-image');
const userWishlistImage = document.getElementById('user-wishlist-image');

/*  Functions  */
function showLoggedInUI() {
    let username = localStorage.getItem('username');
    if (username.length > 10) {
        username = username.slice(0,10) + '...';
    }
    loggedInHeaderUsername.textContent = username;
    loggedOutHeader.style.display = 'none';
    loggedInHeader.style.display = 'flex';
    sidebarUsername.textContent = username;
    stadiumUserControls.style.display = 'flex';
}

function showLoggedOutUI() {
    loggedInHeader.style.display = 'none';
    loggedOutHeader.style.display = 'flex';
}

/*  Async Functions  */
async function loadFullStadiumPage(name, username) {
    try {
        const stadiumInfoPromise = loadStadiumInfo(name, username);
        const stadiumMapPromise = loadStadiumMap(name);
        const upcomingEventsPromise = loadUpcomingEvents(name);

        const minimumLoadingTime = new Promise(resolve => setTimeout(resolve, 750));

        await Promise.all([
            stadiumInfoPromise,
            stadiumMapPromise,
            upcomingEventsPromise,
            minimumLoadingTime
        ]);

        document.getElementById('stadium-skeleton').style.display = 'none';
        document.getElementById('stadium-content').style.display = 'block';

        document.getElementById('upcoming-events-skeleton-container').style.display = 'none';
        document.getElementById('upcoming-events-content').style.display = 'block';

        document.getElementById('stadium-map-skeleton-container').style.display = 'none';
        document.getElementById('stadium-map-content').style.display = 'block';

        if (window.stadiumMapData) {
            const { latitude, longitude, name: stadiumName } = window.stadiumMapData;
            
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

            L.marker([latitude, longitude], { icon: customIcon }).addTo(map)
                .bindPopup(`<div class="popup-card">
                                <h4>${stadiumName}</h4>
                            </div>`);
        }
    }
    catch (error) {
        alert('Failed to load stadium content: ' + error.message);
    }
}

async function loadStadiumInfo(name, username) {
    try {
        const response = await fetch('http://localhost:3000/stadium/loadStadiumInfo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, username: username })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }
        
        const result = await response.json();

        stadiumName.textContent = result.stadiumInfo.stadium.name;

        stadiumImage.src = result.stadiumInfo.stadium.image;
        const imagePromise = new Promise(resolve => {
            if (stadiumImage.complete) {
                resolve();
            } else {
                stadiumImage.onload = stadiumImage.onerror = resolve;
            }
        });
        await imagePromise;

        const location = result.stadiumInfo.stadium.city + ', ' + result.stadiumInfo.stadium.state;
        stadiumLocation.innerHTML = location;

        const openedDateSQL = result.stadiumInfo.stadium.openedDate;
        const date = new Date(openedDateSQL);
        const openedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        stadiumOpenedDate.innerHTML = openedDate;

        const teamsSQL = result.stadiumInfo.teams;
        const leagueCounts = {};
        teamsSQL.forEach(team => {
            const { league } = team;
            if (leagueCounts[league]) {
                leagueCounts[league] += 1;
            } else {
                leagueCounts[league] = 1;
            }
        });
        const teams = teamsSQL.map(team => team.team_name).join(', ');
        stadiumTeams.innerHTML = teams;

        const capacity = result.stadiumInfo.stadium.capacity;
        stadiumCapacity.innerHTML = capacity;

        const constructionCost = result.stadiumInfo.stadium.constructionCost;
        stadiumConstructionCost.innerHTML = constructionCost;

        const visits = result.stadiumInfo.stadium.visits;
        stadiumVisits.innerHTML = visits;

        let isVisited = result.stadiumInfo.userVisited.length > 0;
        stadiumUserControlVisitedText.textContent = isVisited ? 'Visited' : 'Visit';
        userVisitedImage.src = isVisited ? 'images/icons/checkmark.png' : 'images/icons/plus.png';

        let isWishlist = result.stadiumInfo.userWishlist.length > 0;
        stadiumUserControlWishlistText.textContent = isWishlist ? 'In Wishlist' : 'Add to Wishlist';
        userWishlistImage.src = isWishlist ? 'images/icons/heart-check.png' : 'images/icons/heart-plus.png';

        stadiumUserControlVisited.addEventListener('click', async () => {
            if (username == '') {
                toggleMenu(createAccountMenu, true, overlay);
            }
            else {
                stadiumUserControlVisited.classList.add('animating');
                
                const currentIsVisited = isVisited;
                const newIsVisited = !isVisited;
                
                setTimeout(() => {
                    if (newIsVisited) {
                        userVisitedImage.src = 'images/icons/checkmark.png';
                        stadiumUserControlVisitedText.textContent = 'Visited';
                        
                        if (isWishlist) {
                            stadiumUserControlWishlist.classList.add('animating');
                            
                            setTimeout(() => {
                                userWishlistImage.src = 'images/icons/heart-plus.png';
                                stadiumUserControlWishlistText.textContent = 'Add to Wishlist';
                            }, 200);
                            
                            setTimeout(() => {
                                stadiumUserControlWishlist.classList.remove('animating');
                            }, 400);
                            
                            fetch('http://localhost:3000/stadium/updateUserWishlist', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: name, username: username, isWishlist: isWishlist })
                            })
                            .catch(error => {
                                alert(error.message);
                            });
                            
                            isWishlist = !isWishlist;
                        }
                    }
                    else {
                        userVisitedImage.src = 'images/icons/plus.png';
                        stadiumUserControlVisitedText.textContent = 'Visit';
                    }
                }, 200);
                
                setTimeout(() => {
                    stadiumUserControlVisited.classList.remove('animating');
                }, 400);
                
                try {
                    const response = await fetch('http://localhost:3000/stadium/updateUserStadium', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: name, username: username, isVisited: currentIsVisited })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Unknown error');
                    }

                    const result = await response.json();
                }
                catch (error) {
                    alert(error.message);
                }
                
                isVisited = !isVisited;
            }
        });

        stadiumUserControlWishlist.addEventListener('click', async() => {
            if (username == '') {
                toggleMenu(createAccountMenu, true, overlay);
            }
            else {
                stadiumUserControlWishlist.classList.add('animating');
                
                const currentIsWishlist = isWishlist;
                const newIsWishlist = !isWishlist;
                
                setTimeout(() => {
                    if (newIsWishlist) {
                        userWishlistImage.src = 'images/icons/heart-check.png';
                        stadiumUserControlWishlistText.textContent = 'In Wishlist';
                    }
                    else {
                        userWishlistImage.src = 'images/icons/heart-plus.png';
                        stadiumUserControlWishlistText.textContent = 'Add to Wishlist';
                    }
                }, 200);
                
                setTimeout(() => {
                    stadiumUserControlWishlist.classList.remove('animating');
                }, 400);
                
                try {
                    const response = await fetch('http://localhost:3000/stadium/updateUserWishlist', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: name, username: username, isWishlist: currentIsWishlist })
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Unknown error');
                    }
                }
                catch (error) {
                    alert(error.message);
                }
                
                isWishlist = !isWishlist;
            }
        });

        stadiumLogButton.addEventListener('click', () => {
            if (username == '') {
                toggleMenu(createAccountMenu, true, overlay);
            }
            else {
                toggleMenu(addStadiumMenu, true, overlay);
            }
        })

        stadiumActivityButton.addEventListener('click', () => {
            if (username == '') {
                toggleMenu(createAccountMenu, true, overlay);
            }
            /*else {
                toggleMenu(addStadiumMenu, true, overlay);
            }*/
        })

        addStadiumName.textContent = name;
        addStadiumImage.src = result.stadiumInfo.stadium.image;

        addStadiumSubmitButton.addEventListener('click', async () => {
            const dateVisited = addStadiumDateVisited.value;
            const note = addStadiumNote.value.trim() === '' ? null : addStadiumNote.value.trim();

            try {
                const response = await fetch('http://localhost:3000/stadium/addStadium', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name, username: username, dateVisited: dateVisited, note: note })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Unknown error');
                }
            }
            catch (error) {
                alert(error.message);
            }
            window.location.reload();
        })

    } catch (error) {
        alert(error.message);
    }
}

async function loadStadiumMap(name) {
    try {
        const response = await fetch('http://localhost:3000/stadium/loadStadiumMap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }

        const result = await response.json();
        const stadium = result.result;

        window.stadiumMapData = {
            latitude: stadium.latitude,
            longitude: stadium.longitude,
            name: stadium.stadium_name
        };

    } catch (error) {
        alert(error.message);
    }
}

async function loadUpcomingEvents(name) {
    if (name === 'PHX Arena') {
        name = 'PHX Arena (Formerly Footprint Center)';
    }
    const apiKey = 'WIKkbzK6ciettoJD7CfKieFrtP8BqcvJ';
    const venueSearchUrl = `https://app.ticketmaster.com/discovery/v2/venues.json?keyword=${name}&apikey=${apiKey}`;

    fetch(venueSearchUrl)
    .then(response => response.json())
    .then(data => {
        const venueId = data._embedded.venues[0].id;
        const eventUrl = `https://app.ticketmaster.com/discovery/v2/events.json?classificationName=sports&sort=date,asc&venueId=${venueId}&apikey=${apiKey}`;
        return fetch(eventUrl);
    })
    .then(response => response.json())
    .then(data => {
        const events = data._embedded?.events;
        if (!events || events.length === 0) {
            noUpcomingEventsContainer.style.display = 'block';
        }
        let eventCounter = 0;
        for (const event of events) {
            const upcomingEvent = document.createElement('div');
            upcomingEvent.classList.add('upcoming-event');

            const upcomingEventImage = document.createElement('img');
            const eventType = event.classifications[0].genre.name
            switch(eventType) {
                case "Football":
                    upcomingEventImage.src = 'images/icons/football.png';
                    break;
                case "Basketball":
                    upcomingEventImage.src = 'images/icons/basketball.png';
                    break;
                case "Baseball":
                    upcomingEventImage.src = 'images/icons/baseball.png';
                    break;
                case "Hockey":
                    upcomingEventImage.src = 'images/icons/hockey.png';
                    break;
                case "Soccer":
                    upcomingEventImage.src = 'images/icons/soccer.png';
                    break;
                default:
                    upcomingEventImage.src = 'images/icons/ticket.png';
                    break;
            }

            const eventInfo = document.createElement('div');
            eventInfo.classList.add('event-info');

            const eventName = document.createElement('h4');
            eventName.textContent = event.name;
            eventName.classList.add('event-stadium-name');

            const eventDate = document.createElement('h4');

            const [year, month, day] = event.dates.start.localDate.split('-');
            const formattedDate = `${month}/${day}/${year}`;
            eventDate.textContent = formattedDate

            const eventTime = document.createElement('h4');
            const localTime = event.dates.start.localTime;
            if (localTime) {
                const [hours, minutes, seconds] = localTime.split(":");
                const time = new Date();
                time.setHours(Number(hours), Number(minutes), Number(seconds));
                const formattedTime = time.toLocaleTimeString("en-US", {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
                eventTime.textContent = formattedTime;
            }
            else {
                eventTime.textContent = "Time TBD";
            }

            const eventInfoContainer = document.createElement('div');
            eventInfoContainer.classList.add('event-info-container');

            eventInfoContainer.appendChild(eventDate);
            eventInfoContainer.appendChild(eventTime);

            eventInfo.appendChild(eventName);
            eventInfo.appendChild(eventInfoContainer);

            upcomingEvent.appendChild(upcomingEventImage);
            upcomingEvent.appendChild(eventInfo);

            upcomingEventsContainer.appendChild(upcomingEvent);

            eventCounter++;
            if (eventCounter >= 3) break;
        }
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    registerEventListeners({
        overlay,
        createAccountForm,
        logInForm,
        logInButton,
        signUp,
        logIn,
        closeButtons,
        createAccountMenu,
        logInMenu,
        sidebarLogInButton,
        sidebarSignUpButton,
        signUpLink,
        signInLink
    });
});

window.onload = async () => {
    const username = localStorage.getItem('username');
    if (username === '' || username === null) {
        showLoggedOutUI();
    }
    else {
        showLoggedInUI();
    }
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('stadium');
    document.title = name + " - StadiumTrackr";
    loadFullStadiumPage(name, username);
    addStadiumDateVisited.setAttribute("max", new Date().toISOString().split("T")[0]);
    addStadiumDateVisited.value = new Date().toISOString().split('T')[0];
}

window.addEventListener("resize", () => {
    if (sidebarToggle.checked) {
        sidebarToggle.checked = false;
    }
    if (sidebarToggleLoggedIn.checked) {
        sidebarToggleLoggedIn.checked = false;
    }
});

createAccountButton.addEventListener('click', () => toggleMenu(createAccountMenu, true, overlay));

closeAddStadiumMenu.addEventListener('click', () => {
    toggleMenu(addStadiumMenu, false, overlay);
})

sidebarLogOutButton.addEventListener('click', () => {
    localStorage.setItem('username', '');
    window.location.reload();
})

logOutButton.addEventListener('click', () => {
    localStorage.setItem('username', '');
    window.location.reload();
})