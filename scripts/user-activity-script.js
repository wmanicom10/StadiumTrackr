import { loggedInHeader, loggedInHeaderUsername, logOutButton, overlay,  sidebarToggleLoggedIn, sidebarLogOutButton, sidebarUsername } from "./constants.js";
import { toggleMenu } from "./utils.js";

/*  Variables  */
const editLogMenu = document.getElementById('edit-log-menu');
const closeEditLogMenu = document.getElementById('close-edit-log-menu');
const editLogSaveButton = document.getElementById('edit-log-save-button');
const editLogCancelButton = document.getElementById('edit-log-cancel-button');
const editLogName = document.getElementById('edit-log-name');
const editLogImage = document.getElementById('edit-log-image');
const editLogDateVisited = document.getElementById('edit-log-date-visited');
const editLogNote = document.getElementById('edit-log-note');
const deleteLogMenu = document.getElementById('delete-log-menu');
const closeDeleteLogMenu = document.getElementById('close-delete-log-menu');
const deleteLogCancelButton = document.getElementById('delete-log-cancel-button');
const deleteLogDeleteButton = document.getElementById('delete-log-delete-button');
const activityWelcomeText = document.getElementById('user-activity-welcome-text');
const activityListContainer = document.getElementById('activity-list-container');
const activityList = document.getElementById('activity-list');
const noActivityContainer = document.getElementById('no-activity-container');

let currentData = null;

