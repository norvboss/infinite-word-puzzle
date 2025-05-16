// Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;

        // Initialize UI elements
        this.authContainer = document.getElementById('auth-container');
        this.loginForm = document.getElementById('login-form');
        this.signupForm = document.getElementById('signup-form');
        this.authMessage = document.getElementById('auth-message');
        
        // If elements don't exist, create them
        if (!this.authContainer) {
            this.createAuthUI();
        }

        this.setupEventListeners();
        
        // Initialize authentication immediately
        // This will check for token in localStorage and handle UI visibility
        this.initAuthentication();
    }
    
    // New method to handle initial authentication
    async initAuthentication() {
        console.log("Auth: Starting initial authentication...");
        
        // Hide all containers during initialization to prevent flicker
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) loadingMessage.classList.remove('hidden');
        
        const homeContainer = document.getElementById('home-container');
        if (homeContainer) homeContainer.classList.add('hidden');
        
        if (this.authContainer) this.authContainer.classList.add('hidden');
        
        // Get token from localStorage
        const token = localStorage.getItem('wordleToken');
        
        if (!token) {
            console.log("Auth: No token found, showing login screen");
            // Hide loading message
            if (loadingMessage) loadingMessage.classList.add('hidden');
            // Show auth container
            if (this.authContainer) this.authContainer.classList.remove('hidden');
            return;
        }
        
        try {
            console.log("Auth: Token found, validating with server...");
            // Check session with server
            const response = await fetch('http://localhost:3001/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            
                if (response.ok) {
                console.log("Auth: Valid session, processing user data");
                const userData = await response.json();
                
                // Set current user with complete data from server
                this.currentUser = userData;
                    this.isAuthenticated = true;
                
                // Update username display
                const usernameDisplay = document.getElementById('home-username-display');
                if (usernameDisplay) {
                    usernameDisplay.textContent = this.currentUser.username || 'Unknown';
                }
                
                // Show logout button
                const logoutButton = document.getElementById('logout-button');
                if (logoutButton) {
                    logoutButton.classList.remove('hidden');
                }
                
                // Initialize home screen
                    if (window.homeScreen) {
                    console.log("Auth: Initializing home screen with user data");
                        window.homeScreen.init(this.currentUser);
                    if (homeContainer) homeContainer.classList.remove('hidden');
                } else {
                    console.error("Auth: HomeScreen not found");
                }
                
            } else {
                console.log("Auth: Invalid token, showing login");
                localStorage.removeItem('wordleToken');
                // Show auth container
                if (this.authContainer) this.authContainer.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Auth: Error during initialization:", error);
            localStorage.removeItem('wordleToken');
            // Show auth container
            if (this.authContainer) this.authContainer.classList.remove('hidden');
        } finally {
            // Always hide loading message when done
            if (loadingMessage) loadingMessage.classList.add('hidden');
        }
    }
    
    checkExistingSession() {
        const userData = localStorage.getItem('wordleUser');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.isAuthenticated = true;
                // Load user friends and stats
                this.loadUserData();
            } catch (e) {
                console.error('Error loading user data:', e);
                localStorage.removeItem('wordleUser');
            }
        }
    }
    
    loadUserData() {
        // Load the user's friends list
        const friendsData = localStorage.getItem(`friends_${this.currentUser.username}`);
        if (friendsData) {
            this.currentUser.friends = JSON.parse(friendsData);
        } else {
            this.currentUser.friends = [];
        }
        
        // Load user stats if not already present
        if (!this.currentUser.stats) {
            const statsData = localStorage.getItem(`stats_${this.currentUser.username}`);
            if (statsData) {
                this.currentUser.stats = JSON.parse(statsData);
            } else {
                this.currentUser.stats = {
                    gamesPlayed: 0,
                    gamesWon: 0,
                    currentStreak: 0,
                    maxStreak: 0,
                    totalPoints: 0,
                    highestLevel: 1
                };
            }
        }
    }
    
    saveUserData() {
        if (this.currentUser) {
            localStorage.setItem('wordleUser', JSON.stringify(this.currentUser));
            localStorage.setItem(`friends_${this.currentUser.username}`, JSON.stringify(this.currentUser.friends || []));
            localStorage.setItem(`stats_${this.currentUser.username}`, JSON.stringify(this.currentUser.stats || {}));
        }
    }

    createAuthUI() {
        // Create container
        this.authContainer = document.createElement('div');
        this.authContainer.id = 'auth-container';
        
        // If user is already authenticated, hide auth container immediately
        if (this.isAuthenticated) {
            console.log("createAuthUI: User already authenticated, hiding auth container from creation");
            this.authContainer.classList.add('hidden');
        }
        
        document.body.appendChild(this.authContainer);
        
        // Add auth forms
        this.authContainer.innerHTML = `
            <div class="auth-forms">
                <div class="auth-header">
                <h1>Infinite Wordle</h1>
                    <p>Sign in or create an account to play</p>
                </div>
                
                <div id="auth-message" class="auth-message"></div>
                
                <div class="tabs">
                    <button id="login-tab" class="tab active">Login</button>
                    <button id="signup-tab" class="tab">Sign Up</button>
                </div>
                
                <form id="login-form" class="auth-form">
                        <div class="form-group">
                            <label for="login-username">Username</label>
                        <input type="text" id="login-username" name="username" required>
                        </div>
                        <div class="form-group">
                            <label for="login-password">Password</label>
                        <input type="password" id="login-password" name="password" required>
                        </div>
                        <button type="submit" class="auth-button">Login</button>
                    </form>
                
                <form id="signup-form" class="auth-form hidden">
                        <div class="form-group">
                        <label for="signup-username">Username</label>
                        <input type="text" id="signup-username" name="username" required>
                        </div>
                        <div class="form-group">
                        <label for="signup-email">Email</label>
                        <input type="email" id="signup-email" name="email" required>
                        </div>
                        <div class="form-group">
                        <label for="signup-password">Password</label>
                        <input type="password" id="signup-password" name="password" required>
                        </div>
                        <div class="form-group">
                        <label for="signup-confirm">Confirm Password</label>
                        <input type="password" id="signup-confirm" name="confirm" required>
                        </div>
                    <button type="submit" class="auth-button">Sign Up</button>
                    </form>
            </div>
        `;

        // Add CSS
            const style = document.createElement('style');
            style.textContent = `
                #auth-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                width: 100%;
                height: 100%;
                background-color: var(--background-color);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                z-index: 1000;
                }
            
            .auth-forms {
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                padding: 30px;
                width: 100%;
                    max-width: 400px;
                }
            
            .auth-header {
                    text-align: center;
                margin-bottom: 24px;
            }
            
            .auth-header h1 {
                color: #333;
                margin-bottom: 8px;
            }
            
            .auth-header p {
                color: #666;
                font-size: 14px;
            }
            
            .tabs {
                    display: flex;
                    margin-bottom: 20px;
                border-bottom: 1px solid #ddd;
                }
            
            .tab {
                    flex: 1;
                    padding: 10px;
                    background: none;
                    border: none;
                    cursor: pointer;
                font-size: 16px;
                    color: #777;
                }
            
            .tab.active {
                    color: var(--correct-color);
                border-bottom: 2px solid var(--correct-color);
            }
            
                .auth-form {
                display: flex;
                flex-direction: column;
                gap: 15px;
                }
            
                .form-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
                }
            
                .form-group label {
                font-size: 14px;
                    color: #555;
                }
            
                .form-group input {
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                font-size: 16px;
                }
            
                .auth-button {
                background-color: var(--correct-color);
                color: white;
                    border: none;
                    border-radius: 4px;
                padding: 12px;
                font-size: 16px;
                    cursor: pointer;
                    margin-top: 10px;
                }
            
            .auth-button:hover {
                background-color: #5a9658;
            }
            
            .auth-message {
                    text-align: center;
                margin-bottom: 15px;
                color: #e74c3c;
                min-height: 20px;
            }
            
            .hidden {
                display: none;
                }
            `;
            document.head.appendChild(style);
        
        // Get form references
        this.loginForm = document.getElementById('login-form');
        this.signupForm = document.getElementById('signup-form');
        this.authMessage = document.getElementById('auth-message');
    }

    setupEventListeners() {
        // Tab switching
        document.getElementById('login-tab').addEventListener('click', () => {
            document.getElementById('login-tab').classList.add('active');
            document.getElementById('signup-tab').classList.remove('active');
            this.loginForm.classList.remove('hidden');
            this.signupForm.classList.add('hidden');
            this.authMessage.textContent = '';
        });
        
        document.getElementById('signup-tab').addEventListener('click', () => {
            document.getElementById('signup-tab').classList.add('active');
            document.getElementById('login-tab').classList.remove('active');
            this.signupForm.classList.remove('hidden');
            this.loginForm.classList.add('hidden');
            this.authMessage.textContent = '';
        });
        
        // Login form submission
        this.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
                const password = document.getElementById('login-password').value;
            
            this.login(username, password);
        });
        
        // Signup form submission
        this.signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('signup-username').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const confirm = document.getElementById('signup-confirm').value;
            
            this.signup(username, email, password, confirm);
        });
    }
    
    showAuthMessage(message, isError = true) {
        this.authMessage.textContent = message;
        this.authMessage.style.color = isError ? '#e74c3c' : '#2ecc71';
    }

    async login(username, password) {
        try {
            this.showAuthMessage('Logging in...', false);
            
            // Send login request to server
            const response = await fetch('http://localhost:3001/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store token in localStorage
                localStorage.setItem('wordleToken', data.token);
                
                // Initialize systems with the user data
                this.initializeAfterAuth(data.user);
                
                return true;
            } else {
                this.showAuthMessage(data.error || 'Login failed');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAuthMessage('Failed to connect to server');
            return false;
        }
    }
    
    async signup(username, email, password, confirm) {
        // Validate password and confirmation
        if (password !== confirm) {
            this.showAuthMessage('Passwords do not match.');
            return false;
        }
        
        // Basic validation
        if (username.length < 3) {
            this.showAuthMessage('Username must be at least 3 characters long.');
            return false;
        }
        
        if (password.length < 6) {
            this.showAuthMessage('Password must be at least 6 characters long.');
            return false;
        }
        
        try {
            this.showAuthMessage('Creating your account...', false);
            
            // Send signup request to server
            const response = await fetch('http://localhost:3001/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store token in localStorage
                localStorage.setItem('wordleToken', data.token);
                
                // Initialize systems with the user data
                this.initializeAfterAuth(data.user);
                
                return true;
            } else {
                this.showAuthMessage(data.error || 'Signup failed');
                return false;
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showAuthMessage('Failed to connect to server');
            return false;
        }
    }

    logout() {
        console.log("Logging out user");
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('wordleToken');
        
        // Show auth screen again
        if (this.authContainer) this.authContainer.classList.remove('hidden');
        
        // Hide other containers
        const homeContainer = document.getElementById('home-container');
        if (homeContainer) homeContainer.classList.add('hidden');
        
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) gameContainer.classList.add('hidden');
        
        // Reset username display
        const usernameDisplay = document.getElementById('home-username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = 'Not logged in';
        }
        
        // Hide logout button
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.classList.add('hidden');
        }
    }
    
    showAuthSuccess() {
        // Hide auth container
        this.authContainer.classList.add('hidden');
        
        // Initialize the home screen
        if (typeof homeScreen !== 'undefined') {
            homeScreen.init(this.currentUser);
            document.getElementById('home-container').classList.remove('hidden');
        } else {
            console.error('Home screen not initialized');
        }
    }

    async checkSession() {
        console.log("Auth.checkSession: Starting check...");
        const token = localStorage.getItem('wordleToken');
        
        if (!token) {
            console.log("Auth.checkSession: No token found, showing login.");
            if (this.authContainer) this.authContainer.classList.remove('hidden');
            return false;
        }
        
        try {
            console.log("Auth.checkSession: Sending request to /me endpoint");
            const response = await fetch('http://localhost:3001/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                console.log("Auth.checkSession: Valid session, processing user data");
                const userData = await response.json();
                
                // Set current user with complete data from server
                this.currentUser = userData;
                this.isAuthenticated = true;
                
                // Hide auth container
                if (this.authContainer) {
                    this.authContainer.classList.add('hidden');
                }
                
                // Update header display
                const usernameDisplay = document.getElementById('home-username-display');
                if (usernameDisplay) {
                    usernameDisplay.textContent = this.currentUser.username;
                }
                
                // Show logout button
                const logoutButton = document.getElementById('logout-button');
                if (logoutButton) {
                    logoutButton.classList.remove('hidden');
                }
                
                // Initialize home screen
                if (window.homeScreen) {
                    window.homeScreen.init(this.currentUser);
                    document.getElementById('home-container').classList.remove('hidden');
                }
                
                return true;
            } else {
                console.log("Auth.checkSession: Invalid session, clearing token and showing login");
                localStorage.removeItem('wordleToken');
                if (this.authContainer) this.authContainer.classList.remove('hidden');
                return false;
            }
        } catch (error) {
            console.error("Auth.checkSession: Error checking session:", error);
            localStorage.removeItem('wordleToken');
            if (this.authContainer) this.authContainer.classList.remove('hidden');
            return false;
        }
    }
    async saveUserStats(stats) {
        if (!this.isAuthenticated || !this.currentUser) {
            console.error("Cannot save stats: No authenticated user");
            return false;
        }
        
        try {
            const token = localStorage.getItem('wordleToken');
            if (!token) {
                console.error("Cannot save stats: No auth token");
                return false;
            }
            
            const response = await fetch('http://localhost:3001/stats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ stats })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log("Stats saved successfully:", result);
                
                // Update local user data
                if (result.user) {
                    this.currentUser = result.user;
                }
                return true;
            } else {
                console.error("Error saving stats:", await response.text());
                return false;
            }
        } catch (error) {
            console.error("Error in saveUserStats:", error);
            return false;
        }
    }

    // Function to initialize game systems after successful authentication
    initializeAfterAuth(userData) {
        console.log('Auth: Initializing systems after successful authentication');
        this.currentUser = userData;
        this.isAuthenticated = true;
        
        // Update UI state
        this.updateAuthUI();
        
        // Initialize home screen
        console.log('Auth: Initializing home screen with user data');
        if (window.homeScreen) {
            window.homeScreen.init(userData);
        }
        
        // Initialize socket connection for multiplayer
        console.log('Auth: Initializing socket connection for multiplayer');
        if (window.multiplayerSocket) {
            if (!window.multiplayerSocket.connected) {
                window.multiplayerSocket.connect();
            }
            
            // Register username with socket - try multiple ways
            const username = userData.username;
            if (username) {
                console.log('Auth: Registering username with socket:', username);
                window.multiplayerSocket.registerUser(username);
                
                // Also try the more comprehensive method if available
                if (typeof window.multiplayerSocket.registerUsernameFromAllPossibleSources === 'function') {
                    window.multiplayerSocket.registerUsernameFromAllPossibleSources();
                }
            }
        }
        
        // Initialize friend challenges system
        console.log('Auth: Initializing friend challenges system');
        if (window.friendChallengesUI) {
            window.friendChallengesUI.initialize();
        }
    }

    // Update the authentication UI state
    updateAuthUI() {
        console.log('Auth: Updating UI for authenticated user:', this.currentUser.username);
        
        // Update username display
        const usernameDisplay = document.getElementById('home-username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = this.currentUser.username;
        }
        
        // Show logout button
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.classList.remove('hidden');
        }
        
        // Show success and hide auth container
        this.showAuthSuccess();
    }

    // *** NEW METHOD: Save User Progress to Server ***
    async saveUserProgress(progressData) {
        console.log("AuthSystem: Saving progress to server...", progressData);
        
        // Get token directly from localStorage for this operation
        const token = localStorage.getItem('wordleToken'); 

        if (!this.isAuthenticated || !token) { // Check token from localStorage here
            console.warn("AuthSystem: Cannot save progress, user not authenticated or token missing.");
            return { success: false, error: 'User not authenticated' }; // Return an object indicating failure
        }

        try {
            const response = await fetch('/save-progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Use token from localStorage
                },
                body: JSON.stringify(progressData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                console.log('AuthSystem: Progress successfully saved to server.', data.stats);
                // Update local user stats immediately ONLY IF the server confirms success
                if (this.currentUser && this.currentUser.username === data.username) { // Ensure stats are for the right user
                     this.updateCurrentUser({ username: this.currentUser.username, stats: data.stats });
                     console.log("AuthSystem: Updated local user stats after successful save.");
                 } else {
                    // This case should ideally not happen if token verification works server-side
                    console.warn("AuthSystem: Server returned stats for a different user?", data.username);
                 }
                return { success: true, stats: data.stats }; // Return success and updated stats
            } else {
                console.error('AuthSystem: Failed to save progress to server:', data.error || response.statusText);
                return { success: false, error: data.error || `Server error: ${response.status}` }; // Return failure
            }
        } catch (error) {
            console.error('AuthSystem: Network error saving progress:', error);
            return { success: false, error: 'Network error' }; // Return failure
        }
    }

    handleLogout() {
        console.log("Logging out user");
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('wordleToken');
        
        // Show auth screen again
        if (this.authContainer) this.authContainer.classList.remove('hidden');
        
        // Hide other containers
        const homeContainer = document.getElementById('home-container');
        if (homeContainer) homeContainer.classList.add('hidden');
        
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) gameContainer.classList.add('hidden');
        
        // Reset username display
        const usernameDisplay = document.getElementById('home-username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = 'Not logged in';
        }
        
        // Hide logout button
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.classList.add('hidden');
        }
    }

    // New method to update the current user object and save to localStorage
    updateCurrentUser(updatedUserData) {
        if (!updatedUserData || !updatedUserData.username) {
            console.warn("Auth: Attempted to update current user with invalid data", updatedUserData);
            return;
        }
        
        console.log(`Auth: Updating currentUser from ${this.currentUser?.username} to ${updatedUserData.username}`);
        
        // Merge new data into existing currentUser if possible, otherwise replace
        if (this.currentUser && this.currentUser.username === updatedUserData.username) {
             // Merge stats - overwrite existing stats with new ones
            if (updatedUserData.stats) {
                this.currentUser.stats = { ...this.currentUser.stats, ...updatedUserData.stats };
            }
            // Merge friends if provided (less likely in stats update)
            if (updatedUserData.friends) {
                this.currentUser.friends = updatedUserData.friends;
            }
            // Update other top-level fields if necessary
            this.currentUser.email = updatedUserData.email || this.currentUser.email;
            // Never update password this way!
        } else {
            // If it's a different user or no current user, just set it
            this.currentUser = updatedUserData;
        }
        
        // Ensure authentication status is correct
        this.isAuthenticated = true;
        
        // Save the updated user data to localStorage
        this.saveUserData(); 
        console.log("Auth: Updated currentUser data:", this.currentUser);
        
        // Optional: Dispatch a custom event to notify other parts of the app
        // document.dispatchEvent(new CustomEvent('userUpdated', { detail: this.currentUser }));
    }
}

// Initialize authentication when the document is loaded
let authSystem;
document.addEventListener('DOMContentLoaded', () => {
    authSystem = new AuthSystem();
}); 