const overlay = document.getElementById('overlay');
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

                    const stadiumLink = document.createElement('a');
                    stadiumLink.href = `stadium.html?stadium=${encodeURIComponent(stadium.stadium_name)}`;
                    stadiumLink.appendChild(listItem);

                    stadiumsListGZero.appendChild(stadiumLink);
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

const searchStadiumsResultsContainer = document.getElementById('search-stadiums-results-container');
const stadiumContainer = document.getElementById('stadium-container');
const stadiumContainerName = document.getElementById('stadium-container-name');
const stadiumContainerImage = document.getElementById('stadium-container-image');

async function searchStadiums(stadium) {
    searchStadiumsResultsContainer.innerHTML = '';
    try {
        const response = await fetch('http://localhost:3000/stadium/searchStadiums', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: stadium })
        });

        if (!response.ok) {
            throw new Error(result.error || 'Error loading stadiums');
        }

        const result = await response.json();

        const stadiums = result.stadiums;

        if (stadiums.length === 0) {
            const searchResult = document.createElement('div');
            searchResult.classList.add('search-result');
            const stadiumName = document.createElement('h4');
            stadiumName.innerHTML = 'No stadiums found';
            searchResult.appendChild(stadiumName);
            searchStadiumsResultsContainer.appendChild(searchResult);
            return;
        }
    
        stadiums.forEach(stadium => {
            const searchResult = document.createElement('div');
            searchResult.classList.add('search-result');
            const stadiumName = document.createElement('h4');
            stadiumName.innerHTML = stadium.stadium_name;
            searchResult.appendChild(stadiumName);
            searchStadiumsResultsContainer.appendChild(searchResult);
    
            searchResult.addEventListener('click', () => {
                searchValue.value = '';
                searchStadiumsResultsContainer.innerHTML = '';
                stadiumContainer.style.display = 'block';
                stadiumContainerName.innerHTML = stadium.stadium_name;
                stadiumContainerImage.src = stadium.image;
            })
        });
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error loading stadiums. Please try again later.');
    }
}

const dateVisited = document.getElementById("date-visited");
const ratingInput = document.getElementById('rating');
const reviewInput = document.getElementById('review');

dateVisited.setAttribute("max", new Date().toISOString().split("T")[0]);
dateVisited.value = new Date().toISOString().split('T')[0];

const addStadiumMenu = document.querySelector('.add-stadium-menu');

function showAddStadiumMenu() {
    addStadiumMenu.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
};

function closeAddStadiumMenu() {
    addStadiumMenu.style.display = 'none';
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

document.getElementById("date-visited").setAttribute("max", new Date().toISOString().split("T")[0]);

const addStadiumButtons = document.getElementsByClassName('stadiums-add-stadiums-button');
Array.from(addStadiumButtons).forEach(stadium => {
    stadium.addEventListener('click', showAddStadiumMenu);
});

const addStadiumButtonNav = document.getElementById('add-stadium');
addStadiumButtonNav.addEventListener('click', showAddStadiumMenu);

const closeAddStadiumMenuButton = document.getElementById('close-add-stadium-menu');
closeAddStadiumMenuButton.addEventListener('click', closeAddStadiumMenu);

const searchValue = document.getElementById('search-field');
let typingTimer;
const debounceTime = 1000;

searchValue.addEventListener('input', (event) => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        searchStadiumsResultsContainer.innerHTML = '';
        stadiumContainer.style.display = '';
        stadiumContainerName.innerHTML = '';
        const name = event.target.value;
        if (!(name === '')) {
            searchStadiums(name);
        }
    }, debounceTime);
});

const addStadiumSubmitButton = document.getElementById('add-stadium-submit-button');

addStadiumSubmitButton.addEventListener('click', async () => {
    const username = localStorage.getItem('username');
    const name = stadiumContainerName.textContent;
    let date = dateVisited.value;
    date = date === "" ? null : date;
    let rating = ratingInput.value;
    rating = rating === "" ? null : rating;
    if (!(rating >= 0.5 && rating <= 5 && (rating * 10) % 5 === 0 || rating == null)) {
        alert('Please enter a valid rating');
    }
    let review = reviewInput.value;
    review = review === "" ? null : review;

    try {
        const response = await fetch('http://localhost:3000/stadium/addStadium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, name, date, rating, review })
        });

        if (!response.ok) {
            throw new Error('Error adding stadium');
        }

        const result = await response.json();

        alert('Stadium added successfully');
        window.location.reload();

    } catch (error) {
        console.error('Error:', error);
        alert('There was an error loading stadiums. Please try again later.');
    }
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
        selectors[key].style.borderBottom = key === league ? '1px solid #f0f0f0' : 'none';
    });
}

Object.keys(selectors).forEach(key => {
    selectors[key].addEventListener('click', () => setView(key));
});