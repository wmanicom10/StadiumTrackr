import { ROUTES } from '../constants.js';
import { fetchAPI } from '../utils.js';

export const paymentAPI = {
    createCheckoutSession: (priceId) =>
        fetchAPI(ROUTES.CREATE_CHECKOUT_SESSION, { priceId }),

    createPortalSession: () =>
        fetchAPI(ROUTES.CREATE_PORTAL_SESSION)
};