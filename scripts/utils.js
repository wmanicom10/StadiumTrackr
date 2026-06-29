/*  Imports  */
import { API_BASE_URL, DEBOUNCE_TIME, getHeaderElements, ROUTES, USERNAME_CONSTRAINTS, PASSWORD_CONSTRAINTS, STADIUM_IMAGE_PATH } from './constants.js';
import { loadAPI } from './api/load.js';
import { updateAPI } from './api/update.js';
import { userAPI } from './api/user.js';

/*  Variables  */
let captchaToken = null;

const currentYear = new Date().getFullYear();
const copyright = document.getElementById('copyright');
if (copyright) copyright.innerHTML = `&copy;2025-${currentYear} StadiumTrackr. All rights reserved.`;

const footerHomeLink = document.getElementById('footer-home-link');
if (footerHomeLink) {
    const token = localStorage.getItem('token');
    if (token) {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        footerHomeLink.href = payload.username ? 'user-home.html' : 'index.html';
    } else {
        footerHomeLink.href = 'index.html';
    }
}

/*  Functions  */
function closeAllDropdowns(except = null) {
    document.querySelectorAll('.custom-select-dropdown.active').forEach(d => {
        if (d !== except) {
            d.classList.remove('active');
            d.parentElement.querySelector('.custom-select-trigger').classList.remove('active');
        }
    });
}

function createCornerButton(tip, iconSrc, extraClass, onClick, href = null) {
    const btn = document.createElement(href ? 'a' : 'button');
    btn.classList.add('user-stadium-icon-btn');
    if (extraClass) btn.classList.add(extraClass);
    btn.dataset.tip = tip;

    if (href) btn.href = href;

    const img = document.createElement('img');
    img.src = iconSrc;
    img.alt = tip;
    btn.appendChild(img);

    const tooltip = document.createElement('span');
    tooltip.classList.add('icon-btn-tooltip');
    tooltip.textContent = tip;
    btn.appendChild(tooltip);

    btn.addEventListener('click', (e) => onClick(btn, e));
    return btn;
}

function createPagination(elements, stadiums, perPage = 18) {
    const pageCount = Math.ceil(stadiums.length / perPage);
    let currentPage = Math.min(getPageFromURL(), pageCount);

    function renderPage(page) {
        elements.stadiumsList.innerHTML = '';
        const start = (page - 1) * perPage;
        const end = start + perPage;
        stadiums.slice(start, end).forEach(stadium => {
            elements.stadiumsList.appendChild(createStadiumCard(stadium, elements));
        });
    }

    renderPage(currentPage);
    renderPageNumbers(elements, currentPage, pageCount);
}

function createSearchResultElement(text, isLink = false) {
    const searchResult = document.createElement('div');
    searchResult.classList.add('search-result');
    
    const stadiumName = document.createElement('h4');
    stadiumName.textContent = text;
    
    searchResult.appendChild(stadiumName);
    return searchResult;
}

