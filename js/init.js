// Initialization code for Infinite Wordle
console.log("Initializing app...");

// Add global helper function to always get username
window.getUsername = function() {
    // Try all possible sources for username
    let username = null;
    
    // Method 1: Check global window.username (might be set by other components)
    if (window.username) {
        username = window.username;
        console.log("Username from window.username:", username);
        return username;
    }
    
    // Method 2: From user manager (most reliable when available)
    if (window.userManager && typeof window.userManager.getCurrentUsername === 'function') {
        username = window.userManager.getCurrentUsername();
        if (username) {
            console.log("Username from userManager:", username);
            window.username = username; // Cache it
            return username;
        }
    }
    
    // Method 3: From authSystem
    if (window.authSystem && window.authSystem.currentUser) {
        username = window.authSystem.currentUser.username;
        if (username) {
            console.log("Username from authSystem:", username);
            window.username = username; // Cache it
            return username;
        }
    }
    
    // Method 4: From multiplayerSocket
    if (window.multiplayerSocket && window.multiplayerSocket.username) {
        username = window.multiplayerSocket.username;
        if (username) {
            console.log("Username from multiplayerSocket:", username);
            window.username = username; // Cache it
            return username;
        }
    }
    
    // Method 5: From localStorage user object
    try {
        const userJson = localStorage.getItem('currentUser');
        if (userJson) {
            const userData = JSON.parse(userJson);
            if (userData && userData.username) {
                username = userData.username;
                console.log("Username from localStorage.currentUser:", username);
                window.username = username; // Cache it
                return username;
            }
        }
    } catch (e) {
        console.error("Error parsing user data from localStorage", e);
    }
    
    // Method 6: Check JWT token in localStorage
    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('wordleToken');
        if (token) {
            // Basic JWT parsing (without verification)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const payload = JSON.parse(jsonPayload);
            if (payload && payload.username) {
                username = payload.username;
                console.log("Username from JWT token:", username);
                window.username = username; // Cache it
                return username;
            }
        }
    } catch (e) {
        console.error("Error parsing JWT token:", e);
    }
    
    // Method 7: From direct username storage
    const directUsername = localStorage.getItem('username');
    if (directUsername) {
        console.log("Username from localStorage.username:", directUsername);
        window.username = directUsername; // Cache it
        return directUsername;
    }
    
    // Method 8: Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const usernameParam = urlParams.get('username');
    if (usernameParam) {
        console.log("Username from URL parameter:", usernameParam);
        window.username = usernameParam; // Cache it
        return usernameParam;
    }
    
    // Method 9: Fallback - check if there's a displayed username anywhere on page
    const usernameElements = document.querySelectorAll('.username, .user-name, #username, #profile-username, #user-display-name, #home-username-display');
    for (const el of usernameElements) {
        if (el.textContent && el.textContent.trim().length > 0) {
            username = el.textContent.trim();
            console.log("Username from DOM element:", username);
            window.username = username; // Cache it
            return username;
        }
    }
    
    console.warn("No username found from any source");
    return null;
};

