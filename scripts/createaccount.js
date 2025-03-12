export async function createAccount(email, username, password) {
    // replace with mysql logic to add new user
    try {
        const usersRef = firebase.database().ref('users');
        const snapshot = await usersRef.once('value');
        const users = snapshot.val() || {};

        if (users[username]) {
            alert('Username is already taken. Please choose another.');
            return;
        }

        if (Object.values(users).some(user => user.email === email)) {
            alert('Email is already in use. Please use a different email.');
            return;
        }

        await usersRef.child(username).set({
            email,
            username,
            password,
            countries: 0,
            events_attended: 0,
        });

        localStorage.setItem('username', username);
        window.location.replace('user-home.html');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
};