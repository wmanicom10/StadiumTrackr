import { API_BASE_URL, ROUTES } from '../constants.js';
import { fetchAPI, fetchBlob, fetchFormData } from '../utils.js';

export const userAPI = {
    addStadium: (stadiumId, dateVisited, note, tempPhotos) =>
        fetchAPI(ROUTES.ADD_STADIUM, { stadiumId, dateVisited, note, tempPhotos }),

    downloadUserData: () =>
        fetchBlob(ROUTES.DOWNLOAD_USER_DATA),

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

    loadUserList: (listId, slug, show, league, country, sortBy) =>
        fetchAPI(ROUTES.LOAD_USER_LIST, { listId, slug, show, league, country, sortBy }),

    loadUserLists: (sortBy, limit = 18, offset = 0) =>
        fetchAPI(ROUTES.LOAD_USER_LISTS, { sortBy, limit, offset }),

    loadUserStadiums: (league, country, sortBy) =>
        fetchAPI(ROUTES.LOAD_USER_STADIUMS, { league, country, sortBy }),

    loadUserStats: () => 
        fetchAPI(ROUTES.LOAD_USER_STATS),

    loadUserVisits: (league, country, sortBy) => 
        fetchAPI(ROUTES.LOAD_USER_VISITS, { league, country, sortBy }),

    loadUserWishlist: (league, country, sortBy) =>
        fetchAPI(ROUTES.LOAD_USER_WISHLIST, { league, country, sortBy }),

    refreshToken: () => 
        fetchAPI(ROUTES.REFRESH_TOKEN),

    saveFavoriteStadiums: (stadiumNames) =>
        fetchAPI(ROUTES.SAVE_FAVORITE_STADIUMS, { stadiumNames }),

    sendPasswordReset: (email) =>
        fetchAPI(ROUTES.SEND_PASSWORD_RESET, { email }),

    uploadTempVisitPhoto: (formData) =>
        fetchFormData(ROUTES.UPLOAD_TEMP_VISIT_PHOTO, formData)
};