function createStadiumCard(stadium, elements) {
    const card = document.createElement('div');
    card.classList.add('stadiums-list-stadium');

    const link = document.createElement('a');
    link.href = `stadium.html?id=${encodeURIComponent(stadium.stadium_id)}`;

    let img;
    if (stadium.image) {
        img = document.createElement('img');
        img.src = STADIUM_IMAGE_PATH + stadium.image;
        img.alt = stadium.stadium_name;
    } else {
        img = document.createElement('div');
        img.classList.add('img-placeholder');
        img.textContent = 'No image available';
    }


    const textDiv = document.createElement('div');
    textDiv.classList.add('stadiums-list-stadium-text');

    const name = document.createElement('h3');
    name.textContent = stadium.stadium_name;

    const location = document.createElement('h4');
    location.textContent = formatLocation(stadium.city, stadium.state);

    textDiv.appendChild(name);
    textDiv.appendChild(location);
    link.appendChild(img);
    link.appendChild(textDiv);
    card.appendChild(link);

    if (!isLoggedIn()) {
        return card;
    }

    const controls = document.createElement('div');
    controls.classList.add('user-stadium-corner-controls');

    let isVisited = stadium.visited;
    const visitedBtn = document.createElement('button');
    visitedBtn.classList.add('user-stadium-icon-btn', 'btn-visited');

    const visitedImg = document.createElement('img');
    visitedImg.src = isVisited ? 'images/icons/check.png' : 'images/icons/plus.png';
    visitedImg.alt = 'Mark as Visited';
    visitedBtn.appendChild(visitedImg);

    const visitedTooltip = document.createElement('span');
    visitedTooltip.classList.add('icon-btn-tooltip');
    visitedTooltip.textContent = isVisited ? 'Visited' : 'Mark as Visited';
    visitedBtn.appendChild(visitedTooltip);

    let isWishlist = stadium.wishlist;
    const wishlistBtn = document.createElement('button');
    wishlistBtn.classList.add('user-stadium-icon-btn', 'btn-wishlist');

    const wishlistImg = document.createElement('img');
    wishlistImg.src = isWishlist ? 'images/icons/heart-check.png' : 'images/icons/heart-plus.png';
    wishlistImg.alt = 'Add to Wishlist';
    wishlistBtn.appendChild(wishlistImg);

    const wishlistTooltip = document.createElement('span');
    wishlistTooltip.classList.add('icon-btn-tooltip');
    wishlistTooltip.textContent = isWishlist ? 'In Wishlist' : 'Add to Wishlist';
    wishlistBtn.appendChild(wishlistTooltip);

    visitedBtn.addEventListener('click', async () => {
        if (!isLoggedIn()) return;

        const newIsVisited = !isVisited;

        try {
            const result = await updateAPI.updateUserStadium(stadium.stadium_id, isVisited);

            if (result.locked) {
                shakeOrReplace('Cannot remove a stadium with logged visits. Delete your logs first.')
                return;
            }

            isVisited = newIsVisited;

            visitedBtn.classList.add('animating');
            setTimeout(() => {
                visitedImg.src = isVisited ? 'images/icons/check.png' : 'images/icons/plus.png';
                visitedTooltip.textContent = isVisited ? 'Visited' : 'Mark as Visited';

                if (isVisited && isWishlist) {
                    const currentWishlist = isWishlist;
                    isWishlist = false;
                    wishlistBtn.classList.add('animating');
                    setTimeout(() => {
                        wishlistImg.src = 'images/icons/heart-plus.png';
                        wishlistTooltip.textContent = 'Add to Wishlist';
                    }, 200);
                    setTimeout(() => wishlistBtn.classList.remove('animating'), 400);
                    updateAPI.updateUserWishlist(stadium.stadium_id, currentWishlist)
                        .catch(err => {
                            console.error(err);
                            shakeOrReplace(err.message || 'Failed to update wishlist. Please try again.')
                        });
                }
            }, 200);
            setTimeout(() => visitedBtn.classList.remove('animating'), 400);

        } catch (err) {
            console.error(err);
            shakeOrReplace(err.message || 'Failed to update visit status. Please try again.')
        }
    });

    wishlistBtn.addEventListener('click', async () => {
        if (!isLoggedIn()) return;

        const newIsWishlist = !isWishlist;
        wishlistBtn.classList.add('animating');

        setTimeout(() => {
            wishlistImg.src = newIsWishlist ? 'images/icons/heart-check.png' : 'images/icons/heart-plus.png';
            wishlistTooltip.textContent = newIsWishlist ? 'In Wishlist' : 'Add to Wishlist';
        }, 200);

        setTimeout(() => wishlistBtn.classList.remove('animating'), 400);

        try {
            await updateAPI.updateUserWishlist(stadium.stadium_id, isWishlist);
            isWishlist = newIsWishlist;
        } catch (err) {
            console.error(err);
            shakeOrReplace(err.message || 'Failed to update wishlist. Please try again.')
        }
    });

    controls.appendChild(visitedBtn);
    controls.appendChild(wishlistBtn);

    controls.appendChild(createCornerButton('Log Visit', 'images/icons/log.png', 'btn-log', (btn, e) => {
        e.preventDefault();
        setupAddStadiumModal(stadium.stadium_id, stadium.stadium_name, stadium.city, stadium.state, stadium.image, elements);
        toggleMenu(elements.addStadiumMenu, true, overlay);
    }));

    controls.appendChild(createCornerButton(
        'Show Activity',
        'images/icons/clock.png',
        'btn-activity',
        (btn, e) => {},
        `user-activity.html?id=${encodeURIComponent(stadium.stadium_id)}`
    ));

    card.appendChild(controls);

    return card;
}

function createStadiumLinkElement(stadium, searchValue) {
    const stadiumLink = document.createElement('a');
    stadiumLink.href = `stadium.html?id=${encodeURIComponent(stadium.stadium_id)}`;
    
    const searchResult = createSearchResultElement(stadium.stadium_name);
    stadiumLink.appendChild(searchResult);
    
    stadiumLink.addEventListener('click', () => {
        searchValue.value = '';
    });
    
    return stadiumLink;
}

