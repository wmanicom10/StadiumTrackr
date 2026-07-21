/*  Imports  */
import { getAuthElements, IS_PROD, MIN_LOADING_TIME, STADIUM_IMAGE_PATH } from "../constants.js";
import { calculatePageButtons, createEllipsis, createNavigationButton, createPageButton, formatEventDate, formatEventTime, getEventIcon, getPageFromURL, initializeCreateAccountCaptcha, initializeCustomSelects, isLoggedIn, rewriteUserHomeLinks, setPageInURL, setupSearchAutocomplete, shakeOrReplace } from "../utils.js";
import { registerCommonEvents, registerEventListeners, registerLogOutEvents } from "../events.js";
import { loadAPI } from "../api/load.js";

/*  Async Functions  */
async function loadStadiumInfo(id, slug) {
    try {
        const result = await loadAPI.loadStadiumInfo(id, slug);
        return result;
    } catch (error) {
        console.error(error);
    }
}

async function showEventsUI() {
    try {
        const [result] = await Promise.all([
            loadAPI.loadFeaturedEvents(),
            new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME))
        ]);

        const stadiums = result.stadiums;

        if (stadiums.length === 0) {
            document.getElementById('no-featured-events').style.display = 'block';
            document.getElementById('featured-events').style.display = 'none';
        } else {
            document.getElementById('no-featured-events').style.display = 'none';
            document.getElementById('featured-events').style.display = 'block';

            stadiums.forEach(stadium => {
                const featuredEventContainer = document.createElement('div');
                featuredEventContainer.classList.add('featured-event-container');

                const featuredEventHeader = document.createElement('div');
                featuredEventHeader.classList.add('featured-event-header');

                const featuredEventStadiumName = document.createElement('a');
                featuredEventStadiumName.classList.add('featured-event-stadium-name');
                featuredEventStadiumName.textContent = stadium.stadium_name;
                featuredEventStadiumName.href = IS_PROD && stadium.slug ? `/stadium/${stadium.slug}` : `stadium.html?id=${stadium.stadium_id}`;
                featuredEventHeader.appendChild(featuredEventStadiumName);

                const featuredEventStadiumLocation = document.createElement('h4');
                featuredEventStadiumLocation.classList.add('featured-event-stadium-location');
                featuredEventStadiumLocation.textContent = stadium.city + ', ' + stadium.state;
                featuredEventHeader.appendChild(featuredEventStadiumLocation);

                featuredEventContainer.appendChild(featuredEventHeader);

                const featuredEvent = document.createElement('div');
                featuredEvent.classList.add('featured-event');

                const featuredEventImage = document.createElement('img');
                featuredEventImage.src = STADIUM_IMAGE_PATH + stadium.image;
                featuredEvent.appendChild(featuredEventImage);

                const eventInfo = document.createElement('div');
                eventInfo.classList.add('event-info');

                const eventStadiumName = document.createElement('h4');
                eventStadiumName.classList.add('event-stadium-name');
                eventStadiumName.textContent = stadium.nextEvent.name;
                eventInfo.appendChild(eventStadiumName);

                const eventInfoContainer = document.createElement('div');
                eventInfoContainer.classList.add('event-info-container');

                const eventDate = document.createElement('h4');
                eventDate.textContent = formatEventDate(stadium.nextEvent.dates.start.localDate);
                eventInfoContainer.appendChild(eventDate);

                const eventTime = document.createElement('h4');
                eventTime.textContent = formatEventTime(stadium.nextEvent.dates.start.dateTime, stadium.nextEvent.dates.timezone);
                eventInfoContainer.appendChild(eventTime);

                eventInfo.appendChild(eventInfoContainer);

                featuredEvent.appendChild(eventInfo);

                const featuredEventLink = document.createElement('a');
                featuredEventLink.classList.add('featured-event-link');
                featuredEventLink.href = stadium.nextEvent.url;
                featuredEventLink.target = '_blank';
                featuredEventLink.rel = 'noopener noreferrer';
                featuredEventLink.textContent = 'Buy Tickets →';
                featuredEvent.appendChild(featuredEventLink);
                
                featuredEventContainer.appendChild(featuredEvent);

                document.getElementById('featured-events').appendChild(featuredEventContainer);
            });
        }

        document.getElementById('featured-events-skeleton').style.display = 'none';
        document.getElementById('featured-events').style.display = 'block';
        
    } catch (error) {
        console.error(error);
    }
}

async function showStadiumUI(stadiumId, slug) {
    const result = await loadStadiumInfo(stadiumId, slug);
    const id = result.stadiumInfo.stadium.id;

    document.title = `${result.stadiumInfo.stadium.name} Events - StadiumTrackr`;
    document.getElementById('events-stadium-name').textContent = `${result.stadiumInfo.stadium.name} Events`;

    const stadiumImage = document.createElement('img');
    stadiumImage.id = 'stadium-image';
    stadiumImage.src = STADIUM_IMAGE_PATH + result.stadiumInfo.stadium.image;
    document.querySelector('main').prepend(stadiumImage);
    stadiumImage.onload = () => {
        stadiumImage.classList.add('loaded');
    };

    document.getElementById('events-container').style.display = 'none';
    document.getElementById('events-stadium').style.display = 'block';

    try {
        const [eventsResult] = await Promise.all([
            loadAPI.loadStadiumEvents(id),
            new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME))
        ]);

        const events = eventsResult.events;

        if (events.length === 0) {
            document.getElementById('no-stadium-events-container').style.display = 'block';
        } else {
            createStadiumEventsPagination(events, slug, 18);
        }

        document.getElementById('events-stadium-name-skeleton').style.display = 'none';
        document.getElementById('stadium-events-skeleton').style.display = 'none';
        document.getElementById('events-stadium-name').style.display = 'inline';
        document.getElementById('stadium-events').style.display = 'block';
        
    } catch (error) {
        console.error(error);
    }
}

