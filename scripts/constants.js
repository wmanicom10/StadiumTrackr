// constants.js

// ============================================
// DOM Element Getters with Null Safety
// ============================================

function getElement(id) {
    return document.getElementById(id);
}

function getElements(className) {
    return document.getElementsByClassName(className);
}

// ============================================
// Overlay & Modals
// ============================================

export const overlay = getElement('overlay');
export const logInMenu = getElement('log-in-menu');
export const createAccountMenu = getElement('create-account-menu');

export const closeButtons = {
    'log-in-menu': getElement('close-log-in-menu'),
    'create-account-menu': getElement('close-create-account-menu')
};

// ============================================
// Authentication Forms
// ============================================

export const logInForm = getElement('log-in-form');
export const logIn = getElement('log-in-button');
export const signInLink = getElements('sign-in-link')[0];

export const createAccountForm = getElement('create-account-form');
export const signUp = getElement('sign-up-button');
export const signUpLink = getElements('sign-up-link')[0];

// ============================================
// Header Elements
// ============================================

export const loggedOutHeader = getElement('logged-out-header');
export const loggedInHeader = getElement('logged-in-header');
export const loggedInHeaderUsername = getElement('logged-in-header-username');

export const logInButton = getElement('log-in');
export const logOutButton = getElement('log-out');
export const createAccountButton = getElement('create-account');
export const createAccountButtons = [
    getElement('create-account'),
    getElement('get-started-button')
].filter(Boolean); // Remove null values

// ============================================
// Sidebar Elements
// ============================================

export const sidebarToggle = getElement('sidebar-active');
export const sidebarToggleLoggedIn = getElement('sidebar-active-logged-in');
export const sidebarUsername = getElement('sidebar-username');
export const sidebarLogInButton = getElement('sidebar-log-in');
export const sidebarSignUpButton = getElement('sidebar-sign-up');
export const sidebarLogOutButton = getElement('sidebar-log-out');

// ============================================
// Search Elements
// ============================================

export const searchStadiumsForm = getElement('search-stadiums');
export const searchValue = getElement('home-search-field');
export const suggestionsContainer = getElement('autocomplete-list');

// ============================================
// Configuration Constants
// ============================================

export const API_BASE_URL = 'http://localhost:3000';

export const ROUTES = {
    AUTH_SIGNUP: '/auth/signup',
    AUTH_LOGIN: '/auth/login',
    STADIUM_SEARCH: '/stadium/searchStadiums',
    STADIUM_MAP_HOME: '/stadium/loadMapStadiums',
    STADIUM_LOAD: '/stadium/loadStadiums',
    STADIUM_INFO: '/stadium/loadStadiumInfo',
    STADIUM_MAP: '/stadium/loadStadiumMap',
    USER_INFO: '/user/loadUserInfo',
    USER_ACTIVITY: '/user/loadUserActivity',
    USER_ACHIEVEMENTS: '/user/loadUserAchievements',
    USER_HOME_MAP: '/user/loadUserHomeMap',
    USER_STADIUMS: '/user/loadUserStadiums',
    USER_WISHLIST: '/user/loadUserWishlist'
};

export const DEBOUNCE_TIME = 500; // milliseconds
export const MIN_LOADING_TIME = 750; // milliseconds

export const USERNAME_CONSTRAINTS = {
    MIN_LENGTH: 6,
    MAX_LENGTH: 30
};

export const PASSWORD_CONSTRAINTS = {
    MIN_LENGTH: 8,
    REQUIRES_UPPERCASE: true,
    REQUIRES_NUMBER: true,
    REQUIRES_SPECIAL: true,
    SPECIAL_CHARS: '!@#$%^&*'
};

// ============================================
// Helper: Get Auth Elements Bundle
// ============================================

export function getAuthElements() {
    return {
        overlay,
        logInMenu,
        logInForm,
        logIn,
        signInLink,
        createAccountMenu,
        createAccountForm,
        signUp,
        signUpLink,
        closeButtons,
        logInButton,
        createAccountButton,
        createAccountButtons,  // ← Add this
        sidebarLogInButton,
        sidebarSignUpButton
    };
}

// ============================================
// Helper: Get Header Elements Bundle
// ============================================

export function getHeaderElements() {
    return {
        loggedOutHeader,
        loggedInHeader,
        loggedInHeaderUsername,
        logOutButton,
        sidebarUsername,
        sidebarLogOutButton
    };
}

// ============================================
// Helper: Get Search Elements Bundle
// ============================================

export function getSearchElements() {
    return {
        searchStadiumsForm,
        searchValue,
        suggestionsContainer
    };
}