function renderSearchSuggestions(stadiums, suggestionsContainer, searchValue) {
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.classList.add('active');

    if (stadiums.length === 0) {
        const searchResult = createSearchResultElement('No stadiums found');
        suggestionsContainer.appendChild(searchResult);
        return;
    }

    stadiums.forEach(stadium => {
        const stadiumLink = createStadiumLinkElement(stadium, searchValue);
        suggestionsContainer.appendChild(stadiumLink);
    });
}

function showNoResults(elements) {
    elements.stadiumsList.style.display = 'none';
    elements.stadiumsPageSelector.style.display = 'none';
    elements.noStadiumsContainer.style.display = 'block';
}

function showResults(elements) {
    elements.stadiumsList.style.display = 'flex';
    elements.stadiumsPageSelector.style.display = 'flex';
    elements.noStadiumsContainer.style.display = 'none';
}

/*  Exported Async Functions  */
export async function fetchAPI(endpoint, body) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
    });

    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.replace('index.html');
        throw new Error('Not authenticated');
    }

    const newToken = response.headers.get('X-New-Token');
    if (newToken) {
        localStorage.setItem('token', newToken);
    }

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || 'Unknown error');
    }
    return result;
}

export async function fetchFormData(endpoint, formData) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
    });

    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.replace('index.html');
        throw new Error('Not authenticated');
    }

    const newToken = response.headers.get('X-New-Token');
    if (newToken) {
        localStorage.setItem('token', newToken);
    }
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unknown error');
    }
    return response.json();
}

export async function initializeCreateAccountCaptcha() {
    const widget = document.getElementById('create-account-captcha');
    if (!widget) return;
    if (widget.getAttribute('data-cap-api-endpoint')) return;

    try {
        const config = await loadAPI.loadCaptchaConfig();
        widget.setAttribute('data-cap-api-endpoint', config.apiEndpoint);
        widget.addEventListener('solve', (e) => {
            captchaToken = e.detail.token;
        });
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to initialize captcha.');
    }
}

export async function searchStadiums(name, suggestionsContainer, searchValue) {
    try {
        const result = await loadAPI.searchStadiums(name);
        const stadiums = result.stadiums;

        renderSearchSuggestions(stadiums, suggestionsContainer, searchValue);

    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to search stadiums. Please try again.');
    }
}

/*  Exported Functions  */
export function calculatePageButtons(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 2) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
}


export function createElement(tag, className = null, attributes = {}) {
    const element = document.createElement(tag);
    
    if (className) {
        if (Array.isArray(className)) {
            element.classList.add(...className);
        } else {
            element.classList.add(className);
        }
    }
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'textContent' || key === 'innerHTML') {
            element[key] = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    
    return element;
}

export function createEllipsis() {
    const span = document.createElement('span');
    span.className = 'page-ellipsis';
    span.textContent = '...';
    return span;
}

export function createNavigationButton(text, disabled, onClick) {
    const btn = document.createElement('button');
    btn.className = 'page-btn arrow';
    btn.textContent = text;
    btn.disabled = disabled;
    if (!disabled) btn.addEventListener('click', onClick);
    return btn;
}

export function createPageButton(pageNum, currentPage) {
    const btn = document.createElement('button');
    btn.className = 'page-btn';
    btn.textContent = pageNum;
    btn.dataset.page = pageNum;
    if (pageNum === currentPage) btn.classList.add('active');
    btn.addEventListener('click', () => { setPageInURL(pageNum); });
    return btn;
}

