/*  Variables  */
const loggedOutHeader = document.getElementById('logged-out-header');
const loggedInHeader = document.getElementById('logged-in-header');
const loggedInHeaderUserContainer = document.getElementById('logged-in-header-user-container');
const loggedInHeaderUserContainerHidden = document.getElementById('logged-in-header-user-container-hidden');
const loggedInHeaderUsername = document.getElementById('logged-in-header-username');
const logOutButton = document.getElementById('log-out');
const overlay = document.getElementById('overlay');
const logInMenu = document.getElementById('log-in-menu');
const logInForm = document.getElementById('log-in-form');
const logIn = document.getElementById('log-in-button');
const signInLink = document.getElementsByClassName('sign-in-link')[0];
const createAccountMenu = document.getElementById('create-account-menu');
const createAccountForm = document.getElementById('create-account-form');
const signUp = document.getElementById('sign-up-button');
const signUpLink = document.getElementsByClassName('sign-up-link')[0];
const closeButtons = {
    'log-in-menu': document.getElementById('close-log-in-menu'),
    'create-account-menu': document.getElementById('close-create-account-menu')
};
const addStadiumMenu = document.getElementById('add-stadium-menu');
const addStadiumDateVisited = document.getElementById('add-stadium-date-visited');
const addStadiumName = document.getElementById('add-stadium-name');
const addStadiumImage = document.getElementById('add-stadium-image');
const closeAddStadiumMenu = document.getElementById('close-add-stadium-menu');
const addStadiumVisitedBefore = document.getElementById('add-stadium-visited-before');
const visitedBeforeCheckmark = document.getElementById('visited-before-checkmark');
const addStadiumReview = document.getElementById('add-stadium-review');
const addStadiumRating = document.getElementById('add-stadium-rating-container');
const addStadiumRatingText = document.getElementById('add-stadium-rating-text');
const addStadiumRatingStars = document.getElementById('add-stadium-stars');
const addStadiumStars = document.querySelectorAll('.add-stadium-star');
const addStadiumRatingClearButton = document.getElementById('add-stadium-rating-clear-button');
const ratingText = document.getElementById('rating-text');
const addStadiumLikeContainer = document.getElementById('add-stadium-like-container');
const addStadiumHeart = document.getElementById('add-stadium-heart');
const addStadiumSubmitButton = document.getElementById('add-stadium-submit-button');
const contentWrapper = document.getElementById('content-wrapper');
const logInButton = document.getElementById('log-in');
const createAccountButton = document.getElementById('create-account');
const sidebarToggle = document.getElementById("sidebar-active");
const sidebarToggleLoggedIn = document.getElementById('sidebar-active-logged-in');
const sidebarLogInButton = document.getElementById('sidebar-log-in');
const sidebarSignUpButton = document.getElementById('sidebar-sign-up');
const sidebarLogOutButton = document.getElementById('sidebar-log-out');
const stadiumName = document.getElementById('stadium-name');
const stadiumImage = document.getElementById('stadium-image');
const stadiumUserControls = document.getElementById('stadium-user-controls')
const stadiumVisited = document.getElementById('stadium-visited');
const stadiumVisitedText = document.getElementById('stadium-visited-text');
const checkmark = document.getElementById('stadium-visited-checkmark');
const stadiumLike = document.getElementById('stadium-like');
const stadiumLikeText = document.getElementById('stadium-like-text');
const heart = document.getElementById('stadium-like-heart');
const stadiumRating = document.getElementById('stadium-rating');
const stadiumRatingText = document.getElementById('stadium-rating-text');
const stadiumRatingClearButton = document.getElementById('stadium-rating-clear-button');
const stadiumRatingStars = document.getElementById('stadium-rating-stars');
const stars = document.querySelectorAll('.stadium-rating-star');
const stadiumStats = document.getElementById('stadium-stats');
const stadiumVisits = document.getElementById('stadium-visits');
const stadiumAverageRating = document.getElementById('stadium-average-rating');
const userButtonsContainer = document.getElementById('user-buttons-container');
const stadiumLocation = document.getElementById('stadium-location');
const stadiumOpenedDate = document.getElementById('stadium-opened-date');
const stadiumTeams = document.getElementById('stadium-teams');
const stadiumCapacity = document.getElementById('stadium-capacity');
const stadiumConstructionCost = document.getElementById('stadium-construction-cost');
const friendActivityContainer = document.getElementById('friend-activity-container');
const friendActivity = document.getElementById('friend-activity');
const friendReviewsContainer = document.getElementById('friend-reviews-container');
const noPopularReviewsContainer = document.getElementById('no-popular-reviews-container');
const noRecentReviewsContainer = document.getElementById('no-recent-reviews-container');
const noUpcomingEventsContainer = document.getElementById('no-upcoming-events-container');
const popularReviewsContainer = document.getElementById('popular-reviews');
const recentReviewsContainer = document.getElementById('recent-reviews');
const upcomingEventsContainer = document.getElementById('upcoming-events');

