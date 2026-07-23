/*  Imports  */
import { DEBOUNCE_TIME, getAuthElements, IS_PROD, MIN_LOADING_TIME, overlay, STADIUM_IMAGE_PATH } from "../constants.js";
import { createToast, debounce, getPageFromURL, initializeCustomSelects, isLoggedIn, renderPageNumbers, renderWithoutTransition, rewriteUserHomeLinks, setupAddStadiumModal, setupSearchAutocomplete, shakeOrReplace, syncSelectFromURL, toggleMenu } from "../utils.js";
import { registerCommonEvents, registerEventListeners, registerUserLogOutEvents } from "../events.js";
import { loadAPI } from "../api/load.js";
import { userAPI } from "../api/user.js";
import { updateAPI } from "../api/update.js";

/*  Variables  */
const elements = {
    editListStadiumMenu: document.getElementById('edit-list-stadium-menu'),
    editListStadiumNote: document.getElementById('edit-list-stadium-note'),
    closeEditListStadiumMenu: document.getElementById('close-edit-list-stadium-menu'),
    editListStadiumName: document.getElementById('edit-list-stadium-name'),
    editListStadiumLocation: document.getElementById('edit-list-stadium-location'),
    editListStadiumImage: document.getElementById('edit-list-stadium-image'),
    editListStadiumSaveButton: document.getElementById('edit-list-stadium-save-button'),
    editListStadiumCancelButton: document.getElementById('edit-list-stadium-cancel-button'),
    createListStadiumMenu: document.getElementById('create-list-stadium-menu'),
    createListStadiumNote: document.getElementById('create-list-stadium-note'),
    closecreateListStadiumMenu: document.getElementById('close-create-list-stadium-menu'),
    createListStadiumName: document.getElementById('create-list-stadium-name'),
    createListStadiumLocation: document.getElementById('create-list-stadium-location'),
    createListStadiumImage: document.getElementById('create-list-stadium-image'),
    createListStadiumSaveButton: document.getElementById('create-list-stadium-save-button'),
    createListStadiumCancelButton: document.getElementById('create-list-stadium-cancel-button')
}

let dragSrcEl = null;
let listShowSelections = new Set(['all']);

/*  Async Functions  */
async function showCreateUI() {
    try {
        const saveButton = document.getElementById('create-list-save-button');
        saveButton.disabled = true;

        function enableSave() {
            saveButton.disabled = false;
        }

        saveButton.addEventListener('click', async () => {
            const listName = document.getElementById('create-list-name').value.trim();
            if (!listName) {
                shakeOrReplace('List name is required.');
                return;
            }

            const listDescription = document.getElementById('create-list-description').value.trim();

            const isRanked = document.getElementById('create-list-ranked').checked;

            const stadiums = Array.from(document.querySelectorAll('.create-list-stadium')).map((el, index) => ({
                stadiumId: el.dataset.stadiumId,
                note: el.querySelector('.create-list-note-button').dataset.note || null,
                orderIndex: index
            }));

            try {
                const result = await updateAPI.createUserList(listName, listDescription, isRanked, stadiums);
                sessionStorage.setItem('toast', JSON.stringify({ type: 'success', message: 'List created successfully.' }));
                if (IS_PROD && result.slug) {
                    window.location.href = `/list/${result.slug}/view`;
                } else {
                    window.location.href = `list.html?mode=view&id=${result.listId}`;
                }
            } catch (error) {
                console.error(error);
                shakeOrReplace(error.message || 'Failed to create list. Please try again.');
            }
        });

        document.getElementById('create-list-container').style.display = 'block';

        document.title = `Create a list - StadiumTrackr`;

        document.getElementById('create-list-name').addEventListener('input', enableSave);
        document.getElementById('create-list-description').addEventListener('input', enableSave);
        document.getElementById('create-list-ranked').addEventListener('change', () => {
            enableSave();
            updateCreateRankNumbers();
        });

        setupCreateListSearch(enableSave);

        document.getElementById('list-skeleton').style.display = 'none';
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to create list.');
    }
}

async function showEditUI(listId, slug) {
    try {
        const saveButton = document.getElementById('edit-list-save-button');
        saveButton.disabled = true;

        function enableSave() {
            saveButton.disabled = false;
        }

        const deleteListMenu = document.getElementById('delete-list-menu');
        document.getElementById('edit-list-delete-button').addEventListener('click', () => toggleMenu(deleteListMenu, true, overlay));
        document.getElementById('close-delete-list-menu').addEventListener('click', () => toggleMenu(deleteListMenu, false, overlay));
        document.getElementById('delete-list-cancel-button').addEventListener('click', () => toggleMenu(deleteListMenu, false, overlay));

        document.getElementById('edit-list-container').style.display = 'block';

        const [result] = await Promise.all([
            userAPI.loadUserList(listId, slug, ['all'], 'all', 'all', 'order'),
            new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME))
        ]);
        const resolvedListId = result.listId || listId;
        const stadiums = result.listStadiums;

        document.title = `Edit your ${result.listName} list - StadiumTrackr`;

        document.getElementById('edit-list-name').value = result.listName;
        document.getElementById('edit-list-description').value = result.listDescription;
        document.getElementById('edit-list-ranked').checked = result.isRanked;

        document.getElementById('edit-list-name').addEventListener('input', enableSave);
        document.getElementById('edit-list-description').addEventListener('input', enableSave);
        document.getElementById('edit-list-ranked').addEventListener('change', () => {
            enableSave();
            updateEditRankNumbers();
        });

        saveButton.addEventListener('click', async () => {
            const listName = document.getElementById('edit-list-name').value.trim();
            if (!listName) {
                shakeOrReplace('List name is required.');
                return;
            }
            const listDescription = document.getElementById('edit-list-description').value.trim();
            const isRanked = document.getElementById('edit-list-ranked').checked;
            const stadiums = Array.from(document.querySelectorAll('.edit-list-stadium')).map((el, index) => ({
                stadiumId: el.dataset.stadiumId,
                note: el.querySelector('.edit-list-note-button').dataset.note || null,
                orderIndex: index
            }));
            try {
                const saveResult = await updateAPI.updateUserList(resolvedListId, listName, listDescription, isRanked, stadiums);
                sessionStorage.setItem('toast', JSON.stringify({ type: 'success', message: 'List saved successfully.' }));
                if (IS_PROD && saveResult.slug) {
                    window.location.href = `/list/${saveResult.slug}/view`;
                } else {
                    window.location.href = `list.html?mode=view&id=${resolvedListId}`;
                }
            } catch (error) {
                console.error(error);
                shakeOrReplace(error.message || 'Failed to save list. Please try again.');
            }
        });

        document.getElementById('delete-list-delete-button').addEventListener('click', async () => {
            try {
                await updateAPI.deleteUserList(resolvedListId);
                sessionStorage.setItem('toast', JSON.stringify({ type: 'success', message: 'List deleted successfully.' }));
                window.location.href = IS_PROD ? `/${username}/lists` : 'user-home.html?tab=lists';
            } catch (error) {
                console.error(error);
                shakeOrReplace(error.message || 'Failed to delete list. Please try again.');
            }
        });

        renderEditListView(stadiums, enableSave);
        setupEditListSearch(enableSave);

        document.getElementById('edit-list-skeleton').style.display = 'none';
        document.getElementById('edit-list-content-container').style.display = 'flex';
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to load list content.');
    }
}

