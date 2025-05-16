/**
 * EMERGENCY MULTIPLAYER GAME FIX
 * 
 * This file contains code to force the game to display when a challenge is accepted.
 * It bypasses all the container display logic and directly shows the game.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Multiplayer game fix initialized');
    
    // Create a global variable to store game data
    window.pendingGameData = null;

    // Create style for the forced game display
    const style = document.createElement('style');
    style.textContent = `
        #forced-game-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            z-index: 9999;
            display: none;
        }
        
        #forced-game-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 20px;
            background: #f0f0f0;
            border-bottom: 1px solid #ddd;
        }
        
        #forced-game-content {
            padding: 20px;
            height: calc(100% - 60px);
            overflow-y: auto;
        }
        
        #forced-home-button {
            padding: 8px 15px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
    
    // Create container for forced game display
    const container = document.createElement('div');
    container.id = 'forced-game-container';
    
    // Add header with title and home button
    const header = document.createElement('div');
    header.id = 'forced-game-header';
    
    const title = document.createElement('h2');
    title.id = 'forced-game-title';
    title.textContent = 'Multiplayer Game';
    
    const homeButton = document.createElement('button');
    homeButton.id = 'forced-home-button';
    homeButton.textContent = 'Back to Home';
    homeButton.addEventListener('click', () => {
        window.location.reload();
    });
    
    header.appendChild(title);
    header.appendChild(homeButton);
    
    // Add content area
    const content = document.createElement('div');
    content.id = 'forced-game-content';
    
    container.appendChild(header);
    container.appendChild(content);
    
    document.body.appendChild(container);
    
    // Add check for force displaying of game
    window.forceDisplayGame = function(gameData) {
        console.log('FORCE DISPLAYING GAME:', gameData);
        
        // Debug socket state
        const socketState = {
            socketExists: !!window.multiplayerSocket,
            socketConnected: window.multiplayerSocket?.connected || false,
            currentGameId: window.multiplayerSocket?.gameId || null
        };
        console.log('Existing socket state:', socketState);
        
        // Set global multiplayerMode flag
        window.multiplayerMode = true;
        
        // Check if a game is already in progress
        if (window.activeGame && window.multiplayerSocket?.gameId) {
            console.log("Game already in progress, not reinitializing");
            
            // Ensure the game container is visible
            this.ensureGameVisible();
            return;
        }
        
        // Set the game ID on the socket
        if (gameData && gameData.gameId && window.multiplayerSocket) {
            window.multiplayerSocket.gameId = gameData.gameId;
        }
        
        // Check if game is already in progress with this game ID
        if (window.currentGameId === gameData.gameId && window.gameInProgress) {
            console.log('Game already in progress, not reinitializing');
            return true;
        }
        
        // Mark this game as in progress to prevent duplicate initializations
        window.currentGameId = gameData.gameId;
        window.gameInProgress = true;
        
        // Make sure game container is visible
        ensureGameContainerVisible();
        
        // First, try using the game manager (preferred way)
        if (window.gameManager) {
            console.log('Using gameManager to start the game');
            
            // Create a current user object if not available
            const currentUser = window.userManager?.getCurrentUser() || 
                              {username: window.getUsername() || 'Player'};
            
            // Get opponent from game data
            const opponent = gameData.fromUsername === window.getUsername() ? 
                            gameData.toUsername : gameData.fromUsername;
            
            console.log(`Starting game as: ${currentUser.username} against ${opponent}`);
            
            try {
                // Start multiplayer game with game manager
                window.gameManager.startGame('multiplayer', currentUser, {
                    mode: 'challenge',
                    opponent: opponent,
                    difficulty: gameData.difficulty || 'medium',
                    gameId: gameData.gameId,
                    word: gameData.targetWord // Pass the target word if we have it
                });
                
                // Force container visibility after a small delay
                setTimeout(ensureGameContainerVisible, 100);
                
                return true;
            } catch (error) {
                console.error('Error starting game with GameManager:', error);
                
                // Fix the game container visibility directly
                const gameContainer = document.getElementById('game-container');
                if (gameContainer) {
                    gameContainer.classList.remove('hidden');
                    gameContainer.style.display = 'block';
                    
                    // Hide other containers
                    const containersToHide = ['auth-container', 'home-container', 'loading-message'];
                    containersToHide.forEach(id => {
                        const container = document.getElementById(id);
                        if (container) {
                            container.classList.add('hidden');
                            container.style.display = 'none';
                        }
                    });
                }
                // Continue to fallback methods
            }
        }
        
        // If game manager is not available, try creating the UI elements directly
        createGameUIDirectly(gameData);
        
        // Return success
        return true;
    };
    
    // Inject special handlers to fix multiplayer
    if (window.multiplayerSocket) {
        // Override startGameFromChallenge to use our forced display
        const originalStart = window.multiplayerSocket.startGameFromChallenge;
        window.multiplayerSocket.startGameFromChallenge = function(data) {
            console.log('INTERCEPTED startGameFromChallenge with data:', data);
            
            // Try native implementation first
            const result = originalStart.call(this, data);
            
            // If it didn't work, use our forced display
            if (!result) {
                setTimeout(() => {
                    window.forceDisplayGame(data);
                }, 500);
            }
            
            return true;
        };
        
        // Add direct handler for game_start events
        window.multiplayerSocket.socket.on('game_start', (data) => {
            console.log('DIRECT game_start event received:', data);
            
            // Store the game ID
            if (data.gameId) {
                window.multiplayerSocket.gameId = data.gameId;
            }
            
            // Force display the game
            setTimeout(() => {
                window.forceDisplayGame(data);
            }, 500);
        });
        
        // Add direct handler for challenge_accepted events
        window.multiplayerSocket.socket.on('challenge_accepted', (data) => {
            console.log('DIRECT challenge_accepted event received:', data);
            
            // Store the game ID
            if (data.gameId) {
                window.multiplayerSocket.gameId = data.gameId;
            }
            
            // Force display the game
            setTimeout(() => {
                window.forceDisplayGame(data);
            }, 500);
        });
        
        // Add direct handler for challenge_response_result events
        window.multiplayerSocket.socket.on('challenge_response_result', (data) => {
            console.log('DIRECT challenge_response_result event received:', data);
            
            if (data.gameId) {
                // Store the game ID
                window.multiplayerSocket.gameId = data.gameId;
                
                // Force display the game
                setTimeout(() => {
                    window.forceDisplayGame(data);
                }, 500);
            }
        });
        
        // Add direct handler for game_over events
        window.multiplayerSocket.socket.on('game_over', (data) => {
            console.log('DIRECT game_over event received:', data);
            
            // Make sure we have the result and target word
            if (!data || !data.result || !data.targetWord || !data.gameId) {
                console.error('Invalid game over data:', data);
                return;
            }
            
            // Create end game screen after a brief delay to allow last guess to be displayed
            setTimeout(() => {
                showGameOverScreen({
                    result: data.result,
                    targetWord: data.targetWord,
                    gameId: data.gameId
                });
            }, 1000);
        });
    }
});

// Helper function to ensure game container is visible
function ensureGameContainerVisible() {
    console.log('Ensuring game container is visible');
    
    // Find all possible container elements
    const gameContainer = document.getElementById('game-container');
    const gameContent = document.getElementById('game-content');
    const appContent = document.getElementById('app-content');
    
    // Hide other main containers
    const authContainer = document.getElementById('auth-container');
    const homeContainer = document.getElementById('home-container');
    const loadingMessage = document.getElementById('loading-message');
    
    if (authContainer) authContainer.classList.add('hidden');
    if (homeContainer) homeContainer.classList.add('hidden');
    if (loadingMessage) loadingMessage.classList.add('hidden');
    
    // Show game container
    if (gameContainer) {
        gameContainer.classList.remove('hidden');
        gameContainer.style.display = 'block';
        console.log('Game container made visible');
    } else {
        console.error('Game container not found');
    }
    
    // Also ensure game content is visible
    if (gameContent) {
        gameContent.classList.remove('hidden');
        gameContent.style.display = 'block';
    }
    
    // Force app content to be visible
    if (appContent) {
        appContent.classList.remove('hidden');
        appContent.style.display = 'block';
    }
}

// Function to create game UI directly when game manager fails
function createGameUIDirectly(gameData) {
    console.log('Creating game UI directly as last resort');
    
    // Make sure game container exists
    let gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
        gameContainer = document.createElement('div');
        gameContainer.id = 'game-container';
        gameContainer.classList.add('container');
        document.body.appendChild(gameContainer);
    }
    
    // Clear container
    gameContainer.innerHTML = '';
    
    // Create game header
    const header = document.createElement('div');
    header.className = 'game-header';
    header.innerHTML = `
        <h2>Multiplayer Challenge</h2>
        <p>Playing against ${gameData.fromUsername === window.getUsername() ? 
                           gameData.toUsername : gameData.fromUsername}</p>
        <div class="difficulty-badge">${gameData.difficulty || 'medium'}</div>
    `;
    
    // Create game board
    const gameBoard = document.createElement('div');
    gameBoard.className = 'game-board';
    
    // Create the game grid
    const wordLength = gameData.wordLength || 5;
    const rows = 6; // Standard number of guesses
    
    const gridHTML = `
        <div class="board-grid" style="display: grid; grid-template-rows: repeat(${rows}, 60px); gap: 5px; margin: 20px auto; width: fit-content;">
            ${Array(rows).fill().map((_, rowIndex) => `
                <div class="board-row" data-row="${rowIndex}" style="display: grid; grid-template-columns: repeat(${wordLength}, 60px); gap: 5px;">
                    ${Array(wordLength).fill().map((_, colIndex) => `
                        <div class="board-tile" data-row="${rowIndex}" data-col="${colIndex}" 
                             style="width: 60px; height: 60px; border: 2px solid #ccc; display: flex; align-items: center; 
                                    justify-content: center; font-size: 24px; font-weight: bold; background: white;">
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    `;
    
    gameBoard.innerHTML = gridHTML;
    
    // Create virtual keyboard
    const keyboard = document.createElement('div');
    keyboard.className = 'virtual-keyboard';
    keyboard.style.cssText = 'margin: 20px auto; width: fit-content; user-select: none;';
    
    // Define keyboard layout
    const keyboardRows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
    ];
    
    // Create keyboard HTML
    keyboard.innerHTML = keyboardRows.map(row => `
        <div class="keyboard-row" style="display: flex; justify-content: center; margin-bottom: 8px;">
            ${row.map(key => {
                const isSpecial = key === 'ENTER' || key === 'BACKSPACE';
                const width = isSpecial ? '65px' : '40px';
                return `
                    <div class="keyboard-key" data-key="${key}" 
                         style="width: ${width}; height: 58px; margin: 0 2px; background-color: #d3d6da; 
                                border-radius: 4px; display: flex; align-items: center; justify-content: center;
                                font-weight: bold; cursor: pointer;">
                        ${key === 'BACKSPACE' ? '⌫' : key}
                    </div>
                `;
            }).join('')}
        </div>
    `).join('');
    
    // Add back button
    const backButton = document.createElement('button');
    backButton.innerText = 'Back to Home';
    backButton.className = 'back-button';
    backButton.style.cssText = 'display: block; margin: 20px auto; padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;';
    backButton.addEventListener('click', () => {
        // Go back to home screen
        const homeContainer = document.getElementById('home-container');
        if (homeContainer) {
            gameContainer.classList.add('hidden');
            homeContainer.classList.remove('hidden');
        }
    });
    
    // Add message display area
    const messageArea = document.createElement('div');
    messageArea.id = 'game-message-area';
    messageArea.style.cssText = 'text-align: center; margin: 10px 0; min-height: 24px; color: #e91e63; font-weight: bold;';
    
    // Store game state
    const gameState = {
        currentRow: 0,
        currentCol: 0,
        guesses: Array(rows).fill().map(() => Array(wordLength).fill('')),
        targetWord: gameData.targetWord || '',
        gameId: gameData.gameId,
        isGameOver: false
    };
    
    // Add elements to container
    gameContainer.appendChild(header);
    gameContainer.appendChild(messageArea);
    gameContainer.appendChild(gameBoard);
    gameContainer.appendChild(keyboard);
    gameContainer.appendChild(backButton);
    
    // Make container visible
    ensureGameContainerVisible();
    
    // Set up keyboard event handlers
    setupKeyboardHandlers(keyboard, gameBoard, messageArea, gameState, gameData);
    
    // Also set up physical keyboard input
    const keyDownHandler = (e) => {
        // Skip if MultiplayerGameUI is active or game is over
        if (window.multiplayerGameUI || gameState.isGameOver) {
            return;
        }
        
        const key = e.key.toUpperCase();
        
        if (key === 'ENTER') {
            submitGuess(gameBoard, messageArea, gameState, gameData);
        } else if (key === 'BACKSPACE' || key === 'DELETE') {
            deleteLetter(gameBoard, gameState);
        } else if (/^[A-Z]$/.test(key)) {
            addLetter(key, gameBoard, gameState);
        }
    };
    
    // Remove any existing handler to prevent duplicates
    document.removeEventListener('keydown', window.lastKeyDownHandler);
    
    // Store this handler globally to be able to remove it later
    window.lastKeyDownHandler = keyDownHandler;
    
    // Only add the keyboard handler if MultiplayerGameUI isn't available
    if (!window.multiplayerGameUI && !document.getElementById('mp-game-content')) {
        document.addEventListener('keydown', keyDownHandler);
    }
    
    // Try to initialize multiplayer game UI if available
    if (window.MultiplayerGameUI) {
        try {
            const gameUI = new window.MultiplayerGameUI();
            gameUI.initialize({
                gameId: gameData.gameId,
                wordLength: gameData.wordLength || 5,
                difficulty: gameData.difficulty || 'medium',
                opponent: gameData.fromUsername === window.getUsername() ? 
                          gameData.toUsername : gameData.fromUsername
            }, gameBoard);
        } catch (error) {
            console.error('Error initializing MultiplayerGameUI:', error);
        }
    }
}

// Set up handlers for the virtual keyboard
function setupKeyboardHandlers(keyboard, gameBoard, messageArea, gameState, gameData) {
    keyboard.addEventListener('click', (e) => {
        if (gameState.isGameOver) return;
        
        const keyEl = e.target.closest('.keyboard-key');
        if (!keyEl) return;
        
        const key = keyEl.dataset.key;
        
        if (key === 'ENTER') {
            submitGuess(gameBoard, messageArea, gameState, gameData);
        } else if (key === 'BACKSPACE') {
            deleteLetter(gameBoard, gameState);
        } else {
            addLetter(key, gameBoard, gameState);
        }
    });
}

// Add a letter to the current row
function addLetter(letter, gameBoard, gameState) {
    if (gameState.currentCol >= gameState.guesses[0].length) return;
    
    // Update game state
    gameState.guesses[gameState.currentRow][gameState.currentCol] = letter;
    
    // Update UI
    const tile = gameBoard.querySelector(`.board-tile[data-row="${gameState.currentRow}"][data-col="${gameState.currentCol}"]`);
    tile.textContent = letter;
    tile.classList.add('filled');
    
    // Move to next column
    gameState.currentCol++;
    
    console.log(`Letter added: ${letter}, current guess: ${gameState.guesses[gameState.currentRow].join('')}`);
}

// Delete the last letter
function deleteLetter(gameBoard, gameState) {
    if (gameState.currentCol <= 0) return;
    
    // Move back one column
    gameState.currentCol--;
    
    // Update game state
    gameState.guesses[gameState.currentRow][gameState.currentCol] = '';
    
    // Update UI
    const tile = gameBoard.querySelector(`.board-tile[data-row="${gameState.currentRow}"][data-col="${gameState.currentCol}"]`);
    tile.textContent = '';
    tile.classList.remove('filled');
    
    console.log('Letter deleted');
}

// Submit the current guess
function submitGuess(gameBoard, messageArea, gameState, gameData) {
    // Check if row is complete
    if (gameState.currentCol < gameState.guesses[0].length) {
        showMessage(messageArea, 'Not enough letters');
        return;
    }
    
    const guess = gameState.guesses[gameState.currentRow].join('');
    console.log(`Submitting guess: ${guess}`);
    
    // Send guess to server if socket is available
    if (window.multiplayerSocket && window.multiplayerSocket.socket) {
        // Disable the current row to prevent multiple submissions
        const currentRow = gameBoard.querySelector(`.board-row[data-row="${gameState.currentRow}"]`);
        if (currentRow) {
            currentRow.style.pointerEvents = 'none';
        }
        
        showMessage(messageArea, 'Submitting guess...');
        
        // Add direct socket event handler for this guess result if not already listening
        const onceHandler = (data) => {
            console.log('Received direct guess result:', data);
            
            // Re-enable row interaction
            if (currentRow) {
                currentRow.style.pointerEvents = 'auto';
            }
            
            // Check if this is for our current guess
            if (data.guess === guess || data.guess === guess.toUpperCase()) {
                // Apply result to UI
                const result = data.result;
                colorRow(gameBoard, gameState.currentRow, guess, gameState.targetWord, result);
                
                // Move to next row
                gameState.currentRow++;
                gameState.currentCol = 0;
                
                // Check if game is over
                if (data.isWinner) {
                    gameState.isGameOver = true;
                    showMessage(messageArea, 'You won! 🎉');
                    
                    // Don't need to wait for game_over event to show overlay
                    // The server will still send it for consistent behavior
                    setTimeout(() => {
                        if (!document.getElementById('game-over-overlay')) {
                            showGameOverScreen({
                                result: 'win',
                                targetWord: gameState.targetWord || data.targetWord,
                                gameId: gameState.gameId
                            });
                        }
                    }, 1500);
                    
                    return;
                }
                
                // Check if all rows used (loss)
                if (gameState.currentRow >= gameState.guesses.length) {
                    gameState.isGameOver = true;
                    showMessage(messageArea, `Game over. The word was ${gameState.targetWord}`);
                }
                
                // Remove this once handler
                window.multiplayerSocket.socket.off('guess_result', onceHandler);
            }
        };
        
        // Listen once for the result
        window.multiplayerSocket.socket.once('guess_result', onceHandler);
        
        // Send the guess to the server
        window.multiplayerSocket.socket.emit('submit_guess', {
            gameId: gameState.gameId,
            guess: guess
        });
    } else {
        // If no socket, just check locally if we have the target
        if (gameState.targetWord) {
            checkGuessLocally(guess, gameBoard, messageArea, gameState);
        } else {
            showMessage(messageArea, 'Cannot submit guess: No connection to server');
        }
    }
}

// Check the guess locally
function checkGuessLocally(guess, gameBoard, messageArea, gameState) {
    const target = gameState.targetWord.toUpperCase();
    
    if (!target) {
        showMessage(messageArea, 'Target word not available');
        return;
    }
    
    // Visual feedback only - don't determine win/lose locally
    // Just color the tiles and move to next row
    
    // Get the array of target letters for letter frequency counting
    const targetLetters = target.split('');
    
    // First pass: mark correct letters
    const result = new Array(guess.length).fill(null);
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === target[i]) {
            result[i] = 'correct';
            targetLetters[targetLetters.indexOf(guess[i])] = null; // Mark as used
        }
    }
    
    // Second pass: mark present and absent letters
    for (let i = 0; i < guess.length; i++) {
        if (result[i]) continue; // Skip already marked positions
        
        const index = targetLetters.indexOf(guess[i]);
        if (index !== -1) {
            result[i] = 'misplaced';
            targetLetters[index] = null; // Mark as used
        } else {
            result[i] = 'wrong';
        }
    }
    
    // Color the tiles based on the result
    colorRow(gameBoard, gameState.currentRow, guess, target, result);
    
    // Move to next row - even if it's correct, let the server decide if it's a win
    gameState.currentRow++;
    gameState.currentCol = 0;
    
    // Only show generic feedback message
    showMessage(messageArea, 'Guess submitted');
}

// Color the tiles based on the guess
function colorRow(gameBoard, row, guess, target, result) {
    const tiles = gameBoard.querySelectorAll(`.board-tile[data-row="${row}"]`);
    
    for (let i = 0; i < guess.length; i++) {
        const status = result[i];
        let backgroundColor, textColor, borderColor;
        
        switch (status) {
            case 'correct':
                backgroundColor = '#6aaa64'; // Green
                textColor = 'white';
                borderColor = '#6aaa64';
                break;
            case 'misplaced':
                backgroundColor = '#c9b458'; // Yellow
                textColor = 'white';
                borderColor = '#c9b458';
                break;
            default: // wrong
                backgroundColor = '#787c7e'; // Gray
                textColor = 'white';
                borderColor = '#787c7e';
        }
        
        tiles[i].style.backgroundColor = backgroundColor;
        tiles[i].style.color = textColor;
        tiles[i].style.borderColor = borderColor;
    }
}

// Show a message in the message area
function showMessage(messageArea, message) {
    messageArea.textContent = message;
    
    // Clear message after 3 seconds
    setTimeout(() => {
        messageArea.textContent = '';
    }, 3000);
}

// Display the game over screen
function showGameOverScreen(data) {
    console.log('Showing game over screen:', data);
    
    // Create overlay for game over screen
    const overlay = document.createElement('div');
    overlay.id = 'game-over-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    `;
    
    // Create modal container
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        max-width: 400px;
        width: 90%;
    `;
    
    // Get user info - try different sources
    const currentUser = window.userManager?.getCurrentUsername() || 
                       window.getUsername() || 
                       'You';
    
    // Determine the player's result
    const isWinner = data.result === 'win';
    
    // Create content for the modal
    modal.innerHTML = `
        <h2 style="color: ${isWinner ? '#4CAF50' : '#F44336'}">
            ${isWinner ? '🎉 You Won!' : '❌ You Lost!'}
        </h2>
        <p style="font-size: 18px; margin: 15px 0;">
            The word was: <strong>${data.targetWord}</strong>
        </p>
        <p style="margin: 15px 0;">
            ${isWinner ? 
                'Congratulations! You guessed the word correctly.' : 
                'Better luck next time!'}
        </p>
        <div style="margin-top: 25px;">
            <button id="play-again-btn" style="
                background: #4CAF50;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                margin-right: 10px;
                cursor: pointer;
                font-weight: bold;">
                Play Again
            </button>
            <button id="home-btn" style="
                background: #2196F3;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;">
                Back to Home
            </button>
        </div>
    `;
    
    // Add to document
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Add event listeners for buttons
    document.getElementById('play-again-btn').addEventListener('click', () => {
        // Close the overlay
        overlay.remove();
        
        // Try to go back to home screen where they can start a new game
        const homeContainer = document.getElementById('home-container');
        const gameContainer = document.getElementById('game-container');
        
        if (homeContainer && gameContainer) {
            homeContainer.classList.remove('hidden');
            homeContainer.style.display = 'block';
            
            gameContainer.classList.add('hidden');
            gameContainer.style.display = 'none';
        } else {
            // If containers not found, just reload the page
            window.location.reload();
        }
    });
    
    document.getElementById('home-btn').addEventListener('click', () => {
        // Close the overlay
        overlay.remove();
        
        // Use GameManager to exit the game properly
        if (window.gameManager && typeof window.gameManager.exitGame === 'function') {
            console.log("Game Over screen: Calling gameManager.exitGame()");
            window.gameManager.exitGame();
        } else {
            // Fallback if GameManager is not available
            console.warn("GameManager not found, falling back to page reload.");
            window.location.reload();
        }
    });
} 