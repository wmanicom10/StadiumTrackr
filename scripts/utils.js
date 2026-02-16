// utils.js

import { API_BASE_URL, ROUTES, USERNAME_CONSTRAINTS, PASSWORD_CONSTRAINTS } from './constants.js';

// ============================================
// Menu/Modal Management
// ============================================

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

// ============================================
// Validation Functions
// ============================================

export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validateUsername(username) {
    const { MIN_LENGTH, MAX_LENGTH } = USERNAME_CONSTRAINTS;
    
    if (username.length < MIN_LENGTH || username.length > MAX_LENGTH) {
        return `Username must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`;
    }
    
    return null; // No error
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
    
    return null; // No error
}

// ============================================
// Stadium Search & Autocomplete
// ============================================

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

function renderSearchSuggestions(stadiums, suggestionsContainer, searchValue) {
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.style.display = 'block';
    suggestionsContainer.style.paddingLeft = '11px';
    suggestionsContainer.style.paddingBottom = '1px';

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
    stadiumLink.href = `stadium.html?stadium=${encodeURIComponent(stadium.stadium_name)}`;
    
    const searchResult = createSearchResultElement(stadium.stadium_name);
    stadiumLink.appendChild(searchResult);
    
    stadiumLink.addEventListener('click', () => {
        searchValue.value = '';
    });
    
    return stadiumLink;
}

// ============================================
// Stadium Element Creation
// ============================================

export function createUserStadiumElement(stadium) {
    const userStadium = document.createElement('div');
    userStadium.classList.add('user-stadium');

    const userStadiumLink = document.createElement('a');
    userStadiumLink.href = `stadium.html?stadium=${encodeURIComponent(stadium.stadium_name)}`;

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

    return userStadium;
}

// ============================================
// DOM Utilities
// ============================================

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

// ============================================
// Debounce Utility
// ============================================

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

// ============================================
// String Utilities
// ============================================

export function truncateUsername(username, maxLength = 10) {
    return username.length > maxLength 
        ? username.slice(0, maxLength) + '...' 
        : username;
}

export function formatLocation(city, state) {
    return `${city}, ${state}`;
}

// ============================================
// Date Utilities
// ============================================

export function formatDate(dateString, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
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

// ============================================
// Local Storage Utilities
// ============================================

export function getUsername() {
    return localStorage.getItem('username') || '';
}

export function setUsername(username) {
    localStorage.setItem('username', username);
}

export function clearUsername() {
    localStorage.setItem('username', '');
}

export function isLoggedIn() {
    const username = getUsername();
    return username !== '' && username !== null;
}