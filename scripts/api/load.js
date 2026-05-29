import { API_BASE_URL, ROUTES } from '../constants.js';
import { fetchAPI } from '../utils.js';

export const loadAPI = {
    loadAboutInfo: () => 
        fetchAPI(ROUTES.LOAD_ABOUT_INFO),

    loadFeaturedEvents: () => 
        fetchAPI(ROUTES.LOAD_FEATURED_EVENTS),

    loadMapStadiums: () =>
        fetchAPI(ROUTES.LOAD_MAP_STADIUMS),

    loadPopularStadiums: () =>
        fetchAPI(ROUTES.LOAD_POPULAR_STADIUMS),

    loadStadiumEvents: (id) => 
        fetchAPI(ROUTES.LOAD_STADIUMS_EVENTS, { id }),

    loadStadiumInfo: (id, username) =>
        fetchAPI(ROUTES.LOAD_STADIUM_INFO, { id, username }),

    loadStadiumMap: (id) =>
        fetchAPI(ROUTES.LOAD_STADIUM_MAP, { id }),

    loadStadiums: (league, country, sortBy, username) =>
        fetchAPI(ROUTES.LOAD_STADIUMS, { league, country, sortBy, username }),

    loadUserEvents: (username, event, sort) =>
        fetchAPI(ROUTES.LOAD_USER_EVENTS, { username, event, sort }),

    searchStadiums: (name) =>
        fetchAPI(ROUTES.SEARCH_STADIUMS, { name }),
};