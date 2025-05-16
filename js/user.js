// User Management System
class UserManager {
    constructor() {
        // Initialize user data
        this.currentUser = null;
        
        // Database of all users
        this.allUsers = {};
        
        // Try to load existing user data
        this.loadUserDataFromStorage();
        
        console.log("User Manager initialized");
    }
    
    // Load all user data from local storage
    loadUserDataFromStorage() {
        try {
            // Load the database of all users
            const allUsersData = localStorage.getItem('wordle_all_users');
            if (allUsersData) {
                this.allUsers = JSON.parse(allUsersData);
                console.log(`Loaded ${Object.keys(this.allUsers).length} users from database`);
            }
            
            // Load the current user
            const currentUserData = localStorage.getItem('wordle_current_user');
            if (currentUserData) {
                const username = JSON.parse(currentUserData);
                if (username && this.allUsers[username]) {
                    this.currentUser = this.allUsers[username];
                    console.log(`Current user loaded: ${username}`);
                }
            }
        } catch (err) {
            console.error("Error loading user data:", err);
            this.currentUser = null;
            this.allUsers = {};
        }
    }
    
    // Save all user data to local storage
    saveUserDataToStorage() {
        try {
            // Save all users database
            localStorage.setItem('wordle_all_users', JSON.stringify(this.allUsers));
            
            // Save current user reference
            if (this.currentUser) {
                localStorage.setItem('wordle_current_user', JSON.stringify(this.currentUser.username));
            } else {
                localStorage.removeItem('wordle_current_user');
            }
            
            console.log("User data saved to storage");
        } catch (err) {
            console.error("Error saving user data:", err);
        }
    }
    
    // Check if a username already exists
    usernameExists(username) {
        return !!this.allUsers[username];
    }
    
    // Get a user by username
    getUserByUsername(username) {
        return this.allUsers[username] || null;
    }
    
    // Create a new user account
    createUser(username) {
        // Validate username
        if (!username || username.trim() === '') {
            return { success: false, message: "Please enter a valid username" };
        }
        
        // Clean up the username
        username = username.trim();
        
        // Check if username already exists
        if (this.usernameExists(username)) {
            return { success: false, message: "Username already taken. Please choose another one." };
        }
        
        // Create new user object
        const newUser = {
            username: username,
            created: new Date().toISOString(),
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                currentStreak: 0,
                maxStreak: 0,
                lastPlayed: null
            },
            preferences: {
                theme: 'light',
                difficulty: 'normal'
            },
            friends: [],
            friendRequests: {
                sent: [],
                received: []
            }
        };
        
        // Add to users database
        this.allUsers[username] = newUser;
        
        // Set as current user
        this.currentUser = newUser;
        
        // Save to storage
        this.saveUserDataToStorage();
        
        return { success: true, message: `Welcome, ${username}!` };
    }
    
    // Login with existing username
    login(username) {
        // Check if username exists
        if (!this.usernameExists(username)) {
            return { success: false, message: "User not found" };
        }
        
        // Set as current user
        this.currentUser = this.allUsers[username];
        
        // Save current user to storage
        this.saveUserDataToStorage();
        
        return { success: true, message: `Welcome back, ${username}!` };
    }
    
    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }
    
    // Get current username
    getCurrentUsername() {
        return this.currentUser ? this.currentUser.username : null;
    }
    
    // Get user stats
    getUserStats() {
        return this.currentUser ? this.currentUser.stats : null;
    }
    
    // Update user stats after a game
    updateStats(wonGame) {
        if (!this.currentUser) return;
        
        this.currentUser.stats.gamesPlayed++;
        this.currentUser.stats.lastPlayed = new Date().toISOString();
        
        if (wonGame) {
            this.currentUser.stats.gamesWon++;
            this.currentUser.stats.currentStreak++;
            
            if (this.currentUser.stats.currentStreak > this.currentUser.stats.maxStreak) {
                this.currentUser.stats.maxStreak = this.currentUser.stats.currentStreak;
            }
        } else {
            this.currentUser.stats.currentStreak = 0;
        }
        
        // Update in the database
        this.allUsers[this.currentUser.username] = this.currentUser;
        
        // Save to storage
        this.saveUserDataToStorage();
    }
    
    // Update user preferences
    updatePreferences(preferences) {
        if (!this.currentUser) return;
        
        this.currentUser.preferences = {
            ...this.currentUser.preferences,
            ...preferences
        };
        
        // Update in the database
        this.allUsers[this.currentUser.username] = this.currentUser;
        
        // Save to storage
        this.saveUserDataToStorage();
    }
    
    // Log out the current user
    logout() {
        this.currentUser = null;
        localStorage.removeItem('wordle_current_user');
    }
    
    // Get all registered usernames
    getAllUsernames() {
        return Object.keys(this.allUsers);
    }
    
    // Get total number of registered users
    getUserCount() {
        return Object.keys(this.allUsers).length;
    }
}

