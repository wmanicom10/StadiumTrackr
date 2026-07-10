/*  Imports  */
import { MIN_LOADING_TIME, overlay, STADIUM_IMAGE_PATH } from "../constants.js";
import { formatDate, getPageFromURL, initializeCustomSelects, isLoggedIn, renderPageNumbers, setupDeleteLogHandlers, setupEditLogHandlers, setupSearchAutocomplete, showLoggedInUI, syncSelectFromURL, timeAgo, toggleMenu } from "../utils.js";
import { registerCommonEvents, registerUserLogOutEvents } from "../events.js";
import { userAPI } from "../api/user.js";
import { loadAPI } from "../api/load.js";
import { updateAPI } from "../api/update.js";

/*  Variables  */
const elements = {
    activityFilter: document.getElementById('activity-filter'),
    sortFilter: document.getElementById('sort-filter'),
    clearFiltersButton: document.getElementById('activity-clear-filters'),
    stadiumsList: document.getElementById('activity-list'),
    stadiumsPageSelector: document.getElementById('activity-page-selector'),
    noStadiumsContainer: document.getElementById('no-activity-container'),
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
    deleteLogDeleteButton: document.getElementById('delete-log-delete-button')
};

let currentData = null;

/*  Async Functions  */
async function loadStadiumInfo(id) {
    try {
        const result = await loadAPI.loadStadiumInfo(id);
        const { stadium } = result.stadiumInfo;
        return { stadiumName: stadium.name, image: stadium.image };
    } catch (error) {
        console.error(error);
    }
}

async function setView() {
    const params = new URLSearchParams(window.location.search);
    const activity = params.get('activity') || 'all';
    const sort = params.get('sort') || 'added-desc';
    const stadium = params.get('id') || null;

    setupActivityFilterHandlers(elements, stadium);

    if (stadium) {
        const { stadiumName, image } = await loadStadiumInfo(stadium);
        document.title = `${stadiumName} Activity - StadiumTrackr`;
        document.getElementById('user-activity-welcome-text').textContent = `${stadiumName} Activity`;

        const stadiumImage = document.createElement('img');
        stadiumImage.id = 'stadium-image';
        stadiumImage.src = STADIUM_IMAGE_PATH + image;
        document.querySelector('main').prepend(stadiumImage);
        stadiumImage.onload = () => {
            stadiumImage.classList.add('loaded');
        };
    }

    syncSelectFromURL('activity-filter', activity);
    syncSelectFromURL('sort-filter', sort);

    await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
    const result = await userAPI.loadUserActivity(activity, stadium, sort);
    const stadiums = result.userActivity;

    renderActivity(stadiums, elements);

    document.getElementById('activity-skeleton').style.display = 'none';
    document.getElementById('activity-list').style.display = 'flex';
    document.getElementById('user-activity-welcome-text-skeleton').style.display = 'none';
    document.getElementById('user-activity-welcome-text').style.display = 'inline';
    document.getElementById('activity-filter-bar-skeleton').style.display = 'none';
    document.getElementById('activity-filter-bar').style.display = 'block';
}

