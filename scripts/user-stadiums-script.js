const overlay = document.getElementById('overlay');
const addStadiumsButtons = document.querySelectorAll('.stadiums-add-stadiums-button');
const addStadiumButtonNav = document.getElementById('add-stadium');

const username = localStorage.getItem('username');

window.onload = async function () {
    setView('nfl');

    if (!username) return;

    const usernameElement = document.getElementById('username');
    usernameElement.innerHTML = username;

    try {
        const response = await fetch('http://localhost:3000/user/loadUserStadiumInfo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        if (!response.ok) {
            throw new Error(result.error);
        }

        const result = await response.json();

        const userStadiums = result.userStadiums;

        for (const league in userStadiums) {
            const stadiums = userStadiums[league];
            const numStadiumsPerLeague = stadiums.length;

            const stadiumsListZero = document.getElementById(`${league.toLowerCase()}-stadiums-list-zero`);
            const stadiumsListGZero = document.getElementById(`${league.toLowerCase()}-stadiums-list-gzero`);

            if (numStadiumsPerLeague === 0) {
                stadiumsListZero.style.display = 'flex';
                stadiumsListGZero.style.display = 'none';
            }
            else {
                stadiumsListZero.style.display = 'none';
                stadiumsListGZero.style.display = 'flex';

                stadiums.forEach(stadium => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('stadiums-list-stadium');
    
                    const image = document.createElement('img');
                    image.src = stadium.image;

                    const name = document.createElement('h3');
                    name.innerHTML = stadium.stadium_name;

                    const location = document.createElement('h4');
                    location.innerHTML = stadium.location;

                    listItem.appendChild(image);
                    listItem.appendChild(name);
                    listItem.appendChild(location);

                    stadiumsListGZero.appendChild(listItem);
                })

            }
        }

    } catch (error) {
        console.error('Error:', error);
        alert('There was an error loading user info. Please try again later.');
    }

    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('content-wrapper').style.display = 'block';
};

document.getElementById("date-visited").setAttribute("max", new Date().toISOString().split("T")[0]);


const addStadiumMenu = document.getElementsByClassName('add-stadium-menu')[0];
const stadiumElement = document.getElementById('add-stadium-stadiums')
const stadiumImage = document.getElementById('stadium-image');
const stadiumName = document.getElementById('stadium-name');
const stadiumLocation = document.getElementById('stadium-location');
const dateVisited = document.getElementById('date-rating-container');
const addStadiumButton = document.getElementById('add-stadium-button');
const closeAddStadiumMenu = document.getElementById('close-add-stadium-menu');
const leagueDropdownBtn = document.getElementById('league-dropdown-btn');
const leagueDropdownList = document.getElementById('league-dropdown-list');

async function searchStadiums(stadium) {
    try {
        const response = await fetch('http://localhost:3000/stadium/loadStadiumInfo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: stadium })
        });

        if (!response.ok) {
            throw new Error(result.error || 'Error loading stadiums');
        }

        const result = await response.json();

        const name = result.stadiumInfo.stadium.name;
        const image = result.stadiumInfo.stadium.image;
        const location = result.stadiumInfo.stadium.location;

        return { name, image, location };

    } catch (error) {
        console.error('Error:', error);
        alert('There was an error loading stadiums. Please try again later.');
    }
}

function toggleDropdown(dropdown) {
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function showStadiums(league) {
    const leagues = ["nfl", "nba", "mlb", "nhl", "mls"];

    leagues.forEach(league => {
        const dropdown = document.getElementById(`${league}-dropdown`);
        if (dropdown) dropdown.style.display = 'none';
    });

    const selectedDropdown = document.getElementById(`${league.toLowerCase()}-dropdown`);
    if (!selectedDropdown) return;
    
    selectedDropdown.style.display = 'block';
}

leagueDropdownBtn.addEventListener('click', async () => {
    if (leagueDropdownList.children.length > 0) {
        toggleDropdown(leagueDropdownList);
        return;
    }
    try {
        const response = await fetch('http://localhost:3000/league/loadLeagues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();
        const leagues = result.leagues;

        leagues.forEach(league => {
            const listItem = document.createElement('li');
            listItem.innerHTML = league.league_name;
            leagueDropdownList.appendChild(listItem);
        })

        if (!response.ok) {
            throw new Error(result.error || 'Error loading stadiums');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error loading stadiums. Please try again later.');
    }

    toggleDropdown(leagueDropdownList);
});

let league;

leagueDropdownList.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        league = e.target.textContent;
        leagueDropdownBtn.textContent = league;
        leagueDropdownList.style.display = 'none';
        showStadiums(league);
    }
});

