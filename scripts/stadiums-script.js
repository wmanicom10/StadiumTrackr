const overlay = document.getElementById('overlay');

const logInMenu = document.getElementById('log-in-menu');
const createAccountMenu = document.getElementById('create-account-menu');

const createAccountButton = document.getElementById('create-account');
const logInButton = document.getElementById('log-in');

const closeButtons = {
    'create-account-menu': document.getElementById('close-create-account-menu'),
    'log-in-menu': document.getElementById('close-log-in-menu')
};

function toggleMenu(menu, show) {
    overlay.style.display = show ? 'block' : 'none';
    menu.style.display = show ? 'block' : 'none';
    document.body.style.overflow = show ? 'hidden' : 'auto';
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

    if (password.length < 8) {
        alert('Password must be at least 8 characters long');
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
            throw new Error(result.error || 'Failed to create account');
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

const stadiumLists = {
    NFL: document.getElementById('nfl-stadiums-list'),
    NBA: document.getElementById('nba-stadiums-list'),
    MLB: document.getElementById('mlb-stadiums-list'),
    NHL: document.getElementById('nhl-stadiums-list'),
    MLS: document.getElementById('mls-stadiums-list')
};

const selectors = {
    NFL: document.getElementById('nfl'),
    NBA: document.getElementById('nba'),
    MLB: document.getElementById('mlb'),
    NHL: document.getElementById('nhl'),
    MLS: document.getElementById('mls')
};

async function setView(active) {
    Object.keys(selectors).forEach(key => {
        selectors[key].style.borderBottom = key === active ? '1px solid black' : 'none';
        stadiumLists[key].style.display = key === active ? 'block' : 'none';
    });

    document.getElementById('loading-screen').style.display = 'block';
    document.getElementById('content-wrapper').style.display = 'none';

    const league = active;

    try {
        const response = await fetch('http://localhost:3000/stadium/loadStadiums', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ league })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }
        
        const result = await response.json();

        result.rows.forEach(stadium => {
            const listItem = document.createElement('li');
            listItem.classList.add('stadiums-list-stadium');
            const img = document.createElement('img');
            img.src = stadium.image;
            const h3 = document.createElement('h3');
            h3.innerHTML = stadium.stadium_name;
            const h4 = document.createElement('h4');
            h4.textContent = stadium.location;
            listItem.appendChild(img);
            listItem.appendChild(h3);
            listItem.appendChild(h4);

            listItem.addEventListener('click', async () => {
                const name = stadium.stadium_name;
                overlay.style.display = 'block';
                
                try {
                    const response = await fetch('http://localhost:3000/stadium/loadStadiumInfo', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: name })
                    });
            
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Unknown error');
                    }
                    
                    const result = await response.json();
            
                    const location = result.stadiumInfo.stadium.location;
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
                    const stadiumName = document.getElementById('stadium-name');
                    const stadiumImage = document.getElementById('stadium-image');
                    const stadiumLocation = document.getElementById('stadium-location');
                    const stadiumCapacity = document.getElementById('stadium-capacity');
                    const stadiumTeams = document.getElementById('stadium-teams');
                    const stadiumOpenedDate = document.getElementById('stadium-opened-date');
                    const stadiumConstructionCost = document.getElementById('stadium-construction-cost');
        
                    stadiumName.innerHTML = name;
                    stadiumImage.src = image;
                    stadiumLocation.innerHTML = location;
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
        
            });

            const stadiumLists = document.getElementsByClassName('stadiums-list');
            let position = 0;
            if (active === "NBA") {
                position = 1;
            }
            else if (active === "MLB") {
                position = 2;
            }
            else if (active === "NHL") {
                position = 3;
            }
            else if (active === "MLS") {
                position = 4;
            }
            stadiumLists[position].appendChild(listItem);
        })

        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('content-wrapper').style.display = 'block';

    } catch (error) {
        alert(error.message);
    }
}

window.onload = async () => {
    setView('NFL');
};

Object.keys(selectors).forEach(key => {
    selectors[key].addEventListener('click', async () => setView(key));
});

const closeStadiumInformation = document.getElementById('close-stadium-information');
const stadiumInformationContainer = document.querySelector('.stadium-information-container');

closeStadiumInformation.addEventListener('click', () => {
    stadiumInformationContainer.style.display = 'none';
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
})

const signedOutButton = document.getElementById('signed-out-button');

signedOutButton.addEventListener('click', () => {
    stadiumInformationContainer.style.display = 'none';
    toggleMenu(createAccountMenu, true);
})
