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
const contentWrapper = document.getElementById('content-wrapper');
const logInButton = document.getElementById('log-in');
const createAccountButton = document.getElementById('create-account');
const sidebarToggle = document.getElementById("sidebar-active");
const sidebarToggleLoggedIn = document.getElementById('sidebar-active-logged-in');
const sidebarLogInButton = document.getElementById('sidebar-log-in');
const sidebarSignUpButton = document.getElementById('sidebar-sign-up');
const sidebarLogOutButton = document.getElementById('sidebar-log-out');
const sidebarUsername = document.getElementById('sidebar-username');
const userHomeWelcomeText = document.getElementById('user-home-welcome-text')
const userStadiumsElement = document.getElementById('user-stadiums');
const userStadiumsNoStadiumsText = document.getElementById('user-stadiums-no-stadiums-text');
const userHomeStadiumsSeeAllButton = document.getElementById('user-home-stadiums-see-all-button');
const numStadiums = document.getElementById('num-stadiums');
const numCountries = document.getElementById('num-countries');
const numEvents = document.getElementById('num-events');
const userWishlistStadiumsElement = document.getElementById('user-wishlist-stadiums');
const userWishlistStadiumsNoStadiumsText = document.getElementById('user-wishlist-stadiums-no-stadiums-text');
const userHomeWishlistSeeAllButton = document.getElementById('user-home-wishlist-see-all-button')

/*  Functions  */
function createUserStadiumElement(stadium) {
    const userStadium = document.createElement('div');
    userStadium.classList.add('user-stadium');

    const userStadiumLink = document.createElement('a');
    userStadiumLink.href = `stadium.html?stadium=${encodeURIComponent(stadium.stadium_name)}`;

    const userStadiumImage = document.createElement('img');
    userStadiumImage.src = stadium.image;

    const userStadiumText = document.createElement('div');
    userStadiumText.classList.add('user-stadium-text');

    const userStadiumName = document.createElement('h3');
    userStadiumName.textContent = stadium.stadium_name;

    const userStadiumLocation = document.createElement('h4');
    userStadiumLocation.textContent = `${stadium.city}, ${stadium.state}`;

    userStadiumText.appendChild(userStadiumName);
    userStadiumText.appendChild(userStadiumLocation);

    userStadiumLink.appendChild(userStadiumImage);
    userStadiumLink.appendChild(userStadiumText);
    userStadium.appendChild(userStadiumLink);

    return userStadium;
}

function showLoggedInUI() {
    let username = localStorage.getItem('username');
    userHomeWelcomeText.textContent = 'Welcome, ' + username + '!';
    if (username.length > 9) {
        username = username.slice(0,9) + '...';
    }
    loggedInHeaderUsername.textContent = username;
    loggedOutHeader.style.display = 'none';
    loggedInHeader.style.display = 'flex';
    sidebarUsername.textContent = username;
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
            
    } catch (error) {
        alert(error.message);
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
    loadFullStadiumPage(username);
};

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