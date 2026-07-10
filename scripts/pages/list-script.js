/*  Imports  */
import { DEBOUNCE_TIME, getAuthElements, MIN_LOADING_TIME, overlay, STADIUM_IMAGE_PATH } from "../constants.js";
import { createToast, debounce, getPageFromURL, initializeCustomSelects, isLoggedIn, renderPageNumbers, renderWithoutTransition, setupSearchAutocomplete, shakeOrReplace, syncSelectFromURL, toggleMenu } from "../utils.js";
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
                window.location.href = `list.html?mode=view&id=${result.listId}`;
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

async function showEditUI(listId) {
    try {
        const saveButton = document.getElementById('edit-list-save-button');
        saveButton.disabled = true;

        function enableSave() {
            saveButton.disabled = false;
        }

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
                await updateAPI.updateUserList(listId, listName, listDescription, isRanked, stadiums);
                sessionStorage.setItem('toast', JSON.stringify({ type: 'success', message: 'List saved successfully.' }));
                window.location.href = `list.html?mode=view&id=${listId}`;
            } catch (error) {
                console.error(error);
                shakeOrReplace(error.message || 'Failed to save list. Please try again.');
            }
        });

        const deleteListMenu = document.getElementById('delete-list-menu');

        document.getElementById('edit-list-delete-button').addEventListener('click', () => toggleMenu(deleteListMenu, true, overlay));
        document.getElementById('close-delete-list-menu').addEventListener('click', () => toggleMenu(deleteListMenu, false, overlay));
        document.getElementById('delete-list-cancel-button').addEventListener('click', () => toggleMenu(deleteListMenu, false, overlay));

        document.getElementById('delete-list-delete-button').addEventListener('click', async () => {
            try {
                await updateAPI.deleteUserList(listId);
                sessionStorage.setItem('toast', JSON.stringify({ type: 'success', message: 'List deleted successfully.' }));
                window.location.href = 'user-home.html?tab=lists';
            } catch (error) {
                console.error(error);
                shakeOrReplace(error.message || 'Failed to delete list. Please try again.');
            }
        });

        document.getElementById('edit-list-container').style.display = 'block';

        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
        const result = await userAPI.loadUserList(listId, 'all', 'all', 'all', 'order');
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

        renderEditListView(stadiums, enableSave);
        setupEditListSearch(enableSave);

        document.getElementById('edit-list-skeleton').style.display = 'none';
        document.getElementById('edit-list-content-container').style.display = 'flex';
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to load list content.');
    }
}

async function showViewUI(listId, view) {
    try {
        const elements = {
            showFilter: document.getElementById('view-list-show-filter'),
            leagueFilter: document.getElementById('view-list-league-filter'),
            countryFilter: document.getElementById('view-list-country-filter'),
            sortFilter: document.getElementById('view-list-sort-filter'),
            clearFiltersButton: document.getElementById('view-list-clear-filters'),
            stadiumsList: document.getElementById('view-list-stadiums'),
            stadiumsPageSelector: document.getElementById('view-list-page-selector'),
            noStadiumsContainer: document.getElementById('view-list-no-stadiums-container')
        }

        const params = new URLSearchParams(window.location.search);
        const show = params.get('show') || 'all';
        const league = params.get('league') || 'all';
        const country = params.get('country') || 'all';
        const sort = params.get('sort') || 'order';

        setupFilterHandlers(elements, listId, view);

        syncSelectFromURL('view-list-show-filter', show);
        syncSelectFromURL('view-list-league-filter', league);
        syncSelectFromURL('view-list-country-filter', country);
        syncSelectFromURL('view-list-sort-filter', sort);

        document.getElementById('view-list-container').style.display = 'flex';

        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
        const result = await userAPI.loadUserList(listId, show, league, country, sort);
        const stadiums = result.listStadiums;

        document.title = `${result.listName} - A list of stadiums`;

        const stadiumImage = document.createElement('img');
        stadiumImage.id = 'stadium-image';
        stadiumImage.src = STADIUM_IMAGE_PATH + result.backdropImage;
        document.querySelector('main').prepend(stadiumImage);
        stadiumImage.onload = () => {
            stadiumImage.classList.add('loaded');
        };

        document.getElementById('view-list-name').textContent = result.listName;
        result.listDescription ? document.getElementById('view-list-description').textContent = result.listDescription : document.getElementById('view-list-description').style.display = 'none';

        if (view === 'list') {
            renderListView(elements, stadiums, result.isRanked);
        } else {
            renderWithoutTransition(elements, stadiums, result.isRanked);
        }

        document.getElementById('edit-list-button').href = `list.html?mode=edit&id=${listId}`;
        document.getElementById('list-view-grid').href = `list.html?mode=view&id=${listId}`;
        document.getElementById('list-view-list').href = `list.html?mode=view&id=${listId}&view=list`;

        document.getElementById('list-skeleton').style.display = 'none';
        if (stadiums.length > 0) document.getElementById('view-list-stadiums').style.display = 'flex';
        document.getElementById('view-list-filters-container').style.display = 'block';
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Failed to load list content');
    }
}

