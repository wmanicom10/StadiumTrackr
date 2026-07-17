/*  Imports  */
import { DEBOUNCE_TIME, getAuthElements, MIN_LOADING_TIME, overlay, PROFILE_PIC_PATH, STADIUM_IMAGE_PATH } from "../constants.js";
import { createToast, debounce, isLoggedIn, isPro, setupSearchAutocomplete, shakeOrReplace, toggleMenu, validateEmail, validatePassword, validateUsername } from "../utils.js";
import { registerCommonEvents, registerEventListeners, registerUserLogOutEvents } from "../events.js";
import { authAPI } from "../api/auth.js";
import { loadAPI } from "../api/load.js";
import { paymentAPI } from "../api/payment.js";
import { updateAPI } from "../api/update.js";
import { userAPI } from "../api/user.js";

/*  Variables  */
const controls = [
    {
        id: 'profile',
        control: document.getElementById('profile-control'),
        image: document.getElementById('profile-control-image'),
        settings: document.getElementById('profile-settings'),
        activeSrc: '/images/icons/person.png',
        inactiveSrc: '/images/icons/person-white.png',
        activeClass: 'setting-active'
    },
    {
        id: 'account',
        control: document.getElementById('account-control'),
        image: document.getElementById('account-control-image'),
        settings: document.getElementById('account-settings'),
        activeSrc: '/images/icons/lock.png',
        inactiveSrc: '/images/icons/lock-white.png',
        activeClass: 'setting-active'
    },
    {
        id: 'delete',
        control: document.getElementById('delete-control'),
        image: document.getElementById('delete-control-image'),
        settings: document.getElementById('delete-settings'),
        activeSrc: '/images/icons/trash.png',
        inactiveSrc: '/images/icons/trash.png',
        activeClass: 'delete-active'
    }
];

let dragSrcEl = null;

const profilePicInput = document.getElementById('profile-pic-input');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');

const deleteAccountMenu = document.getElementById('delete-account-menu');
const addFavoriteStadiumMenu = document.getElementById('add-favorite-stadium-menu');

/*  Async Functions  */
async function loadFavoriteStadiums() {
    try {
        const result = await userAPI.loadFavoriteStadiums();
        const favoriteStadiums = result.favoriteStadiums;
        const favoriteStadiumsSettingContainer = document.getElementById('favorite-stadiums-settings-container')

        favoriteStadiums.forEach(stadium => {
            favoriteStadiumsSettingContainer.appendChild(createActiveSlot(stadium));
        });

        for (let i = 0; i < 4 - favoriteStadiums.length; i++) {
            favoriteStadiumsSettingContainer.appendChild(createEmptySlot());
        }
        
    } catch (error) {
        console.error(error);
    }
}

async function searchStadiums(name, suggestionsContainer, searchValue) {
    try {
        const result = await loadAPI.searchStadiums(name)
        const stadiums = result.stadiums;

        renderSearchSuggestions(stadiums, suggestionsContainer, searchValue);

    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to search stadiums. Please try again.');
    }
}

/*  Functions  */
function checkPasswordMatch() {
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const passwordMatchStatus = document.getElementById('password-match-status');

    if (!confirmPassword) {
        passwordMatchStatus.textContent = '';
        return;
    }

    if (newPassword === confirmPassword) {
        passwordMatchStatus.textContent = 'Passwords match';
        passwordMatchStatus.style.color = 'var(--color-blue)';
    } else {
        passwordMatchStatus.textContent = 'Passwords do not match';
        passwordMatchStatus.style.color = 'var(--color-danger)';
    }
}

function checkPasswordStrength() {
    const password = newPasswordInput.value;
    const passwordStrengthStatus = document.getElementById('password-strength-status');

    if (!password) {
        passwordStrengthStatus.textContent = '';
        passwordStrengthStatus.style.marginTop = '0';
        return;
    }

    passwordStrengthStatus.style.marginTop = '6px'

    const error = validatePassword(password);

    if (error) {
        passwordStrengthStatus.textContent = error;
        passwordStrengthStatus.style.color = 'var(--color-danger)';
    } else {
        passwordStrengthStatus.textContent = 'Password meets requirements';
        passwordStrengthStatus.style.color = 'var(--color-blue)';
    }
}

