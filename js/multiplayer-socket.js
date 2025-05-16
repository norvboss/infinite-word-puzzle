// Multiplayer Socket Handler
class MultiplayerSocketHandler {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.gameId = null;
        this.challengeCallbacks = {};
        this.gameCallbacks = {};
        this.pendingChallenges = [];
    }

    // Initialize the socket connection
    connect() {
        if (this.socket && this.connected) {
            console.log("Socket already connected");
            return;
        }

        // Connect to the socket.io server
        this.socket = io();

        // Set up connection event handlers
        this.socket.on('connect', () => {
            console.log('Connected to game server with ID:', this.socket.id);
            this.connected = true;
            
            // Register the current username with the socket immediately after connecting
            if (window.userManager) {
                const username = window.userManager.getCurrentUsername();
                if (username) {
                    console.log('Automatically registering username with socket:', username);
                    this.socket.emit('register_socket_user', { username });
                } else {
                    console.warn('No username available for socket registration');
                }
            } else {
                console.warn('UserManager not available for socket registration');
            }
            
            // Set up all socket event listeners
            this.setupEventListeners();
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from game server');
            this.connected = false;
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.connected = false;
        });

        return this.socket;
    }

    // Try to register username from all possible sources
    registerUsernameFromAllPossibleSources() {
        console.log('Attempting to register username from all possible sources');
        let username = null;
        
        // Try userManager first (most reliable)
        if (window.userManager && typeof window.userManager.getCurrentUsername === 'function') {
            username = window.userManager.getCurrentUsername();
            console.log('Found username from userManager:', username);
        }
        
        // Try authSystem if userManager failed
        if (!username && window.authSystem && window.authSystem.currentUser) {
            username = window.authSystem.currentUser.username;
            console.log('Found username from authSystem:', username);
        }
        
        // Try localStorage as last resort
        if (!username) {
            try {
                const token = localStorage.getItem('wordleToken');
                if (token) {
                    // Extract username from JWT token
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    
                    const payload = JSON.parse(jsonPayload);
                    if (payload.username) {
                        username = payload.username;
                        console.log('Found username from JWT token:', username);
                    }
                }
            } catch (e) {
                console.error('Error extracting username from token:', e);
            }
        }
        
        // Register the username if found
        if (username) {
            console.log('Registering username with socket:', username);
            this.registerUser(username);
        } else {
            console.warn('Could not find username from any source');
        }
    }

    // Register the current username with the socket for friend challenges
    registerUser(username) {
        if (!this.connected || !username) {
            console.warn('Cannot register user: Socket not connected or username not provided');
            return;
        }
        
        console.log('Registering socket user:', username);
        this.socket.emit('register_socket_user', { username });
    }

    // Set up event handlers for multiplayer game
    setupGameEvents() {
        // Game state events
        this.socket.on('match_found', (data) => {
            console.log('Match found:', data);
            if (this.gameCallbacks.onMatchFound) {
                this.gameId = data.gameId;
                this.gameCallbacks.onMatchFound(data);
            }
        });
        
        // Direct game start event (backup method)
        this.socket.on('game_start', (data) => {
            console.log('Game start event received:', data);
            
            // Set the game ID
            if (data.gameId) {
                this.gameId = data.gameId;
            }
            
            // Start the game directly
            this.startGameFromChallenge(data);
        });

        this.socket.on('guess_result', (data) => {
            console.log('Guess result:', data);
            if (this.gameCallbacks.onGuessResult) {
                this.gameCallbacks.onGuessResult(data);
            }
        });

        this.socket.on('guess_error', (data) => {
            console.error('Guess error:', data);
            if (this.gameCallbacks.onGuessError) {
                this.gameCallbacks.onGuessError(data);
            }
        });

        this.socket.on('opponent_guess', (data) => {
            console.log('Opponent guess:', data);
            if (this.gameCallbacks.onOpponentGuess) {
                this.gameCallbacks.onOpponentGuess(data);
            }
        });

        this.socket.on('game_over', (data) => {
            console.log('Game over:', data);
            if (this.gameCallbacks.onGameOver) {
                this.gameCallbacks.onGameOver(data);
            }
        });

        this.socket.on('opponent_left', () => {
            console.log('Opponent left the game');
            if (this.gameCallbacks.onOpponentLeft) {
                this.gameCallbacks.onOpponentLeft();
            }
        });

        this.socket.on('opponent_disconnected', () => {
            console.log('Opponent disconnected');
            if (this.gameCallbacks.onOpponentDisconnected) {
                this.gameCallbacks.onOpponentDisconnected();
            }
        });
    }

    // Set up event handlers for friend challenge system
    setupChallengeEvents() {
        // Challenge received
        this.socket.on('challenge_received', (data) => {
            console.log('Challenge received:', data);
            if (this.challengeCallbacks.onChallengeReceived) {
                this.challengeCallbacks.onChallengeReceived(data);
            }
        });
        
        // Challenge created - notify friend
        this.socket.on('challenge_created', (data) => {
            console.log('Challenge created:', data);
            if (this.challengeCallbacks.onChallengeCreated) {
                this.challengeCallbacks.onChallengeCreated(data);
            }
        });
        
        // Challenge notification sent
        this.socket.on('challenge_notification_sent', (data) => {
            console.log('Challenge notification sent:', data);
            if (this.challengeCallbacks.onChallengeNotificationSent) {
                this.challengeCallbacks.onChallengeNotificationSent(data);
            }
        });
        
        // Challenge accepted (for creator)
        this.socket.on('challenge_accepted', (data) => {
            console.log('Challenge accepted:', data);
            
            // Store the game ID for this session
            if (data.gameId) {
                this.gameId = data.gameId;
                console.log('Setting current game ID to:', this.gameId);
            }
            
            // Notify callback
            if (this.challengeCallbacks.onChallengeAccepted) {
                this.challengeCallbacks.onChallengeAccepted(data);
            }
            
            // Force start the game if we have a game manager
            this.startGameFromChallenge(data);
        });
        
        // Challenge declined (for creator)
        this.socket.on('challenge_declined', (data) => {
            console.log('Challenge declined:', data);
            if (this.challengeCallbacks.onChallengeDeclined) {
                this.challengeCallbacks.onChallengeDeclined(data);
            }
        });
        
        // Challenge response result (for responder)
        this.socket.on('challenge_response_result', (data) => {
            console.log('Challenge response result:', data);
            
            // Store the game ID for this session
            if (data.gameId) {
                this.gameId = data.gameId;
                console.log('Setting current game ID to:', this.gameId);
            }
            
            if (this.challengeCallbacks.onChallengeResponseResult) {
                this.challengeCallbacks.onChallengeResponseResult(data);
            }
            
            // Force start the game if we have a game ID
            if (data.gameId) {
                this.startGameFromChallenge(data);
            }
        });

        // Handle friend challenges
        this.socket.on('friend_challenge', (data) => {
            console.log('Friend challenge received:', data);
            
            // Ensure data includes all required fields
            if (!data.gameCode) {
                console.error('Friend challenge missing gameCode:', data);
                return;
            }
            
            // Format data for the UI
            const challengeData = {
                gameCode: data.gameCode,
                fromUsername: data.challenger || 'Someone',
                gameData: data
            };
            
            // Show notification if friend challenges system is ready
            if (window.friendChallengesUI) {
                window.friendChallengesUI.showChallengeNotification(
                    challengeData.gameCode, 
                    challengeData.fromUsername, 
                    challengeData.gameData
                );
            } else {
                console.error('Friend challenges UI not ready to show notification');
            }
        });
    }

    // Start the game directly from a challenge event
    startGameFromChallenge(data) {
        console.log('Attempting to start game from challenge data:', data);
        
        if (!data.gameId) {
            console.error('Cannot start game: missing game ID in challenge data');
            return;
        }
        
        // Convert data to game options format
        const gameOptions = {
            gameId: data.gameId,
            wordLength: data.wordLength || 5,
            difficulty: data.difficulty || 'medium',
            opponent: data.opponentUsername || 'Opponent',
            opponentId: data.opponentId
        };
        
        console.log('Starting multiplayer game with options:', gameOptions);
        
        // Start the game using game manager
        if (window.gameManager) {
            try {
                // Ensure we're connected
                if (!this.connected) {
                    this.connect();
                }
                
                // Set the game ID
                this.gameId = data.gameId;
                
                // Get current user
                const currentUser = window.userManager?.getCurrentUser() || { username: 'Player' };
                
                // Start the game directly
                window.gameManager.startGame('multiplayer', currentUser, gameOptions);
                
                return true;
            } catch (error) {
                console.error('Error starting game from challenge:', error);
                return false;
            }
        } else {
            console.error('Game manager not found, cannot start game');
            return false;
        }
    }

    // Register callbacks for game events
    onGame(eventType, callback) {
        if (!this.gameCallbacks) {
            this.gameCallbacks = {};
        }
        
        console.log(`Registering callback for game event: ${eventType}`);
        this.gameCallbacks[eventType] = callback;
    }

    // For backward compatibility - also register with direct method name
    onMatchFound(callback) {
        this.onGame('onMatchFound', callback);
    }

    onGuessResult(callback) {
        this.onGame('onGuessResult', callback);
    }

    onOpponentGuess(callback) {
        this.onGame('onOpponentGuess', callback);
    }

    onGameOver(callback) {
        this.onGame('onGameOver', callback);
    }

    onOpponentLeft(callback) {
        this.onGame('onOpponentLeft', callback);
    }

    // Register callbacks for challenge events
    onChallenge(eventType, callback) {
        this.challengeCallbacks[eventType] = callback;
    }

    // Create a friend challenge
    createFriendChallenge(friendUsername, difficulty) {
        console.log(`Creating friend challenge to ${friendUsername} with difficulty: ${difficulty}`);
        
        if (!this.socket || !this.connected) {
            console.error('Socket not connected, cannot create challenge');
            return false;
        }
        
        // Get current user
        const username = this.getUsername();
        if (!username) {
            console.error('Cannot create challenge: username not available');
            return false;
        }
        
        console.log(`Sending challenge from ${username} to ${friendUsername}`);
        
        // Create challenge ID
        const challengeId = Math.floor(Math.random() * 1000000).toString();
        
        // Emit challenge event
        this.socket.emit('challenge', {
            fromUsername: username,
            toUsername: friendUsername,
            difficulty: difficulty,
            challengeId: challengeId,
            timestamp: Date.now()
        });
        
        console.log(`Challenge sent with ID: ${challengeId}`);
        return true;
    }

    // Notify a friend about a challenge
    notifyFriendChallenge(gameCode, friendUsername) {
        if (!this.connected) {
            console.error('Not connected to server');
            return false;
        }

        const username = window.userManager ? window.userManager.getCurrentUsername() : 'Player';
        
        this.socket.emit('notify_friend_challenge', {
            username,
            gameCode,
            friendUsername
        });
        
        return true;
    }

    // Respond to a friend challenge (accept or decline)
    respondToChallenge(gameCode, accepted) {
        if (!this.connected) {
            console.error('Not connected to server');
            return false;
        }

        const username = window.userManager ? window.userManager.getCurrentUsername() : 'Player';
        
        this.socket.emit('respond_to_challenge', {
            username,
            gameCode,
            accepted
        });
        
        return true;
    }

    // Submit a guess to the server for the current game
    makeGuess(guess) {
        if (!this.socket) {
            console.error('Socket not initialized');
            return false;
        }

        if (!this.gameId) {
            console.error('Not in an active game');
            return false;
        }
        
        console.log(`Submitting guess "${guess}" for game ${this.gameId}`);
        
        this.socket.emit('submit_guess', {
            gameId: this.gameId,
            guess: guess
        });
        
        return true;
    }

    // Find a random opponent
    findRandomMatch(difficulty) {
        if (!this.connected) {
            console.error('Not connected to server');
            return false;
        }
        
        this.socket.emit('find_random_match', { difficulty });
        return true;
    }

    // Cancel matchmaking
    cancelMatchmaking() {
        if (!this.connected) {
            console.error('Not connected to server');
            return false;
        }
        
        this.socket.emit('cancel_matchmaking');
        return true;
    }

    // Leave the current game
    leaveGame() {
        if (!this.connected || !this.gameId) {
            console.error('Not in an active game or not connected');
            return false;
        }
        
        this.socket.emit('leave_game', { gameId: this.gameId });
        this.gameId = null;
        return true;
    }

    // Disconnect from the server
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.gameId = null;
        }
    }

    // Set up recurring username registration to ensure it stays registered
    setupRecurringUsernameRegistration() {
        // Register every 3 seconds for 30 seconds (10 attempts)
        for (let i = 1; i <= 10; i++) {
            setTimeout(() => {
                if (this.connected) {
                    console.log(`Recurring username registration attempt ${i}/10`);
                    this.registerUsernameFromAllPossibleSources();
                }
            }, i * 3000);
        }
    }

    // Set up all event listeners for the socket
    setupEventListeners() {
        if (!this.socket) {
            console.error('Cannot set up event listeners: Socket not initialized');
            return;
        }
        
        // Game update events
        this.socket.on('game_update', (data) => {
            console.log('Received game update:', data);
            
            if (!window.multiplayerGame) {
                console.error('Game UI not initialized when receiving game update');
                // Try to recover by initializing the game if we have game data
                if (data.gameId && window.gameManager) {
                    console.log('Attempting to initialize game with ID:', data.gameId);
                    window.gameManager.startMultiplayerGame({
                        gameId: data.gameId,
                        opponent: data.opponentUsername || 'Opponent',
                        wordLength: data.wordLength || 5,
                        difficulty: data.difficulty || 'medium'
                    });
                }
                return;
            }
            
            // Update the game UI with the received data
            window.multiplayerGame.handleGameUpdate(data);
        });
        
        this.socket.on('guess_result', (data) => {
            console.log('Received guess result:', data);
            
            if (!window.multiplayerGame) {
                console.error('Game UI not initialized when receiving guess result');
                return;
            }
            
            // Update the game UI with the guess result
            window.multiplayerGame.handleGuessResult(data);
        });
        
        // Game error events
        this.socket.on('game_error', (error) => {
            console.error('Game error received:', error);
            
            if (window.multiplayerGame) {
                window.multiplayerGame.showMessage(error.message || 'Game error occurred', 'error');
            } else if (window.gameManager) {
                window.gameManager.showMessage(error.message || 'Game error occurred', 'error');
            } else {
                alert('Game error: ' + (error.message || 'Unknown error'));
            }
        });
        
        // Friend challenge notifications
        this.socket.on('friend_challenge', (data) => {
            console.log('Received friend challenge:', data);
            
            // Validate challenge data
            if (!data || !data.gameCode || !data.fromUsername) {
                console.error('Invalid challenge data received:', data);
                return;
            }
            
            // Initialize friend challenges UI if not already done
            if (!window.friendChallengesUI) {
                console.warn('Friend challenges UI not initialized, creating instance');
                window.friendChallengesUI = new FriendChallengesUI();
                window.friendChallengesUI.initialize();
            }
            
            // Show the challenge notification
            window.friendChallengesUI.showChallengeNotification(data);
        });
        
        // Debug events
        this.socket.on('debug', (data) => {
            console.log('Socket debug message:', data);
        });
    }

    // Add a reliable username getter method
    getUsername() {
        // Try multiple methods to get the username
        let username = null;
        
        // Method 1: Check if username is set on the socket object
        if (this.username) {
            username = this.username;
        }
        
        // Method 2: Try to get it from userManager
        if (!username && window.userManager && typeof window.userManager.getCurrentUsername === 'function') {
            username = window.userManager.getCurrentUsername();
        }
        
        // Method 3: Try to get it from localStorage auth token
        if (!username) {
            try {
                const token = localStorage.getItem('authToken');
                if (token) {
                    // Basic JWT parsing (without verification)
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    
                    const payload = JSON.parse(jsonPayload);
                    if (payload.username) {
                        username = payload.username;
                    }
                }
            } catch (e) {
                console.error('Error parsing auth token:', e);
            }
        }
        
        // Method 4: Try to get from auth system
        if (!username && window.authSystem && typeof window.authSystem.getCurrentUser === 'function') {
            const user = window.authSystem.getCurrentUser();
            if (user && user.username) {
                username = user.username;
            }
        }
        
        // Method 5: Check for global window.username
        if (!username && window.username) {
            username = window.username;
        }
        
        // Save the username on the socket object for future use
        if (username) {
            this.username = username;
            
            // Also register the socket if not already done
            if (this.socket && this.connected) {
                this.socket.emit('register', { username: username });
                console.log(`Socket registered with username: ${username}`);
            }
        }
        
        return username;
    }
}

// Create a global instance
window.multiplayerSocket = new MultiplayerSocketHandler(); 