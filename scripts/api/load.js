import { API_BASE_URL, ROUTES } from '../constants.js';
import { fetchAPI } from '../utils.js';

export const loadAPI = {
    loadAboutInfo: () => 
        fetchAPI(ROUTES.LOAD_ABOUT_INFO),

    loadCaptchaConfig: () =>
        fetchAPI(ROUTES.LOAD_CAPTCHA_CONFIG),

    loadFeaturedEvents: () => 
        fetchAPI(ROUTES.LOAD_FEATURED_EVENTS),

    loadMapStadiums: () =>
        fetchAPI(ROUTES.LOAD_MAP_STADIUMS),

    loadPhotoCredits: () =>
        fetchAPI(ROUTES.LOAD_PHOTO_CREDITS),

    loadPopularStadiums: () =>
        fetchAPI(ROUTES.LOAD_POPULAR_STADIUMS),

    loadProPricing: () => 
        fetchAPI(ROUTES.LOAD_PRO_PRICING),

    loadStadiumEvents: (id) => 
        fetchAPI(ROUTES.LOAD_STADIUMS_EVENTS, { id }),

    loadStadiumInfo: (id) =>
        fetchAPI(ROUTES.LOAD_STADIUM_INFO, { id }),

    loadStadiumMap: (id) =>
        fetchAPI(ROUTES.LOAD_STADIUM_MAP, { id }),

    loadStadiums: (league, country, sortBy) =>
        fetchAPI(ROUTES.LOAD_STADIUMS, { league, country, sortBy }),

    loadUserEvents: (event, sort) =>
        fetchAPI(ROUTES.LOAD_USER_EVENTS, { event, sort }),

    searchStadiums: (name) =>
        fetchAPI(ROUTES.SEARCH_STADIUMS, { name }),
};