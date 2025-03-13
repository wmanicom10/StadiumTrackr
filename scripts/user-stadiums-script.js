import { loadUserStadiumsInfo } from "./loadUserStadiumsInfo.js";
import { stadiums } from "./stadiums.js";

const addStadiumMenu = document.getElementsByClassName('add-stadium-menu')[0];
const overlay = document.getElementById('overlay');
const addStadiumsButtons = document.querySelectorAll('.stadiums-add-stadiums-button');
const addStadiumButtonNav = document.getElementById('add-stadium');
addStadiumsButtons.forEach(button => {
    button.addEventListener('click', () => {
        addStadiumMenu.style.display = 'block';
        overlay.style.display = 'block';
    })
})
addStadiumButtonNav.addEventListener('click', () => {
    addStadiumMenu.style.display = 'block';
    overlay.style.display = 'block';
});

document.getElementById("date-visited").setAttribute("max", new Date().toISOString().split("T")[0]);

const stadiumElement = document.getElementById('popular-stadiums')
const stadiumImage = document.getElementById('stadium-image');
const stadiumName = document.getElementById('stadium-name');
const stadiumLocation = document.getElementById('stadium-location');
const dateVisited = document.getElementById('date-rating-container');
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

addStadiumButton.addEventListener('click', async () => {
    const name = stadiumName.textContent.trim();
    let date = document.getElementById('date-visited').value.trim();
    const username = localStorage.getItem('username');

    date = date === "" ? null : date;

    let rating = document.getElementById('rating').value.trim();

    rating = rating === "" ? null : rating;

    if (!(rating === null || (rating >= 0.5 && rating <= 5 && rating % 0.5 === 0))) {
        alert("Please enter a valid rating");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/stadium/addStadium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, name, date, rating })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to add stadium');
        }

        alert("Stadium added successfully");
        window.location.reload();
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error adding your stadium. Please try again later.');
    }
});

function showAddStadiumMenu() {
    addStadiumMenu.style.display = 'block';
    overlay.style.display = 'block';
};

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

let activeLeague = 'nfl';

function setView(active) {
    activeLeague = active;

    Object.keys(stadiumLists).forEach(key => {
        stadiumLists[key].style.display = key === active ? 'block' : 'none';
        selectors[key].style.borderBottom = key === active ? '1px solid black' : 'none';
    });
}

Object.keys(selectors).forEach(key => {
    selectors[key].addEventListener('click', () => setView(key));
});

window.onload = async function () {
    await loadUserStadiumsInfo();
    setView('nfl');
};