import { API_BASE_URL } from '../constants.js';

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

export const activityAPI = {
    updateUserStadium: (stadiumId, username, isVisited) =>
        fetchAPI('/activity/updateUserStadium', { stadiumId, username, isVisited }),

    updateUserWishlist: (stadiumId, username, isWishlist) =>
        fetchAPI('/activity/updateUserWishlist', { stadiumId, username, isWishlist }),

    addStadium: (stadiumId, username, dateVisited, note) =>
        fetchAPI('/activity/addStadium', { stadiumId, username, dateVisited, note }),

    editLog: (visitId, editDateVisited, editNote) =>
        fetchAPI('/activity/editLog', { visitId, editDateVisited, editNote }),

    deleteLog: (visitId) =>
        fetchAPI('/activity/deleteLog', { visitId }),

    removeActivityWishlist: (stadiumId, username) =>
        fetchAPI('/activity/removeActivityWishlist', { stadiumId, username }),

    removeActivityVisited: (stadiumId, username) =>
        fetchAPI('/activity/removeActivityVisited', { stadiumId, username })
};