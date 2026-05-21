/*  Imports  */
import { MIN_LOADING_TIME, overlay } from "../constants.js";
import { formatDate, getUsername, initializeCustomSelects, showLoggedInUI, syncSelectFromURL, timeAgo, toggleMenu } from "../utils.js";
import { registerCommonEvents, registerUserLogOutEvents } from "../events.js";
import { userAPI } from "../api/user.js";
import { stadiumAPI } from "../api/stadium.js";
import { activityAPI } from "../api/activity.js";

/*  Variables  */
const elements = {
    editLogMenu: document.getElementById('edit-log-menu'),
    closeEditLogMenu: document.getElementById('close-edit-log-menu'),
    editLogSaveButton: document.getElementById('edit-log-save-button'),
    editLogCancelButton: document.getElementById('edit-log-cancel-button'),
    editLogName: document.getElementById('edit-log-name'),
    editLogLocation: document.getElementById('edit-log-location'),
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

const PAGE_SIZE = 18;
let currentData = null;
let currentOffset = 0;
let currentUsername = null;
let currentFilters = {};

/*  Async Functions  */
async function loadStadiumInfo(id, username) {
    try {
        const result = await stadiumAPI.loadStadiumInfo(id, username);
        const { stadium } = result.stadiumInfo;
        return stadium.name;
    } catch (error) {
        alert(error.message);
    }
}

async function setView(username, activity, id, sortBy) {
    try {
        currentOffset = 0;
        currentUsername = username;
        currentFilters = { activity, id, sortBy };

        showLoading();
        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
        const result = await userAPI.loadUserActivity(username, activity, id, sortBy, PAGE_SIZE, 0);
        const activities = result.userActivity;

        if (activities.length === 0) {
            showNoResults();
        } else {
            showResults();
            elements.activityList.innerHTML = '';
            activities.forEach(a => elements.activityList.appendChild(createActivityItem(a, username)));
            currentOffset = activities.length;
            updateShowMoreButton(activities.length);
        }

        hideLoading();
    } catch (err) {
        alert(err.message);
        hideLoading();
    }
}

async function loadMore() {
    try {
        const btn = document.getElementById('show-more-button');
        if (!btn) return;
        
        let dotCount = 0;
        const ellipsisInterval = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            btn.textContent = 'Loading' + '.'.repeat(dotCount);
        }, 250);

        const startTime = Date.now();
        
        const { activity, id, sortBy } = currentFilters;
        const result = await userAPI.loadUserActivity(currentUsername, activity, id, sortBy, PAGE_SIZE, currentOffset);
        
        const elapsedTime = Date.now() - startTime;
        const remainingTime = MIN_LOADING_TIME - elapsedTime;
        
        if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        clearInterval(ellipsisInterval);
        
        const activities = result.userActivity;

        activities.forEach(a => elements.activityList.appendChild(createActivityItem(a, currentUsername)));
        currentOffset += activities.length;
        updateShowMoreButton(activities.length);
    } catch (err) {
        const btn = document.getElementById('show-more-button');
        if (btn) btn.textContent = 'Show More';
        alert(err.message);
    }
}

/*  Functions  */
function createActivityItem(activity, username) {
    const item = document.createElement('div');
    item.classList.add('activity-item');

    const header = createActivityHeader(activity);
    item.appendChild(header);

    if (activity.visited_on) {
        const logDetailsContainer = createLogDetailsContainer(activity, username);
        item.appendChild(logDetailsContainer);
    } else {
        const detailsContainer = createSimpleDetailsContainer(activity, username);
        item.appendChild(detailsContainer);
    }

    return item;
}

function createActivityHeader(activity) {
    const header = document.createElement('div');
    header.classList.add('activity-item-header');

    const nameLink = document.createElement('a');
    nameLink.classList.add('activity-item-name');
    nameLink.textContent = activity.stadium_name;
    nameLink.href = `stadium.html?id=${encodeURIComponent(activity.stadium_id)}`;

    const time = document.createElement('span');
    time.classList.add('activity-item-time');
    time.textContent = timeAgo(activity.added_on);

    header.appendChild(nameLink);
    header.appendChild(time);
    return header;
}

function createLogDetailsContainer(activity, username) {
    const container = document.createElement('div');
    container.classList.add('activity-log-details-container');

    const img = document.createElement('img');
    img.src = activity.image;
    img.alt = activity.stadium_name;
    img.classList.add('activity-item-image');
    container.appendChild(img);

    const wrapper = document.createElement('div');

    const details = createLogDetails(activity);
    wrapper.appendChild(details);

    const buttons = createLogButtons(activity, username);
    wrapper.appendChild(buttons);

    container.appendChild(wrapper);
    return container;
}

function createSimpleDetailsContainer(activity, username) {
    const container = document.createElement('div');
    container.classList.add('activity-details-container');

    const text = document.createElement('h3');
    text.classList.add('activity-type-text');
    text.textContent = activity.activity_type === 'wishlist' ? 'ADDED TO WISHLIST' : 'MARKED AS VISITED';
    container.appendChild(text);

    const btn = createRemoveButton(activity, username);
    container.appendChild(btn);

    return container;
}

