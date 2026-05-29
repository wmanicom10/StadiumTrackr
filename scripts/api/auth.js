import { API_BASE_URL, ROUTES } from '../constants.js';
import { fetchAPI } from '../utils.js';

export const authAPI = {
    deleteAccount: (username, password) =>
        fetchAPI(ROUTES.AUTH_DELETE, { username, password }),

    login: (username, password) =>
        fetchAPI(ROUTES.AUTH_LOGIN, { username, password }),

    signup: (email, username, password) => 
        fetchAPI(ROUTES.AUTH_SIGNUP, { email, username, password })
};