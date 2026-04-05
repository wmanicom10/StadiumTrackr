/*  Imports  */
import { getAuthElements, getHeaderElements, MIN_LOADING_TIME } from "../constants.js";
import { formatEventDate, formatEventTime, getEventIcon, getPageFromURL, getUsername, initializeCustomSelects, isLoggedIn, setPageInURL, syncSelectFromURL, truncateUsername } from "../utils.js";
import { registerCommonEvents, registerEventListeners, registerLogOutEvents } from "../events.js";
import { stadiumAPI } from "../api/stadium.js"

/*  Variables  */
const eventElements = {
    featuredEvents: document.getElementById('featured-events'),
    userEvents: document.getElementById('user-events'),
    eventsPageSelector: document.getElementsByClassName('events-page-selector')[0],
    stadiumEventsPageSelector: document.getElementsByClassName('events-page-selector')[1],
    eventFilter: document.getElementById('event-filter'),
    sortFilter: document.getElementById('sort-filter')
};

/*  Async Functions  */
async function loadStadiumInfo(id) {
    try {
        const result = await stadiumAPI.loadStadiumInfo(id);
        const { stadium } = result.stadiumInfo;
        return stadium.name;
    } catch (error) {
        alert(error.message);
    }
}

async function showLoggedInUI(username, event, sort) {
    const { loggedInHeader, loggedOutHeader, loggedInHeaderUsername, sidebarUsername } = getHeaderElements();
    
    const displayName = truncateUsername(username);
    loggedInHeaderUsername.textContent = displayName;
    sidebarUsername.textContent = displayName;
    loggedOutHeader.style.display = 'none';
    loggedInHeader.style.display = 'flex';

    try {
        const [result] = await Promise.all([
            stadiumAPI.loadLoggedInEvents(username, event, sort),
            new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME))
        ]);

        const stadiums = result.stadiums;

        if (stadiums.length === 0) {
            document.getElementById('no-events-container').style.display = 'block';
        } else {
            createEventsPagination(eventElements, stadiums, renderEventCard, 10);
        }

        document.getElementById('events-filter-bar-skeleton').style.display = 'none';
        document.getElementById('user-events-skeleton').style.display = 'none';
        document.getElementById('events-filter-bar').style.display = 'block'
        document.getElementById('user-events').style.display = 'block';
        
    } catch (error) {
        alert('Failed to load events: ' + error.message);
    }
}

async function showLoggedOutUI() {
    try {
        const [result] = await Promise.all([
            stadiumAPI.loadLoggedOutEvents(),
            new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME))
        ]);

        const stadiums = result.stadiums;

        stadiums.forEach(stadium => {
            const featuredEventContainer = document.createElement('div');
            featuredEventContainer.classList.add('featured-event-container');

            const featuredEventHeader = document.createElement('div');
            featuredEventHeader.classList.add('featured-event-header');

            const featuredEventStadiumName = document.createElement('h3');
            featuredEventStadiumName.classList.add('featured-event-stadium-name');
            featuredEventStadiumName.textContent = stadium.stadium_name;
            featuredEventHeader.appendChild(featuredEventStadiumName);

            const featuredEventStadiumLocation = document.createElement('h4');
            featuredEventStadiumLocation.classList.add('featured-event-stadium-location');
            featuredEventStadiumLocation.textContent = stadium.city + ', ' + stadium.state;
            featuredEventHeader.appendChild(featuredEventStadiumLocation);

            featuredEventContainer.appendChild(featuredEventHeader);

            const featuredEvent = document.createElement('div');
            featuredEvent.classList.add('featured-event');

            const featuredEventImage = document.createElement('img');
            featuredEventImage.src = getEventIcon(stadium.nextEvent.classifications[0].genre.name);
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

            eventElements.featuredEvents.appendChild(featuredEventContainer);
        });

        document.getElementById('featured-events-skeleton').style.display = 'none';
        document.getElementById('featured-events').style.display = 'block';
        
    } catch (error) {
        alert('Failed to load events: ' + error.message);
    }
}

