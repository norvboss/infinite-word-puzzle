// Multiplayer Game UI - Simplified Version
class MultiplayerGameUI {
    constructor() {
        // Game state
        this.wordLength = 5;
        this.maxGuesses = 6;
        this.opponent = 'Opponent';
        this.guesses = [];
        this.currentGuess = '';
        this.isGameOver = false;
        this.gameId = null; // Add game ID property
        
        // Opponent tracking
        this.opponentFinished = false;
        this.opponentGuesses = [];
        this.opponentWon = false;
        this.waitingForOpponent = false;
        this.playerFinished = false;
        
        // UI elements
        this.container = null;
        this.board = null;
        this.keyboard = null;
        this.tiles = [];
        
        // Submission lock
        this.submittingGuess = false;
        this.lastSubmittedGuesses = {};
        this.currentSubmissionId = null;
    }
    
    initialize(config, gameContentContainer) {
        console.log('Initializing multiplayer game UI inside container:', gameContentContainer);
        
        // Clean up any existing UI *within the container*
        // This cleanup needs refinement - assuming GameManager clears the container first.
        // this.cleanup(); 
        
        // Default word length based on difficulty if not explicitly provided
        let wordLength = config.wordLength;
        if (!wordLength && config.difficulty) {
            switch(config.difficulty) {
                case 'easy':
                    wordLength = 4;
                    break;
                case 'medium':
                    wordLength = 5;
                    break;
                case 'hard':
                    wordLength = 6;
                    break;
                case 'expert':
                    wordLength = 7;
                    break;
                default:
                    wordLength = 5; // Default to medium difficulty
            }
            console.log(`Setting word length to ${wordLength} based on difficulty: ${config.difficulty}`);
        }
        
        // Set game parameters
        this.wordLength = wordLength || 5;
        this.opponent = config.opponent || 'Opponent';
        this.guesses = [];
        this.currentGuess = '';
        this.isGameOver = false;
        this.gameId = config.gameId || null; // Store the game ID
        
        // Store difficulty on the instance
        this.difficulty = config.difficulty || 'medium';
        
        // Ensure dictionary is loaded
        this.ensureDictionaryLoaded();
        
        // Log important debug info
        this.logDebugInfo(config);
        
        // Create UI content and append it
        const uiContent = this.createUI(); 
        if (gameContentContainer) {
            gameContentContainer.appendChild(uiContent);
        } else {
            console.error("MultiplayerUI: gameContentContainer not provided during initialization!");
            document.body.appendChild(uiContent); // Fallback, but likely wrong
        }
        
        // Set up event listeners (ensure they are specific to this instance)
        this.setupEvents();
        
        // Set up socket event handlers if available and ensure it has the game ID
        this.setupSocketHandlers();
        if (window.multiplayerSocket && this.gameId) {
            window.multiplayerSocket.gameId = this.gameId;
            window.multiplayerSocket.difficulty = config.difficulty;
            window.multiplayerSocket.wordLength = this.wordLength;
        }
        
        // Initial render
        this.render();
    }
    
    cleanup() {
        // Remove event listeners and reset state
        this.log('Cleaning up multiplayer game resources');
        
        // Remove the keyboard event listener
        if (this._handleKeyDown) {
            document.removeEventListener('keydown', this._handleKeyDown);
            this.log('Removed keyboard event listener');
        }
        
        // Reset game state
        this.isGameOver = false;
        this.disableInput = false;
        this.currentGuess = '';
        this.guesses = [];
        this.tiles = [];
        
        // Remove any overlays
        const gameOverlay = document.getElementById('mp-game-over-overlay');
        if (gameOverlay) gameOverlay.remove();
        
        const waitingOverlay = document.getElementById('mp-waiting-overlay');
        if (waitingOverlay) waitingOverlay.remove();
        
        // Reset game container if available
        const gameContainer = document.getElementById('game-content');
        if (gameContainer) {
            gameContainer.innerHTML = '';
        }
        
        // Reset socket game ID
        if (window.multiplayerSocket) {
            window.multiplayerSocket.gameId = null;
        }
        
        this.log('Multiplayer game cleanup complete');
    }
    
    createUI() {
        // Main container
        this.container = document.createElement('div');
        this.container.id = 'mp-game-content'; // Changed ID to reflect it's just content now
        // Remove fixed positioning and full screen styles
        this.container.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:20px;width:100%;';
        
        // REMOVE back button creation - it's handled by GameManager now
        /*
        const backButton = document.createElement('button');
        backButton.textContent = 'Back to Home';
        backButton.style.cssText = 'padding:10px 20px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;margin-bottom:20px;';
        backButton.onclick = () => {
            window.location.href = '/'; // Use absolute path to root
        };
        this.container.appendChild(backButton);
        */
        
        // Header - Let's remove this too, GameManager provides the header
        /*
        const header = document.createElement('div');
        header.style.cssText = 'width:100%;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;';
        
        const title = document.createElement('h2');
        title.textContent = `Playing against ${this.opponent}`;
        title.style.margin = '0';
        
        const exitBtn = document.createElement('button');
        exitBtn.textContent = 'Exit Game';
        exitBtn.style.cssText = 'padding:8px 15px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;';
        exitBtn.onclick = () => {
            if (confirm('Are you sure you want to exit?')) {
                this.cleanup();
                window.location.reload(); // This was also problematic
            }
        };
        
        header.appendChild(title);
        header.appendChild(exitBtn);
        this.container.appendChild(header);
        */

        // Game board
        this.board = document.createElement('div');
        this.board.style.cssText = 'display:flex;flex-direction:column;gap:5px;margin-bottom:30px;';
        
        // Create tiles
        this.tiles = [];
        for (let row = 0; row < this.maxGuesses; row++) {
            const rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'display:flex;gap:5px;';
            
            const rowTiles = [];
            for (let col = 0; col < this.wordLength; col++) {
                const tile = document.createElement('div');
                tile.style.cssText = 'width:60px;height:60px;border:2px solid #ccc;display:flex;align-items:center;justify-content:center;font-size:2em;font-weight:bold;text-transform:uppercase;';
                rowDiv.appendChild(tile);
                rowTiles.push(tile);
            }
            
            this.board.appendChild(rowDiv);
            this.tiles.push(rowTiles);
        }
        
        this.container.appendChild(this.board);
        
        // Keyboard
        this.keyboard = document.createElement('div');
        this.keyboard.style.cssText = 'display:flex;flex-direction:column;gap:8px;width:100%;max-width:500px;margin-top:20px;';
        
        const keyRows = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace']
        ];
        
