/*  Imports  */
import { createAccountMenu, getAuthElements, MIN_LOADING_TIME, overlay } from "../constants.js";
import { initializeCreateAccountCaptcha, isLoggedIn, setupSearchAutocomplete, shakeOrReplace, showLoggedInUI, showLoggedOutUI, toggleMenu } from "../utils.js";
import { registerCommonEvents, registerEventListeners, registerLogOutEvents } from "../events.js";
import { loadAPI } from "../api/load.js";
import { paymentAPI } from '../api/payment.js';

/*  Variables  */
let monthlyPriceId = null;
let annualPriceId = null;

/*  Async Functions  */
async function loadProPricing() {
    try {
        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
        const pricing = await loadAPI.loadProPricing();
        monthlyPriceId = pricing.monthlyPriceId;
        annualPriceId = pricing.annualPriceId;
    } catch (err) {
        console.error(err);
        shakeOrReplace(err.message || 'Failed to load pro pricing ids.');
    }
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
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

    await loadProPricing();

    const token = localStorage.getItem('token');
    if (token) {
        let base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        let payload = JSON.parse(atob(base64));
        if (payload.isPro) {
            document.getElementById('pro-price-plans').style.display = 'none';
            document.getElementById('already-pro-member').style.display = 'block';
        }
        else {
            document.getElementById('pro-price-plans').style.display = 'flex';
        }
    } else {
        document.getElementById('pro-price-plans').style.display = 'flex';
    }

    document.getElementById('pro-price-plans-skeleton').style.display = 'none';
};

document.querySelectorAll('.pro-upgrade-button').forEach((button, index) => {
    button.addEventListener('click', async () => {
        if (!isLoggedIn()) {
            toggleMenu(createAccountMenu, true, overlay);
            return;
        }

        const priceId = index === 0 ? monthlyPriceId : annualPriceId;

        try {
            const result = await paymentAPI.createCheckoutSession(priceId);
            window.location.href = result.url;
        } catch (err) {
            console.error(err);
            shakeOrReplace(err.message || 'Failed to create checkout session.');
        }
    });
});

document.getElementById('manage-subscription-button')?.addEventListener('click', async () => {
    try {
        const result = await paymentAPI.createPortalSession();
        window.location.href = result.url;
    } catch (err) {
        console.error(err);
        shakeOrReplace(err.message || 'Failed to create portal session.');
    }
});