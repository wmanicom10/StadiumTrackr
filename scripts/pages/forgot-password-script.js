/*  Imports  */
import { userAPI } from "../api/user.js";
import { createToast, shakeOrReplace } from "../utils.js";

/*  Events  */
window.onload = async () => {
    const pending = sessionStorage.getItem('toast');
    if (pending) {
        const { type, message } = JSON.parse(pending);
        createToast(type, message);
        sessionStorage.removeItem('toast');
    }
}

document.getElementById('forgot-password-send-button').addEventListener('click', async () => {
    const email = document.getElementById('forgot-password-email')?.value.trim() || '';
    try {
        const result = await userAPI.sendPasswordReset(email);
        sessionStorage.setItem('toast', JSON.stringify({ type: 'success', message: result.message }));
        window.location.reload();
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to send reset email. Please try again');
    }
});