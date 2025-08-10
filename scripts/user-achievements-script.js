import { loggedInHeader, loggedInHeaderUsername, logOutButton, sidebarToggleLoggedIn, sidebarLogOutButton, sidebarUsername } from "./constants.js";

/*  Variables  */
const userAchievementsNoAchievementsText = document.getElementById('user-achievements-no-achievements-text');
const userAchievementsElement = document.getElementById('user-achievements-achievements');
const earnedSelector = document.getElementById('user-achievements-header-earned-selector');
const earnedDropdown = document.getElementById('user-achievements-header-earned-selector-hidden');
const sortBy = document.getElementById('user-achievements-header-sort-by');
const sortDropdown = document.getElementById('user-achievements-sort-by-hidden');

let currentEarned = 'all';
let currentSortType = 'whenEarnedNewest';
let earnedShowTimeout, earnedHideTimeout;
let sortShowTimeout, sortHideTimeout;

/*  Functions  */
function showLoggedInUI() {
    let username = localStorage.getItem('username');
    if (username.length > 10) {
        username = username.slice(0,10) + '...';
    }
    loggedInHeaderUsername.textContent = username;
    loggedInHeader.style.display = 'flex';
    sidebarUsername.textContent = username;
}

function showEarnedDropdown() {
    clearTimeout(earnedHideTimeout);
    earnedShowTimeout = setTimeout(() => {
        earnedDropdown.classList.add('visible');
        earnedSelector.style.zIndex = '1001';
        earnedDropdown.style.zIndex = '1000';

        sortBy.style.zIndex = '11';
        sortDropdown.style.zIndex = '10';
    }, 300);
}

function hideEarnedDropdown() {
    clearTimeout(earnedShowTimeout);
    earnedHideTimeout = setTimeout(() => {
        if (!earnedDropdown.matches(':hover') && !earnedSelector.matches(':hover')) {
            earnedDropdown.classList.remove('visible');
            earnedSelector.style.zIndex = '11';
            earnedDropdown.style.zIndex = '10';
        }
    }, 300);
}

function showSortDropdown() {
    clearTimeout(sortHideTimeout);
    sortShowTimeout = setTimeout(() => {
        sortDropdown.classList.add('visible');
        sortBy.style.zIndex = '1001';
        sortDropdown.style.zIndex = '1000';

        earnedSelector.style.zIndex = '11';
        earnedDropdown.style.zIndex = '10';
    }, 300);
}

function hideSortDropdown() {
    clearTimeout(sortShowTimeout);
    sortHideTimeout = setTimeout(() => {
        if (!sortDropdown.matches(':hover') && !sortBy.matches(':hover')) {
            sortDropdown.classList.remove('visible');
            sortBy.style.zIndex = '11';
            sortDropdown.style.zIndex = '10';
        }
    }, 300);
}

/*  Async Functions  */
async function loadFullStadiumPage(username) {
    try {
        document.getElementById('user-achievements-container-skeleton').style.display = 'block';
        document.getElementById('user-achievements-container').style.display = 'none';

        document.body.style.overflow = 'hidden';

        const userAchievementsPromise = loadUserAchievements(username, currentEarned, currentSortType);

        const minimumLoadingTime = new Promise(resolve => setTimeout(resolve, 750));

        await Promise.all([
            userAchievementsPromise,
            minimumLoadingTime
        ]);

        document.getElementById('user-achievements-container-skeleton').style.display = 'none';
        document.getElementById('user-achievements-container').style.display = 'block';

        document.body.style.overflow = 'auto';

    }
    catch (error) {
        alert('Failed to load user achievements: ' + error.message);
    }
}