// User interface for login/profile
class UserUI {
    constructor(userManager) {
        this.userManager = userManager;
        
        // Initialize UI
        this.addProfileButton();
    }
    
    // Add profile button to the page
    addProfileButton() {
        const button = document.createElement('button');
        button.id = 'profile-btn';
        button.style.cssText = 'position:fixed;top:10px;left:10px;padding:8px 15px;background:#2196f3;color:white;border:none;border-radius:4px;cursor:pointer;z-index:1000;';
        
        // Set button text based on login state
        if (this.userManager.isLoggedIn()) {
            button.innerHTML = `👤 ${this.userManager.getCurrentUsername()}`;
        } else {
            button.innerHTML = '👤 Login';
        }
        
        // Click handler
        button.addEventListener('click', () => {
            if (this.userManager.isLoggedIn()) {
                this.showProfilePanel();
            } else {
                this.showLoginPanel();
            }
        });
        
        document.body.appendChild(button);
    }
    
    // Show login panel
    showLoginPanel() {
        // Check if panel already exists
        let panel = document.getElementById('login-panel');
        if (panel) {
            panel.remove();
        }
        
        // Create panel
        panel = document.createElement('div');
        panel.id = 'login-panel';
        panel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;background:white;border-radius:8px;box-shadow:0 0 20px rgba(0,0,0,0.2);overflow:hidden;z-index:1001;';
        
        // Add header
        const header = document.createElement('div');
        header.style.cssText = 'padding:15px;background:#2196f3;color:white;';
        
        const title = document.createElement('h3');
        title.textContent = 'User Account';
        title.style.margin = '0';
        header.appendChild(title);
        
        panel.appendChild(header);
        
        // Add tabs
        const tabs = document.createElement('div');
        tabs.style.cssText = 'display:flex;';
        
        const loginTab = document.createElement('div');
        loginTab.textContent = 'Login';
        loginTab.dataset.tab = 'login';
        loginTab.style.cssText = 'flex:1;padding:10px;text-align:center;cursor:pointer;background:#f5f5f5;';
        
        const registerTab = document.createElement('div');
        registerTab.textContent = 'Register';
        registerTab.dataset.tab = 'register';
        registerTab.style.cssText = 'flex:1;padding:10px;text-align:center;cursor:pointer;background:#e0e0e0;';
        
        tabs.appendChild(loginTab);
        tabs.appendChild(registerTab);
        panel.appendChild(tabs);
        
        // Add content container
        const content = document.createElement('div');
        content.style.cssText = 'padding:20px;';
        panel.appendChild(content);
        
        // Initial content - Login form
        this.showLoginForm(content);
        
        // Tab click handlers
        loginTab.addEventListener('click', () => {
            loginTab.style.background = '#f5f5f5';
            registerTab.style.background = '#e0e0e0';
            this.showLoginForm(content);
        });
        
        registerTab.addEventListener('click', () => {
            registerTab.style.background = '#f5f5f5';
            loginTab.style.background = '#e0e0e0';
            this.showRegisterForm(content);
        });
        
        // Add to document
        document.body.appendChild(panel);
    }
    