// Immediate socket initialization
(function() {
    console.log("INITIALIZING SOCKET CONNECTION IMMEDIATELY");
    
    // Create socket connection right away
    if (!window.multiplayerSocket || !window.multiplayerSocket.socket) {
        try {
            // Get username before initializing socket
            const username = window.getUsername();
            console.log("SOCKET INIT: Current username:", username);
            
            const socket = io();
            
            window.multiplayerSocket = {
                socket: socket,
                connected: false,
                gameId: null,
                username: username, // Store username right away
                
                connect: function() {
                    if (!this.socket) {
                        this.socket = io();
                    }
                    this.connected = true;
                    console.log("Socket connected manually");
                    
                    // Auto-register username if available
                    if (this.username) {
                        this.registerUser(this.username);
                    } else {
                        // Try getting username again
                        const username = window.getUsername();
                        if (username) {
                            this.registerUser(username);
                        }
                    }
                    
                    return true;
                },
                
                registerUser: function(username) {
                    if (!username) return false;
                    if (!this.socket) {
                        this.socket = io();
                        this.connected = true;
                    }
                    
                    console.log(`Registering username ${username} with socket`);
                    
                    // Send registration via multiple events for redundancy
                    this.socket.emit('register_user', { username });
                    this.socket.emit('register', { username });
                    this.socket.emit('direct_register', { username });
                    this.socket.emit('join', { room: username });
                    
                    // Store the username
                    this.username = username;
                    window.username = username; // Store globally
                    
                    return true;
                },
                
                // Creating direct method for friend challenges
                createFriendChallenge: function(friendUsername, difficulty) {
                    console.log(`Creating friend challenge to ${friendUsername} with difficulty: ${difficulty}`);
                    
                    if (!this.socket || !this.connected) {
                        console.error('Socket not connected, cannot create challenge');
                        return false;
                    }
                    
                    // Get current username, use multiple fallbacks
                    const username = this.username || window.getUsername();
                    if (!username) {
                        console.error('Cannot create challenge: username not available');
                        return false;
                    }
                    
                    console.log(`Sending challenge from ${username} to ${friendUsername}`);
                    
                    // Create challenge ID
                    const challengeId = Math.floor(Math.random() * 1000000).toString();
                    
                    // Send challenge via multiple events for redundancy
                    this.socket.emit('challenge', {
                        fromUsername: username,
                        toUsername: friendUsername,
                        difficulty: difficulty,
                        challengeId: challengeId,
                        timestamp: Date.now()
                    });
                    
                    // Also try alternate event names for compatibility
                    this.socket.emit('create_friend_challenge', {
                        username: username,
                        friendUsername: friendUsername,
                        difficulty: difficulty,
                        gameCode: challengeId
                    });
                    
                    console.log(`Challenge sent with ID: ${challengeId}`);
                    return true;
                }
            };
            
            // Set up connection listener
            socket.on('connect', function() {
                console.log("Socket connected with ID:", socket.id);
                window.multiplayerSocket.connected = true;
                
                // Try to register user with better fallbacks
                if (window.multiplayerSocket.username) {
                    window.multiplayerSocket.registerUser(window.multiplayerSocket.username);
                } else {
                    // Try to get from any available source
                    const username = window.getUsername();
                    if (username) {
                        window.multiplayerSocket.registerUser(username);
                    }
                }
                
                // Set up recurring registration to ensure username stays registered
                let registrationAttempts = 0;
                const registrationInterval = setInterval(function() {
                    registrationAttempts++;
                    
                    // Check if we need to re-register (username changed or not set)
                    const currentUsername = window.getUsername();
                    if (currentUsername && (!window.multiplayerSocket.username || 
                        window.multiplayerSocket.username !== currentUsername)) {
                        console.log(`Re-registering socket with username (attempt ${registrationAttempts}): ${currentUsername}`);
                        window.multiplayerSocket.registerUser(currentUsername);
                    }
                    
                    // Stop after 10 attempts
                    if (registrationAttempts >= 10) {
                        clearInterval(registrationInterval);
                    }
                }, 2000);
            });
            
            // Also listen for disconnect
            socket.on('disconnect', function() {
                console.log("Socket disconnected");
                window.multiplayerSocket.connected = false;
            });
            
            // Listen for user change events to update socket registration
            document.addEventListener('userLogin', function(e) {
                if (e.detail && e.detail.username) {
                    console.log("User login detected, registering with socket:", e.detail.username);
                    window.multiplayerSocket.registerUser(e.detail.username);
                }
            });
            
            console.log("Socket initialized:", window.multiplayerSocket.socket.id);
            
            // Set a periodic check for username
            setInterval(function() {
                const username = window.getUsername();
                if (username && (!window.multiplayerSocket.username || 
                    window.multiplayerSocket.username !== username)) {
                    console.log("Username updated in periodic check:", username);
                    window.multiplayerSocket.registerUser(username);
                }
            }, 5000);
            
        } catch (error) {
            console.error("Error initializing socket:", error);
        }
    }
})();

