import { loggedInHeader, loggedInHeaderUsername, logOutButton, sidebarToggleLoggedIn, sidebarLogOutButton, sidebarUsername } from "./constants.js";
import { createUserStadiumElement } from "./utils.js";

/*  Variables  */
const userStadiumsNoStadiumsText = document.getElementById('user-stadiums-no-stadiums-text');
const userStadiumsElement = document.getElementById('user-stadiums-stadiums');
const userStadiumsPageSelector = document.getElementById('user-stadiums-page-selector');
const leagueSelector = document.getElementById('user-stadiums-header-league-selector');
const leagueDropdown = document.getElementById('user-stadiums-header-league-selector-hidden');
const sortBy = document.getElementById('user-stadiums-header-sort-by');
const sortDropdown = document.getElementById('user-stadiums-sort-by-hidden');

let currentLeague = 'any';
let currentSortType = 'whenAddedNewest';
let leagueShowTimeout, leagueHideTimeout;
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

function showLeagueDropdown() {
    clearTimeout(leagueHideTimeout);
    leagueShowTimeout = setTimeout(() => {
        leagueDropdown.classList.add('visible');
        leagueSelector.style.zIndex = '1001';
        leagueDropdown.style.zIndex = '1000';

        sortBy.style.zIndex = '11';
        sortDropdown.style.zIndex = '10';
    }, 300);
}

function hideLeagueDropdown() {
    clearTimeout(leagueShowTimeout);
    leagueHideTimeout = setTimeout(() => {
        if (!leagueDropdown.matches(':hover') && !leagueSelector.matches(':hover')) {
            leagueDropdown.classList.remove('visible');
            leagueSelector.style.zIndex = '11';
            leagueDropdown.style.zIndex = '10';
        }
    }, 300);
}

function showSortDropdown() {
    clearTimeout(sortHideTimeout);
    sortShowTimeout = setTimeout(() => {
        sortDropdown.classList.add('visible');
        sortBy.style.zIndex = '1001';
        sortDropdown.style.zIndex = '1000';

        leagueSelector.style.zIndex = '11';
        leagueDropdown.style.zIndex = '10';
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
        document.getElementById('user-stadiums-container-skeleton').style.display = 'block';
        document.getElementById('user-stadiums-container').style.display = 'none';

        document.body.style.overflow = 'hidden';
        
        const userStadiumsPromise = loadUserStadiums(username, currentLeague, currentSortType);

        const minimumLoadingTime = new Promise(resolve => setTimeout(resolve, 750));

        await Promise.all([
            userStadiumsPromise,
            minimumLoadingTime
        ]);

        document.getElementById('user-stadiums-container-skeleton').style.display = 'none';
        document.getElementById('user-stadiums-container').style.display = 'block';

        document.body.style.overflow = 'auto';

    }
    catch (error) {
        alert('Failed to load stadium content: ' + error.message);
    }
}

async function loadUserStadiums(username, league, sortType) {
    try {
        const response = await fetch('http://localhost:3000/user/loadUserStadiums', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, league, sortType })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }

        const result = await response.json();

        const userStadiums = result.userStadiums;

        if (userStadiums.length === 0) {
            userStadiumsElement.innerHTML = '';
            userStadiumsElement.appendChild(userStadiumsNoStadiumsText);
            userStadiumsNoStadiumsText.style.display = 'block';
            userStadiumsPageSelector.style.display = 'none';
            userStadiumsElement.style.borderBottom = 'none';
            return;
        }
        else {
            const perPage = 18;
            let currentPage = 1;

            function renderPage(page) {
                userStadiumsElement.innerHTML = '';
                userStadiumsNoStadiumsText.style.display = 'none';
                userStadiumsPageSelector.style.display = 'flex';
                const start = (page - 1) * perPage;
                const end = start + perPage;
                const pageStadiums = userStadiums.slice(start, end);

                pageStadiums.forEach(stadium => {
                    userStadiumsElement.appendChild(createUserStadiumElement(stadium));
                })

                if (sortType === 'stadiumName') {
                    document.getElementById('sort-text').textContent = 'STADIUM NAME'
                }
            }

            function renderPageNumbers() {
                userStadiumsPageSelector.innerHTML = '';

                const createPageButton = (i) => {
                    const pageNumber = document.createElement('span');
                    pageNumber.textContent = i;
                    if (i === currentPage) pageNumber.classList.add('active');
                    pageNumber.addEventListener('click', async () => {
                        requestAnimationFrame(() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        });

                        document.getElementById('user-stadiums-container-skeleton').style.display = 'block';
                        document.getElementById('user-stadiums-container').style.display = 'none';

                        currentPage = i;
                        const renderPagePromise = renderPage(currentPage);
                        const renderPageNumbersPromise = renderPageNumbers();
                        const minimumLoadingTime = new Promise(resolve => setTimeout(resolve, 750));

                        await Promise.all([
                            renderPagePromise,
                            renderPageNumbersPromise,
                            minimumLoadingTime
                        ]);

                        document.getElementById('user-stadiums-container-skeleton').style.display = 'none';
                        document.getElementById('user-stadiums-container').style.display = 'block';

                    });
                    userStadiumsPageSelector.appendChild(pageNumber);
                };

                const addEllipsis = () => {
                    const dots = document.createElement('span');
                    dots.textContent = '...';
                    dots.style.pointerEvents = 'none';
                    dots.style.width = 'auto';
                    userStadiumsPageSelector.appendChild(dots);
                };

                const pageCount = Math.ceil(userStadiums.length / perPage);

                if (pageCount <= 4) {
                    for (let i = 1; i <= pageCount; i++) {
                        createPageButton(i);
                    }
                } else {
                    if (currentPage <= 3) {
                        for (let i = 1; i <= 3; i++) {
                            createPageButton(i);
                        }
                        addEllipsis();
                        createPageButton(pageCount);
                    } else if (currentPage >= pageCount - 2) {
                        createPageButton(1);
                        addEllipsis();
                        for (let i = pageCount - 2; i <= pageCount; i++) {
                            createPageButton(i);
                        }
                    } else {
                        createPageButton(1);
                        addEllipsis();
                        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                            createPageButton(i);
                        }
                        addEllipsis();
                        createPageButton(pageCount);
                    }
                }
            }
            renderPage(currentPage);
            renderPageNumbers();
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