async function loadUserAchievements(username, earned, sortType) {
    try {
        const response = await fetch('http://localhost:3000/user/loadUserAchievements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, earned, sortType })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }

        const result = await response.json();

        const userAchievements = result.userAchievements;

        if (userAchievements.length === 0) {
            userAchievementsElement.innerHTML = '';
            userAchievementsElement.appendChild(userAchievementsNoAchievementsText);
            userAchievementsNoAchievementsText.style.display = 'block';
            return;
        }
        else {
            userAchievementsElement.innerHTML = '';
            userAchievementsNoAchievementsText.style.display = 'none';

            const createElement = (tag, className, textContent, src) => {
                const element = document.createElement(tag);
                if (className) element.className = className;
                if (textContent !== undefined) element.textContent = textContent;
                if (src) element.src = src;
                return element;
            };

            userAchievements.forEach(achievement => {
                const progressValue = achievement.progress_value ?? 0;
                const progressPercent = (progressValue / achievement.progress_goal) * 100;
                const greenWidth = (progressPercent / 100) * 270;
                const blackWidth = 270 - greenWidth;

                const achievementDiv = createElement('div', 'user-achievements-achievement');

                const header = createElement('div', 'user-achievements-achievement-header');
                header.append(
                    createElement('h3', 'user-achievement-achievement-name', achievement.achievement_name),
                    createElement('h3', 'user-achievement-achievement-percent', `${progressPercent.toFixed(0)}%`)
                );

                const info = createElement('div', 'user-achievement-achievement-info');
                info.append(
                    createElement('img', 'user-achievement-achievement-image', undefined, achievement.achievement_image),
                    createElement('h3', 'user-achievement-achievement-description', achievement.achievement_description)
                );

                const progressContainer = createElement('div', 'user-achievement-progress-container');
                const barContainer = createElement('div', 'progress-bar-container');

                const greenBar = createElement('div', 'user-achievement-progress-bar-green');
                greenBar.style.width = `${greenWidth}px`;
                if (greenWidth >= 270) greenBar.style.borderRadius = '25px';

                const blackBar = createElement('div', 'user-achievement-progress-bar-black');
                blackBar.style.width = `${blackWidth}px`;
                if (blackWidth >= 270) blackBar.style.borderRadius = '25px';

                barContainer.append(greenBar, blackBar);
                progressContainer.append(barContainer, createElement('h3', 'user-achievement-progress', `${progressValue}/${achievement.progress_goal}`));

                const unlockedText = achievement.unlocked
                    ? `Unlocked on ${new Date(achievement.unlocked_on).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
                    : 'Not Yet Unlocked';
                const unlockedEl = createElement('h3', 'user-achievement-unlocked-text', unlockedText);

                achievementDiv.append(header, info, progressContainer, unlockedEl);
                userAchievementsElement.appendChild(achievementDiv);
            }); 
        }

    } catch (error) {
        alert(error.message);
    }
}

/*  Events  */
window.onload = async () => {
    const username = localStorage.getItem('username');
    showLoggedInUI();
    loadFullStadiumPage(username);
};

window.addEventListener("resize", () => {
    if (sidebarToggleLoggedIn.checked) {
        sidebarToggleLoggedIn.checked = false;
    }
});

logOutButton.addEventListener('click', () => {
    localStorage.setItem('username', '');
    window.location.replace('index.html');
});

sidebarLogOutButton.addEventListener('click', () => {
    localStorage.setItem('username', '');
    window.location.replace('index.html');
})

earnedSelector.addEventListener('mouseenter', showEarnedDropdown);
earnedSelector.addEventListener('mouseleave', hideEarnedDropdown);
earnedDropdown.addEventListener('mouseenter', () => clearTimeout(earnedHideTimeout));
earnedDropdown.addEventListener('mouseleave', hideEarnedDropdown);

sortBy.addEventListener('mouseenter', showSortDropdown);
sortBy.addEventListener('mouseleave', hideSortDropdown);
sortDropdown.addEventListener('mouseenter', () => clearTimeout(sortHideTimeout));
sortDropdown.addEventListener('mouseleave', hideSortDropdown);

document.querySelectorAll('#user-achievements-header-earned-selector-hidden p').forEach(p => {
    p.addEventListener('click', async() => {
        const earned = p.textContent;

        if (earned === 'All') {
            currentEarned = 'All';
            earnedDropdown.style.width = '138px';
            document.querySelector('#earned-text').textContent = 'ALL';
            loadFullStadiumPage(localStorage.getItem('username'));
            return;
        }
        else if (earned === 'Earned') {
            currentEarned = 'Earned';
            earnedDropdown.style.width = '172px';
        }
        else {
            currentEarned = 'Not Earned';
            earnedDropdown.style.width = '206.5px';
        }

        document.querySelector('#earned-text').textContent = earned.toUpperCase();

        loadFullStadiumPage(localStorage.getItem('username'));
    })
})

document.querySelectorAll('#user-achievements-sort-by-hidden p').forEach(p => {
    p.addEventListener('click', async() => {
        const sortBy = p.textContent;

        if (sortBy === 'When Earned') {
            return;
        }

        if (sortBy === 'Achievement Name') {
            sortDropdown.style.width = '280px';
            currentSortType = 'achievementName';
        }
        else if (sortBy === 'Achievement Progress') {
            sortDropdown.style.width = '318px';
            currentSortType = 'achievementProgress';
        }
        else if (sortBy === 'Achievement Rarity') {
            sortDropdown.style.width = '291.5px';
            currentSortType = 'achievementRarity';
        }
        else if (sortBy === 'Newest First' && p.previousElementSibling.textContent === 'When Earned') {
            sortDropdown.style.width = '234px';
            document.querySelector('#sort-text').textContent = 'WHEN EARNED';
            currentSortType = 'whenEarnedNewest';
            loadFullStadiumPage(localStorage.getItem('username'))
            return;
        } 
        else if (sortBy === 'Earliest First' && p.previousElementSibling.previousElementSibling.textContent === 'When Earned') {
            sortDropdown.style.width = '234px';
            document.querySelector('#sort-text').textContent = 'WHEN EARNED';
            currentSortType = 'whenEarnedEarliest';
            loadFullStadiumPage(localStorage.getItem('username'))
            return;
        }

        document.querySelector('#sort-text').textContent = sortBy.toUpperCase();

        loadFullStadiumPage(localStorage.getItem('username'));

    })
})