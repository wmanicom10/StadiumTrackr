import { loggedOutHeader, loggedInHeader, loggedInHeaderUsername, logOutButton, logInMenu, logInForm, logIn, signInLink, createAccountMenu, createAccountForm, signUp, signUpLink, closeButtons, logInButton, createAccountButton, sidebarToggle, sidebarToggleLoggedIn, sidebarLogInButton, sidebarSignUpButton, sidebarLogOutButton, sidebarUsername, searchStadiumsForm, searchValue, suggestionsContainer, overlay } from "./constants.js";
import { toggleMenu, searchStadiums } from "./utils.js";
import { registerEventListeners } from "./events.js";

/*  Variables  */
const stadiumsList = document.getElementById('stadiums-list');
const stadiumsPageSelector = document.getElementById('stadiums-page-selector');
const noStadiumsContainer = document.getElementById('no-stadiums-container');
const clearFiltersButton = document.getElementById('clear-filters');
const stadiumCount = document.getElementById('results-count');

/*  Functions  */
async function setView(league, country, sortBy) {
    try {
        document.getElementById('stadiums-skeleton').style.display = 'block';
        document.getElementById('stadiums-list-container').style.display = 'none';
        document.getElementById('filter-bar').style.display = 'none';

        await new Promise(resolve => setTimeout(resolve, 750));
        const response = await fetch('http://localhost:3000/stadium/loadStadiums', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({league, country, sortBy})
        });

        if (!response.ok) throw new Error('Failed to load stadiums');

        const result = await response.json();
        const stadiums = result.stadiums;

        stadiumCount.textContent = 'Showing ' + stadiums.length + ' stadiums';

        if (stadiums.length === 0) {
            stadiumsList.style.display = 'none';
            stadiumsPageSelector.style.display = 'none';
            noStadiumsContainer.style.display = 'block';
            document.getElementById('stadiums-skeleton').style.display = 'none';
            document.getElementById('stadiums-list-container').style.display = 'block';
            document.getElementById('filter-bar').style.display = 'block';
        }
        else {
            stadiumsList.style.display = 'flex';
            stadiumsPageSelector.style.display = 'flex';
            noStadiumsContainer.style.display = 'none';

            const perPage = 18;
            let currentPage = 1;

            function renderPage(page) {
                stadiumsList.innerHTML = '';
                stadiumsPageSelector.style.display = 'flex';
                const start = (page - 1) * perPage;
                const end = start + perPage;
                const pageStadiums = stadiums.slice(start, end);

                pageStadiums.forEach(stadium => {
                    const stadiumElement = document.createElement('div');
                    stadiumElement.classList.add('stadiums-list-stadium');
                    const stadiumLink = document.createElement('a');
                    stadiumLink.href = `stadium.html?stadium=${encodeURIComponent(stadium.stadium_name)}`;
                    const img = document.createElement('img');
                    img.src = stadium.image;

                    const div = document.createElement('div');
                    div.classList.add('stadiums-list-stadium-text');
                    const h3 = document.createElement('h3');
                    h3.innerHTML = stadium.stadium_name;
                    const h4 = document.createElement('h4');
                    h4.textContent = stadium.city + ', ' + stadium.state;
                    div.appendChild(h3);
                    div.appendChild(h4);
                    stadiumLink.appendChild(img);
                    stadiumLink.appendChild(div);
                    stadiumElement.appendChild(stadiumLink);
                    stadiumsList.appendChild(stadiumElement);
                });
            }

            function renderPageNumbers() {
                stadiumsPageSelector.innerHTML = '';

                const pageCount = Math.ceil(stadiums.length / perPage);

                const prevBtn = document.createElement('button');
                prevBtn.className = 'page-btn arrow';
                prevBtn.id = 'prev-btn';
                prevBtn.textContent = '←';
                prevBtn.disabled = currentPage === 1;
                prevBtn.addEventListener('click', () => {
                    if (currentPage > 1) {
                        currentPage--;
                        renderPage(currentPage);
                        renderPageNumbers();
                        requestAnimationFrame(() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        });
                    }
                });
                stadiumsPageSelector.appendChild(prevBtn);

                const createPageButton = (i) => {
                    const pageNumber = document.createElement('button');
                    pageNumber.className = 'page-btn';
                    pageNumber.textContent = i;
                    pageNumber.dataset.page = i;
                    if (i === currentPage) pageNumber.classList.add('active');
                    pageNumber.addEventListener('click', () => {
                        currentPage = i;
                        renderPage(currentPage);
                        renderPageNumbers();
                        requestAnimationFrame(() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        });
                    });
                    stadiumsPageSelector.appendChild(pageNumber);
                };

                const addEllipsis = () => {
                    const dots = document.createElement('span');
                    dots.className = 'page-ellipsis';
                    dots.textContent = '...';
                    stadiumsPageSelector.appendChild(dots);
                };

                if (pageCount <= 7) {
                    for (let i = 1; i <= pageCount; i++) {
                        createPageButton(i);
                    }
                } else {
                    if (currentPage <= 3) {
                        for (let i = 1; i <= 5; i++) {
                            createPageButton(i);
                        }
                        addEllipsis();
                        createPageButton(pageCount);
                    } else if (currentPage >= pageCount - 2) {
                        createPageButton(1);
                        addEllipsis();
                        for (let i = pageCount - 4; i <= pageCount; i++) {
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

                const nextBtn = document.createElement('button');
                nextBtn.className = 'page-btn arrow';
                nextBtn.id = 'next-btn';
                nextBtn.textContent = '→';
                nextBtn.disabled = currentPage === pageCount;
                nextBtn.addEventListener('click', () => {
                    if (currentPage < pageCount) {
                        currentPage++;
                        renderPage(currentPage);
                        renderPageNumbers();
                        requestAnimationFrame(() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        });
                    }
                });
                stadiumsPageSelector.appendChild(nextBtn);
            }

            renderPage(currentPage);
            renderPageNumbers();

            document.getElementById('stadiums-skeleton').style.display = 'none';
            document.getElementById('stadiums-list-container').style.display = 'block';
            document.getElementById('filter-bar').style.display = 'block';
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
    loggedOutHeader.style.display = 'none';
    sidebarUsername.textContent = username;
    loggedInHeader.style.display = 'flex';
}

function showLoggedOutUI() {
    loggedInHeader.style.display = 'none';
    loggedOutHeader.style.display = 'flex';
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    registerEventListeners({
        overlay,
        createAccountForm,
        logInForm,
        logInButton,
        signUp,
        logIn,
        closeButtons,
        createAccountMenu,
        logInMenu,
        sidebarLogInButton,
        sidebarSignUpButton,
        signUpLink,
        signInLink
    });
});