export function createToast(type, message) {
    const toast = document.createElement('div');

    const toastImage = document.createElement('img');
    toastImage.classList.add('toast-image');
    if (type === "success") {
        toastImage.src = './images/icons/check.png';
        toast.classList.add('toast-success');
        const bar = document.createElement('div');
        bar.classList.add('toast-progress');
        toast.appendChild(bar);
        setTimeout(() => {
            toast.classList.remove('toast-show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 5000);
    } else if (type === "error") {
        toastImage.src = './images/icons/error.png';
        toast.classList.add('toast-error');
    }
    
    const toastMessage = document.createElement('p');
    toastMessage.classList.add('toast-message');
    toastMessage.textContent = message;

    const closeToast = document.createElement('h3');
    closeToast.classList.add('close-toast');
    closeToast.textContent = '×';
    closeToast.addEventListener('click', () => {
        toast.classList.remove('toast-show');
        toast.addEventListener('transitionend', () => toast.remove());
    });

    toast.appendChild(toastImage);
    toast.appendChild(toastMessage);
    toast.appendChild(closeToast);

    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.classList.add('toast-container');
        document.body.appendChild(container);
    }
    const existing = [...container.querySelectorAll('.toast-error, .toast-success')];
    const duplicate = existing.find(t => t.querySelector('.toast-message').textContent === message);
    if (duplicate) {
        duplicate.classList.remove('toast-shake');
        requestAnimationFrame(() => duplicate.classList.add('toast-shake'));
        duplicate.addEventListener('animationend', () => duplicate.classList.remove('toast-shake'), { once: true });
        return;
    }
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-show'));
}

export function createUserStadiumElement(stadium, elements) {
    const userStadium = document.createElement('div');
    userStadium.classList.add('user-stadium');

    const userStadiumLink = document.createElement('a');
    userStadiumLink.href = `stadium.html?id=${encodeURIComponent(stadium.stadium_id)}`;

    const userStadiumImage = document.createElement('img');
    userStadiumImage.src = STADIUM_IMAGE_PATH + stadium.image;
    userStadiumImage.alt = stadium.stadium_name;

    const userStadiumText = document.createElement('div');
    userStadiumText.classList.add('user-stadium-text');

    const userStadiumName = document.createElement('h3');
    userStadiumName.textContent = stadium.stadium_name;

    const userStadiumLocation = document.createElement('h4');
    userStadiumLocation.textContent = `${stadium.city}, ${stadium.state}`;

    userStadiumText.appendChild(userStadiumName);
    userStadiumText.appendChild(userStadiumLocation);
    userStadiumLink.appendChild(userStadiumImage);
    userStadiumLink.appendChild(userStadiumText);
    userStadium.appendChild(userStadiumLink);

    const controls = document.createElement('div');
    controls.classList.add('user-stadium-corner-controls');

    let isVisited = stadium.visited;
    const visitedBtn = document.createElement('button');
    visitedBtn.classList.add('user-stadium-icon-btn', 'btn-visited');

    const visitedImg = document.createElement('img');
    visitedImg.src = isVisited ? 'images/icons/check.png' : 'images/icons/plus.png';
    visitedImg.alt = 'Mark as Visited';
    visitedBtn.appendChild(visitedImg);

    const visitedTooltip = document.createElement('span');
    visitedTooltip.classList.add('icon-btn-tooltip');
    visitedTooltip.textContent = isVisited ? 'Visited' : 'Mark as Visited';
    visitedBtn.appendChild(visitedTooltip);

    let isWishlist = stadium.wishlist;
    const wishlistBtn = document.createElement('button');
    wishlistBtn.classList.add('user-stadium-icon-btn', 'btn-wishlist');

    const wishlistImg = document.createElement('img');
    wishlistImg.src = isWishlist ? 'images/icons/heart-check.png' : 'images/icons/heart-plus.png';
    wishlistImg.alt = 'Add to Wishlist';
    wishlistBtn.appendChild(wishlistImg);

    const wishlistTooltip = document.createElement('span');
    wishlistTooltip.classList.add('icon-btn-tooltip');
    wishlistTooltip.textContent = isWishlist ? 'In Wishlist' : 'Add to Wishlist';
    wishlistBtn.appendChild(wishlistTooltip);

    visitedBtn.addEventListener('click', async () => {
        if (!isLoggedIn()) return;

        const newIsVisited = !isVisited;

        try {
            const result = await updateAPI.updateUserStadium(stadium.stadium_id, isVisited);

            if (result.locked) {
                shakeOrReplace('Cannot remove a stadium with logged visits. Delete your logs first.');
                return;
            }

            isVisited = newIsVisited;

            visitedBtn.classList.add('animating');
            setTimeout(() => {
                visitedImg.src = isVisited ? 'images/icons/check.png' : 'images/icons/plus.png';
                visitedTooltip.textContent = isVisited ? 'Visited' : 'Mark as Visited';

                if (isVisited && isWishlist) {
                    const currentWishlist = isWishlist;
                    isWishlist = false;
                    wishlistBtn.classList.add('animating');
                    setTimeout(() => {
                        wishlistImg.src = 'images/icons/heart-plus.png';
                        wishlistTooltip.textContent = 'Add to Wishlist';
                    }, 200);
                    setTimeout(() => wishlistBtn.classList.remove('animating'), 400);
                    updateAPI.updateUserWishlist(stadium.stadium_id, currentWishlist)
                        .catch(err => {
                            console.error(err);
                            shakeOrReplace(err.message || 'Failed to update wishlist. Please try again.');
                        });
                }
            }, 200);
            setTimeout(() => visitedBtn.classList.remove('animating'), 400);

        } catch (err) {
            console.error(err);
            shakeOrReplace(err.message || 'Failed to update visit status. Please try again.');
        }
    });

    wishlistBtn.addEventListener('click', async () => {
        if (!isLoggedIn()) return;

        const newIsWishlist = !isWishlist;
        wishlistBtn.classList.add('animating');

        setTimeout(() => {
            wishlistImg.src = newIsWishlist ? 'images/icons/heart-check.png' : 'images/icons/heart-plus.png';
            wishlistTooltip.textContent = newIsWishlist ? 'In Wishlist' : 'Add to Wishlist';
        }, 200);

        setTimeout(() => wishlistBtn.classList.remove('animating'), 400);

        try {
            await updateAPI.updateUserWishlist(stadium.stadium_id, isWishlist);
            isWishlist = newIsWishlist;
        } catch (err) {
            console.error(err);
            shakeOrReplace(err.message || 'Failed to update wishlist. Please try again.');
        }
    });

    controls.appendChild(visitedBtn);
    controls.appendChild(wishlistBtn);

    controls.appendChild(createCornerButton('Log Visit', 'images/icons/log.png', 'btn-log', (btn, e) => {
        e.preventDefault();
        if (elements) {
            setupAddStadiumModal(stadium.stadium_id, stadium.stadium_name, stadium.city, stadium.state, stadium.image, elements);
            toggleMenu(elements.addStadiumMenu, true, document.getElementById('overlay'));
        }
    }));

    controls.appendChild(createCornerButton(
        'Show Activity',
        'images/icons/clock.png',
        'btn-activity',
        (btn, e) => {},
        `user-activity.html?id=${encodeURIComponent(stadium.stadium_id)}`
    ));

    userStadium.appendChild(controls);

    return userStadium;
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const STATE_MAPPING = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY',
    'ontario': 'ON', 'quebec': 'QC', 'british columbia': 'BC', 'alberta': 'AB',
    'manitoba': 'MB', 'saskatchewan': 'SK'
};

export function filterAndRank(allStadiums, query) {
    if (!query) return allStadiums;

    const lower = query.toLowerCase();
    const matchedState = Object.keys(STATE_MAPPING).find(s => s.startsWith(lower));
    const stateAbbrev = matchedState ? STATE_MAPPING[matchedState] : null;

    return allStadiums
        .filter(s => {
            const name = s.stadium_name.toLowerCase();
            const city = s.city.toLowerCase();
            const state = s.state.toLowerCase();
            const teams = (s.team_names || '').toLowerCase();
            return (
                name.includes(lower) ||
                city.includes(lower) ||
                state.includes(lower) ||
                teams.includes(lower) ||
                (stateAbbrev && s.state === stateAbbrev)
            );
        })
        .map(s => {
            const name = s.stadium_name.toLowerCase();
            const city = s.city.toLowerCase();
            const teams = (s.team_names || '').toLowerCase();
            let rank;
            if (name === lower)                          rank = 1;
            else if (city === lower)                     rank = 2;
            else if (teams.includes(lower) && teams.split(', ').some(t => t === lower)) rank = 3;
            else if (stateAbbrev && s.state === stateAbbrev) rank = 3;
            else if (name.includes(lower))               rank = 4;
            else if (city.includes(lower))               rank = 5;
            else if (teams.includes(lower))              rank = 6;
            else                                         rank = 7;
            return { ...s, rank };
        })
        .sort((a, b) => a.rank - b.rank || a.stadium_name.localeCompare(b.stadium_name));
}

export function formatDate(dateString, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

export function formatEventDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
}

export function formatEventTime(dateTime, timezone) {
    if (!dateTime) return 'Time TBD';
    
    return new Date(dateTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone
    });
}

export function formatLocation(city, state) {
    return `${city}, ${state}`;
}

export function getCaptchaToken() {
    return captchaToken;
}

export function getEventIcon(genre) {
    const icons = {
        'Football': 'images/icons/football.png',
        'Basketball': 'images/icons/basketball.png',
        'Baseball': 'images/icons/baseball.png',
        'Hockey': 'images/icons/hockey.png',
        'Soccer': 'images/icons/soccer.png'
    };
    return icons[genre] || 'images/icons/ticket.png';
}

export function getPageFromURL() {
    const params = new URLSearchParams(window.location.search);
    const page = parseInt(params.get('page'), 10);
    return page > 0 ? page : 1;
}

export function getUsername() {
    const token = localStorage.getItem('token');
    if (!token) return '';
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.username || '';
}

export function initializeCustomSelects() {
    const triggers = document.querySelectorAll('.custom-select-trigger');

    triggers.forEach(trigger => {
        const wrapper = trigger.parentElement;
        const dropdown = wrapper.querySelector('.custom-select-dropdown');
        const options = dropdown.querySelectorAll('.custom-select-option');
        const hiddenSelect = wrapper.querySelector('.filter-select');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns(dropdown);
            dropdown.classList.toggle('active');
            trigger.classList.toggle('active');
        });

        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                hiddenSelect.value = option.dataset.value;
                hiddenSelect.dispatchEvent(new Event('change'));
            });
        });
    });

    document.addEventListener('click', () => closeAllDropdowns());
}

