import { API_BASE_URL, ROUTES } from '../constants.js';
import { fetchAPI, fetchFormData } from '../utils.js';

export const updateAPI = {
    deleteLog: (visitId) =>
        fetchAPI(ROUTES.DELETE_LOG, { visitId }),

    editLog: (visitId, editDateVisited, editNote) =>
        fetchAPI(ROUTES.EDIT_LOG, { visitId, editDateVisited, editNote }),

    updateEmail: (newEmail) =>
        fetchAPI(ROUTES.UPDATE_EMAIL, { newEmail }),

    updatePassword: (currentPassword, newPassword) => 
        fetchAPI(ROUTES.UPDATE_PASSWORD, { currentPassword, newPassword }),

    updateProfilePic: (formData) =>
        fetchFormData(ROUTES.UPDATE_PROFILE_PIC, formData),

    updateUsername: (newUsername) => 
        fetchAPI(ROUTES.UPDATE_USERNAME, { newUsername }),

    updateUserStadium: (stadiumId, isVisited) =>
        fetchAPI(ROUTES.UPDATE_USER_STADIUMS, { stadiumId, isVisited }),

    updateUserWishlist: (stadiumId, isWishlist) =>
        fetchAPI(ROUTES.UPDATE_USER_WISHLIST, { stadiumId, isWishlist }),

    resetPassword: (token, newPassword) => 
        fetchAPI(ROUTES.RESET_PASSWORD, { token, newPassword })
};