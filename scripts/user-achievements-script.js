import { loggedInHeader, loggedInHeaderUsername, logOutButton, sidebarToggleLoggedIn, sidebarLogOutButton, sidebarUsername } from "./constants.js";

/*  Variables  */
const achievementsList = document.getElementById('achievements-list');
const noAchievementsContainer = document.getElementById('no-achievements-container');

/*  Functions  */
async function setView(username, earned, sortBy) {
    try {
        document.getElementById('achievements-skeleton').style.display = 'block';
        document.getElementById('achievements-list-container').style.display = 'none';
        document.getElementById('achievements-filter-bar').style.display = 'none';

        await new Promise(resolve => setTimeout(resolve, 750));
        const response = await fetch('http://localhost:3000/user/loadUserAchievements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({username, earned, sortBy})
        });

        if (!response.ok) throw new Error('Failed to load achievements');

        const result = await response.json();
        const achievements = result.userAchievements;
        
        if (achievements.length === 0) {
            achievementsList.style.display = 'none';
            noAchievementsContainer.style.display = 'block';
            document.getElementById('achievements-skeleton').style.display = 'none';
            document.getElementById('achievements-list-container').style.display = 'block';
            document.getElementById('achievements-filter-bar').style.display = 'block';
        }
        else {
            achievementsList.style.display = 'flex';
            noAchievementsContainer.style.display = 'none';

            function renderPage() {
                achievementsList.innerHTML = '';

                const createElement = (tag, className, textContent, src) => {
                    const element = document.createElement(tag);
                    if (className) element.className = className;
                    if (textContent !== undefined) element.textContent = textContent;
                    if (src) element.src = src;
                    return element;
                };

                achievements.forEach(achievement => {
                    const progressValue = achievement.progress_value ?? 0;
                    const progressPercent = (progressValue / achievement.progress_goal) * 100;
                    const blueWidth = (progressPercent / 100) * 270;
                    const grayWidth = 270 - blueWidth;

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

                    const blueBar = createElement('div', 'user-achievement-progress-bar-blue');
                    blueBar.style.width = `${blueWidth}px`;
                    if (blueWidth >= 270) blueBar.style.borderRadius = '25px';

                    const grayBar = createElement('div', 'user-achievement-progress-bar-gray');
                    grayBar.style.width = `${grayWidth}px`;
                    if (grayWidth >= 270) grayBar.style.borderRadius = '25px';
                    if (grayWidth === 0) grayBar.style.border = 'none';

                    barContainer.append(blueBar, grayBar);
                    progressContainer.append(barContainer, createElement('h3', 'user-achievement-progress', `${progressValue}/${achievement.progress_goal}`));

                    const unlockedText = achievement.unlocked
                        ? `Unlocked on ${new Date(achievement.unlocked_on).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
                        : 'Not Yet Unlocked';
                    const unlockedEl = createElement('h3', 'user-achievement-unlocked-text', unlockedText);

                    achievementDiv.append(header, info, progressContainer, unlockedEl);
                    achievementsList.appendChild(achievementDiv);
                }); 
            }

            renderPage();

            document.getElementById('achievements-skeleton').style.display = 'none';
            document.getElementById('achievements-list-container').style.display = 'block';
            document.getElementById('achievements-filter-bar').style.display = 'block';
        }
    } catch (err) {
        alert(err.message);
    }
}

function showLoggedInUI() {
    let username = localStorage.getItem('username');
    if (username.length > 10) {
        username = username.slice(0,10) + '...';
    }
    loggedInHeaderUsername.textContent = username;
    loggedInHeader.style.display = 'flex';
    sidebarUsername.textContent = username;
}

/*  Events  */
window.onload = async () => {
    const username = localStorage.getItem('username');
    setView(username, 'all', 'name-asc')
    showLoggedInUI();
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
});

document.addEventListener('DOMContentLoaded', () => {
    const triggers = document.querySelectorAll('.custom-select-trigger');
    
    triggers.forEach(trigger => {
        const wrapper = trigger.parentElement;
        const dropdown = wrapper.querySelector('.custom-select-dropdown');
        const options = dropdown.querySelectorAll('.custom-select-option');
        const valueDisplay = trigger.querySelector('.custom-select-value');
        const hiddenSelect = wrapper.querySelector('.filter-select');
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            
            document.querySelectorAll('.custom-select-dropdown.active').forEach(d => {
                if (d !== dropdown) {
                    d.classList.remove('active');
                    d.parentElement.querySelector('.custom-select-trigger').classList.remove('active');
                }
            });
            
            dropdown.classList.toggle('active');
            trigger.classList.toggle('active');
        });
        
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                valueDisplay.textContent = option.textContent;
                
                hiddenSelect.value = option.dataset.value;
                
                hiddenSelect.dispatchEvent(new Event('change'));
                
                dropdown.classList.remove('active');
                trigger.classList.remove('active');
            });
        });
    });
    
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select-dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
            dropdown.parentElement.querySelector('.custom-select-trigger').classList.remove('active');
        });
    });
});

document.getElementById('earned-filter').addEventListener('change', () => {
    const username = localStorage.getItem('username');
    const earned = document.getElementById('earned-filter').value;
    const sort = document.getElementById('sort-filter').value;
    
    setView(username, earned, sort);
});

document.getElementById('sort-filter').addEventListener('change', () => {
    const username = localStorage.getItem('username');
    const earned = document.getElementById('earned-filter').value;
    const sort = document.getElementById('sort-filter').value;
    
    setView(username, earned, sort);
});