// Add direct challenge handlers - immediately after socket initialization
(function() {
    // Make sure we have the socket
    if (!window.multiplayerSocket || !window.multiplayerSocket.socket) {
        console.error("Socket not available for challenge handlers");
        return;
    }
    
    console.log("INITIALIZING DIRECT CHALLENGE HANDLERS");
    
    const socket = window.multiplayerSocket.socket;
    
    // Create a basic notification display function if none exists
    if (!window.showBasicNotification) {
        window.showBasicNotification = function(title, message, buttons) {
            console.log(`NOTIFICATION: ${title} - ${message}`);
            
            // Create notification element
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: rgba(33, 150, 243, 0.95);
                color: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                z-index: 10000;
                max-width: 300px;
                animation: slideIn 0.5s ease-in-out;
            `;
            
            // Add animation style
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    0% { transform: translateX(100%); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
            
            // Add content
            notification.innerHTML = `
                <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 18px;">${title}</h3>
                <p style="margin-bottom: 12px; font-size: 14px;">${message}</p>
                <div style="display: flex; gap: 10px;">
                    ${buttons.map(btn => `
                        <button data-action="${btn.action}" style="flex: 1; padding: 8px; background-color: ${btn.color || '#4CAF50'}; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>
            `;
            
            // Add event listeners to buttons
            buttons.forEach(btn => {
                const buttonEl = notification.querySelector(`button[data-action="${btn.action}"]`);
                if (buttonEl) {
                    buttonEl.addEventListener('click', () => {
                        if (typeof btn.callback === 'function') {
                            btn.callback();
                        }
                        notification.remove();
                    });
                }
            });
            
            // Add to document
            document.body.appendChild(notification);
            
            // Auto-remove after 60 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 60000);
            
            // Play notification sound if available
            if (typeof window.playNotificationSound === 'function') {
                window.playNotificationSound();
            } else {
                // Simple beep sound
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.value = 880;
                    gainNode.gain.value = 0.3;
                    
                    oscillator.start();
                    setTimeout(() => oscillator.stop(), 200);
                } catch (e) {
                    console.log("Could not play notification sound:", e);
                }
            }
            
            return notification;
        };
    }
    
    // Direct handler for challenges
    socket.on('challenge_received', function(data) {
        console.log("DIRECT HANDLER: Challenge received:", data);
        
        // Try to use friendChallengesUI if available
        if (window.friendChallengesUI && window.friendChallengesUI.showChallengeNotification) {
            window.friendChallengesUI.showChallengeNotification(data);
            return;
        }
        
        // Fallback to basic notification
        window.showBasicNotification(
            "New Challenge!",
            `${data.fromUsername || 'Someone'} has challenged you to a game`,
            [
                {
                    text: "Accept",
                    action: "accept",
                    color: "#4CAF50",
                    callback: function() {
                        console.log("Challenge accepted:", data);
                        
                        // Try to find accept method
                        if (window.friendChallengesUI && window.friendChallengesUI.acceptChallenge) {
                            window.friendChallengesUI.acceptChallenge(data.gameCode || data.challengeId || data.gameId);
                        } else if (window.multiplayerSocket) {
                            // Direct socket event
                            const username = window.userManager?.getCurrentUsername();
                            if (username) {
                                socket.emit('challenge_response', {
                                    gameCode: data.gameCode || data.challengeId || data.gameId,
                                    accept: true,
                                    responder: username
                                });
                            }
                        }
                    }
                },
                {
                    text: "Decline",
                    action: "decline",
                    color: "#F44336",
                    callback: function() {
                        console.log("Challenge declined:", data);
                        
                        // Try to find decline method
                        if (window.friendChallengesUI && window.friendChallengesUI.declineChallenge) {
                            window.friendChallengesUI.declineChallenge(data.gameCode || data.challengeId || data.gameId);
                        } else if (window.multiplayerSocket) {
                            // Direct socket event
                            const username = window.userManager?.getCurrentUsername();
                            if (username) {
                                socket.emit('challenge_response', {
                                    gameCode: data.gameCode || data.challengeId || data.gameId,
                                    accept: false,
                                    responder: username
                                });
                            }
                        }
                    }
                }
            ]
        );
    });
    
    // Listen for other relevant events
    socket.on('challenge_notification', function(data) {
        console.log("Challenge notification received:", data);
        
        // Check if this is for current user
        const currentUsername = window.userManager?.getCurrentUsername();
        if (data.toUsername === currentUsername || data.target === currentUsername) {
            // Forward to challenge_received handler
            socket.emit('challenge_received', data);
        }
    });
})();

// Global initialization
function initializeApp() {
    console.log("App initialization started");
    
    // Check if dictionary is loaded or being loaded
    if (!window.WORDS_ALPHA) {
        window.WORDS_ALPHA = new Set();
    }
    
    // Force dictionary load
    if (typeof window.loadDictionary === 'function') {
        window.loadDictionary();
    }
    
    // Initialize game components after a short delay
    setTimeout(initializeGameComponents, 1000);
}

// Add some basic words to ensure the dictionary always has content
function addBasicWords() {
    if (typeof window.loadDictionary === 'function') {
        window.loadDictionary();
    }
}

// Initialize game components
function initializeGameComponents() {
    // Make sure AuthSystem is created
    if (!window.authSystem) {
        window.authSystem = new AuthSystem();
    }
    
    // Make sure HomeScreen is created
    if (!window.homeScreen) {
        window.homeScreen = new HomeScreen();
    }
    
    // Make sure GameManager is created
    if (!window.gameManager) {
        window.gameManager = new GameManager();
    }
    
    // Check if any UI containers are visible, if not, show a message
    setTimeout(() => {
        // Re-fetch elements inside the timeout to ensure they exist at execution time
        const authContainer = document.getElementById('auth-container');
        const homeContainer = document.getElementById('home-container'); 
        const gameContainer = document.getElementById('game-container');
        const loadingMsg = document.getElementById('loading-message');

        console.log("Checking container visibility in init.js timeout...");
        console.log("Auth container found:", !!authContainer);
        console.log("Home container found:", !!homeContainer);
        console.log("Game container found:", !!gameContainer);
        console.log("Loading message found:", !!loadingMsg);

        // Check conditions safely
        const isAuthHidden = !authContainer || authContainer.classList.contains('hidden');
        const isHomeHidden = !homeContainer || homeContainer.classList.contains('hidden');
        const isGameHidden = !gameContainer || gameContainer.classList.contains('hidden');

        console.log(`Container states: Auth hidden=${isAuthHidden}, Home hidden=${isHomeHidden}, Game hidden=${isGameHidden}`);

        // IMPORTANT: Check if user is authenticated before making visibility decisions
        const isAuthenticated = window.authSystem && window.authSystem.isAuthenticated;
        console.log("Auth state:", isAuthenticated ? "User is authenticated" : "User is not authenticated");
        
        // If authenticated, ensure auth is hidden and home is visible
        if (isAuthenticated) {
            if (authContainer && !isAuthHidden) {
                console.log("init.js: User is authenticated but auth container is visible - hiding it");
                authContainer.classList.add('hidden');
            }
            
            if (homeContainer && isHomeHidden) {
                console.log("init.js: User is authenticated but home container is hidden - showing it");
                homeContainer.classList.remove('hidden');
            }
        }
        
        // Only show error if all containers are hidden AND user is not in authentication flow
        if (isAuthHidden && isHomeHidden && isGameHidden && 
            !(window.authSystem && !window.authSystem.isAuthenticated)) {
            // All containers are hidden or missing and it's not because we're waiting for auth
            console.warn("No main UI containers (Auth, Home, Game) are visible.");
            if (loadingMsg) { // Check loadingMsg here too
                loadingMsg.innerHTML = '<h2>Loading Error</h2>' +
                    '<p>No UI containers visible. Try refreshing the page.</p>';
            } else {
                console.error("Critical: No UI containers visible AND #loading-message is missing!");
            }
        } else {
            // At least one container is visible, hide loading message
            if (loadingMsg) {
                 console.log("Attempting to hide #loading-message as a main container is visible.");
                 // Double-check element existence right before modifying it
                 const elementToHide = document.getElementById('loading-message');
                 if (elementToHide) {
                    elementToHide.classList.add('hidden'); // This access should now be safest
                 } else {
                    console.warn("#loading-message disappeared between check and modification.");
                 }
            } else {
                 console.warn("Could not find #loading-message to hide it.");
            }
        }
    }, 1000);
}

// Call init on load
document.addEventListener('DOMContentLoaded', initializeApp);
// Also call on window load just to be sure
window.addEventListener('load', () => {
    if (!window.WORDS_ALPHA || window.WORDS_ALPHA.size === 0) {
        initializeApp();
    }
});

// Initialize socket connection when user is logged in
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing socket connection');
    
    // Check periodically if user is logged in and socket isn't connected
    const socketCheckInterval = setInterval(() => {
        // Check if we have a user and socket system
        if (window.userManager && window.userManager.getCurrentUser() && window.multiplayerSocket) {
            if (!window.multiplayerSocket.connected) {
                console.log('User is logged in, connecting socket');
                window.multiplayerSocket.connect();
                
                // Force username registration every 2 seconds for 10 attempts
                let attempts = 0;
                const usernameInterval = setInterval(() => {
                    attempts++;
                    const username = window.userManager.getCurrentUsername();
                    console.log(`Registering username (attempt ${attempts}): ${username}`);
                    window.multiplayerSocket.registerUser(username);
                    
                    if (attempts >= 5 || !window.multiplayerSocket.connected) {
                        clearInterval(usernameInterval);
                    }
                }, 2000);
            }
        }
    }, 5000);
});

