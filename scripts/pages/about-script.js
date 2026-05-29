/*  Imports  */
import { getAuthElements } from "../constants.js";
import { getUsername, isLoggedIn, showLoggedInUI, showLoggedOutUI } from "../utils.js";
import { registerCommonEvents, registerEventListeners, registerLogOutEvents } from "../events.js";
import { loadAPI } from "../api/load.js";

/*  Variables  */
const visitImg = document.getElementById('about-visit-image');
const achievementsImg = document.getElementById('about-achievements-image');

/*  Async Functions  */
async function loadAboutInfo() {
    try {
        const result = await loadAPI.loadAboutInfo();
        const aboutInfo = result.aboutInfo;

        document.getElementById('stadiums-number').textContent = aboutInfo[0].num_stadiums;
        document.getElementById('leagues-number').textContent = aboutInfo[0].num_leagues;
        document.getElementById('countries-number').textContent = aboutInfo[0].num_countries;

    } catch (error) {
        alert(error.message);
    }
}

/*  Functions  */
function updateImageSource() {
    if (window.innerWidth <= 950) {
        visitImg.style.width = '360px';
        visitImg.src = 'images/about/about-visit-mobile.png';
    } else {
        visitImg.style.width = '';
        visitImg.src = 'images/about/about-visit.png';
    }
    if (window.innerWidth <= 860) {
        achievementsImg.style.width = '360px';
        achievementsImg.src = 'images/about/about-achievements-mobile.png';
    } else {
        achievementsImg.style.width = '';
        achievementsImg.src = 'images/about/about-achievements.png';
    }
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    registerEventListeners(getAuthElements());
    registerCommonEvents();
    registerLogOutEvents();
});

window.onload = async () => {
    const username = getUsername();
    if (isLoggedIn()) {
        showLoggedInUI(username);
    } else {
        showLoggedOutUI();
    }
    await loadAboutInfo();
    updateImageSource();
};

window.addEventListener('resize', updateImageSource);