/*  Functions  */
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
            editListStadiumImage.draggable = false;

            const editListStadiumInfoContainer = document.createElement('div');
            editListStadiumInfoContainer.classList.add('edit-list-stadium-info-container');

            const editListStadiumInfoHeader = document.createElement('div');
            editListStadiumInfoHeader.classList.add('edit-list-stadium-info-header');

            const editListStadiumName = document.createElement('a');
            editListStadiumName.classList.add('edit-list-stadium-name');
            editListStadiumName.href = `stadium.html?id=${stadium.stadium_id}`;
            editListStadiumName.textContent = stadium.stadium_name;
            editListStadiumName.draggable = false;

            const editListStadiumLocation = document.createElement('h4');
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
        });
        updateEditRankNumbers();
    }
}

function renderListView(elements, stadiums, isRanked) {
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
        let currentPage = Math.min(getPageFromURL(), pageCount);

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
                listViewStadiumName.href = `stadium.html?id=${stadium.stadium_id}`;
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
        renderPageNumbers(elements, currentPage, pageCount);
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
                createListStadiumName.href = `stadium.html?id=${stadium.stadium_id}`;
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
                editListStadiumImage.draggable = 'false';

                const editListStadiumInfoContainer = document.createElement('div');
                editListStadiumInfoContainer.classList.add('edit-list-stadium-info-container');

                const editListStadiumInfoHeader = document.createElement('div');
                editListStadiumInfoHeader.classList.add('edit-list-stadium-info-header');

                const editListStadiumName = document.createElement('a');
                editListStadiumName.classList.add('edit-list-stadium-name');
                editListStadiumName.href = `stadium.html?id=${stadium.stadium_id}`;
                editListStadiumName.textContent = stadium.stadium_name;
                editListStadiumName.draggable = false;

                const editListStadiumLocation = document.createElement('h4');
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

function setupFilterHandlers(elements, listId, view) {
    const getFilters = () => ({
        show: elements.showFilter.value,
        league: elements.leagueFilter.value,
        country: elements.countryFilter.value,
        sort: elements.sortFilter.value
    });

    function applyFilter() {
        const { show, league, country, sort } = getFilters();
        const params = new URLSearchParams();
        params.set('mode', 'view');
        params.set('id', listId);
        if (view) params.set('view', view);
        params.set('page', '1');
        if (show !== 'all')        params.set('show', show);
        if (league !== 'all')      params.set('league', league);
        if (country !== 'all')     params.set('country', country);
        params.set('sort', sort);
        window.location.search = params.toString();
    }

    elements.showFilter.addEventListener('change', applyFilter);
    elements.leagueFilter.addEventListener('change', applyFilter);
    elements.countryFilter.addEventListener('change', applyFilter);
    elements.sortFilter.addEventListener('change', applyFilter);
    
    elements.clearFiltersButton.addEventListener('click', () => {
        elements.showFilter.value = 'all';
        elements.leagueFilter.value = 'all';
        elements.countryFilter.value = 'all';
        elements.sortFilter.value = 'order';
        const params = new URLSearchParams();
        params.set('mode', 'view');
        params.set('id', listId);
        if (view) params.set('view', view);
        window.location.search = params.toString();
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
    const mode = params.get('mode') || null;
    const listId = params.get('id') || null;
    const view = params.get('view') || null;

    const pending = sessionStorage.getItem('toast');
    if (pending) {
        const { type, message } = JSON.parse(pending);
        createToast(type, message);
        sessionStorage.removeItem('toast');
    }
    
    if (listId && mode === 'view') {
        showViewUI(listId, view);
    } else if (listId && mode === 'edit') {
        showEditUI(listId);
    } else if (mode === 'create') {
        showCreateUI();
    } else {
        window.location.replace('/');
    }
};