    // Show login form
    showLoginForm(container) {
        container.innerHTML = '';
        
        // Username dropdown (if we have existing users)
        const allUsernames = this.userManager.getAllUsernames();
        
        if (allUsernames.length > 0) {
            const label = document.createElement('label');
            label.textContent = 'Select username:';
            label.style.display = 'block';
            label.style.marginBottom = '5px';
            container.appendChild(label);
            
            const select = document.createElement('select');
            select.id = 'username-select';
            select.style.cssText = 'width:100%;padding:8px;margin-bottom:15px;border:1px solid #ddd;border-radius:4px;';
            
            // Add options
            allUsernames.forEach(username => {
                const option = document.createElement('option');
                option.value = username;
                option.textContent = username;
                select.appendChild(option);
            });
            
            container.appendChild(select);
        } else {
            // If no users, show message to register
            const noUsers = document.createElement('p');
            noUsers.textContent = 'No accounts found. Please register a new account.';
            noUsers.style.cssText = 'margin-bottom:15px;color:#666;text-align:center;';
            container.appendChild(noUsers);
        }
        
        // Status message
        const statusMsg = document.createElement('div');
        statusMsg.id = 'login-status';
        statusMsg.style.cssText = 'margin-bottom:15px;padding:10px;border-radius:4px;display:none;';
        container.appendChild(statusMsg);
        
        // Login button (only if we have users)
        if (allUsernames.length > 0) {
            const loginBtn = document.createElement('button');
            loginBtn.textContent = 'Login';
            loginBtn.style.cssText = 'width:100%;padding:10px;background:#2196f3;color:white;border:none;border-radius:4px;cursor:pointer;';
            
            loginBtn.addEventListener('click', () => {
                const username = document.getElementById('username-select')?.value;
                
                if (username) {
                    // Log in user
                    const result = this.userManager.login(username);
                    
                    if (result.success) {
                        statusMsg.textContent = result.message;
                        statusMsg.style.display = 'block';
                        statusMsg.style.background = '#e8f5e9';
                        statusMsg.style.color = '#2e7d32';
                        
                        // Update profile button
                        this.updateProfileButton();
                        
                        // Close panel after delay
                        setTimeout(() => {
                            panel.remove();
                        }, 2000);
                    } else {
                        statusMsg.textContent = result.message;
                        statusMsg.style.display = 'block';
                        statusMsg.style.background = '#ffebee';
                        statusMsg.style.color = '#c62828';
                    }
                }
            });
            
            container.appendChild(loginBtn);
        }
    }
    
    // Show register form
    showRegisterForm(container) {
        container.innerHTML = '';
        
        // Username input
        const label = document.createElement('label');
        label.textContent = 'Choose a username:';
        label.style.display = 'block';
        label.style.marginBottom = '5px';
        container.appendChild(label);
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'username-input';
        input.style.cssText = 'width:100%;padding:8px;margin-bottom:15px;border:1px solid #ddd;border-radius:4px;';
        container.appendChild(input);
        
        // Status message
        const statusMsg = document.createElement('div');
        statusMsg.id = 'register-status';
        statusMsg.style.cssText = 'margin-bottom:15px;padding:10px;border-radius:4px;display:none;';
        container.appendChild(statusMsg);
        
        // Register button
        const registerBtn = document.createElement('button');
        registerBtn.textContent = 'Create Account';
        registerBtn.style.cssText = 'width:100%;padding:10px;background:#4caf50;color:white;border:none;border-radius:4px;cursor:pointer;';
        
        registerBtn.addEventListener('click', () => {
            const username = document.getElementById('username-input').value;
            
            // Create user
            const result = this.userManager.createUser(username);
            
            if (result.success) {
                statusMsg.textContent = result.message;
                statusMsg.style.display = 'block';
                statusMsg.style.background = '#e8f5e9';
                statusMsg.style.color = '#2e7d32';
                
                // Update profile button
                this.updateProfileButton();
                
                // Close panel after delay
                setTimeout(() => {
                    document.getElementById('login-panel')?.remove();
                }, 2000);
            } else {
                statusMsg.textContent = result.message;
                statusMsg.style.display = 'block';
                statusMsg.style.background = '#ffebee';
                statusMsg.style.color = '#c62828';
            }
        });
        
        container.appendChild(registerBtn);
        
        // Focus input
        input.focus();
    }
    
