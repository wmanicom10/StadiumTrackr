import { stadiums } from "./stadiums.js";

export async function loadUserStadiumsInfo() {
    const nflStadiumsListGzero = document.getElementById('nfl-stadiums-list-gzero');
    const nflStadiumsListZero = document.getElementById('nfl-stadiums-list-zero');
    const nbaStadiumsListGzero = document.getElementById('nba-stadiums-list-gzero');
    const nbaStadiumsListZero = document.getElementById('nba-stadiums-list-zero');
    const mlbStadiumsListGzero = document.getElementById('mlb-stadiums-list-gzero');
    const mlbStadiumsListZero = document.getElementById('mlb-stadiums-list-zero');

    // replace with mysql logic to load user info for the user-stadiums page
    try {
        const username = localStorage.getItem('username');
        if (!username) return;

        const usernameElement = document.getElementById('username');

        usernameElement.innerHTML = username;

        const userRef = database.ref(`users/${username}`);
        const snapshot = await userRef.once('value');
        if (snapshot.exists()) {
            const data = snapshot.val();

            const nfl_stadiums = data.nfl_stadiums ? data.nfl_stadiums : 0;
            const nba_stadiums = data.nba_stadiums ? data.nba_stadiums : 0;
            const mlb_stadiums = data.mlb_stadiums ? data.mlb_stadiums : 0;

            if (nfl_stadiums === 0) {
                nflStadiumsListZero.style.display = 'flex';
            }
            else {
                nflStadiumsListGzero.style.display = 'flex';
                for (let i = 0; i < nfl_stadiums.length; i++) {
                    const listItem = document.createElement('li');
                    listItem.classList.add('stadiums-list-stadium');

                    const img = document.createElement('img');
                    const h3 = document.createElement('h3');

                    const imgSrc = stadiums[nfl_stadiums[i].name].image;
                    const h3Text = nfl_stadiums[i].name;
                    
                    img.src = imgSrc;
                    h3.innerHTML = h3Text;

                    listItem.appendChild(img);
                    listItem.appendChild(h3);

                    nflStadiumsListGzero.appendChild(listItem);
                }
            }

            if (nba_stadiums === 0) {
                nbaStadiumsListZero.style.display = 'flex';
            }
            else {
                nbaStadiumsListGzero.style.display = 'flex';
                for (let i = 0; i < nba_stadiums.length; i++) {
                    const listItem = document.createElement('li');
                    listItem.classList.add('stadiums-list-stadium');

                    const img = document.createElement('img');
                    const h3 = document.createElement('h3');

                    const imgSrc = stadiums[nba_stadiums[i].name].image;
                    const h3Text = nba_stadiums[i].name;
                    
                    img.src = imgSrc;
                    h3.innerHTML = h3Text;

                    listItem.appendChild(img);
                    listItem.appendChild(h3);

                    nbaStadiumsListGzero.appendChild(listItem);
                }
            }

            if (mlb_stadiums === 0) {
                mlbStadiumsListZero.style.display = 'flex';
            }
            else {
                mlbStadiumsListGzero.style.display = 'flex';
                for (let i = 0; i < mlb_stadiums.length; i++) {
                    const listItem = document.createElement('li');
                    listItem.classList.add('stadiums-list-stadium');

                    const img = document.createElement('img');
                    const h3 = document.createElement('h3');

                    const imgSrc = stadiums[mlb_stadiums[i].name].image;
                    const h3Text = mlb_stadiums[i].name;
                    
                    img.src = imgSrc;
                    h3.innerHTML = h3Text;

                    listItem.appendChild(img);
                    listItem.appendChild(h3);

                    mlbStadiumsListGzero.appendChild(listItem);
                }
            }
        }

        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('content-wrapper').style.display = 'block';

    } catch (error) {
        console.error('Error loading user information:', error);
    }
}