export function isLoggedIn() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        return payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
}

export function logOut() {
    localStorage.removeItem('token');
}

export function renderPageNumbers(elements, currentPage, pageCount) {
    elements.stadiumsPageSelector.innerHTML = '';
    const prevBtn = createNavigationButton('←', currentPage === 1, () => {
        setPageInURL(currentPage - 1);
    });
    elements.stadiumsPageSelector.appendChild(prevBtn);
    calculatePageButtons(currentPage, pageCount).forEach(item => {
        elements.stadiumsPageSelector.appendChild(item === '...' ? createEllipsis() : createPageButton(item, currentPage));
    });
    const nextBtn = createNavigationButton('→', currentPage === pageCount, () => {
        setPageInURL(currentPage + 1);
    });
    elements.stadiumsPageSelector.appendChild(nextBtn);
}

export function renderWithoutTransition(elements, stadiums) {
    if (stadiums.length === 0) {
        showNoResults(elements);
    } else {
        showResults(elements);
        createPagination(elements, stadiums);
    }
}

export function renderWithTransition(elements, stadiums) {
    const list = elements.stadiumsList;
    list.style.transition = 'opacity 0.2s ease';
    list.style.opacity = '0';

    setTimeout(() => {
        if (stadiums.length === 0) {
            showNoResults(elements);
        } else {
            elements.noStadiumsContainer.style.display = 'none';
            elements.stadiumsPageSelector.style.display = 'flex';
            list.style.display = 'flex';
            list.style.opacity = '0';
            createPagination(elements, stadiums);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    list.style.opacity = '1';
                });
            });
        }
    }, 150);
}

