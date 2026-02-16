import { getHeaderElements, MIN_LOADING_TIME, overlay } from "../constants.js";
import { toggleMenu, getUsername, truncateUsername, formatDate, formatLocation, timeAgo, clearUsername } from "../utils.js";
import { registerCommonEvents } from "../events.js";
import { userAPI } from "../api/user.js";
import { activityAPI } from "../api/activity.js";

const elements = {
    editLogMenu: document.getElementById('edit-log-menu'),
    closeEditLogMenu: document.getElementById('close-edit-log-menu'),
    editLogSaveButton: document.getElementById('edit-log-save-button'),
    editLogCancelButton: document.getElementById('edit-log-cancel-button'),
    editLogName: document.getElementById('edit-log-name'),
    editLogImage: document.getElementById('edit-log-image'),
    editLogDateVisited: document.getElementById('edit-log-date-visited'),
    editLogNote: document.getElementById('edit-log-note'),
    deleteLogMenu: document.getElementById('delete-log-menu'),
    closeDeleteLogMenu: document.getElementById('close-delete-log-menu'),
    deleteLogCancelButton: document.getElementById('delete-log-cancel-button'),
    deleteLogDeleteButton: document.getElementById('delete-log-delete-button'),
    activityWelcomeText: document.getElementById('user-activity-welcome-text'),
    activityListContainer: document.getElementById('activity-list-container'),
    activityList: document.getElementById('activity-list'),
    noActivityContainer: document.getElementById('no-activity-container'),
    activitySkeleton: document.getElementById('activity-skeleton'),
    activityFilterBar: document.getElementById('activity-filter-bar'),
    activityFilter: document.getElementById('activity-filter'),
    sortFilter: document.getElementById('sort-filter')
};

let currentData = null;

function showLoggedInUI(username) {
    const { loggedInHeader, loggedInHeaderUsername, sidebarUsername } = getHeaderElements();
    
    const displayName = truncateUsername(username);
    loggedInHeaderUsername.textContent = displayName;
    sidebarUsername.textContent = displayName;
    loggedInHeader.style.display = 'flex';
}

function showLoading() {
    elements.activitySkeleton.style.display = 'block';
    elements.activityListContainer.style.display = 'none';
    elements.activityFilterBar.style.display = 'none';
}

function hideLoading() {
    elements.activitySkeleton.style.display = 'none';
    elements.activityListContainer.style.display = 'block';
    elements.activityFilterBar.style.display = 'block';
}

function showNoResults() {
    elements.noActivityContainer.style.display = 'block';
    elements.activityList.style.display = 'none';
}

function showResults() {
    elements.noActivityContainer.style.display = 'none';
    elements.activityList.style.display = 'block';
}

function createActivityItem(activity, username) {
    const item = document.createElement('div');
    item.classList.add('activity-item');

    const img = document.createElement('img');
    img.src = activity.image;
    img.alt = activity.stadium_name;
    img.classList.add(activity.visited_on ? 'activity-log-image' : 'activity-image');
    item.appendChild(img);

    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('activity-details-container');

    const header = createActivityHeader(activity);
    detailsContainer.appendChild(header);

    const location = document.createElement('h4');
    location.classList.add('activity-details-location');
    location.textContent = formatLocation(activity.city, activity.state);
    detailsContainer.appendChild(location);

    if (activity.visited_on) {
        detailsContainer.appendChild(createLogDetails(activity));
    } else {
        detailsContainer.appendChild(createSimpleActivityDetails(activity));
    }

    const buttons = createActivityButtons(activity, username);
    detailsContainer.appendChild(buttons);

    item.appendChild(detailsContainer);
    return item;
}

function createActivityHeader(activity) {
    const header = document.createElement('div');
    header.classList.add('activity-details-header');

    const nameLink = document.createElement('a');
    nameLink.classList.add('activity-details-name');
    nameLink.textContent = activity.stadium_name;
    nameLink.href = `stadium.html?stadium=${encodeURIComponent(activity.stadium_name)}`;

    const time = document.createElement('span');
    time.classList.add('activity-details-time');
    time.textContent = timeAgo(activity.added_on);

    header.appendChild(nameLink);
    header.appendChild(time);
    return header;
}

