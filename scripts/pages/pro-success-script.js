/*  Imports  */
import { isLoggedIn, shakeOrReplace } from '../utils.js';
import { userAPI } from '../api/user.js';

/*  Events  */
window.onload = async () => {
    try {
        const result = await userAPI.refreshToken();
        if (result.token) {
            localStorage.setItem('token', result.token);
        }
    } catch (err) {
        console.error(err);
        shakeOrReplace(err.message || 'Failed to refresh token.');
    }

    document.getElementById('go-home-button').href = isLoggedIn() ? 'user-home.html' : '/';
};