async function showViewUI(listId, slug, view) {
    try {
        const elements = {
            leagueFilter: document.getElementById('view-list-league-filter'),
            countryFilter: document.getElementById('view-list-country-filter'),
            sortFilter: document.getElementById('view-list-sort-filter'),
            clearFiltersButton: document.getElementById('view-list-clear-filters'),
            stadiumsList: document.getElementById('view-list-stadiums'),
            stadiumsPageSelector: document.getElementById('view-list-page-selector'),
            noStadiumsContainer: document.getElementById('view-list-no-stadiums-container'),
            addStadiumMenu: document.getElementById('add-stadium-menu'),
            addStadiumDateVisited: document.getElementById('add-stadium-date-visited'),
            addStadiumNote: document.getElementById('add-stadium-note'),
            closeAddStadiumMenu: document.getElementById('close-add-stadium-menu'),
            addStadiumName: document.getElementById('add-stadium-name'),
            addStadiumLocation: document.getElementById('add-stadium-location'),
            addStadiumImage: document.getElementById('add-stadium-image'),
            addStadiumPhotosInput: document.getElementById('add-stadium-photos-input'),
            addStadiumPhotosPreview: document.getElementById('add-stadium-photos-preview'),
            addStadiumPhotosCount: document.getElementById('add-stadium-photos-count'),
            addStadiumLogButton: document.getElementById('add-stadium-log-button'),
            addStadiumCancelButton: document.getElementById('add-stadium-cancel-button')
        }

        const params = new URLSearchParams(window.location.search);
        const pathParts = window.location.pathname.split('/');

        let sort = 'order';
        let currentPage = 1;
        let league = 'all';
        let country = 'all';
        let show = ['all'];

        if (slug) {
            for (let i = 4; i < pathParts.length - 1; i += 2) {
                if (pathParts[i] === 'sort') sort = pathParts[i + 1] || 'order';
                if (pathParts[i] === 'page') currentPage = parseInt(pathParts[i + 1]) || 1;
                if (pathParts[i] === 'league') league = pathParts[i + 1] || 'all';
                if (pathParts[i] === 'country') country = pathParts[i + 1] || 'all';
                if (pathParts[i] === 'show') show = pathParts[i + 1]?.split(',') || ['all'];
            }
        } else {
            sort = params.get('sort') || 'order';
            league = params.get('league') || 'all';
            country = params.get('country') || 'all';
            const showParam = params.get('show');
            show = showParam ? showParam.split(',') : ['all'];
        }

        syncListShowFilter();
        setupListShowFilter(listId, slug, view);
        setupFilterHandlers(elements, listId, slug, view);

        syncSelectFromURL('view-list-league-filter', league);
        syncSelectFromURL('view-list-country-filter', country);
        syncSelectFromURL('view-list-sort-filter', sort);

        document.getElementById('view-list-container').style.display = 'flex';

        const [result] = await Promise.all([
            userAPI.loadUserList(listId, slug, show, league, country, sort),
            new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME))
        ]);
        console.log(result)
        const stadiums = result.listStadiums;
        const resolvedSlug = result.slug || slug;
        const resolvedListId = result.listId || listId;

        document.title = `${result.listName}, a list of stadiums - StadiumTrackr`;

        const stadiumImage = document.createElement('img');
        stadiumImage.id = 'stadium-image';
        stadiumImage.src = STADIUM_IMAGE_PATH + result.backdropImage;
        stadiumImage.alt = result.listStadiums[0]?.stadium_name || 'Stadium image';
        document.querySelector('main').prepend(stadiumImage);
        stadiumImage.onload = () => stadiumImage.classList.add('loaded');

        document.getElementById('view-list-name').textContent = result.listName;
        result.listDescription ? document.getElementById('view-list-description').textContent = result.listDescription : document.getElementById('view-list-description').style.display = 'none';

        if (view === 'list') {
            elements.stadiumsList.classList.add('list-view-mode');
            document.getElementById('view-list-filters-container').classList.add('list-view-mode-filters');
            renderListView(elements, stadiums, result.isRanked, resolvedSlug, sort, currentPage);
        } else {
            elements.stadiumsList.classList.remove('list-view-mode');
            document.getElementById('view-list-filters-container').classList.remove('list-view-mode-filters');
            renderWithoutTransition(elements, stadiums, result.isRanked, resolvedSlug, sort, currentPage);
        }

        if (IS_PROD && resolvedSlug) {
            document.getElementById('edit-list-button').href = `/list/${resolvedSlug}/edit`;
            document.getElementById('list-view-grid').href = `/list/${resolvedSlug}/view`;
            document.getElementById('list-view-list').href = `/list/${resolvedSlug}/view`;
        } else {
            document.getElementById('edit-list-button').href = `list.html?mode=edit&id=${resolvedListId}`;
            document.getElementById('list-view-grid').href = `list.html?mode=view&id=${resolvedListId}`;
            document.getElementById('list-view-list').href = `list.html?mode=view&id=${resolvedListId}&view=list`;
        }

        document.getElementById('list-skeleton').style.display = 'none';
        if (stadiums.length > 0) document.getElementById('view-list-stadiums').style.display = 'flex';
        document.getElementById('view-list-filters-container').style.display = 'block';
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to load list content');
    }
}