/*  Functions  */
function appendButtons(buttons) {
    buttons.forEach(btn => userButtonsContainer.appendChild(btn));
}

function applySelectedRating(stars, rating) {
    stars.forEach((star, i) => {
        const starNumber = i + 1;
        if (rating >= starNumber) {
            star.src = 'images/icons/blue-star.png';
        } else if (rating >= starNumber - 0.5) {
            star.src = 'images/icons/blue-gray-star.png';
        } else {
            star.src = 'images/icons/gray-star.png';
        }
    });
}

function createUserButton(id, text, clickHandler = null) {
    const button = document.createElement('h3');
    button.classList.add('user-button');
    button.id = id;
    button.textContent = text;
    if (clickHandler) button.addEventListener('click', clickHandler);
    return button;
}

function hideClearButton() {
    stadiumRatingClearButton.style.opacity = '0';
}

function hideAddStadiumClearButton() {
    addStadiumRatingClearButton.style.opacity = '0';
} 

function makeButton(className, text) {
    const btn = createUserButton(className, text);
    btn.style.width = '230px';
    return btn;
}

function setRatingEvents(name, username, currentRating) {
    let selectedRating = currentRating;

    stars.forEach((star, i) => {
        star.addEventListener('mousemove', (e) => {
            const rect = star.getBoundingClientRect();
            const isLeft = (e.clientX - rect.left) < rect.width / 2;
            updateStars(i, isLeft, stars);
        });

        star.addEventListener('click', async (e) => {
            const rect = star.getBoundingClientRect();
            const isLeft = (e.clientX - rect.left) < rect.width / 2;
            selectedRating = i + (isLeft ? 0.5 : 1);
            applySelectedRating(stars, selectedRating);
            stadiumRatingText.textContent = 'Rated';
            stadiumRatingStars.addEventListener('mouseleave', () => applySelectedRating(stars, selectedRating));

            try {
                const response = await fetch('http://localhost:3000/stadium/updateUserRating', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, username, selectedRating })
                });

                const result = await response.json();
                if (!response.ok || result.rows.affectedRows < 1) {
                    throw new Error('Failed to update rating');
                }

                checkmark.src = 'images/icons/checkmark-blue.png';
                stadiumVisitedText.textContent = 'Visited';
            } catch (error) {
                console.error('Error updating like status:', error);
            }

            stadiumRating.addEventListener('mouseover', showClearButton);
            stadiumRating.addEventListener('mouseleave', hideClearButton);
        });
    });

    stadiumRatingStars.addEventListener('mouseleave', () => applySelectedRating(stars, selectedRating));

    stadiumRatingClearButton.addEventListener('click', async () => {
        selectedRating = 0;
        applySelectedRating(stars, 0);
        stadiumRatingText.textContent = 'Rate';

        try {
            const response = await fetch('http://localhost:3000/stadium/updateUserRating', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, selectedRating: null })
            });

            const result = await response.json();
            if (!response.ok || result.rows.affectedRows < 1) {
                throw new Error('Failed to update rating');
            }
        } catch (error) {
            console.error('Error updating like status:', error);
        }

        stadiumRatingClearButton.style.opacity = '0';

        stadiumRating.removeEventListener('mouseover', showClearButton);
        stadiumRating.removeEventListener('mouseleave', hideClearButton);

        stadiumRatingStars.addEventListener('mouseleave', () => applySelectedRating(stars, 0));
    });
}

function setRatingEventsAddStadium(name, username, currentRating) {
    let selectedRating = currentRating;

    addStadiumStars.forEach((star, i) => {
        star.addEventListener('mousemove', (e) => {
            const rect = star.getBoundingClientRect();
            const isLeft = (e.clientX - rect.left) < rect.width / 2;
            updateStars(i, isLeft, addStadiumStars);
        });

        star.addEventListener('click', (e) => {
            const rect = star.getBoundingClientRect();
            const isLeft = (e.clientX - rect.left) < rect.width / 2;
            selectedRating = i + (isLeft ? 0.5 : 1);
            applySelectedRating(addStadiumStars, selectedRating);
            ratingText.textContent = selectedRating + ' out of 5'
            ratingText.style.display = 'inline'
            addStadiumRatingStars.addEventListener('mouseleave', () => applySelectedRating(addStadiumStars, selectedRating));

            addStadiumRating.addEventListener('mouseover', showAddStadiumClearButton);
            addStadiumRating.addEventListener('mouseleave', hideAddStadiumClearButton);
        });
    });

    addStadiumRatingStars.addEventListener('mouseleave', () => applySelectedRating(addStadiumStars, selectedRating));

    addStadiumRatingClearButton.addEventListener('click', async () => {
        selectedRating = 0;
        applySelectedRating(addStadiumStars, 0);

        ratingText.style.display = 'none';
        ratingText.textContent = '';

        addStadiumRatingClearButton.style.opacity = '0';

        addStadiumRating.removeEventListener('mouseover', showAddStadiumClearButton);
        addStadiumRating.removeEventListener('mouseleave', hideAddStadiumClearButton);

        addStadiumRatingStars.addEventListener('mouseleave', () => applySelectedRating(addStadiumStars, 0));
    });
}

