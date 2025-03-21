const addStadiumsButton = document.getElementById('add-stadiums-button');
const overlay = document.getElementById('overlay');
const addStadiumButtonNav = document.getElementById('add-stadium');

window.onload = async function () {

    const username = localStorage.getItem('username');
    if (!username) return;

    const usernameElement = document.getElementById('username');
    const userHeader = document.getElementById('welcome-header');

    usernameElement.innerHTML = username;
    userHeader.innerHTML += username + "!";

    const favoriteStadiumsGZero = document.getElementById('favorite-stadiums-gzero');
    const favoriteStadiumsZero = document.getElementById('favorite-stadiums-zero');
    const recentStadiumsGZero = document.getElementById('recent-stadiums-gzero');
    const recentStadiumsZero = document.getElementById('recent-stadiums-zero')
    const stadiumsVisited = document.getElementById('stadiums-visited-number');
    const countries = document.getElementById('countries-number');
    const eventsAttended = document.getElementById('events-attended-number');
    const wishlist = document.getElementById('wishlist-number');
    const wishlistItemsZero = document.getElementById('wishlist-items-zero');
    const wishlistItemsGzero = document.getElementById('wishlist-items-gzero');
    const wishlistContainer = document.getElementById('wishlist');

    try {
        const response = await fetch('http://localhost:3000/user/loadUserInfo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to load user info');
        }

        const numStadiumsVisited = result.numStadiumsVisited;
        stadiumsVisited.innerHTML = numStadiumsVisited;

        const recentStadiumsVisited = result.recentStadiumsVisited;

        if (numStadiumsVisited === 0) {
            recentStadiumsZero.style.display = 'block';
            recentStadiumsGZero.style.display = 'none';
        }
        else {
            recentStadiumsGZero.style.display = 'flex';
            recentStadiumsZero.style.display = 'none';

            recentStadiumsVisited.forEach(stadium => {
                const listItem = document.createElement('li');
                listItem.classList.add('recent-stadium');

                const image = document.createElement('img');
                image.src = stadium.image;

                const name = document.createElement('h4');
                name.innerHTML = stadium.stadium_name;

                const location = document.createElement('h5');
                location.innerHTML = stadium.location;

                listItem.appendChild(image);
                listItem.appendChild(name);
                listItem.appendChild(location);

                recentStadiumsGZero.appendChild(listItem);
            })
        }

        const numCountriesVisited = result.numCountriesVisited;
        countries.innerHTML = numCountriesVisited;

        const numEventsAttended = result.numEventsAttended;
        eventsAttended.innerHTML = numEventsAttended;

        const favoriteStadiums = result.favoriteStadiums;
        const favoriteStadiumsNumber = favoriteStadiums.length;

        if (favoriteStadiumsNumber === 0) {
            favoriteStadiumsZero.style.display = 'block';
            favoriteStadiumsGZero.style.display = 'none';
        }
        else {
            favoriteStadiumsGZero.style.display = 'flex';
            favoriteStadiumsZero.style.display = 'none';

            favoriteStadiums.forEach(stadium => {
                const listItem = document.createElement('li');
                listItem.classList.add('favorite-stadium');

                const image = document.createElement('img');
                image.src = stadium.image;

                const name = document.createElement('h4');
                name.innerHTML = stadium.stadium_name;

                const location = document.createElement('h5');
                location.innerHTML = stadium.location;

                listItem.appendChild(image);
                listItem.appendChild(name);
                listItem.appendChild(location);

                favoriteStadiumsGZero.appendChild(listItem);
            })
        }

        const wishlistItems = result.wishlistItems;
        const wishlistNumber = wishlistItems.length;

        wishlist.innerHTML = wishlistNumber;

        if (wishlistNumber === 0) {
            wishlistItemsZero.style.display = 'block';
            wishlistItemsGzero.style.display = 'none';
            wishlistContainer.style.height = '250px'
        }
        else {
            wishlistItemsGzero.style.display = 'block';
            wishlistItemsZero.style.display = 'none';
            wishlistContainer.style.height = '385px';

            wishlistItems.slice(0, 5).forEach(wishlistItem => {
                const div = document.createElement('div');
                div.classList.add('wishlist-item');
                let name = document.createElement('h4');
                name.innerHTML = wishlistItem.stadium_name;
                const location = document.createElement('h5');
                location.innerHTML = wishlistItem.location;

                div.appendChild(name);
                div.appendChild(location);
                wishlistItemsGzero.appendChild(div);

                div.addEventListener('click', async () => {
                    overlay.style.display = 'block';

                    name = name.innerHTML;
                    
                    try {
                        const response = await fetch('http://localhost:3000/stadium/loadStadiumInfo', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name })
                        });
                
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Unknown error');
                        }
                        
                        const result = await response.json();
                
                        const image = result.stadiumInfo.stadium.image;
                        const capacity = result.stadiumInfo.stadium.capacity;
                        const openedDateSQL = result.stadiumInfo.stadium.openedDate;
                        const date = new Date(openedDateSQL);
                        const openedDate = date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        const constructionCost = result.stadiumInfo.stadium.constructionCost;
                        const teamsSQL = result.stadiumInfo.teams;
                        const teams = teamsSQL.map(team => team.team_name).join(', ');
                        const stadiumName = document.getElementById('stadium-name2');
                        const stadiumImage = document.getElementById('stadium-image2');
                        const stadiumLocation = document.getElementById('stadium-location2');
                        const stadiumCapacity = document.getElementById('stadium-capacity');
                        const stadiumTeams = document.getElementById('stadium-teams');
                        const stadiumOpenedDate = document.getElementById('stadium-opened-date');
                        const stadiumConstructionCost = document.getElementById('stadium-construction-cost');
            
                        stadiumName.innerHTML = name;
                        stadiumImage.src = image;
                        stadiumLocation.innerHTML = location.innerHTML;
                        stadiumCapacity.innerHTML = capacity;
                        stadiumTeams.innerHTML = teams;
                        stadiumOpenedDate.innerHTML = openedDate;
                        stadiumConstructionCost.innerHTML = constructionCost;
            
                        const stadiumInformationContainer = document.querySelector('.stadium-information-container');
                        stadiumInformationContainer.style.display = 'block';
                        document.body.style.overflow = 'hidden';
            
                    } catch (error) {
                        alert(error.message);
                    }
                })
            })
        }

    } catch (error) {
        console.error('Error:', error);
        alert('There was an error accessing user data. Please try again later.');
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
    const leagues = ["nfl", "nba", "mlb"];

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
    nflDropdown.style.display = 'none';
    nbaDropdown.style.display = 'none';
    mlbDropdown.style.display = 'none';
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

addStadiumsButton.addEventListener('click', showAddStadiumMenu);
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