/*  Functions  */
function setupListShowFilter(listId, slug, view) {
    const trigger = document.getElementById('list-show-trigger');
    const dropdown = document.getElementById('list-show-dropdown');
    const valueDisplay = document.getElementById('list-show-value');
    const options = dropdown.querySelectorAll('.custom-select-option');

    document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('list-show-wrapper');
        if (!wrapper.contains(e.target)) {
            dropdown.classList.remove('active');
            trigger.classList.remove('active');
        }
    });

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.custom-select-dropdown.active').forEach(d => {
            d.classList.remove('active');
            d.parentElement.querySelector('.custom-select-trigger')?.classList.remove('active');
        });
        dropdown.classList.toggle('active');
        trigger.classList.toggle('active');
    });

    options.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = option.dataset.value;

            if (value === 'all') {
                listShowSelections.clear();
                listShowSelections.add('all');
                options.forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
            } else {
                listShowSelections.delete('all');
                options[0].classList.remove('selected');

                if (value === 'visited') listShowSelections.delete('not-visited');
                if (value === 'not-visited') listShowSelections.delete('visited');
                if (value === 'wishlist') listShowSelections.delete('not-wishlist');
                if (value === 'not-wishlist') listShowSelections.delete('wishlist');

                if (listShowSelections.has(value)) {
                    listShowSelections.delete(value);
                    option.classList.remove('selected');
                } else {
                    listShowSelections.add(value);
                    option.classList.add('selected');
                }

                if (listShowSelections.size === 0) {
                    listShowSelections.add('all');
                    options[0].classList.add('selected');
                }

                options.forEach(o => {
                    if (o.dataset.value !== 'all') {
                        o.classList.toggle('selected', listShowSelections.has(o.dataset.value));
                    }
                });
            }

            if (listShowSelections.has('all')) {
                valueDisplay.textContent = 'All';
            } else {
                const labels = {
                    visited: 'Visited',
                    'not-visited': 'Not Visited',
                    wishlist: 'Wishlist',
                    'not-wishlist': 'Not In Wishlist'
                };
                valueDisplay.textContent = [...listShowSelections].map(v => labels[v]).join(', ');
            }

            applyListShowFilter(listId, slug, view);
        });
    });
}

function applyListShowFilter(listId, slug, view) {
    if (IS_PROD && slug) {
        const pathParts = window.location.pathname.split('/');
        let sort = null, league = null, country = null;
        for (let i = 4; i < pathParts.length - 1; i += 2) {
            if (pathParts[i] === 'league') league = pathParts[i + 1];
            if (pathParts[i] === 'country') country = pathParts[i + 1];
            if (pathParts[i] === 'sort') sort = pathParts[i + 1];
        }
        let path = `/list/${slug}/view`;
        if (!listShowSelections.has('all')) path += `/show/${[...listShowSelections].join(',')}`;
        if (league) path += `/league/${league}`;
        if (country) path += `/country/${country}`;
        if (sort) path += `/sort/${sort}`;
        window.location.href = path;
    } else {
        const params = new URLSearchParams(window.location.search);
        params.set('mode', 'view');
        params.set('id', listId);
        params.set('page', '1');
        if (view) params.set('view', view);
        if (listShowSelections.has('all')) {
            params.delete('show');
        } else {
            params.set('show', [...listShowSelections].join(','));
        }
        window.location.search = params.toString();
    }
}

function syncListShowFilter() {
    const pathParts = window.location.pathname.split('/');
    let showValue = null;
    if (IS_PROD) {
        for (let i = 4; i < pathParts.length - 1; i += 2) {
            if (pathParts[i] === 'show') showValue = pathParts[i + 1];
        }
    } else {
        showValue = new URLSearchParams(window.location.search).get('show');
    }

    if (showValue) {
        listShowSelections.clear();
        showValue.split(',').forEach(v => listShowSelections.add(v));
    } else {
        listShowSelections.clear();
        listShowSelections.add('all');
    }

    const options = document.querySelectorAll('#list-show-dropdown .custom-select-option');
    const valueDisplay = document.getElementById('list-show-value');
    if (!valueDisplay) return;

    options.forEach(o => o.classList.toggle('selected', listShowSelections.has(o.dataset.value)));

    if (listShowSelections.has('all')) {
        valueDisplay.textContent = 'All';
    } else {
        const labels = {
            visited: 'Visited',
            'not-visited': 'Not Visited',
            wishlist: 'Wishlist',
            'not-wishlist': 'Not In Wishlist'
        };
        valueDisplay.textContent = [...listShowSelections].map(v => labels[v]).join(', ');
    }
}

