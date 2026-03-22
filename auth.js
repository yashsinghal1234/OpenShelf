// Show signup form
function showSignup() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('signupForm').classList.add('active');
}

// Show login form
function showLogin() {
    document.getElementById('signupForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
}

// Handle login
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];

    // Find user
    const user = users.find(u => u.email === email);

    if (!user) {
        showAuthNotification('No account found with this email', 'error');
        return;
    }

    if (user.password !== btoa(password)) {
        showAuthNotification('Incorrect password', 'error');
        return;
    }

    // Store current user
    const currentUser = {
        name: user.name,
        email: user.email,
        loginTime: new Date().toISOString(),
        rememberMe: rememberMe
    };

    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    showAuthNotification('Login successful! Redirecting...', 'success');

    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// Handle signup
function handleSignup(event) {
    event.preventDefault();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (password !== confirmPassword) {
        showAuthNotification('Passwords do not match', 'error');
        return;
    }

    if (password.length < 8) {
        showAuthNotification('Password must be at least 8 characters', 'error');
        return;
    }

    // Get existing users
    const users = JSON.parse(localStorage.getItem('users')) || [];

    // Check if email already exists
    if (users.some(u => u.email === email)) {
        showAuthNotification('An account with this email already exists', 'error');
        return;
    }

    // Create new user
    const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: btoa(password), // Simple encoding (use proper encryption in production)
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    showAuthNotification('Account created successfully! Please log in.', 'success');

    setTimeout(() => {
        showLogin();
    }, 1500);
}

// Real Google OAuth 2.0 Authentication
const GOOGLE_CLIENT_ID = '990435968914-p1f4hjup5phgnl1m4k7fb79023rmik8f.apps.googleusercontent.com';

// Initialize Google Sign-In
function initializeGoogleSignIn() {
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
            auto_select: false
        });
    }
}

// Handle Google Sign-In Response
function handleGoogleSignIn(response) {
    if (response.credential) {
        try {
            // Decode the JWT token
            const credentials = decodeJwtResponse(response.credential);

            // Store current user
            const currentUser = {
                name: credentials.name,
                email: credentials.email,
                profilePicture: credentials.picture,
                loginTime: new Date().toISOString(),
                provider: 'google',
                googleToken: response.credential
            };

            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showAuthNotification(`Welcome ${credentials.name}!`, 'success');

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            console.error('Error processing Google sign-in:', error);
            showAuthNotification('Error signing in with Google', 'error');
        }
    }
}

// Decode JWT Response
function decodeJwtResponse(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
    return JSON.parse(jsonPayload);
}

// Google login - Show account selector/One Tap UI
function loginWithGoogle() {
    if (typeof google !== 'undefined' && google.accounts) {
        // Try to show One Tap UI first (shows saved accounts)
        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // If One Tap is not available, render the Google Sign-In button
                const loginDiv = document.createElement('div');
                loginDiv.id = 'googleLoginDiv';
                loginDiv.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 10000;
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                `;

                document.body.appendChild(loginDiv);
                google.accounts.id.renderButton(loginDiv, {
                    theme: 'outline',
                    size: 'large',
                    width: '300'
                });
            }
        });
    } else {
        showAuthNotification('Google Sign-In not available. Please refresh the page.', 'error');
    }
}

// Google signup - Same as login (Google handles both)
function signupWithGoogle() {
    loginWithGoogle();
}

// Check authentication on page load with Google Sign-In initialization
window.addEventListener('DOMContentLoaded', () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'index.html';
    }

    // Initialize Google Sign-In
    setTimeout(() => {
        initializeGoogleSignIn();
    }, 500);
});

// Notification system
function showAuthNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.auth-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `auth-notification ${type}`;

    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #1a1a1a;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        border-left: 4px solid ${colors[type]};
        min-width: 300px;
        max-width: 400px;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 500;
    `;

    notification.innerHTML = `
        <i class="fas ${icons[type]}" style="color: ${colors[type]}; font-size: 1.25rem;"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);