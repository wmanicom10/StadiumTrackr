const overlay = document.getElementById('overlay');

const logInMenu = document.getElementById('log-in-menu');
const createAccountMenu = document.getElementById('create-account-menu');

const createAccountButtons = [document.getElementById('create-account'), document.getElementById('get-started-button')];
const logInButton = document.getElementById('log-in');

window.onload = () => {
    searchResultsContainer.innerHTML = '';
    searchValue.value = '';
}

const closeButtons = {
    'create-account-menu': document.getElementById('close-create-account-menu'),
    'log-in-menu': document.getElementById('close-log-in-menu')
};

const contentWrapper = document.getElementById('content-wrapper');
contentWrapper.style.display = 'block';

function toggleMenu(menu, show) {
    overlay.style.display = show ? 'block' : 'none';
    menu.style.display = show ? 'block' : 'none';
    document.body.style.overflow = show ? 'hidden' : 'auto';
}

createAccountButtons.forEach(button => button.addEventListener('click', () => toggleMenu(createAccountMenu, true)));
logInButton.addEventListener('click', () => toggleMenu(logInMenu, true));

closeButtons['create-account-menu'].addEventListener('click', () => toggleMenu(createAccountMenu, false));
closeButtons['log-in-menu'].addEventListener('click', () => toggleMenu(logInMenu, false));

const signUp = document.getElementById('sign-up-button')

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

signUp.addEventListener('click', async () => {
    const newEmailInput = document.getElementById('new-email');
    const newUsernameInput = document.getElementById('new-username');
    const newPasswordInput = document.getElementById('new-password');

    const email = newEmailInput.value.trim();
    const username = newUsernameInput.value.trim();
    const password = newPasswordInput.value.trim();

    if (!email || !username || !password) {
        alert('Please fill in all fields');
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

document.getElementById('create-account-form').addEventListener('submit', function(event) {
    event.preventDefault();
})

const logIn = document.getElementById('log-in-button');

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

document.getElementById("log-in-form").addEventListener("submit", function(event) {
    event.preventDefault();
});

const stadiums = document.getElementsByClassName('popular-stadium');

Array.from(stadiums).forEach(stadium => {
    const stadiumName = stadium.querySelector('h3').textContent;
    const link = stadium.querySelector('a');
    link.href = `stadium.html?stadium=${encodeURIComponent(stadiumName)}`;
});

const searchValue = document.getElementById('search-field');
let typingTimer;
const debounceTime = 1000;
const searchResultsContainer = document.getElementById("search-results-container");

searchValue.addEventListener('input', (event) => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        searchResultsContainer.innerHTML = '';
        const name = event.target.value;
        if (!(name === '')) {
            searchStadiums(name);
        }
    }, debounceTime);
});

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

    if (stadiums.length === 0) {
        const searchResult = document.createElement('div');
        searchResult.classList.add('search-result');
        const stadiumName = document.createElement('h4');
        stadiumName.innerHTML = 'No stadiums found';
        searchResult.appendChild(stadiumName);
        searchResultsContainer.appendChild(searchResult);
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
        searchResultsContainer.appendChild(stadiumLink);

        stadiumLink.addEventListener('click', () => {
            searchResultsContainer.innerHTML = '';
            searchValue.value = '';
        })

    });

    } catch (error) {
        alert(error.message);
    }
}