function renderEditListView(stadiums, enableSave) {
    if (stadiums.length === 0) {
        document.getElementById('edit-list-no-stadiums').style.display = 'block';
        document.getElementById('edit-list-stadiums').style.display = 'none';
    } else {
        document.getElementById('edit-list-no-stadiums').style.display = 'none';
        document.getElementById('edit-list-stadiums').style.display = 'flex';

        stadiums.forEach(stadium => {
            const editListStadium = document.createElement('div');
            editListStadium.classList.add('edit-list-stadium');

            editListStadium.dataset.stadiumId = stadium.stadium_id;

            const editListStadiumImage = document.createElement('img');
            editListStadiumImage.classList.add('edit-list-stadium-image');
            editListStadiumImage.src = STADIUM_IMAGE_PATH + stadium.image;
            editListStadiumImage.alt = stadium.stadium_name;
            editListStadiumImage.draggable = false;

            const editListStadiumInfoContainer = document.createElement('div');
            editListStadiumInfoContainer.classList.add('edit-list-stadium-info-container');

            const editListStadiumInfoHeader = document.createElement('div');
            editListStadiumInfoHeader.classList.add('edit-list-stadium-info-header');

            const editListStadiumName = document.createElement('a');
            editListStadiumName.classList.add('edit-list-stadium-name');
            editListStadiumName.href = IS_PROD && stadium.slug ? `/stadium/${stadium.slug}` : `stadium.html?id=${stadium.stadium_id}`;
            editListStadiumName.textContent = stadium.stadium_name;
            editListStadiumName.draggable = false;

            const editListStadiumLocation = document.createElement('p');
            editListStadiumLocation.classList.add('edit-list-stadium-location');
            editListStadiumLocation.textContent = stadium.city + ', ' + stadium.state;

            editListStadiumInfoHeader.appendChild(editListStadiumName);
            editListStadiumInfoHeader.appendChild(editListStadiumLocation);
                        
            editListStadiumInfoContainer.appendChild(editListStadiumInfoHeader);

            const editListStadiumNote = document.createElement('p');
            editListStadiumNote.classList.add('edit-list-stadium-note');

            if (stadium.note) {
                editListStadiumNote.textContent = stadium.note;
            } else {
                editListStadiumNote.style.display = 'none';
            }

            editListStadiumInfoContainer.appendChild(editListStadiumNote);

            const editListNoteButton = document.createElement('button');
            editListNoteButton.classList.add('edit-list-note-button');
            editListNoteButton.textContent = stadium.note ? 'Edit note' : 'Add note';
            editListNoteButton.dataset.note = stadium.note || '';
            editListNoteButton.addEventListener('click', () => {
                toggleMenu(elements.editListStadiumMenu, true, overlay);
                setupEditListStadiumModal(stadium.stadium_id, stadium.stadium_name, stadium.city, stadium.state, stadium.image, editListNoteButton.dataset.note, editListStadiumNote, editListNoteButton, elements, enableSave);
            });

            editListStadiumInfoContainer.appendChild(editListNoteButton);

            const editListDeleteButton = document.createElement('button');
            editListDeleteButton.classList.add('edit-list-delete-button');
            editListDeleteButton.setAttribute('aria-label', `Remove ${stadium.stadium_name} from list`);
            editListDeleteButton.addEventListener('click', () => {
                editListStadium.style.opacity = '0';
                setTimeout(() => {
                    editListStadium.remove();
                    enableSave();
                    updateEditRankNumbers();
                    const remaining = document.querySelectorAll('.edit-list-stadium');
                    if (remaining.length === 0) {
                        document.getElementById('edit-list-no-stadiums').style.display = 'block';
                        document.getElementById('edit-list-stadiums').style.display = 'none';
                    }
                }, 300);
            });

            const editListDeleteImage = document.createElement('img');
            editListDeleteImage.src = '/images/icons/trash.png';
            editListDeleteImage.alt = 'Delete stadium';
            editListDeleteButton.appendChild(editListDeleteImage);

            editListStadium.appendChild(editListStadiumImage);
            editListStadium.appendChild(editListStadiumInfoContainer);
            editListStadium.appendChild(editListDeleteButton);

            editListStadium.draggable = true;

            editListStadium.addEventListener('dragstart', (e) => {
                dragSrcEl = editListStadium;
                e.dataTransfer.effectAllowed = 'move';
                editListStadium.style.opacity = '0.4';
            });

            editListStadium.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (editListStadium !== dragSrcEl) {
                    editListStadium.style.outline = '2px solid var(--color-blue)';
                    editListStadium.style.outlineOffset = '3px';
                }
            });

            editListStadium.addEventListener('dragleave', () => {
                editListStadium.style.outline = '';
                editListStadium.style.outlineOffset = '';
            });

            editListStadium.addEventListener('drop', (e) => {
                e.stopPropagation();
                if (dragSrcEl !== editListStadium) {
                    const container = document.getElementById('edit-list-stadiums');
                    const children = Array.from(container.children);
                    const srcIndex = children.indexOf(dragSrcEl);
                    const targetIndex = children.indexOf(editListStadium);
                    if (srcIndex < targetIndex) {
                        container.insertBefore(dragSrcEl, editListStadium.nextSibling);
                    } else {
                        container.insertBefore(dragSrcEl, editListStadium);
                    }
                    enableSave();
                    updateEditRankNumbers();
                }
                editListStadium.style.outline = '';
                editListStadium.style.outlineOffset = '';
            });

            editListStadium.addEventListener('dragend', () => {
                editListStadium.style.opacity = '';
                document.querySelectorAll('.edit-list-stadium').forEach(el => {
                    el.style.outline = '';
                    el.style.outlineOffset = '';
                });
            });

            document.getElementById('edit-list-stadiums').appendChild(editListStadium);
        });
        updateEditRankNumbers();
    }
}

