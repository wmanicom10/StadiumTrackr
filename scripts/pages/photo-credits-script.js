/*  Imports  */
import { getAuthElements, IS_PROD, MIN_LOADING_TIME } from "../constants.js";
import { initializeCreateAccountCaptcha, isLoggedIn, rewriteUserHomeLinks, setupSearchAutocomplete, shakeOrReplace, showLoggedInUI, showLoggedOutUI } from "../utils.js";
import { registerCommonEvents, registerEventListeners, registerLogOutEvents } from "../events.js";
import { loadAPI } from "../api/load.js";

/*  Async Functions  */
async function loadPhotoCredits() {
    try {
        const [result] = await Promise.all([
            loadAPI.loadPhotoCredits(),
            new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME))
        ]);
        const photoCredits = result.photoCredits;

        renderPhotoCredits(photoCredits);

        document.querySelectorAll('.photo-credits-table-skeleton').forEach(el => el.style.display = 'none');
        document.querySelectorAll('#photo-credits-table-body tr:not(.photo-credits-table-skeleton)').forEach(el => el.style.display = 'table-row');
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to load photo credits.');
    }
}

/*  Functions  */
function renderPhotoCredits(photoCredits) {
    const photoCreditsTableBody = document.getElementById('photo-credits-table-body');

    photoCredits.forEach(photoCredit => {
        const tr = document.createElement('tr');

        const stadiumName = document.createElement('td');
        const stadiumNameLink = document.createElement('a');
        stadiumNameLink.textContent = photoCredit.stadium_name;
        stadiumNameLink.href = IS_PROD && photoCredit.slug ? `/stadium/${photoCredit.slug}` : `stadium.html?id=${photoCredit.stadium_id}`;
        stadiumNameLink.target = '_blank';
        stadiumName.appendChild(stadiumNameLink);

        const photographer = document.createElement('td');
        if (photoCredit.notes) {
            const photographerLink = document.createElement('a');
            photographerLink.textContent = photoCredit.photographer;
            photographerLink.href = photoCredit.notes;
            photographerLink.target = '_blank';
            photographer.appendChild(photographerLink);
        } else {
            photographer.textContent = photoCredit.photographer;
        }

        const source = document.createElement('td');
        const sourceLink = document.createElement('a');
        sourceLink.textContent = photoCredit.source;
        sourceLink.href = photoCredit.source_url;
        sourceLink.target = '_blank';
        source.appendChild(sourceLink);

        const license = document.createElement('td');
        const licenseLink = document.createElement('a');
        licenseLink.textContent = photoCredit.license;
        licenseLink.href = photoCredit.license_url;
        licenseLink.target = '_blank';
        license.appendChild(licenseLink);

        if (photoCredit.modifications) {
            const modifications = document.createElement('span');
            modifications.textContent = ` (${photoCredit.modifications})`;
            source.appendChild(modifications);
        }
        
        stadiumName.setAttribute('data-label', 'Stadium');
        photographer.setAttribute('data-label', 'Photographer');
        source.setAttribute('data-label', 'Source');
        license.setAttribute('data-label', 'License');

        tr.appendChild(stadiumName);
        tr.appendChild(photographer);
        tr.appendChild(source);
        tr.appendChild(license);

        photoCreditsTableBody.appendChild(tr);
    });
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    rewriteUserHomeLinks();
    registerEventListeners(getAuthElements());
    registerCommonEvents();
    registerLogOutEvents();
    initializeCreateAccountCaptcha();
    setupSearchAutocomplete('logged-out-nav-search', 'logged-out-search-field-nav', 'logged-out-nav-autocomplete-list');
    setupSearchAutocomplete('logged-out-sidebar-nav-search', 'logged-out-sidebar-search-field-nav', 'logged-out-sidebar-nav-autocomplete-list');
    setupSearchAutocomplete('logged-in-nav-search', 'logged-in-search-field-nav', 'logged-in-nav-autocomplete-list');
    setupSearchAutocomplete('logged-in-sidebar-nav-search', 'logged-in-sidebar-search-field-nav', 'logged-in-sidebar-nav-autocomplete-list');
});

window.onload = async () => {
    if (isLoggedIn()) {
        showLoggedInUI();
    } else {
        showLoggedOutUI();
    }

    loadPhotoCredits();
};