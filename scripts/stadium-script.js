/*  Variables  */
const loggedOutHeader = document.getElementById('logged-out-header');
const loggedInHeader = document.getElementById('logged-in-header');
const loggedInHeaderUserContainer = document.getElementById('logged-in-header-user-container');
const loggedInHeaderUserContainerHidden = document.getElementById('logged-in-header-user-container-hidden');
const loggedInHeaderUsername = document.getElementById('logged-in-header-username');
const logOutButton = document.getElementById('log-out');
const overlay = document.getElementById('overlay');
const logInMenu = document.getElementById('log-in-menu');
const logInForm = document.getElementById('log-in-form');
const logIn = document.getElementById('log-in-button');
const signInLink = document.getElementsByClassName('sign-in-link')[0];
const createAccountMenu = document.getElementById('create-account-menu');
const createAccountForm = document.getElementById('create-account-form');
const signUp = document.getElementById('sign-up-button');
const signUpLink = document.getElementsByClassName('sign-up-link')[0];
const closeButtons = {
    'log-in-menu': document.getElementById('close-log-in-menu'),
    'create-account-menu': document.getElementById('close-create-account-menu')
};
const addStadiumMenu = document.getElementById('add-stadium-menu');
const addStadiumDateVisited = document.getElementById('add-stadium-date-visited');
const addStadiumNote = document.getElementById('add-stadium-note')
const closeAddStadiumMenu = document.getElementById('close-add-stadium-menu');
const addStadiumName = document.getElementById('add-stadium-name');
const addStadiumImage = document.getElementById('add-stadium-image');
const addStadiumSubmitButton = document.getElementById('add-stadium-submit-button');
const contentWrapper = document.getElementById('content-wrapper');
const logInButton = document.getElementById('log-in');
const createAccountButton = document.getElementById('create-account');
const sidebarToggle = document.getElementById("sidebar-active");
const sidebarToggleLoggedIn = document.getElementById('sidebar-active-logged-in');
const sidebarLogInButton = document.getElementById('sidebar-log-in');
const sidebarSignUpButton = document.getElementById('sidebar-sign-up');
const sidebarLogOutButton = document.getElementById('sidebar-log-out');
const sidebarUsername = document.getElementById('sidebar-username');
const stadiumName = document.getElementById('stadium-name');
const stadiumImage = document.getElementById('stadium-image');
const stadiumUserControls = document.getElementById('stadium-user-controls')
const stadiumVisited = document.getElementById('stadium-visited');
const stadiumVisits = document.getElementById('stadium-visits');
const stadiumLocation = document.getElementById('stadium-location');
const stadiumOpenedDate = document.getElementById('stadium-opened-date');
const stadiumTeams = document.getElementById('stadium-teams');
const stadiumCapacity = document.getElementById('stadium-capacity');
const stadiumConstructionCost = document.getElementById('stadium-construction-cost');
const stadiumUserControlVisited = document.getElementById('stadium-user-control-visited');
const stadiumUserControlWishlist = document.getElementById('stadium-user-control-wishlist');
const stadiumUserControlVisitedText = document.getElementById('stadium-user-control-visited-text');
const userVisitedCheckmark = document.getElementById('user-visited-checkmark');
const stadiumUserControlWishlistText = document.getElementById('stadium-user-control-wishlist-text');
const userWishlistHeart = document.getElementById('user-wishlist-heart');
const stadiumLogButton = document.getElementById('stadium-log-button');
const noUpcomingEventsContainer = document.getElementById('no-upcoming-events-container');
const upcomingEventsContainer = document.getElementById('upcoming-events');

