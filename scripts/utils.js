export function toggleMenu(menu, show, overlay, keepOverlay = false) {
    if (show) {
        if (!keepOverlay) {
            overlay.style.display = 'block';
            overlay.classList.remove('overlay-fade-out');
            void overlay.offsetWidth;
            overlay.classList.add('overlay-fade-in');
            document.body.style.overflow = 'hidden';
        }
        menu.style.display = 'block';
        menu.classList.remove('menu-fade-out');
        void menu.offsetWidth;
        menu.classList.add('menu-fade-in');
    } 
    else {
        menu.classList.remove('menu-fade-in');
        menu.classList.add('menu-fade-out');
        if (!keepOverlay) {
            overlay.classList.remove('overlay-fade-in');
            overlay.classList.add('overlay-fade-out');
            document.body.style.overflow = 'auto';
        }
        setTimeout(() => {
            menu.style.display = 'none';
            if (!keepOverlay) {
                overlay.style.display = 'none';
            }
        }, 200);
    }
}

export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export async function searchStadiums(name, suggestionsContainer, searchValue) {
    try {
        const response = await fetch('http://localhost:3000/stadium/searchStadiums', {
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

        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.display = 'block';

        searchValue.style.borderBottomLeftRadius = '0px';
        searchValue.style.borderBottomRightRadius = '0px';
        suggestionsContainer.style.paddingLeft = '11px';
        suggestionsContainer.style.paddingBottom = '1px';

        if (stadiums.length === 0) {
            const searchResult = document.createElement('div');
            searchResult.classList.add('search-result');
            const stadiumName = document.createElement('h4');
            stadiumName.innerHTML = 'No stadiums found';
            searchResult.appendChild(stadiumName);
            suggestionsContainer.appendChild(searchResult);
        }

        stadiums.forEach(stadium => {
            const stadiumLink = document.createElement('a');
            stadiumLink.href = `stadium.html?stadium=${encodeURIComponent(stadium.stadium_name)}`;
            const searchResult = document.createElement('div');
            searchResult.classList.add('search-result');
            const stadiumName = document.createElement('h4');
            stadiumName.innerHTML = stadium.stadium_name;
            searchResult.appendChild(stadiumName);
            stadiumLink.appendChild(searchResult);
            suggestionsContainer.appendChild(stadiumLink);

            stadiumLink.addEventListener('click', () => {
                searchValue.value = '';
            });
        });

    } catch (error) {
        alert(error.message);
    }
}