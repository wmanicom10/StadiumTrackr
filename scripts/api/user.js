import { API_BASE_URL, ROUTES } from '../constants.js';
import { fetchAPI, fetchFormData } from '../utils.js';

export const userAPI = {
    addStadium: (stadiumId, dateVisited, note) =>
        fetchAPI(ROUTES.ADD_STADIUM, { stadiumId, dateVisited, note }),

    loadFavoriteStadiums: () =>
        fetchAPI(ROUTES.LOAD_FAVORITE_STADIUMS),

    loadUserAchievements: (earned, sortBy) =>
        fetchAPI(ROUTES.LOAD_USER_ACHIEVEMENTS, { earned, sortBy }),

    loadUserActivity: (activity, id, sortBy, limit = 18, offset = 0) =>
        fetchAPI(ROUTES.LOAD_USER_ACTIVITY, { activity, id, sortBy, limit, offset }),

    loadUserHomeMap: () =>
        fetchAPI(ROUTES.LOAD_USER_HOME_MAP),

    loadUserInfo: () =>
        fetchAPI(ROUTES.LOAD_USER_INFO),

    loadUserStadiums: (league, country, sortBy) =>
        fetchAPI(ROUTES.LOAD_USER_STADIUMS, { league, country, sortBy }),

    loadUserVisits: (league, country, sortBy) => 
        fetchAPI(ROUTES.LOAD_USER_VISITS, { league, country, sortBy }),

    loadUserWishlist: (league, country, sortBy) =>
        fetchAPI(ROUTES.LOAD_USER_WISHLIST, { league, country, sortBy }),

    saveFavoriteStadiums: (stadiumNames) =>
        fetchAPI(ROUTES.SAVE_FAVORITE_STADIUMS, { stadiumNames }),
};