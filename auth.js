// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'index.html';
    }
});

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

// Google login
function loginWithGoogle() {
    // Simulated Google OAuth login
    const googleProfiles = [
        { name: 'John Smith', email: 'john.smith@gmail.com' },
        { name: 'Sarah Johnson', email: 'sarah.johnson@gmail.com' },
        { name: 'Alex Brown', email: 'alex.brown@gmail.com' }
    ];
    
    // Select a random profile for demo
    const profile = googleProfiles[Math.floor(Math.random() * googleProfiles.length)];
    
    // Store current user
    const currentUser = {
        name: profile.name,
        email: profile.email,
        loginTime: new Date().toISOString(),
        provider: 'google'
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showAuthNotification(`Welcome ${profile.name}! Redirecting...`, 'success');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

function signupWithGoogle() {
    // Simulated Google OAuth signup
    const name = prompt('Enter your full name:');
    if (!name) {
        showAuthNotification('Signup cancelled', 'info');
        return;
    }
    
    const email = prompt('Enter your email:');
    if (!email) {
        showAuthNotification('Signup cancelled', 'info');
        return;
    }
    
    if (!email.includes('@')) {
        showAuthNotification('Please enter a valid email', 'error');
        return;
    }
    
    // Store current user
    const currentUser = {
        name: name,
        email: email,
        loginTime: new Date().toISOString(),
        provider: 'google'
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showAuthNotification(`Account created! Welcome ${name}...`, 'success');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

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