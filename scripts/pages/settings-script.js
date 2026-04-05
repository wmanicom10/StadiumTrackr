/*  Imports  */
import { API_BASE_URL, ROUTES, DEBOUNCE_TIME, MIN_LOADING_TIME, overlay } from "../constants.js";
import { debounce, getUsername, toggleMenu, validateEmail, validatePassword, validateUsername } from "../utils.js";
import { registerCommonEvents, registerUserLogOutEvents } from "../events.js";
import { userAPI } from "../api/user.js";

/*  Variables  */
const controls = [
    {
        id: 'profile',
        control: document.getElementById('profile-control'),
        image: document.getElementById('profile-control-image'),
        settings: document.getElementById('profile-settings'),
        activeSrc: 'images/icons/person.png',
        inactiveSrc: 'images/icons/person-white.png',
        activeClass: 'setting-active'
    },
    {
        id: 'account',
        control: document.getElementById('account-control'),
        image: document.getElementById('account-control-image'),
        settings: document.getElementById('account-settings'),
        activeSrc: 'images/icons/lock.png',
        inactiveSrc: 'images/icons/lock-white.png',
        activeClass: 'setting-active'
    },
    {
        id: 'delete',
        control: document.getElementById('delete-control'),
        image: document.getElementById('delete-control-image'),
        settings: document.getElementById('delete-settings'),
        activeSrc: 'images/icons/trash.png',
        inactiveSrc: 'images/icons/trash.png',
        activeClass: 'delete-active'
    }
];
const currentUsername = document.getElementById('current-username');
const usernameSaveButton = document.getElementById('username-save-button');
const usernameStatus = document.getElementById('username-status');

const currentProfilePic = document.getElementById('new-profile-pic');
const choosePhotoButton = document.getElementById('upload-profile-pic-button');
const profilePicInput = document.getElementById('profile-pic-input');
const profilePicSaveButton = document.getElementById('profile-pic-save-button');

const currentEmail = document.getElementById('current-email');
const emailSaveButton = document.getElementById('email-save-button');

const passwordSaveButton = document.getElementById('change-password-button');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const passwordMatchStatus = document.getElementById('password-match-status');
const passwordStrengthStatus = document.getElementById('password-strength-status');

const deleteAccountButton = document.getElementById('delete-account-button');
const deleteAccountMenu = document.getElementById('delete-account-menu');
const closeDeleteAccountMenu = document.getElementById('close-delete-account-menu');
const deleteAccountCancelButton = document.getElementById('delete-account-cancel-button');
const deleteAccountDeleteButton = document.getElementById('delete-account-delete-button');

const addFavoriteStadiumMenu = document.getElementById('add-favorite-stadium-menu');
const closeAddFavoriteStadiumMenu = document.getElementById('close-add-favorite-stadium-menu');
const favoriteStadiumsSettingContainer = document.getElementById('favorite-stadiums-settings-container')

const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_SIZE_MB = 2;

