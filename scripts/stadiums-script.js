import { loggedOutHeader, loggedInHeader, loggedInHeaderUsername, logOutButton, logInMenu, logInForm, logIn, signInLink, createAccountMenu, createAccountForm, signUp, signUpLink, closeButtons, logInButton, createAccountButton, sidebarToggle, sidebarToggleLoggedIn, sidebarLogInButton, sidebarSignUpButton, sidebarLogOutButton, sidebarUsername, searchStadiumsForm, searchValue, suggestionsContainer, overlay } from "./constants.js";
import { toggleMenu, searchStadiums } from "./utils.js";
import { registerEventListeners } from "./events.js";

/*  Variables  */
const selectors = {
    NFL: document.getElementById('nfl'),
    NBA: document.getElementById('nba'),
    MLB: document.getElementById('mlb'),
    NHL: document.getElementById('nhl'),
    MLS: document.getElementById('mls')
};
const stadiumLists = {
    NFL: document.getElementById('nfl-stadiums-list'),
    NBA: document.getElementById('nba-stadiums-list'),
    MLB: document.getElementById('mlb-stadiums-list'),
    NHL: document.getElementById('nhl-stadiums-list'),
    MLS: document.getElementById('mls-stadiums-list')
};

/*  Functions  */
async function setView(active) {
    Object.keys(selectors).forEach(key => {
        selectors[key].style.backgroundColor = key === active ? '#2463eb' : '#2d2d2d';
        stadiumLists[key].style.display = key === active ? 'block' : 'none';
    });

    const defaultCount = 30;
    const leagueCounts = {
        NFL: 30,
        NBA: 30,
        MLB: 30,
        NHL: 32,
        MLS: 30
    };
    const stadiumCount = leagueCounts[active] ?? defaultCount;

    const stadiumListContainer = stadiumLists[active].getElementsByClassName('stadiums-list')[0];

    stadiumListContainer.innerHTML = '';
    for (let i = 0; i < stadiumCount; i++) {
        const skeleton = document.createElement('div');
        skeleton.classList.add('skeleton-card');
        stadiumListContainer.appendChild(skeleton);
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 750));
        const response = await fetch('http://localhost:3000/stadium/loadStadiums', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ league: active })
        });

        if (!response.ok) throw new Error('Failed to load stadiums');

        const result = await response.json();

        const stadiumElements = result.rows.map(stadium => {
            const stadiumElement = document.createElement('div');
            stadiumElement.classList.add('stadiums-list-stadium');
            const stadiumLink = document.createElement('a');
            stadiumLink.href = `stadium.html?stadium=${encodeURIComponent(stadium.stadium_name)}`;
            const img = document.createElement('img');
            img.src = stadium.image;

            const div = document.createElement('div');
            div.classList.add('stadiums-list-stadium-text');
            const h3 = document.createElement('h3');
            h3.innerHTML = stadium.stadium_name;
            const h4 = document.createElement('h4');
            h4.textContent = stadium.city + ', ' + stadium.state;
            div.appendChild(h3);
            div.appendChild(h4);
            stadiumLink.appendChild(img);
            stadiumLink.appendChild(div);
            stadiumElement.appendChild(stadiumLink);

            return { element: stadiumElement, img };
        });

        await Promise.all(stadiumElements.map(({ img }) => new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
        })));

        stadiumListContainer.innerHTML = '';
        stadiumElements.forEach(({ element }) => stadiumListContainer.appendChild(element));

    } catch (err) {
        alert(err.message);
    }
}

function showLoggedInUI() {
    let username = localStorage.getItem('username');
    if (username.length > 10) {
        username = username.slice(0,10) + '...';
    }
    loggedInHeaderUsername.textContent = username;
    loggedOutHeader.style.display = 'none';
    sidebarUsername.textContent = username;
    loggedInHeader.style.display = 'flex';
}

function showLoggedOutUI() {
    loggedInHeader.style.display = 'none';
    loggedOutHeader.style.display = 'flex';
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
    setView('NFL');
    if (localStorage.getItem('username') === '') {
        showLoggedOutUI();
    }
    else {
        showLoggedInUI();
    }
};

window.addEventListener("resize", () => {
    if (sidebarToggle.checked) {
        sidebarToggle.checked = false;
    }
    if (sidebarToggleLoggedIn.checked) {
        sidebarToggleLoggedIn.checked = false;
    }
});

createAccountButton.addEventListener('click', () => toggleMenu(createAccountMenu, true, overlay));

let typingTimer;
const debounceTime = 500;
searchValue.addEventListener('input', (event) => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        const name = event.target.value;
        if (!(name === "")) {
            searchStadiums(name, suggestionsContainer, searchValue);
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

Object.keys(selectors).forEach(key => {
    selectors[key].addEventListener('click', async () => setView(key));
});

logOutButton.addEventListener('click', () => {
    localStorage.setItem('username', '');
    window.location.reload();
})

sidebarLogOutButton.addEventListener('click', () => {
    localStorage.setItem('username', '');
    window.location.reload();
})