/*  Functions  */
function showLoggedInUI() {
    let username = localStorage.getItem('username');
    if (username.length > 9) {
        username = username.slice(0,9) + '...';
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

function toggleMenu(menu, show, keepOverlay = false) {
    if (show) {
        if (!keepOverlay) {
            overlay.style.display = 'block';
            overlay.classList.remove('overlay-fade-out');
            void overlay.offsetWidth;
            overlay.classList.add('overlay-fade-in');
            document.body.style.overflow = 'hidden';
        }
        menu.style.display = 'block';
        menu.classList.remove('menu-fade-out');
        void menu.offsetWidth;
        menu.classList.add('menu-fade-in');
    } else {
        menu.classList.remove('menu-fade-in');
        menu.classList.add('menu-fade-out');
        if (!keepOverlay) {
            overlay.classList.remove('overlay-fade-in');
            overlay.classList.add('overlay-fade-out');
            document.body.style.overflow = 'auto';
        }
        setTimeout(() => {
            menu.style.display = 'none';
            if (!keepOverlay) {
                overlay.style.display = 'none';
            }
        }, 200);
    }
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/*  Async Functions  */
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

        stadiumName.innerHTML = result.stadiumInfo.stadium.name;

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

        const leagueImages = {
            NFL: '../images/icons/football-emoji.png',
            NBA: '../images/icons/basketball-emoji.png',
            MLB: '../images/icons/baseball-emoji.png',
            NHL: '../images/icons/hockey-emoji.png',
            MLS: '../images/icons/soccer-emoji.png'
        };
        const innerDiv = document.getElementsByClassName('stadium-info')[5].querySelector('div');
        Object.keys(leagueCounts).forEach(league => {
            if (leagueCounts[league] > 0) {
                const img = document.createElement('img');
                img.src = leagueImages[league];
                innerDiv.appendChild(img);
            }
        });

        const capacity = result.stadiumInfo.stadium.capacity;
        stadiumCapacity.innerHTML = capacity;

        const constructionCost = result.stadiumInfo.stadium.constructionCost;
        stadiumConstructionCost.innerHTML = constructionCost;

        const visits = result.stadiumInfo.stadium.visits;
        stadiumVisits.innerHTML = visits;

        let isVisited = result.stadiumInfo.userVisited.length > 0;
        stadiumUserControlVisitedText.textContent = isVisited ? 'Visited' : 'Visit';
        userVisitedCheckmark.src = isVisited ? 'images/icons/checkmark-blue.png' : 'images/icons/checkmark-white.png';

        let isWishlist = result.stadiumInfo.userWishlist.length > 0;
        stadiumUserControlWishlistText.textContent = isWishlist ? 'In Wishlist' : 'Add to Wishlist';
        userWishlistHeart.src = isWishlist ? 'images/icons/blue-heart.png' : 'images/icons/gray-heart.png';

        stadiumUserControlVisited.addEventListener('click', async () => {
            if (username == '') {
                toggleMenu(createAccountMenu, true);
            }
            else {
                if (isVisited) {
                    userVisitedCheckmark.src = 'images/icons/checkmark-white.png';
                    stadiumUserControlVisitedText.textContent = 'Visit';
                }
                else if (!isVisited && isWishlist) {
                    userVisitedCheckmark.src = 'images/icons/checkmark-blue.png';
                    stadiumUserControlVisitedText.textContent = 'Visited';
                    userWishlistHeart.src = 'images/icons/gray-heart.png';
                    stadiumUserControlWishlistText.textContent = 'Add to Wishlist';
                    try {
                        const response = await fetch('http://localhost:3000/stadium/updateUserWishlist', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: name, username: username, isWishlist: isWishlist })
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
                else {
                    userVisitedCheckmark.src = 'images/icons/checkmark-blue.png';
                    stadiumUserControlVisitedText.textContent = 'Visited';
                }
                try {
                    const response = await fetch('http://localhost:3000/stadium/updateUserStadium', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: name, username: username, isVisited: isVisited })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Unknown error');
                    }
                }
                catch (error) {
                    alert(error.message);
                }
                isVisited = !isVisited;
            }
        });

        stadiumUserControlWishlist.addEventListener('click', async() => {
            if (username == '') {
                toggleMenu(createAccountMenu, true);
            }
            else {
                if (isWishlist) {
                    userWishlistHeart.src = 'images/icons/gray-heart.png';
                    stadiumUserControlWishlistText.textContent = 'Add to Wishlist';
                }
                else {
                    userWishlistHeart.src = 'images/icons/blue-heart.png';
                    stadiumUserControlWishlistText.textContent = 'In Wishlist';
                }
                try {
                    const response = await fetch('http://localhost:3000/stadium/updateUserWishlist', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: name, username: username, isWishlist: isWishlist })
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
        })

        stadiumLogButton.addEventListener('click', () => {
            if (username == '') {
                toggleMenu(createAccountMenu, true);
            }
            else {
                toggleMenu(addStadiumMenu, true);
            }
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

        const latitude = stadium.latitude;
        const longitude = stadium.longitude;

        const map = L.map('stadium-map').setView([latitude, longitude], 6);

        const customIcon = L.icon({
            iconUrl: 'images/icons/pin-blue.png',
            iconSize: [25, 35],      
            iconAnchor: [16, 40],      
            popupAnchor: [-3, -40]
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
        }).addTo(map);

        L.marker([latitude, longitude], { icon: customIcon }).addTo(map)
            .bindPopup(`<div class="popup-card">
                            <h4>${stadium.stadium_name}</h4>
                        </div>`)
            
    } catch (error) {
        alert(error.message);
    }
}

async function loadUpcomingEvents(name) {
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
        const events = data._embedded.events;
        let eventCounter = 0;
        for (const event of events) {
            const upcomingEvent = document.createElement('div');
            upcomingEvent.classList.add('upcoming-event');

            const upcomingEventImage = document.createElement('img');
            const eventType = event.classifications[0].genre.name
            switch(eventType) {
                case "Football":
                    upcomingEventImage.src = 'images/icons/football-emoji.png';
                    break;
                case "Basketball":
                    upcomingEventImage.src = 'images/icons/basketball-emoji.png';
                    break;
                case "Baseball":
                    upcomingEventImage.src = 'images/icons/baseball-emoji.png';
                    break;
                case "Hockey":
                    upcomingEventImage.src = 'images/icons/hockey-emoji.png';
                    break;
                case "Soccer":
                    upcomingEventImage.src = 'images/icons/soccer-emoji.png';
                    break;
                default:
                    upcomingEventImage.src = 'images/icons/ticket-emoji.png';
                    break;
            }

            const eventInfo = document.createElement('div');
            eventInfo.classList.add('event-info');

            const eventName = document.createElement('h4');
            eventName.textContent = event.name;

            const eventDate = document.createElement('h4');

            const [year, month, day] = event.dates.start.localDate.split('-');
            const formattedDate = `${month}/${day}/${year}`;
            console.log(formattedDate);
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

            eventInfo.appendChild(eventName);
            eventInfo.appendChild(eventDate);
            eventInfo.appendChild(eventTime);

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

        document.getElementById('stadium-image-skeleton').style.display = 'none';
        document.getElementById('stadium-image').style.display = 'flex';

        document.getElementById('stadium-skeleton').style.display = 'none';
        document.getElementById('stadium-content').style.display = 'block';

        document.getElementById('upcoming-events-skeleton-container').style.display = 'none';
        document.getElementById('upcoming-events-content').style.display = 'block';
    }
    catch (error) {
        alert('Failed to load stadium content: ' + error.message);
    }
}

/*  Events  */
window.onload = async () => {
    const username = localStorage.getItem('username');
    if (username === '') {
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

createAccountButton.addEventListener('click', () => toggleMenu(createAccountMenu, true));

createAccountForm.addEventListener('submit', (event) => event.preventDefault());

logInButton.addEventListener('click', () => toggleMenu(logInMenu, true));

closeButtons['create-account-menu'].addEventListener('click', () => toggleMenu(createAccountMenu, false));

closeButtons['log-in-menu'].addEventListener('click', () => toggleMenu(logInMenu, false));

signUp.addEventListener('click', async () => {
    const newEmailInput = document.getElementById('new-email');
    const newUsernameInput = document.getElementById('new-username');
    const newPasswordInput = document.getElementById('new-password');
    const termsAndConditionsInput = document.getElementById('terms-and-conditions');

    const email = newEmailInput.value.trim();
    const username = newUsernameInput.value.trim();
    const password = newPasswordInput.value.trim();
    const termsAndConditions = termsAndConditionsInput.checked;

    if (!email || !username || !password) {
        alert('Please fill in all fields');
        return;
    }

    if (!termsAndConditions) {
        alert('Please accept the Terms and Conditions');
        return;
    }

    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    if (username.length > 30 || username.length < 6) {
        alert('Username must be between 6 and 30 characters.');
        return;
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*]/.test(password)) {
        alert('Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password })
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.error)
            return;
        }

        localStorage.setItem('username', username);
        window.location.replace('user-home.html');
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error creating your account. Please try again later.');
    }
});

logIn.addEventListener('click', async () => {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }
            
        const result = await response.json();

        localStorage.setItem('username', result.username);
        window.location.reload();
    } catch (error) {
        alert(error.message);
    }
});

logInForm.addEventListener("submit", (event) => event.preventDefault());

sidebarLogInButton.addEventListener('click', () => toggleMenu(logInMenu, true));

sidebarSignUpButton.addEventListener('click', () => toggleMenu(createAccountMenu, true));

sidebarLogOutButton.addEventListener('click', () => {
    localStorage.setItem('username', '');
    window.location.reload();
})

signUpLink.addEventListener('click', () => {
    toggleMenu(logInMenu, false, true);
    setTimeout(() => {
        toggleMenu(createAccountMenu, true, true);
    }, 200);
});

signInLink.addEventListener('click', () => {
    toggleMenu(createAccountMenu, false, true);
    setTimeout(() => {
        toggleMenu(logInMenu, true, true);
    }, 200);
});

logOutButton.addEventListener('click', () => {
    localStorage.setItem('username', '');
    window.location.reload();
});

closeAddStadiumMenu.addEventListener('click', () => {
    toggleMenu(addStadiumMenu, false);
})