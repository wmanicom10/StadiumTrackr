/*  Imports  */
import { createToast, logOut, shakeOrReplace, toggleMenu, validateEmail, validatePassword, validateUsername } from "./utils.js";
import { getHeaderElements, PROFILE_PIC_PATH } from "./constants.js";
import { authAPI } from "./api/auth.js";

/*  Variables  */
let scrollY = 0;

const lockScroll = () => {
    scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
};

const unlockScroll = () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY);
};

/*  Async Functions  */
async function handleLogin() {
    const username = document.getElementById('username')?.value.trim() || '';
    const password = document.getElementById('password')?.value.trim() || '';
    
    if (!username || !password) {
        shakeOrReplace('Please fill in all fields.')
        return;
    }

    try {
        const result = await authAPI.login(username, password);
        localStorage.setItem('token', result.token);
        window.location.replace('user-home.html');
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'Login failed. Please try again.')
    }
}

async function handleSignup() {
    const email = document.getElementById('new-email')?.value.trim() || '';
    const username = document.getElementById('new-username')?.value.trim() || '';
    const password = document.getElementById('new-password')?.value.trim() || '';
    const termsAccepted = document.getElementById('terms-and-conditions')?.checked || false;
    
    const signupErrors = validateSignupForm(email, username, password, termsAccepted);
    if (signupErrors.length > 0) {
        shakeOrReplace(signupErrors[0]);
        return;
    }

    try {
        const result = await authAPI.signup(email, username, password);
        localStorage.setItem('token', result.token);
        window.location.replace('user-home.html');
    } catch (error) {
        console.error(error);
        shakeOrReplace(error.message || 'There was an error creating your account. Please try again.');
    }
}

/*  Functions  */
function handleMenuSwitch(fromMenu, toMenu, overlay) {
    toggleMenu(fromMenu, false, overlay, true);
    setTimeout(() => {
        toggleMenu(toMenu, true, overlay, true);
    }, 200);
}

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

    const usernameError = validateUsername(username);
    if (usernameError) {
        errors.push(usernameError);
    }

    if (!validateEmail(email)) {
        errors.push('Please enter a valid email address');
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
        errors.push(passwordError);
    }

    return errors;
}

/*  Exported Functions  */
export function registerCommonEvents() {
    const sidebarToggles = [
        document.getElementById('sidebar-active'),
        document.getElementById('sidebar-active-logged-in')
    ];

    window.addEventListener('resize', () => {
        sidebarToggles.forEach(toggle => {
            if (toggle?.checked) {
                toggle.checked = false;
                unlockScroll();
            }
        });
    });
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
    createAccountButtons,
    sidebarToggle,
    sidebarToggleLoggedIn
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

    const sidebarOverlayLoggedIn = document.getElementById('sidebar-overlay-logged-in');
    const closeSidebarBtnLoggedIn = document.querySelector('#sidebar-active-logged-in ~ .links-container .close-sidebar-button');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const closeSidebarBtn = document.querySelector('#sidebar-active ~ .links-container .close-sidebar-button');

    let scrollY = 0;

    const lockScroll = () => {
        scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
    };

    const unlockScroll = () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
    };

    sidebarToggleLoggedIn?.addEventListener('change', () => {
        sidebarToggleLoggedIn.checked ? lockScroll() : unlockScroll();
    });

    sidebarToggle?.addEventListener('change', () => {
        sidebarToggle.checked ? lockScroll() : unlockScroll();
    });

    sidebarOverlay?.addEventListener('click', unlockScroll);
    closeSidebarBtn?.addEventListener('click', unlockScroll);
    sidebarOverlayLoggedIn?.addEventListener('click', unlockScroll);
    closeSidebarBtnLoggedIn?.addEventListener('click', unlockScroll);
}

export function registerLogOutEvents() {
    const { logOutButton, sidebarLogOutButton } = getHeaderElements();

    logOutButton?.addEventListener('click', () => {
        logOut();
        window.location.reload();
    });

    sidebarLogOutButton?.addEventListener('click', () => {
        logOut();
        window.location.reload();
    });
}

export function registerUserLogOutEvents() {
    const { logOutButton, sidebarLogOutButton } = getHeaderElements();

    logOutButton?.addEventListener('click', () => {
        logOut();
        window.location.replace('index.html');
    });
    sidebarLogOutButton?.addEventListener('click', () => {
        logOut();
        window.location.replace('index.html');
    });
}