function createActiveSlot(stadium) {
    const favoriteStadiumsSettingActive = document.createElement('div');
    favoriteStadiumsSettingActive.classList.add('favorite-stadiums-setting-active');
    favoriteStadiumsSettingActive.draggable = true;

    const favoriteStadiumImage = document.createElement('img');
    favoriteStadiumImage.src = STADIUM_IMAGE_PATH + stadium.image;
    favoriteStadiumsSettingActive.appendChild(favoriteStadiumImage);

    const favoriteStadiumsSettingText = document.createElement('div');
    favoriteStadiumsSettingText.classList.add('favorite-stadiums-setting-text');

    const favoriteStadiumName = document.createElement('h3');
    favoriteStadiumName.textContent = stadium.stadium_name;
    favoriteStadiumsSettingText.appendChild(favoriteStadiumName);

    const favoriteStadiumLocation = document.createElement('h4');
    favoriteStadiumLocation.textContent = stadium.city + ', ' + stadium.state;
    favoriteStadiumsSettingText.appendChild(favoriteStadiumLocation);

    favoriteStadiumsSettingActive.appendChild(favoriteStadiumsSettingText);

    const cornerControls = document.createElement('div');
    cornerControls.classList.add('user-stadium-corner-controls');

    const button = document.createElement('button');
    button.classList.add('user-stadium-icon-btn');
    button.addEventListener('click', async () => {
        const container = document.getElementById('favorite-stadiums-settings-container');
        
        button.closest('.favorite-stadiums-setting-active').remove();

        const empty = createEmptySlot();
        container.appendChild(empty);
    });

    const img = document.createElement('img');
    img.src = '/images/icons/x.png';
    img.alt = 'Remove Favorite Stadium';

    button.appendChild(img);
    cornerControls.appendChild(button);
    favoriteStadiumsSettingActive.appendChild(cornerControls);

    favoriteStadiumsSettingActive.addEventListener('dragstart', handleDragStart);
    favoriteStadiumsSettingActive.addEventListener('dragover', handleDragOver);
    favoriteStadiumsSettingActive.addEventListener('drop', handleDrop);
    favoriteStadiumsSettingActive.addEventListener('dragend', handleDragEnd);
    favoriteStadiumsSettingActive.addEventListener('dragleave', handleDragLeave);

    return favoriteStadiumsSettingActive;
}

function createEmptySlot() {
    const slot = document.createElement('div');
    slot.classList.add('favorite-stadiums-setting');

    const img = document.createElement('img');
    img.src = '/images/icons/plus.png';
    img.alt = 'Add Favorite Stadium';
    slot.appendChild(img);

    slot.addEventListener('click', () => toggleMenu(addFavoriteStadiumMenu, true, overlay));
    return slot;
}

function handleDragEnd() {
    this.style.opacity = '';
    document.querySelectorAll('.favorite-stadiums-setting-active').forEach(el => {
        el.style.outline = '';
        el.style.outlineOffset = '';
    });
}

function handleDragLeave() {
    this.style.outline = '';
    this.style.outlineOffset = '';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (this.classList.contains('favorite-stadiums-setting-active') && this !== dragSrcEl) {
        this.style.outline = '2px solid var(--color-blue)';
        this.style.outlineOffset = '3px';
    }
    return false;
}

function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    this.style.opacity = '0.4';
}

function handleDrop(e) {
    e.stopPropagation();

    if (dragSrcEl !== this && this.classList.contains('favorite-stadiums-setting-active')) {
        const container = document.getElementById('favorite-stadiums-settings-container');
        const children = Array.from(container.children);
        const srcIndex = children.indexOf(dragSrcEl);
        const targetIndex = children.indexOf(this);

        if (srcIndex < targetIndex) {
            container.insertBefore(dragSrcEl, this.nextSibling);
        } else {
            container.insertBefore(dragSrcEl, this);
        }
    }

    this.style.outline = '';
    this.style.outlineOffset = '';
    return false;
}