// Function to force check for pending challenges
function checkForPendingChallenges() {
    console.log('Forcing check for pending challenges');
    
    if (window.multiplayerSocket && window.multiplayerSocket.connected) {
        const username = window.userManager?.getCurrentUsername();
        
        if (username) {
            // Force register username again
            window.multiplayerSocket.registerUser(username);
            
            // Emit a special event to request any pending challenges
            window.multiplayerSocket.socket.emit('force_check_challenges', { username });
            
            console.log(`Requested pending challenges check for ${username}`);
        }
    }
}

// Check for challenges when a user logs in
document.addEventListener('DOMContentLoaded', () => {
    // Periodically check for pending challenges after login
    setInterval(() => {
        if (window.userManager && window.userManager.getCurrentUser() && 
            window.multiplayerSocket && window.multiplayerSocket.connected) {
            checkForPendingChallenges();
        }
    }, 10000); // Check every 10 seconds
    
    // Also check immediately after page load if user is logged in
    setTimeout(() => {
        if (window.userManager && window.userManager.getCurrentUser()) {
            checkForPendingChallenges();
        }
    }, 5000); // Check 5 seconds after page load
});

// Add global functions to ensure starting games from challenges
window.startGameFromChallenge = function(challengeData) {
    console.log('Starting game from challenge:', challengeData);
    
    // Make sure we have the data we need
    if (!challengeData) {
        console.error('Cannot start game: No challenge data provided');
        return false;
    }
    
    const fromUsername = challengeData.fromUsername || challengeData.username || 'Opponent';
    const difficulty = challengeData.difficulty || 'medium';
    const gameId = challengeData.gameId || challengeData.challengeId || Math.floor(Math.random() * 1000000).toString();
    
    console.log(`Starting game with ${fromUsername}, difficulty ${difficulty}, gameId ${gameId}`);
    
    // Try different methods to start the game
    
    // Method 1: Use GameManager (preferred)
    if (window.gameManager) {
        console.log('Using GameManager to start the game');
        const currentUser = window.userManager?.getCurrentUser() || window.currentUser || { username: 'Player' };
        
        window.gameManager.startGame('multiplayer', currentUser, {
            mode: 'challenge',
            opponent: fromUsername,
            difficulty: difficulty,
            gameId: gameId
        });
        
        return true;
    }
    
    // Method 2: Use MultiplayerUI
    if (window.startMultiplayerGame) {
        console.log('Using MultiplayerUI to start the game');
        window.startMultiplayerGame({
            opponent: fromUsername,
            difficulty: difficulty,
            gameId: gameId
        });
        
        return true;
    }
    
    // Method 3: Use Home Screen
    if (window.homeScreen) {
        console.log('Using HomeScreen to start the game');
        window.homeScreen.startMultiplayerGame('challenge', fromUsername, difficulty);
        return true;
    }
    
    // Method 4: Create game container directly
    console.log('Creating game directly as fallback');
    
    // Hide other containers
    const authContainer = document.getElementById('auth-container');
    const homeContainer = document.getElementById('home-container');
    
    if (authContainer) authContainer.classList.add('hidden');
    if (homeContainer) homeContainer.classList.add('hidden');
    
    // Create or get game container
    let gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
        gameContainer = document.createElement('div');
        gameContainer.id = 'game-container';
        document.body.appendChild(gameContainer);
    }
    
    gameContainer.classList.remove('hidden');
    gameContainer.innerHTML = `
        <div class="game-header">
            <h2>Playing against ${fromUsername}</h2>
            <button id="back-to-home">Back to Home</button>
        </div>
        <div id="game-content"></div>
    `;
    
    // Add back button handler
    document.getElementById('back-to-home').addEventListener('click', () => {
        if (window.gameManager) {
            window.gameManager.showHome();
        } else if (window.homeScreen) {
            gameContainer.classList.add('hidden');
            homeContainer.classList.remove('hidden');
        } else {
            window.location.reload();
        }
    });
    
    // Try to create game
    if (window.MultiplayerGameUI) {
        const gameUI = new window.MultiplayerGameUI();
        gameUI.initialize({
            opponent: fromUsername,
            difficulty: difficulty,
            gameId: gameId
        }, document.getElementById('game-content'));
        
        return true;
    }
    
    return false;
};