function renderListView(elements, stadiums, isRanked, resolvedSlug, sort, currentPage) {
    if (stadiums.length === 0) {
        elements.stadiumsList.style.display = 'none';
        elements.stadiumsPageSelector.style.display = 'none';
        elements.noStadiumsContainer.style.display = 'block';
    } else {
        elements.stadiumsList.style.display = 'flex';
        elements.stadiumsPageSelector.style.display = 'flex';
        elements.noStadiumsContainer.style.display = 'none';

        const perPage = 10;
        
        const pageCount = Math.ceil(stadiums.length / perPage);
        currentPage = Math.min(IS_PROD ? currentPage : getPageFromURL(), pageCount) || 1;        
        
        function renderPage(page) {
            elements.stadiumsList.innerHTML = '';
            const start = (page - 1) * perPage;
            const end = start + perPage;
            stadiums.slice(start, end).forEach(stadium => {
                const listViewStadium = document.createElement('div');
                listViewStadium.classList.add('list-view-stadium');

                if (isRanked) {
                    const listViewRankedBadge = document.createElement('div');
                    listViewRankedBadge.classList.add('list-view-ranked-badge');
                    listViewRankedBadge.textContent = stadium.order_index + 1;
                    listViewStadium.appendChild(listViewRankedBadge);
                }

                const listViewStadiumImage = document.createElement('img');
                listViewStadiumImage.classList.add('list-view-stadium-image');
                listViewStadiumImage.src = STADIUM_IMAGE_PATH + stadium.image;

                const listViewStadiumInfoContainer = document.createElement('div');
                listViewStadiumInfoContainer.classList.add('list-view-stadium-info-container');

                const listViewStadiumInfoHeader = document.createElement('div');
                listViewStadiumInfoHeader.classList.add('list-view-stadium-info-header');

                const listViewStadiumName = document.createElement('a');
                listViewStadiumName.classList.add('list-view-stadium-name');
                listViewStadiumName.href = IS_PROD && stadium.slug ? `/stadium/${stadium.slug}` : `stadium.html?id=${stadium.stadium_id}`;
                listViewStadiumName.textContent = stadium.stadium_name;

                const listViewStadiumLocation = document.createElement('h4');
                listViewStadiumLocation.classList.add('list-view-stadium-location');
                listViewStadiumLocation.textContent = stadium.city + ', ' + stadium.state;

                listViewStadiumInfoHeader.appendChild(listViewStadiumName);
                listViewStadiumInfoHeader.appendChild(listViewStadiumLocation);

                const listViewStadiumNote = document.createElement('p');
                listViewStadiumNote.classList.add('list-view-stadium-note');
                listViewStadiumNote.textContent = stadium.note || '';

                listViewStadiumInfoContainer.appendChild(listViewStadiumInfoHeader);
                listViewStadiumInfoContainer.appendChild(listViewStadiumNote);

                listViewStadium.appendChild(listViewStadiumImage);
                listViewStadium.appendChild(listViewStadiumInfoContainer);

                elements.stadiumsList.appendChild(listViewStadium);
            });
        }

        renderPage(currentPage);

        const onPageChange = IS_PROD && resolvedSlug ? (page) => {
            const parts = window.location.pathname.split('/');
            let path = `/list/${resolvedSlug}/view`;
            let show = null, sort2 = null, league = null, country = null;
            for (let i = 4; i < parts.length - 1; i += 2) {
                if (parts[i] === 'show') show = parts[i + 1];
                if (parts[i] === 'sort') sort2 = parts[i + 1];
                if (parts[i] === 'league') league = parts[i + 1];
                if (parts[i] === 'country') country = parts[i + 1];
            }
            if (show) path += `/show/${show}`;
            if (league) path += `/league/${league}`;
            if (country) path += `/country/${country}`;
            if (sort2) path += `/sort/${sort2}`;
            if (page !== 1) path += `/page/${page}`;
            window.location.href = path;
        } : null;

        renderPageNumbers(elements, currentPage, pageCount, onPageChange);
    }
}

function setupCreateListSearch(enableSave) {
    const searchField = document.getElementById('create-list-search-field');
    const suggestionsContainer = document.getElementById('create-list-autocomplete-list');

    const debouncedSearch = debounce(async (name) => {
        if (!name) {
            suggestionsContainer.classList.remove('active');
            return;
        }
        const result = await loadAPI.searchStadiums(name);
        const stadiums = result.stadiums;

        suggestionsContainer.innerHTML = '';
        if (stadiums.length === 0) {
            const noResults = document.createElement('div');
            noResults.classList.add('autocomplete-item', 'no-results');
            noResults.textContent = 'No stadiums found';
            noResults.style.cursor = 'default';
            suggestionsContainer.appendChild(noResults);
            suggestionsContainer.classList.add('active');
            return;
        }

        suggestionsContainer.classList.add('active');
        stadiums.forEach(stadium => {
            const item = document.createElement('div');
            item.classList.add('autocomplete-item');
            item.textContent = stadium.stadium_name;
            item.addEventListener('click', () => {
                const existing = document.querySelector(`.create-list-stadium[data-stadium-id="${stadium.stadium_id}"]`);
                if (existing) {
                    shakeOrReplace('This stadium is already in your list.');
                    return;
                }

                document.getElementById('create-list-no-stadiums').style.display = 'none';
                document.getElementById('create-list-stadiums').style.display = 'flex';

                const createListStadium = document.createElement('div');
                createListStadium.classList.add('create-list-stadium');

                createListStadium.dataset.stadiumId = stadium.stadium_id;

                const createListStadiumImage = document.createElement('img');
                createListStadiumImage.classList.add('create-list-stadium-image');
                createListStadiumImage.src = STADIUM_IMAGE_PATH + stadium.image;
                createListStadiumImage.draggable = false;

                const createListStadiumInfoContainer = document.createElement('div');
                createListStadiumInfoContainer.classList.add('create-list-stadium-info-container');

                const createListStadiumInfoHeader = document.createElement('div');
                createListStadiumInfoHeader.classList.add('create-list-stadium-info-header');

                const createListStadiumName = document.createElement('a');
                createListStadiumName.classList.add('create-list-stadium-name');
                createListStadiumName.href = IS_PROD && stadium.slug ? `/stadium/${stadium.slug}` : `stadium.html?id=${stadium.stadium_id}`;
                createListStadiumName.textContent = stadium.stadium_name;
                createListStadiumName.draggable = false;

                const createListStadiumLocation = document.createElement('h4');
                createListStadiumLocation.classList.add('create-list-stadium-location');
                createListStadiumLocation.textContent = stadium.city + ', ' + stadium.state;

                createListStadiumInfoHeader.appendChild(createListStadiumName);
                createListStadiumInfoHeader.appendChild(createListStadiumLocation);
                            
                createListStadiumInfoContainer.appendChild(createListStadiumInfoHeader);

                const createListStadiumNote = document.createElement('p');
                createListStadiumNote.classList.add('create-list-stadium-note');

                createListStadiumInfoContainer.appendChild(createListStadiumNote);

                const createListNoteButton = document.createElement('button');
                createListNoteButton.classList.add('create-list-note-button');
                createListNoteButton.textContent = stadium.note ? 'Edit note' : 'Add note';
                createListNoteButton.dataset.note = stadium.note || '';
                createListNoteButton.addEventListener('click', () => {
                    toggleMenu(elements.createListStadiumMenu, true, overlay);
                    setupCreateListStadiumModal(stadium.stadium_id, stadium.stadium_name, stadium.city, stadium.state, stadium.image, createListNoteButton.dataset.note, createListStadiumNote, createListNoteButton, elements, enableSave);
                });

                createListStadiumInfoContainer.appendChild(createListNoteButton);

                const createListDeleteButton = document.createElement('button');
                createListDeleteButton.classList.add('create-list-delete-button');
                createListDeleteButton.addEventListener('click', () => {
                    createListStadium.style.opacity = '0';
                    setTimeout(() => {
                        createListStadium.remove();
                        enableSave();
                        updateCreateRankNumbers();
                        const remaining = document.querySelectorAll('.create-list-stadium');
                        if (remaining.length === 0) {
                            document.getElementById('create-list-no-stadiums').style.display = 'block';
                            document.getElementById('create-list-stadiums').style.display = 'none';
                        }
                    }, 300);
                });

                const createListDeleteImage = document.createElement('img');
                createListDeleteImage.src = '/images/icons/trash.png';
                createListDeleteButton.appendChild(createListDeleteImage);

                createListStadium.appendChild(createListStadiumImage);
                createListStadium.appendChild(createListStadiumInfoContainer);
                createListStadium.appendChild(createListDeleteButton);

                createListStadium.draggable = true;

                createListStadium.addEventListener('dragstart', (e) => {
                    dragSrcEl = createListStadium;
                    e.dataTransfer.effectAllowed = 'move';
                    createListStadium.style.opacity = '0.4';
                });

                createListStadium.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (createListStadium !== dragSrcEl) {
                        createListStadium.style.outline = '2px solid var(--color-blue)';
                        createListStadium.style.outlineOffset = '3px';
                    }
                });

                createListStadium.addEventListener('dragleave', () => {
                    createListStadium.style.outline = '';
                    createListStadium.style.outlineOffset = '';
                });

                createListStadium.addEventListener('drop', (e) => {
                    e.stopPropagation();
                    if (dragSrcEl !== createListStadium) {
                        const container = document.getElementById('create-list-stadiums');
                        const children = Array.from(container.children);
                        const srcIndex = children.indexOf(dragSrcEl);
                        const targetIndex = children.indexOf(createListStadium);
                        if (srcIndex < targetIndex) {
                            container.insertBefore(dragSrcEl, createListStadium.nextSibling);
                        } else {
                            container.insertBefore(dragSrcEl, createListStadium);
                        }
                        enableSave();
                        updateCreateRankNumbers();
                    }
                    createListStadium.style.outline = '';
                    createListStadium.style.outlineOffset = '';
                });

                createListStadium.addEventListener('dragend', () => {
                    createListStadium.style.opacity = '';
                    document.querySelectorAll('.create-list-stadium').forEach(el => {
                        el.style.outline = '';
                        el.style.outlineOffset = '';
                    });
                });

                document.getElementById('create-list-stadiums').appendChild(createListStadium);

                enableSave();
                updateCreateRankNumbers();
                suggestionsContainer.classList.remove('active');
                searchField.value = '';
            });
            item.setAttribute('tabindex', '0');
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    item.click();
                }
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    item.nextElementSibling?.focus();
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    item.previousElementSibling?.focus() || document.getElementById('create-list-search-field').focus();
                }
            });
            suggestionsContainer.appendChild(item);
        });
    }, DEBOUNCE_TIME);

    searchField.addEventListener('input', (e) => debouncedSearch(e.target.value));

    document.getElementById('create-list-search').addEventListener('submit', e => e.preventDefault());

    document.addEventListener('click', (e) => {
        if (!searchField.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.classList.remove('active');
            searchField.value = '';
        }
    });
}