function showClearButton() {
    stadiumRatingClearButton.style.opacity = '1';
}

function showAddStadiumClearButton() {
    addStadiumRatingClearButton.style.opacity = '1';
}

function showLoggedInUI() {
    let username = localStorage.getItem('username');
    if (username.length > 9) {
        username = username.slice(0,9) + '...';
    }
    loggedInHeaderUsername.textContent = username;
    loggedOutHeader.style.display = 'none';
    loggedInHeader.style.display = 'flex';
    stadiumUserControls.style.display = 'flex';
    stadiumStats.style.marginTop = '20px';
}

function showLoggedOutUI() {
    loggedInHeader.style.display = 'none';
    loggedOutHeader.style.display = 'flex';
    stadiumUserControls.style.display = 'none';
    stadiumStats.style.marginTop = '0';
}

function toggleCheckmark(show) {
    if (show) {
        visitedBeforeCheckmark.style.display = 'block';
    }
    else {
        visitedBeforeCheckmark.style.display = 'none';
    }
}

function toggleHeart(show) {
    if (show) {
        addStadiumHeart.src = 'images/icons/blue-heart.png'
    }
    else {
        addStadiumHeart.src = 'images/icons/gray-heart.png'
    }
}

function toggleMenu(menu, show, keepOverlay = false) {
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
    } else {
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

function updateStars(index, isLeft, stars) {
    stars.forEach((star, i) => {
        if (i < index) {
            star.src = 'images/icons/blue-star.png';
        } else if (i === index) {
            star.src = isLeft ? 'images/icons/blue-gray-star.png' : 'images/icons/blue-star.png';
        } else {
            star.src = 'images/icons/gray-star.png';
        }
    });
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/*  Async Functions  */
async function loadStadiumInfo(name, username) {
    try {
        const response = await fetch('http://localhost:3000/stadium/loadStadiumInfo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, username: username })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }
        
        const result = await response.json();

        stadiumName.innerHTML = result.stadiumInfo.stadium.name;

        stadiumImage.src = result.stadiumInfo.stadium.image;
        const imagePromise = new Promise(resolve => {
            if (stadiumImage.complete) {
                resolve();
            } else {
                stadiumImage.onload = stadiumImage.onerror = resolve;
            }
        });
        await imagePromise;
        await new Promise(resolve => setTimeout(resolve, 750));
        document.getElementById('stadium-image-skeleton').style.display = 'none';
        document.getElementById('stadium-image').style.display = 'flex';

        const location = result.stadiumInfo.stadium.city + ', ' + result.stadiumInfo.stadium.state;
        stadiumLocation.innerHTML = location;

        const openedDateSQL = result.stadiumInfo.stadium.openedDate;
        const date = new Date(openedDateSQL);
        const openedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        stadiumOpenedDate.innerHTML = openedDate;

        const teamsSQL = result.stadiumInfo.teams;
        const leagueCounts = {};
        teamsSQL.forEach(team => {
            const { league } = team;
            if (leagueCounts[league]) {
                leagueCounts[league] += 1;
            } else {
                leagueCounts[league] = 1;
            }
        });
        const teams = teamsSQL.map(team => team.team_name).join(', ');
        stadiumTeams.innerHTML = teams;

        const leagueImages = {
            NFL: '../images/icons/football-emoji.png',
            NBA: '../images/icons/basketball-emoji.png',
            MLB: '../images/icons/baseball-emoji.png',
            NHL: '../images/icons/hockey-emoji.png',
            MLS: '../images/icons/soccer-emoji.png'
        };
        const innerDiv = document.getElementsByClassName('stadium-info')[2].querySelector('div');
        Object.keys(leagueCounts).forEach(league => {
            if (leagueCounts[league] > 0) {
                const img = document.createElement('img');
                img.src = leagueImages[league];
                innerDiv.appendChild(img);
            }
        });

        const capacity = result.stadiumInfo.stadium.capacity;
        stadiumCapacity.innerHTML = capacity;

        const constructionCost = result.stadiumInfo.stadium.constructionCost;
        stadiumConstructionCost.innerHTML = constructionCost;

        const visits = result.stadiumInfo.stadium.visits;
        stadiumVisits.innerHTML = visits;

        const averageRating = result.stadiumInfo.stadium.averageRating;
        stadiumAverageRating.innerHTML = averageRating === 0 ? "-" : averageRating;

        const userActivity = result.stadiumInfo.userActivity;
        const userVisited = userActivity.length;

        let allowChangeVisited = true;

        const hasActivity = userActivity.some(activity =>
            activity.visited_on !== null || activity.review_id !== null
        );

        const hasLogged = userActivity.some(activity => 
            activity.visited_on !== null
        );

        const handleCheckmarkClick = () => {
            if (!allowChangeVisited) {
                alert('There is activity on this stadium, cannot change');
                return;
            }
            const isCurrentlyVisited = checkmark.src.includes('checkmark-blue.png');
            const newVisitedState = !isCurrentlyVisited;
            updateVisitStatus(name, username, newVisitedState);
        };

        const handleHeartClick = () => {
            const isCurrentlyLiked = heart.src.includes('blue-heart.png');
            const newLikeState = !isCurrentlyLiked;

            updateLikeStatus(name, username, newLikeState);
        };

        if (username === '') {
            const logInBtn = createUserButton('user-button-log-in', 'Sign in to log or review', () => toggleMenu(logInMenu, true));
            const shareBtn = createUserButton('user-button-share', 'Share');
            appendButtons([logInBtn, shareBtn]);
        } else {
            checkmark.src = userVisited === 0 ? 'images/icons/checkmark-white.png' : 'images/icons/checkmark-blue.png';

            allowChangeVisited = !hasActivity;

            stadiumVisited.addEventListener('click', handleCheckmarkClick);

            if (userVisited === 0) {
                appendButtons([
                    makeButton('user-button-log', 'Log or review stadium'),
                    makeButton('user-button-activity', 'Show your activity'),
                    makeButton('user-button-wishlist', 'Add to wishlist'),
                    makeButton('user-button-share', 'Share')
                ]);
                stadiumVisitedText.textContent = 'Visit';
            }
            else {
                if (hasLogged) {
                    appendButtons([
                        makeButton('user-button-log', 'Log or review again'),
                        makeButton('user-button-activity', 'Show your activity'),
                        makeButton('user-button-wishlist', 'Add to wishlist'),
                        makeButton('user-button-share', 'Share')
                    ]);
                }
                else {
                    appendButtons([
                        makeButton('user-button-log', 'Log or review stadium'),
                        makeButton('user-button-activity', 'Show your activity'),
                        makeButton('user-button-wishlist', 'Add to wishlist'),
                        makeButton('user-button-share', 'Share')
                    ]);
                }
                stadiumVisitedText.textContent = 'Visited';
            }

            const userLogButton = document.getElementById('user-button-log');
            userLogButton.addEventListener('click', () => toggleMenu(addStadiumMenu, true));
        }

        if (userActivity.length > 0) {
            const userLiked = result.stadiumInfo.userActivity[0].liked_count;

            if (userLiked === 0) {
                stadiumLikeText.textContent = 'Like';
                heart.src = 'images/icons/gray-heart.png';
            }
            else if (userLiked > 0) {
                stadiumLikeText.textContent = 'Liked';
                heart.src = 'images/icons/blue-heart.png';
            }
        } 

        stadiumLike.addEventListener('click', handleHeartClick);

        let userRating = result.stadiumInfo.userActivity.length > 0 ? result.stadiumInfo.userActivity[0].rating : null;

        applySelectedRating(stars, userRating || 0);
        applySelectedRating(addStadiumStars, userRating || 0);
        stadiumRatingText.textContent = userRating !== null ? 'Rated' : 'Rate';
        setRatingEvents(name, username, userRating || '', '', 0);
        setRatingEventsAddStadium(name, username, userRating || '', '', 0);

        if (userRating !== null) {
            stadiumRating.addEventListener('mouseover', showClearButton);
            stadiumRating.addEventListener('mouseleave', hideClearButton);
        }

        const friendActivityResults = result.stadiumInfo.friendActivity;
        if (friendActivityResults.length === 0) {
            friendActivityContainer.style.display = 'none';
        }
        else if (friendActivityResults.length > 12) {
            for (let i = 0; i < 12; i++) {

            }
        }
        else {
            friendActivityResults.forEach(activity => {
                const friendActivityItem = document.createElement('div');
                friendActivityItem.classList.add('friend-activity-item');

                const friendActivityProfilePic = document.createElement('img');
                friendActivityProfilePic.classList.add('friend-activity-profile-pic');
                friendActivityProfilePic.src = 'images/icons/person-gray.png';

                const friendActivityStars = document.createElement('div');

                let starCount = 0;
                if (activity.rating != null) {
                    starCount = parseInt(activity.rating.trim().slice(0, -2), 10)
                    for (let i = 0; i < starCount; i++) {
                        const star = document.createElement('img');
                        star.classList.add('friend-activity-star');
                        star.src = 'images/icons/blue-star.png';
                        friendActivityStars.appendChild(star);
                    }
                    if (activity.rating.trim().endsWith('.5')) {
                        const halfStar = document.createElement('img');
                        halfStar.classList.add('friend-activity-half-star');
                        halfStar.src = 'images/icons/blue-star-half.png';
                        friendActivityStars.appendChild(halfStar);
                    }
                }

                friendActivityItem.appendChild(friendActivityProfilePic);
                friendActivityItem.appendChild(friendActivityStars);

                friendActivity.appendChild(friendActivityItem);

            })
        }

        const friendReviews = result.stadiumInfo.friend_reviews;

        if (friendReviews.length === 0) {
            friendReviewsContainer.style.display = 'none';
        }
        else {
            friendReviewsContainer.style.display = 'block';

            friendReviews.forEach(friendReview => {
                const friendReviewContainer = document.createElement('div');
                friendReviewContainer.classList.add('popular-review');

                const profilePic = document.createElement('img');
                profilePic.src = 'images/icons/person-gray.png';

                const userReview = document.createElement('div');
                userReview.classList.add('user-review');

                const userReviewInfo = document.createElement('div');

                const userReviewName = document.createElement('h4');
                userReviewName.textContent = friendReview.username;

                const userReviewStars = document.createElement('div');
                userReviewStars.classList.add('user-review-stars');

                let starCount = 0;
                if (friendReview.rating != null) {
                    starCount = parseInt(friendReview.rating.trim().slice(0, -2), 10)
                    for (let i = 0; i < starCount; i++) {
                        const star = document.createElement('img');
                        star.classList.add('user-review-star');
                        star.src = 'images/icons/blue-star.png';
                        userReviewStars.appendChild(star);
                    }
                    if (friendReview.rating.trim().endsWith('.5')) {
                        const halfStar = document.createElement('img');
                        halfStar.classList.add('user-review-half-star');
                        halfStar.src = 'images/icons/blue-star-half.png';
                        userReviewStars.appendChild(halfStar);
                    }
                }

                const userReviewLikes = document.createElement('h4');
                const likeText = friendReview.like_count === 1 ? ' Like' : ' Likes';
                userReviewLikes.textContent = friendReview.like_count.toLocaleString() + likeText;

                const userReviewReview = document.createElement('h5');
                userReviewReview.textContent = friendReview.review;

                userReviewInfo.appendChild(userReviewName);
                userReviewInfo.appendChild(userReviewStars);

                userReview.appendChild(userReviewInfo);
                userReview.appendChild(userReviewReview);
                userReview.appendChild(userReviewLikes);

                friendReviewContainer.appendChild(profilePic);
                friendReviewContainer.appendChild(userReview);

                friendReviewsContainer.appendChild(friendReviewContainer);
            })
        }

        const popularReviews = result.stadiumInfo.popular_reviews;

        const recentReviews = result.stadiumInfo.recent_reviews;

        if (recentReviews.length === 0) {
            popularReviewsContainer.style.display = 'none';
            recentReviewsContainer.style.display = 'none';
            noPopularReviewsContainer.style.display = 'block';
            noRecentReviewsContainer.style.display = 'block';
        }
        else {
            noPopularReviewsContainer.style.display = 'none';
            noRecentReviewsContainer.style.display = 'none';
            popularReviewsContainer.style.display = 'block';
            recentReviewsContainer.style.display = 'block';

            popularReviews.forEach(popularReview => {
                const popularReviewContainer = document.createElement('div');
                popularReviewContainer.classList.add('popular-review');

                const profilePic = document.createElement('img');
                profilePic.src = 'images/icons/person-gray.png';

                const userReview = document.createElement('div');
                userReview.classList.add('user-review');

                const userReviewInfo = document.createElement('div');

                const userReviewName = document.createElement('h4');
                userReviewName.textContent = popularReview.username;

                const userReviewStars = document.createElement('div');
                userReviewStars.classList.add('user-review-stars');

                let starCount = 0;
                if (popularReview.rating != null) {
                    starCount = parseInt(popularReview.rating.trim().slice(0, -2), 10)
                    for (let i = 0; i < starCount; i++) {
                        const star = document.createElement('img');
                        star.classList.add('user-review-star');
                        star.src = 'images/icons/blue-star.png';
                        userReviewStars.appendChild(star);
                    }
                    if (popularReview.rating.trim().endsWith('.5')) {
                        const halfStar = document.createElement('img');
                        halfStar.classList.add('user-review-half-star');
                        halfStar.src = 'images/icons/blue-star-half.png';
                        userReviewStars.appendChild(halfStar);
                    }
                }

                const userReviewLikes = document.createElement('h4');
                const likeText = popularReview.like_count === 1 ? ' Like' : ' Likes';
                userReviewLikes.textContent = popularReview.like_count.toLocaleString() + likeText;

                const userReviewReview = document.createElement('h5');
                userReviewReview.textContent = popularReview.review;

                userReviewInfo.appendChild(userReviewName);
                userReviewInfo.appendChild(userReviewStars);

                userReview.appendChild(userReviewInfo);
                userReview.appendChild(userReviewReview);
                userReview.appendChild(userReviewLikes);

                popularReviewContainer.appendChild(profilePic);
                popularReviewContainer.appendChild(userReview);

                popularReviewsContainer.appendChild(popularReviewContainer);
            })
            recentReviews.forEach(recentReview => {
                const recentReviewContainer = document.createElement('div');
                recentReviewContainer.classList.add('recent-review');

                const profilePic = document.createElement('img');
                profilePic.src = 'images/icons/person-gray.png';

                const userReview = document.createElement('div');
                userReview.classList.add('user-review');

                const userReviewInfo = document.createElement('div');

                const userReviewName = document.createElement('h4');
                userReviewName.textContent = recentReview.username;

                const userReviewStars = document.createElement('div');
                userReviewStars.classList.add('user-review-stars');

                let starCount = 0;
                if (recentReview.rating != null) {
                    starCount = parseInt(recentReview.rating.trim().slice(0, -2), 10)
                    for (let i = 0; i < starCount; i++) {
                        const star = document.createElement('img');
                        star.classList.add('user-review-star');
                        star.src = 'images/icons/blue-star.png';
                        userReviewStars.appendChild(star);
                    }
                    if (recentReview.rating.trim().endsWith('.5')) {
                        const halfStar = document.createElement('img');
                        halfStar.classList.add('user-review-half-star');
                        halfStar.src = 'images/icons/blue-star-half.png';
                        userReviewStars.appendChild(halfStar);
                    }
                }

                const userReviewLikes = document.createElement('h4');
                const likeText = recentReview.like_count === 1 ? ' Like' : ' Likes';
                userReviewLikes.textContent = recentReview.like_count.toLocaleString() + likeText;

                const userReviewReview = document.createElement('h5');
                userReviewReview.textContent = recentReview.review;

                userReviewInfo.appendChild(userReviewName);
                userReviewInfo.appendChild(userReviewStars);

                userReview.appendChild(userReviewInfo);
                userReview.appendChild(userReviewReview);
                userReview.appendChild(userReviewLikes);

                recentReviewContainer.appendChild(profilePic);
                recentReviewContainer.appendChild(userReview);

                recentReviewsContainer.appendChild(recentReviewContainer);
            })
        }

        addStadiumDateVisited.setAttribute("max", new Date().toISOString().split("T")[0]);
        addStadiumDateVisited.value = new Date().toISOString().split('T')[0];

        addStadiumName.textContent = name;
        addStadiumImage.src = result.stadiumInfo.stadium.image;

        if (userVisited > 0) {
            visitedBeforeCheckmark.style.display = 'block'
        }
        else {
            visitedBeforeCheckmark.style.display = 'none';
        }

        document.getElementById('stadium-skeleton').style.display = 'none';
        document.getElementById('stadium-content').style.display = 'block';

        document.getElementById('friend-activity-skeleton-container').style.display = 'none';
        document.getElementById('friend-activity-content').style.display = 'block';

        document.getElementById('friend-reviews-skeleton-container').style.display = 'none';
        document.getElementById('friend-reviews-content').style.display = 'block';

        document.getElementById('popular-reviews-skeleton-container').style.display = 'none';
        document.getElementById('popular-reviews-content').style.display = 'block';

        document.getElementById('recent-reviews-skeleton-container').style.display = 'none';
        document.getElementById('recent-reviews-content').style.display = 'block';

        document.getElementById('upcoming-events-skeleton-container').style.display = 'none';
        document.getElementById('upcoming-events-content').style.display = 'block';

    } catch (error) {
        alert(error.message);
    }
}

async function loadStadiumMap(name) {
    try {
        const response = await fetch('http://localhost:3000/stadium/loadStadiumMap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }

        const result = await response.json();

        const stadium = result.result;

        const latitude = stadium.latitude;
        const longitude = stadium.longitude;

        const map = L.map('stadium-map').setView([latitude, longitude], 6);

        const customIcon = L.icon({
            iconUrl: 'images/icons/pin-blue.png',
            iconSize: [25, 35],      
            iconAnchor: [16, 40],      
            popupAnchor: [-3, -40]
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
        }).addTo(map);

        L.marker([latitude, longitude], { icon: customIcon }).addTo(map)
            .bindPopup(`<div class="popup-card">
                            <h4>${stadium.stadium_name}</h4>
                        </div>`)
            
    } catch (error) {
        alert(error.message);
    }
}

async function loadUpcomingEvents(name) {
    const apiKey = 'WIKkbzK6ciettoJD7CfKieFrtP8BqcvJ';
    const venueSearchUrl = `https://app.ticketmaster.com/discovery/v2/venues.json?keyword=${name}&apikey=${apiKey}`;

    fetch(venueSearchUrl)
    .then(response => response.json())
    .then(data => {
        const venueId = data._embedded.venues[0].id;
        const eventUrl = `https://app.ticketmaster.com/discovery/v2/events.json?classificationName=sports&sort=date,asc&venueId=${venueId}&apikey=${apiKey}`;
        return fetch(eventUrl);
    })
    .then(response => response.json())
    .then(data => {
        const events = data._embedded.events;
        let eventCounter = 0;
        for (const event of events) {
            const upcomingEvent = document.createElement('div');
            upcomingEvent.classList.add('upcoming-event');

            const upcomingEventImage = document.createElement('img');
            const eventType = event.classifications[0].genre.name
            switch(eventType) {
                case "Football":
                    upcomingEventImage.src = 'images/icons/football-emoji.png';
                    break;
                case "Basketball":
                    upcomingEventImage.src = 'images/icons/basketball-emoji.png';
                    break;
                case "Baseball":
                    upcomingEventImage.src = 'images/icons/baseball-emoji.png';
                    break;
                case "Hockey":
                    upcomingEventImage.src = 'images/icons/hockey-emoji.png';
                    break;
                case "Soccer":
                    upcomingEventImage.src = 'images/icons/soccer-emoji.png';
                    break;
                default:
                    upcomingEventImage.src = 'images/icons/ticket-emoji.png';
                    break;
            }

            const eventInfo = document.createElement('div');
            eventInfo.classList.add('event-info');

            const eventName = document.createElement('h4');
            eventName.textContent = event.name;

            const eventDate = document.createElement('h4');
            const date = new Date(event.dates.start.localDate);
            eventDate.textContent = date.toLocaleDateString("en-US");;

            const eventTime = document.createElement('h4');
            const localTime = event.dates.start.localTime;
            if (localTime) {
                const [hours, minutes, seconds] = localTime.split(":");
                const time = new Date();
                time.setHours(Number(hours), Number(minutes), Number(seconds));
                const formattedTime = time.toLocaleTimeString("en-US", {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
                eventTime.textContent = formattedTime;
            }
            else {
                eventTime.textContent = "Time TBD";
            }

            eventInfo.appendChild(eventName);
            eventInfo.appendChild(eventDate);
            eventInfo.appendChild(eventTime);

            upcomingEvent.appendChild(upcomingEventImage);
            upcomingEvent.appendChild(eventInfo);

            upcomingEventsContainer.appendChild(upcomingEvent);

            eventCounter++;
            if (eventCounter >= 3) break;
        }
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });
}

async function updateLikeStatus(name, username, isLiked) {
    try {
        const response = await fetch('http://localhost:3000/stadium/updateUserLike', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, isLiked })
        });

        if (!response.ok) throw new Error('Failed to update like status');
        const result = await response.json();

        if (result.rows.affectedRows < 1) {
            alert('Failed to update like status');
            return;
        }

        heart.src = isLiked ? 'images/icons/blue-heart.png' : 'images/icons/gray-heart.png';
        stadiumLikeText.textContent = isLiked ? 'Liked' : 'Like';

    } catch (error) {
        console.error('Error updating like status:', error);
        // Optionally revert UI here
    }
}

async function updateVisitStatus(name, username, isVisited) {
    try {
        const response = await fetch('http://localhost:3000/stadium/updateUserStadium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, isVisited })
        });

        if (!response.ok) throw new Error('Failed to update visit status');
        const result = await response.json();

        if (result.rows.affectedRows < 1) {
            alert('Failed to update visit status');
            return;
        }

        checkmark.src = isVisited ? 'images/icons/checkmark-blue.png' : 'images/icons/checkmark-white.png';
        if (!isVisited) {
            applySelectedRating(stars, 0);
            stadiumRatingText.textContent = 'Rate';
        }
        stadiumVisitedText.textContent = isVisited ? 'Visited' : 'Visit';

    } catch (error) {
        console.error('Error updating visit status:', error);
        // Optionally revert UI here
    }
}

/*  Events  */
window.onload = async () => {
    const username = localStorage.getItem('username');
    if (username === '') {
        showLoggedOutUI();
    }
    else {
        showLoggedInUI();
    }
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('stadium');
    await loadStadiumInfo(name, username);
    await loadUpcomingEvents(name);
    await loadStadiumMap(name);
}

window.addEventListener("resize", () => {
    if (sidebarToggle.checked) {
        sidebarToggle.checked = false;
    }
});

createAccountButton.addEventListener('click', () => toggleMenu(createAccountMenu, true));

createAccountForm.addEventListener('submit', (event) => event.preventDefault());

logInButton.addEventListener('click', () => toggleMenu(logInMenu, true));

closeButtons['create-account-menu'].addEventListener('click', () => toggleMenu(createAccountMenu, false));

closeButtons['log-in-menu'].addEventListener('click', () => toggleMenu(logInMenu, false));

signUp.addEventListener('click', async () => {
    const newEmailInput = document.getElementById('new-email');
    const newUsernameInput = document.getElementById('new-username');
    const newPasswordInput = document.getElementById('new-password');
    const termsAndConditionsInput = document.getElementById('terms-and-conditions');

    const email = newEmailInput.value.trim();
    const username = newUsernameInput.value.trim();
    const password = newPasswordInput.value.trim();
    const termsAndConditions = termsAndConditionsInput.checked;

    if (!email || !username || !password) {
        alert('Please fill in all fields');
        return;
    }

    if (!termsAndConditions) {
        alert('Please accept the Terms and Conditions');
        return;
    }

    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    if (username.length > 30 || username.length < 6) {
        alert('Username must be between 6 and 30 characters.');
        return;
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*]/.test(password)) {
        alert('Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password })
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.error)
            return;
        }

        localStorage.setItem('username', username);
        window.location.replace('user-home.html');
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error creating your account. Please try again later.');
    }
});

