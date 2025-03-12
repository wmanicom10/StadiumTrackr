import { createAccount } from "./createaccount.js";
import { signIn } from "./signin.js";
import { loadStadiumInfo } from "./loadStadiumInfo.js";

const overlay = document.getElementById('overlay');

const logInMenu = document.getElementById('log-in-menu');
const createAccountMenu = document.getElementById('create-account-menu');

const createAccountButton = document.getElementById('create-account');
const logInButton = document.getElementById('log-in');

const closeButtons = {
    'create-account-menu': document.getElementById('close-create-account-menu'),
    'log-in-menu': document.getElementById('close-log-in-menu')
};

const contentWrapper = document.getElementById('content-wrapper');
contentWrapper.style.display = 'block';

function toggleMenu(menu, show) {
    overlay.style.display = show ? 'block' : 'none';
    menu.style.display = show ? 'block' : 'none';
}

createAccountButton.addEventListener('click', () => toggleMenu(createAccountMenu, true));
logInButton.addEventListener('click', () => toggleMenu(logInMenu, true));

closeButtons['create-account-menu'].addEventListener('click', () => toggleMenu(createAccountMenu, false));
closeButtons['log-in-menu'].addEventListener('click', () => toggleMenu(logInMenu, false));

const signUp = document.getElementById('sign-up-button')

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

signUp.addEventListener('click', () => {
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

    createAccount(email, username, password);
});

document.getElementById('create-account-form').addEventListener('submit', function(event) {
    event.preventDefault();
})

const logIn = document.getElementById('log-in-button');

logIn.addEventListener('click', () => {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    signIn(username, password)
});

document.getElementById("log-in-form").addEventListener("submit", function(event) {
    event.preventDefault();
});

const stadiumLists = {
    nfl: document.getElementById('nfl-stadiums-list'),
    nba: document.getElementById('nba-stadiums-list'),
    mlb: document.getElementById('mlb-stadiums-list')
};

const selectors = {
    nfl: document.getElementById('nfl'),
    nba: document.getElementById('nba'),
    mlb: document.getElementById('mlb')
};

function setView(active) {
    Object.keys(stadiumLists).forEach(key => {
        stadiumLists[key].style.display = key === active ? 'block' : 'none';
        selectors[key].style.borderBottom = key === active ? '1px solid black' : 'none';
    });
}

window.onload = () => setView('nfl');

Object.keys(selectors).forEach(key => {
    selectors[key].addEventListener('click', () => setView(key));
});

const stadiums = document.getElementsByClassName('stadiums-list-stadium');

Array.from(stadiums).forEach(stadium => {
    stadium.addEventListener('click', () => {
        const stadiumName = stadium.querySelector('h3').textContent;
        overlay.style.display = 'block';
        loadStadiumInfo(stadiumName);
    });
});

const closeStadiumInformation = document.getElementById('close-stadium-information');
const stadiumInformationContainer = document.querySelector('.stadium-information-container');

closeStadiumInformation.addEventListener('click', () => {
    stadiumInformationContainer.style.display = 'none';
    overlay.style.display = 'none';
})