function createLogDetails(activity) {
    const details = document.createElement('div');
    details.classList.add('activity-log-details');

    const dateLabel = document.createElement('h4');
    dateLabel.textContent = 'DATE VISITED';
    details.appendChild(dateLabel);

    const dateValue = document.createElement('span');
    dateValue.textContent = formatDate(activity.visited_on);
    details.appendChild(dateValue);

    const noteLabel = document.createElement('h4');
    noteLabel.textContent = 'NOTE';
    details.appendChild(noteLabel);

    const noteValue = document.createElement('span');
    noteValue.textContent = activity.user_note || 'No note';
    if (!activity.user_note) {
        noteValue.classList.add('no-note');
    }
    details.appendChild(noteValue);

    return details;
}

function createSimpleActivityDetails(activity) {
    const details = document.createElement('div');
    details.classList.add('activity-details');

    const text = document.createElement('h4');
    text.textContent = activity.activity_type === 'wishlist' ? 'ADDED TO WISHLIST' : 'MARKED AS VISITED';
    details.appendChild(text);

    return details;
}

function createActivityButtons(activity, username) {
    const buttons = document.createElement('div');
    buttons.classList.add('activity-buttons');

    if (activity.visited_on) {
        buttons.appendChild(createEditButton(activity, username));
        buttons.appendChild(createDeleteButton(activity, username));
    } else {
        buttons.appendChild(createRemoveButton(activity, username));
    }

    return buttons;
}

function createEditButton(activity, username) {
    const btn = document.createElement('button');
    btn.classList.add('edit-log-button');
    btn.textContent = 'Edit Log';

    btn.addEventListener('click', () => {
        currentData = {
            visit_id: activity.visit_id,
            username: username
        };

        elements.editLogName.textContent = activity.stadium_name;
        elements.editLogImage.src = activity.image;
        elements.editLogDateVisited.value = activity.visited_on.split('T')[0];
        elements.editLogDateVisited.setAttribute('max', new Date().toISOString().split('T')[0]);
        elements.editLogNote.value = activity.user_note || '';

        toggleMenu(elements.editLogMenu, true, overlay);
    });

    return btn;
}

function createDeleteButton(activity, username) {
    const btn = document.createElement('button');
    btn.classList.add('delete-log-button');
    btn.textContent = 'Delete Log';

    btn.addEventListener('click', () => {
        currentData = {
            visit_id: activity.visit_id,
            username: username
        };

        toggleMenu(elements.deleteLogMenu, true, overlay);
    });

    return btn;
}

function createRemoveButton(activity, username) {
    const btn = document.createElement('button');
    btn.classList.add('remove-button');
    btn.textContent = 'Remove';

    btn.addEventListener('click', async () => {
        try {
            if (activity.activity_type === 'wishlist') {
                await activityAPI.removeActivityWishlist(activity.stadium_id, username);
            } else {
                await activityAPI.removeActivityVisited(activity.stadium_id, username);
            }

            const urlParams = new URLSearchParams(window.location.search);
            const stadium = urlParams.get('stadium');
            const activityFilter = elements.activityFilter.value;
            const sort = elements.sortFilter.value;
            setView(username, activityFilter, stadium, sort);
        } catch (error) {
            alert(error.message);
        }
    });

    return btn;
}

async function setView(username, activity, stadium, sortBy) {
    try {
        showLoading();

        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));

        const result = await userAPI.loadUserActivity(username, activity, stadium, sortBy);
        const activities = result.userActivity;

        if (activities.length === 0) {
            showNoResults();
        } else {
            showResults();
            renderActivities(activities, username);
        }

        hideLoading();
    } catch (err) {
        alert(err.message);
        hideLoading();
    }
}

function renderActivities(activities, username) {
    elements.activityList.innerHTML = '';

    activities.forEach(activity => {
        const item = createActivityItem(activity, username);
        elements.activityList.appendChild(item);
    });
}