function hideSearchSuggestions(container, input) {
    container.classList.remove('active');
    input.value = '';
}

function renderSearchSuggestions(stadiums, suggestionsContainer, searchValue) {
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.classList.add('active');

    if (stadiums.length === 0) {
        const searchResult = document.createElement('div');
        searchResult.classList.add('search-result');
        
        const stadiumName = document.createElement('h4');
        stadiumName.classList.add('no-search-result')
        stadiumName.textContent = 'No stadiums found';
        
        searchResult.appendChild(stadiumName);
        suggestionsContainer.appendChild(searchResult);
        return;
    }

    stadiums.forEach(stadium => {
        const searchResult = document.createElement('div');
        searchResult.classList.add('search-result');
        
        const stadiumName = document.createElement('h4');
        stadiumName.textContent = stadium.stadium_name;
        
        searchResult.appendChild(stadiumName);
        
        searchResult.addEventListener('click', () => {
            toggleMenu(addFavoriteStadiumMenu, false, overlay);
            document.querySelector('.favorite-stadiums-setting').replaceWith(createActiveSlot(stadium));
        });

        suggestionsContainer.appendChild(searchResult);
    });
}

function setActiveControl(activeId) {
    controls.forEach(({ id, control, image, settings, activeSrc, inactiveSrc, activeClass }) => {
        const isActive = id === activeId;
        control.classList.toggle(activeClass, isActive);
        image.src = isActive ? activeSrc : inactiveSrc;
        if (isActive) {
            settings.style.display = 'block';
            settings.style.opacity = '0';
            requestAnimationFrame(() => {
                settings.style.transition = 'opacity 0.5s ease';
                settings.style.opacity = '1';
            });
        } else {
            settings.style.transition = '';
            settings.style.opacity = '';
            settings.style.display = 'none';
        }
    });
}

function setupFavoriteSearchAutocomplete() {
    const searchStadiumsForm = document.getElementById('search-favorite-stadiums');
    const searchValue = document.getElementById('favorite-search-field');
    const suggestionsContainer = document.getElementById('favorite-autocomplete-list');

    const debouncedSearch = debounce((name) => {
        if (name) {
            searchStadiums(name, suggestionsContainer, searchValue);
        } else {
            hideSearchSuggestions(suggestionsContainer, searchValue);
        }
    }, DEBOUNCE_TIME);

    searchValue.addEventListener('input', (event) => {
        debouncedSearch(event.target.value);
    });

    document.addEventListener('click', (event) => {
        const isClickInside = searchValue.contains(event.target) || suggestionsContainer.contains(event.target);

        if (!isClickInside) {
            hideSearchSuggestions(suggestionsContainer, searchValue);
        }
    });

    searchStadiumsForm?.addEventListener('submit', (e) => e.preventDefault());
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    registerCommonEvents();
    registerEventListeners(getAuthElements());
    registerUserLogOutEvents();
    setupSearchAutocomplete('logged-in-nav-search', 'logged-in-search-field-nav', 'logged-in-nav-autocomplete-list');
    setupSearchAutocomplete('logged-in-sidebar-nav-search', 'logged-in-sidebar-search-field-nav', 'logged-in-sidebar-nav-autocomplete-list');
    setupFavoriteSearchAutocomplete('search-favorite-stadiums', 'favorite-search-field', 'favorite-autocomplete-list');
    
    controls.filter(c => c.id !== 'delete').forEach(({ control, image, activeSrc, inactiveSrc }) => {
        control.addEventListener('mouseenter', () => {
            if (!control.classList.contains('setting-active')) image.src = activeSrc;
        });
        control.addEventListener('mouseleave', () => {
            if (!control.classList.contains('setting-active')) image.src = inactiveSrc;
        });
    });

    controls.forEach(({ id, control }) => {
        control.addEventListener('click', () => setActiveControl(id));
    });

    const token = localStorage.getItem('token');
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));

    document.getElementById('current-username').textContent = 'Current: ' + (payload.username || '');
    document.getElementById('current-email').textContent = 'Current: ' + (payload.email || '');
    document.getElementById('new-profile-pic').src = PROFILE_PIC_PATH + (payload.profilePic || 'default.png');
});