export function setPageInURL(page) {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page);
    window.location.search = params.toString();
}

export function setupAddStadiumModal(stadiumId, stadiumName, city, state, stadiumImage, elements) {
    elements.addStadiumName.textContent = stadiumName;
    elements.addStadiumLocation.textContent = city + ', ' + state;
    elements.addStadiumImage.src = STADIUM_IMAGE_PATH + stadiumImage;

    const today = new Date().toISOString().split('T')[0];
    elements.addStadiumDateVisited.setAttribute('max', today);
    elements.addStadiumDateVisited.value = today;

    elements.addStadiumLogButton.addEventListener('click', async () => {
        const dateVisited = elements.addStadiumDateVisited.value;
        const note = elements.addStadiumNote.value.trim() || null;

        try {
            await userAPI.addStadium(stadiumId, dateVisited, note);
            sessionStorage.setItem('toast', JSON.stringify({ type: 'success', message: 'Stadium added successfully.' }));
            window.location.reload();
        } catch (error) {
            console.error(error);
            shakeOrReplace(error.message || 'Failed to add stadium. Please try again.');
        }
    });

    elements.addStadiumCancelButton.addEventListener('click', () => {
        toggleMenu(elements.addStadiumMenu, false, overlay);
    });

    elements.closeAddStadiumMenu.addEventListener('click', () => {
        toggleMenu(elements.addStadiumMenu, false, overlay);
    });
}

export function setupDeleteLogHandlers(elements, getCurrentData) {
    elements.deleteLogDeleteButton.addEventListener('click', async () => {
        let currentData = getCurrentData();
        if (!currentData) return;
        try {
            await updateAPI.deleteLog(currentData.visit_id);
            toggleMenu(elements.deleteLogMenu, false, overlay);
            window.location.reload();
            currentData = null;
        } catch (err) {
            console.error(err);
            shakeOrReplace(err.message || 'Failed to delete log. Please try again.');
        }
    });

    elements.deleteLogCancelButton.addEventListener('click', () => {
        toggleMenu(elements.deleteLogMenu, false, overlay);
    });

    elements.closeDeleteLogMenu.addEventListener('click', () => {
        toggleMenu(elements.deleteLogMenu, false, overlay);
    });
}

