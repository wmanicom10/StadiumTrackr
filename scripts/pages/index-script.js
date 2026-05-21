/*  Imports  */
import { API_BASE_URL, DEBOUNCE_TIME, getAuthElements, ROUTES, MIN_LOADING_TIME } from "../constants.js";
import { debounce, searchStadiums } from "../utils.js";
import { registerCommonEvents, registerEventListeners } from "../events.js";

/*  Variables  */
const header = document.querySelector('header');
const popularStadiums = document.getElementById('popular-stadiums');

/*  Async Functions  */
async function handlePageLoad() {
    header.style.display = 'flex';

    loadPopularStadiums();
    await waitForImages();
    loadMapStadiums();
    showPopularStadiums();
}

async function loadPopularStadiums() {
    try {
        const response = await fetch(`${API_BASE_URL}${ROUTES.POPULAR_STADIUMS}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        })
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }

        const result = await response.json();

        result.popularStadiums.forEach(stadium => {
            const popularStadium = document.createElement('div');
            popularStadium.classList.add('popular-stadium');

            const popularStadiumLink = document.createElement('a');
            popularStadiumLink.href = `stadium.html?id=${encodeURIComponent(stadium.stadium_id)}`;

            const popularStadiumImage = document.createElement('img');
            popularStadiumImage.src = stadium.image;
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

            popularStadiums.appendChild(popularStadium);

        });

    } catch (error) {
        alert(error.message);
    }
}

async function loadMapStadiums() {
    try {
        const response = await fetch(`${API_BASE_URL}${ROUTES.STADIUM_MAP_HOME}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }

        const result = await response.json();
        const stadiums = result.rows;

        initializeMap(stadiums);
    } catch (error) {
        alert(error.message);
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
function hideSearchSuggestions(container, input) {
    container.classList.remove('active');
    input.value = '';
}

function initializeMap(stadiums) {
    const map = L.map('home-stadium-map').setView([42.8283, -96.5795], 4);

    const customIcon = L.icon({
        iconUrl: 'images/icons/pin-blue.png',
        iconSize: [25, 35],
        iconAnchor: [16, 40],
        popupAnchor: [-3, -40]
    });

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
        attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        ext: 'jpg'
    }).addTo(map);

    stadiums.forEach(stadium => {
        let imageSlug = stadium.stadium_name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/'/g, '')
            .replace(/\./g, '');
        
        if (stadium.stadium_name === 'Memorial Stadium') {
            if (stadium.address.includes("Bloomington")) {
                imageSlug += '-indiana';
            }
            else if (stadium.address.includes("Clemson")) {
                imageSlug += '-clemson';
            }
            else if (stadium.address.includes("Lincoln")) {
                imageSlug += '-nebraska';
            }
        }

        if (stadium.stadium_name === 'Johnny "Red" Floyd Stadium') {
            imageSlug = 'johnny-red-floyd-stadium';
        }

        L.marker(stadium.location, { icon: customIcon })
            .addTo(map)
            .bindPopup(`
                <div class="popup-card">
                    <h4>${stadium.stadium_name}</h4>
                    <p>${stadium.address}</p>
                    <a href="stadium.html?id=${encodeURIComponent(stadium.stadium_id)}">
                        <img src="images/stadiums/${imageSlug}.jpg" alt="${stadium.stadium_name}" />
                    </a>
                </div>
            `);
    });
}

function setupSearchAutocomplete() {
    const searchStadiumsForm = document.getElementById('home-search-stadiums');
    const searchValue = document.getElementById('search-field-home');
    const suggestionsContainer = document.getElementById('home-autocomplete-list');

    const debouncedSearch = debounce((name) => {
        if (name) {
            searchStadiums(name, suggestionsContainer, searchValue);
        } else {
            hideSearchSuggestions(suggestionsContainer, searchValue);
        }
    }, DEBOUNCE_TIME);

    searchValue.addEventListener('input', (event) => {
        debouncedSearch(event.target.value);
    });

    document.addEventListener('click', (event) => {
        const isClickInside = searchValue.contains(event.target) || suggestionsContainer.contains(event.target);

        if (!isClickInside) {
            hideSearchSuggestions(suggestionsContainer, searchValue);
        }
    });

    searchStadiumsForm?.addEventListener('submit', (e) => e.preventDefault());
}

function showPopularStadiums() {
    document.getElementById('popular-stadiums-skeleton').style.display = 'none';
    document.getElementById('popular-stadiums').style.display = 'flex';
    document.getElementById('home-stadium-map-skeleton').style.display = 'none';
    document.getElementById('home-stadium-map').style.display = 'block'
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    registerEventListeners(getAuthElements());
    registerCommonEvents();
    setupSearchAutocomplete();
});

window.addEventListener('load', handlePageLoad);