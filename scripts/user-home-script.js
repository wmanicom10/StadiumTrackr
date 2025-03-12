import { loadUserInfo } from "./loadUserInfo.js";
import { stadiums } from "./stadiums.js";
import { addStadium } from "./addStadium.js";

const addStadiumsButton = document.getElementById('add-stadiums-button');
const addStadiumMenu = document.getElementsByClassName('add-stadium-menu')[0];
const overlay = document.getElementById('overlay');
const addStadiumButtonNav = document.getElementById('add-stadium');
const addFavoriteStadiumsButton = document.getElementById('add-favorite-stadiums-button');
const addFavoriteStadiumMenu = document.getElementsByClassName('add-stadium-menu')[1];

window.onload = async function () {
    await loadUserInfo();
};

document.getElementById("date-visited").setAttribute("max", new Date().toISOString().split("T")[0]);

const stadiumElement = document.getElementById('popular-stadiums')
const stadiumImage = document.getElementById('stadium-image');
const stadiumName = document.getElementById('stadium-name');
const stadiumLocation = document.getElementById('stadium-location');
const dateVisited = document.getElementById('date-visited-container');
const addStadiumButton = document.getElementById('add-stadium-button');
const closeAddStadiumMenu = document.getElementById('close-add-stadium-menu');
const leagueDropdownBtn = document.getElementById('league-dropdown-btn');
const leagueDropdownList = document.getElementById('league-dropdown-list');

function searchStadiums(stadium) {
    const stadiumImagePath = stadiums[stadium].image;
    const stadiumName = stadiums[stadium].name;
    const stadiumLocation = stadiums[stadium].location

    return {
        stadiumImagePath,
        stadiumName,
        stadiumLocation
    };
}

leagueDropdownBtn.addEventListener('click', () => {
    toggleDropdown(leagueDropdownList);
});

leagueDropdownList.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        leagueDropdownBtn.textContent = e.target.textContent;
        leagueDropdownBtn.dataset.value = e.target.dataset.value;
        leagueDropdownList.style.display = 'none';
        showStadiums(e.target.dataset.value);
    }
});

document.addEventListener('click', (e) => {
    if (!leagueDropdownBtn.contains(e.target) && !leagueDropdownList.contains(e.target)) {
        leagueDropdownList.style.display = 'none';
    }

    const stadiumDropdownBtns = document.querySelectorAll('.stadiums-dropdown');
    stadiumDropdownBtns.forEach(button => {
        const dropdownList = button.nextElementSibling;
        if (!button.contains(e.target) && !dropdownList.contains(e.target)) {
            dropdownList.style.display = 'none';
        }
    });
});

function toggleDropdown(dropdown) {
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function showStadiums(league) {
    const leagues = ["nfl", "nba", "mlb"];

    leagues.forEach(l => {
        const dropdown = document.getElementById(`${l}-dropdown`);
        if (dropdown) dropdown.style.display = 'none';
    });

    const selectedDropdown = document.getElementById(`${league}-dropdown`);
    if (!selectedDropdown) return;
    
    selectedDropdown.style.display = 'block';
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('stadiums-dropdown')) {
        const dropdownList = e.target.nextElementSibling;
        toggleDropdown(dropdownList);
    } else if (e.target.tagName === 'LI' && e.target.closest('.stadiums-dropdown-list')) {
        const dropdownBtn = e.target.closest('.dropdown').querySelector('.stadiums-dropdown');
        const stadium = e.target.textContent;
        const result = searchStadiums(stadium);

        stadiumImage.src = result.stadiumImagePath;
        stadiumName.innerHTML = result.stadiumName;
        stadiumLocation.innerHTML = result.stadiumLocation;

        dropdownBtn.textContent = e.target.textContent;
        dropdownBtn.dataset.value = e.target.dataset.value;
        e.target.parentElement.style.display = 'none';
        stadiumElement.style.display = 'flex';
        dateVisited.style.display = 'block';
        addStadiumButton.style.display = 'block';
    }
});

closeAddStadiumMenu.addEventListener('click', () => {
    addStadiumMenu.style.display = 'none';
    overlay.style.display = 'none';
    leagueDropdownBtn.textContent = 'Select League';
    leagueDropdownBtn.dataset.value = '';
    const nflDropdown = document.getElementById('nfl-dropdown');
    const nbaDropdown = document.getElementById('nba-dropdown');
    const mlbDropdown = document.getElementById('mlb-dropdown');
    nflDropdown.style.display = 'none';
    nbaDropdown.style.display = 'none';
    mlbDropdown.style.display = 'none';
    stadiumImage.src = '';
    stadiumName.innerHTML = '';
    stadiumLocation.innerHTML = '';
    stadiumElement.style.display = 'none';
    dateVisited.style.display = 'none';
    addStadiumButton.style.display = 'none';
});

addStadiumButton.addEventListener('click', () => {
    const date = document.getElementById('date-visited').value;
    addStadium(leagueDropdownBtn.textContent, stadiumName.innerHTML, stadiumLocation.innerHTML, date);
});

function showAddStadiumMenu() {
    addStadiumMenu.style.display = 'block';
    overlay.style.display = 'block';
};

function showAddFavoriteStadiumMenu() {
    addFavoriteStadiumMenu.style.display = 'block';
    overlay.style.display = 'block';
}

addStadiumsButton.addEventListener('click', showAddStadiumMenu);
addStadiumButtonNav.addEventListener('click', showAddStadiumMenu);
addFavoriteStadiumsButton.addEventListener('click', showAddFavoriteStadiumMenu);