function setupEditLogHandlers() {
    elements.editLogSaveButton.addEventListener('click', async () => {
        if (!currentData) {
            console.error('No edit data available');
            return;
        }

        try {
            const editDateVisited = elements.editLogDateVisited.value;
            const editNote = elements.editLogNote.value;

            await activityAPI.editLog(currentData.visit_id, editDateVisited, editNote);

            toggleMenu(elements.editLogMenu, false, overlay);

            const urlParams = new URLSearchParams(window.location.search);
            const stadium = urlParams.get('stadium');
            const activityFilter = elements.activityFilter.value;
            const sort = elements.sortFilter.value;
            await setView(currentData.username, activityFilter, stadium, sort);

            currentData = null;
        } catch (err) {
            alert(err.message);
        }
    });

    elements.editLogCancelButton.addEventListener('click', () => {
        toggleMenu(elements.editLogMenu, false, overlay);
        currentData = null;
    });

    elements.closeEditLogMenu.addEventListener('click', () => {
        toggleMenu(elements.editLogMenu, false, overlay);
        currentData = null;
    });
}

function setupDeleteLogHandlers() {
    elements.deleteLogDeleteButton.addEventListener('click', async () => {
        if (!currentData) {
            console.error('No delete data available');
            return;
        }

        try {
            await activityAPI.deleteLog(currentData.visit_id);

            toggleMenu(elements.deleteLogMenu, false, overlay);

            const urlParams = new URLSearchParams(window.location.search);
            const stadium = urlParams.get('stadium');
            const activityFilter = elements.activityFilter.value;
            const sort = elements.sortFilter.value;
            await setView(currentData.username, activityFilter, stadium, sort);

            currentData = null;
        } catch (err) {
            alert(err.message);
        }
    });

    elements.deleteLogCancelButton.addEventListener('click', () => {
        toggleMenu(elements.deleteLogMenu, false, overlay);
    });

    elements.closeDeleteLogMenu.addEventListener('click', () => {
        toggleMenu(elements.deleteLogMenu, false, overlay);
    });
}

function initializeCustomSelects() {
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
                selectOption(option, options, valueDisplay, hiddenSelect, dropdown, trigger);
            });
        });
    });

    document.addEventListener('click', () => closeAllDropdowns());
}

function closeAllDropdowns(except = null) {
    document.querySelectorAll('.custom-select-dropdown.active').forEach(d => {
        if (d !== except) {
            d.classList.remove('active');
            d.parentElement.querySelector('.custom-select-trigger').classList.remove('active');
        }
    });
}

function selectOption(option, allOptions, valueDisplay, hiddenSelect, dropdown, trigger) {
    allOptions.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    valueDisplay.textContent = option.textContent;
    hiddenSelect.value = option.dataset.value;
    hiddenSelect.dispatchEvent(new Event('change'));
    dropdown.classList.remove('active');
    trigger.classList.remove('active');
}

function setupFilterHandlers() {
    const username = getUsername();
    const urlParams = new URLSearchParams(window.location.search);
    const stadium = urlParams.get('stadium');

    const getFilters = () => ({
        activity: elements.activityFilter.value,
        sort: elements.sortFilter.value
    });

    elements.activityFilter.addEventListener('change', () => {
        const { activity, sort } = getFilters();
        setView(username, activity, stadium, sort);
    });

    elements.sortFilter.addEventListener('change', () => {
        const { activity, sort } = getFilters();
        setView(username, activity, stadium, sort);
    });
}

function setupEscapeKeyHandler() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elements.editLogMenu.style.display !== 'none') {
                toggleMenu(elements.editLogMenu, false, overlay);
                currentData = null;
            }
            if (elements.deleteLogMenu.style.display !== 'none') {
                toggleMenu(elements.deleteLogMenu, false, overlay);
                currentData = null;
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    registerCommonEvents();
    initializeCustomSelects();
    setupFilterHandlers();
    setupEditLogHandlers();
    setupDeleteLogHandlers();
    setupEscapeKeyHandler();
});

window.onload = async () => {
    const username = getUsername();
    showLoggedInUI(username);

    const urlParams = new URLSearchParams(window.location.search);
    const stadium = urlParams.get('stadium');

    if (stadium) {
        document.title = `${stadium} Activity - StadiumTrackr`;
        elements.activityWelcomeText.textContent = `${stadium} Activity`;
    } else {
        document.title = 'Activity - StadiumTrackr';
    }

    setView(username, 'all', stadium, 'date-desc');
};

const { logOutButton, sidebarLogOutButton } = getHeaderElements();

logOutButton?.addEventListener('click', () => {
    clearUsername();
    window.location.replace('index.html');
});

sidebarLogOutButton?.addEventListener('click', () => {
    clearUsername();
    window.location.replace('index.html');
});