export function setupEditLogHandlers(elements, getCurrentData) {
    elements.editLogSaveButton.addEventListener('click', async () => {
        let currentData = getCurrentData();
        if (!currentData) return;
        try {
            await updateAPI.editLog(currentData.visit_id, elements.editLogDateVisited.value, elements.editLogNote.value);
            toggleMenu(elements.editLogMenu, false, overlay);
            window.location.reload();
            currentData = null;
        } catch (err) {
            console.error(err);
            shakeOrReplace(err.message || 'Failed to update log. Please try again.');
        }
    });

    elements.editLogCancelButton.addEventListener('click', () => {
        toggleMenu(elements.editLogMenu, false, overlay);
    });

    elements.closeEditLogMenu.addEventListener('click', () => {
        toggleMenu(elements.editLogMenu, false, overlay);
    });
}

export function setupFilterHandlers(elements) {
    const getFilters = () => ({
        league: elements.leagueFilter.value,
        country: elements.countryFilter.value,
        sort: elements.sortFilter.value
    });

    function applyFilter() {
        const { league, country, sort } = getFilters();
        const params = new URLSearchParams();
        params.set('page', '1');
        if (league !== 'all')      params.set('league', league);
        if (country !== 'all')     params.set('country', country);
        if (sort !== 'name-asc')   params.set('sort', sort);
        window.location.search = params.toString();
    }

    elements.leagueFilter.addEventListener('change', applyFilter);
    elements.countryFilter.addEventListener('change', applyFilter);
    elements.sortFilter.addEventListener('change', applyFilter);
    
    elements.clearFiltersButton.addEventListener('click', () => {
        elements.leagueFilter.value = 'all';
        elements.countryFilter.value = 'all';
        elements.sortFilter.value = 'name-asc';
        applyFilter();
    });
}

export function setupSearch(getAllStadiums, elements) {
    const searchInput = document.getElementById('home-search-field');

    const searchValue = sessionStorage.getItem('stadiumSearch');
    if (searchValue) searchInput.value = searchValue;

    searchInput.addEventListener('input', () => {
        const val = searchInput.value.trim();
        if (val) {
            sessionStorage.setItem('stadiumSearch', val);
        } else {
            sessionStorage.removeItem('stadiumSearch');
        }

        const filtered = filterAndRank(getAllStadiums(), val);

        const url = new URL(window.location.href);
        const totalPages = Math.max(1, Math.ceil(filtered.length / 18));
        const currentPage = parseInt(url.searchParams.get('page')) || 1;
        if (currentPage > totalPages) {
            url.searchParams.set('page', totalPages);
            history.replaceState(null, '', url.toString());
        }

        const plural = filtered.length === 1 ? 'stadium' : 'stadiums';
        elements.stadiumCount.textContent = `Showing ${filtered.length} ${plural}`;
        renderWithTransition(elements, filtered);
    });

    [elements.leagueFilter, elements.countryFilter, elements.sortFilter].forEach(el => {
        el.addEventListener('change', () => { 
            searchInput.value = '';
            sessionStorage.removeItem('stadiumSearch');
        });
    });

    elements.clearFiltersButton.addEventListener('click', () => { 
        searchInput.value = '';
        sessionStorage.removeItem('stadiumSearch');
    });
    document.getElementById('search-stadiums')?.addEventListener('submit', e => e.preventDefault());
}

export function setupSearchAutocomplete(formId, searchFieldId, suggestionsId) {
    const searchStadiumsForm = document.getElementById(formId);
    const searchValue = document.getElementById(searchFieldId);
    const suggestionsContainer = document.getElementById(suggestionsId);

    const debouncedSearch = debounce((name) => {
        if (name) {
            searchStadiums(name, suggestionsContainer, searchValue);
        } else {
            suggestionsContainer.classList.remove('active');
            searchValue.value = '';
        }
    }, DEBOUNCE_TIME);

    searchValue.addEventListener('input', (event) => {
        debouncedSearch(event.target.value);
    });

    document.addEventListener('click', (event) => {
        const isClickInside = searchValue.contains(event.target) || suggestionsContainer.contains(event.target);
        if (!isClickInside) {
            suggestionsContainer.classList.remove('active');
            searchValue.value = '';
        }
    });

    searchStadiumsForm?.addEventListener('submit', (e) => e.preventDefault());
}