logIn.addEventListener('click', async () => {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error');
        }
            
        const result = await response.json();

        localStorage.setItem('username', result.username);
        window.location.reload();
    } catch (error) {
        alert(error.message);
    }
});

logInForm.addEventListener("submit", (event) => event.preventDefault());

sidebarLogInButton.addEventListener('click', () => toggleMenu(logInMenu, true));

sidebarSignUpButton.addEventListener('click', () => toggleMenu(createAccountMenu, true));

sidebarLogOutButton.addEventListener('click', () => {
    localStorage.setItem('username', '');
    window.location.reload();
})

signUpLink.addEventListener('click', () => {
    toggleMenu(logInMenu, false, true);
    setTimeout(() => {
        toggleMenu(createAccountMenu, true, true);
    }, 200);
});

signInLink.addEventListener('click', () => {
    toggleMenu(createAccountMenu, false, true);
    setTimeout(() => {
        toggleMenu(logInMenu, true, true);
    }, 200);
});

logOutButton.addEventListener('click', () => {
    localStorage.setItem('username', '');
    window.location.reload();
});

closeAddStadiumMenu.addEventListener('click', () => toggleMenu(addStadiumMenu, false));

addStadiumVisitedBefore.addEventListener('click', () => {
    const isVisible = visitedBeforeCheckmark.style.display === 'block';
    toggleCheckmark(!isVisible);
});

addStadiumLikeContainer.addEventListener('click', () => {
    const isLiked = addStadiumHeart.src.includes('images/icons/blue-heart.png');
    toggleHeart(!isLiked);
})

addStadiumSubmitButton.addEventListener('click', async () => {
    const username = localStorage.getItem('username');

    const urlParams = new URLSearchParams(window.location.search);
    const stadiumName = urlParams.get('stadium');

    const visitedOn = addStadiumDateVisited.value;

    const userReview = addStadiumReview.value || null;

    const match = ratingText.textContent.match(/([\d.]+)\s+out of 5/i);
    const userRating = match ? parseFloat(match[1]) : null;

    const userLiked = addStadiumHeart.src.includes('images/icons/blue-heart.png');

    try {
        const response = await fetch('http://localhost:3000/stadium/addStadium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, stadiumName, visitedOn, userReview, userRating, userLiked })
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.error)
            return;
        }

        window.location.reload();
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error adding this stadium. Please try again later.');
    }
})