function setupEditListSearch(enableSave) {
    const searchField = document.getElementById('edit-list-search-field');
    const suggestionsContainer = document.getElementById('edit-list-autocomplete-list');

    const debouncedSearch = debounce(async (name) => {
        if (!name) {
            suggestionsContainer.classList.remove('active');
            return;
        }
        const result = await loadAPI.searchStadiums(name);
        const stadiums = result.stadiums;

        suggestionsContainer.innerHTML = '';
        if (stadiums.length === 0) {
            const noResults = document.createElement('div');
            noResults.classList.add('autocomplete-item', 'no-results');
            noResults.textContent = 'No stadiums found';
            noResults.style.cursor = 'default';
            suggestionsContainer.appendChild(noResults);
            suggestionsContainer.classList.add('active');
            return;
        }

        suggestionsContainer.classList.add('active');
        stadiums.forEach(stadium => {
            const item = document.createElement('div');
            item.classList.add('autocomplete-item');
            item.textContent = stadium.stadium_name;
            item.addEventListener('click', () => {
                const existing = document.querySelector(`.edit-list-stadium[data-stadium-id="${stadium.stadium_id}"]`);
                if (existing) {
                    shakeOrReplace('This stadium is already in your list.');
                    return;
                }

                document.getElementById('edit-list-no-stadiums').style.display = 'none';
                document.getElementById('edit-list-stadiums').style.display = 'flex';

                const editListStadium = document.createElement('div');
                editListStadium.classList.add('edit-list-stadium');

                editListStadium.dataset.stadiumId = stadium.stadium_id;

                const editListStadiumImage = document.createElement('img');
                editListStadiumImage.classList.add('edit-list-stadium-image');
                editListStadiumImage.src = STADIUM_IMAGE_PATH + stadium.image;
                editListStadiumImage.alt = stadium.stadium_name;
                editListStadiumImage.draggable = 'false';

                const editListStadiumInfoContainer = document.createElement('div');
                editListStadiumInfoContainer.classList.add('edit-list-stadium-info-container');

                const editListStadiumInfoHeader = document.createElement('div');
                editListStadiumInfoHeader.classList.add('edit-list-stadium-info-header');

                const editListStadiumName = document.createElement('a');
                editListStadiumName.classList.add('edit-list-stadium-name');
                editListStadiumName.href = IS_PROD && stadium.slug ? `/stadium/${stadium.slug}` : `stadium.html?id=${stadium.stadium_id}`;
                editListStadiumName.textContent = stadium.stadium_name;
                editListStadiumName.draggable = false;

                const editListStadiumLocation = document.createElement('p');
                editListStadiumLocation.classList.add('edit-list-stadium-location');
                editListStadiumLocation.textContent = stadium.city + ', ' + stadium.state;

                editListStadiumInfoHeader.appendChild(editListStadiumName);
                editListStadiumInfoHeader.appendChild(editListStadiumLocation);
                            
                editListStadiumInfoContainer.appendChild(editListStadiumInfoHeader);

                const editListStadiumNote = document.createElement('p');
                editListStadiumNote.classList.add('edit-list-stadium-note');

                if (stadium.note) {
                    editListStadiumNote.textContent = stadium.note;
                } else {
                    editListStadiumNote.style.display = 'none';
                }

                editListStadiumInfoContainer.appendChild(editListStadiumNote);

                const editListNoteButton = document.createElement('button');
                editListNoteButton.classList.add('edit-list-note-button');
                editListNoteButton.textContent = stadium.note ? 'Edit note' : 'Add note';
                editListNoteButton.dataset.note = stadium.note || '';
                editListNoteButton.addEventListener('click', () => {
                    toggleMenu(elements.editListStadiumMenu, true, overlay);
                    setupEditListStadiumModal(stadium.stadium_id, stadium.stadium_name, stadium.city, stadium.state, stadium.image, editListNoteButton.dataset.note, editListStadiumNote, editListNoteButton, elements, enableSave);
                });

                editListStadiumInfoContainer.appendChild(editListNoteButton);

                const editListDeleteButton = document.createElement('button');
                editListDeleteButton.classList.add('edit-list-delete-button');
                editListDeleteButton.addEventListener('click', () => {
                    editListStadium.style.opacity = '0';
                    setTimeout(() => {
                        editListStadium.remove();
                        enableSave();
                        updateEditRankNumbers();
                        const remaining = document.querySelectorAll('.edit-list-stadium');
                        if (remaining.length === 0) {
                            document.getElementById('edit-list-no-stadiums').style.display = 'block';
                            document.getElementById('edit-list-stadiums').style.display = 'none';
                        }
                    }, 300);
                });

                const editListDeleteImage = document.createElement('img');
                editListDeleteImage.src = '/images/icons/trash.png';
                editListDeleteButton.appendChild(editListDeleteImage);

                editListStadium.appendChild(editListStadiumImage);
                editListStadium.appendChild(editListStadiumInfoContainer);
                editListStadium.appendChild(editListDeleteButton);

                editListStadium.draggable = true;

                editListStadium.addEventListener('dragstart', (e) => {
                    dragSrcEl = editListStadium;
                    e.dataTransfer.effectAllowed = 'move';
                    editListStadium.style.opacity = '0.4';
                });

                editListStadium.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (editListStadium !== dragSrcEl) {
                        editListStadium.style.outline = '2px solid var(--color-blue)';
                        editListStadium.style.outlineOffset = '3px';
                    }
                });

                editListStadium.addEventListener('dragleave', () => {
                    editListStadium.style.outline = '';
                    editListStadium.style.outlineOffset = '';
                });

                editListStadium.addEventListener('drop', (e) => {
                    e.stopPropagation();
                    if (dragSrcEl !== editListStadium) {
                        const container = document.getElementById('edit-list-stadiums');
                        const children = Array.from(container.children);
                        const srcIndex = children.indexOf(dragSrcEl);
                        const targetIndex = children.indexOf(editListStadium);
                        if (srcIndex < targetIndex) {
                            container.insertBefore(dragSrcEl, editListStadium.nextSibling);
                        } else {
                            container.insertBefore(dragSrcEl, editListStadium);
                        }
                        enableSave();
                        updateEditRankNumbers();
                    }
                    editListStadium.style.outline = '';
                    editListStadium.style.outlineOffset = '';
                });

                editListStadium.addEventListener('dragend', () => {
                    editListStadium.style.opacity = '';
                    document.querySelectorAll('.edit-list-stadium').forEach(el => {
                        el.style.outline = '';
                        el.style.outlineOffset = '';
                    });
                });

                document.getElementById('edit-list-stadiums').appendChild(editListStadium);

                enableSave();
                updateEditRankNumbers();
                suggestionsContainer.classList.remove('active');
                searchField.value = '';
            });
            item.setAttribute('tabindex', '0');
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    item.click();
                }
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    item.nextElementSibling?.focus();
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    item.previousElementSibling?.focus() || document.getElementById('edit-list-search-field').focus();
                }
            });
            suggestionsContainer.appendChild(item);
        });
    }, DEBOUNCE_TIME);

    searchField.addEventListener('input', (e) => debouncedSearch(e.target.value));

    document.getElementById('edit-list-search').addEventListener('submit', e => e.preventDefault());

    document.addEventListener('click', (e) => {
        if (!searchField.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.classList.remove('active');
            searchField.value = '';
        }
    });
}