/*  Functions  */
function renderActivity(stadiums, elements) {
    if (stadiums.length === 0) {
        elements.stadiumsList.style.display = 'none';
        elements.stadiumsPageSelector.style.display = 'none';
        elements.noStadiumsContainer.style.display = 'block';
    } else {
        elements.stadiumsList.style.display = 'flex';
        elements.stadiumsPageSelector.style.display = 'flex';
        elements.noStadiumsContainer.style.display = 'none';

        const perPage = 18;
        const pageCount = Math.ceil(stadiums.length / perPage);
        let currentPage = Math.min(getPageFromURL(), pageCount);

        const hasLoggedVisits = stadiums.some(s => s.activity_type === "stadium" && s.visited_on);
        if (hasLoggedVisits) {
            setupEditLogHandlers(elements, () => currentData);
            setupDeleteLogHandlers(elements, () => currentData);
        }

        function renderPage(page) {
            elements.stadiumsList.innerHTML = '';
            const start = (page - 1) * perPage;
            const end = start + perPage;
            stadiums.slice(start, end).forEach(stadium => {
                if (stadium.activity_type === "stadium" && stadium.visited_on) {
                    const userHomeLogActivity = document.createElement('div');
                    userHomeLogActivity.classList.add('user-home-log-activity');

                    const userHomeLogActivityHeader = document.createElement('div');
                    userHomeLogActivityHeader.classList.add('user-home-log-activity-header');

                    const userHomeLogActivityTitle = document.createElement('h3');
                    userHomeLogActivityTitle.textContent = 'Logged visit to ';

                    const userHomeLogActivityTitleLink = document.createElement('a');
                    userHomeLogActivityTitleLink.href = `stadium.html?id=${stadium.stadium_id}`;
                    userHomeLogActivityTitleLink.textContent = stadium.stadium_name;

                    userHomeLogActivityTitle.appendChild(userHomeLogActivityTitleLink);

                    const userHomeActivityDate = document.createElement('h4');
                    userHomeActivityDate.classList.add('user-home-activity-date');
                    userHomeActivityDate.textContent = timeAgo(stadium.added_on);

                    userHomeLogActivityHeader.appendChild(userHomeLogActivityTitle);
                    userHomeLogActivityHeader.appendChild(userHomeActivityDate);

                    const userHomeLogActivityInfoContainer = document.createElement('div');
                    userHomeLogActivityInfoContainer.classList.add('user-home-log-activity-info-container');

                    const userHomeActivityLogImage = document.createElement('img');
                    userHomeActivityLogImage.classList.add('user-home-activity-log-image');
                    userHomeActivityLogImage.src = STADIUM_IMAGE_PATH + stadium.image;

                    const userHomeLogActivityInfo = document.createElement('div');
                    userHomeLogActivityInfo.classList.add('user-home-log-activity-info');

                    const userHomeLogActivityDetails = document.createElement('div');
                    userHomeLogActivityDetails.classList.add('user-home-log-activity-details');

                    const dateContainer = document.createElement('div');

                    const dateVisited = document.createElement('h5');
                    dateVisited.textContent = 'Date Visited';

                    const date = document.createElement('h4');
                    date.textContent = formatDate(stadium.visited_on);

                    dateContainer.appendChild(dateVisited);
                    dateContainer.appendChild(date);

                    const noteContainer = document.createElement('div');

                    const noteTitle = document.createElement('h5');
                    noteTitle.textContent = 'Note';

                    const note = document.createElement('h4');
                    if (stadium.user_note) {
                        note.textContent = stadium.user_note;
                    } else {
                        note.style.color = 'var(--color-text-muted)';
                        note.style.fontStyle = 'italic';
                        note.textContent = 'No note added';
                    }

                    noteContainer.appendChild(noteTitle);
                    noteContainer.appendChild(note);

                    userHomeLogActivityDetails.appendChild(dateContainer);
                    userHomeLogActivityDetails.appendChild(noteContainer);

                    const userHomeLogActivityButtons = document.createElement('div');
                    userHomeLogActivityButtons.classList.add('user-home-log-activity-buttons');

                    const userHomeLogActivityEditLogButton = document.createElement('button');
                    userHomeLogActivityEditLogButton.classList.add('user-home-log-activity-edit-log-button');
                    userHomeLogActivityEditLogButton.textContent = 'Edit Log';

                    userHomeLogActivityEditLogButton.addEventListener('click', () => {
                        currentData = { visit_id: stadium.visit_id };
                        elements.editLogName.textContent = stadium.stadium_name;
                        elements.editLogLocation.textContent = stadium.city + ', ' + stadium.state;
                        elements.editLogImage.src = STADIUM_IMAGE_PATH + stadium.image;
                        elements.editLogDateVisited.value = stadium.visited_on.split('T')[0];
                        const now = new Date();
                        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                        elements.editLogDateVisited.setAttribute('max', today);
                        elements.editLogNote.value = stadium.user_note || '';
                        toggleMenu(elements.editLogMenu, true, overlay);
                    });

                    const userHomeLogActivityRemoveButton = document.createElement('button');
                    userHomeLogActivityRemoveButton.classList.add('user-home-log-activity-remove-button');
                    userHomeLogActivityRemoveButton.textContent = 'Remove';

                    userHomeLogActivityRemoveButton.addEventListener('click', () => {
                        currentData = { visit_id: stadium.visit_id };
                        toggleMenu(elements.deleteLogMenu, true, overlay);
                    });

                    userHomeLogActivityButtons.appendChild(userHomeLogActivityEditLogButton);
                    userHomeLogActivityButtons.appendChild(userHomeLogActivityRemoveButton);

                    userHomeLogActivityInfo.appendChild(userHomeLogActivityDetails);
                    userHomeLogActivityInfo.appendChild(userHomeLogActivityButtons);

                    userHomeLogActivityInfoContainer.appendChild(userHomeActivityLogImage);
                    userHomeLogActivityInfoContainer.appendChild(userHomeLogActivityInfo);

                    userHomeLogActivity.appendChild(userHomeLogActivityHeader);
                    userHomeLogActivity.appendChild(userHomeLogActivityInfoContainer);

                    elements.stadiumsList.appendChild(userHomeLogActivity);
                } else if (stadium.activity_type === "stadium") {
                    const userHomeVisitActivity = document.createElement('div');
                    userHomeVisitActivity.classList.add('user-home-visit-activity');

                    const userHomeVisitActivityTitle = document.createElement('h3');
                    userHomeVisitActivityTitle.textContent = 'Marked ';

                    const link = document.createElement('a');
                    link.href = `stadium.html?id=${stadium.stadium_id}`;
                    link.textContent = stadium.stadium_name;

                    userHomeVisitActivityTitle.appendChild(link);
                    userHomeVisitActivityTitle.appendChild(document.createTextNode(' as visited'));

                    const userHomeActivityDate = document.createElement('h4');
                    userHomeActivityDate.textContent = timeAgo(stadium.added_on);

                    userHomeVisitActivity.appendChild(userHomeVisitActivityTitle);
                    userHomeVisitActivity.appendChild(userHomeActivityDate);

                    elements.stadiumsList.appendChild(userHomeVisitActivity);
                } else if (stadium.activity_type === "wishlist") {
                    const userHomeWishlistActivity = document.createElement('div');
                    userHomeWishlistActivity.classList.add('user-home-wishlist-activity');

                    const userHomeWishlistActivityTitle = document.createElement('h3');
                    userHomeWishlistActivityTitle.textContent = 'Added ';

                    const link = document.createElement('a');
                    link.href = `stadium.html?id=${stadium.stadium_id}`;
                    link.textContent = stadium.stadium_name;

                    userHomeWishlistActivityTitle.appendChild(link);
                    userHomeWishlistActivityTitle.appendChild(document.createTextNode(' to your wishlist'));

                    const userHomeActivityDate = document.createElement('h4');
                    userHomeActivityDate.textContent = timeAgo(stadium.added_on);

                    userHomeWishlistActivity.appendChild(userHomeWishlistActivityTitle);
                    userHomeWishlistActivity.appendChild(userHomeActivityDate);

                    elements.stadiumsList.appendChild(userHomeWishlistActivity);
                }
            });
        }

        renderPage(currentPage);
        renderPageNumbers(elements, currentPage, pageCount);
    }
}

