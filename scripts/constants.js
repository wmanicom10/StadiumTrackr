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
export const ICON_IMAGE_PATH = '/images/icons/';
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
export const PROFILE_PIC_PATH = '/images/profile-pics/';
export const ROUTES = {
    /* AUTH */
    AUTH_DELETE: '/auth/deleteAccount',
    AUTH_LOGIN: '/auth/login',
    AUTH_SIGNUP: '/auth/signup',

    /* LOAD */
    LOAD_ABOUT_INFO: '/load/loadAboutInfo',
    LOAD_CAPTCHA_CONFIG: '/load/loadCaptchaConfig',
    LOAD_FEATURED_EVENTS: '/load/loadFeaturedEvents',
    LOAD_MAP_STADIUMS: '/load/loadMapStadiums',
    LOAD_PHOTO_CREDITS: '/load/loadPhotoCredits',
    LOAD_POPULAR_STADIUMS: '/load/loadPopularStadiums',
    LOAD_PRO_PRICING: '/load/loadProPricing',
    LOAD_STADIUMS_EVENTS: '/load/loadStadiumEvents',
    LOAD_STADIUM_INFO: '/load/loadStadiumInfo',
    LOAD_STADIUM_MAP: '/load/loadStadiumMap',
    LOAD_STADIUMS: '/load/loadStadiums',
    LOAD_USER_EVENTS: '/load/loadUserEvents',
    SEARCH_STADIUMS: '/load/searchStadiums',

    /* PAYMENT */
    CREATE_CHECKOUT_SESSION: '/payment/createCheckoutSession',
    CREATE_PORTAL_SESSION: '/payment/createPortalSession',

    /* UPDATE */
    CREATE_USER_LIST: '/update/createUserList',
    DELETE_LOG: '/update/deleteLog',
    DELETE_TEMP_VISIT_PHOTO: '/update/deleteTempVisitPhoto',
    DELETE_USER_LIST: '/update/deleteUserList',
    DELETE_VISIT_PHOTO: '/update/deleteVisitPhoto',
    EDIT_LOG: '/update/editLog',
    UPDATE_EMAIL: '/update/updateEmail',
    UPDATE_PASSWORD: '/update/updatePassword',
    UPDATE_PROFILE_PIC: '/update/updateProfilePic',
    UPDATE_USER_LIST: '/update/updateUserList',
    UPDATE_USERNAME: '/update/updateUsername',
    UPDATE_USER_STADIUMS: '/update/updateUserStadium',
    UPDATE_USER_WISHLIST: '/update/updateUserWishlist',
    RESET_PASSWORD: '/update/resetPassword',

    /* USER */
    ADD_STADIUM: '/user/addStadium',
    DOWNLOAD_USER_DATA: '/user/downloadUserData',
    LOAD_FAVORITE_STADIUMS: '/user/loadFavoriteStadiums',
    LOAD_USER_ACHIEVEMENTS: '/user/loadUserAchievements',
    LOAD_USER_ACTIVITY: '/user/loadUserActivity',
    LOAD_USER_HOME_MAP: '/user/loadUserHomeMap',
    LOAD_USER_INFO: '/user/loadUserInfo',
    LOAD_USER_LIST: '/user/loadUserList',
    LOAD_USER_LISTS: '/user/loadUserLists',
    LOAD_USER_STADIUMS: '/user/loadUserStadiums',
    LOAD_USER_STATS: '/user/loadUserStats',
    LOAD_USER_VISITS: '/user/loadUserVisits',
    LOAD_USER_WISHLIST: '/user/loadUserWishlist',
    REFRESH_TOKEN: '/user/refreshToken',
    SAVE_FAVORITE_STADIUMS: '/user/saveFavoriteStadiums',
    SEND_PASSWORD_RESET: '/user/sendPasswordReset',
    UPLOAD_TEMP_VISIT_PHOTO: '/user/uploadTempVisitPhoto'
};
export const sidebarLogInButton = getElement('sidebar-log-in');
export const sidebarLogOutButton = getElement('sidebar-log-out');
export const sidebarSignUpButton = getElement('sidebar-sign-up');
export const sidebarToggle = getElement('sidebar-active');
export const sidebarToggleLoggedIn = getElement('sidebar-active-logged-in');
export const sidebarUsername = getElement('sidebar-username');
export const signInLink = getElement('sign-in-link');
export const signUp = getElement('sign-up-button');
export const signUpLink = getElement('sign-up-link');
export const STADIUM_IMAGE_PATH = '/images/stadiums/';
export const USERNAME_CONSTRAINTS = {
    MIN_LENGTH: 6,
    MAX_LENGTH: 30
};
export const VISIT_PHOTO_DIR = '/images/visit-photos/';

/*  Functions  */
function getElement(id) {
    return document.getElementById(id);
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
        sidebarSignUpButton,
        sidebarToggle,
        sidebarToggleLoggedIn
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