// Add global function for accepting challenges
window.acceptChallenge = function(challengeId, gameData) {
    console.log("GLOBAL: Accepting challenge:", challengeId);
    
    // Method 1: Try friendChallengesUI
    if (window.friendChallengesUI && typeof window.friendChallengesUI.acceptChallenge === 'function') {
        console.log("Using friendChallengesUI to accept challenge");
        window.friendChallengesUI.acceptChallenge(challengeId);
        return true;
    }
    
    // Method 2: Try direct socket
    if (window.multiplayerSocket && window.multiplayerSocket.socket) {
        console.log("Using direct socket to accept challenge");
        const username = window.getUsername();
        
        if (username) {
            // Try sending in multiple formats for compatibility
            window.multiplayerSocket.socket.emit('challenge_response', {
                gameCode: challengeId,
                accept: true,
                responder: username
            });
            
            window.multiplayerSocket.socket.emit('accept_challenge', {
                gameCode: challengeId,
                username: username
            });
            
            // Start game directly if we have game data
            if (gameData) {
                window.startGameFromChallenge(gameData);
            }
            
            return true;
        }
    }
    
    console.error("GLOBAL: Could not accept challenge - no valid method found");
    return false;
};

// Add global function for declining challenges
window.declineChallenge = function(challengeId) {
    console.log("GLOBAL: Declining challenge:", challengeId);
    
    // Method 1: Try friendChallengesUI
    if (window.friendChallengesUI && typeof window.friendChallengesUI.declineChallenge === 'function') {
        console.log("Using friendChallengesUI to decline challenge");
        window.friendChallengesUI.declineChallenge(challengeId);
        return true;
    }
    
    // Method 2: Try direct socket
    if (window.multiplayerSocket && window.multiplayerSocket.socket) {
        console.log("Using direct socket to decline challenge");
        const username = window.getUsername();
        
        if (username) {
            // Try sending in multiple formats for compatibility
            window.multiplayerSocket.socket.emit('challenge_response', {
                gameCode: challengeId,
                accept: false,
                responder: username
            });
            
            window.multiplayerSocket.socket.emit('decline_challenge', {
                gameCode: challengeId,
                username: username
            });
            
            return true;
        }
    }
    
    console.error("GLOBAL: Could not decline challenge - no valid method found");
    return false;
};

