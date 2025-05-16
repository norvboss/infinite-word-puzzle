// Friend Challenges UI Handler
class FriendChallengesUI {
    constructor() {
        this.challengeNotifications = [];
        this.notificationContainer = null;
        this.challengeForm = null;
        this.initialized = false;
        this.challenges = {};
        this.notificationHistory = [];
        this.displayedNotifications = new Set();
        this.activeGames = new Map();
        this.challengeQueue = [];
    }

    // Initialize the friend challenges system
    initialize() {
        console.log('Initializing FriendChallengesUI');
        
        // Set up challenge notification container
        this.createNotificationContainer();
        
        // Set up challenge notification sound
        this.setupNotificationSound();
        
        // Set up socket listeners for real-time updates
        this.setupSocketListeners();
        
        // Set up visual connection status indicator
        this.setupConnectionStatus();
        
        // Force registration one more time after setup
        setTimeout(forceRegisterUserSocket, 500);
        
        // Show a test notification for debugging
        setTimeout(() => {
            // Debug method to show test notification
            
        }, 2000);
        
        console.log('Setting up challenge UI');
    }

    // Set up the challenge UI elements
    setupChallengeUI() {
        console.log('Setting up challenge UI');
        
        // Create notification container
        this.createNotificationContainer();
    }

    setupSocketListeners() {
        if (!window.multiplayerSocket) {
            console.error('MultiplayerSocket not available');
            return;
        }
        
        // Ensure the socket is connected
        if (!window.multiplayerSocket.connected) {
            console.log('Socket not connected, attempting to connect...');
            window.multiplayerSocket.connect();
        }
        
        // Register the user with the socket - FIXED VERSION
        if (window.userManager) {
            const username = window.userManager.getCurrentUsername();
            if (username) {
                console.log(`Registering user ${username} with socket - fixed version`);
                
                // Explicit registration with socket.io directly
                if (window.multiplayerSocket.socket) {
                    window.multiplayerSocket.socket.emit('register_user', { username: username });
                    console.log(`Direct socket.io registration sent for ${username}`);
                }
                
                // Also use the standard registration method as backup
                window.multiplayerSocket.registerUser(username);
                
                // Set up recurring username registration to prevent connection issues
                this.setupRecurringRegistration(username);
                
                // Force check for any pending challenges
                if (window.multiplayerSocket.socket) {
                    window.multiplayerSocket.socket.emit('force_check_challenges', {
                        username: username
                    });
                    console.log('Checking for pending challenges');
                    
                    // Set up ping to server to keep connection alive and check for challenges
                    this.setupServerPing(username);
                }
            } else {
                console.warn('No username available to register with socket');
            }
        }
        
        // Make sure we have access to the socket object
        if (!window.multiplayerSocket.socket) {
            console.error('Socket object not available');
            return;
        }
        
        // Remove any existing listeners to prevent duplicates
        window.multiplayerSocket.socket.off('friend_challenge');
        window.multiplayerSocket.socket.off('challenge_received');
        window.multiplayerSocket.socket.off('challenge_notification');
        window.multiplayerSocket.socket.off('registration_confirmed');
        
        // Handle registration confirmation
        window.multiplayerSocket.socket.on('registration_confirmed', (data) => {
            console.log('🔵 SOCKET REGISTRATION CONFIRMED:', data);
            // Update UI to show connected status if needed
            const statusElement = document.getElementById('socket-status');
            if (statusElement) {
                statusElement.textContent = 'Connected';
                statusElement.style.color = 'green';
            }
            
            // Force check for challenges right after registration is confirmed
            window.multiplayerSocket.socket.emit('force_check_challenges', {
                username: data.username
            });
        });
        
        // Handle incoming friend challenges - old format
        window.multiplayerSocket.socket.on('friend_challenge', (data) => {
            console.log('Friend challenge received (old format):', data);
            this.showChallengeNotification(data);
        });
        
        // Handle incoming friend challenges - new format 
        window.multiplayerSocket.socket.on('challenge_received', (data) => {
            console.log('Challenge received (new format):', data);
            
            // Force creating notification container if it doesn't exist
            if (!this.notificationContainer) {
                this.createNotificationContainer();
            }
            
            // Show the notification
            this.showChallengeNotification(data);
            
            // Also show a message
            // this.showMessage(`${data.fromUsername || 'Someone'} has challenged you!`, 'info');
            
            // Play a sound
            this.playNotificationSound();
        });
        
        // Handle broadcast notifications
        window.multiplayerSocket.socket.on('challenge_notification', (data) => {
            console.log('Broadcast challenge notification received:', data);
            
            // Determine if this notification is for current user
            const currentUsername = getUsername();
            if (data.target === currentUsername || data.toUsername === currentUsername) {
                console.log('This challenge is for me!');
                
                // Show the notification
                this.showChallengeNotification(data);
                
                // Also show a message
                // this.showMessage(`${data.fromUsername || 'Someone'} has challenged you!`, 'info');
                
                // Play a sound
                this.playNotificationSound();
            } else {
                console.log('This challenge is not for me');
            }
        });
        
        // Handle challenge sent confirmation from server
        window.multiplayerSocket.socket.on('challenge_sent', (data) => {
            console.log('Challenge sent confirmation received:', data);
            
            if (data.success) {
                // Show a success message
                this.showMessage(`Challenge sent to ${data.toUsername}${data.pending ? ' (will be delivered when they connect)' : ''}`, 'success');
            } else {
                // Show error message
                this.showMessage(`Failed to send challenge: ${data.error || 'Unknown error'}`, 'error');
            }
        });

        // Add this anywhere else we register events (ensures all challenge formats are handled)
        window.multiplayerSocket.socket.on('challenge', (data) => {
            console.log('Direct challenge event received:', data);
            
            // Show the notification
            this.showChallengeNotification(data);
            
            // Play a sound
            this.playNotificationSound();
        });
        
        console.log('Challenge listeners set up for ALL event types');
    }

    // Set up recurring registration to ensure socket stays registered
    setupRecurringRegistration(username) {
        if (!username || !window.multiplayerSocket) return;
        
        console.log('Setting up recurring username registration for', username);
        
        // Clear any existing interval
        if (this.registrationInterval) {
            clearInterval(this.registrationInterval);
        }
        
        // Register username every 30 seconds to ensure connection stays active
        this.registrationInterval = setInterval(() => {
            if (window.multiplayerSocket) {
                if (!window.multiplayerSocket.connected) {
                    console.log('Socket disconnected, attempting to reconnect...');
                    window.multiplayerSocket.connect();
                }
                
                console.log('Recurring registration for', username);
                
                // Register using our wrapper function
                window.multiplayerSocket.registerUser(username);
                
                // Also register directly with socket.io for redundancy
                if (window.multiplayerSocket.socket) {
                    window.multiplayerSocket.socket.emit('register_user', { username: username });
                    console.log(`Direct socket.io recurring registration for ${username}`);
                }
            }
        }, 15000); // Every 15 seconds for more reliability
    }

    // Set up server ping to keep connection alive and check for challenges
    setupServerPing(username) {
        if (!username || !window.multiplayerSocket || !window.multiplayerSocket.socket) return;
        
        console.log('Setting up server ping for', username);
        
        // Clear any existing interval
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        
        // Ping server every 15 seconds and check for challenges
        this.pingInterval = setInterval(() => {
            if (window.multiplayerSocket && window.multiplayerSocket.connected && 
                window.multiplayerSocket.socket) {
                
                console.log('Pinging server for', username);
                
                // Send a ping to server
                window.multiplayerSocket.socket.emit('ping', { username });
                
                // Also check for any pending challenges
                window.multiplayerSocket.socket.emit('force_check_challenges', { username });
            }
        }, 15000); // every 15 seconds
    }

    // Show a test notification to ensure the system is working
    showTestNotification() {
        // Log that we're testing
        console.log('Testing notification system with dummy notification');
        
        // Create a hidden test notification
        const testNotification = document.createElement('div');
        testNotification.style.cssText = `
            background-color: rgba(0,0,0,0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 10px;
            opacity: 0.1;
            font-size: 10px;
        `;
        testNotification.textContent = 'Notification system ready';
        
        // Add to container (creates it if it doesn't exist)
        if (!this.notificationContainer) {
            this.createNotificationContainer();
        }
        this.notificationContainer.appendChild(testNotification);
        
        // Remove after 2 seconds
        //setTimeout(() => {
           // if (testNotification.parentNode) {
           //     testNotification.remove();
        //    }
        //}, 2000);
    }