window.onload = async () => {
    setView('all', 'all', 'name-asc');
    if (localStorage.getItem('username') === '' || localStorage.getItem('username') === null) {
        showLoggedOutUI();
    }
    else {
        showLoggedInUI();
    }
};

window.addEventListener("resize", () => {
    if (sidebarToggle.checked) {
        sidebarToggle.checked = false;
    }
    if (sidebarToggleLoggedIn.checked) {
        sidebarToggleLoggedIn.checked = false;
    }
});

createAccountButton.addEventListener('click', () => toggleMenu(createAccountMenu, true, overlay));

let typingTimer;
const debounceTime = 500;
searchValue.addEventListener('input', (event) => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        const name = event.target.value;
        if (!(name === "")) {
            searchStadiums(name, suggestionsContainer, searchValue);
        }
        else {
            suggestionsContainer.style.display = 'none';
            searchValue.style.borderBottomLeftRadius = '35px';
            searchValue.style.borderBottomRightRadius = '35px';
        }
    }, debounceTime);
});

document.addEventListener('click', function (event) {
    const isClickInside = searchValue.contains(event.target) || suggestionsContainer.contains(event.target);

    if (!isClickInside) {
        suggestionsContainer.style.display = 'none';
        searchValue.value = '';
        searchValue.style.borderBottomLeftRadius = '35px';
        searchValue.style.borderBottomRightRadius = '35px';
    }
});

searchStadiumsForm.addEventListener("submit", function (e) {
    e.preventDefault();
});

logOutButton.addEventListener('click', () => {
    localStorage.setItem('username', '');
    window.location.reload();
})

sidebarLogOutButton.addEventListener('click', () => {
    localStorage.setItem('username', '');
    window.location.reload();
})

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

document.getElementById('league-filter').addEventListener('change', () => {
    const league = document.getElementById('league-filter').value;
    const country = document.getElementById('country-filter').value;
    const sort = document.getElementById('sort-filter').value;
    
    setView(league, country, sort);
});

document.getElementById('country-filter').addEventListener('change', () => {
    const league = document.getElementById('league-filter').value;
    const country = document.getElementById('country-filter').value;
    const sort = document.getElementById('sort-filter').value;
    
    setView(league, country, sort);
});

document.getElementById('sort-filter').addEventListener('change', () => {
    const league = document.getElementById('league-filter').value;
    const country = document.getElementById('country-filter').value;
    const sort = document.getElementById('sort-filter').value;
    
    setView(league, country, sort);
});

clearFiltersButton.addEventListener('click', () => {
    document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => {
        const firstOption = wrapper.querySelector('.custom-select-option[data-value="all"], .custom-select-option[data-value="name-asc"]');
        const valueDisplay = wrapper.querySelector('.custom-select-value');
        const allOptions = wrapper.querySelectorAll('.custom-select-option');
        
        allOptions.forEach(opt => opt.classList.remove('selected'));
        if (firstOption) {
            firstOption.classList.add('selected');
            valueDisplay.textContent = firstOption.textContent;
        }
    });
    
    setView('all', 'all', 'name-asc');
});