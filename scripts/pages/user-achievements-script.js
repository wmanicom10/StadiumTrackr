/*  Imports  */
import { MIN_LOADING_TIME } from "../constants.js";
import { formatDate, getUsername, initializeCustomSelects, showLoggedInUI, syncSelectFromURL } from "../utils.js";
import { registerCommonEvents, registerUserLogOutEvents } from "../events.js";
import { userAPI } from "../api/user.js";

/*  Variables  */
const elements = {
    achievementsList: document.getElementById('achievements-list'),
    noAchievementsContainer: document.getElementById('no-achievements-container'),
    achievementsSkeleton: document.getElementById('achievements-skeleton'),
    achievementsListContainer: document.getElementById('achievements-list-container'),
    achievementsFilterBar: document.getElementById('achievements-filter-bar'),
    earnedFilter: document.getElementById('earned-filter'),
    sortFilter: document.getElementById('sort-filter')
};

/*  Async Functions  */
async function setView(username, earned, sortBy) {
    try {
        showLoading();
        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
        const result = await userAPI.loadUserAchievements(username, earned, sortBy);
        const achievements = result.userAchievements;

        if (achievements.length === 0) {
            showNoResults();
        } else {
            showResults();
            renderAchievements(achievements);
        }

        hideLoading();
    } catch (err) {
        alert(err.message);
        hideLoading();
    }
}

/*  Functions  */
function createAchievementElement(achievement) {
    const progressValue = achievement.progress_value ?? 0;
    const progressPercent = (progressValue / achievement.progress_goal) * 100;
    const barWidth = 270;
    const blueWidth = (progressPercent / 100) * barWidth;
    const grayWidth = barWidth - blueWidth;

    const container = document.createElement('div');
    container.className = 'user-achievements-achievement';

    const header = document.createElement('div');
    header.className = 'user-achievements-achievement-header';

    const name = document.createElement('h3');
    name.className = 'user-achievement-achievement-name';
    name.textContent = achievement.achievement_name;

    const percent = document.createElement('h3');
    percent.className = 'user-achievement-achievement-percent';
    percent.textContent = `${progressPercent.toFixed(0)}%`;

    header.appendChild(name);
    header.appendChild(percent);

    const info = document.createElement('div');
    info.className = 'user-achievement-achievement-info';

    const img = document.createElement('img');
    img.className = 'user-achievement-achievement-image';
    img.src = achievement.achievement_image;
    img.alt = achievement.achievement_name;

    const description = document.createElement('h3');
    description.className = 'user-achievement-achievement-description';
    description.textContent = achievement.achievement_description;

    info.appendChild(img);
    info.appendChild(description);

    const progressContainer = createProgressBar(progressValue, achievement.progress_goal, blueWidth, grayWidth);

    const unlockedText = achievement.unlocked
        ? `Unlocked on ${formatDate(achievement.unlocked_on)}`
        : 'Not Yet Unlocked';

    const unlocked = document.createElement('h3');
    unlocked.className = 'user-achievement-unlocked-text';
    unlocked.textContent = unlockedText;

    container.appendChild(header);
    container.appendChild(info);
    container.appendChild(progressContainer);
    container.appendChild(unlocked);

    return container;
}

function createProgressBar(progressValue, progressGoal, blueWidth, grayWidth) {
    const container = document.createElement('div');
    container.className = 'user-achievement-progress-container';

    const barContainer = document.createElement('div');
    barContainer.className = 'progress-bar-container';

    const blueBar = document.createElement('div');
    blueBar.className = 'user-achievement-progress-bar-blue';
    blueBar.style.width = `${blueWidth}px`;
    if (blueWidth >= 270) blueBar.style.borderRadius = '25px';

    const grayBar = document.createElement('div');
    grayBar.className = 'user-achievement-progress-bar-gray';
    grayBar.style.width = `${grayWidth}px`;
    if (grayWidth >= 270) grayBar.style.borderRadius = '25px';
    if (grayWidth === 0) grayBar.style.border = 'none';

    barContainer.appendChild(blueBar);
    barContainer.appendChild(grayBar);

    const progressText = document.createElement('h3');
    progressText.className = 'user-achievement-progress';
    progressText.textContent = `${progressValue}/${progressGoal}`;

    container.appendChild(barContainer);
    container.appendChild(progressText);

    return container;
}

function hideLoading() {
    elements.achievementsSkeleton.style.display = 'none';
    elements.achievementsListContainer.style.display = 'block';
    elements.achievementsFilterBar.style.display = 'block';
}

function renderAchievements(achievements) {
    elements.achievementsList.innerHTML = '';
    achievements.forEach(achievement => {
        elements.achievementsList.appendChild(createAchievementElement(achievement));
    });
}

function setupFilterHandlers() {
    const getFilters = () => ({
        earned: elements.earnedFilter.value,
        sort: elements.sortFilter.value
    });

    function applyFilter() {
        const { earned, sort } = getFilters();
        const params = new URLSearchParams();
        if (earned !== 'all') params.set('earned', earned);
        if (sort !== 'name-asc') params.set('sort', sort);
        window.location.search = params.toString();
    }

    elements.earnedFilter.addEventListener('change', applyFilter);
    elements.sortFilter.addEventListener('change', applyFilter);
}

function showLoading() {
    elements.achievementsSkeleton.style.display = 'block';
    elements.achievementsListContainer.style.display = 'none';
    elements.achievementsFilterBar.style.display = 'none';
}

function showNoResults() {
    elements.achievementsList.style.display = 'none';
    elements.noAchievementsContainer.style.display = 'block';
}

function showResults() {
    elements.achievementsList.style.display = 'flex';
    elements.noAchievementsContainer.style.display = 'none';
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    registerCommonEvents();
    registerUserLogOutEvents();
    initializeCustomSelects();
    setupFilterHandlers();
});

window.onload = async () => {
    const username = getUsername();
    showLoggedInUI(username);

    const params = new URLSearchParams(window.location.search);
    const earned = params.get('earned') || 'all';
    const sort = params.get('sort') || 'name-asc';

    syncSelectFromURL('earned-filter', earned);
    syncSelectFromURL('sort-filter', sort);

    setView(username, earned, sort);
};