// Add global function for sending challenges
window.sendChallenge = function(friendUsername, difficulty) {
    console.log(`GLOBAL: Challenging ${friendUsername} with difficulty: ${difficulty}`);
    
    // Method 1: Try multiplayerSocket.createFriendChallenge
    if (window.multiplayerSocket && typeof window.multiplayerSocket.createFriendChallenge === 'function') {
        console.log("Using multiplayerSocket.createFriendChallenge");
        window.multiplayerSocket.createFriendChallenge(friendUsername, difficulty);
        return true;
    }
    
    // Method 2: Try friendChallengesUI
    if (window.friendChallengesUI && typeof window.friendChallengesUI.sendChallenge === 'function') {
        console.log("Using friendChallengesUI.sendChallenge");
        window.friendChallengesUI.sendChallenge(friendUsername, difficulty);
        return true;
    }
    
    // Method 3: Try direct socket
    if (window.multiplayerSocket && window.multiplayerSocket.socket) {
        console.log("Using direct socket to send challenge");
        const username = window.getUsername();
        
        if (username) {
            const challengeId = Math.floor(Math.random() * 1000000).toString();
            
            // Send in multiple formats for compatibility
            window.multiplayerSocket.socket.emit('challenge', {
                fromUsername: username,
                toUsername: friendUsername,
                difficulty: difficulty,
                challengeId: challengeId,
                timestamp: Date.now()
            });
            
            window.multiplayerSocket.socket.emit('create_friend_challenge', {
                username: username,
                friendUsername: friendUsername,
                difficulty: difficulty,
                gameCode: challengeId
            });
            
            return true;
        }
    }
    
    console.error("GLOBAL: Could not send challenge - no valid method found");
    return false;
}; 