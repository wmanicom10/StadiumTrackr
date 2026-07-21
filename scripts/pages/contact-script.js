/*  Imports  */
import { getAuthElements } from "../constants.js";
import { initializeCreateAccountCaptcha, isLoggedIn, rewriteUserHomeLinks, setupSearchAutocomplete, showLoggedInUI, showLoggedOutUI } from "../utils.js";
import { registerCommonEvents, registerEventListeners, registerLogOutEvents } from "../events.js";

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
};