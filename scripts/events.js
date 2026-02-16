import { toggleMenu, validateEmail, validatePassword, validateUsername } from "./utils.js";
import { authAPI } from "./api/auth.js";

function validateSignupForm(email, username, password, termsAccepted) {
    const errors = [];

    if (!email || !username || !password) {
        errors.push('Please fill in all fields');
        return errors;
    }

    if (!termsAccepted) {
        errors.push('Please accept the Terms and Conditions');
        return errors;
    }

    if (!validateEmail(email)) {
        errors.push('Please enter a valid email address');
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
        errors.push(usernameError);
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
        errors.push(passwordError);
    }

    return errors;
}

function validateLoginForm(username, password) {
    if (!username || !password) {
        return 'Please fill in all fields';
    }
    return null;
}

function getSignupFormData() {
    return {
        email: document.getElementById('new-email')?.value.trim() || '',
        username: document.getElementById('new-username')?.value.trim() || '',
        password: document.getElementById('new-password')?.value.trim() || '',
        termsAccepted: document.getElementById('terms-and-conditions')?.checked || false
    };
}

function getLoginFormData() {
    return {
        username: document.getElementById('username')?.value.trim() || '',
        password: document.getElementById('password')?.value.trim() || ''
    };
}

async function handleSignup() {
    const { email, username, password, termsAccepted } = getSignupFormData();
    
    const errors = validateSignupForm(email, username, password, termsAccepted);
    if (errors.length > 0) {
        alert(errors[0]);
        return;
    }

    try {
        await authAPI.signup(email, username, password);
        
        localStorage.setItem('username', username);
        window.location.replace('user-home.html');
    } catch (error) {
        console.error('Signup error:', error);
        alert(error.message || 'There was an error creating your account. Please try again later.');
    }
}

async function handleLogin() {
    const { username, password } = getLoginFormData();
    
    const error = validateLoginForm(username, password);
    if (error) {
        alert(error);
        return;
    }

    try {
        const result = await authAPI.login(username, password);
        
        localStorage.setItem('username', result.username);
        window.location.replace('user-home.html');
    } catch (error) {
        alert(error.message || 'Login failed. Please try again.');
    }
}

function handleMenuSwitch(fromMenu, toMenu, overlay) {
    toggleMenu(fromMenu, false, overlay, true);
    setTimeout(() => {
        toggleMenu(toMenu, true, overlay, true);
    }, 200);
}

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
    signInLink,
    createAccountButtons
}) {
    createAccountForm?.addEventListener('submit', (e) => e.preventDefault());
    logInForm?.addEventListener('submit', (e) => e.preventDefault());

    createAccountButtons?.forEach(button => {
        button?.addEventListener('click', () => {
            if (logInMenu.style.display === 'block') {
                toggleMenu(logInMenu, false, overlay, true);
            }
            toggleMenu(createAccountMenu, true, overlay);
        });
    });

    logInButton?.addEventListener('click', () => {
        if (createAccountMenu.style.display === 'block') {
            toggleMenu(createAccountMenu, false, overlay, true);
        }
        toggleMenu(logInMenu, true, overlay)
    });

    closeButtons['create-account-menu']?.addEventListener('click', () => 
        toggleMenu(createAccountMenu, false, overlay)
    );
    closeButtons['log-in-menu']?.addEventListener('click', () => 
        toggleMenu(logInMenu, false, overlay)
    );

    signUp?.addEventListener('click', () => 
        handleSignup(overlay, createAccountMenu)
    );

    logIn?.addEventListener('click', handleLogin);

    sidebarLogInButton?.addEventListener('click', () => {
        if (createAccountMenu.style.display === 'block') {
            toggleMenu(createAccountMenu, false, overlay, true);
        }
        toggleMenu(logInMenu, true, overlay)
    });
    
    sidebarSignUpButton?.addEventListener('click', () => {
        if (logInMenu.style.display === 'block') {
            toggleMenu(logInMenu, false, overlay, true);
        }
        toggleMenu(createAccountMenu, true, overlay)
    });

    signUpLink?.addEventListener('click', () => 
        handleMenuSwitch(logInMenu, createAccountMenu, overlay)
    );
    
    signInLink?.addEventListener('click', () => 
        handleMenuSwitch(createAccountMenu, logInMenu, overlay)
    );
}

export function registerCommonEvents() {
    const sidebarToggles = [
        document.getElementById('sidebar-active'),
        document.getElementById('sidebar-active-logged-in')
    ];

    window.addEventListener('resize', () => {
        sidebarToggles.forEach(toggle => {
            if (toggle?.checked) {
                toggle.checked = false;
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModals = document.querySelectorAll('.menu[style*="display: block"]');
            activeModals.forEach(modal => {
                const overlay = document.getElementById('overlay');
                toggleMenu(modal, false, overlay);
            });
        }
    });
}