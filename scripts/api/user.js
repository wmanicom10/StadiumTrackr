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

async function fetchFormData(endpoint, formData) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData
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

    loadUserActivity: (username, activity, id, sortBy, limit = 18, offset = 0) =>
        fetchAPI(ROUTES.USER_ACTIVITY, { username, activity, id, sortBy, limit, offset }),

    loadUserStadiums: (username, league, country, sortBy) =>
        fetchAPI(ROUTES.USER_STADIUMS, { username, league, country, sortBy }),

    loadUserWishlist: (username, league, country, sortBy) =>
        fetchAPI(ROUTES.USER_WISHLIST, { username, league, country, sortBy }),

    updateUsername: (username, newUsername) => 
        fetchAPI(ROUTES.USER_USERNAME, { username, newUsername }),

    updateProfilePic: (formData) =>
        fetchFormData(ROUTES.USER_PROFILE_PIC, formData),

    updateEmail: (username, newEmail) =>
        fetchAPI(ROUTES.USER_EMAIL, { username, newEmail }),

    updatePassword: (username, currentPassword, newPassword) => 
        fetchAPI(ROUTES.USER_PASSWORD, { username, currentPassword, newPassword }),

    deleteAccount: (username, password) =>
        fetchAPI(ROUTES.USER_DELETE, { username, password })
};