function setupCreateListStadiumModal(stadiumId, stadiumName, city, state, stadiumImage, note, createListStadiumNote, createListNoteButton, elements, enableSave) {
    elements.createListStadiumName.textContent = stadiumName;
    elements.createListStadiumLocation.textContent = city + ', ' + state;
    elements.createListStadiumImage.src = STADIUM_IMAGE_PATH + stadiumImage;
    elements.createListStadiumNote.value = note;

    const saveHandler = async () => {
        const newNote = elements.createListStadiumNote.value.trim() || null;
        try {
            toggleMenu(elements.createListStadiumMenu, false, overlay);
            createListNoteButton.dataset.note = newNote || '';
            createListNoteButton.textContent = newNote ? 'Edit note' : 'Add note';
            if (newNote) {
                createListStadiumNote.textContent = newNote;
                createListStadiumNote.style.display = 'block';
            } else {
                createListStadiumNote.textContent = '';
                createListStadiumNote.style.display = 'none';
            }
            enableSave();
        } catch (error) {
            console.error(error);
        }
        elements.createListStadiumSaveButton.removeEventListener('click', saveHandler);
    };

    elements.createListStadiumSaveButton.addEventListener('click', saveHandler);

    elements.createListStadiumCancelButton.onclick = () => toggleMenu(elements.createListStadiumMenu, false, overlay);
    elements.closecreateListStadiumMenu.onclick = () => toggleMenu(elements.createListStadiumMenu, false, overlay);
}

