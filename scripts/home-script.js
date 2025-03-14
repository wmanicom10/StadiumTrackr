const overlay = document.getElementById('overlay');

const logInMenu = document.getElementById('log-in-menu');
const createAccountMenu = document.getElementById('create-account-menu');

const createAccountButtons = [document.getElementById('create-account'), document.getElementById('get-started-button')];
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

createAccountButtons.forEach(button => button.addEventListener('click', () => toggleMenu(createAccountMenu, true)));
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
        // Send the data to the backend (POST request)
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

const stadiums = document.getElementsByClassName('popular-stadium');

Array.from(stadiums).forEach(stadium => {
    stadium.addEventListener('click', async() => {
        const name = stadium.querySelector('h3').textContent;
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
});

const closeStadiumInformation = document.getElementById('close-stadium-information');
const stadiumInformationContainer = document.querySelector('.stadium-information-container');

closeStadiumInformation.addEventListener('click', () => {
    stadiumInformationContainer.style.display = 'none';
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
})