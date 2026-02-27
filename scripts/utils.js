/*  Imports  */
import { API_BASE_URL, ROUTES, USERNAME_CONSTRAINTS, PASSWORD_CONSTRAINTS, getHeaderElements } from './constants.js';
import { activityAPI } from "./api/activity.js";

/*  Functions  */
function createSearchResultElement(text, isLink = false) {
    const searchResult = document.createElement('div');
    searchResult.classList.add('search-result');
    
    const stadiumName = document.createElement('h4');
    stadiumName.textContent = text;
    
    searchResult.appendChild(stadiumName);
    return searchResult;
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

function setupAddStadiumModal(stadiumId, stadiumName, username, stadiumImage, elements) {
    elements.addStadiumName.textContent = stadiumName;
    elements.addStadiumImage.src = stadiumImage;

    const today = new Date().toISOString().split('T')[0];
    elements.addStadiumDateVisited.setAttribute('max', today);
    elements.addStadiumDateVisited.value = today;

    elements.addStadiumLogButton.addEventListener('click', async () => {
        const dateVisited = elements.addStadiumDateVisited.value;
        const note = elements.addStadiumNote.value.trim() || null;

        try {
            await activityAPI.addStadium(stadiumId, username, dateVisited, note);
            window.location.reload();
        } catch (error) {
            alert(error.message);
        }
    });

    elements.addStadiumCancelButton.addEventListener('click', () => {
        toggleMenu(elements.addStadiumMenu, false, overlay);
    });

    elements.closeAddStadiumMenu.addEventListener('click', () => {
        toggleMenu(elements.addStadiumMenu, false, overlay);
    });
}

/*  Exported Async Functions  */
export async function searchStadiums(name, suggestionsContainer, searchValue) {
    try {
        const response = await fetch(`${API_BASE_URL}${ROUTES.STADIUM_SEARCH}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }

        const result = await response.json();
        const stadiums = result.stadiums;

        renderSearchSuggestions(stadiums, suggestionsContainer, searchValue);

    } catch (error) {
        alert(error.message);
    }
}

/*  Exported Functions  */
export function clearUsername() {
    localStorage.setItem('username', '');
}

export function closeAllDropdowns(except = null) {
    document.querySelectorAll('.custom-select-dropdown.active').forEach(d => {
        if (d !== except) {
            d.classList.remove('active');
            d.parentElement.querySelector('.custom-select-trigger').classList.remove('active');
        }
    });
}

export function createPagination(elements, stadiums, perPage = 18, scrollTop = 0) {
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

    function renderPageNumbers() {
        elements.stadiumsPageSelector.innerHTML = '';
        const prevBtn = createNavigationButton('←', currentPage === 1, () => {
            setPageInURL(currentPage - 1);
        });
        elements.stadiumsPageSelector.appendChild(prevBtn);
        calculatePageButtons(currentPage, pageCount).forEach(item => {
            elements.stadiumsPageSelector.appendChild(item === '...' ? createEllipsis() : createPageButton(item));
        });
        const nextBtn = createNavigationButton('→', currentPage === pageCount, () => {
            setPageInURL(currentPage + 1);
        });
        elements.stadiumsPageSelector.appendChild(nextBtn);
    }

    function createPageButton(pageNum) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = pageNum;
        btn.dataset.page = pageNum;
        if (pageNum === currentPage) btn.classList.add('active');
        btn.addEventListener('click', () => { setPageInURL(pageNum); });
        return btn;
    }

    function createNavigationButton(text, disabled, onClick) {
        const btn = document.createElement('button');
        btn.className = 'page-btn arrow';
        btn.textContent = text;
        btn.disabled = disabled;
        if (!disabled) btn.addEventListener('click', onClick);
        return btn;
    }

    function createEllipsis() {
        const span = document.createElement('span');
        span.className = 'page-ellipsis';
        span.textContent = '...';
        return span;
    }

    function calculatePageButtons(current, total) {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        if (current <= 3) return [1, 2, 3, 4, 5, '...', total];
        if (current >= total - 2) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
        return [1, '...', current - 1, current, current + 1, '...', total];
    }

    renderPage(currentPage);
    renderPageNumbers();
    requestAnimationFrame(() => {
        window.scrollTo({ top: scrollTop, behavior: 'smooth' });
    });
}

export function createStadiumCard(stadium, elements) {
    const card = document.createElement('div');
    card.classList.add('stadiums-list-stadium');

    const link = document.createElement('a');
    link.href = `stadium.html?id=${encodeURIComponent(stadium.stadium_id)}`;

    const img = document.createElement('img');
    img.src = stadium.image;
    img.alt = stadium.stadium_name;

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

    if (getUsername() === '') {
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
        const username = getUsername();
        if (!username) return;

        const newIsVisited = !isVisited;

        try {
            const result = await activityAPI.updateUserStadium(stadium.stadium_id, username, isVisited);

            if (result.locked) {
                alert('Cannot remove a stadium with logged visits. Delete your logs first.')
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
                    activityAPI.updateUserWishlist(stadium.stadium_id, username, currentWishlist)
                        .catch(err => alert(err.message));
                }
            }, 200);
            setTimeout(() => visitedBtn.classList.remove('animating'), 400);

        } catch (err) {
            alert(err.message);
        }
    });

    wishlistBtn.addEventListener('click', async () => {
        const username = getUsername();
        if (!username) return;

        const newIsWishlist = !isWishlist;
        wishlistBtn.classList.add('animating');

        setTimeout(() => {
            wishlistImg.src = newIsWishlist ? 'images/icons/heart-check.png' : 'images/icons/heart-plus.png';
            wishlistTooltip.textContent = newIsWishlist ? 'In Wishlist' : 'Add to Wishlist';
        }, 200);

        setTimeout(() => wishlistBtn.classList.remove('animating'), 400);

        try {
            await activityAPI.updateUserWishlist(stadium.stadium_id, username, isWishlist)
            isWishlist = newIsWishlist;
        } catch (err) {
            alert(err.message);
        }
    });

    controls.appendChild(visitedBtn);
    controls.appendChild(wishlistBtn);

    controls.appendChild(createCornerButton('Log Visit', 'images/icons/log.png', 'btn-log', (btn, e) => {
        e.preventDefault();
        setupAddStadiumModal(stadium.stadium_id, stadium.stadium_name, getUsername(), stadium.image, elements);
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

export function createUserStadiumElement(stadium, elements) {
    const userStadium = document.createElement('div');
    userStadium.classList.add('user-stadium');

    const userStadiumLink = document.createElement('a');
    userStadiumLink.href = `stadium.html?id=${encodeURIComponent(stadium.stadium_id)}`;

    const userStadiumImage = document.createElement('img');
    userStadiumImage.src = stadium.image;
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
        const username = getUsername();
        if (!username) return;

        const newIsVisited = !isVisited;

        try {
            const result = await activityAPI.updateUserStadium(stadium.stadium_id, username, isVisited);

            if (result.locked) {
                alert('Cannot remove a stadium with logged visits. Delete your logs first.');
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
                    activityAPI.updateUserWishlist(stadium.stadium_id, username, currentWishlist)
                        .catch(err => alert(err.message));
                }
            }, 200);
            setTimeout(() => visitedBtn.classList.remove('animating'), 400);

        } catch (err) {
            alert(err.message);
        }
    });

    wishlistBtn.addEventListener('click', async () => {
        const username = getUsername();
        if (!username) return;

        const newIsWishlist = !isWishlist;
        wishlistBtn.classList.add('animating');

        setTimeout(() => {
            wishlistImg.src = newIsWishlist ? 'images/icons/heart-check.png' : 'images/icons/heart-plus.png';
            wishlistTooltip.textContent = newIsWishlist ? 'In Wishlist' : 'Add to Wishlist';
        }, 200);

        setTimeout(() => wishlistBtn.classList.remove('animating'), 400);

        try {
            await activityAPI.updateUserWishlist(stadium.stadium_id, username, isWishlist);
            isWishlist = newIsWishlist;
        } catch (err) {
            alert(err.message);
        }
    });

    controls.appendChild(visitedBtn);
    controls.appendChild(wishlistBtn);

    controls.appendChild(createCornerButton('Log Visit', 'images/icons/log.png', 'btn-log', (btn, e) => {
        e.preventDefault();
        if (elements) {
            setupAddStadiumModal(stadium.stadium_id, stadium.stadium_name, getUsername(), stadium.image, elements);
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

export function filterAndRank(allStadiums, query) {
    if (!query) return allStadiums;
    const lower = query.toLowerCase();
    return allStadiums
        .filter(s => {
            const name = s.stadium_name.toLowerCase();
            const city = s.city.toLowerCase();
            const state = s.state.toLowerCase();
            return name.includes(lower) || city.includes(lower) || state.includes(lower);
        })
        .map(s => {
            const name = s.stadium_name.toLowerCase();
            const city = s.city.toLowerCase();
            let rank;
            if (name === lower)           rank = 1;
            else if (city === lower)       rank = 2;
            else if (name.includes(lower)) rank = 3;
            else if (city.includes(lower)) rank = 4;
            else                           rank = 5;
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

export function formatLocation(city, state) {
    return `${city}, ${state}`;
}

export function getPageFromURL() {
    const params = new URLSearchParams(window.location.search);
    const page = parseInt(params.get('page'), 10);
    return page > 0 ? page : 1;
}

export function getUsername() {
    return localStorage.getItem('username') || '';
}

export function hideLoading(elements) {
    elements.stadiumsSkeleton.style.display = 'none';
    elements.stadiumsListContainer.style.display = 'block';
    elements.filterBar.style.display = 'block';
}

export function initializeCustomSelects() {
    const triggers = document.querySelectorAll('.custom-select-trigger');

    triggers.forEach(trigger => {
        const wrapper = trigger.parentElement;
        const dropdown = wrapper.querySelector('.custom-select-dropdown');
        const options = dropdown.querySelectorAll('.custom-select-option');
        const valueDisplay = wrapper.querySelector('.custom-select-value');
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
    const username = getUsername();
    return username !== '' && username !== null;
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

export function resetFilters() {
    document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => {
        const firstOption = wrapper.querySelector('.custom-select-option[data-value="all"], .custom-select-option[data-value="name-asc"]');
        const valueDisplay = wrapper.querySelector('.custom-select-value');
        const hiddenSelect = wrapper.querySelector('.filter-select');
        const allOptions = wrapper.querySelectorAll('.custom-select-option');
        allOptions.forEach(opt => opt.classList.remove('selected'));
        if (firstOption) {
            firstOption.classList.add('selected');
            valueDisplay.textContent = firstOption.textContent;
            hiddenSelect.value = firstOption.dataset.value;
        }
    });
}

export function selectOption(option, allOptions, valueDisplay, hiddenSelect, dropdown, trigger) {
    allOptions.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    valueDisplay.textContent = option.textContent;
    hiddenSelect.value = option.dataset.value;
    hiddenSelect.dispatchEvent(new Event('change'));
    dropdown.classList.remove('active');
    trigger.classList.remove('active');
}

export function setPageInURL(page) {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page);
    window.location.search = params.toString();
}

export function setUsername(username) {
    localStorage.setItem('username', username);
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

    searchInput.addEventListener('input', () => {
        const filtered = filterAndRank(getAllStadiums(), searchInput.value.trim());
        const plural = filtered.length === 1 ? 'stadium' : 'stadiums';
        elements.stadiumCount.textContent = `Showing ${filtered.length} ${plural}`;
        renderWithTransition(elements, filtered);
    });

    [elements.leagueFilter, elements.countryFilter, elements.sortFilter].forEach(el => {
        el.addEventListener('change', () => { searchInput.value = ''; });
    });

    elements.clearFiltersButton.addEventListener('click', () => { searchInput.value = ''; });
    document.getElementById('search-stadiums')?.addEventListener('submit', e => e.preventDefault());
}

export function showLoading(elements) {
    elements.stadiumsSkeleton.style.display = 'block';
    void elements.stadiumsSkeleton.offsetWidth;
    elements.stadiumsListContainer.style.display = 'none';
    elements.filterBar.style.display = 'none';
}

export function showLoggedInUI(username) {
    const { loggedInHeaderUsername, sidebarUsername } = getHeaderElements();
    const displayName = truncateUsername(username);
    loggedInHeaderUsername.textContent = displayName;
    sidebarUsername.textContent = displayName;
    document.documentElement.classList.remove('logged-out');
    document.documentElement.classList.add('logged-in');
}

export function showLoggedOutUI() {
    document.documentElement.classList.remove('logged-in');
    document.documentElement.classList.add('logged-out');
}

export function showNoResults(elements) {
    elements.stadiumsList.style.display = 'none';
    elements.stadiumsPageSelector.style.display = 'none';
    elements.noStadiumsContainer.style.display = 'block';
}

export function showResults(elements) {
    elements.stadiumsList.style.display = 'flex';
    elements.stadiumsPageSelector.style.display = 'flex';
    elements.noStadiumsContainer.style.display = 'none';
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

export function timeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    
    if (isNaN(past.getTime())) {
        return 'unknown';
    }
    
    const diffMs = now - past;
    
    if (diffMs < 0) return 'just now';
    
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    const weeks = Math.floor(diffMs / 604800000);
    const months = Math.floor(diffMs / 2592000000);
    const years = Math.floor(diffMs / 31536000000);
    
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (weeks < 4) return `${weeks}w ago`;
    if (months < 12) return `${months}mo ago`;
    return `${years}y ago`;
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
        return `Password must include a special character (${SPECIAL_CHARS}).`;
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