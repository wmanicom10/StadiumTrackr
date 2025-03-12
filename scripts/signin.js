export async function signIn(username, password) {
  // replace with mysql logic to log in
  try {
    const userRef = database.ref(`users/${username}`);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists() || snapshot.val().password !== password) {
        alert("Incorrect username or password. Please try again.");
<<<<<<< HEAD
=======
        usernameInput.value = '';
        passwordInput.value = '';
>>>>>>> 72ced5a82d69c346eef5c2fec5c4ac98d69857ac
        return;
    }

    localStorage.setItem('username', username);
    window.location.replace('user-home.html')
  } catch (error) {
<<<<<<< HEAD
      alert('Error accessing database');
      console.error(error)
=======
      alert('Error accessing database:');
>>>>>>> 72ced5a82d69c346eef5c2fec5c4ac98d69857ac
  }
}