document.getElementById('new-username').addEventListener('input', () => {
    const usernameStatus = document.getElementById('username-status');
    const value = document.getElementById('new-username').value;
    if (!value) {
        usernameStatus.textContent = '';
        return;
    }
    const error = validateUsername(value);
    if (error) {
        usernameStatus.textContent = error;
        usernameStatus.style.color = 'var(--color-danger)';
    } else {
        usernameStatus.textContent = 'Username meets requirements.';
        usernameStatus.style.color = 'var(--color-blue)';
    }
});

document.getElementById('username-save-button').addEventListener('click', async () => {
    const newUsername = document.getElementById('new-username').value;
    const usernameError = validateUsername(newUsername);
    if (usernameError) {
        shakeOrReplace(usernameError);
    }
    else {
        try {
            const result = await updateAPI.updateUsername(newUsername);
            if (result.token) {
                localStorage.setItem('token', result.token);
                sessionStorage.setItem('toast', JSON.stringify({ type: 'success', message: 'Username changed successfully.' }));
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
            shakeOrReplace(error.message || 'Failed to change username. Please try again.');
        }
    }
});

document.getElementById('upload-profile-pic-button').addEventListener('click', () => profilePicInput.click());

profilePicInput.addEventListener('change', () => {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
    const MAX_SIZE_MB = 2;

    const file = profilePicInput.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
        shakeOrReplace('File must be a JPG or PNG.');
        profilePicInput.value = '';
        return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        shakeOrReplace('File must be under 2MB.');
        profilePicInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('new-profile-pic').src = e.target.result;
    };
    reader.readAsDataURL(file);
});

document.getElementById('profile-pic-save-button').addEventListener('click', async () => {
    const file = profilePicInput.files[0];
    if (!file) {
        shakeOrReplace('Please choose a photo first.');
        return;
    }

    const formData = new FormData();
    formData.append('profilePic', file);

    try {
        const result = await updateAPI.updateProfilePic(formData);
        if (result.token) {
            localStorage.setItem('token', result.token);
            sessionStorage.setItem('toast', JSON.stringify({ type: 'success', message: 'Profile picture changed successfully.' }));
            window.location.reload();
        }
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to change profile pic. Please try again.');
    }
});

document.getElementById('email-save-button').addEventListener('click', async () => {
    const newEmail = document.getElementById('new-email').value;
    if (!validateEmail(newEmail)) {
        shakeOrReplace('Please enter a valid email address.');
        return;
    }
    try {
        const result = await updateAPI.updateEmail(newEmail);
        if (result.token) {
            localStorage.setItem('token', result.token);
            sessionStorage.setItem('toast', JSON.stringify({ type: 'success', message: 'Email changed successfully.' }));
            window.location.reload();
        }
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to change email. Please try again.');
    }
});

newPasswordInput.addEventListener('input', checkPasswordMatch);
confirmPasswordInput.addEventListener('input', checkPasswordMatch);

document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
        const input = document.getElementById(button.dataset.target);
        input.type = input.type === 'password' ? 'text' : 'password';
        button.textContent = input.type === 'text' ? 'Hide' : 'Show';
    });
});

newPasswordInput.addEventListener('input', () => {
    checkPasswordStrength();
    checkPasswordMatch();
});