sidebarLogOutButton.addEventListener('click', () => {
    localStorage.setItem('username', '');
    window.location.replace('index.html');
})

logOutButton.addEventListener('click', () => {
    localStorage.setItem('username', '');
    window.location.replace('index.html');
});

leagueSelector.addEventListener('mouseenter', showLeagueDropdown);
leagueSelector.addEventListener('mouseleave', hideLeagueDropdown);
leagueDropdown.addEventListener('mouseenter', () => clearTimeout(leagueHideTimeout));
leagueDropdown.addEventListener('mouseleave', hideLeagueDropdown);

sortBy.addEventListener('mouseenter', showSortDropdown);
sortBy.addEventListener('mouseleave', hideSortDropdown);
sortDropdown.addEventListener('mouseenter', () => clearTimeout(sortHideTimeout));
sortDropdown.addEventListener('mouseleave', hideSortDropdown);

document.querySelectorAll('#user-stadiums-header-league-selector-hidden p').forEach(p => {
    p.addEventListener('click', async() => {
        const league = p.textContent;

        if (league === 'Any') {
            currentLeague = 'any';
            leagueDropdown.style.width = '116px';
            document.querySelector('#league-text').textContent = 'League';
            loadFullStadiumPage(localStorage.getItem('username'));
            return;
        }
        else {
            currentLeague = league;
            leagueDropdown.style.width = '93px';
        }

        document.querySelector('#league-text').textContent = league.toUpperCase();

        loadFullStadiumPage(localStorage.getItem('username'));
    })
})

document.querySelectorAll('#user-stadiums-sort-by-hidden p').forEach(p => {
    p.addEventListener('click', async() => {
        const sortBy = p.textContent;

        if (sortBy === 'When Added' || sortBy === 'Date Visited') {
            return;
        }

        if (sortBy === 'Stadium Name') {
            sortDropdown.style.width = '238px';
            currentSortType = 'stadiumName';
        }
        else if (sortBy === 'Stadium Popularity') {
            sortDropdown.style.width = '291px';
            currentSortType = 'stadiumPopularity';
        }
        else if (sortBy === 'Newest First' && p.previousElementSibling.textContent === 'When Added') {
            sortDropdown.style.width = '225px';
            document.querySelector('#sort-text').textContent = 'WHEN ADDED';
            currentSortType = 'whenAddedNewest';
            loadFullStadiumPage(localStorage.getItem('username'))
            return;
        } 
        else if (sortBy === 'Earliest First' && p.previousElementSibling.previousElementSibling.textContent === 'When Added') {
            sortDropdown.style.width = '225px';
            document.querySelector('#sort-text').textContent = 'WHEN ADDED';
            currentSortType = 'whenAddedEarliest';
            loadFullStadiumPage(localStorage.getItem('username'))
            return;
        }
        else if (sortBy === 'Newest First' && p.previousElementSibling.textContent === 'Date Visited') {
            sortDropdown.style.width = '225px';
            document.querySelector('#sort-text').textContent = 'DATE VISITED';
            currentSortType = 'dateVisitedNewest';
            loadFullStadiumPage(localStorage.getItem('username'))
            return;
        } 
        else if (sortBy === 'Earliest First' && p.previousElementSibling.previousElementSibling.textContent === 'Date Visited') {
            sortDropdown.style.width = '225px';
            document.querySelector('#sort-text').textContent = 'DATE VISITED';
            currentSortType = 'dateVisitedEarliest';
            loadFullStadiumPage(localStorage.getItem('username'))
            return;
        }
        else {
            sortDropdown.style.width = '225px';
        }

        document.querySelector('#sort-text').textContent = sortBy.toUpperCase();

        loadFullStadiumPage(localStorage.getItem('username'));

    })
})