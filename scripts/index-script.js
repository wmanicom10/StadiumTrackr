/*  Variables  */
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
const createAccountButtons = [document.getElementById('create-account'), document.getElementById('get-started-button')];
const sidebarToggle = document.getElementById("sidebar-active");
const sidebarLogInButton = document.getElementById('sidebar-log-in');
const sidebarSignUpButton = document.getElementById('sidebar-sign-up');
const searchStadiumsForm = document.getElementById('search-stadiums');
const searchValue = document.getElementById('home-search-field');
const suggestionsContainer = document.getElementById("autocomplete-list");
const stadiumsList = document.getElementById('popular-stadiums');
const stadiums = document.getElementsByClassName('popular-stadium');

/*  Functions  */
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

async function searchStadiums(name) {
    try {
        const response = await fetch('http://localhost:3000/stadium/searchStadiums', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }

        const result = await response.json();
        const stadiums = result.stadiums;

        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.display = 'block';

        searchValue.style.borderBottomLeftRadius = '0px';
        searchValue.style.borderBottomRightRadius = '0px';
        suggestionsContainer.style.paddingLeft = '11px';
        suggestionsContainer.style.paddingBottom = '1px';

        if (stadiums.length === 0) {
            const searchResult = document.createElement('div');
            searchResult.classList.add('search-result');
            const stadiumName = document.createElement('h4');
            stadiumName.innerHTML = 'No stadiums found';
            searchResult.appendChild(stadiumName);
            suggestionsContainer.appendChild(searchResult);
        }

        stadiums.forEach(stadium => {
            const stadiumLink = document.createElement('a');
            stadiumLink.href = `stadium.html?stadium=${encodeURIComponent(stadium.stadium_name)}`;
            const searchResult = document.createElement('div');
            searchResult.classList.add('search-result');
            const stadiumName = document.createElement('h4');
            stadiumName.innerHTML = stadium.stadium_name;
            searchResult.appendChild(stadiumName);
            stadiumLink.appendChild(searchResult);
            suggestionsContainer.appendChild(stadiumLink);

            stadiumLink.addEventListener('click', () => {
                searchValue.value = '';
            });
        });

    } catch (error) {
        alert(error.message);
    }
}

async function loadMapStadiums() {
    try {
        const response = await fetch('http://localhost:3000/stadium/loadMapStadiums', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }

        const result = await response.json();

        const stadiums = result.rows;

        const map = L.map('home-stadium-map').setView([42.8283, -96.5795], 4);

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

/*  Events  */
window.addEventListener('load', async () => {
    Array.from(stadiums).forEach(stadium => {
        const stadiumName = stadium.querySelector('h3').textContent;
        const link = stadium.querySelector('a');
        link.href = `stadium.html?stadium=${encodeURIComponent(stadiumName)}`;
    });

    const images = document.querySelectorAll('#popular-stadiums img');

    const imagePromises = Array.from(images).map(img => {
        return new Promise(resolve => {
            if (img.complete) {
                resolve();
            } else {
                img.onload = img.onerror = resolve;
            }
        });
    });

    await Promise.all(imagePromises);
    await new Promise(resolve => setTimeout(resolve, 750));

    loadMapStadiums();

    document.getElementById('popular-stadiums-skeleton').style.display = 'none';
    document.getElementById('popular-stadiums').style.display = 'flex';
});

window.addEventListener("resize", () => {
    if (sidebarToggle.checked) {
        sidebarToggle.checked = false;
    }
});

createAccountButtons.forEach(button => button.addEventListener('click', () => toggleMenu(createAccountMenu, true)));

createAccountForm.addEventListener('submit', function(event) {
    event.preventDefault();
});

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
    window.location.replace('user-home.html');
    } catch (error) {
        alert(error.message);
    }
});

logInForm.addEventListener("submit", function(event) {
    event.preventDefault();
});

sidebarLogInButton.addEventListener('click', () => {
    toggleMenu(logInMenu, true);
})

sidebarSignUpButton.addEventListener('click', () => {
    toggleMenu(createAccountMenu, true);
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

let typingTimer;
const debounceTime = 500;
searchValue.addEventListener('input', (event) => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        const name = event.target.value;
        if (!(name === "")) {
            searchStadiums(name);
        }
        else {
            suggestionsContainer.style.display = 'none';
            searchValue.style.borderBottomLeftRadius = '20px';
            searchValue.style.borderBottomRightRadius = '20px';
        }
    }, debounceTime);
});

document.addEventListener('click', function (event) {
    const isClickInside = searchValue.contains(event.target) || suggestionsContainer.contains(event.target);

    if (!isClickInside) {
        suggestionsContainer.style.display = 'none';
        searchValue.value = '';
        searchValue.style.borderBottomLeftRadius = '20px';
        searchValue.style.borderBottomRightRadius = '20px';
    }
});

searchStadiumsForm.addEventListener("submit", function (e) {
    e.preventDefault();
});