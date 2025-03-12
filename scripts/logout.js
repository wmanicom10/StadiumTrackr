const logOutButton = document.getElementById('log-out');

logOutButton.addEventListener("click", () => {
    localStorage.setItem('username', '');
    window.location.replace('home.html');
    setTimeout(() => {
        history.pushState(null, null, 'home.html');
    }, 0);
})