const stadiumDropdownBtns = document.querySelectorAll('.stadiums-dropdown');

document.addEventListener('click', (e) => {
    if (!leagueDropdownBtn.contains(e.target) && !leagueDropdownList.contains(e.target)) {
        leagueDropdownList.style.display = 'none';
        leagueDropdownList.innerHTML = '';
    }

    Array.from(stadiumDropdownBtns).forEach(button => {
        const dropdownList = button.nextElementSibling;

        if (!button.contains(e.target) && !dropdownList.contains(e.target)) {
            dropdownList.style.display = 'none';
            dropdownList.innerHTML = '';
        }
    });
});

document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('stadiums-dropdown')) {
        const dropdownList = e.target.nextElementSibling;

        if (dropdownList.children.length > 0) {
            toggleDropdown(dropdownList);
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/stadium/loadStadiums', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ league })
            });
    
            const result = await response.json();
            const stadiums = result.rows;

            stadiums.forEach(stadium => {
                const listItem = document.createElement('li');
                listItem.innerHTML = stadium.stadium_name;
                dropdownList.appendChild(listItem);
            })
    
            if (!response.ok) {
                throw new Error(result.error || 'Error loading stadiums');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('There was an error loading stadiums. Please try again later.');
        }

        toggleDropdown(dropdownList);
    } 
    else if (e.target.tagName === 'LI' && e.target.closest('.stadiums-dropdown-list')) {
        const dropdownBtn = e.target.closest('.dropdown').querySelector('.stadiums-dropdown');
        const stadium = e.target.textContent;
        const result = await searchStadiums(stadium);

        stadiumImage.src = result.image;
        stadiumName.innerHTML = result.name;
        stadiumLocation.innerHTML = result.location;

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
    const nhlDropdown = document.getElementById('nhl-dropdown');
    const mlsDropdown = document.getElementById('mls-dropdown');
    nflDropdown.style.display = 'none';
    nbaDropdown.style.display = 'none';
    mlbDropdown.style.display = 'none';
    nhlDropdown.style.display = 'none';
    mlsDropdown.style.display = 'none';
    stadiumImage.src = '';
    stadiumName.innerHTML = '';
    stadiumLocation.innerHTML = '';
    stadiumElement.style.display = 'none';
    dateVisited.style.display = 'none';
    addStadiumButton.style.display = 'none';
    document.body.style.overflow = 'auto';
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
    document.body.style.overflow = 'hidden';
};

Array.from(addStadiumsButtons).forEach(button => {
    button.addEventListener('click', showAddStadiumMenu);
})
addStadiumButtonNav.addEventListener('click', showAddStadiumMenu);

const closeStadiumInformation = document.getElementById('close-stadium-information');
const stadiumInformationContainer = document.querySelector('.stadium-information-container');

closeStadiumInformation.addEventListener('click', () => {
    stadiumInformationContainer.style.display = 'none';
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
})

const logOutButton = document.getElementById('log-out');

logOutButton.addEventListener("click", () => {
    localStorage.setItem('username', '');
    window.location.replace('home.html');
    setTimeout(() => {
        history.pushState(null, null, 'home.html');
    }, 0);
})

const stadiumLists = {
    nfl: document.getElementById('nfl-stadiums-list'),
    nba: document.getElementById('nba-stadiums-list'),
    mlb: document.getElementById('mlb-stadiums-list'),
    nhl: document.getElementById('nhl-stadiums-list'),
    mls: document.getElementById('mls-stadiums-list')
};

const selectors = {
    nfl: document.getElementById('nfl'),
    nba: document.getElementById('nba'),
    mlb: document.getElementById('mlb'),
    nhl: document.getElementById('nhl'),
    mls: document.getElementById('mls')
};

async function setView(league) {
    Object.keys(stadiumLists).forEach(key => {
        stadiumLists[key].style.display = key === league ? 'block' : 'none';
        selectors[key].style.borderBottom = key === league ? '1px solid black' : 'none';
    });
}

Object.keys(selectors).forEach(key => {
    selectors[key].addEventListener('click', () => setView(key));
});