export function shakeOrReplace(message) {
    const existing = document.querySelector('.toast-error');
    if (existing && existing.querySelector('.toast-message').textContent === message) {
        existing.classList.remove('toast-shake');
        requestAnimationFrame(() => existing.classList.add('toast-shake'));
        existing.addEventListener('animationend', () => existing.classList.remove('toast-shake'), { once: true });
    } else {
        existing?.remove();
        createToast('error', message);
    }
}

export function showLoggedInUI() {
    const { loggedInHeaderUsername, sidebarUsername } = getHeaderElements();
    const displayName = truncateUsername(getUsername());
    loggedInHeaderUsername.textContent = displayName;
    sidebarUsername.textContent = displayName;
    document.documentElement.classList.remove('logged-out');
    document.documentElement.classList.add('logged-in');
}

export function showLoggedOutUI() {
    document.documentElement.classList.remove('logged-in');
    document.documentElement.classList.add('logged-out');
}

export function syncSelectFromURL(selectId, value) {
    const hiddenSelect = document.getElementById(selectId);
    if (!hiddenSelect) return;
    hiddenSelect.value = value;

    const wrapper = hiddenSelect.closest('.custom-select-wrapper');
    if (!wrapper) return;

    const options = wrapper.querySelectorAll('.custom-select-option');
    const valueDisplay = wrapper.querySelector('.custom-select-value');

    options.forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.value === value) {
            opt.classList.add('selected');
            if (valueDisplay) valueDisplay.textContent = opt.textContent;
        }
    });
}

export function timeAgo(date) {
    const now = new Date();
    const then = new Date(date);
    const secondsAgo = Math.floor((now - then) / 1000);
    
    if (secondsAgo <= 10) {
        return 'just now';
    }
    
    if (secondsAgo < 60) {
        return `${secondsAgo}s ago`;
    }
    
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) {
        return `${minutesAgo}m ago`;
    }
    
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) {
        return `${hoursAgo}h ago`;
    }
    
    const daysAgo = Math.floor(hoursAgo / 24);
    if (daysAgo < 7) {
        return `${daysAgo}d ago`;
    }
    
    const weeksAgo = Math.floor(daysAgo / 7);
    if (daysAgo < 30) {
        return `${weeksAgo}w ago`;
    }
    
    const monthsAgo = Math.floor(daysAgo / 30);
    if (monthsAgo < 12) {
        return `${monthsAgo}mo ago`;
    }
    
    const yearsAgo = Math.floor(monthsAgo / 12);
    return `${yearsAgo}y ago`;
}

export function toggleMenu(menu, show, overlay, keepOverlay = false) {
    if (show) {
        if (!keepOverlay) {
            overlay.style.display = 'block';
            overlay.classList.remove('overlay-fade-out');
            void overlay.offsetWidth;
            overlay.classList.add('overlay-fade-in');
            document.body.style.overflow = 'hidden';
        }
        menu.style.display = 'block';
        menu.classList.remove('menu-fade-out');
        void menu.offsetWidth;
        menu.classList.add('menu-fade-in');
    } 
    else {
        document.querySelectorAll('.toast-error, .toast-success').forEach(t => t.remove());
        menu.classList.remove('menu-fade-in');
        menu.classList.add('menu-fade-out');
        if (!keepOverlay) {
            overlay.classList.remove('overlay-fade-in');
            overlay.classList.add('overlay-fade-out');
            document.body.style.overflow = 'auto';
        }
        setTimeout(() => {
            menu.style.display = 'none';
            if (!keepOverlay) {
                overlay.style.display = 'none';
            }
        }, 200);
    }
}

export function truncateUsername(username, maxLength = 10) {
    return username.length > maxLength 
        ? username.slice(0, maxLength) + '...' 
        : username;
}

export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validatePassword(password) {
    const { MIN_LENGTH, SPECIAL_CHARS } = PASSWORD_CONSTRAINTS;
    
    if (password.length < MIN_LENGTH) {
        return `Password must be at least ${MIN_LENGTH} characters long.`;
    }
    
    if (!/[A-Z]/.test(password)) {
        return 'Password must include an uppercase letter.';
    }
    
    if (!/[0-9]/.test(password)) {
        return 'Password must include a number.';
    }
    
    if (!new RegExp(`[${SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)) {
        return `Password must include a special character.`;
    }
    
    return null;
}

export function validateUsername(username) {
    const { MIN_LENGTH, MAX_LENGTH } = USERNAME_CONSTRAINTS;
    
    if (username.length < MIN_LENGTH || username.length > MAX_LENGTH) {
        return `Username must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`;
    }
    
    return null;
}