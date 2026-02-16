import { getHeaderElements, MIN_LOADING_TIME } from "../constants.js";
import {  getUsername, truncateUsername, formatDate, clearUsername } from "../utils.js";
import { registerCommonEvents } from "../events.js";
import { userAPI } from "../api/user.js";

const elements = {
    achievementsList: document.getElementById('achievements-list'),
    noAchievementsContainer: document.getElementById('no-achievements-container'),
    achievementsSkeleton: document.getElementById('achievements-skeleton'),
    achievementsListContainer: document.getElementById('achievements-list-container'),
    achievementsFilterBar: document.getElementById('achievements-filter-bar'),
    earnedFilter: document.getElementById('earned-filter'),
    sortFilter: document.getElementById('sort-filter')
};

function showLoggedInUI(username) {
    const { loggedInHeader, loggedInHeaderUsername, sidebarUsername } = getHeaderElements();
    
    const displayName = truncateUsername(username);
    loggedInHeaderUsername.textContent = displayName;
    sidebarUsername.textContent = displayName;
    loggedInHeader.style.display = 'flex';
}

function showLoading() {
    elements.achievementsSkeleton.style.display = 'block';
    elements.achievementsListContainer.style.display = 'none';
    elements.achievementsFilterBar.style.display = 'none';
}

function hideLoading() {
    elements.achievementsSkeleton.style.display = 'none';
    elements.achievementsListContainer.style.display = 'block';
    elements.achievementsFilterBar.style.display = 'block';
}

function showNoResults() {
    elements.achievementsList.style.display = 'none';
    elements.noAchievementsContainer.style.display = 'block';
}

function showResults() {
    elements.achievementsList.style.display = 'flex';
    elements.noAchievementsContainer.style.display = 'none';
}

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

function renderAchievements(achievements) {
    elements.achievementsList.innerHTML = '';
    
    achievements.forEach(achievement => {
        const element = createAchievementElement(achievement);
        elements.achievementsList.appendChild(element);
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

    const getFilters = () => ({
        earned: elements.earnedFilter.value,
        sort: elements.sortFilter.value
    });

    elements.earnedFilter.addEventListener('change', () => {
        const { earned, sort } = getFilters();
        setView(username, earned, sort);
    });

    elements.sortFilter.addEventListener('change', () => {
        const { earned, sort } = getFilters();
        setView(username, earned, sort);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    registerCommonEvents();
    initializeCustomSelects();
    setupFilterHandlers();
});

window.onload = async () => {
    const username = getUsername();
    showLoggedInUI(username);
    setView(username, 'all', 'name-asc');
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