function createLogDetails(activity) {
    const details = document.createElement('div');
    details.classList.add('activity-item-details');

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
    if (!activity.user_note) noteValue.classList.add('no-note');
    details.appendChild(noteValue);

    return details;
}

function createLogButtons(activity, username) {
    const buttons = document.createElement('div');
    buttons.classList.add('activity-buttons');

    buttons.appendChild(createEditButton(activity, username));
    buttons.appendChild(createDeleteButton(activity, username));

    return buttons;
}

function createEditButton(activity, username) {
    const btn = document.createElement('button');
    btn.classList.add('edit-log-button');
    btn.textContent = 'Edit Log';

    btn.addEventListener('click', () => {
        currentData = { visit_id: activity.visit_id, username };
        elements.editLogName.textContent = activity.stadium_name;
        elements.editLogLocation.textContent = activity.city + ', ' + activity.state;
        elements.editLogImage.src = activity.image;
        elements.editLogDateVisited.value = activity.visited_on.split('T')[0];
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        elements.editLogDateVisited.setAttribute('max', today);
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
        currentData = { visit_id: activity.visit_id, username };
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
            const { activity: actFilter, sort, stadium } = getFiltersFromURL();
            setView(username, actFilter, stadium, sort);
        } catch (error) {
            alert(error.message);
        }
    });

    return btn;
}

function getFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    return {
        activity: params.get('activity') || 'all',
        sort: params.get('sort') || 'date-desc',
        stadium: params.get('id') || null
    };
}

function hideLoading() {
    elements.activitySkeleton.style.display = 'none';
    elements.activityListContainer.style.display = 'block';
    elements.activityFilterBar.style.display = 'block';
}

function setupDeleteLogHandlers() {
    elements.deleteLogDeleteButton.addEventListener('click', async () => {
        if (!currentData) return;
        try {
            await activityAPI.deleteLog(currentData.visit_id);
            toggleMenu(elements.deleteLogMenu, false, overlay);
            const { activity, sort, stadium } = getFiltersFromURL();
            await setView(currentData.username, activity, stadium, sort);
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

function setupEditLogHandlers() {
    elements.editLogSaveButton.addEventListener('click', async () => {
        if (!currentData) return;
        try {
            await activityAPI.editLog(currentData.visit_id, elements.editLogDateVisited.value, elements.editLogNote.value);
            toggleMenu(elements.editLogMenu, false, overlay);
            const { activity, sort, stadium } = getFiltersFromURL();
            await setView(currentData.username, activity, stadium, sort);
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

function setupFilterHandlers() {
    const { stadium } = getFiltersFromURL();

    function applyFilter() {
        const activity = elements.activityFilter.value;
        const sort = elements.sortFilter.value;
        const params = new URLSearchParams();
        if (stadium) params.set('stadium', stadium);
        if (activity !== 'all') params.set('activity', activity);
        if (sort !== 'date-desc') params.set('sort', sort);
        window.location.search = params.toString();
    }

    elements.activityFilter.addEventListener('change', applyFilter);
    elements.sortFilter.addEventListener('change', applyFilter);
}

function showLoading() {
    elements.activitySkeleton.style.display = 'block';
    void elements.activitySkeleton.offsetWidth;
    elements.activityListContainer.style.display = 'none';
    elements.activityFilterBar.style.display = 'none';
}

function showNoResults() {
    elements.noActivityContainer.style.display = 'block';
    elements.activityList.style.display = 'none';
}

function showResults() {
    elements.noActivityContainer.style.display = 'none';
    elements.activityList.style.display = 'block';
}

function updateShowMoreButton(returnedCount) {
    const existing = document.getElementById('show-more-button');
    if (existing) existing.remove();

    if (returnedCount === PAGE_SIZE) {
        const btn = document.createElement('button');
        btn.id = 'show-more-button';
        btn.textContent = 'Show More';
        btn.addEventListener('click', loadMore);
        elements.activityListContainer.appendChild(btn);
    }
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    registerCommonEvents();
    registerUserLogOutEvents();
    initializeCustomSelects();
    setupFilterHandlers();
    setupEditLogHandlers();
    setupDeleteLogHandlers();
    setupEscapeKeyHandler();
});

window.onload = async () => {
    const username = getUsername();
    showLoggedInUI(username);

    const { activity, sort, stadium } = getFiltersFromURL();

    if (stadium) {
        const stadiumName = await loadStadiumInfo(stadium, username);
        document.title = `${stadiumName} Activity - StadiumTrackr`;
        elements.activityWelcomeText.textContent = `${stadiumName} Activity`;
    } else {
        document.title = 'Activity - StadiumTrackr';
        elements.activityWelcomeText.textContent = 'Activity';
    }

    syncSelectFromURL('activity-filter', activity);
    syncSelectFromURL('sort-filter', sort);

    setView(username, activity, stadium, sort);
};