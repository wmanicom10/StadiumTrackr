import { overlay, logInMenu, logInForm, logIn, signInLink, createAccountMenu, createAccountForm, signUp, signUpLink, closeButtons, logInButton, createAccountButtons, sidebarToggle, sidebarLogInButton, sidebarSignUpButton, searchStadiumsForm, searchValue, suggestionsContainer } from "./constants.js";
import { toggleMenu, searchStadiums } from "./utils.js";
import { registerEventListeners } from "./events.js";

/*  Variables  */
const header = document.querySelector('header');
const stadiums = document.getElementsByClassName('popular-stadium');

/*  Async Functions  */
async function loadMapStadiums() {
    try {
        const response = await fetch('http://localhost:3000/stadium/loadMapStadiums', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }

        const result = await response.json();

        const stadiums = result.rows;

        const map = L.map('home-stadium-map').setView([42.8283, -96.5795], 4);

        const customIcon = L.icon({
            iconUrl: 'images/icons/pin-blue.png',
            iconSize: [25, 35],      
            iconAnchor: [16, 40],      
            popupAnchor: [-3, -40]
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
        }).addTo(map);

        stadiums.forEach(stadium => {
        L.marker(stadium.location, { icon: customIcon }).addTo(map)
            .bindPopup(`<div class="popup-card">
                            <h4>${stadium.stadium_name}</h4>
                            <p>${stadium.address}</p>
                            <a href="stadium.html?stadium=${encodeURIComponent(stadium.stadium_name)}"><img src=${`images/stadiums/${stadium.stadium_name.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '').replace(/\./g, '')}.jpg`} /></a>
                        </div>`)
        });
    } catch (error) {
        alert(error.message);
    }
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    registerEventListeners({
        overlay,
        createAccountForm,
        logInForm,
        logInButton,
        signUp,
        logIn,
        closeButtons,
        createAccountMenu,
        logInMenu,
        sidebarLogInButton,
        sidebarSignUpButton,
        signUpLink,
        signInLink
    });
});

window.addEventListener('load', async () => {
    header.style.display = 'flex';

    Array.from(stadiums).forEach(stadium => {
        const stadiumName = stadium.querySelector('h3').textContent;
        const link = stadium.querySelector('a');
        link.href = `stadium.html?stadium=${encodeURIComponent(stadiumName)}`;
    });

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
    await new Promise(resolve => setTimeout(resolve, 750));

    loadMapStadiums();

    document.getElementById('popular-stadiums-skeleton').style.display = 'none';
    document.getElementById('popular-stadiums').style.display = 'flex';
});

window.addEventListener("resize", () => {
        if (sidebarToggle.checked) {
            sidebarToggle.checked = false;
        }
    });

createAccountButtons.forEach(button => button.addEventListener('click', () => toggleMenu(createAccountMenu, true, overlay)));

let typingTimer;
const debounceTime = 500;
searchValue.addEventListener('input', (event) => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        const name = event.target.value;
        if (!(name === "")) {
            searchStadiums(name, suggestionsContainer, searchValue);
        }
        else {
            suggestionsContainer.style.display = 'none';
            searchValue.style.borderBottomLeftRadius = '20px';
            searchValue.style.borderBottomRightRadius = '20px';
        }
    }, debounceTime);
});

document.addEventListener('click', function (event) {
    const isClickInside = searchValue.contains(event.target) || suggestionsContainer.contains(event.target);

    if (!isClickInside) {
        suggestionsContainer.style.display = 'none';
        searchValue.value = '';
        searchValue.style.borderBottomLeftRadius = '20px';
        searchValue.style.borderBottomRightRadius = '20px';
    }
});

searchStadiumsForm.addEventListener("submit", function (e) {
    e.preventDefault();
});