    // Create notification container
    createNotificationContainer() {
        console.log('Creating notification container');
        
        // First check if container already exists in the DOM
        let existingContainer = document.getElementById('challenge-notifications');
        if (existingContainer) {
            console.log('Using existing notification container from DOM');
            this.notificationContainer = existingContainer;
            
            // Make sure it's visible and properly positioned
            this.notificationContainer.style.display = 'flex';
            this.notificationContainer.style.position = 'fixed';
            this.notificationContainer.style.zIndex = '9999';
            return;
        }
        
        // Create container
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'challenge-notifications';
        this.notificationContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 320px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: auto !important;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 10px;
        `;
        
        document.body.appendChild(this.notificationContainer);
        console.log('Challenge notification container created and added to document body');
        
        // Create a test notification to ensure the system works
        //this.showTestNotification();
    }

    // Display a challenge notification to the user
    showChallengeNotification(data, retry = 0) {
        console.log('Showing challenge notification with data:', data);
        
        // Get or create notification container
        const container = this.getOrCreateNotificationContainer();
        
        // Ensure we have a challenge ID
        const notificationId = data.gameCode || data.challengeId || data.gameId || Math.floor(Math.random() * 1000000).toString();
        const fromUsername = data.fromUsername || 'Someone';
        const notificationKey = `${fromUsername}_to_${data.toUsername || 'me'}_${notificationId}`;
        
        // First check - look for an existing notification element with this ID
        const existingNotification = document.getElementById(`challenge-${notificationId}`);
        if (existingNotification) {
            console.log(`Notification with ID challenge-${notificationId} already exists in DOM, not creating duplicate`);
            return existingNotification;
        }
        
        // Second check - ensure the notification isn't already displayed
        if (this.displayedNotifications.has(notificationKey)) {
            console.log(`Notification ${notificationKey} is already in the displayed notifications set`);
            return null;
        }
        
        // Third check - time-based deduplication
        // Maintain a global timestamp cache to prevent rapid re-notifications
        if (!window.challengeTimestamps) {
            window.challengeTimestamps = {};
        }
        
        // Check if this notification has been shown recently (within 60 seconds)
        const now = Date.now();
        const lastShown = window.challengeTimestamps[notificationKey] || 0;
        const timeSinceLastShown = now - lastShown;
        
        if (lastShown > 0 && timeSinceLastShown < 60000) {
            console.log(`Skipping duplicate notification: ${notificationKey}, shown ${timeSinceLastShown}ms ago`);
            return null;
        }
        
        // Fourth check - look for any notification from the same sender with similar timestamp
        // This handles cases where the ID might be different but it's effectively the same challenge
        for (const [existingKey, timestamp] of Object.entries(window.challengeTimestamps)) {
            // If it's from the same sender and within the last 10 seconds, consider it a duplicate
            if (existingKey.startsWith(`${fromUsername}_to_`) && now - timestamp < 10000) {
                console.log(`Found recent challenge from ${fromUsername} within last 10 seconds, skipping`);
                return null;
            }
        }
        
        // Update the timestamp for this notification
        window.challengeTimestamps[notificationKey] = now;
        
        // Add to displayed notifications set
        this.displayedNotifications.add(notificationKey);
        
        // Force creating notification container if it doesn't exist or isn't in DOM
        if (!this.notificationContainer || !document.contains(this.notificationContainer)) {
            this.createNotificationContainer();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'challenge-notification';
        notification.id = `challenge-${notificationId}`;
        notification.style.cssText = `
            background-color: rgba(33, 150, 243, 0.95);
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            pointer-events: auto !important;
            animation: fadeIn 0.3s ease-in-out;
        `;
        
        // Add animation style if needed
        if (!document.getElementById('notification-animations')) {
            const style = document.createElement('style');
            style.id = 'notification-animations';
            style.textContent = `
                @keyframes fadeIn {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add content
        notification.innerHTML = `
            <div class="notification-content" style="pointer-events: auto !important;">
                <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 18px; color: white;">New Challenge!</h3>
                <p style="margin-bottom: 12px; font-size: 14px;">${fromUsername} has challenged you to a game</p>
                <div class="notification-buttons" style="display: flex; gap: 10px; pointer-events: auto !important;">
                    <button class="accept-challenge" data-challenge-id="${notificationId}" 
                        style="flex: 1; padding: 8px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        Accept
                    </button>
                    <button class="decline-challenge" data-challenge-id="${notificationId}" 
                        style="flex: 1; padding: 8px; background-color: #F44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Decline
                    </button>
                </div>
            </div>
        `;
        
        // Store challenge data for later reference
        if (!this.challenges) this.challenges = {};
        this.challenges[notificationId] = data;
        
        // Add event listeners
        notification.querySelector('.accept-challenge').addEventListener('click', () => {
            this.acceptChallenge(notificationId);
            // Remove all other notifications from the same challenger to clean up UI
            this.removeAllNotificationsFrom(fromUsername);
        });
        
        notification.querySelector('.decline-challenge').addEventListener('click', () => {
            this.declineChallenge(notificationId);
            // Also remove all other notifications from the same challenger
            this.removeAllNotificationsFrom(fromUsername);
        });
        
        // Add to container
        this.notificationContainer.appendChild(notification);
        
        // Play notification sound
        this.playNotificationSound();
        
        // Auto-remove after 60 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
                // Remove from displayed notifications set so it can be shown again
                this.displayedNotifications.delete(notificationKey);
            }
        }, 60000);
        
        // Add to notification history
        this.addToNotificationHistory(data, notificationId);
        
        return notification;
    }

    // Helper method to remove all notifications from a specific sender
    removeAllNotificationsFrom(fromUsername) {
        if (!this.notificationContainer) return;
        
        // Get all current notifications
        const notifications = this.notificationContainer.querySelectorAll('.challenge-notification');
        
        // Check each one to see if it's from the same sender
        notifications.forEach(notification => {
            const content = notification.querySelector('.notification-content p');
            if (content && content.textContent.includes(fromUsername)) {
                // This notification is from the same sender, remove it
                notification.remove();
            }
        });
        
        // Also clean up the displayed notifications set
        for (const key of this.displayedNotifications) {
            if (key.startsWith(`${fromUsername}_to_`)) {
                this.displayedNotifications.delete(key);
            }
        }
    }

    // Create challenge form for sending challenges to friends
    createChallengeForm(container, friendsList) {
        // Check if we already have a form in this container
        const existingForm = container.querySelector('.challenge-form');
        if (existingForm) {
            console.log('Using existing challenge form');
            this.challengeForm = existingForm;
            return existingForm;
        }
        
        // Create form
        const form = document.createElement('div');
        form.className = 'challenge-form';
        form.style.cssText = `
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            padding: 20px;
            margin-bottom: 20px;
        `;
        
        // Add form content
        form.innerHTML = `
            <h3 style="margin-top: 0; margin-bottom: 15px;">Challenge a Friend</h3>
            <div style="margin-bottom: 15px;">
                <label for="friend-select" style="display: block; margin-bottom: 5px;">Select Friend:</label>
                <select id="friend-select" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">Select a friend</option>
                    ${friendsList.map(friend => `<option value="${friend}">${friend}</option>`).join('')}
                </select>
            </div>
            <div style="margin-bottom: 15px;">
                <label for="difficulty-select" style="display: block; margin-bottom: 5px;">Difficulty:</label>
                <select id="difficulty-select" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="easy">Easy (4 letters)</option>
                    <option value="medium" selected>Medium (5 letters)</option>
                    <option value="hard">Hard (6 letters)</option>
                    <option value="expert">Expert (7 letters)</option>
                </select>
            </div>
            <button id="send-challenge-btn" style="width: 100%; padding: 10px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">Send Challenge</button>
        `;
        
        // Add event listener to send button
        form.querySelector('#send-challenge-btn').addEventListener('click', () => {
            const friendSelect = form.querySelector('#friend-select');
            const difficultySelect = form.querySelector('#difficulty-select');
            
            const friend = friendSelect.value;
            const difficulty = difficultySelect.value;
            
            if (!friend) {
                this.showMessage('Please select a friend', 'error');
                return;
            }
            
            console.log(`Creating challenge with difficulty: ${difficulty} for friend: ${friend}`);
            
            // Force register socket before sending
            forceRegisterUserSocket();
            
            // Use our enhanced sending method with retry
            const success = this.sendChallenge(friend, difficulty);
            
            if (success) {
                console.log(`Challenge to ${friend} sent successfully`);
            } else {
                console.error(`Failed to send challenge to ${friend}`);
                
                // Try again after a slight delay
                setTimeout(() => {
                    console.log(`Retrying challenge to ${friend}...`);
                    this.sendChallenge(friend, difficulty);
                }, 1500);
            }
        });
        
        // Add form to container
        container.appendChild(form);
        
        // Save reference
        this.challengeForm = form;
        
        return form;
    }

    // Fix sendChallenge to handle socket registration and use multiple methods
    sendChallenge(friend, difficulty) {
        console.log(`Enhanced challenge sending to ${friend} with ${difficulty}`);
        
        // Make sure socket is connected and registered
        if (!window.multiplayerSocket) {
            this.showMessage('Error: Multiplayer socket not initialized', 'error');
            return false;
        }
        
        if (!window.multiplayerSocket.socket) {
            console.error('Socket object not available');
            this.showMessage('Connection error, please try again', 'error');
            return false;
        }
        
        if (!window.multiplayerSocket.connected) {
            console.log('Socket not connected, attempting to connect...');
            window.multiplayerSocket.connect();
            
            // Try again after connection
            setTimeout(() => this.sendChallenge(friend, difficulty), 1000);
            return false;
        }
        
        // Force register username before sending
        forceRegisterUserSocket();
        
        // Ensure user is registered with socket
        const currentUsername = getUsername();
        if (!currentUsername) {
            this.showMessage('You must be logged in to send challenges', 'error');
            return false;
        }
        
        // Generate a game code
        const gameCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Get word length based on difficulty
        let wordLength = 5;
        switch(difficulty) {
            case 'easy': wordLength = 4; break;
            case 'medium': wordLength = 5; break;
            case 'hard': wordLength = 6; break;
            case 'expert': wordLength = 7; break;
        }
        
        // Create challenge data
        const challengeData = {
            gameCode: gameCode,
            gameId: gameCode,
            challengeId: gameCode,
            fromUsername: currentUsername,
            toUsername: friend,
            difficulty: difficulty,
            wordLength: wordLength,
            timestamp: Date.now()
        };
        
        console.log('Sending challenge with data:', challengeData);
        
        // Use multiple methods for maximum reliability
        try {
            // METHOD 1: Use standard event
            window.multiplayerSocket.socket.emit('send_friend_challenge', challengeData);
            console.log('Method 1: send_friend_challenge sent');
            
            // METHOD 2: Direct notification
            window.multiplayerSocket.socket.emit('notify_friend_challenge', challengeData);
            console.log('Method 2: notify_friend_challenge sent');
            
            // METHOD 3: Direct message event
            window.multiplayerSocket.socket.emit('direct_message', {
                type: 'challenge',
                from: currentUsername,
                to: friend,
                data: challengeData
            });
            console.log('Method 3: direct_message sent');
            
            // METHOD 4: Server broadcast with target info
            window.multiplayerSocket.socket.emit('broadcast_challenge', {
                ...challengeData,
                target: friend
            });
            console.log('Method 4: broadcast_challenge sent');
            
            // Show success message
            this.showMessage(`Challenge sent to ${friend}!`, 'success');
            
            // Store challenge in local tracker
            this.challenges[gameCode] = challengeData;
            
            return true;
        } catch (error) {
            console.error('Error sending challenge:', error);
            this.showMessage('Failed to send challenge, please try again', 'error');
            return false;
        }
    }

    // Replace startGame method to better synchronize game start
    startGame(gameData) {
        console.log("Friend Challenges - Starting game with data:", gameData);
        
        // Ensure we have a valid game ID
        if (!gameData.gameId) {
            console.error("Missing game ID in game data:", gameData);
            this.showMessage("Error starting game: Missing game ID", "error");
            
            // Try to create a game ID as fallback
            gameData.gameId = `manual-game-${Date.now()}`;
            console.log("Created fallback game ID:", gameData.gameId);
        }
        
        // Convert data to format expected by game manager
        const gameOptions = {
            gameId: gameData.gameId,
            wordLength: gameData.wordLength || 
                      (gameData.difficulty === 'easy' ? 4 : 
                       gameData.difficulty === 'hard' ? 6 : 
                       gameData.difficulty === 'expert' ? 7 : 5),
            difficulty: gameData.difficulty || 'medium',
            opponent: gameData.fromUsername || gameData.opponentUsername || 'Opponent',
            opponentId: gameData.opponentId,
            waitForSync: true // Important flag to wait for both players
        };
        
        console.log("Starting multiplayer game with options:", gameOptions);
        
        // Find where to render the game
        const gameContainer = document.getElementById('game-container') || 
                             document.getElementById('game-content') || 
                             document.getElementById('app-content');
        
        // If no container exists, create one
        if (!gameContainer) {
            console.warn("No game container found, creating one");
            const newContainer = document.createElement('div');
            newContainer.id = 'game-container';
            newContainer.style.width = '100%';
            newContainer.style.height = '100%';
            document.body.appendChild(newContainer);
        }
        
        // Ensure socket connection before starting
        if (window.multiplayerSocket) {
            if (!window.multiplayerSocket.connected) {
                window.multiplayerSocket.connect();
            }
            
            // Set the game ID and force join the game room
            window.multiplayerSocket.gameId = gameData.gameId;
            const username = window.userManager?.getCurrentUsername() || getUsername();
            
            // Explicitly join the game room via socket
            window.multiplayerSocket.socket.emit('join_game', {
                gameId: gameData.gameId,
                username: username
            });
            
            // Also sync the game state to ensure both players have same data
            window.multiplayerSocket.socket.emit('game_sync', {
                gameId: gameData.gameId,
                username: username,
                difficulty: gameData.difficulty || 'medium',
                wordLength: gameData.wordLength || 5
            });
        } else {
            console.error('Multiplayer socket not initialized');
            this.showMessage('Error: Socket not connected', 'error');
        }
        
        // Use different methods to start the game for maximum compatibility
        let gameStarted = false;
        
        // Method 1: Use game manager (preferred)
        if (window.gameManager) {
            try {
                // Get current user
                const currentUser = window.userManager?.getCurrentUser() || { username: getUsername() || 'Player' };
                
                // Start the game
                window.gameManager.startGame('multiplayer', currentUser, gameOptions);
                
                // Show a success message
                this.showMessage(`Starting game against ${gameOptions.opponent}`, 'success');
                
                gameStarted = true;
            } catch (error) {
                console.error('Error starting game with GameManager:', error);
            }
        }
        
        // Method 2: Use multiplayer UI directly
        if (!gameStarted && window.multiplayerGameUI) {
            try {
                window.multiplayerGameUI.initialize(gameOptions);
                gameStarted = true;
            } catch (error) {
                console.error('Error starting game with multiplayerGameUI:', error);
            }
        }
        
        // Method 3: Create a new instance of MultiplayerGameUI
        if (!gameStarted && window.MultiplayerGameUI) {
            try {
                const gameUI = new window.MultiplayerGameUI();
                gameUI.initialize(gameOptions);
                gameStarted = true;
            } catch (error) {
                console.error('Error creating MultiplayerGameUI directly:', error);
            }
        }
        
        return gameStarted;
    }
    
    // Add a message to the UI
    showMessage(message, type = 'info') {
        // Check if message container exists
        let messageContainer = document.getElementById('challenge-messages');
        
        if (!messageContainer) {
            // Create message container
            messageContainer = document.createElement('div');
            messageContainer.id = 'challenge-messages';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1001;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            
            document.body.appendChild(messageContainer);
        }
        
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.style.cssText = `
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            animation: fadeIn 0.3s ease-in-out;
            max-width: 300px;
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                messageElement.style.backgroundColor = '#4CAF50';
                messageElement.style.color = 'white';
                break;
            case 'error':
                messageElement.style.backgroundColor = '#F44336';
                messageElement.style.color = 'white';
                break;
            case 'warning':
                messageElement.style.backgroundColor = '#FF9800';
                messageElement.style.color = 'white';
                break;
            default:
                messageElement.style.backgroundColor = '#2196F3';
                messageElement.style.color = 'white';
        }
        
        messageElement.textContent = message;
        
        // Add to container
        messageContainer.appendChild(messageElement);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.style.opacity = '0';
                messageElement.style.transform = 'translateX(100%)';
                messageElement.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
                
                setTimeout(() => {
                    if (messageElement.parentNode) {
                        messageElement.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    // Refresh friend list in the challenge form
    refreshFriendList(friends) {
        if (!this.challengeForm) return;
        
        const friendSelect = this.challengeForm.querySelector('#friend-select');
        if (!friendSelect) return;
        
        // Clear current options
        friendSelect.innerHTML = '<option value="">Select a friend</option>';
        
        // Add new options
        friends.forEach(friend => {
            const option = document.createElement('option');
            option.value = friend;
            option.textContent = friend;
            friendSelect.appendChild(option);
        });
    }

    // Create notification container and UI for challenges
    createChallengeUI() {
        // Create notification container if it doesn't exist
        this.createNotificationContainer();
    }

    // Accept a challenge
    acceptChallenge(challengeId) {
        console.log('Accepting challenge with ID:', challengeId);
        
        // Get the stored challenge data
        let challengeData = null;
        
        // Method 1: Try to get from window.pendingChallenges
        if (window.pendingChallenges && window.pendingChallenges[challengeId]) {
            challengeData = window.pendingChallenges[challengeId];
            console.log('Found challenge data in pendingChallenges:', challengeData);
        }
        
        // Method 2: Try to get from this.challenges
        if (!challengeData && this.challenges && this.challenges[challengeId]) {
            challengeData = this.challenges[challengeId];
            console.log('Found challenge data in this.challenges:', challengeData);
        }
        
        // Make sure we have challenge data
        if (!challengeData) {
            console.error('No challenge data found for ID:', challengeId);
            this.showMessage('Error: Challenge data not found', 'error');
            return false;
        }
        
        // Make sure we have a socket
        if (!window.multiplayerSocket || !window.multiplayerSocket.socket) {
            console.error('Cannot accept challenge: No socket connection');
            this.showMessage('Error: No socket connection', 'error');
            return false;
        }
        
        // Get the username
        const username = getUsername();
        if (!username) {
            console.error('Cannot accept challenge: No username found');
            this.showMessage('Error: Could not determine your username', 'error');
            return false;
        }
        
        console.log(`User ${username} accepting challenge from ${challengeData.fromUsername}`, challengeData);
        
        // Remove notification
        const notification = document.getElementById(`challenge-${challengeId}`);
        if (notification) {
            notification.remove();
        }

        // Complete the challenge acceptance (send to server and start game)
        this.completeAcceptChallenge(challengeId, challengeData, username);
        
        return true;
    }
    
    // Complete the challenge acceptance process (new method)
    completeAcceptChallenge(challengeId, challengeData, username) {
        console.log('Completing challenge acceptance for:', challengeId);
        
        // Add some user feedback
        this.showMessage(`Challenge accepted. Starting game...`, "success");
        
        // Send the response to server
        window.multiplayerSocket.socket.emit('challenge_response', {
            gameCode: challengeId,
            accept: true,
            responder: username
        });
        
        // Also send alternate format for compatibility with different server versions
        window.multiplayerSocket.socket.emit('accept_challenge', {
            gameCode: challengeId,
            username: username
        });
        
        // Ensure we have a game ID (use challenge ID as fallback)
        if (!challengeData.gameId) {
            challengeData.gameId = challengeId;
        }
        
        // Force a small delay to ensure server processes the acceptance
        setTimeout(() => {
            // Try multiple methods to start the game for maximum reliability
            
            // Try to show or hide containers directly
            const gameContainer = document.getElementById('game-container');
            const homeContainer = document.getElementById('home-container');
            const authContainer = document.getElementById('auth-container');
            
            if (gameContainer && homeContainer) {
                gameContainer.classList.remove('hidden');
                gameContainer.style.display = 'block';
                homeContainer.classList.add('hidden');
                if (authContainer) authContainer.classList.add('hidden');
            }
            
            // Method 1: Use global game starter
            if (window.startGameFromChallenge) {
                console.log('Using global startGameFromChallenge');
                try {
                    window.startGameFromChallenge(challengeData);
                } catch (error) {
                    console.error('Error in startGameFromChallenge:', error);
                }
            }
            
            // Method 2: Use direct game display
            setTimeout(() => {
                if (window.forceDisplayGame) {
                    console.log('Using forceDisplayGame as backup');
                    try {
                        window.forceDisplayGame(challengeData);
                    } catch (error) {
                        console.error('Error in forceDisplayGame:', error);
                    }
                }
            }, 300);
            
            // Method 3: Use our own game starter (last resort)
            setTimeout(() => {
                try {
                    this.startGame(challengeData);
                } catch (error) {
                    console.error('Error in this.startGame:', error);
                    
                    // Ultimate fallback: create minimal game UI
                    this.createMinimalGameUI(challengeData);
                }
            }, 600);
        }, 300);
    }
    
    // Ultimate fallback method for when all other game initialization fails
    createMinimalGameUI(gameData) {
        console.log('Creating minimal game UI as last resort...');
        
        // Find or create game container
        let gameContainer = document.getElementById('game-container');
        if (!gameContainer) {
            gameContainer = document.createElement('div');
            gameContainer.id = 'game-container';
            document.body.appendChild(gameContainer);
        }
        
        // Ensure container is visible
        gameContainer.classList.remove('hidden');
        gameContainer.style.display = 'block';
        
        // Hide other containers
        const containersToHide = ['home-container', 'auth-container', 'loading-message'];
        containersToHide.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.classList.add('hidden');
            }
        });
        
        // Create a basic game UI
        gameContainer.innerHTML = `
            <div style="padding: 20px; max-width: 600px; margin: 0 auto; text-align: center;">
                <h2>Multiplayer Game</h2>
                <p>Playing against: ${gameData.fromUsername || gameData.opponentUsername || 'Opponent'}</p>
                <p>Game ID: ${gameData.gameId}</p>
                <p>Difficulty: ${gameData.difficulty || 'medium'}</p>
                
                <div id="minimal-game-board" style="margin: 20px 0; min-height: 300px; background: #f5f5f5; padding: 20px; border-radius: 8px;">
                    <div style="display: grid; grid-template-columns: repeat(${gameData.wordLength || 5}, 60px); gap: 5px; margin: 0 auto; width: fit-content;">
                        ${Array(6).fill(0).map(() => 
                            Array(gameData.wordLength || 5).fill(0).map(() => 
                                `<div style="width: 60px; height: 60px; border: 2px solid #ccc; display: flex; align-items: center; justify-content: center; font-size: 2em; font-weight: bold; background: white;"></div>`
                            ).join('')
                        ).join('')}
                    </div>
                </div>
                
                <button id="back-to-home" style="padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px;">
                    Back to Home
                </button>
            </div>
        `;
        
        // Add back button functionality
        document.getElementById('back-to-home').addEventListener('click', () => {
            const homeContainer = document.getElementById('home-container');
            if (homeContainer) {
                gameContainer.classList.add('hidden');
                homeContainer.classList.remove('hidden');
            }
        });
        
        console.log('Minimal game UI created successfully');
    }
    
    // Decline a challenge
    declineChallenge(challengeId) {
        console.log('Declining challenge with ID:', challengeId);
        
        // Make sure we have a socket
        if (!window.multiplayerSocket || !window.multiplayerSocket.socket) {
            console.error('Cannot decline challenge: No socket connection');
            return false;
        }
        
        // Get the username
        const username = getUsername();
        if (!username) {
            console.error('Cannot decline challenge: No username found');
            return false;
        }
        
        // Send the response to server
        window.multiplayerSocket.socket.emit('challenge_response', {
            gameCode: challengeId,
            accept: false,
            responder: username
        });
        
        // Remove notification
        const notification = document.getElementById(`challenge-${challengeId}`);
        if (notification) {
            notification.remove();
        }

        // Add some user feedback
        this.showMessage(`Challenge declined`, "info");
        
        return true;
    }

    // Play notification sound
    playNotificationSound() {
        console.log('Playing notification sound');
        
        try {
            // Try multiple sound approaches for maximum browser compatibility
            let soundPlayed = false;
            
            // Method 1: Use AudioContext (most modern browsers)
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.type = 'sine';
                oscillator.frequency.value = 880; // A5 note
                gainNode.gain.value = 0.3; // Lower volume
                
                oscillator.start();
                setTimeout(() => {
                    oscillator.stop();
                }, 300);
                
                // Play a second tone
                setTimeout(() => {
                    const oscillator2 = audioContext.createOscillator();
                    oscillator2.connect(gainNode);
                    oscillator2.type = 'sine';
                    oscillator2.frequency.value = 1046.5; // C6 note
                    oscillator2.start();
                    setTimeout(() => {
                        oscillator2.stop();
                    }, 300);
                }, 350);
                
                soundPlayed = true;
                console.log('Played notification sound using AudioContext');
            } catch (e) {
                console.log('AudioContext method failed:', e);
            }
            
            // Method 2: Use Audio API with base64 encoded sound
            if (!soundPlayed) {
                // Short notification sound as base64 WAV
                const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAADpAFgCzgTkBu4IIAJ8AdH/Gv6b/Dj7R/rz+Uj64Po5+3f8+v2B/hj+nf0y/Tf9v/11/qP/xQCwAY0CZwNeA1QDJwPGAvUBuADZ/pT9J/0H/Wj9MP6P/3gAAwFRAbEBCQJPApICuAKsApwCVwIOAuf/vP14+3v6qPkt+SP5UflF+r37aP2Y/g==');
                
                // Set volume
                audio.volume = 0.7;
                
                // Play the sound
                const playPromise = audio.play();
                
                // Handle play() promise (required in some browsers)
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log('Audio played successfully');
                            soundPlayed = true;
                        })
                        .catch(error => {
                            console.log('Audio play failed:', error);
                        });
                }
            }
            
            // Method 3: Fall back to a simple beep using window
            if (!soundPlayed && window.navigator && window.navigator.vibrate) {
                // Try to vibrate for mobile devices
                window.navigator.vibrate([200, 100, 200]);
                console.log('Used vibration API for notification');
                soundPlayed = true;
            }
            
            return soundPlayed;
        } catch (e) {
            console.error('All notification sound methods failed:', e);
            return false;
        }
    }

    // Get or create notification container
    getOrCreateNotificationContainer() {
        // If we already have a notification container, return it
        if (this.notificationContainer) {
            return this.notificationContainer;
        }
        
        // Otherwise create a new one
        this.createNotificationContainer();
        return this.notificationContainer;
    }

    // Add a simple status indicator to the page
    setupConnectionStatus() {
        // COMMENTED OUT
        /*
        // Check if status element already exists
        if (document.getElementById('socket-status-container')) {
            return;
        }
        
        const statusContainer = document.createElement('div');
        statusContainer.id = 'socket-status-container';
        statusContainer.style.cssText = 'position:fixed;bottom:10px;left:10px;background:rgba(0,0,0,0.7);color:white;padding:5px 10px;border-radius:5px;font-size:12px;z-index:9999;';
        
        statusContainer.innerHTML = `
            <div>Socket: <span id="socket-status">Connecting...</span></div>
            <div>User: <span id="user-status">${getUsername() || 'Unknown'}</span></div>
        `;
        
        document.body.appendChild(statusContainer);
        
        // Update status based on current connection
        const updateStatus = () => {
            const statusElement = document.getElementById('socket-status');
            const userElement = document.getElementById('user-status');
            
            if (statusElement) {
                if (window.multiplayerSocket?.connected) {
                    statusElement.textContent = 'Connected';
                    statusElement.style.color = 'lightgreen';
                } else {
                    statusElement.textContent = 'Disconnected';
                    statusElement.style.color = 'red';
                }
            }
            
            if (userElement) {
                userElement.textContent = getUsername() || 'Unknown';
            }
        };
        
        // Update immediately and every few seconds
        updateStatus();
        setInterval(updateStatus, 5000);
        */
    }

    // Setup notification sound system
    setupNotificationSound() {
        console.log("Setting up notification sound system");
        
        // Create a test sound to ensure browser allows audio
        try {
            // Create audio context
            this.audioContext = null;
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log("Audio context created successfully");
            } catch (e) {
                console.log("Could not create AudioContext:", e);
            }
            
            // Prepare gain node if audio context exists
            if (this.audioContext) {
                this.gainNode = this.audioContext.createGain();
                this.gainNode.connect(this.audioContext.destination);
                this.gainNode.gain.value = 0.3; // Lower volume
            }
            
            // Also create a backup audio element
            this.notificationAudio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAADpAFgCzgTkBu4IIAJ8AdH/Gv6b/Dj7R/rz+Uj64Po5+3f8+v2B/hj+nf0y/Tf9v/11/qP/xQCwAY0CZwNeA1QDJwPGAvUBuADZ/pT9J/0H/Wj9MP6P/3gAAwFRAbEBCQJPApICuAKsApwCVwIOAuf/vP14+3v6qPkt+SP5UflF+r37aP2Y/g==');
            
            console.log("Notification sound system ready");
        } catch (e) {
            console.error("Error setting up notification sound:", e);
        }
        
        // Expose sound function globally for other components
        window.playNotificationSound = () => this.playNotificationSound();
    }

    // Add notification history storage
    addToNotificationHistory(data, notificationId) {
        // Create notification history if it doesn't exist
        if (!this.notificationHistory) {
            this.notificationHistory = [];
            
            // Also create a UI for notification history if it doesn't exist
            this.createNotificationHistoryUI();
        }
        
        // Add to history
        this.notificationHistory.push({
            id: notificationId,
            data: data,
            timestamp: Date.now()
        });
        
        // Only keep most recent 10 notifications
        if (this.notificationHistory.length > 10) {
            this.notificationHistory.shift();
        }
        
        // Update history UI
        this.updateNotificationHistoryUI();
    }

    // Create UI for notification history
    createNotificationHistoryUI() {
        // Create button for history toggle
        const historyButton = document.createElement('div');
        historyButton.className = 'notification-history-button';
        historyButton.innerHTML = `
            <div style="position: fixed; bottom: 20px; left: 20px; width: 50px; height: 50px; 
                        background-color: #2196F3; border-radius: 50%; display: flex; 
                        justify-content: center; align-items: center; color: white; 
                        cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 9999;">
                <span style="font-size: 22px;">📋</span>
            </div>
        `;
        document.body.appendChild(historyButton);
        
        // Create history panel
        const historyPanel = document.createElement('div');
        historyPanel.className = 'notification-history-panel';
        historyPanel.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 20px;
            width: 300px;
            max-height: 400px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            overflow-y: auto;
            z-index: 9998;
            display: none;
            flex-direction: column;
            padding: 10px;
        `;
        historyPanel.innerHTML = `
            <h3 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;">Recent Challenges</h3>
            <div class="notification-history-list" style="display: flex; flex-direction: column; gap: 10px;"></div>
            <div style="padding: 10px; text-align: center; color: #999; font-style: italic; display: none;" class="empty-history">
                No recent challenges
            </div>
        `;
        document.body.appendChild(historyPanel);
        
        // Toggle panel when button is clicked
        historyButton.addEventListener('click', () => {
            if (historyPanel.style.display === 'none' || historyPanel.style.display === '') {
                historyPanel.style.display = 'flex';
                // Update UI when opened
                this.updateNotificationHistoryUI();
            } else {
                historyPanel.style.display = 'none';
            }
        });
        
        // Store references
        this.historyButton = historyButton;
        this.historyPanel = historyPanel;
    }

    // Update notification history UI
    updateNotificationHistoryUI() {
        if (!this.historyPanel) return;
        
        // Get history list container
        const historyList = this.historyPanel.querySelector('.notification-history-list');
        const emptyHistory = this.historyPanel.querySelector('.empty-history');
        
        if (!historyList) return;
        
        // Clear list
        historyList.innerHTML = '';
        
        // Show or hide empty message
        if (!this.notificationHistory || this.notificationHistory.length === 0) {
            emptyHistory.style.display = 'block';
            return;
        } else {
            emptyHistory.style.display = 'none';
        }
        
        // Add each notification to history
        this.notificationHistory.slice().reverse().forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.style.cssText = `
                background-color: #f5f5f5;
                border-radius: 4px;
                padding: 10px;
                position: relative;
            `;
            
            const data = item.data;
            const timeAgo = this.getTimeAgo(item.timestamp);
            
            historyItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong>${data.fromUsername || 'Someone'}</strong>
                    <span style="color: #777; font-size: 0.8em;">${timeAgo}</span>
                </div>
                <p style="margin: 5px 0; font-size: 0.9em;">Sent you a ${data.difficulty || 'medium'} challenge</p>
                <div style="display: flex; gap: 5px; margin-top: 8px;">
                    <button class="accept-history" data-id="${item.id}" 
                        style="flex: 1; padding: 4px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                        Accept
                    </button>
                    <button class="dismiss-history" data-id="${item.id}"
                        style="flex: 1; padding: 4px; background-color: #9e9e9e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                        Dismiss
                    </button>
                </div>
            `;
            
            // Add event listeners
            historyItem.querySelector('.accept-history').addEventListener('click', () => {
                this.acceptChallenge(item.id);
                this.historyPanel.style.display = 'none';
            });
            
            historyItem.querySelector('.dismiss-history').addEventListener('click', () => {
                // Remove from history
                this.notificationHistory = this.notificationHistory.filter(n => n.id !== item.id);
                this.updateNotificationHistoryUI();
            });
            
            historyList.appendChild(historyItem);
        });
    }

    // Helper to format time ago
    getTimeAgo(timestamp) {
        const now = Date.now();
        const seconds = Math.floor((now - timestamp) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 120) return '1 minute ago';
        if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
        if (seconds < 7200) return '1 hour ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
        
        return Math.floor(seconds / 86400) + ' days ago';
    }
}

// Create global instance - but only if it doesn't already exist
if (!window.friendChallengesUI) {
    console.log('Creating global friendChallengesUI instance');
    window.friendChallengesUI = new FriendChallengesUI();
} else {
    console.log('Global friendChallengesUI instance already exists');
}

// Add direct socket handlers for challenge notifications - critical fix
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - setting up direct socket handlers for challenges');
    
    // Check if we already have handlers registered to avoid duplicates
    if (window.challengeHandlersRegistered) {
        console.log('Challenge handlers already registered, skipping');
        return;
    }
    
    // Wait for socket to be initialized
    const checkSocketInterval = setInterval(() => {
        if (window.multiplayerSocket && window.multiplayerSocket.socket) {
            console.log('Adding direct challenge notification handlers');
            
            // Mark handlers as registered to prevent duplicates
            window.challengeHandlersRegistered = true;
            
            // Add direct handler for challenge notifications
            window.multiplayerSocket.socket.on('challenge_received', (data) => {
                console.log('DIRECT challenge_received event:', data);
                
                // Ensure challenges UI exists
                if (!window.friendChallengesUI.initialized) {
                    window.friendChallengesUI.initialize();
                }
                
                // Force creating notification container
                if (!window.friendChallengesUI.notificationContainer) {
                    window.friendChallengesUI.createNotificationContainer();
                }
                
                // Show notification directly
                window.friendChallengesUI.showChallengeNotification(data);
                
                // Also show a message as well
                if (typeof window.friendChallengesUI.showMessage === 'function') {
                    window.friendChallengesUI.showMessage(`${data.fromUsername} has challenged you!`, 'info');
                }
                
                // Try to play notification sound
                try {
                    window.friendChallengesUI.playNotificationSound();
                } catch (e) {
                    console.log('Sound notification failed to play:', e);
                }
            });
            
            // Add handler for the legacy challenge format
            window.multiplayerSocket.socket.on('friend_challenge', (data) => {
                console.log('DIRECT friend_challenge event (legacy format):', data);
                
                // Process the data to match our expected format
                const challengeData = {
                    gameCode: data.gameCode,
                    fromUsername: data.fromUsername || data.challenger,
                    difficulty: data.difficulty || 'medium'
                };
                
                // Ensure we have the minimum required data
                if (!challengeData.gameCode || !challengeData.fromUsername) {
                    console.error('Invalid challenge data format:', data);
                    return;
                }
                
                // Show notification directly
                window.friendChallengesUI.showChallengeNotification(challengeData);
                
                // Also show a message as well
                window.friendChallengesUI.showMessage(`${challengeData.fromUsername} has challenged you!`, 'info');
                
                // Try to play notification sound
                try {
                    window.friendChallengesUI.playNotificationSound();
                } catch (e) {
                    console.log('Sound notification failed to play:', e);
                }
            });
            
            // Add handler for server pong responses
            window.multiplayerSocket.socket.on('pong', (data) => {
                console.log('Pong received from server:', data);
            });
            
            // Add direct handler for game start after challenge accept
            window.multiplayerSocket.socket.on('challenge_accepted', (data) => {
                console.log('DIRECT challenge_accepted event received in friend challenges:', data);
                
                // Try to start game directly if not already started
                setTimeout(() => {
                    if (window.forceDisplayGame) {
                        window.forceDisplayGame(data);
                    }
                }, 1000);
            });
            
            // Add direct handler for challenge response with game start
            window.multiplayerSocket.socket.on('challenge_response_result', (data) => {
                console.log('DIRECT challenge_response_result event received in friend challenges:', data);
                
                if (data.gameId) {
                    // Try to start game directly if not already started
                    setTimeout(() => {
                        if (window.forceDisplayGame) {
                            window.forceDisplayGame(data);
                        }
                    }, 1000);
                }
            });
            
            // Direct handler for game start
            window.multiplayerSocket.socket.on('game_start', (data) => {
                console.log('DIRECT game_start event received in friend challenges:', data);
                
                // Try to start game directly if not already started
                setTimeout(() => {
                    if (window.forceDisplayGame) {
                        window.forceDisplayGame(data);
                    }
                }, 1000);
            });
            
            // Force check for challenges immediately when connection is established
            if (window.userManager && window.userManager.getCurrentUsername()) {
                const username = window.userManager.getCurrentUsername();
                console.log('Checking for any pending challenges for:', username);
                window.multiplayerSocket.socket.emit('force_check_challenges', { username });
            }
            
            clearInterval(checkSocketInterval);
        }
    }, 500);
});

// Initialize the challenges system when the user is logged in
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking if user is logged in to initialize friend challenges');
    
    // Check if already initialized to avoid duplicates
    if (window.friendChallengesInitialized) {
        console.log('Friend challenges already initialized, skipping');
        return;
    }
    
    // Mark as initialized to prevent duplicate initialization
    window.friendChallengesInitialized = true;
    
    // Wait a bit for the auth system to initialize
    setTimeout(() => {
        if (window.userManager && window.userManager.getCurrentUser()) {
            console.log('User is logged in, initializing friend challenges system');
            if (window.friendChallengesUI && !window.friendChallengesUI.initialized) {
                window.friendChallengesUI.initialize();
            }
        } else {
            console.log('No user logged in yet, will initialize friend challenges when user logs in');
        }
    }, 1000);
});

// Global function to force display game after challenge accepted
window.forceDisplayGame = function(gameData) {
    console.log('Force display game called with data:', gameData);
    
    // Ensure we have valid game data
    if (!gameData || !gameData.gameId) {
        console.error('Invalid game data provided to forceDisplayGame:', gameData);
        
        // Try to recover by creating a game ID if missing
        if (gameData && !gameData.gameId) {
            gameData.gameId = `force-game-${Date.now()}`;
            console.log('Created fallback game ID:', gameData.gameId);
        } else {
            return false;
        }
    }
    
    // Normalize game data format
    const normalizedData = {
        gameId: gameData.gameId,
        difficulty: gameData.difficulty || 'medium',
        wordLength: gameData.wordLength || 5,
        opponent: gameData.fromUsername || gameData.opponentUsername || 'Opponent'
    };
    
    // If we have a target word, make sure it's included
    if (gameData.targetWord) {
        normalizedData.targetWord = gameData.targetWord;
    }
    
    console.log('Starting game with normalized data:', normalizedData);
    
    // Force socket registration if not already done
    if (typeof forceRegisterUserSocket === 'function') {
        forceRegisterUserSocket();
    }
    
    // Send game_sync event to ensure both players have the same word
    if (window.multiplayerSocket && window.multiplayerSocket.socket) {
        // Set the game ID on the socket
        window.multiplayerSocket.gameId = normalizedData.gameId;
        
        // Get username to include in sync
        const username = window.userManager?.getCurrentUsername() || getUsername();
        
        // Emit the sync event
        window.multiplayerSocket.socket.emit('game_sync', {
            gameId: normalizedData.gameId,
            username: username,
            difficulty: normalizedData.difficulty || 'medium',
            wordLength: normalizedData.wordLength || 5
        });
        
        // Also join the game room explicitly
        window.multiplayerSocket.socket.emit('join_game', {
            gameId: normalizedData.gameId,
            username: username
        });
    }
    
    let gameStartSuccess = false;
    
    // Start the game using the proper manager
    if (window.gameManager) {
        // Get current user
        const currentUser = window.userManager?.getCurrentUser() || { username: getUsername() || 'Player' };
        
        try {
            // Start the game with multiplayer mode
            window.gameManager.startGame('multiplayer', currentUser, normalizedData);
            console.log('Game started using GameManager');
            gameStartSuccess = true;
        } catch (error) {
            console.error('Error starting game with GameManager:', error);
        }
    } 
    // Fallback if game manager isn't available
    if (!gameStartSuccess && window.friendChallengesUI) {
        try {
            window.friendChallengesUI.startGame(normalizedData);
            console.log('Game started using FriendChallengesUI');
            gameStartSuccess = true;
        } catch (error) {
            console.error('Error starting game with FriendChallengesUI:', error);
        }
    }
    
    // Last resort - try direct UI creation
    if (!gameStartSuccess && window.MultiplayerGameUI) {
        try {
            console.log('Attempting to create game UI directly');
            const gameUI = new window.MultiplayerGameUI();
            gameUI.initialize(normalizedData);
            gameStartSuccess = true;
        } catch (error) {
            console.error('Error creating MultiplayerGameUI directly:', error);
        }
    }
    
    return gameStartSuccess;
};

// Make sure direct handlers are created for challenge acceptance events
document.addEventListener('DOMContentLoaded', () => {
    // Wait for socket to be available
    const checkSyncInterval = setInterval(() => {
        if (window.multiplayerSocket && window.multiplayerSocket.socket) {
            // Add a global handler for game_sync events to ensure same target word
            window.multiplayerSocket.socket.on('game_sync_response', (data) => {
                console.log('Game sync response received:', data);
                
                // If we received a target word, start the game
                if (data.targetWord) {
                    // Include the target word in game data
                    const gameData = {
                        gameId: data.gameId,
                        targetWord: data.targetWord,
                        difficulty: data.difficulty || 'medium',
                        wordLength: data.wordLength || 5
                    };
                    
                    // Force start game with the target word
                    setTimeout(() => {
                        window.forceDisplayGame(gameData);
                    }, 500);
                }
            });
            
            clearInterval(checkSyncInterval);
        }
    }, 300);
});

// Add comprehensive direct socket event handlers for ALL possible challenge formats
document.addEventListener('DOMContentLoaded', () => {
    console.log('Setting up COMPREHENSIVE socket handlers for ALL challenge formats');
    
    // Create global flag to prevent duplicate event registrations
    if (window.comprehensiveChallengeHandlersInstalled) {
        console.log('Comprehensive challenge handlers already installed, skipping');
        return;
    }
    
    // Wait for socket to be initialized
    const checkInterval = setInterval(() => {
        if (window.multiplayerSocket && window.multiplayerSocket.socket) {
            const socket = window.multiplayerSocket.socket;
            console.log('Adding comprehensive challenge handlers');
            
            // Mark handlers as installed globally
            window.comprehensiveChallengeHandlersInstalled = true;
            
            // Store known challenge IDs to prevent duplicates
            if (!window.knownChallengeIds) {
                window.knownChallengeIds = new Set();
            }
            
            // All possible event names for challenges
            const challengeEvents = [
                'challenge_received',
                'friend_challenge',
                'notify_friend_challenge',
                'challenge_user',
                'direct_message',
                'new_challenge',
                'pending_challenge',
                'challenge_notification'
            ];
            
            // Add handlers for all possible event names
            challengeEvents.forEach(eventName => {
                // Remove existing listener if any
                socket.off(eventName);
                
                // Add new handler
                socket.on(eventName, (data) => {
                    console.log(`DIRECT handler received ${eventName} event:`, data);
                    
                    // For direct messages, check if it's a challenge
                    if (eventName === 'direct_message' && (!data.type || data.type !== 'challenge')) {
                        return; // Not a challenge message
                    }
                    
                    // Get challenge data - handle different formats
                    let challengeData;
                    
                    if (eventName === 'direct_message') {
                        challengeData = data.data; // Extract from message
                    } else {
                        challengeData = data;
                    }
                    
                    // Ensure required fields exist
                    if (!challengeData.gameCode && !challengeData.gameId && !challengeData.challengeId) {
                        console.warn(`Received ${eventName} but missing game code/ID`);
                        
                        // Try to create an ID if possible
                        if (challengeData.fromUsername || challengeData.challenger) {
                            challengeData.gameCode = `manual-${Date.now()}`;
                        } else {
                            return; // Can't process this challenge
                        }
                    }
                    
                    // Get a unique identifier for this challenge
                    const challengeId = challengeData.gameCode || challengeData.gameId || challengeData.challengeId;
                    
                    // Check if we've seen this challenge recently (within 60 seconds)
                    if (window.knownChallengeIds.has(challengeId)) {
                        console.log(`Skipping duplicate challenge with ID: ${challengeId}`);
                        return;
                    }
                    
                    // Add to known challenges
                    window.knownChallengeIds.add(challengeId);
                    
                    // Auto-expire known challenges after 60 seconds
                    setTimeout(() => {
                        window.knownChallengeIds.delete(challengeId);
                    }, 60000);
                    
                    // Normalize challenger username
                    challengeData.fromUsername = challengeData.fromUsername || 
                                                challengeData.challenger ||
                                                data.from ||
                                                'Someone';
                    
                    // Ensure friendChallengesUI exists
                    if (!window.friendChallengesUI) {
                        console.error('friendChallengesUI not available, creating it');
                        window.friendChallengesUI = new FriendChallengesUI();
                        window.friendChallengesUI.initialize();
                    }
                    
                    // Force show the notification
                    window.friendChallengesUI.showChallengeNotification(challengeData);
                    
                    // Also show a popup message
                    // window.friendChallengesUI.showMessage(
                    //    `${challengeData.fromUsername} has challenged you!`, 'info'
                    // );
                });
            });
            
            clearInterval(checkInterval);
            console.log('Comprehensive challenge handlers installed for ALL event types');
        }
    }, 300);
});

// Global function to force check for pending challenges and test notifications
window.checkForChallenges = function() {
    console.log('Force checking for pending challenges');
    
    // Try multiple methods to get current username
    const username = window.userManager?.getCurrentUsername() || 
                     (window.user?.username) || 
                     localStorage.getItem('username') || 
                     sessionStorage.getItem('username');
                     
    if (!username) {
        console.error('No username found for challenge check');
        return false;
    }
    
    console.log(`Checking challenges for user: ${username}`);
    
    // Method 1: Use the socket to force check challenges
    if (window.multiplayerSocket && window.multiplayerSocket.socket) {
        // Force direct check
        window.multiplayerSocket.socket.emit('force_check_challenges', { username });
        
        // Also try general challenge check
        window.multiplayerSocket.socket.emit('check_challenges', { username });
        
        // Also try to get pending challenges
        window.multiplayerSocket.socket.emit('get_pending_challenges', { username });
        
        console.log('Challenge check requests sent through socket');
        return true;
    }
    
    return false;
};

// Force generate a test notification to ensure the system is working
window.testChallengeNotification = function() {
    console.log('Creating test challenge notification');
    
    // Make sure the UI is initialized
    if (!window.friendChallengesUI) {
        window.friendChallengesUI = new FriendChallengesUI();
        window.friendChallengesUI.initialize();
    }
    
    // Create a test challenge data
    const testData = {
        gameCode: 'test-' + Date.now(),
        fromUsername: 'Test User',
        difficulty: 'medium',
        wordLength: 5,
        timestamp: Date.now()
    };
    
    // Show the notification
    window.friendChallengesUI.showChallengeNotification(testData);
    
    return true;
};

// Auto-run check on page load - last resort measure
setTimeout(() => {
    console.log('Automatic challenge check running after page load');
    window.checkForChallenges();
}, 3000);

// Create a very small test notification to check if system works
setTimeout(() => {
    if (window.friendChallengesUI) {
        window.friendChallengesUI.showTestNotification();
    }
}, 5000);

// Ensure socket registration happens immediately on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log("SOCKET REGISTRATION: Initial check on page load");
    forceRegisterUserSocket();
    
    // Try again after a short delay (helps with timing issues)
    setTimeout(forceRegisterUserSocket, 1000);
    
    // And once more with a longer delay for safety
    setTimeout(forceRegisterUserSocket, 3000);
});

// Helper to get username from any available source
function getUsername() {
    // Try multiple ways to get username in order of reliability
    let username = null;
    
    // Method 1: Check userManager (most reliable)
    if (window.userManager && typeof window.userManager.getCurrentUsername === 'function') {
        username = window.userManager.getCurrentUsername();
        if (username) console.log(`Got username from userManager: ${username}`);
    }
    
    // Method 2: Try multiplayerSocket's stored username
    if (!username && window.multiplayerSocket && window.multiplayerSocket.username) {
        username = window.multiplayerSocket.username;
        if (username) console.log(`Got username from multiplayerSocket: ${username}`);
    }
    
    // Method 3: Check authSystem
    if (!username && window.authSystem && typeof window.authSystem.getCurrentUser === 'function') {
        const user = window.authSystem.getCurrentUser();
        if (user && user.username) {
            username = user.username;
            if (username) console.log(`Got username from authSystem: ${username}`);
        }
    }
    
    // Method 4: Check window.currentUser
    if (!username && window.currentUser && window.currentUser.username) {
        username = window.currentUser.username;
        if (username) console.log(`Got username from window.currentUser: ${username}`);
    }
    
    // Method 5: Check localStorage methods
    if (!username) {
        // Direct username storage
        username = localStorage.getItem('username');
        if (username) console.log(`Got username from localStorage.username: ${username}`);
        
        // User object storage
        if (!username && localStorage.getItem('user')) {
            try {
                const userData = JSON.parse(localStorage.getItem('user'));
                if (userData && userData.username) {
                    username = userData.username;
                    if (username) console.log(`Got username from localStorage.user: ${username}`);
                }
            } catch (e) {
                console.error('Error parsing user from localStorage.user:', e);
            }
        }
        
        // CurrentUser object storage
        if (!username && localStorage.getItem('currentUser')) {
            try {
                const userData = JSON.parse(localStorage.getItem('currentUser'));
                if (userData && userData.username) {
                    username = userData.username;
                    if (username) console.log(`Got username from localStorage.currentUser: ${username}`);
                }
            } catch (e) {
                console.error('Error parsing user from localStorage.currentUser:', e);
            }
        }
    }
    
    // Method 6: Try to parse JWT token
    if (!username && localStorage.getItem('authToken')) {
        try {
            const token = localStorage.getItem('authToken');
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const payload = JSON.parse(jsonPayload);
            if (payload && payload.username) {
                username = payload.username;
                if (username) console.log(`Got username from JWT token: ${username}`);
            }
        } catch (e) {
            console.error('Error parsing JWT token:', e);
        }
    }
    
    // Method 7: Check DOM elements (last resort)
    if (!username) {
        // Profile username element
        const profileUsername = document.querySelector('#profile-username');
        if (profileUsername && profileUsername.textContent) {
            username = profileUsername.textContent.trim();
            if (username) console.log(`Got username from #profile-username element: ${username}`);
        }
        
        // User display name element
        if (!username) {
            const userDisplayName = document.querySelector('#user-display-name');
            if (userDisplayName && userDisplayName.textContent) {
                username = userDisplayName.textContent.trim();
                if (username) console.log(`Got username from #user-display-name element: ${username}`);
            }
        }
        
        // Header username element
        if (!username) {
            const headerUsername = document.querySelector('.user-info .username');
            if (headerUsername && headerUsername.textContent) {
                username = headerUsername.textContent.trim();
                if (username) console.log(`Got username from header element: ${username}`);
            }
        }
    }
    
    // Store the username globally if found
    if (username) {
        window.username = username;
        
        // Also store on multiplayerSocket if available
        if (window.multiplayerSocket) {
            window.multiplayerSocket.username = username;
        }
    }
    
    return username;
}