async function showStadiumUI(stadiumId) {
    const stadiumName = await loadStadiumInfo(stadiumId);
    document.title = `${stadiumName} Events - StadiumTrackr`;
    document.getElementById('events-stadium-name').textContent = `${stadiumName} Events`;

    document.getElementById('events-logged-out').style.display = 'none';
    document.getElementById('events-logged-in').style.display = 'none';

    try {
        const [result] = await Promise.all([
            stadiumAPI.loadStadiumEvents(stadiumId),
            new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME))
        ]);

        const events = result.events;

        if (events.length === 0) {
            document.getElementById('no-stadium-events-container').style.display = 'block';
        } else {
            createStadiumEventsPagination(events, 10);
        }

        document.getElementById('stadium-events-skeleton').style.display = 'none';
        document.getElementById('stadium-events').style.display = 'block';
        
    } catch (error) {
        alert('Failed to load events: ' + error.message);
    }
}

/*  Functions  */
function applyFilter() {
    const event = eventElements.eventFilter.value;
    const sort = eventElements.sortFilter.value;
    const params = new URLSearchParams();
    if (event !== 'all') params.set('event', event);
    if (sort !== 'date-asc') params.set('sort', sort);
    window.location.search = params.toString();
}

function createEventsPagination(eventElements, stadiums, renderEventCallback, perPage = 10) {
    const pageCount = Math.ceil(stadiums.length / perPage);
    let currentPage = Math.min(getPageFromURL(), pageCount) || 1;

    function renderPage(page) {
        eventElements.userEvents.innerHTML = '';
        const start = (page - 1) * perPage;
        const end = start + perPage;
        stadiums.slice(start, end).forEach(stadium => {
            renderEventCallback(stadium, eventElements.userEvents);
        });
    }

    function renderPageNumbers() {
        eventElements.eventsPageSelector.innerHTML = '';
        
        if (pageCount <= 1) {
            return;
        }

        const prevBtn = createNavigationButton('←', currentPage === 1, () => {
            setPageInURL(currentPage - 1);
        });
        eventElements.eventsPageSelector.appendChild(prevBtn);
        
        calculatePageButtons(currentPage, pageCount).forEach(item => {
            eventElements.eventsPageSelector.appendChild(item === '...' ? createEllipsis() : createPageButton(item));
        });
        
        const nextBtn = createNavigationButton('→', currentPage === pageCount, () => {
            setPageInURL(currentPage + 1);
        });
        eventElements.eventsPageSelector.appendChild(nextBtn);
    }

    function createPageButton(pageNum) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = pageNum;
        btn.dataset.page = pageNum;
        if (pageNum === currentPage) btn.classList.add('active');
        btn.addEventListener('click', () => { setPageInURL(pageNum); });
        return btn;
    }

    function createNavigationButton(text, disabled, onClick) {
        const btn = document.createElement('button');
        btn.className = 'page-btn arrow';
        btn.textContent = text;
        btn.disabled = disabled;
        if (!disabled) btn.addEventListener('click', onClick);
        return btn;
    }

    function createEllipsis() {
        const span = document.createElement('span');
        span.className = 'page-ellipsis';
        span.textContent = '...';
        return span;
    }

    function calculatePageButtons(current, total) {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        if (current <= 3) return [1, 2, 3, 4, 5, '...', total];
        if (current >= total - 2) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
        return [1, '...', current - 1, current, current + 1, '...', total];
    }

    renderPage(currentPage);
    renderPageNumbers();
    requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function createStadiumEventsPagination(events, perPage = 10) {
    const pageCount = Math.ceil(events.length / perPage);
    let currentPage = Math.min(getPageFromURL(), pageCount) || 1;

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
        eventElements.stadiumEventsPageSelector.innerHTML = '';
        
        if (pageCount <= 1) {
            return;
        }

        const prevBtn = createNavigationButton('←', currentPage === 1, () => {
            setPageInURL(currentPage - 1);
        });
        eventElements.stadiumEventsPageSelector.appendChild(prevBtn);
        
        calculatePageButtons(currentPage, pageCount).forEach(item => {
            eventElements.stadiumEventsPageSelector.appendChild(item === '...' ? createEllipsis() : createPageButton(item));
        });
        
        const nextBtn = createNavigationButton('→', currentPage === pageCount, () => {
            setPageInURL(currentPage + 1);
        });
        eventElements.stadiumEventsPageSelector.appendChild(nextBtn);
    }

    function createPageButton(pageNum) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = pageNum;
        btn.dataset.page = pageNum;
        if (pageNum === currentPage) btn.classList.add('active');
        btn.addEventListener('click', () => { setPageInURL(pageNum); });
        return btn;
    }

    function createNavigationButton(text, disabled, onClick) {
        const btn = document.createElement('button');
        btn.className = 'page-btn arrow';
        btn.textContent = text;
        btn.disabled = disabled;
        if (!disabled) btn.addEventListener('click', onClick);
        return btn;
    }

    function createEllipsis() {
        const span = document.createElement('span');
        span.className = 'page-ellipsis';
        span.textContent = '...';
        return span;
    }

    function calculatePageButtons(current, total) {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        if (current <= 3) return [1, 2, 3, 4, 5, '...', total];
        if (current >= total - 2) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
        return [1, '...', current - 1, current, current + 1, '...', total];
    }

    renderPage(currentPage);
    renderPageNumbers();
    requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function getFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    return {
        event: params.get('event') || 'all',
        sort: params.get('sort') || 'date-asc',
        stadiumId: params.get('id') || null
    };
}

