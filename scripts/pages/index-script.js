/*  Imports  */
import { DEBOUNCE_TIME, getAuthElements, IS_PROD, MIN_LOADING_TIME, STADIUM_IMAGE_PATH } from "../constants.js";
import { createToast, debounce, initializeCreateAccountCaptcha, isPro, rewriteUserHomeLinks, setupSearchAutocomplete, searchStadiums, shakeOrReplace } from "../utils.js";
import { registerCommonEvents, registerEventListeners } from "../events.js";
import { loadAPI } from "../api/load.js";

/*  Variables  */

/*  Async Functions  */
async function loadMapStadiums() {
    try {
        const result = await loadAPI.loadMapStadiums();
        const stadiums = result.rows;

        initializeMap(stadiums);
    } catch (error) {
        console.error(error);
    }
}

async function loadPopularStadiums() {
    try {
        const result = await loadAPI.loadPopularStadiums();

        result.popularStadiums.forEach(stadium => {
            const popularStadium = document.createElement('div');
            popularStadium.classList.add('popular-stadium');

            const popularStadiumLink = document.createElement('a');
            popularStadiumLink.href = IS_PROD && stadium.slug ? `/stadium/${stadium.slug}` : `stadium.html?id=${encodeURIComponent(stadium.stadium_id)}`;

            const popularStadiumImage = document.createElement('img');
            popularStadiumImage.src = STADIUM_IMAGE_PATH + stadium.image;
            popularStadiumImage.alt = stadium.stadium_name;

            const popularStadiumText = document.createElement('div');
            popularStadiumText.classList.add('popular-stadium-text');

            const popularStadiumName = document.createElement('h3');
            popularStadiumName.textContent = stadium.stadium_name;

            const popularStadiumLocation = document.createElement('h4');
            popularStadiumLocation.textContent = stadium.city + ', ' + stadium.state;

            popularStadiumText.appendChild(popularStadiumName);
            popularStadiumText.appendChild(popularStadiumLocation);

            popularStadiumLink.appendChild(popularStadiumImage);
            popularStadiumLink.appendChild(popularStadiumText);

            popularStadium.appendChild(popularStadiumLink);

            document.getElementById('popular-stadiums').appendChild(popularStadium);

        });

    } catch (error) {
        console.error(error);
    }
}

async function waitForImages() {
    const images = document.querySelectorAll('#popular-stadiums img');
    
    const imagePromises = Array.from(images).map(img => {
        return new Promise(resolve => {
            if (img.complete) {
                resolve();
            } else {
                img.onload = img.onerror = resolve;
            }
        });
    });

    await Promise.all(imagePromises);
    await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
}

/*  Functions  */
function initializeMap(stadiums) {
    const map = L.map('home-stadium-map').setView([42.8283, -96.5795], 4);

    const customIcon = L.icon({
        iconUrl: '/images/icons/pin-blue.png',
        iconSize: [25, 35],
        iconAnchor: [16, 40],
        popupAnchor: [-3, -40]
    });

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
        attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        ext: 'jpg'
    }).addTo(map);

    stadiums.forEach(stadium => {
        L.marker(stadium.location, { icon: customIcon })
            .addTo(map)
            .bindPopup(`
                <div class="popup-card">
                    <h4>${stadium.stadium_name}</h4>
                    <p>${stadium.address}</p>
                    <a href="${IS_PROD && stadium.slug ? `/stadium/${stadium.slug}` : `stadium.html?id=${encodeURIComponent(stadium.stadium_id)}`}">
                        <img src="/images/stadiums/${stadium.image}" alt="${stadium.stadium_name}" />
                    </a>
                </div>
            `);
    });
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    rewriteUserHomeLinks();
    registerEventListeners(getAuthElements());
    registerCommonEvents();
    initializeCreateAccountCaptcha();
    setupSearchAutocomplete('home-search-stadiums', 'search-field-home', 'home-autocomplete-list');
    setupSearchAutocomplete('logged-out-nav-search', 'logged-out-search-field-nav', 'logged-out-nav-autocomplete-list');
    setupSearchAutocomplete('logged-out-sidebar-nav-search', 'logged-out-sidebar-search-field-nav', 'logged-out-sidebar-nav-autocomplete-list');
});

window.onload = async () => {
    await loadPopularStadiums();
    await waitForImages();
    loadMapStadiums();
    document.getElementById('popular-stadiums-skeleton').style.display = 'none';
    document.getElementById('popular-stadiums').style.display = 'flex';
    document.getElementById('home-stadium-map-skeleton').style.display = 'none';
    document.getElementById('home-stadium-map').style.display = 'block';
    const pending = sessionStorage.getItem('toast');
    if (pending) {
        const { type, message } = JSON.parse(pending);
        createToast(type, message);
        sessionStorage.removeItem('toast');
    }
};