// Function to force socket user registration
function forceRegisterUserSocket() {
    console.log('Forcing socket registration to ensure notification delivery');
    
    // Require the socket to be available
    if (!window.multiplayerSocket || !window.multiplayerSocket.socket) {
        console.error('Socket not available for registration');
        setTimeout(forceRegisterUserSocket, 1000); // Try again in 1 second
        return false;
    }
    
    // Get the username using our enhanced method
    const username = getUsername();
    
    if (!username) {
        console.error('Unable to determine username for socket registration');
        setTimeout(forceRegisterUserSocket, 3000); // Try again in 3 seconds
        return false;
    }
    
    // Register the username with the socket
    console.log(`Registering username ${username} with socket ${window.multiplayerSocket.socket.id}`);
    
    // Store username on the socket object for local reference
    window.multiplayerSocket.username = username;
    
    // Send registration event to server using multiple methods for redundancy
    try {
        // Method 1: Standard registration
        window.multiplayerSocket.socket.emit('register_user', { username });
        
        // Method 2: Direct registration
        window.multiplayerSocket.socket.emit('register', { username });
        
        // Method 3: Join room with username
        window.multiplayerSocket.socket.emit('join', { room: username });
        
        // Set registration flag
        window.multiplayerSocket.registered = true;
        
        // Schedule periodic re-registration to ensure connection persists
        if (!window.registrationInterval) {
            window.registrationInterval = setInterval(() => {
                if (window.multiplayerSocket && window.multiplayerSocket.socket) {
                    window.multiplayerSocket.socket.emit('register', { username });
                }
            }, 30000); // Re-register every 30 seconds
        }
        
        console.log(`Socket registration completed for ${username}`);
        return true;
    } catch (error) {
        console.error('Socket registration failed:', error);
        return false;
    }
}

