import { stadiums } from "./stadiums.js";

export async function loadUserInfo() {
    // replace with mysql logic to load user info

    try {
        const username = localStorage.getItem('username');
        if (!username) return;

        const usernameElement = document.getElementById('username');
        const userHeader = document.getElementById('welcome-header');

        usernameElement.innerHTML = username;

        const stadiumsVisited = document.getElementById('stadiums-visited-number');
        const countries = document.getElementById('countries-number');
        const eventsAttended = document.getElementById('events-attended-number');
        const wishlist = document.getElementById('wishlist-number');
        const wishlistItemsZero = document.getElementById('wishlist-items-zero');
        const wishlistItemsGzero = document.getElementById('wishlist-items-gzero');

        const userRef = database.ref(`users/${username}`);
        const snapshot = await userRef.once('value');
        if (snapshot.exists()) {
            const data = snapshot.val();

            const stadiumsVisitedArray = data.stadiums_visited ? data.stadiums_visited : [];

            let stadiumsVisitedNumber = new Set(stadiumsVisitedArray.map(stadium => stadium.name)).size
            
            stadiumsVisited.innerHTML = stadiumsVisitedNumber;
            countries.innerHTML = data.countries;
            eventsAttended.innerHTML = data.events_attended;

            const wishlistNumber = data.wishlist_items ? data.wishlist_items.length : 0;
            wishlist.innerHTML = wishlistNumber;

            if (wishlistNumber === 0) {
                wishlistItemsZero.style.display = 'block';
            }
            else {
                wishlistItemsGzero.style.display = 'block';
            }

            const recentStadiumsZero = document.getElementById('recent-stadiums-zero');
            const recentStadiumsOne = document.getElementById('recent-stadiums-one');
            const recentStadiumsGone = document.getElementById('recent-stadiums-gone');

            if (stadiumsVisitedNumber === 0) {
                recentStadiumsZero.style.display = 'flex';
                recentStadiumsOne.style.display = 'none';
                recentStadiumsGone.style.display = 'none';
            }
            else if (stadiumsVisitedNumber === 1) {
                recentStadiumsZero.style.display = 'none';
                recentStadiumsOne.style.display = 'flex';
                recentStadiumsGone.style.display = 'none';

                const recentStadiumOneImage = document.getElementById('recent-stadium-one-image');
                const recentStadiumOneName = document.getElementById('recent-stadium-one-name');
                const recentStadiumOneLocation = document.getElementById('recent-stadium-one-location');

                recentStadiumOneImage.src = stadiums[data.stadiums_visited[0].name].image;
                recentStadiumOneName.innerHTML = data.stadiums_visited[0].name;
                recentStadiumOneLocation.innerHTML = data.stadiums_visited[0].location;
            }
            else {
                recentStadiumsZero.style.display = 'none';
                recentStadiumsOne.style.display = 'none';
                recentStadiumsGone.style.display = 'flex';

                const recentStadiumGoneImageOne = document.getElementById('recent-stadium-gone-image-one');
                const recentStadiumGoneImageTwo = document.getElementById('recent-stadium-gone-image-two');
                const recentStadiumGoneNameOne = document.getElementById('recent-stadium-gone-name-one');
                const recentStadiumGoneNameTwo = document.getElementById('recent-stadium-gone-name-two');
                const recentStadiumGoneLocationOne = document.getElementById('recent-stadium-gone-location-one');
                const recentStadiumGoneLocationTwo = document.getElementById('recent-stadium-gone-location-two');

                const mostRecentStadium = data.stadiums_visited[data.stadiums_visited.length - 1];
                const secondMostRecentStadium = data.stadiums_visited[data.stadiums_visited.length - 2];

                recentStadiumGoneImageOne.src = stadiums[mostRecentStadium.name].image;
                recentStadiumGoneImageTwo.src = stadiums[secondMostRecentStadium.name].image;
                recentStadiumGoneNameOne.innerHTML = mostRecentStadium.name;
                recentStadiumGoneNameTwo.innerHTML = secondMostRecentStadium.name;
                recentStadiumGoneLocationOne.innerHTML = mostRecentStadium.location;
                recentStadiumGoneLocationTwo.innerHTML = secondMostRecentStadium.location;
            }

        }

    } catch (error) {
        console.error('Error loading user information:', error);
    }
}