    // Show profile panel
    showProfilePanel() {
        // Check if panel already exists
        let panel = document.getElementById('profile-panel');
        if (panel) {
            panel.remove();
        }
        
        // Get user data
        const username = this.userManager.getCurrentUsername();
        const stats = this.userManager.getUserStats();
        
        // Create panel
        panel = document.createElement('div');
        panel.id = 'profile-panel';
        panel.style.cssText = 'position:fixed;top:50px;left:10px;width:300px;background:white;border-radius:8px;box-shadow:0 0 10px rgba(0,0,0,0.2);overflow:hidden;z-index:1000;';
        
        // Add header
        const header = document.createElement('div');
        header.style.cssText = 'padding:15px;background:#2196f3;color:white;display:flex;justify-content:space-between;align-items:center;';
        
        const title = document.createElement('h3');
        title.textContent = 'My Profile';
        title.style.margin = '0';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = 'background:none;border:none;color:white;font-size:20px;cursor:pointer;';
        closeBtn.addEventListener('click', () => panel.remove());
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        panel.appendChild(header);
        
        // Add content
        const content = document.createElement('div');
        content.style.cssText = 'padding:20px;';
        
        // Username
        const usernameDiv = document.createElement('div');
        usernameDiv.style.cssText = 'margin-bottom:20px;';
        
        const usernameTitle = document.createElement('h4');
        usernameTitle.textContent = 'Username';
        usernameTitle.style.margin = '0 0 5px 0';
        
        const usernameValue = document.createElement('div');
        usernameValue.textContent = username;
        usernameValue.style.fontSize = '18px';
        
        usernameDiv.appendChild(usernameTitle);
        usernameDiv.appendChild(usernameValue);
        content.appendChild(usernameDiv);
        
        // Stats
        const statsDiv = document.createElement('div');
        statsDiv.style.cssText = 'margin-bottom:20px;';
        
        const statsTitle = document.createElement('h4');
        statsTitle.textContent = 'Game Statistics';
        statsTitle.style.margin = '0 0 10px 0';
        statsDiv.appendChild(statsTitle);
        
        // Stats grid
        const statsGrid = document.createElement('div');
        statsGrid.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:10px;';
        
        const statItems = [
            {label: 'Games Played', value: stats.gamesPlayed},
            {label: 'Win Rate', value: stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) + '%' : '0%'},
            {label: 'Current Streak', value: stats.currentStreak},
            {label: 'Max Streak', value: stats.maxStreak}
        ];
        
        statItems.forEach(item => {
            const statItem = document.createElement('div');
            statItem.style.cssText = 'text-align:center;padding:10px;background:#f5f5f5;border-radius:4px;';
            
            const statValue = document.createElement('div');
            statValue.textContent = item.value;
            statValue.style.fontSize = '24px';
            statValue.style.fontWeight = 'bold';
            
            const statLabel = document.createElement('div');
            statLabel.textContent = item.label;
            statLabel.style.fontSize = '12px';
            statLabel.style.color = '#666';
            
            statItem.appendChild(statValue);
            statItem.appendChild(statLabel);
            statsGrid.appendChild(statItem);
        });
        
        statsDiv.appendChild(statsGrid);
        content.appendChild(statsDiv);
        
        // User count display
        const userCountDiv = document.createElement('div');
        userCountDiv.style.cssText = 'margin-bottom:20px;text-align:center;padding:10px;background:#f0f8ff;border-radius:4px;';
        userCountDiv.textContent = `Total registered users: ${this.userManager.getUserCount()}`;
        content.appendChild(userCountDiv);
        
        // Switch account button
        const switchBtn = document.createElement('button');
        switchBtn.textContent = 'Switch Account';
        switchBtn.style.cssText = 'width:100%;padding:10px;background:#ff9800;color:white;border:none;border-radius:4px;cursor:pointer;margin-bottom:10px;';
        
        switchBtn.addEventListener('click', () => {
            panel.remove();
            this.showLoginPanel();
        });
        
        content.appendChild(switchBtn);
        
        // Logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.style.cssText = 'width:100%;padding:10px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;';
        
        logoutBtn.addEventListener('click', () => {
            this.userManager.logout();
            this.updateProfileButton();
            panel.remove();
        });
        
        content.appendChild(logoutBtn);
        panel.appendChild(content);
        
        // Add to document
        document.body.appendChild(panel);
    }
    
    // Update profile button text
    updateProfileButton() {
        const button = document.getElementById('profile-btn');
        if (button) {
            if (this.userManager.isLoggedIn()) {
                button.innerHTML = `👤 ${this.userManager.getCurrentUsername()}`;
            } else {
                button.innerHTML = '👤 Login';
            }
        }
    }
}

// Initialize the user system on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize user manager
    window.userManager = new UserManager();
    
    // Initialize user UI
    window.userUI = new UserUI(window.userManager);
}); 