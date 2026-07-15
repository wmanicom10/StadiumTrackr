import { API_BASE_URL, ROUTES } from '../constants.js';
import { fetchAPI, fetchFormData } from '../utils.js';

export const updateAPI = {
    createUserList: (listName, listDescription, isRanked, stadiums) => 
        fetchAPI(ROUTES.CREATE_USER_LIST, { listName, listDescription, isRanked, stadiums }),

    deleteLog: (visitId) =>
        fetchAPI(ROUTES.DELETE_LOG, { visitId }),

    deleteTempVisitPhoto: (filename) =>
        fetchAPI(ROUTES.DELETE_TEMP_VISIT_PHOTO, { filename }),

    deleteUserList: (listId) => 
        fetchAPI(ROUTES.DELETE_USER_LIST, { listId }),

    deleteVisitPhoto: (photoId) => 
        fetchAPI(ROUTES.DELETE_VISIT_PHOTO, { photoId }),

    editLog: (visitId, editDateVisited, editNote, tempPhotos) =>
        fetchAPI(ROUTES.EDIT_LOG, { visitId, editDateVisited, editNote, tempPhotos }),

    updateEmail: (newEmail) =>
        fetchAPI(ROUTES.UPDATE_EMAIL, { newEmail }),

    updatePassword: (currentPassword, newPassword) => 
        fetchAPI(ROUTES.UPDATE_PASSWORD, { currentPassword, newPassword }),

    updateProfilePic: (formData) =>
        fetchFormData(ROUTES.UPDATE_PROFILE_PIC, formData),

    updateUserList: (listId, listName, listDescription, isRanked, stadiums) => 
        fetchAPI(ROUTES.UPDATE_USER_LIST, { listId, listName, listDescription, isRanked, stadiums }),

    updateUsername: (newUsername) => 
        fetchAPI(ROUTES.UPDATE_USERNAME, { newUsername }),

    updateUserStadium: (stadiumId, isVisited) =>
        fetchAPI(ROUTES.UPDATE_USER_STADIUMS, { stadiumId, isVisited }),

    updateUserWishlist: (stadiumId, isWishlist) =>
        fetchAPI(ROUTES.UPDATE_USER_WISHLIST, { stadiumId, isWishlist }),

    resetPassword: (token, newPassword) => 
        fetchAPI(ROUTES.RESET_PASSWORD, { token, newPassword })
};