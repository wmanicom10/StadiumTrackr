import { loggedInHeader, loggedInHeaderUsername, logOutButton, sidebarToggle, sidebarToggleLoggedIn, sidebarLogOutButton, sidebarUsername } from "./constants.js";

/*  Variables  */

/*  Functions  */
function showLoggedInUI() {
    let username = localStorage.getItem('username');
    if (username.length > 10) {
        username = username.slice(0,10) + '...';
    }
    loggedInHeaderUsername.textContent = username;
    loggedInHeader.style.display = 'flex';
    sidebarUsername.textContent = username;
}

/*  Async Functions  */
async function loadFullStadiumPage(username) {
    try {
        const userInfoPromise = loadUserInfo(username);

        const minimumLoadingTime = new Promise(resolve => setTimeout(resolve, 750));

        await Promise.all([
            userInfoPromise,
            minimumLoadingTime
        ]);

    }
    catch (error) {
        alert('Failed to load stadium content: ' + error.message);
    }
}

async function loadUserInfo(username) {
    try {
        const response = await fetch('http://localhost:3000/user/loadUserInfo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }

        const result = await response.json();
            
    } catch (error) {
        alert(error.message);
    }
}

/*  Events  */
window.onload = async () => {
    const username = localStorage.getItem('username');
    showLoggedInUI();
    loadFullStadiumPage(username);
};

window.addEventListener("resize", () => {
    if (sidebarToggle.checked) {
        sidebarToggle.checked = false;
    }
    if (sidebarToggleLoggedIn.checked) {
        sidebarToggleLoggedIn.checked = false;
    }
});

sidebarLogOutButton.addEventListener('click', () => {
    localStorage.setItem('username', '');
    window.location.replace('index.html');
})

logOutButton.addEventListener('click', () => {
    localStorage.setItem('username', '');
    window.location.replace('index.html');
});