/*  Functions  */
function createStadiumEventsPagination(events, slug, perPage = 18) {
    const pageCount = Math.ceil(events.length / perPage);
    let currentPage = Math.min(getEventsPage(slug), pageCount) || 1;

    function renderPage(page) {
        const stadiumEventsContainer = document.getElementById('stadium-events');
        stadiumEventsContainer.innerHTML = '';
        const start = (page - 1) * perPage;
        const end = start + perPage;
        events.slice(start, end).forEach(event => {
            renderStadiumEventCard(event, stadiumEventsContainer);
        });
    }

    function renderPageNumbers() {
        const stadiumEventsPageSelector = document.getElementsByClassName('events-page-selector')[0];
        stadiumEventsPageSelector.innerHTML = '';
        
        if (pageCount <= 1) return;

        const prevBtn = createNavigationButton('←', currentPage === 1, () => {
            setEventsPage(currentPage - 1, slug);
        });
        stadiumEventsPageSelector.appendChild(prevBtn);
        
        calculatePageButtons(currentPage, pageCount).forEach(item => {
            stadiumEventsPageSelector.appendChild(item === '...' ? createEllipsis() : createPageButton(item, currentPage, (page) => setEventsPage(page, slug)));
        });
        
        const nextBtn = createNavigationButton('→', currentPage === pageCount, () => {
            setEventsPage(currentPage + 1, slug);
        });
        stadiumEventsPageSelector.appendChild(nextBtn);
    }

    renderPage(currentPage);
    renderPageNumbers();
}

function getEventsPage(slug) {
    if (slug) {
        const pathParts = window.location.pathname.split('/');
        const pageIndex = pathParts.indexOf('page');
        return pageIndex !== -1 ? parseInt(pathParts[pageIndex + 1]) || 1 : 1;
    }
    return getPageFromURL();
}

function renderStadiumEventCard(event, container) {
    const eventContainer = document.createElement('div');
    eventContainer.classList.add('stadium-event');

    const icon = document.createElement('img');
    icon.src = getEventIcon(event.classifications[0].genre.name);

    const info = document.createElement('div');
    info.classList.add('event-info');

    const name = document.createElement('h4');
    name.textContent = event.name;
    name.classList.add('event-stadium-name');

    const infoContainer = document.createElement('div');
    infoContainer.classList.add('event-info-container');

    const date = document.createElement('h4');
    date.textContent = formatEventDate(event.dates.start.localDate);

    const time = document.createElement('h4');
    time.textContent = formatEventTime(event.dates.start.dateTime, event.dates.timezone);

    const link = document.createElement('a');
    link.classList.add('upcoming-event-link');
    link.href = event.url;
    link.target = '_blank';
    link.textContent = 'Buy Tickets →'

    infoContainer.appendChild(date);
    infoContainer.appendChild(time);
    info.appendChild(name);
    info.appendChild(infoContainer);
    eventContainer.appendChild(icon);
    eventContainer.appendChild(info);
    eventContainer.appendChild(link);

    container.appendChild(eventContainer);
}

function setEventsPage(page, slug) {
    if (slug) {
        window.location.href = `/events/${slug}/page/${page}`;
    } else {
        setPageInURL(page);
    }
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    rewriteUserHomeLinks();
    registerEventListeners(getAuthElements());
    registerCommonEvents();
    registerLogOutEvents();
    initializeCustomSelects();
    initializeCreateAccountCaptcha();
    setupSearchAutocomplete('logged-out-nav-search', 'logged-out-search-field-nav', 'logged-out-nav-autocomplete-list');
    setupSearchAutocomplete('logged-out-sidebar-nav-search', 'logged-out-sidebar-search-field-nav', 'logged-out-sidebar-nav-autocomplete-list');
    setupSearchAutocomplete('logged-in-nav-search', 'logged-in-search-field-nav', 'logged-in-nav-autocomplete-list');
    setupSearchAutocomplete('logged-in-sidebar-nav-search', 'logged-in-sidebar-search-field-nav', 'logged-in-sidebar-nav-autocomplete-list');
});

window.onload = async () => {
    const params = new URLSearchParams(window.location.search);

    const pathParts = window.location.pathname.split('/');
    const slug = IS_PROD && pathParts[1] === 'events' && pathParts[2] && pathParts[2] !== 'page' ? pathParts[2] : null;
    const stadiumId = params.get('id') || null;

    if (isLoggedIn() && slug) {
        showStadiumUI(null, slug);
    } else if (isLoggedIn() && stadiumId) {
        showStadiumUI(stadiumId, null);
    } else {
        showEventsUI();
    }
};