/*  Functions  */
async function setView(username, activity, stadium, sortBy) {
    try {
        document.getElementById('activity-skeleton').style.display = 'block';
        activityListContainer.style.display = 'none';
        document.getElementById('activity-filter-bar').style.display = 'none';

        await new Promise(resolve => setTimeout(resolve, 750));
        const response = await fetch('http://localhost:3000/user/loadUserActivity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({username, activity, stadium, sortBy})
        });

        if (!response.ok) throw new Error('Failed to load activity');

        const result = await response.json();

        if (result.userActivity.length === 0) {
            noActivityContainer.style.display = 'block';
            activityList.style.display = 'none'
            document.getElementById('activity-skeleton').style.display = 'none';
            document.getElementById('activity-filter-bar').style.display = 'block';
            activityListContainer.style.display = 'block';
            document.getElementById('activity-list').style.display = 'none'
        }
        else {
            noActivityContainer.style.display = 'none';
            activityList.style.display = 'block'

            const userActivity = result.userActivity;

            activityList.innerHTML = '';

            userActivity.forEach(activity => {
                const activityItem = document.createElement('div');
                activityItem.classList.add('activity-item');

                const activityImage = document.createElement('img');
                activityImage.src = activity.image;
                activityImage.classList.add(activity.visited_on ? 'activity-log-image' : 'activity-image');

                activityItem.appendChild(activityImage);

                const activityDetailsContainer = document.createElement('div');
                activityDetailsContainer.classList.add('activity-details-container');

                const activityDetailsHeader = document.createElement('div');
                activityDetailsHeader.classList.add('activity-details-header');

                const activityDetailsName = document.createElement('a');
                activityDetailsName.classList.add('activity-details-name');
                activityDetailsName.textContent = activity.stadium_name;
                activityDetailsName.href = `stadium.html?stadium=${encodeURIComponent(activity.stadium_name)}`;

                const activityDetailsTime = document.createElement('span');
                activityDetailsTime.classList.add('activity-details-time');
                activityDetailsTime.textContent = timeAgo(activity.added_on);

                activityDetailsHeader.appendChild(activityDetailsName);
                activityDetailsHeader.appendChild(activityDetailsTime);
                activityDetailsContainer.appendChild(activityDetailsHeader);

                const activityDetailsLocation = document.createElement('h4');
                activityDetailsLocation.classList.add('activity-details-location');
                activityDetailsLocation.textContent = `${activity.city}, ${activity.state}`;
                activityDetailsContainer.appendChild(activityDetailsLocation);

                if (activity.visited_on) {
                    const activityLogDetails = document.createElement('div');
                    activityLogDetails.classList.add('activity-log-details');

                    const activityLogDateText = document.createElement('h4');
                    activityLogDateText.textContent = 'DATE VISITED';
                    activityLogDetails.appendChild(activityLogDateText);

                    const activityLogDate = document.createElement('span');
                    activityLogDate.textContent = new Date(activity.visited_on).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    });
                    activityLogDetails.appendChild(activityLogDate);

                    const activityLogNoteText = document.createElement('h4');
                    activityLogNoteText.textContent = 'NOTE';
                    activityLogDetails.appendChild(activityLogNoteText);

                    const activityLogNote = document.createElement('span');
                    activityLogNote.textContent = activity.user_note || 'No note';
                    if (!activity.user_note) {
                        activityLogNote.classList.add('no-note');
                    }
                    activityLogDetails.appendChild(activityLogNote);

                    activityDetailsContainer.appendChild(activityLogDetails);
                } else {
                    const activityDetails = document.createElement('div');
                    activityDetails.classList.add('activity-details');

                    const activityDetailsText = document.createElement('h4');
                    activityDetailsText.textContent = activity.activity_type === 'wishlist' ? 'ADDED TO WISHLIST' : 'MARKED AS VISITED';
                    activityDetails.appendChild(activityDetailsText);

                    activityDetailsContainer.appendChild(activityDetails);
                }

                const activityButtons = document.createElement('div');
                activityButtons.classList.add('activity-buttons');

                if (activity.visited_on) {
                    const editLogButton = document.createElement('button');
                    editLogButton.classList.add('edit-log-button');
                    editLogButton.textContent = 'Edit Log';

                    editLogButton.addEventListener('click', () => {
                        currentData = {
                            visit_id: activity.visit_id,
                            username: username
                        };
                        
                        editLogName.textContent = activity.stadium_name
                        editLogImage.src = activity.image;
                        editLogDateVisited.value = activity.visited_on.split('T')[0];

                        const today = new Date();
                        const year = today.getFullYear();
                        const month = String(today.getMonth() + 1).padStart(2, '0');
                        const day = String(today.getDate()).padStart(2, '0');
                        editLogDateVisited.setAttribute("max", `${year}-${month}-${day}`);

                        editLogNote.value = activity.user_note || '';

                        toggleMenu(editLogMenu, true, overlay);
                    });

                    activityButtons.appendChild(editLogButton);

                    const deleteLogButton = document.createElement('button');
                    deleteLogButton.classList.add('delete-log-button');
                    deleteLogButton.textContent = 'Delete Log';

                    deleteLogButton.addEventListener('click', () => {
                        currentData = {
                            visit_id: activity.visit_id,
                            username: username
                        };

                        toggleMenu(deleteLogMenu, true, overlay);
                    })

                    activityButtons.appendChild(deleteLogButton);
                } else {
                    const removeButton = document.createElement('button');
                    removeButton.classList.add('remove-button');
                    removeButton.textContent = 'Remove';

                    removeButton.addEventListener('click', async () => {
                        const username = localStorage.getItem('username');
                        
                        if (activity.activity_type === 'wishlist') {
                            await fetch('http://localhost:3000/stadium/removeActivityWishlist', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ stadiumId: activity.stadium_id, username })
                            });
                        } else {
                            await fetch('http://localhost:3000/stadium/removeActivityVisited', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ stadiumId: activity.stadium_id, username })
                            });
                        }
                        
                        const urlParams = new URLSearchParams(window.location.search);
                        const stadium = urlParams.get('stadium');
                        const activityFilter = document.getElementById('activity-filter').value;
                        const sort = document.getElementById('sort-filter').value;
                        setView(username, activityFilter, stadium, sort);
                    });

                    activityButtons.appendChild(removeButton);
                }

                activityDetailsContainer.appendChild(activityButtons);
                activityItem.appendChild(activityDetailsContainer);
                activityList.appendChild(activityItem);
            });

            document.getElementById('activity-skeleton').style.display = 'none';
            document.getElementById('activity-list-container').style.display = 'block';
            document.getElementById('activity-filter-bar').style.display = 'block';
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

function timeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    
    if (isNaN(past.getTime())) {
        return 'unknown';
    }
    
    const diffMs = now - past;
    
    if (diffMs < 0) return 'just now';
    
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    const weeks = Math.floor(diffMs / 604800000);
    const months = Math.floor(diffMs / 2592000000);
    const years = Math.floor(diffMs / 31536000000);
    
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (weeks < 4) return `${weeks}w ago`;
    if (months < 12) return `${months}mo ago`;
    return `${years}y ago`;
}

/*  Events  */
window.onload = async () => {
    const username = localStorage.getItem('username');
    const urlParams = new URLSearchParams(window.location.search);
    const stadium = urlParams.get('stadium');
    if (stadium) {
        document.title = stadium + " Activity - StadiumTrackr";
        activityWelcomeText.textContent = stadium + " Activity"
    }
    else document.title = "Activity - StadiumTrackr";
    setView(username, 'all', stadium, 'date-desc');
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

document.getElementById('activity-filter').addEventListener('change', () => {
    const username = localStorage.getItem('username');
    const activity = document.getElementById('activity-filter').value;
    const urlParams = new URLSearchParams(window.location.search);
    const stadium = urlParams.get('stadium');
    const sort = document.getElementById('sort-filter').value;
    
    setView(username, activity, stadium, sort);
});

document.getElementById('sort-filter').addEventListener('change', () => {
    const username = localStorage.getItem('username');
    const activity = document.getElementById('activity-filter').value;
    const sort = document.getElementById('sort-filter').value;
    const urlParams = new URLSearchParams(window.location.search);
    const stadium = urlParams.get('stadium');
    
    setView(username, activity, stadium, sort);
});

editLogSaveButton.addEventListener('click', async () => {
    if (!currentData) {
        console.error('No edit data available');
        return;
    }

    try {
        const editDateVisited = editLogDateVisited.value;
        const editNote = editLogNote.value;

        const response = await fetch('http://localhost:3000/stadium/editLog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visitId: currentData.visit_id, editDateVisited, editNote })
        });

        if (!response.ok) throw new Error('Failed to update log');

        toggleMenu(editLogMenu, false, overlay);

        const urlParams = new URLSearchParams(window.location.search);
        const stadium = urlParams.get('stadium');
        const activityFilter = document.getElementById('activity-filter').value;
        const sort = document.getElementById('sort-filter').value;
        await setView(currentData.username, activityFilter, stadium, sort);
        
        currentData = null;
    } catch (err) {
        alert(err.message);
    }
});

editLogCancelButton.addEventListener('click', () => {
    toggleMenu(editLogMenu, false, overlay);
    currentData = null;
});

closeEditLogMenu.addEventListener('click', () => {
    toggleMenu(editLogMenu, false, overlay);
    currentData = null;
});

closeDeleteLogMenu.addEventListener('click', () => {
    toggleMenu(deleteLogMenu, false, overlay);
});

deleteLogCancelButton.addEventListener('click', () => {
    toggleMenu(deleteLogMenu, false, overlay);
});

deleteLogDeleteButton.addEventListener('click', async () => {
    if (!currentData) {
        console.error('No edit data available');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/stadium/deleteLog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visitId: currentData.visit_id })
        });

        if (!response.ok) throw new Error('Failed to delete log');

        toggleMenu(deleteLogMenu, false, overlay);

        const urlParams = new URLSearchParams(window.location.search);
        const stadium = urlParams.get('stadium');
        const activityFilter = document.getElementById('activity-filter').value;
        const sort = document.getElementById('sort-filter').value;
        await setView(currentData.username, activityFilter, stadium, sort);
        
        currentData = null;
    } catch (err) {
        alert(err.message);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (editLogMenu.style.display !== 'none') {
            toggleMenu(editLogMenu, false, overlay);
            currentData = null;
        }
        if (deleteLogMenu.style.display !== 'none') {
            toggleMenu(deleteLogMenu, false, overlay);
            currentData = null;
        }
    }
});