        keyRows.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'display:flex;justify-content:center;gap:6px;';
            
            row.forEach(key => {
                const button = document.createElement('button');
                button.textContent = key === 'Backspace' ? '⌫' : key;
                button.dataset.key = key;
                button.style.cssText = 'min-width:40px;height:58px;padding:0 10px;font-size:1.1em;font-weight:bold;background:#d3d6da;border:none;border-radius:4px;cursor:pointer;text-transform:uppercase;';
                
                if (key === 'Enter' || key === 'Backspace') {
                    button.style.width = '65px';
                }
                
                button.onclick = () => this.handleKeyPress(key);
                
                rowDiv.appendChild(button);
            });
            
            this.keyboard.appendChild(rowDiv);
        });
        
        this.container.appendChild(this.keyboard);
        
        // Debug area - COMMENTED OUT
        /*
        const debugArea = document.createElement('div');
        debugArea.id = 'mp-debug';
        debugArea.style.cssText = 'margin-top:20px;padding:10px;background:#f5f5f5;width:100%;max-width:500px;height:100px;overflow-y:auto;font-family:monospace;font-size:12px;';
        debugArea.innerHTML = '<strong>Multiplayer Debug Log:</strong><br>';
        this.container.appendChild(debugArea);
        */
        
        // DO NOT add to document.body directly. GameManager will handle placement.
        // document.body.appendChild(this.container);
        
        // Helper function for logging - COMMENTED OUT
        /*
        this.log = (message) => {
            const debug = document.getElementById('mp-debug');
            if (debug) {
                debug.innerHTML += message + '<br>';
                debug.scrollTop = debug.scrollHeight;
            }
            console.log('[MP]', message);
        };
        */
        
        // Replacement log function (console only)
        this.log = (message) => {
             console.log('[MP]', message);
        };
        
        this.log('Multiplayer UI content created');
        return this.container; // Return the container element for GameManager to append
    }
    
    setupEvents() {
        // First remove any existing keyboard event listener to prevent duplicates
        if (this._handleKeyDown) {
            document.removeEventListener('keydown', this._handleKeyDown);
            this.log('Removed existing keyboard event listener');
        }
        
        // Global flag to indicate MultiplayerGameUI is active
        window.multiplayerGameUI = this;
        
        // Keyboard event handler
        // Define the handler function directly
        this._handleKeyDown = (e) => {
            // *** ADDED CHECK: Immediately exit if game is over ***
            if (this.isGameOver) {
                this.log(`Key ignored - game is over.`);
                return;
            }
            
            if (this.disableInput || this.submittingGuess) {
                this.log(`Key ignored - input disabled or submitting.`);
                return;
            }
            
            this.log(`MP Key pressed: ${e.key}`); // Added MP prefix for clarity
            
            let handled = false;
            if (e.key === 'Enter') {
                this.submitGuess();
                handled = true;
            } else if (e.key === 'Backspace') {
                this.removeLetter();
                handled = true;
            } else if (/^[a-zA-Z]$/.test(e.key)) {
                this.addLetter(e.key.toUpperCase());
                handled = true;
            }

            // Prevent default only if we handled the key
            // This avoids interfering with other potential listeners (like browser shortcuts)
            if (handled) {
                 e.preventDefault();
                 e.stopPropagation(); // Also stop propagation to prevent other game listeners
            }
        };
        
        // Add event listener using the defined handler
        document.addEventListener('keydown', this._handleKeyDown);
        
        // Tell any other keyboard handlers to disable themselves
        if (window.lastKeyDownHandler) {
            document.removeEventListener('keydown', window.lastKeyDownHandler);
            this.log('Removed multiplayer-fix keyboard handler');
        }
        
        this.log('Multiplayer event listeners set up');
    }
    
    handleKeyPress(key) {
        // *** ADDED CHECK: Immediately exit if game is over ***
        if (this.isGameOver) {
            this.log(`Virtual key press ignored - game is over.`);
            return;
        }
        
        // Skip if input disabled, or already submitting a guess
        if (this.disableInput || this.submittingGuess) {
            this.log(`Key press ignored - Input disabled: ${this.disableInput}, Submitting: ${this.submittingGuess}`);
            return;
        }
        
        this.log(`Virtual key pressed: ${key}`);
        
        if (key === 'Enter') {
            this.submitGuess();
        } else if (key === 'Backspace') {
            this.removeLetter();
        } else {
            this.addLetter(key);
        }
    }
    
    addLetter(letter) {
        if (this.currentGuess.length < this.wordLength) {
            this.currentGuess += letter;
            this.log(`Added letter: ${letter}, current guess: ${this.currentGuess}`);
            this.render();
        }
    }
    
    removeLetter() {
        if (this.currentGuess.length > 0) {
            this.currentGuess = this.currentGuess.slice(0, -1);
            this.log(`Removed letter, current guess: ${this.currentGuess}`);
            this.render();
        }
    }
    
    submitGuess() {
        try {
            // Prevent duplicate submissions
            if (this.submittingGuess) {
                console.log("Already submitting a guess, preventing duplicate");
                return false;
            }
            
            // Check if we're in multiplayer mode - only check for socket
            if (!window.multiplayerSocket) {
                console.error("Socket not initialized");
                this.shakeCurrentRow();
                return false;
            }

            // Make sure the game is active
            if (!window.multiplayerSocket.gameId) {
                console.error("No active game found");
                this.shakeCurrentRow();
                return false;
            }

            // Get the current guess from the UI
            if (this.currentGuess.length !== this.wordLength) {
                console.error(`Guess must be ${this.wordLength} letters, got ${this.currentGuess.length}`);
                this.showMessage(`Word must be ${this.wordLength} letters`);
                this.shakeCurrentRow();
                return false;
            }
            
            // Validate the word is in the dictionary before submitting
            if (typeof window.WORDS_ALPHA !== 'undefined' && window.WORDS_ALPHA.size > 0) {
                const isInDictionary = window.WORDS_ALPHA.has(this.currentGuess.toUpperCase());
                if (!isInDictionary) {
                    console.error(`Word "${this.currentGuess}" not in dictionary`);
                    this.showMessage("Not in word list");
                    this.shakeCurrentRow();
                    return false;
                }
            } else {
                this.log("Dictionary not loaded, skipping client-side validation");
            }
            
            // Check if this guess was just submitted (within last 2 seconds)
            const currentTime = Date.now();
            const guessId = `${this.currentGuess}_${window.multiplayerSocket.gameId}`;
            
            if (this.lastSubmittedGuesses && this.lastSubmittedGuesses[guessId]) {
                const timeSinceLastSubmit = currentTime - this.lastSubmittedGuesses[guessId];
                if (timeSinceLastSubmit < 2000) { // Within 2 seconds
                    console.log(`Preventing duplicate submission of ${this.currentGuess}, last submitted ${timeSinceLastSubmit}ms ago`);
                    return false;
                }
            }
            
            // Track this guess submission
            if (!this.lastSubmittedGuesses) {
                this.lastSubmittedGuesses = {};
            }
            this.lastSubmittedGuesses[guessId] = currentTime;

            console.log(`Submitting guess: ${this.currentGuess} (${this.currentGuess.length} letters) for game with word length ${this.wordLength}`);
            
            // Set submission lock
            this.submittingGuess = true;
            
            // Generate a unique submission ID for this guess attempt
            this.currentSubmissionId = `${this.currentGuess}_${Date.now()}`;
            const submissionId = this.currentSubmissionId;
            
            // Try direct socket method first if makeGuess doesn't exist
            let success = false;
            
            if (typeof window.multiplayerSocket.makeGuess === 'function') {
                // Use the makeGuess method if it exists
                success = window.multiplayerSocket.makeGuess(this.currentGuess);
            } else if (window.multiplayerSocket.socket) {
                // Fallback to direct socket.emit if the socket object is available
                console.log(`Using direct socket.emit for game ${window.multiplayerSocket.gameId}`);
                
                // Only set up response handlers if they don't already exist
                const currentGuess = this.currentGuess;
                
                // Listen for the response with once() to ensure it only fires once
                window.multiplayerSocket.socket.once('guess_result', (data) => {
                    // Only process if this is for the current submission
                    if (this.currentSubmissionId === submissionId) {
                        this.log(`Processing guess result for submission ${submissionId}`);
                        this.handleGuessResult(data);
                    } else {
                        this.log(`Ignoring guess result for old submission ID ${submissionId}, current is ${this.currentSubmissionId}`);
                    }
                    this.submittingGuess = false; // Reset submission lock
                });
                
                window.multiplayerSocket.socket.once('guess_error', (data) => {
                    // Only process if this is for the current submission
                    if (this.currentSubmissionId === submissionId) {
                        this.handleGuessError(data);
                    }
                    this.disableInput = false; // Re-enable input if there was an error
                    this.submittingGuess = false; // Reset submission lock
                });
                
                // Get the difficulty based on word length if not set
                let difficulty = window.multiplayerSocket.difficulty;
                if (!difficulty) {
                    switch(this.wordLength) {
                        case 4: difficulty = 'easy'; break;
                        case 5: difficulty = 'medium'; break;
                        case 6: difficulty = 'hard'; break;
                        case 7: difficulty = 'expert'; break;
                        default: difficulty = 'medium'; // fallback
                    }
                }
                
                // Send the guess to the server with the submission ID
                window.multiplayerSocket.socket.emit('submit_guess', {
                    gameId: window.multiplayerSocket.gameId,
                    guess: currentGuess,
                    submissionId: submissionId, // Add submission ID to help server deduplicate
                    wordLength: this.wordLength, // Send the expected word length to the server
                    difficulty: difficulty // Send the difficulty to ensure proper word length validation
                });
                
                success = true; // Assume emission was successful
                
                // Safety timeout to clear lock after 5 seconds in case response never comes
                setTimeout(() => {
                    if (this.currentSubmissionId === submissionId && this.submittingGuess) {
                        this.log(`Clearing submission lock after timeout for ${submissionId}`);
                        this.submittingGuess = false;
                    }
                }, 5000);
            }
            
            if (success) {
                // Disable input until we get a response
                this.disableInput = true;
                return true;
            } else {
                console.error("Failed to submit guess");
                this.showMessage("Failed to submit guess. Try again.");
                this.shakeCurrentRow();
                this.submittingGuess = false; // Reset submission lock
                return false;
            }
        } catch (error) {
            console.error("Error submitting guess:", error);
            this.showMessage("Error submitting guess. Try again.");
            this.shakeCurrentRow();
            this.submittingGuess = false; // Reset submission lock
            return false;
        }
    }
    
    render() {
        // Clear all tiles
        for (let row = 0; row < this.tiles.length; row++) {
            for (let col = 0; col < this.tiles[row].length; col++) {
                const tile = this.tiles[row][col];
                tile.textContent = '';
                tile.style.background = '';
                tile.style.borderColor = '#ccc';
                tile.style.color = 'black';
            }
        }
        
        // Render completed guesses
        for (let i = 0; i < this.guesses.length; i++) {
            const guess = this.guesses[i];
            
            for (let j = 0; j < guess.word.length; j++) {
                const tile = this.tiles[i][j];
                tile.textContent = guess.word[j];
                
                // Set color based on result
                switch (guess.result[j]) {
                    case 'correct':
                        tile.style.background = '#6aaa64';
                        tile.style.borderColor = '#6aaa64';
                        tile.style.color = 'white';
                        break;
                    case 'misplaced':
                        tile.style.background = '#c9b458';
                        tile.style.borderColor = '#c9b458';
                        tile.style.color = 'white';
                        break;
                    case 'wrong':
                        tile.style.background = '#787c7e';
                        tile.style.borderColor = '#787c7e';
                        tile.style.color = 'white';
                        break;
                }
            }
        }
        
        // Render current guess
        if (this.guesses.length < this.maxGuesses) {
            const row = this.guesses.length;
            
            for (let i = 0; i < this.currentGuess.length; i++) {
                const tile = this.tiles[row][i];
                tile.textContent = this.currentGuess[i];
                tile.style.borderColor = '#666';
            }
        }
    }
    
    showMessage(text) {
        // Remove existing message
        const existing = document.getElementById('mp-message');
        if (existing) existing.remove();
        
        // Create message
        const message = document.createElement('div');
        message.id = 'mp-message';
        message.textContent = text;
        message.style.cssText = 'position:fixed;top:10%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:white;padding:10px 20px;border-radius:4px;z-index:1001;';
        
        document.body.appendChild(message);
        
        // Remove after delay
        setTimeout(() => {
            if (message.parentNode) message.remove();
        }, 2000);
    }
    
    showGameOver(results) {
        // Remove any existing overlays
        const existingOverlay = document.getElementById('mp-game-over-overlay');
        if (existingOverlay) existingOverlay.remove();
        
        const waitingOverlay = document.getElementById('mp-waiting-overlay');
        if (waitingOverlay) waitingOverlay.remove();
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'mp-game-over-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:2001;display:flex;align-items:center;justify-content:center;';
        
        // Create dialog
        const dialog = document.createElement('div');
        dialog.style.cssText = 'background:white;padding:30px;border-radius:8px;text-align:center;max-width:400px;width:90%;';
        
        // Title
        const title = document.createElement('h2');
        title.textContent = 'Game Over!';
        title.style.marginTop = '0';
        dialog.appendChild(title);
        
        // Get player info
        const currentUser = window.userManager?.getCurrentUsername() || 'You';
        const isPlayer1 = results.player1.username === currentUser;
        const yourResults = isPlayer1 ? results.player1 : results.player2;
        const opponentResults = isPlayer1 ? results.player2 : results.player1;
        
        // Show your results
        const resultDiv = document.createElement('div');
        resultDiv.innerHTML = `
            <h3 style="color:${yourResults.won ? '#4CAF50' : '#F44336'}">${yourResults.won ? '🎉 You Won!' : '❌ You Lost!'}</h3>
            <p>Your guesses: ${yourResults.tries}</p>
            <p>The word was: <strong>${results.word}</strong></p>
            <hr style="margin: 20px 0;">
            <h3>Opponent Results</h3>
            <p>${opponentResults.username}: ${opponentResults.won ? 'Won' : 'Lost'}</p>
            <p>Guesses: ${opponentResults.tries || 'Unknown'}</p>
        `;
        dialog.appendChild(resultDiv);
        
        // Buttons
        const buttonDiv = document.createElement('div');
        buttonDiv.style.marginTop = '20px';
        
        const playAgainBtn = document.createElement('button');
        playAgainBtn.textContent = 'Play Again';
        playAgainBtn.style.cssText = 'padding:10px 20px;background:#4caf50;color:white;border:none;border-radius:4px;cursor:pointer;margin-right:10px;';
        playAgainBtn.onclick = () => {
            overlay.remove();
            this.cleanup();
            
            // Go back to home screen
            if (window.gameManager) {
                window.gameManager.showHome();
            } else {
                window.location.reload();
            }
        };
        
        const homeBtn = document.createElement('button');
        homeBtn.textContent = 'Back to Home';
        homeBtn.style.cssText = 'padding:10px 20px;background:#2196F3;color:white;border:none;border-radius:4px;cursor:pointer;';
        homeBtn.onclick = () => {
            overlay.remove();
            this.cleanup();
            
            // Go back to home screen
            if (window.gameManager) {
                window.gameManager.showHome();
            } else {
                window.location.reload();
            }
        };
        
        buttonDiv.appendChild(playAgainBtn);
        buttonDiv.appendChild(homeBtn);
        dialog.appendChild(buttonDiv);
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Add game over sound if available
        try {
            const gameOverSound = new Audio('/sounds/game-over.mp3');
            gameOverSound.volume = 0.5;
            gameOverSound.play().catch(e => console.log('Error playing sound:', e));
        } catch (e) {
            console.log('Error playing sound:', e);
        }
    }

    updateKeyboardColors(word, result) {
        if (!this.keyboard) return;
        
        for (let i = 0; i < word.length; i++) {
            const letter = word[i];
            const status = result[i];
            const key = this.keyboard.querySelector(`button[data-key="${letter}"]`);
            
            if (key) {
                // Update only if the new status is better than current
                if (status === 'correct') {
                    key.className = 'correct';
                    key.style.background = '#6aaa64';
                    key.style.color = 'white';
                } else if (status === 'misplaced' && !key.classList.contains('correct')) {
                    key.className = 'misplaced';
                    key.style.background = '#c9b458';
                    key.style.color = 'white';
                } else if (!key.classList.contains('correct') && !key.classList.contains('misplaced')) {
                    key.className = 'wrong';
                    key.style.background = '#787c7e';
                    key.style.color = 'white';
                }
            }
        }
    }

    // Set up socket handlers for the game
    setupSocketHandlers() {
        if (!window.multiplayerSocket) {
            this.log('No socket handler available, skipping socket event setup');
            return;
        }
        
        this.log('Setting up socket event handlers');
        
        // Make sure socket is connected and has game ID
        if (window.multiplayerSocket.socket && !window.multiplayerSocket.socket.connected) {
            this.log('Socket not connected, attempting to connect...');
            if (typeof window.multiplayerSocket.connect === 'function') {
                window.multiplayerSocket.connect();
            }
        }
        
        // Make sure gameId is set on the socket handler
        if (window.multiplayerSocket && this.gameId) {
            window.multiplayerSocket.gameId = this.gameId;
            this.log(`Ensuring socket game ID is set to ${this.gameId}`);
            
            // Also store the difficulty and word length for game syncing
            if (this.wordLength) {
                window.multiplayerSocket.wordLength = this.wordLength;
                
                // Derive difficulty from word length if needed
                if (!window.multiplayerSocket.difficulty) {
                    switch(this.wordLength) {
                        case 4: window.multiplayerSocket.difficulty = 'easy'; break;
                        case 5: window.multiplayerSocket.difficulty = 'medium'; break;
                        case 6: window.multiplayerSocket.difficulty = 'hard'; break;
                        case 7: window.multiplayerSocket.difficulty = 'expert'; break;
                        default: window.multiplayerSocket.difficulty = 'medium'; // fallback
                    }
                    this.log(`Setting difficulty to ${window.multiplayerSocket.difficulty} based on word length ${this.wordLength}`);
                }
            }
            
            // Sync game state with server if we have a game ID
            if (window.multiplayerSocket.socket) {
                window.multiplayerSocket.socket.emit('sync_game', {
                    gameId: this.gameId,
                    wordLength: this.wordLength,
                    difficulty: window.multiplayerSocket.difficulty
                });
                this.log(`Syncing game state with server: ID ${this.gameId}, word length ${this.wordLength}, difficulty ${window.multiplayerSocket.difficulty}`);
            }
        }
        
        // Add direct event listeners if onGame method is not available
        if (!window.multiplayerSocket.onGame || typeof window.multiplayerSocket.onGame !== 'function') {
            this.log('onGame method not available, using direct socket listeners');
            
            // Ensure we have access to the socket
            if (!window.multiplayerSocket.socket) {
                this.log('No socket object available, cannot set up event listeners');
                return;
            }
            
            // Create backup gameCallbacks object if needed
            if (!window.multiplayerSocket.gameCallbacks) {
                window.multiplayerSocket.gameCallbacks = {};
            }
            
            // Remove any existing listeners first to avoid duplicates
            if (window.multiplayerSocket.socket) {
                window.multiplayerSocket.socket.off('guess_result');
                window.multiplayerSocket.socket.off('guess_error');
                window.multiplayerSocket.socket.off('opponent_guess');
                window.multiplayerSocket.socket.off('game_over');
                window.multiplayerSocket.socket.off('opponent_left');
                
                this.log('Removed existing socket event listeners');
            }
            
            // Tracking object to prevent duplicate processing
            this.processedGuessIds = new Set();
            
            // Add game event listener helper function - for events that should only process once per instance
            const addGameListener = (event, handler) => {
                if (window.multiplayerSocket.socket) {
                    // Add the new listener
                    window.multiplayerSocket.socket.on(event, (data) => {
                        // For guess results, check if we've already processed this guess
                        if (event === 'guess_result' && data && data.guess) {
                            // Create a unique ID for this guess result
                            const guessId = `${data.gameId}_${data.guess}_${Date.now()}`;
                            
                            // Check if we've already processed this exact guess result
                            if (this.processedGuessIds.has(guessId)) {
                                this.log(`Ignoring duplicate guess result for: ${data.guess}`);
                                return;
                            }
                            
                            // Track that we've processed this guess
                            this.processedGuessIds.add(guessId);
                            
                            // Clean up old entries to prevent memory leaks
                            if (this.processedGuessIds.size > 10) {
                                // Remove the oldest entries
                                const idsToRemove = Array.from(this.processedGuessIds).slice(0, 5);
                                idsToRemove.forEach(id => this.processedGuessIds.delete(id));
                            }
                        }
                        
                        this.log(`Direct socket event received: ${event}`);
                        handler(data);
                    });
                }
            };
            
            // Add direct listeners for all game events
            addGameListener('guess_result', (data) => {
                this.handleGuessResult(data);
            });
            
            addGameListener('guess_error', (data) => {
                this.handleGuessError(data);
            });
            
            addGameListener('opponent_guess', (data) => {
                this.handleOpponentGuess(data);
            });
            
            addGameListener('game_over', (data) => {
                this.handleGameOver(data);
            });
            
            addGameListener('opponent_left', () => {
                this.showMessage('Opponent left the game');
                this.isGameOver = true;
            });
            
            return;
        }
        
        // Use standard registration method if available
        // Handle guess results
        window.multiplayerSocket.onGame('onGuessResult', (data) => {
            this.handleGuessResult(data);
        });
        
        // Handle guess errors
        window.multiplayerSocket.onGame('onGuessError', (data) => {
            this.handleGuessError(data);
        });
        
        // Handle opponent guesses
        window.multiplayerSocket.onGame('onOpponentGuess', (data) => {
            this.handleOpponentGuess(data);
        });
        
        // Handle game over
        window.multiplayerSocket.onGame('onGameOver', (data) => {
            this.handleGameOver(data);
        });
        
        // Handle opponent finished
        window.multiplayerSocket.onGame('opponentFinished', (data) => {
            this.opponentFinishedGame(data);
        });
        
        // Handle opponent left
        window.multiplayerSocket.onGame('onOpponentLeft', () => {
            this.showMessage('Opponent left the game');
            this.isGameOver = true;
        });
        
        // Handle opponent disconnected
        window.multiplayerSocket.onGame('onOpponentDisconnected', () => {
            this.showMessage('Opponent disconnected');
            this.isGameOver = true;
        });
    }
    
    // Handle guess result from server
    handleGuessResult(data) {
        this.log(`Received guess result: ${JSON.stringify(data)}`);
        
        // Reset submission lock
        this.submittingGuess = false;
        
        // Check if we already processed this exact guess
        if (this.guesses.length > 0) {
            const lastGuess = this.guesses[this.guesses.length - 1];
            
            // If the last guess is the same as this one and was recently added (within 5 seconds)
            if (lastGuess && 
                lastGuess.word === data.guess && 
                JSON.stringify(lastGuess.result) === JSON.stringify(data.result) &&
                lastGuess.timestamp && 
                (Date.now() - lastGuess.timestamp < 5000)) {
                
                this.log(`⚠️ Ignoring duplicate guess result for ${data.guess} - already processed recently`);
                return;
            }
        }
        
        // Add to guesses with timestamp
        this.guesses.push({
            word: data.guess,
            result: data.result,
            timestamp: Date.now()
        });
        
        this.log(`Added guess #${this.guesses.length}: ${data.guess}`);
        
        // Update keyboard display
        this.updateKeyboardColors(data.guess, data.result);
        
        // Clear current guess
        this.currentGuess = '';
        
        // Update UI
        this.render();
        
        // Re-enable input for next guess if not game over
        this.disableInput = false;
        
        // Check if game is over
        if (data.isWinner) {
            this.log(`You won! Correct word: ${data.guess}`);
            this.isGameOver = true;
            this.disableInput = true;
            this.showMessage('You won!', 'success');
            this.playerFinishedGame(true, this.guesses.length);
            return;
        }
        
        // Check if max guesses reached (loss condition)
        if (this.guesses.length >= this.maxGuesses && !data.isWinner) {
            this.log(`You lost! Max guesses reached (${this.maxGuesses})`);
            this.isGameOver = true;
            this.disableInput = true;
            this.showMessage('You lost!', 'error');
            this.playerFinishedGame(false, this.guesses.length);
            return;
        }
        
        this.log(`Guess added, waiting for next guess. Total guesses: ${this.guesses.length}/${this.maxGuesses}`);
    }
    
    // Handle guess error from server
    handleGuessError(data) {
        this.log(`Guess error: ${data.message}`);
        
        // Display a more user-friendly message based on the error
        let displayMessage = data.message || "Unknown error with your guess";
        
        // Parse common error types and provide clearer messages
        if (displayMessage.includes("Not in word list") || 
            displayMessage.includes("Invalid word") || 
            displayMessage.includes("not in dictionary")) {
            displayMessage = "Not a valid word";
        } else if (displayMessage.includes("length")) {
            displayMessage = `Word must be ${this.wordLength} letters`;
        }
        
        // Show the message
        this.showMessage(displayMessage, 'error');
        
        // Re-enable input since the guess was rejected
        this.disableInput = false;
        
        // Shake the current row for visual feedback
        this.shakeCurrentRow();
    }
    
    // Handle opponent guess from server
    handleOpponentGuess(data) {
        // this.log(`Opponent guess: ${data.guess}, result: ${JSON.stringify(data.result)}`);
        
        // Show notification that opponent made a guess
        // *** Commented out info message ***
        // this.showMessage(`Opponent guessed: ${data.guess}`, 'info'); 
        
        // Check if opponent won
        if (data.isWinner) {
            this.log('Opponent won the game - disabling input.');
            
            // Immediately disable input for this player
            // The actual "Game Over" screen will be triggered by the separate 'game_over' event
            this.isGameOver = true;
            this.disableInput = true;
            
            // Optionally, provide immediate feedback that the game is ending
            // this.showMessage('Game finished by opponent!', 'info'); 
        }
    }
    
    // Handle game over from server
    handleGameOver(data) {
        this.log(`Game over event received: ${JSON.stringify(data)}`);
        
        // *** Add more logging ***
        this.log(`Current game state: isGameOver=${this.isGameOver}, disableInput=${this.disableInput}`);
        this.log(`Received result: ${data.result}, targetWord: ${data.targetWord}`);
        
        // Set game over state immediately
        if (!this.isGameOver) {
            this.log(`Setting isGameOver = true`);
            this.isGameOver = true;
        }
        
        // Disable input immediately to prevent further guesses
        if (!this.disableInput) {
            this.log(`Setting disableInput = true`);
            this.disableInput = true;
        }
        
        // Show game over message
        if (data.result === 'win') {
            this.log('Displaying WIN message');
            this.showMessage(`You won! The word was: ${data.targetWord}`, 'success');
        } else if (data.result === 'lose') {
            this.log('Displaying LOSE message');
            this.showMessage(`You lost. The word was: ${data.targetWord}`, 'error');
        } else {
            // this.log(`Displaying generic GAME OVER message (result: ${data.result})`);
            // *** Commented out info message ***
            // this.showMessage(`Game over. The word was: ${data.targetWord}`, 'info'); 
        }
        
        // Get the current user information
        const currentUsername = window.userManager?.getCurrentUsername() || 'You';
        const isWinner = data.result === 'win';
        
        // Show game over screen after a delay
        this.log('Scheduling showGameOver overlay');
        setTimeout(() => {
            this.log('Executing showGameOver overlay display');
            
            // Ensure tries are correctly reported, even if 0
            const yourTries = this.guesses.length;
            // Get opponent tries directly from the server data if available
            const opponentTries = data.opponentData && data.opponentData[this.opponent] ? 
                                  data.opponentData[this.opponent].guesses : 
                                  (data.opponentTries || 0); 
                                  
            this.log(`Passing tries to showGameOver: You=${yourTries}, Opponent=${opponentTries}`);
            
            this.showGameOver({
                player1: {
                    username: currentUsername,
                    won: isWinner,
                    tries: yourTries,
                    time: 0
                },
                player2: {
                    username: this.opponent,
                    won: !isWinner, 
                    tries: opponentTries,
                    time: 0
                },
                word: data.targetWord,
                gameId: data.gameId
            });
        }, 1500);
    }

    // Log debug information to help diagnose issues
    logDebugInfo(config) {
        console.log("=== Multiplayer Game Debug Info ===");
        console.log("Game ID:", this.gameId);
        console.log("Word Length:", this.wordLength);
        console.log("Opponent:", this.opponent);
        console.log("Socket Connected:", window.multiplayerSocket ? window.multiplayerSocket.connected : false);
        console.log("Socket Game ID:", window.multiplayerSocket ? window.multiplayerSocket.gameId : null);
        console.log("Config:", config);
        
        // Check dictionary status
        const dictStatus = typeof window.WORDS_ALPHA !== 'undefined' && window.WORDS_ALPHA.size > 0 
            ? `Loaded (${window.WORDS_ALPHA.size} words)` 
            : 'Not loaded';
        console.log("Dictionary Status:", dictStatus);
        
        // Test a few sample words
        if (typeof window.WORDS_ALPHA !== 'undefined' && window.WORDS_ALPHA.size > 0) {
            const testWords = ['APPLE', 'HELLO', 'WORLD', 'DANCE', 'REACT'];
            console.log("Dictionary sample tests:");
            testWords.forEach(word => {
                console.log(`- "${word}": ${window.WORDS_ALPHA.has(word) ? 'Found' : 'Not found'}`);
            });
        }
        
        // Log to UI debug area if available
        if (typeof this.log === 'function') {
            this.log(`Game ID: ${this.gameId || 'Not set'}`);
            this.log(`Word Length: ${this.wordLength}`);
            this.log(`Difficulty: ${config.difficulty || 'Not specified'}`);
            this.log(`Socket Connected: ${window.multiplayerSocket ? window.multiplayerSocket.connected : false}`);
            this.log(`Socket Game ID: ${window.multiplayerSocket ? window.multiplayerSocket.gameId : 'Not set'}`);
            this.log(`Dictionary: ${dictStatus}`);
        }
    }

    // Add this method to handle when current player finishes
    playerFinishedGame(won, tries) {
        this.playerFinished = true;
        
        // If opponent is still playing, show waiting message
        if (!this.opponentFinished) {
            this.waitingForOpponent = true;
            this.showWaitingOverlay();
            
            // Notify server that player has finished
            if (window.multiplayerSocket && window.multiplayerSocket.socket) {
                window.multiplayerSocket.socket.emit('player_finished', {
                    gameId: this.gameId,
                    username: window.userManager?.getCurrentUsername(),
                    won: won,
                    tries: tries
                });
            }
        } else {
            // Both players finished, show final results
            this.showGameOver({
                player1: {
                    username: window.userManager?.getCurrentUsername() || 'You',
                    won: won,
                    tries: tries
                },
                player2: {
                    username: this.opponent,
                    won: this.opponentWon,
                    tries: this.opponentGuesses.length
                },
                word: window.multiplayerGame?.gameState?.word || 'unknown'
            });
        }
    }

    // Add this method to handle when opponent finishes
    opponentFinishedGame(data) {
        this.opponentFinished = true;
        this.opponentWon = data.won;
        
        // Show message that opponent finished
        // *** Commented out info message ***
        // this.showMessage(`${this.opponent} has finished the game!`, 'info'); 
        
        // If player is already finished, show final results
        if (this.playerFinished) {
            // Remove waiting overlay if it exists
            const waitingOverlay = document.getElementById('mp-waiting-overlay');
            if (waitingOverlay) waitingOverlay.remove();
            
            // Show final game results
            this.showGameOver({
                player1: {
                    username: window.userManager?.getCurrentUsername() || 'You',
                    won: this.playerFinished,
                    tries: this.guesses.length
                },
                player2: {
                    username: this.opponent,
                    won: this.opponentWon,
                    tries: data.tries || this.opponentGuesses.length
                },
                word: window.multiplayerGame?.gameState?.word || data.word || 'unknown'
            });
        }
    }

    // Add this method to show waiting overlay
    showWaitingOverlay() {
        // Remove any existing overlay first
        const existingOverlay = document.getElementById('mp-waiting-overlay');
        if (existingOverlay) existingOverlay.remove();
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'mp-waiting-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;';
        
        // Create content
        const content = document.createElement('div');
        content.style.cssText = 'background:white;padding:30px;border-radius:8px;text-align:center;max-width:400px;width:90%;';
        
        // Add spinner
        const spinner = document.createElement('div');
        spinner.style.cssText = 'border:5px solid #f3f3f3;border-top:5px solid #3498db;border-radius:50%;width:50px;height:50px;animation:spin 2s linear infinite;margin:0 auto 20px;';
        content.appendChild(spinner);
        
        // Add message
        const message = document.createElement('h3');
        message.textContent = 'Waiting for opponent to finish...';
        content.appendChild(message);
        
        // Add animation style
        const style = document.createElement('style');
        style.textContent = '@keyframes spin {0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }}';
        document.head.appendChild(style);
        
        overlay.appendChild(content);
        document.body.appendChild(overlay);
    }

    // Add a shakeCurrentRow method
    shakeCurrentRow() {
        if (this.guesses.length >= this.maxGuesses) return;
        
        const row = this.tiles[this.guesses.length];
        if (!row || row.length === 0) return;
        
        // Get first tile in the row to get the parent row element
        const firstTile = row[0];
        const rowElement = firstTile.parentNode;
        
        // Add shake animation
        rowElement.classList.add('shake');
        
        // Play error sound if available
        try {
            const errorSound = new Audio('/sounds/error.mp3');
            errorSound.volume = 0.3;
            errorSound.play().catch(e => console.log('Error playing sound:', e));
        } catch (e) {
            console.log('Error playing sound:', e);
        }
        
        // Remove shake class after animation completes
        setTimeout(() => {
            rowElement.classList.remove('shake');
        }, 500);
    }

    // Ensure dictionary is loaded for word validation
    ensureDictionaryLoaded() {
        if (typeof window.WORDS_ALPHA === 'undefined' || !window.WORDS_ALPHA || window.WORDS_ALPHA.size === 0) {
            console.warn("Dictionary not loaded, creating fallback dictionary");
            
            // Create a minimal dictionary if none exists
            window.WORDS_ALPHA = window.WORDS_ALPHA || new Set();
            
            // Add some common 4-7 letter words
            const commonWords = {
                4: ['ABLE', 'ACID', 'ACNE', 'AGED', 'ALSO', 'APEX', 'AQUA', 'ARCH', 'ARMY', 'AUNT', 'AUTO', 'AWAY', 'AXIS', 'BABY', 'BACK', 'BALD', 'BALL', 'BAND', 'BANK', 'BASE'],
                5: ['ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ADAPT', 'ADMIT', 'ADOBE', 'ADOPT', 'AFTER', 'AGAIN', 'AGENT', 'AGREE', 'AHEAD', 'ALBUM', 'ALERT', 'APPLE', 'ARENA', 'ARGUE', 'ARISE', 'ARRAY'],
                6: ['ABSENT', 'ABSORB', 'ACCEPT', 'ACCESS', 'ACCUSE', 'ACROSS', 'ACTION', 'ACTIVE', 'ACTUAL', 'ADJUST', 'ADMIRE', 'ADSORB', 'ADVISE', 'AFFAIR', 'AFFECT', 'AFFORD', 'AFRAID', 'AGENCY', 'AGENDA', 'ALMOST'],
                7: ['ABANDON', 'ABILITY', 'ABSENCE', 'ABSOLVE', 'ABSORBS', 'ACCEPTS', 'ACCLAIM', 'ACCOUNT', 'ACCUSES', 'ACHIEVE', 'ACQUIRE', 'ADDRESS', 'ADVANCE', 'ADVERSE', 'ADVISED', 'ADVISER', 'AFFAIRS', 'AFFECTS', 'AGAINST', 'AIRLINE']
            };
            
            // Add words to global set
            Object.values(commonWords).forEach(wordList => {
                wordList.forEach(word => window.WORDS_ALPHA.add(word));
            });
            
            // Log what we did
            if (typeof this.log === 'function') {
                this.log(`Created fallback dictionary with ${window.WORDS_ALPHA.size} words`);
            } else {
                console.log(`Created fallback dictionary with ${window.WORDS_ALPHA.size} words`);
            }
            
            // Try to load dictionary.js or words-alpha.js
            this.loadDictionaryScript();
        }
    }
    
    // Try to load the dictionary script
    loadDictionaryScript() {
        // Try loading dictionary.js first
        const script = document.createElement('script');
        script.src = 'js/dictionary.js';
        script.onload = () => {
            console.log("Dictionary script loaded successfully");
        };
        script.onerror = () => {
            console.error("Failed to load dictionary.js, trying words-alpha.js");
            
            // Try words-alpha.js as fallback
            const alphaScript = document.createElement('script');
            alphaScript.src = 'js/words-alpha.js';
            alphaScript.onload = () => {
                console.log("words-alpha.js loaded successfully");
            };
            alphaScript.onerror = () => {
                console.error("Failed to load any dictionary scripts");
            };
            document.head.appendChild(alphaScript);
        };
        document.head.appendChild(script);
    }
}

// Initialize multiplayer game UI
window.startMultiplayerGame = function(gameConfig) {
    console.log('Starting multiplayer game with config:', gameConfig);
    
    // Create new game UI
    window.multiplayerGameUI = new MultiplayerGameUI();
    window.multiplayerGameUI.initialize(gameConfig);
    
    return window.multiplayerGameUI;
}; 