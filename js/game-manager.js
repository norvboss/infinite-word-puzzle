// Game Manager with Structured Difficulty Progression
class GameManager {
    constructor() {
        this.currentUser = null;
        this.gameMode = 'single'; // 'single' or 'multiplayer'
        this.multiplayerOptions = null;
        this.gameContainer = document.getElementById('game-container');
        this.wordleGame = null;
        
        // Progression system - Default values
        this.currentLevel = 1;
        this.levelProgress = 0;
        this.wordsPerLevel = 5;
        this.currentDifficulty = 'easy';
        this.totalPoints = 0;
        
        // *** Add Set to track used words in this session ***
        this.usedWords = new Set();
        
        // *** Add local stats tracking within GameManager ***
        this.stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            // We already track totalPoints and highestLevel separately (level)
            // Add other fields if needed later
        };
        
        // Cached elements
        this.gameContent = null;
        this.modal = null;
        
        // Create game container if it doesn't exist
        if (!this.gameContainer) {
            this.createGameContainer();
        }
        
        // *** Load progress from localStorage ***
        this.loadProgress();
        
        // *** Update UI after loading ***
        this.updateLevelDisplay(); 
        
        console.log("GameManager initialized");
    }
    
    createGameContainer() {
        this.gameContainer = document.createElement('div');
        this.gameContainer.id = 'game-container';
        this.gameContainer.className = 'hidden';
        document.body.appendChild(this.gameContainer);
        
        // Add game header
        const gameHeader = document.createElement('div');
        gameHeader.className = 'game-header';
        gameHeader.innerHTML = `
            <div class="game-info">
                <div class="level-display">
                    <span>Level: <span id="current-level">1</span></span>
                    <div class="progress-bar">
                        <div id="level-progress" class="progress"></div>
                    </div>
                </div>
                <div class="points-display">
                    <span>Points: <span id="current-points">0</span></span>
                </div>
            </div>
            <div class="game-controls">
                <button id="back-to-home" type="button">Back to Home</button>
            </div>
        `;
        this.gameContainer.appendChild(gameHeader);
        
        // Add game content container
        const gameContent = document.createElement('div');
        gameContent.id = 'game-content';
        this.gameContainer.appendChild(gameContent);
        
        // Add CSS
        const style = document.createElement('style');
        style.textContent = `
            #game-container {
                width: 100%;
                height: 100%;
                position: fixed;
                top: 0;
                left: 0;
                background-color: var(--background-color);
                display: flex;
                flex-direction: column;
                z-index: 100;
            }
            
            .game-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background-color: white;
                border-bottom: 1px solid #eee;
                box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            }
            
            .game-info {
                display: flex;
                align-items: center;
                gap: 20px;
            }
            
            .level-display {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .progress-bar {
                width: 150px;
                height: 8px;
                background-color: #eee;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .progress {
                height: 100%;
                background-color: var(--correct-color);
                width: 0%;
                transition: width 0.3s ease;
            }
            
            .points-display {
                font-weight: bold;
            }
            
            #back-to-home {
                padding: 8px 16px;
                background-color: #f0f0f0;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            #game-content {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 20px;
                overflow-y: auto;
            }
            
            .opponent-info {
                margin-bottom: 15px;
                padding: 10px 15px;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.08);
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .opponent-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: var(--present-color);
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Back to home button
        const backButton = document.getElementById('back-to-home');
        if (backButton) {
            console.log("Setting up back button event listener");
            backButton.addEventListener('click', () => {
                console.log("Back button clicked");
                this.exitGame();
            });
        } else {
            console.error("Back button element not found in setupEventListeners");
        }
    }
    
    startGame(mode, user, options = {}) {
        console.log(`[GameManager Debug] GAME START CALLED`, { mode, options });
        
        // Clean up any existing game
        this.cleanup();
        
        // Show the game container
        this.showGameContainer();
        console.log(`[GameManager Debug] Container states before showing game`, {
            gameContainerHidden: this.gameContainer.classList.contains('hidden'),
            gameContainerDisplay: window.getComputedStyle(this.gameContainer).display,
            authContainer: document.getElementById('auth-container') ? 'exists' : 'not found',
            homeContainer: document.getElementById('home-container') ? 'exists' : 'not found'
        });
        
        // Add shake animation style if it doesn't exist
        if (!document.getElementById('game-animations-style')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'game-animations-style';
            styleElement.textContent = `
                @keyframes shakeRow {
                    0% { transform: translateX(0); }
                    10% { transform: translateX(-5px); }
                    20% { transform: translateX(5px); }
                    30% { transform: translateX(-5px); }
                    40% { transform: translateX(5px); }
                    50% { transform: translateX(-5px); }
                    60% { transform: translateX(5px); }
                    70% { transform: translateX(-5px); }
                    80% { transform: translateX(5px); }
                    90% { transform: translateX(-5px); }
                    100% { transform: translateX(0); }
                }
                
                .shake {
                    animation: shakeRow 0.5s ease;
                }
            `;
            document.head.appendChild(styleElement);
        }
        
        // Update game mode and options
        this.gameMode = mode;
        
        try {
            // Force any hidden containers to be shown (common issue)
            document.querySelectorAll('.container').forEach(container => {
                container.classList.remove('hidden');
            });
            
            // Get the username if user object is provided
            const username = user ? (user.username || 'Anonymous') : 'Anonymous';
            
            // Get the game container and ensure it's visible
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.classList.remove('hidden');
                // Force display style - critical fix
                gameContainer.style.display = 'block';
            } else {
                console.error('Game container not found - creating it now');
                this.createGameContainer();
                this.gameContainer.classList.remove('hidden');
                this.gameContainer.style.display = 'block';
            }
            
            // Get game content container
            const gameContent = document.getElementById('game-content');
            if (!gameContent) {
                console.error('Game content container not found - creating it');
                const newGameContent = document.createElement('div');
                newGameContent.id = 'game-content';
                this.gameContainer.appendChild(newGameContent);
            } else {
                // Clear previous content
                gameContent.innerHTML = '';
            }
            
            // Show game container - use direct manipulation if method fails
            try {
                this.showGameContainer();
            } catch (error) {
                console.error('Error in showGameContainer:', error);
                // Fallback to direct container manipulation
                gameContainer.classList.remove('hidden');
                gameContainer.style.display = 'block';
                
                const authContainer = document.getElementById('auth-container');
                const homeContainer = document.getElementById('home-container');
                if (authContainer) authContainer.classList.add('hidden');
                if (homeContainer) homeContainer.classList.add('hidden');
            }
            
            // Set up back button safely
            try {
                this.setupBackButton();
            } catch (error) {
                console.error('Error setting up back button:', error);
            }
            
            // Log containers
            this.debugLog("Container states before showing game", {
                gameContainerHidden: gameContainer.classList.contains('hidden'),
                gameContainerDisplay: window.getComputedStyle(gameContainer).display,
                authContainerHidden: document.getElementById('auth-container')?.classList.contains('hidden'),
                homeContainerHidden: document.getElementById('home-container')?.classList.contains('hidden')
            });
            
            // Hide other containers
            const authContainer = document.getElementById('auth-container');
            const homeContainer = document.getElementById('home-container');
            
            if (authContainer) authContainer.classList.add('hidden');
            if (homeContainer) homeContainer.classList.add('hidden');
            
            // Setup single player game
            if (mode === 'single' || mode === 'singleplayer') {
                try {
                    this.setupSinglePlayerGame(options);
                } catch (error) {
                    console.error('Error setting up single player game:', error);
                    this.showErrorMessage('Error starting single player game.');
                }
                
                // Force visible
                setTimeout(() => {
                    if (gameContainer) {
                        gameContainer.classList.remove('hidden');
                        gameContainer.style.display = 'block';
                        
                        // Log the state
                        this.debugLog("Container states after delayed check for single player", {
                            gameContainerHidden: gameContainer.classList.contains('hidden'),
                            gameContainerDisplay: window.getComputedStyle(gameContainer).display
                        });
                    }
                }, 100);
            }
            // Setup multiplayer game
            else if (mode === 'multiplayer') {
                // Store the game ID in a global variable
                if (options.gameId && window.multiplayerSocket) {
                    window.multiplayerSocket.gameId = options.gameId;
                    console.log(`Game Manager: Setting socket game ID to ${options.gameId}`);
                    
                    // Ensure socket is connected
                    if (!window.multiplayerSocket.connected) {
                        window.multiplayerSocket.connect();
                    }
                } else {
                    console.warn('Game Manager: Missing game ID or socket handler');
                }
                
                // Setup multiplayer game
                try {
                    this.setupMultiplayerGame(options);
                } catch (error) {
                    console.error('Error setting up multiplayer game:', error);
                    this.showErrorMessage('Error starting multiplayer game. Trying fallback method...');
                    
                    // Create a minimal game display as a fallback
                    this.createMinimalMultiplayerGame(options, gameContent);
                }
                
                // Force visible
                setTimeout(() => {
                    if (gameContainer) {
                        gameContainer.classList.remove('hidden');
                        gameContainer.style.display = 'block';
                        
                        // Log the state
                        this.debugLog("Container states after delayed check for multiplayer", {
                            gameContainerHidden: gameContainer.classList.contains('hidden'),
                            gameContainerDisplay: window.getComputedStyle(gameContainer).display
                        });
                    }
                }, 100);
            }
            // Setup daily game
            else if (mode === 'daily') {
                try {
                    this.setupDailyGame(options);
                } catch (error) {
                    console.error('Error setting up daily game:', error);
                    this.showErrorMessage('Error starting daily game.');
                }
                
                // Force visible
                setTimeout(() => {
                    if (gameContainer) {
                        gameContainer.classList.remove('hidden');
                        gameContainer.style.display = 'block';
                    }
                }, 100);
            }
            else {
                console.error(`Unknown game mode: ${mode}`);
                this.showErrorMessage(`Unknown game mode: ${mode}`);
            }
        } catch (error) {
            console.error('Critical error in startGame:', error);
            this.showErrorMessage('Error starting game. Please try again or refresh the page.');
        }
    }
    
    setupSinglePlayerGame(options) {
        console.log("Setting up single player game");
        // Get game content container
        const gameContent = document.getElementById('game-content');
        if (!gameContent) {
            console.error("Game content container #game-content not found");
            this.showErrorMessage("Game content container not found. Please refresh the page.");
            return;
        }
        // Clear content before creating game instance
        gameContent.innerHTML = ''; 

        // Create modal if it doesn't exist (might still be needed globally)
        let modal = document.getElementById('modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal';
            modal.className = 'modal hidden';
            modal.innerHTML = `
                <div class="modal-content">
                    <h2 id="modal-title"></h2>
                    <p id="modal-message"></p>
                    <button id="modal-close">Next Word</button>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Initialize the game with the appropriate difficulty
        this.selectWordDifficulty();
        
        console.log(`Starting game with difficulty: ${this.currentDifficulty}`);
        
        try {
            // Check if WordleGame class is available
            if (typeof WordleGame === 'undefined') {
                console.error("WordleGame class is not defined");
                this.showErrorMessage("Game engine not loaded properly. Please refresh the page.");
                
                // Try to reload the game.js file as a fallback
                this.loadGameScript();
                return;
            }
            
            // Pass gameContent to the constructor
            this.wordleGame = new WordleGame(gameContent); 
            
            if (!this.wordleGame || !this.wordleGame.parentContainer) { // Check if constructor succeeded
                console.error("Failed to create WordleGame instance or instance lacks container.");
                this.showErrorMessage("Failed to initialize game. Please refresh the page.");
                return;
            }
            
            this.wordleGame.difficulty = this.currentDifficulty;
            
            // *** Pass the usedWords set to the game instance ***
            this.wordleGame.setUsedWords(this.usedWords);
            
            // Set the user's stats
            if (this.currentUser && this.currentUser.stats) {
                this.wordleGame.stats = this.currentUser.stats;
            }
            
            // Override the handleWin and handleLoss methods
            this.overrideGameMethods();
            
            // Start the game
            this.wordleGame.startNewGame();
            console.log("Game started successfully");
        } catch (error) {
            console.error("Error starting game:", error);
            this.showErrorMessage(`Error starting game: ${error.message || 'Unknown error'}`);
        }
    }
    
    // Helper method to load the game script if it's missing
    loadGameScript() {
        console.log("Attempting to load game.js script");
        const script = document.createElement('script');
        script.src = 'js/game.js';
        script.onload = () => {
            console.log("game.js loaded successfully");
            // Try setting up the game again after loading
            setTimeout(() => this.setupSinglePlayerGame(), 500);
        };
        script.onerror = (err) => {
            console.error("Failed to load game.js:", err);
            this.showErrorMessage("Failed to load game files. Please refresh the page.");
        };
        document.head.appendChild(script);
    }
    
    setupMultiplayerGame(options) {
        console.log("Setting up multiplayer game with options:", options);
        
        // Get game content container
        const gameContent = document.getElementById('game-content');
        if (!gameContent) {
            console.error("Game content container not found");
            return;
        }
        
        // Clear previous content
        gameContent.innerHTML = ''; 
        
        // Ensure the socket is connected
        if (window.multiplayerSocket) {
            if (!window.multiplayerSocket.connected) {
                window.multiplayerSocket.connect();
            }
            
            // Set the game ID in the socket handler if provided
            if (options.gameId) {
                window.multiplayerSocket.gameId = options.gameId;
                console.log("Setting socket game ID to:", options.gameId);
            }
        } else {
            console.error("Multiplayer socket not initialized");
            this.showErrorMessage("Error: Multiplayer system not initialized");
            return;
        }
        
        // Get word length from difficulty if available
        const wordLength = options.wordLength || 
                          (options.difficulty === 'easy' ? 4 : 
                           options.difficulty === 'hard' ? 6 :
                           options.difficulty === 'expert' ? 7 : 5);
                           
        // Default options if not provided
        const config = {
            wordLength: wordLength,
            maxGuesses: 6,
            opponent: options.opponent || 'Opponent',
            gameId: options.gameId
        };
        
        // Create multiplayer game UI
        if (!window.multiplayerGameUI) {
            window.multiplayerGameUI = new MultiplayerGameUI();
        }
        
        // Initialize the UI with this config and container
        window.multiplayerGameUI.initialize(config, gameContent);
    }
    
    selectWordDifficulty() {
        // This is where the interesting difficulty progression happens
        // Instead of a linear progression, we'll use a more dynamic approach
        
        // Calculate the base difficulty based on level
        let baseDifficulty;
        if (this.currentLevel <= 5) {
            baseDifficulty = 'easy';
        } else if (this.currentLevel <= 15) {
            baseDifficulty = 'medium';
        } else if (this.currentLevel <= 30) {
            baseDifficulty = 'hard';
        } else {
            baseDifficulty = 'expert';
        }
        
        // Add some variety - occasionally throw in a harder word
        const rand = Math.random();
        
        // Special challenge words at milestone levels
        if (this.currentLevel % 10 === 0) {
            // Every 10th level is a challenge level with a harder word
            this.currentDifficulty = this.getNextDifficulty(baseDifficulty);
            return;
        }
        
        // Progression pattern:
        // - Mostly base difficulty
        // - Sometimes one level higher
        // - Rarely two levels higher (if possible)
        if (rand < 0.7) {
            // 70% chance of base difficulty
            this.currentDifficulty = baseDifficulty;
        } else if (rand < 0.95) {
            // 25% chance of one level higher
            this.currentDifficulty = this.getNextDifficulty(baseDifficulty);
        } else {
            // 5% chance of two levels higher
            const nextDifficulty = this.getNextDifficulty(baseDifficulty);
            this.currentDifficulty = this.getNextDifficulty(nextDifficulty) || nextDifficulty;
        }
    }
    
    getNextDifficulty(difficulty) {
        const difficulties = ['easy', 'medium', 'hard', 'expert'];
        const currentIndex = difficulties.indexOf(difficulty);
        
        // If already at max difficulty or not found, stay at current level
        if (currentIndex === -1 || currentIndex === difficulties.length - 1) {
            return difficulty;
        }
        
        return difficulties[currentIndex + 1];
    }
    
    overrideGameMethods() {
        if (!this.wordleGame) {
            console.error("WordleGame instance not created");
            return;
        }
        
        // Store original methods
        const originalHandleWin = this.wordleGame.handleWin;
        const originalHandleLoss = this.wordleGame.handleLoss;
        
        // Override handleWin
        this.wordleGame.handleWin = () => {
            // Call original method first
            originalHandleWin.call(this.wordleGame);
            
            // --- Progress Update Logic --- 
            this.levelProgress++;
            const pointsEarned = this.calculatePoints(this.currentDifficulty);
            this.totalPoints += pointsEarned;
            console.log(`Earned ${pointsEarned} points. Total: ${this.totalPoints}`);
            
            // *** Update GameManager stats ***
            this.stats.gamesPlayed++;
            this.stats.gamesWon++;
            this.stats.currentStreak++;
            this.stats.maxStreak = Math.max(this.stats.maxStreak, this.stats.currentStreak);
            console.log("[GameManager handleWin] Updated stats:", JSON.stringify(this.stats));

            let leveledUp = false;
            if (this.levelProgress >= this.wordsPerLevel) {
                this.currentLevel++;
                this.levelProgress = 0;
                this.totalPoints += 50; // Example bonus
                console.log(`Level Up! Now level ${this.currentLevel}. Bonus points awarded.`);
                leveledUp = true;
            }
            
            // Update highestLevel in stats
            this.stats.highestLevel = Math.max(this.stats.highestLevel || 1, this.currentLevel);
            
            // *** SAVE PROGRESS TO LOCALSTORAGE & SERVER ***
            // This now sends the updated this.stats object
            this.saveProgress(); 
            
            // Update UI display
            this.updateLevelDisplay();
            
            // Change modal button text
            const modalClose = document.getElementById('modal-close');
            if (modalClose) {
                modalClose.textContent = leveledUp ? 'Next Level!' : 'Next Word';
                
                // Add event listener for next word
                modalClose.addEventListener('click', () => {
                    const modal = document.getElementById('modal');
                    if (modal) {
                        modal.classList.add('hidden');
                    }
                    this.startNextWord();
                }, { once: true });
            }
        };
        
        // Override handleLoss
        this.wordleGame.handleLoss = () => {
             // Call original method first
            originalHandleLoss.call(this.wordleGame);
            
            // *** Update GameManager stats ***
            this.stats.gamesPlayed++;
            this.stats.currentStreak = 0; // Reset streak
            console.log("[GameManager handleLoss] Updated stats:", JSON.stringify(this.stats));

            // *** SAVE PROGRESS TO LOCALSTORAGE & SERVER ***
            // We save even on loss to update gamesPlayed and reset streak server-side
            this.saveProgress(); 

            // Update UI display
            this.updateLevelDisplay();
            
            // Change modal button text
            const modalClose = document.getElementById('modal-close');
            if (modalClose) {
                modalClose.textContent = 'Try Again';
                
                // Add event listener for next word
                modalClose.addEventListener('click', () => {
                    const modal = document.getElementById('modal');
                    if (modal) {
                        modal.classList.add('hidden');
                    }
                    this.startNextWord();
                }, { once: true });
            }
        };
    }
    
    startNextWord() {
        // Select new difficulty
        this.selectWordDifficulty();
        
        // Start a new game
        if (this.wordleGame) {
            this.wordleGame.difficulty = this.currentDifficulty;
            this.wordleGame.startNewGame();
        } else {
            console.error("WordleGame instance not created");
            this.setupSinglePlayerGame(); // Try to recreate the game
        }
    }
    
    updateLevelDisplay() {
        const levelElement = document.getElementById('current-level');
        if (levelElement) {
            levelElement.textContent = this.currentLevel;
        }
        
        // Update progress bar
        const progressElement = document.getElementById('level-progress');
        if (progressElement) {
            const progressPercent = (this.levelProgress / this.wordsPerLevel) * 100;
            progressElement.style.width = `${progressPercent}%`;
        }
        
        // *** Update points display ***
        const pointsDisplay = document.getElementById('current-points');
        if (pointsDisplay) {
            console.log(`[updateLevelDisplay] Updating points UI. Current this.totalPoints = ${this.totalPoints}`);
            pointsDisplay.textContent = this.totalPoints;
        }
    }
    
    exitGame() {
        console.log("--- GameManager: exitGame() called ---");
        // Hide the game container
        if (this.gameContainer) {
            console.log("Hiding #game-container. Current classes:", this.gameContainer.className);
            this.gameContainer.classList.add('hidden');
            this.gameContainer.style.display = 'none'; // Ensure display is none
            console.log("New #game-container classes:", this.gameContainer.className);
        } else {
             console.error("#game-container not found in exitGame!");
        }
        
        // Clean up the current game instance (if any)
        console.log("Cleaning up active game instances...");
        this.cleanup(); // Call the existing cleanup method
        
        // Show the home screen using the latest data from AuthSystem
        if (window.homeScreen && typeof window.homeScreen.show === 'function') {
             if (window.authSystem && window.authSystem.isAuthenticated) {
                console.log("Calling window.homeScreen.show() for authenticated user.");
                window.homeScreen.show(); // Show home screen with current user data
             } else {
                 // If not authenticated, authSystem should handle showing the login screen
                 console.log("User not authenticated, relying on authSystem/homeScreen to show login.");
                  // We still call show(), and it should internally delegate to authSystem if needed
                 window.homeScreen.show(); 
             }
        } else {
            console.error("Home screen object or show method not found! Cannot return home.");
            // Last resort fallback: try to show auth container if home isn't available
            const authContainer = document.getElementById('auth-container');
            if (authContainer) {
                console.error("Falling back to showing auth container directly.");
                authContainer.classList.remove('hidden');
                authContainer.style.display = 'flex'; // Assuming flex is the default display
            }
        }
        
        console.log("--- GameManager: exitGame() finished ---");
    }
    
    showErrorMessage(message) {
        console.error(message);
        
        // Create error message container
        const errorContainer = document.createElement('div');
        errorContainer.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            padding: 20px;
            background-color: #f44336;
            color: white;
            border-radius: 5px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            text-align: center;
            max-width: 80%;
        `;
        
        errorContainer.innerHTML = `
            <div>${message}</div>
            <button style="margin-top: 15px; padding: 8px 15px; background-color: white; color: #f44336; border: none; border-radius: 4px; cursor: pointer;">Dismiss</button>
        `;
        
        // Add button event listener
        const dismissButton = errorContainer.querySelector('button');
        dismissButton.addEventListener('click', () => {
            errorContainer.remove();
        });
        
        document.body.appendChild(errorContainer);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorContainer.parentNode) {
                errorContainer.remove();
            }
        }, 10000);
    }
    
    // Debug utility to log and display debug info
    debugLog(message, data = null) {
        // Only log to console
        console.log(`[GameManager Debug] ${message}`, data || '');
        
        // COMMENTED OUT - UI part
        /*
        // Create debug log container if it doesn't exist
        let debugContainer = document.getElementById('game-debug-log');
        if (!debugContainer) {
            debugContainer = document.createElement('div');
            debugContainer.id = 'game-debug-log';
            debugContainer.style.cssText = `
                position: fixed;
                bottom: 10px;
                left: 10px;
                padding: 10px;
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                max-width: 80%;
                max-height: 200px;
                overflow-y: auto;
                z-index: 1000;
            `;
            
            document.body.appendChild(debugContainer);
        }
        
        // Add log entry
        const logEntry = document.createElement('div');
        logEntry.innerHTML = `${new Date().toISOString().substr(11, 8)} - ${message}`;
        
        // If data is provided, add it as pre
        if (data) {
            const dataPre = document.createElement('pre');
            dataPre.style.cssText = `
                margin: 5px 0;
                padding: 5px;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                overflow-x: auto;
                font-size: 10px;
            `;
            dataPre.textContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
            logEntry.appendChild(dataPre);
        }
        
        debugContainer.appendChild(logEntry);
        debugContainer.scrollTop = debugContainer.scrollHeight;
        
        // Keep only the last 20 log entries
        while (debugContainer.children.length > 20) {
            debugContainer.removeChild(debugContainer.firstChild);
        }
        */
    }
    
    // Add cleanup method to properly clean up any existing game
    cleanup() {
        console.log('Cleaning up existing game instance');
        
        // Clean up any existing game instance
        if (this.wordleGame) {
            // If the wordle game has its own cleanup method, call it
            if (typeof this.wordleGame.cleanup === 'function') {
                this.wordleGame.cleanup();
            }
            
            this.wordleGame = null;
        }
        
        // Reset any game-related UI elements
        if (this.gameContent) {
            this.gameContent.innerHTML = '';
        }
        
        // Clean up any multiplayer resources
        if (window.multiplayerGameUI) {
            if (typeof window.multiplayerGameUI.cleanup === 'function') {
                try {
                    window.multiplayerGameUI.cleanup();
                } catch (error) {
                    console.error('Error cleaning up multiplayer game UI:', error);
                }
            }
        }
        
        console.log('Game cleanup completed');
    }
    
    // Show the game container and ensure it's visible
    showGameContainer() {
        console.log('GameManager: Showing game container');
        
        // Find game container
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) {
            console.error('Game container not found in showGameContainer');
            return;
        }
        
        // Show game container
        gameContainer.classList.remove('hidden');
        gameContainer.style.display = 'block';
        
        // Hide other containers
        const containersToHide = ['auth-container', 'home-container', 'loading-message'];
        containersToHide.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.classList.add('hidden');
                container.style.display = 'none';
            }
        });
        
        // Set up back button if needed
        this.setupBackButton();
        
        console.log('Game container shown successfully');
    }
    
    // Set up the back button to return to home screen
    setupBackButton() {
        const backButton = document.getElementById('back-to-home');
        if (backButton) {
            // Remove any existing event listeners
            const newButton = backButton.cloneNode(true);
            backButton.parentNode.replaceChild(newButton, backButton);
            
            // Add new event listener
            newButton.addEventListener('click', () => {
                console.log('Back button clicked');
                this.exitGame();
            });
        } else {
            console.warn('Back button not found in setupBackButton');
        }
    }
    
    // Create minimal multiplayer game when normal setup fails
    createMinimalMultiplayerGame(options, container) {
        console.log('Creating minimal multiplayer game as fallback');
        
        // Create a basic game layout
        const gameLayout = document.createElement('div');
        gameLayout.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h2>Multiplayer Game</h2>
                <p>Playing against: ${options.opponent || 'Opponent'}</p>
                <p>Game ID: ${options.gameId || 'Unknown'}</p>
                <p>Difficulty: ${options.difficulty || 'medium'}</p>
                
                <div style="margin: 30px auto; width: fit-content; display: grid; grid-template-columns: repeat(${options.wordLength || 5}, 60px); gap: 5px;">
                    ${Array(6).fill().map(() => 
                        Array(options.wordLength || 5).fill().map(() => 
                            `<div style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; background: white; border: 2px solid #ccc; font-size: 24px; font-weight: bold;"></div>`
                        ).join('')
                    ).join('')}
                </div>
                
                <button id="back-to-home" style="padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Back to Home
                </button>
            </div>
        `;
        
        // Clear container and add our layout
        container.innerHTML = '';
        container.appendChild(gameLayout);
        
        // Add back button handler
        const backButton = document.getElementById('back-to-home');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.exitGame();
            });
        }
    }

    // Add a debug log area to the game container (optional)
    addDebugLog() {
        // COMMENTED OUT
        /*
        if (!this.gameContentContainer) return;

        let debugContainer = document.getElementById('game-debug-log');
        if (!debugContainer) {
            debugContainer = document.createElement('div');
            debugContainer.id = 'game-debug-log';
            debugContainer.style.cssText = '
                margin-top: 20px;
                padding: 10px;
                background-color: #f0f0f0;
                border: 1px solid #ccc;
                height: 100px;
                overflow-y: scroll;
                font-family: monospace;
                font-size: 12px;
            ';
            this.gameContentContainer.appendChild(debugContainer);
        }

        // Overwrite log method to write to debug area
        this.log = (message, level = 'info') => {
            console[level] || console.log(`[${level.toUpperCase()}] ${message}`);
            if (debugContainer) {
                const entry = document.createElement('div');
                entry.textContent = `[${new Date().toLocaleTimeString()}] [${level.toUpperCase()}] ${message}`;
                debugContainer.appendChild(entry);
                debugContainer.scrollTop = debugContainer.scrollHeight;
            }
        }
        */
    }

    // *** NEW METHOD: Load Progress ***
    loadProgress() {
        console.log("Loading player progress...");
        let progressLoaded = false;

        // Try loading from logged-in user data first
        if (window.authSystem && window.authSystem.isAuthenticated && window.authSystem.currentUser && window.authSystem.currentUser.stats) {
            const stats = window.authSystem.currentUser.stats;
            console.log("Loading progress from AuthSystem stats:", JSON.stringify(stats));
            // Check if the server provided the progress stats
            // Use nullish coalescing for safety
            this.currentLevel = stats.currentLevel ?? 1;
            this.levelProgress = stats.currentLevelProgress ?? 0;
            this.totalPoints = stats.totalPoints ?? 0;
            
            // *** Load other stats into GameManager.stats ***
            this.stats.gamesPlayed = stats.gamesPlayed ?? 0;
            this.stats.gamesWon = stats.gamesWon ?? 0;
            this.stats.currentStreak = stats.currentStreak ?? 0;
            this.stats.maxStreak = stats.maxStreak ?? 0;
            this.stats.highestLevel = stats.highestLevel ?? 1; // Load highest level too

            console.log(`Loaded progress from AuthSystem: Level ${this.currentLevel}, Progress ${this.levelProgress}, Points ${this.totalPoints}`);
            console.log(`Loaded stats from AuthSystem: Played=${this.stats.gamesPlayed}, Won=${this.stats.gamesWon}, Streak=${this.stats.currentStreak}, MaxStreak=${this.stats.maxStreak}, HighestLevel=${this.stats.highestLevel}`);
            progressLoaded = true;
        } else {
             console.warn("AuthSystem user stats missing or user not authenticated.");
        }

        // If not loaded from auth, try localStorage (useful for guests or as fallback)
        if (!progressLoaded) {
            console.log("Loading progress from localStorage as fallback or user not logged in.");
            const savedProgress = localStorage.getItem('wordleGameProgress');
            if (savedProgress) {
                try {
                    const progress = JSON.parse(savedProgress);
                    this.currentLevel = progress.currentLevel ?? 1;
                    this.levelProgress = progress.currentLevelProgress ?? 0;
                    this.totalPoints = progress.totalPoints ?? 0;
                    
                    // *** Load stats from localStorage if available ***
                    this.stats.gamesPlayed = progress.gamesPlayed ?? 0;
                    this.stats.gamesWon = progress.gamesWon ?? 0;
                    this.stats.currentStreak = progress.currentStreak ?? 0;
                    this.stats.maxStreak = progress.maxStreak ?? 0;
                     this.stats.highestLevel = progress.highestLevel ?? 1;

                    console.log(`Loaded progress from localStorage: Level ${this.currentLevel}, Progress ${this.levelProgress}, Points ${this.totalPoints}`);
                    console.log(`Loaded stats from localStorage: Played=${this.stats.gamesPlayed}, Won=${this.stats.gamesWon}, Streak=${this.stats.currentStreak}, MaxStreak=${this.stats.maxStreak}, HighestLevel=${this.stats.highestLevel}`);
                    progressLoaded = true;
                } catch (error) {
                    console.error("Error parsing saved progress from localStorage:", error);
                    localStorage.removeItem('wordleGameProgress'); // Remove corrupted data
                }
            }
        }
        
        if (!progressLoaded) {
             console.log("No saved progress found (Auth or localStorage). Using defaults.");
             // Defaults are already set in constructor
             this.stats = { gamesPlayed: 0, gamesWon: 0, currentStreak: 0, maxStreak: 0, highestLevel: 1 }; // Ensure stats are reset to default too
        }
        
        // Update UI after loading/setting defaults
        this.updateLevelDisplay();
    }

    // *** NEW METHOD: Save Progress ***
    async saveProgress() {
        // Construct the progress object using GameManager's internal state
        const progress = {
            currentLevel: this.currentLevel,
            currentLevelProgress: this.levelProgress,
            totalPoints: this.totalPoints,
            // *** Include the UPDATED stats from GameManager.stats ***
             gamesPlayed: this.stats.gamesPlayed,
             gamesWon: this.stats.gamesWon,
             currentStreak: this.stats.currentStreak,
             maxStreak: this.stats.maxStreak,
             highestLevel: this.stats.highestLevel // Send updated highest level
        };
        
        console.log("[GameManager saveProgress] Saving progress object:", JSON.stringify(progress));

        // Always save to localStorage as a backup
        try {
            localStorage.setItem('wordleGameProgress', JSON.stringify(progress));
            console.log("Saved progress to localStorage:", progress);
        } catch (error) {
            console.error("Error saving progress to localStorage:", error);
        }
        
        // If authenticated, also save to server
        if (window.authSystem && window.authSystem.isAuthenticated && typeof window.authSystem.saveUserProgress === 'function') {
             console.log("User authenticated, attempting to save progress to server...");
             try {
                 const result = await window.authSystem.saveUserProgress(progress); // Wait for the result
                 if (result && result.success) {
                     console.log("GameManager: Server save successful. Stats returned:", result.stats);
                    
                     // IMPORTANT: Update AuthSystem's currentUser with the definitive stats from the server
                     // AuthSystem.saveUserProgress already handles this internally now
                     // window.authSystem.updateCurrentUser({ username: window.authSystem.currentUser.username, stats: result.stats });

                     // Now refresh the HomeScreen UI to reflect the updated stats
                     if (window.homeScreen && typeof window.homeScreen.show === 'function') {
                         console.log("GameManager: Triggering HomeScreen update.");
                         window.homeScreen.show(); 
                     }

                 } else {
                     console.warn("GameManager: Server save failed:", result.error, ". Progress still saved locally.");
                 }
             } catch (error) {
                 // This catch block is for network errors or unexpected issues in saveUserProgress itself
                 console.error("GameManager: Error calling saveUserProgress:", error);
             }
        } else {
             console.log("User not authenticated or saveUserProgress function not found, skipping server save.");
        }
    }

    // Helper to calculate points based on difficulty (example)
    calculatePoints(difficulty) {
        switch (difficulty) {
            case 'easy': return 10;
            case 'medium': return 20;
            case 'hard': return 35;
            case 'expert': return 50;
            default: return 15;
        }
    }
}

// Initialize game manager
window.gameManager = null;
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing game manager");
    window.gameManager = new GameManager();
}); 