import { API_BASE_URL, ROUTES } from '../constants.js';

async function fetchAPI(endpoint, body) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Unknown error');
    }

    return result;
}

export const authAPI = {
    signup: async (email, username, password) => {
        return fetchAPI(ROUTES.AUTH_SIGNUP, { email, username, password });
    },

    login: async (username, password) => {
        return fetchAPI(ROUTES.AUTH_LOGIN, { username, password });
    }
};