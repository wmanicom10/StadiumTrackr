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

export const stadiumAPI = {
    loadStadiumInfo: (id, username) =>
        fetchAPI(ROUTES.STADIUM_INFO, { id, username }),

    loadStadiumMap: (id) =>
        fetchAPI(ROUTES.STADIUM_MAP, { id }),

    searchStadiums: (name) =>
        fetchAPI(ROUTES.STADIUM_SEARCH, { name }),

    loadStadiums: (league, country, sortBy, username) =>
        fetchAPI(ROUTES.STADIUM_LOAD, { league, country, sortBy, username }),

    loadUserHomeMap: (username) =>
        fetchAPI(ROUTES.USER_HOME_MAP, { username })
};