/*  Variables  */
export const API_BASE_URL = 'http://localhost:3000';
export const closeButtons = {
    'log-in-menu': getElement('close-log-in-menu'),
    'create-account-menu': getElement('close-create-account-menu')
};
export const createAccountButton = getElement('create-account');
export const createAccountButtons = [
    getElement('create-account'),
    getElement('get-started-button')
].filter(Boolean);
export const createAccountForm = getElement('create-account-form');
export const createAccountMenu = getElement('create-account-menu');
export const DEBOUNCE_TIME = 500;
export const loggedInHeader = getElement('logged-in-nav');
export const loggedInHeaderUsername = getElement('logged-in-header-username');
export const loggedOutHeader = getElement('logged-out-nav');
export const logIn = getElement('log-in-button');
export const logInButton = getElement('log-in');
export const logInForm = getElement('log-in-form');
export const logInMenu = getElement('log-in-menu');
export const logOutButton = getElement('log-out');
export const MIN_LOADING_TIME = 750;
export const overlay = getElement('overlay');
export const PASSWORD_CONSTRAINTS = {
    MIN_LENGTH: 8,
    REQUIRES_UPPERCASE: true,
    REQUIRES_NUMBER: true,
    REQUIRES_SPECIAL: true,
    SPECIAL_CHARS: '!@#$%^&*'
};
export const ROUTES = {
    AUTH_SIGNUP: '/auth/signup',
    AUTH_LOGIN: '/auth/login',
    POPULAR_STADIUMS: '/stadium/loadPopularStadiums',
    STADIUM_SEARCH: '/stadium/searchStadiums',
    STADIUM_MAP_HOME: '/stadium/loadMapStadiums',
    STADIUM_LOAD: '/stadium/loadStadiums',
    STADIUM_INFO: '/stadium/loadStadiumInfo',
    STADIUM_MAP: '/stadium/loadStadiumMap',
    UPCOMING_EVENTS: '/stadium/loadUpcomingEvents',
    LOGGED_OUT_EVENTS: '/stadium/loadLoggedOutEvents',
    LOGGED_IN_EVENTS: '/stadium/loadLoggedInEvents',
    STADIUMS_EVENTS: '/stadium/loadStadiumEvents',
    USER_INFO: '/user/loadUserInfo',
    USER_ACTIVITY: '/user/loadUserActivity',
    USER_ACHIEVEMENTS: '/user/loadUserAchievements',
    USER_HOME_MAP: '/user/loadUserHomeMap',
    USER_STADIUMS: '/user/loadUserStadiums',
    USER_WISHLIST: '/user/loadUserWishlist',
    USER_USERNAME: '/user/updateUsername',
    USER_PROFILE_PIC: '/user/updateProfilePic',
    USER_EMAIL: '/user/updateEmail',
    USER_PASSWORD: '/user/updatePassword',
    USER_DELETE: '/user/deleteAccount',
    USER_SAVE_FAVORITES: '/user/saveFavoriteStadiums',
    USER_FAVORITES: '/user/loadFavoriteStadiums'
};
export const searchStadiumsForm = getElement('search-stadiums');
export const searchValue = getElement('home-search-field');
export const sidebarLogInButton = getElement('sidebar-log-in');
export const sidebarLogOutButton = getElement('sidebar-log-out');
export const sidebarSignUpButton = getElement('sidebar-sign-up');
export const sidebarToggle = getElement('sidebar-active');
export const sidebarToggleLoggedIn = getElement('sidebar-active-logged-in');
export const sidebarUsername = getElement('sidebar-username');
export const signInLink = getElements('sign-in-link')[0];
export const signUp = getElement('sign-up-button');
export const signUpLink = getElements('sign-up-link')[0];
export const suggestionsContainer = getElement('autocomplete-list');
export const USERNAME_CONSTRAINTS = {
    MIN_LENGTH: 6,
    MAX_LENGTH: 30
};

/*  Functions  */
function getElement(id) {
    return document.getElementById(id);
}

function getElements(className) {
    return document.getElementsByClassName(className);
}

/*  Exported Functions  */
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
        createAccountButtons,
        sidebarLogInButton,
        sidebarSignUpButton
    };
}

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

export function getSearchElements() {
    return {
        searchStadiumsForm,
        searchValue,
        suggestionsContainer
    };
}