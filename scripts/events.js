import { toggleMenu, validateEmail } from "./utils.js";

export function registerEventListeners({
    overlay,
    createAccountForm,
    logInForm,
    logInButton,
    signUp,
    logIn,
    closeButtons,
    createAccountMenu,
    logInMenu,
    sidebarLogInButton,
    sidebarSignUpButton,
    signUpLink,
    signInLink
}) {
    createAccountForm.addEventListener('submit', function(event) {
        event.preventDefault();
    });

    logInButton.addEventListener('click', () => toggleMenu(logInMenu, true, overlay));

    closeButtons['create-account-menu'].addEventListener('click', () => toggleMenu(createAccountMenu, false, overlay));
    closeButtons['log-in-menu'].addEventListener('click', () => toggleMenu(logInMenu, false, overlay));

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

    logInForm.addEventListener("submit", function(event) {
        event.preventDefault();
    });

    sidebarLogInButton.addEventListener('click', () => {
        toggleMenu(logInMenu, true, overlay);
    });

    sidebarSignUpButton.addEventListener('click', () => {
        toggleMenu(createAccountMenu, true, overlay);
    });

    signUpLink.addEventListener('click', () => {
        toggleMenu(logInMenu, false, overlay, true);
        setTimeout(() => {
            toggleMenu(createAccountMenu, true, overlay, true);
        }, 200);
    });

    signInLink.addEventListener('click', () => {
        toggleMenu(createAccountMenu, false, overlay, true);
        setTimeout(() => {
            toggleMenu(logInMenu, true, overlay, true);
        }, 200);
    });
}