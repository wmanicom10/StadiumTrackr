/*  Imports  */
import { updateAPI } from "../api/update.js";
import { userAPI } from "../api/user.js";
import { shakeOrReplace, validatePassword } from "../utils.js";

/*  Events  */
document.getElementById('reset-password-button').addEventListener('click', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        shakeOrReplace('Missing or invalid token.');
        return;
    }

    const newPassword = document.getElementById('reset-password-new-password').value;
    const confirmPassword = document.getElementById('reset-password-confirm-password').value;

    const strengthError = validatePassword(newPassword);
    if (strengthError) {
        shakeOrReplace(strengthError);
        return;
    }

    if (newPassword !== confirmPassword) {
        shakeOrReplace('Passwords do not match.');
        return;
    }

    try {
        const result = await updateAPI.resetPassword(token, newPassword);
        if (result.result.affectedRows === 1) {
            sessionStorage.setItem('toast', JSON.stringify({ type: 'success', message: 'Password changed successfully.' }));
            window.location.replace('index.html');
        }
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to reset password. Please try again.');
    }
});