function setupActivityFilterHandlers(elements, id) {
    const getFilters = () => ({
        activity: elements.activityFilter.value,
        sort: elements.sortFilter.value
    });

    function applyFilter() {
        const { activity, sort } = getFilters();
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('activity', activity);
        params.set('sort', sort);
        params.set('id', id)
        window.location.search = params.toString();
    }

    elements.activityFilter.addEventListener('change', applyFilter);
    elements.sortFilter.addEventListener('change', applyFilter);
    
    elements.clearFiltersButton.addEventListener('click', () => {
        elements.activityFilter.value = 'all';
        elements.sortFilter.value = 'added-desc';
        const params = new URLSearchParams();
        params.set('id', id)
        window.location.search = params.toString();
    });
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    registerCommonEvents();
    registerUserLogOutEvents();
    initializeCustomSelects();
    setupSearchAutocomplete('logged-in-nav-search', 'logged-in-search-field-nav', 'logged-in-nav-autocomplete-list');
    setupSearchAutocomplete('logged-in-sidebar-nav-search', 'logged-in-sidebar-search-field-nav', 'logged-in-sidebar-nav-autocomplete-list');
});

window.onload = async () => {
    if (!isLoggedIn()) {
        window.location.replace('index.html');
        return;
    }
    
    showLoggedInUI();
    setView();
};