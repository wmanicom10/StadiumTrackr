import { API_BASE_URL, ROUTES } from '../constants.js';
import { fetchAPI, fetchFormData } from '../utils.js';

export const userAPI = {
    addStadium: (stadiumId, username, dateVisited, note) =>
        fetchAPI(ROUTES.ADD_STADIUM, { stadiumId, username, dateVisited, note }),

    loadFavoriteStadiums: (username) =>
        fetchAPI(ROUTES.LOAD_FAVORITE_STADIUMS, { username }),

    loadUserAchievements: (username, earned, sortBy) =>
        fetchAPI(ROUTES.LOAD_USER_ACHIEVEMENTS, { username, earned, sortBy }),

    loadUserActivity: (username, activity, id, sortBy, limit = 18, offset = 0) =>
        fetchAPI(ROUTES.LOAD_USER_ACTIVITY, { username, activity, id, sortBy, limit, offset }),

    loadUserHomeMap: (username) =>
        fetchAPI(ROUTES.LOAD_USER_HOME_MAP, { username }),

    loadUserInfo: (username) =>
        fetchAPI(ROUTES.LOAD_USER_INFO, { username }),

    loadUserStadiums: (username, league, country, sortBy) =>
        fetchAPI(ROUTES.LOAD_USER_STADIUMS, { username, league, country, sortBy }),

    loadUserVisits: (username, league, country, sortBy) => 
        fetchAPI(ROUTES.LOAD_USER_VISITS, { username, league, country, sortBy }),

    loadUserWishlist: (username, league, country, sortBy) =>
        fetchAPI(ROUTES.LOAD_USER_WISHLIST, { username, league, country, sortBy }),

    saveFavoriteStadiums: (username, stadiumNames) =>
        fetchAPI(ROUTES.SAVE_FAVORITE_STADIUMS, { username, stadiumNames }),
};