function renderEventCard(stadium, container) {
    const userEventContainer = document.createElement('div');
    userEventContainer.classList.add('user-event-container');

    const userEventHeader = document.createElement('div');
    userEventHeader.classList.add('user-event-header');

    const div = document.createElement('div');

    const userEventStadiumNameLink = document.createElement('a');
    userEventStadiumNameLink.classList.add('user-event-stadium-name');
    userEventStadiumNameLink.href = `stadium.html?id=${stadium.stadium_id}`;

    const userEventStadiumName = document.createElement('h3');
    userEventStadiumName.classList.add('user-event-stadium-name');
    userEventStadiumName.textContent = stadium.stadium_name;
    userEventStadiumNameLink.appendChild(userEventStadiumName);

    div.appendChild(userEventStadiumNameLink);

    const userEventStadiumLocation = document.createElement('h4');
    userEventStadiumLocation.classList.add('user-event-stadium-location');
    userEventStadiumLocation.textContent = stadium.city + ', ' + stadium.state;
    div.appendChild(userEventStadiumLocation);

    userEventHeader.appendChild(div);

    const userEventHeaderControls = document.createElement('div');
    userEventHeaderControls.classList.add('user-event-header-controls');

    const userEventStadiumLink = document.createElement('a');
    userEventStadiumLink.classList.add('user-event-stadium-link');
    userEventStadiumLink.href = `events.html?id=${stadium.stadium_id}`;
    userEventStadiumLink.textContent = 'See All →';
    userEventHeaderControls.appendChild(userEventStadiumLink);

    userEventHeader.appendChild(userEventHeaderControls)

    userEventContainer.appendChild(userEventHeader);

    const userEvent = document.createElement('div');
    userEvent.classList.add('user-event');

    const userEventImage = document.createElement('img');
    userEventImage.src = getEventIcon(stadium.nextEvent.classifications[0].genre.name);
    userEvent.appendChild(userEventImage);

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

    userEvent.appendChild(eventInfo);

    const userEventLink = document.createElement('a');
    userEventLink.classList.add('user-event-link');
    userEventLink.href = stadium.nextEvent.url;
    userEventLink.target = '_blank';
    userEventLink.rel = 'noopener noreferrer';
    userEventLink.textContent = 'Buy Tickets →';
    userEvent.appendChild(userEventLink);
    
    userEventContainer.appendChild(userEvent);

    container.appendChild(userEventContainer);
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
    link.classList.add('upcoming-event-link')
    link.href = event.url;
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

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    registerEventListeners(getAuthElements());
    registerCommonEvents();
    registerLogOutEvents();
    initializeCustomSelects();
});

eventElements.eventFilter.addEventListener('change', applyFilter);
eventElements.sortFilter.addEventListener('change', applyFilter);

window.onload = async () => {
    const username = getUsername();

    const { event, sort, stadiumId } = getFiltersFromURL();
    
    if (isLoggedIn() && stadiumId) {
        showStadiumUI(stadiumId);
    } else if (isLoggedIn()) {
        showLoggedInUI(username, event, sort);
    } else {
        showLoggedOutUI();
    }

    syncSelectFromURL('event-filter', event);
    syncSelectFromURL('sort-filter', sort);
};