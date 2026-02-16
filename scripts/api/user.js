import { API_BASE_URL, ROUTES } from '../constants.js';

async function fetchAPI(endpoint, body) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unknown error');
    }

    return response.json();
}

export const userAPI = {
    loadUserInfo: (username) =>
        fetchAPI(ROUTES.USER_INFO, { username }),

    loadUserAchievements: (username, earned, sortBy) =>
        fetchAPI(ROUTES.USER_ACHIEVEMENTS, { username, earned, sortBy }),

    loadUserActivity: (username, activity, stadium, sortBy) =>
        fetchAPI(ROUTES.USER_ACTIVITY, { username, activity, stadium, sortBy }),

    loadUserStadiums: (username, league, country, sortBy) =>
        fetchAPI(ROUTES.USER_STADIUMS, { username, league, country, sortBy }),

    loadUserWishlist: (username, league, country, sortBy) =>
        fetchAPI(ROUTES.USER_WISHLIST, { username, league, country, sortBy })
};