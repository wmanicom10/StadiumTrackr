export async function signIn(username, password) {
  // replace with mysql logic to log in
  try {
    const userRef = database.ref(`users/${username}`);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists() || snapshot.val().password !== password) {
        alert("Incorrect username or password. Please try again.");
        return;
    }

    localStorage.setItem('username', username);
    window.location.replace('user-home.html')
  } catch (error) {
      alert('Error accessing database');
      console.error(error)
  }
}