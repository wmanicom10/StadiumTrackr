const addStadiumsButton = document.getElementById('add-stadiums-button');
const overlay = document.getElementById('overlay');
const addStadiumButtonNav = document.getElementById('add-stadium');
const closeAddStadiumMenuButton = document.getElementById('close-add-stadium-menu');

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
    const recentStadiumsZero = document.getElementById('recent-stadiums-zero');
    const recentStadiumsContainer = document.getElementById('recently-visited-stadiums');
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
            recentStadiumsContainer.style.height = '320px';
        }
        else {
            recentStadiumsGZero.style.display = 'flex';
            recentStadiumsZero.style.display = 'none';
            recentStadiumsContainer.style.height = '385px';

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

                const stadiumLink = document.createElement('a');
                stadiumLink.href = `stadium.html?stadium=${encodeURIComponent(stadium.stadium_name)}`;

                stadiumLink.appendChild(listItem);

                recentStadiumsGZero.appendChild(stadiumLink);
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

        //wishlist.innerHTML = wishlistNumber;

        if (wishlistNumber === 0) {
            wishlistItemsZero.style.display = 'block';
            wishlistItemsGzero.style.display = 'none';
            wishlistContainer.style.height = '250px'
        }
        else {
            wishlistItemsGzero.style.display = 'block';
            wishlistItemsZero.style.display = 'none';

            wishlistItems.slice(0, 5).forEach(wishlistItem => {
                const div = document.createElement('div');
                div.classList.add('wishlist-item');
                let name = document.createElement('h4');
                name.innerHTML = wishlistItem.stadium_name;
                const location = document.createElement('h5');
                location.innerHTML = wishlistItem.location;

                div.appendChild(name);
                div.appendChild(location);

                const stadiumLink = document.createElement('a');
                stadiumLink.href = `stadium.html?stadium=${encodeURIComponent(wishlistItem.stadium_name)}`;
                stadiumLink.appendChild(div);

                wishlistItemsGzero.appendChild(stadiumLink);
            })
        }

    } catch (error) {
        console.error('Error:', error);
        alert('There was an error accessing user data. Please try again later.');
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

addStadiumsButton.addEventListener('click', showAddStadiumMenu);
addStadiumButtonNav.addEventListener('click', showAddStadiumMenu);
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

const logOutButton = document.getElementById('log-out');

logOutButton.addEventListener("click", () => {
    localStorage.setItem('username', '');
    window.location.replace('home.html');
    setTimeout(() => {
        history.pushState(null, null, 'index.html');
    }, 0);
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