document.getElementById('change-password-button').addEventListener('click', async () => {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!currentPassword) {
        shakeOrReplace('Please enter your current password.');
        return;
    }

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
        const result = await updateAPI.updatePassword(currentPassword, newPassword);
        if (result.result.affectedRows === 1) {
            sessionStorage.setItem('toast', JSON.stringify({ type: 'success', message: 'Password changed successfully.' }));
            window.location.reload();
        }
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to change password. Please try again.');
    }
});

document.getElementById('delete-account-button').addEventListener('click', () => {
    toggleMenu(deleteAccountMenu, true, overlay);
});

document.getElementById('close-delete-account-menu').addEventListener('click', () => {
    toggleMenu(deleteAccountMenu, false, overlay);
});

document.getElementById('delete-account-cancel-button').addEventListener('click', () => {
    toggleMenu(deleteAccountMenu, false, overlay);
});

document.getElementById('delete-account-delete-button').addEventListener('click', async () => {
    const password = document.getElementById('delete-account-password').value;

    if (!password) {
        shakeOrReplace('Please enter your password.');
        return;
    }

    try {
        const result = await authAPI.deleteAccount(password);
        if (result.result.affectedRows === 1) {
            localStorage.clear();
            sessionStorage.setItem('toast', JSON.stringify({ type: 'success', message: 'Account deleted successfully.' }));
            window.location.replace('/');
        }
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to delete your account. Please try again.')
    }
});

document.getElementById('close-add-favorite-stadium-menu').addEventListener('click', () => {
    toggleMenu(addFavoriteStadiumMenu, false, overlay)
});

document.getElementById('favorite-stadiums-save-button').addEventListener('click', async () => {
    const activeSlots = Array.from(document.querySelectorAll('.favorite-stadiums-setting-active'));
    const stadiumNames = activeSlots.map(slot => slot.querySelector('h3').textContent);

    try {
        const result = await userAPI.saveFavoriteStadiums(stadiumNames);
        
        if (result.success) {
            sessionStorage.setItem('toast', JSON.stringify({ type: 'success', message: 'Favorites saved successfully.' }));
            window.location.reload();
        }
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to save favorite stadiums. Please try again.');
    }
});

window.onload = async () => {
    try {
        const result = await userAPI.refreshToken();
        if (result.token) {
            localStorage.setItem('token', result.token);
        }
    } catch (err) {
        console.error(err);
    }
    
    if (!isLoggedIn()) {
        window.location.replace('/');
        return;
    }

    setActiveControl('profile');
    
    controls.forEach(({ control }) => {
        control.style.pointerEvents = 'none';
    });

    await Promise.all([
        loadFavoriteStadiums(),
        new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME))
    ]);

    document.getElementById('username-settings-skeleton').style.display = 'none';
    document.getElementById('profile-pic-settings-skeleton').style.display = 'none';
    document.getElementById('favorite-stadiums-settings-skeleton').style.display = 'none';
    document.getElementById('username-settings').style.display = 'block';
    document.getElementById('profile-pic-settings').style.display = 'block';
    document.getElementById('favorite-stadiums-settings').style.display = 'block';

    controls.forEach(({ control }) => {
        control.style.pointerEvents = '';
        control.style.opacity = '';
    });

    const pending = sessionStorage.getItem('toast');
    if (pending) {
        const { type, message } = JSON.parse(pending);
        createToast(type, message);
        sessionStorage.removeItem('toast');
    }
};

const token = localStorage.getItem('token');
if (token) {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.isPro) {
        document.getElementById('manage-subscription-button').style.display = 'block';
    } else {
        document.getElementById('data-settings').style.display = 'none';
    }
}

document.getElementById('manage-subscription-button').addEventListener('click', async () => {
    try {
        const result = await paymentAPI.createPortalSession();
        window.location.href = result.url;
    } catch (err) {
        console.error(err);
        shakeOrReplace(err.message || 'Failed to open subscription portal.');
    }
});

document.getElementById('download-data-button').addEventListener('click', async () => {
    try {
        const blob = await userAPI.downloadUserData();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'stadiumtrackr-data.zip';
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to download data. Please try again.');
    }
});