/*  Async Functions  */
async function loadFavoriteStadiums(username) {
    try {
        const response = await fetch(`${API_BASE_URL}${ROUTES.USER_FAVORITES}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }

        const result = await response.json();
        const favoriteStadiums = result.favoriteStadiums;

        favoriteStadiums.forEach(stadium => {
            console.log(stadium)

            favoriteStadiumsSettingContainer.appendChild(createActiveSlot(stadium));
        });

        for (let i = 0; i < 4 - favoriteStadiums.length; i++) {
            favoriteStadiumsSettingContainer.appendChild(createEmptySlot());
        }
        
    } catch (error) {
        alert(error.message);
    }
}

async function searchStadiums(name, suggestionsContainer, searchValue) {
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

/*  Functions  */
function attachRemoveListener(button) {
    button.addEventListener('click', async () => {
        const container = document.getElementById('favorite-stadiums-settings-container');
        
        button.closest('.favorite-stadiums-setting-active').remove();

        const empty = createEmptySlot();
        container.appendChild(empty);
    });
}

function checkPasswordMatch() {
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

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

    const favoriteStadiumImage = document.createElement('img');
    favoriteStadiumImage.src = stadium.image;
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
    attachRemoveListener(button);

    const img = document.createElement('img');
    img.src = 'images/icons/x.png';
    img.alt = 'Remove Favorite Stadium';

    button.appendChild(img);
    cornerControls.appendChild(button);
    favoriteStadiumsSettingActive.appendChild(cornerControls);

    return favoriteStadiumsSettingActive;
}

function createEmptySlot() {
    const slot = document.createElement('div');
    slot.classList.add('favorite-stadiums-setting');

    const img = document.createElement('img');
    img.src = 'images/icons/plus.png';
    img.alt = 'Add Favorite Stadium';
    slot.appendChild(img);

    slot.addEventListener('click', () => toggleMenu(addFavoriteStadiumMenu, true, overlay));
    return slot;
}

function hideSearchSuggestions(container, input) {
    container.classList.remove('active');
    input.value = '';
    input.style.borderBottomLeftRadius = '35px';
    input.style.borderBottomRightRadius = '35px';
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

function setupSearchAutocomplete() {
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
    registerUserLogOutEvents();
    setupSearchAutocomplete();

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

    currentUsername.textContent = 'Current: ' + getUsername();
    currentEmail.textContent = 'Current: ' + (localStorage.getItem('email') || '');
    currentProfilePic.src = localStorage.getItem('profilePic') || 'images/icons/person-circle.png';

});

document.getElementById('new-username').addEventListener('input', () => {
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

usernameSaveButton.addEventListener('click', async () => {
    const newUsername = document.getElementById('new-username').value;
    const usernameError = validateUsername(newUsername);
    if (usernameError) {
        alert(usernameError);
    }
    else {
        try {
            const result = await userAPI.updateUsername(getUsername(), newUsername);

            if (result.result.affectedRows === 1) {
                localStorage.setItem('username', newUsername);
                alert('Username changed successfully.');
                window.location.reload();
            }
        } catch (error) {
            alert(error.message);
        }
    }
});

choosePhotoButton.addEventListener('click', () => profilePicInput.click());

profilePicInput.addEventListener('change', () => {
    const file = profilePicInput.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
        alert('File must be a JPG or PNG.');
        profilePicInput.value = '';
        return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert('File must be under 2MB.');
        profilePicInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('new-profile-pic').src = e.target.result;
    };
    reader.readAsDataURL(file);
});

profilePicSaveButton.addEventListener('click', async () => {
    const file = profilePicInput.files[0];
    if (!file) {
        alert('Please choose a photo first.');
        return;
    }

    const formData = new FormData();
    formData.append('profilePic', file);
    formData.append('username', getUsername());

    try {
        const result = await userAPI.updateProfilePic(formData);
        localStorage.setItem('profilePic', result.profile_pic);
        alert('Profile picture updated successfully.');
        window.location.reload();
    } catch (error) {
        alert(error.message);
    }
});

emailSaveButton.addEventListener('click', async () => {
    const newEmail = document.getElementById('new-email').value;
    if (!validateEmail(newEmail)) {
        alert('Please enter a valid email address.');
        return;
    }
    try {
        const result = await userAPI.updateEmail(getUsername(), newEmail);
        if (result.result.affectedRows === 1) {
            localStorage.setItem('email', newEmail);
            alert('Email changed successfully.');
            window.location.reload();
        }
    } catch (error) {
        alert(error.message);
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

passwordSaveButton.addEventListener('click', async () => {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!currentPassword) {
        alert('Please enter your current password.');
        return;
    }

    const strengthError = validatePassword(newPassword);
    if (strengthError) {
        alert(strengthError);
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    try {
        const result = await userAPI.updatePassword(getUsername(), currentPassword, newPassword);
        if (result.result.affectedRows === 1) {
            alert('Password changed successfully.');
            window.location.reload();
        }
    } catch (error) {
        alert(error.message);
    }
});

deleteAccountButton.addEventListener('click', () => {
    toggleMenu(deleteAccountMenu, true, overlay);
});

closeDeleteAccountMenu.addEventListener('click', () => {
    toggleMenu(deleteAccountMenu, false, overlay);
});

deleteAccountCancelButton.addEventListener('click', () => {
    toggleMenu(deleteAccountMenu, false, overlay);
});

deleteAccountDeleteButton.addEventListener('click', async () => {
    const password = document.getElementById('delete-account-password').value;

    if (!password) {
        alert('Please enter your password.');
        return;
    }

    try {
        const result = await userAPI.deleteAccount(getUsername(), password);
        if (result.result.affectedRows === 1) {
            localStorage.clear();
            alert('Account deleted successfully.');
            window.location.replace('index.html');
        }
    } catch (error) {
        alert(error.message);
    }
});

closeAddFavoriteStadiumMenu.addEventListener('click', () => {
    toggleMenu(addFavoriteStadiumMenu, false, overlay)
});

document.getElementById('favorite-stadiums-save-button').addEventListener('click', async () => {
    const username = getUsername();
    const activeSlots = Array.from(document.querySelectorAll('.favorite-stadiums-setting-active'));
    const stadiumNames = activeSlots.map(slot => slot.querySelector('h3').textContent);

    try {
        const response = await fetch(`${API_BASE_URL}${ROUTES.USER_SAVE_FAVORITES}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, stadiumNames })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }

        const result = await response.json();
        if (result.success) {
            alert('Favorites saved successfully.');
            window.location.reload();
        }
    } catch (error) {
        alert(error.message);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (addFavoriteStadiumMenu.style.display !== 'none') {
            toggleMenu(addFavoriteStadiumMenu, false, overlay);
        }
    }
});

window.onload = async () => {
    setActiveControl('profile');
    
    controls.forEach(({ control }) => {
        control.style.pointerEvents = 'none';
    });

    await Promise.all([
        loadFavoriteStadiums(getUsername()),
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
};