function setupEditListStadiumModal(stadiumId, stadiumName, city, state, stadiumImage, note, editListStadiumNote, editListNoteButton, elements, enableSave) {
    elements.editListStadiumName.textContent = stadiumName;
    elements.editListStadiumLocation.textContent = city + ', ' + state;
    elements.editListStadiumImage.src = STADIUM_IMAGE_PATH + stadiumImage;
    elements.editListStadiumNote.value = note;

    const saveHandler = async () => {
        const newNote = elements.editListStadiumNote.value.trim() || null;
        try {
            toggleMenu(elements.editListStadiumMenu, false, overlay);
            editListNoteButton.dataset.note = newNote || '';
            editListNoteButton.textContent = newNote ? 'Edit note' : 'Add note';
            if (newNote) {
                editListStadiumNote.textContent = newNote;
                editListStadiumNote.style.display = 'block';
            } else {
                editListStadiumNote.textContent = '';
                editListStadiumNote.style.display = 'none';
            }
            enableSave();
        } catch (error) {
            console.error(error);
        }
        elements.editListStadiumSaveButton.removeEventListener('click', saveHandler);
    };

    elements.editListStadiumSaveButton.addEventListener('click', saveHandler);

    elements.editListStadiumCancelButton.onclick = () => toggleMenu(elements.editListStadiumMenu, false, overlay);
    elements.closeEditListStadiumMenu.onclick = () => toggleMenu(elements.editListStadiumMenu, false, overlay);
}

function setupFilterHandlers(elements, listId, slug, view) {
    const getFilters = () => ({
        league: elements.leagueFilter.value,
        country: elements.countryFilter.value,
        sort: elements.sortFilter.value
    });

    function applyFilter() {
        const { league, country, sort } = getFilters();
        if (IS_PROD && slug) {
            let path = `/list/${slug}/view`;
            if (!listShowSelections.has('all')) path += `/show/${[...listShowSelections].join(',')}`;
            if (league !== 'all') path += `/league/${league}`;
            if (country !== 'all') path += `/country/${country}`;
            if (sort !== 'order') path += `/sort/${sort}`;
            window.location.href = path;
        } else {
            const currentParams = new URLSearchParams(window.location.search);
            const params = new URLSearchParams();
            params.set('mode', 'view');
            params.set('id', listId);
            if (view) params.set('view', view);
            params.set('page', '1');
            if (league !== 'all') params.set('league', league);
            if (country !== 'all') params.set('country', country);
            params.set('sort', sort);
            const show = currentParams.get('show');
            if (show) params.set('show', show);
            window.location.search = params.toString();
        }
    }

    elements.leagueFilter.addEventListener('change', applyFilter);
    elements.countryFilter.addEventListener('change', applyFilter);
    elements.sortFilter.addEventListener('change', applyFilter);

    elements.clearFiltersButton.addEventListener('click', () => {
        elements.leagueFilter.value = 'all';
        elements.countryFilter.value = 'all';
        elements.sortFilter.value = 'order';
        listShowSelections.clear();
        listShowSelections.add('all');
        if (IS_PROD && slug) {
            window.location.href = `/list/${slug}/view`;
        } else {
            const params = new URLSearchParams();
            params.set('mode', 'view');
            params.set('id', listId);
            if (view) params.set('view', view);
            window.location.search = params.toString();
        }
    });
}

function updateCreateRankNumbers() {
    const isRanked = document.getElementById('create-list-ranked').checked;
    const stadiums = document.querySelectorAll('.create-list-stadium');
    stadiums.forEach((stadium, index) => {
        let rankBadge = stadium.querySelector('.create-list-rank-badge');
        if (!rankBadge) {
            rankBadge = document.createElement('div');
            rankBadge.classList.add('create-list-rank-badge');
            stadium.prepend(rankBadge);
        }
        rankBadge.textContent = index + 1;
        rankBadge.style.display = isRanked ? 'block' : 'none';
    });
}

function updateEditRankNumbers() {
    const isRanked = document.getElementById('edit-list-ranked').checked;
    const stadiums = document.querySelectorAll('.edit-list-stadium');
    stadiums.forEach((stadium, index) => {
        let rankBadge = stadium.querySelector('.edit-list-rank-badge');
        if (!rankBadge) {
            rankBadge = document.createElement('div');
            rankBadge.classList.add('edit-list-rank-badge');
            stadium.prepend(rankBadge);
        }
        rankBadge.textContent = index + 1;
        rankBadge.style.display = isRanked ? 'block' : 'none';
    });
}

/*  Events  */
document.addEventListener('DOMContentLoaded', () => {
    rewriteUserHomeLinks();
    registerCommonEvents();
    registerEventListeners(getAuthElements());
    registerUserLogOutEvents();
    initializeCustomSelects();
    setupSearchAutocomplete('logged-in-nav-search', 'logged-in-search-field-nav', 'logged-in-nav-autocomplete-list');
    setupSearchAutocomplete('logged-in-sidebar-nav-search', 'logged-in-sidebar-search-field-nav', 'logged-in-sidebar-nav-autocomplete-list');
});

window.onload = async () => {
    if (!isLoggedIn()) {
        window.location.replace('/');
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const pathParts = window.location.pathname.split('/');

    const isCreate = IS_PROD && pathParts[1] === 'list' && pathParts[2] === 'create';
    const slug = IS_PROD && pathParts[1] === 'list' && pathParts[2] && pathParts[2] !== 'create' ? pathParts[2] : null;
    const pathMode = IS_PROD && slug ? pathParts[3] || 'view' : null;

    const mode = isCreate ? 'create' : (pathMode || params.get('mode') || null);
    const listId = params.get('id') || null;
    const view = params.get('view') || null;

    const pending = sessionStorage.getItem('toast');
    if (pending) {
        const { type, message } = JSON.parse(pending);
        createToast(type, message);
        sessionStorage.removeItem('toast');
    }

    if ((listId || slug) && mode === 'view') {
        showViewUI(listId, slug, view);
    } else if ((listId || slug) && mode === 'edit') {
        showEditUI(listId, slug);
    } else if (mode === 'create') {
        showCreateUI();
    } else {
        window.location.replace('/');
    }
};