// Now enhance the challenge sending code to ensure username registration is active
function sendChallengeWithRegistration(friend, difficulty) {
    // Ensure socket is registered with username before sending
    forceRegisterUserSocket();
    
    // Get current username with fallbacks
    const username = getUsername();
    if (!username) {
        console.error("Cannot send challenge: No username found");
        return false;
    }
    
    // Then continue with normal challenge sending
    return sendChallenge(friend, difficulty);
}

// Create a global displayedNotifications set for the global function
window.globalDisplayedNotifications = new Set();

window.showChallengeNotification = function(data) {
    console.log('GLOBAL: Showing challenge notification with data:', data);
    
    // Try to use FriendChallengesUI if available
    if (window.friendChallengesUI && typeof window.friendChallengesUI.showChallengeNotification === 'function') {
        return window.friendChallengesUI.showChallengeNotification(data);
    }
    
    // Check for duplicate notification
    const notificationId = data.gameCode || data.challengeId || data.gameId || Math.floor(Math.random() * 1000000).toString();
    const notificationKey = `${data.fromUsername}_to_${data.toUsername || 'me'}_${notificationId}`;
    
    if (window.globalDisplayedNotifications.has(notificationKey)) {
        console.log(`GLOBAL: Skipping duplicate notification: ${notificationKey}`);
        return null;
    }
    
    // Add to displayed notifications set
    window.globalDisplayedNotifications.add(notificationKey);
    
    // Fallback implementation if FriendChallengesUI is not available
    // Create or get notification container
    let container = document.getElementById('challenge-notifications');
    if (!container) {
        container = document.createElement('div');
        container.id = 'challenge-notifications';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 320px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: auto !important;
        `;
        document.body.appendChild(container);
        console.log('GLOBAL: Created notification container');
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'challenge-notification';
    notification.id = `challenge-${notificationId}`;
    notification.style.cssText = `
        background-color: rgba(33, 150, 243, 0.95);
        color: white;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        pointer-events: auto !important;
        animation: fadeIn 0.3s ease-in-out;
    `;
    
    // Add animation style if needed
    if (!document.getElementById('notification-animations')) {
        const style = document.createElement('style');
        style.id = 'notification-animations';
        style.textContent = `
            @keyframes fadeIn {
                0% { opacity: 0; transform: translateY(20px); }
                100% { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add content
    notification.innerHTML = `
        <div class="notification-content" style="pointer-events: auto !important;">
            <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 18px; color: white;">New Challenge!</h3>
            <p style="margin-bottom: 12px; font-size: 14px;">${data.fromUsername || 'Someone'} has challenged you to a game</p>
            <div class="notification-buttons" style="display: flex; gap: 10px; pointer-events: auto !important;">
                <button class="accept-challenge" data-challenge-id="${notificationId}" 
                    style="flex: 1; padding: 8px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    Accept
                </button>
                <button class="decline-challenge" data-challenge-id="${notificationId}" 
                    style="flex: 1; padding: 8px; background-color: #F44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Decline
                </button>
            </div>
        </div>
    `;
    
    // Store challenge data for later reference
    if (!window.challenges) window.challenges = {};
    window.challenges[notificationId] = data;
    
    // Add event listeners
    notification.querySelector('.accept-challenge').addEventListener('click', () => {
        if (window.acceptChallenge) {
            window.acceptChallenge(notificationId);
        } else if (window.friendChallengesUI) {
            window.friendChallengesUI.acceptChallenge(notificationId);
        } else {
            console.error('No acceptChallenge function available');
        }
        
        // Remove the notification
        if (notification.parentNode) {
            notification.remove();
        }
    });
    
    notification.querySelector('.decline-challenge').addEventListener('click', () => {
        if (window.declineChallenge) {
            window.declineChallenge(notificationId);
        } else if (window.friendChallengesUI) {
            window.friendChallengesUI.declineChallenge(notificationId);
        } else {
            console.error('No declineChallenge function available');
        }
        
        // Remove the notification
        if (notification.parentNode) {
            notification.remove();
        }
    });
    
    // Add to container
    container.appendChild(notification);
    
    // Play notification sound
    if (window.playNotificationSound) {
        window.playNotificationSound();
    } else if (window.friendChallengesUI && window.friendChallengesUI.playNotificationSound) {
        window.friendChallengesUI.playNotificationSound();
    }
    
    // Auto-remove after 60 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 60000);
    
    // Add to notification history
    if (window.addToNotificationHistory) {
        window.addToNotificationHistory(data, notificationId);
    } else if (window.friendChallengesUI && window.friendChallengesUI.addToNotificationHistory) {
        window.friendChallengesUI.addToNotificationHistory(data, notificationId);
    }
    
    return notification;
};

// Add direct socket event handlers for challenges
document.addEventListener('DOMContentLoaded', function() {
    console.log('GLOBAL: Setting up direct socket event handlers for challenges');
    
    // Wait for socket to be available
    const checkSocketInterval = setInterval(function() {
        if (window.multiplayerSocket && window.multiplayerSocket.socket) {
            console.log('GLOBAL: Socket available, adding direct challenge handlers');
            
            // Listen for all possible challenge event types
            const challengeEvents = [
                'challenge_received',
                'challenge_notification',
                'friend_challenge',
                'direct_challenge',
                'game_invitation'
            ];
            
            // Add handlers for all event types
            challengeEvents.forEach(eventName => {
                window.multiplayerSocket.socket.on(eventName, function(data) {
                    console.log(`GLOBAL: Received ${eventName} event:`, data);
                    
                    // Check if this challenge is for current user
                    const currentUsername = window.getUsername ? window.getUsername() : 
                                           (window.userManager ? window.userManager.getCurrentUsername() : null);
                    
                    const isForCurrentUser = !currentUsername || 
                                            data.toUsername === currentUsername || 
                                            data.target === currentUsername;
                    
                    if (isForCurrentUser) {
                        // Show notification using global function
                        window.showChallengeNotification(data);
                    }
                });
            });
            
            clearInterval(checkSocketInterval);
        }
    }, 1000);
}); 