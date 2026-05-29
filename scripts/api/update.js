import { API_BASE_URL, ROUTES } from '../constants.js';
import { fetchAPI, fetchFormData } from '../utils.js';

export const updateAPI = {
    deleteLog: (visitId) =>
        fetchAPI(ROUTES.DELETE_LOG, { visitId }),

    editLog: (visitId, editDateVisited, editNote) =>
        fetchAPI(ROUTES.EDIT_LOG, { visitId, editDateVisited, editNote }),

    updateEmail: (username, newEmail) =>
        fetchAPI(ROUTES.UPDATE_EMAIL, { username, newEmail }),

    updatePassword: (username, currentPassword, newPassword) => 
            fetchAPI(ROUTES.UPDATE_PASSWORD, { username, currentPassword, newPassword }),

    updateProfilePic: (formData) =>
        fetchFormData(ROUTES.UPDATE_PROFILE_PIC, formData),

    updateUsername: (username, newUsername) => 
        fetchAPI(ROUTES.UPDATE_USERNAME, { username, newUsername }),

    updateUserStadium: (stadiumId, username, isVisited) =>
        fetchAPI(ROUTES.UPDATE_USER_STADIUMS, { stadiumId, username, isVisited }),

    updateUserWishlist: (stadiumId, username, isWishlist) =>
        fetchAPI(ROUTES.UPDATE_USER_WISHLIST, { stadiumId, username, isWishlist })
};