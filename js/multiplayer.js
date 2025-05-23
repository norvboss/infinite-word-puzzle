// Multiplayer functionality will be added here

class MultiplayerManager {
    constructor(gameInstance) {
        // Store reference to the main game instance
        this.gameInstance = gameInstance || window.gameManager?.currentGame;
        
        // Multiplayer state
        this.isInMultiplayerGame = false;
        this.opponentUsername = null;
        this.gameCode = null;
        this.myTurn = false;
        this.difficulty = 'normal';
        this.matchmakingActive = false;
        
        // Create UI elements
        this.createMultiplayerUI();
        
        // For demo purposes, we're simulating socket connections
        this.setupSimulatedConnection();
        
        console.log("Multiplayer Manager initialized");
    }
    
    // In a real app, this would connect to a WebSocket server
    // For our demo, we'll simulate real-time interactions
    setupSimulatedConnection() {
        this.simulatedOpponentGuessTimer = null;
        this.events = {};
        
        // Simulate a socket connection with an event system
        this.simulatedSocket = {
            emit: (event, data) => {
                console.log(`[SOCKET EMIT] ${event}`, data);
                
                // Simulate server response after a short delay
                setTimeout(() => {
                    this.handleSimulatedServerResponse(event, data);
                }, 500 + Math.random() * 1000);
            },
            on: (event, callback) => {
                this.events[event] = callback;
            }
        };
    }
    
    // Simulate server responses for demo purposes
    handleSimulatedServerResponse(event, data) {
        switch (event) {
            case 'find_opponent':
                // Simulate finding a random opponent
                const simulatedOpponents = ['BotPlayer1', 'WordMaster', 'LetterGuesser', 'Puzzler'];
                const opponent = simulatedOpponents[Math.floor(Math.random() * simulatedOpponents.length)];
                
                if (this.events['opponent_found']) {
                    this.events['opponent_found']({
                        opponentUsername: opponent,
                        gameCode: 'GAME' + Math.floor(Math.random() * 10000),
                        targetWord: this.getRandomWord(5) // 5-letter word for normal difficulty
                    });
                }
                break;
                
            case 'create_friend_game':
                // Simulate creating a game that friends can join
                if (this.events['game_created']) {
                    this.events['game_created']({
                        gameCode: 'FRIEND' + Math.floor(Math.random() * 10000),
                        targetWord: this.getRandomWord(data.wordLength || 5)
                    });
                }
                break;
                
            case 'join_friend_game':
                // Simulate joining a friend's game
                if (Math.random() > 0.2) { // 80% chance of success
                    if (this.events['game_joined']) {
                        this.events['game_joined']({
                            opponentUsername: 'FriendHost',
                            targetWord: this.getRandomWord(5)
                        });
                    }
                } else {
                    // Simulate game not found
                    if (this.events['game_join_error']) {
                        this.events['game_join_error']({
                            message: 'Game not found or already started'
                        });
                    }
                }
                break;
                
            case 'submit_guess':
                // Simulate the opponent receiving our guess
                if (this.events['opponent_guessed']) {
                    // Here we'd normally pass our guess to the opponent
                }
                
                // Simulate the opponent making a guess after some time
                clearTimeout(this.simulatedOpponentGuessTimer);
                this.simulatedOpponentGuessTimer = setTimeout(() => {
                    if (this.events['opponent_guess']) {
                        const opponentGuess = this.getRandomWord(data.guess.length);
                        this.events['opponent_guess']({
                            guess: opponentGuess,
                            result: this.simulateGuessResult(opponentGuess)
                        });
                    }
                }, 2000 + Math.random() * 3000);
                break;
                
            case 'leave_game':
                // Simulate opponent notification that we left
                clearTimeout(this.simulatedOpponentGuessTimer);
                if (this.events['opponent_left']) {
                    this.events['opponent_left']();
                }
                break;
        }
    }
    
    // Get a random word for demo purposes
    getRandomWord(length) {
        const commonWords = {
            5: ['HAPPY', 'BRAVE', 'SMILE', 'DANCE', 'FRESH', 'LIGHT', 'DREAM', 'PEACE', 'LAUGH', 'POWER'],
            6: ['BRIGHT', 'FRIEND', 'SPRING', 'GARDEN', 'RHYTHM', 'WONDER', 'NATURE', 'BREEZE', 'SUNSET', 'GENTLE']
        };
        
        const wordList = commonWords[length] || commonWords[5];
        return wordList[Math.floor(Math.random() * wordList.length)];
    }
    
    // Simulate a guess result
    simulateGuessResult(guess) {
        // In a real game, this would compare against the actual target word
        // For demo, we'll generate random results
        return Array.from(guess).map(() => {
            const rand = Math.random();
            if (rand < 0.2) return 'correct'; // 20% chance of correct
            if (rand < 0.5) return 'present'; // 30% chance of present
            return 'absent'; // 50% chance of absent
        });
    }
    
    // Find a random opponent
    findRandomOpponent() {
        if (this.matchmakingActive) return;
        
        this.matchmakingActive = true;
        this.showMatchmaking();
        this.updateStatus('Finding an opponent...');
        
        // In a real app, this would connect to a matchmaking server
        this.simulatedSocket.emit('find_opponent', { difficulty: this.difficulty });
        
        // Set up event handlers
        this.simulatedSocket.on('opponent_found', (data) => {
            this.opponentUsername = data.opponentUsername;
            this.gameCode = data.gameCode;
            this.matchmakingActive = false;
            
            // Start the multiplayer game
            this.startMultiplayerGame(data.targetWord);
        });
    }
    
    // Create a game that friends can join
    createFriendGame() {
        if (this.matchmakingActive) return;
        
        this.matchmakingActive = true;
        this.showMatchmaking();
        this.updateStatus('Creating a game for friends...');
        
        // In a real app, this would create a game on the server
        this.simulatedSocket.emit('create_friend_game', { 
            difficulty: this.difficulty,
            wordLength: 5 // Normal difficulty
        });
        
        // Set up event handlers
        this.simulatedSocket.on('game_created', (data) => {
            this.gameCode = data.gameCode;
            this.showGameCode(this.gameCode);
            this.updateStatus('Waiting for a friend to join...');
            
            // Set up event for when friend joins
            this.simulatedSocket.on('friend_joined', (joinData) => {
                this.opponentUsername = joinData.opponentUsername;
                this.matchmakingActive = false;
                
                // Start the multiplayer game
                this.startMultiplayerGame(data.targetWord);
            });
        });
    }
    
    // Join a friend's game using a code
    joinFriendGame(gameCode) {
        if (!gameCode || this.matchmakingActive) return;
        
        this.matchmakingActive = true;
        this.showMatchmaking();
        this.updateStatus('Joining friend\'s game...');
        
        // In a real app, this would join a game on the server
        this.simulatedSocket.emit('join_friend_game', { gameCode });
        
        // Set up event handlers
        this.simulatedSocket.on('game_joined', (data) => {
            this.opponentUsername = data.opponentUsername;
            this.gameCode = gameCode;
            this.matchmakingActive = false;
            
            // Start the multiplayer game
            this.startMultiplayerGame(data.targetWord);
        });
        
        this.simulatedSocket.on('game_join_error', (data) => {
            this.matchmakingActive = false;
            this.hideMatchmaking();
            alert(data.message);
        });
    }
    
    // Cancel current matchmaking
    cancelMatchmaking() {
        if (!this.matchmakingActive) return;
        
        this.matchmakingActive = false;
        this.hideMatchmaking();
        this.updateStatus('');
        
        // In a real app, this would cancel the matchmaking request
        this.simulatedSocket.emit('cancel_matchmaking');
    }
    
    // Start a multiplayer game
    startMultiplayerGame(targetWord) {
        this.isInMultiplayerGame = true;
        this.hideMatchmaking();
        
        // Initialize game with the target word
        if (this.gameInstance) {
            // If we have a game instance, set it up for multiplayer
            this.gameInstance.targetWord = targetWord;
            this.gameInstance.createBoard();
        } else {
            // Otherwise create a new game instance (in a real app)
            console.log("Would create new game with target word:", targetWord);
        }
        
        // Show multiplayer UI elements
        this.showMultiplayerGame();
        this.updateStatus(`Playing against ${this.opponentUsername}`);
        
        // Set up event handlers for opponent moves
        this.simulatedSocket.on('opponent_guess', (data) => {
            this.handleOpponentGuess(data.guess, data.result);
        });
        
        this.simulatedSocket.on('opponent_left', () => {
            alert(`${this.opponentUsername} has left the game`);
            this.exitMultiplayerGame();
        });
    }
    
    // Handle when opponent makes a guess
    handleOpponentGuess(guess, result) {
        // Update opponent's board with their guess
        this.updateOpponentBoard(guess, result);
        
        // Check if they won
        if (result.every(r => r === 'correct')) {
            setTimeout(() => {
                alert(`${this.opponentUsername} has won the game!`);
                this.exitMultiplayerGame();
            }, 1000);
        }
    }
    
    // Submit our guess to the opponent
    submitGuess(guess, result) {
        // In a real app, this would send our guess to the server
        this.simulatedSocket.emit('submit_guess', { guess, result });
        
        // Check if we won
        if (result.every(r => r === 'correct')) {
            setTimeout(() => {
                alert("You won the game!");
                this.exitMultiplayerGame();
            }, 1000);
        }
    }
    
    // Leave the current game
    leaveGame() {
        if (!this.isInMultiplayerGame) return;
        
        // In a real app, this would notify the server
        this.simulatedSocket.emit('leave_game');
            this.exitMultiplayerGame();
    }
    
    // Exit multiplayer mode entirely
    exitMultiplayerGame() {
        this.isInMultiplayerGame = false;
        this.opponentUsername = null;
        this.gameCode = null;
        
        // Hide multiplayer UI
        this.hideMultiplayerGame();
        
        // Clear any timers
        clearTimeout(this.simulatedOpponentGuessTimer);
        
        // Show the main menu again
        this.showMainMenu();
    }
    
    // Create the multiplayer UI elements
    createMultiplayerUI() {
        // Create the multiplayer menu button
        const menuButton = document.createElement('button');
        menuButton.id = 'multiplayer-menu-btn';
        menuButton.textContent = '👥 Play Together';
        menuButton.style.cssText = 'position:fixed;bottom:10px;right:10px;padding:8px 15px;background:#ff9800;color:white;border:none;border-radius:4px;cursor:pointer;z-index:1000;';
        
        menuButton.addEventListener('click', () => {
            this.showMultiplayerMenu();
        });
        
        document.body.appendChild(menuButton);
        
        // Create the multiplayer menu (initially hidden)
        this.createMultiplayerMenu();
    }
    
    // Create the multiplayer menu
    createMultiplayerMenu() {
        // Create the menu container
        const menu = document.createElement('div');
        menu.id = 'multiplayer-menu';
        menu.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:350px;background:white;border-radius:8px;box-shadow:0 0 20px rgba(0,0,0,0.3);overflow:hidden;z-index:1001;display:none;';
        
        // Add header
        const header = document.createElement('div');
        header.style.cssText = 'padding:15px;background:#ff9800;color:white;display:flex;justify-content:space-between;align-items:center;';
        
        const title = document.createElement('h3');
        title.textContent = 'Play Together';
        title.style.margin = '0';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = 'background:none;border:none;color:white;font-size:24px;cursor:pointer;';
        closeBtn.addEventListener('click', () => {
            this.hideMultiplayerMenu();
        });
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        menu.appendChild(header);
        
        // Add content
        const content = document.createElement('div');
        content.style.cssText = 'padding:20px;';
        
        // Random opponent button
        const randomBtn = document.createElement('button');
        randomBtn.textContent = '🎲 Play with Random Opponent';
        randomBtn.style.cssText = 'width:100%;padding:12px;margin-bottom:15px;background:#ff9800;color:white;border:none;border-radius:4px;cursor:pointer;font-size:16px;';
        randomBtn.addEventListener('click', () => {
            this.hideMultiplayerMenu();
            this.findRandomOpponent();
        });
        content.appendChild(randomBtn);
        
        // Create game button
        const createBtn = document.createElement('button');
        createBtn.textContent = '🔑 Create a Game for Friends';
        createBtn.style.cssText = 'width:100%;padding:12px;margin-bottom:15px;background:#2196f3;color:white;border:none;border-radius:4px;cursor:pointer;font-size:16px;';
        createBtn.addEventListener('click', () => {
            this.hideMultiplayerMenu();
            this.createFriendGame();
        });
        content.appendChild(createBtn);
        
        // Join game section
        const joinSection = document.createElement('div');
        joinSection.style.cssText = 'margin-bottom:15px;';
        
        const joinTitle = document.createElement('h4');
        joinTitle.textContent = 'Join a Friend\'s Game';
        joinTitle.style.margin = '0 0 10px 0';
        joinSection.appendChild(joinTitle);
        
        const joinContainer = document.createElement('div');
        joinContainer.style.cssText = 'display:flex;';
        
        const codeInput = document.createElement('input');
        codeInput.id = 'game-code-input';
        codeInput.type = 'text';
        codeInput.placeholder = 'Enter game code';
        codeInput.style.cssText = 'flex:1;padding:10px;border:1px solid #ddd;border-radius:4px 0 0 4px;';
        
        const joinBtn = document.createElement('button');
        joinBtn.textContent = 'Join';
        joinBtn.style.cssText = 'padding:10px 15px;background:#4caf50;color:white;border:none;border-radius:0 4px 4px 0;cursor:pointer;';
        joinBtn.addEventListener('click', () => {
            const code = document.getElementById('game-code-input').value.trim();
            if (code) {
                this.hideMultiplayerMenu();
                this.joinFriendGame(code);
            }
        });
        
        // Handle Enter key in input
        codeInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission
                joinBtn.click();
            }
        });
        
        joinContainer.appendChild(codeInput);
        joinContainer.appendChild(joinBtn);
        joinSection.appendChild(joinContainer);
        content.appendChild(joinSection);
        
        // Friend challenges section
        const challengesSection = document.createElement('div');
        
        const challengesTitle = document.createElement('h4');
        challengesTitle.textContent = 'Friend Challenges';
        challengesTitle.style.margin = '0 0 10px 0';
        challengesSection.appendChild(challengesTitle);
        
        // No challenges message (default)
        const noChallenges = document.createElement('div');
        noChallenges.textContent = 'No challenges from friends yet.';
        noChallenges.style.cssText = 'padding:10px;text-align:center;color:#999;border:1px solid #eee;border-radius:4px;';
        challengesSection.appendChild(noChallenges);
        
        content.appendChild(challengesSection);
        
        menu.appendChild(content);
        
        // Add matchmaking overlay (initially hidden)
        const matchmaking = document.createElement('div');
        matchmaking.id = 'matchmaking-overlay';
        matchmaking.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:1002;display:none;';
        
        const matchmakingStatus = document.createElement('div');
        matchmakingStatus.id = 'matchmaking-status';
        matchmakingStatus.textContent = 'Finding an opponent...';
        matchmakingStatus.style.cssText = 'color:white;font-size:24px;margin-bottom:20px;';
        matchmaking.appendChild(matchmakingStatus);
        
        const spinner = document.createElement('div');
        spinner.style.cssText = 'width:50px;height:50px;border:5px solid #f3f3f3;border-top:5px solid #ff9800;border-radius:50%;animation:spin 1s linear infinite;';
        matchmaking.appendChild(spinner);
        
        const gameCode = document.createElement('div');
        gameCode.id = 'game-code-display';
        gameCode.style.cssText = 'color:white;font-size:28px;margin-top:20px;font-weight:bold;display:none;';
        matchmaking.appendChild(gameCode);
        
        const gameCodeInstructions = document.createElement('div');
        gameCodeInstructions.style.cssText = 'color:#ccc;margin-top:10px;display:none;';
        gameCodeInstructions.textContent = 'Share this code with a friend';
        gameCodeInstructions.id = 'game-code-instructions';
        matchmaking.appendChild(gameCodeInstructions);
        
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancel-matchmaking-btn';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = 'margin-top:30px;padding:10px 20px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;';
        cancelBtn.addEventListener('click', () => {
            this.cancelMatchmaking();
        });
        matchmaking.appendChild(cancelBtn);
        
        // Opponent's game board (initially hidden)
        const opponentBoard = document.createElement('div');
        opponentBoard.id = 'opponent-board';
        opponentBoard.style.cssText = 'position:fixed;top:60px;right:20px;width:200px;background:rgba(255,255,255,0.9);border-radius:8px;box-shadow:0 0 10px rgba(0,0,0,0.2);padding:10px;z-index:1000;display:none;';
        
        const opponentTitle = document.createElement('div');
        opponentTitle.id = 'opponent-name';
        opponentTitle.style.cssText = 'font-weight:bold;margin-bottom:10px;text-align:center;';
        opponentTitle.textContent = 'Opponent';
        opponentBoard.appendChild(opponentTitle);
        
        const opponentGrid = document.createElement('div');
        opponentGrid.id = 'opponent-grid';
        opponentGrid.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:5px;';
        opponentBoard.appendChild(opponentGrid);
        
        // Style for the animation
        const style = document.createElement('style');
        style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
        
        // Add everything to the body
        document.head.appendChild(style);
        document.body.appendChild(menu);
        document.body.appendChild(matchmaking);
        document.body.appendChild(opponentBoard);
    }
    
    // Show the multiplayer menu
    showMultiplayerMenu() {
        document.getElementById('multiplayer-menu').style.display = 'block';
    }
    
    // Hide the multiplayer menu
    hideMultiplayerMenu() {
        document.getElementById('multiplayer-menu').style.display = 'none';
    }
    
    // Show matchmaking overlay
    showMatchmaking() {
        document.getElementById('matchmaking-overlay').style.display = 'flex';
    }
    
    // Hide matchmaking overlay
    hideMatchmaking() {
        document.getElementById('matchmaking-overlay').style.display = 'none';
        document.getElementById('game-code-display').style.display = 'none';
        document.getElementById('game-code-instructions').style.display = 'none';
    }
    
    // Show game code for friends to join
    showGameCode(code) {
        const codeDisplay = document.getElementById('game-code-display');
        codeDisplay.textContent = code;
        codeDisplay.style.display = 'block';
        document.getElementById('game-code-instructions').style.display = 'block';
    }
    
    // Show the multiplayer game UI
    showMultiplayerGame() {
        const opponentBoard = document.getElementById('opponent-board');
        opponentBoard.style.display = 'block';
        
        // Set opponent name
        document.getElementById('opponent-name').textContent = this.opponentUsername;
        
        // Clear and create opponent grid
        const grid = document.getElementById('opponent-grid');
        grid.innerHTML = '';
        
        // Create empty grid for opponent (assuming 5x6 grid for normal difficulty)
        for (let i = 0; i < 6; i++) { // 6 attempts
            for (let j = 0; j < 5; j++) { // 5 letters
                const cell = document.createElement('div');
                cell.style.cssText = 'aspect-ratio:1;background:#ddd;border-radius:4px;';
                cell.dataset.row = i;
                cell.dataset.col = j;
                grid.appendChild(cell);
            }
        }
    }
    
    // Hide the multiplayer game UI
    hideMultiplayerGame() {
        document.getElementById('opponent-board').style.display = 'none';
    }
    
    // Show main menu
    showMainMenu() {
        // In a real implementation, this would show the main menu
        console.log("Would show main menu");
    }
    
    // Update opponent's board with their guess
    updateOpponentBoard(guess, result, attemptNumber) {
        const row = attemptNumber || this.currentOpponentAttempt || 0;
        this.currentOpponentAttempt = (this.currentOpponentAttempt || 0) + 1;
        
        // Get the grid
        const grid = document.getElementById('opponent-grid');
        
        // Update the cells for this row
        for (let i = 0; i < guess.length; i++) {
            const cell = grid.querySelector(`[data-row="${row}"][data-col="${i}"]`);
            if (cell) {
                cell.textContent = guess[i];
                
                // Apply color based on result
                if (result[i] === 'correct') {
                    cell.style.backgroundColor = '#6aaa64';
                    cell.style.color = 'white';
                } else if (result[i] === 'present') {
                    cell.style.backgroundColor = '#c9b458';
                    cell.style.color = 'white';
                } else {
                    cell.style.backgroundColor = '#787c7e';
                    cell.style.color = 'white';
                }
            }
        }
    }
    
    // Update status message
    updateStatus(message) {
        const statusElement = document.getElementById('matchmaking-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
}

// Initialize the multiplayer system
function initializeMultiplayer() {
    // Create the multiplayer game instance
    window.multiplayerGame = new MultiplayerGame();
    
    // Wait for dictionary to load
    const waitForDictionary = setInterval(() => {
        if (window.DICTIONARY_LOADED) {
            clearInterval(waitForDictionary);
            console.log("Dictionary loaded, multiplayer system ready");
        }
    }, 100);
    
    // If we have a game instance, connect it to the multiplayer system
    if (window.gameManager && window.gameManager.currentGame) {
        // Connect the guess submission
        const originalCheckWord = window.gameManager.currentGame.checkWord;
        
        window.gameManager.currentGame.checkWord = function() {
            // Call the original method first
            const result = originalCheckWord.apply(this, arguments);
            
            // If in multiplayer and the guess was valid, submit it
            if (result && window.multiplayerManager.isInMultiplayerGame) {
                const currentRow = this.currentRow - 1;
                const tiles = this.getRowTiles(currentRow);
                const guess = tiles.map(tile => tile.textContent).join('');
                
                // Extract the result from tile states
                const tileResults = tiles.map(tile => {
                    const state = this.getTileState(tile);
                    if (state === 'correct') return 'correct';
                    if (state === 'present') return 'present';
                    return 'absent';
                });
                
                window.multiplayerManager.submitGuess(guess, tileResults);
            }
            
            return result;
        };
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize immediately
    initializeMultiplayer();
    
    // Also expose the initialization function globally
    window.initializeMultiplayer = initializeMultiplayer;
});

// Multiplayer Game Management System
class MultiplayerGame {
    constructor() {
        this.gameState = {
            wordLength: 5,
            word: '',
            players: {
                player1: null,
                player2: null
            },
            currentTurn: null,
            gameResults: {
                player1: null,
                player2: null
            }
        };
        
        // Points for winning/losing
        this.POINTS = {
            WIN: 50,
            LOSE: -25,
            BONUS_PER_REMAINING_TRY: 10
        };
    }
    
    // Start a new game between two players
    startGame(player1Username, player2Username, wordLength) {
        if (!window.userManager) {
            console.error("User Manager not found");
            return { success: false, message: "Game system not initialized" };
        }
        
        // Validate players
        const player1 = window.userManager.getUserByUsername(player1Username);
        const player2 = window.userManager.getUserByUsername(player2Username);
        
        if (!player1 || !player2) {
            return { success: false, message: "One or both players not found" };
        }
        
        // Validate word length
        if (![4,5,6,7,8].includes(wordLength)) {
            return { success: false, message: "Invalid word length. Must be between 4 and 8." };
        }
        
        // Initialize game state
        this.gameState = {
            wordLength: wordLength,
            word: this.selectRandomWord(wordLength),
            players: {
                player1: {
                    username: player1Username,
                    guesses: [],
                    completed: false,
                    remainingTries: 6,
                    startTime: null,
                    endTime: null
                },
                player2: {
                    username: player2Username,
                    guesses: [],
                    completed: false,
                    remainingTries: 6,
                    startTime: null,
                    endTime: null
                }
            },
            currentTurn: player1Username,
            gameResults: {
                player1: null,
                player2: null
            }
        };
        
        // Save initial game state
        this.saveGameState();
        
        return {
            success: true,
            message: "Game started!",
            wordLength: wordLength,
            opponent: player2Username
        };
    }
    
    // Select a random word of given length
    selectRandomWord(length) {
        // Get all words of the specified length
        const words = Array.from(window.WORDS_ALPHA).filter(word => word.length === length);
        if (words.length === 0) {
            console.error(`No ${length}-letter words found`);
            return null;
        }
        
        // Select random word
        return words[Math.floor(Math.random() * words.length)];
    }
    
    // Check a guess against the target word
    checkGuess(guess) {
        const target = this.gameState.word;
        const result = new Array(guess.length).fill('wrong');
        const letterCounts = {};
        
        // Count letters in target word
        for (const letter of target) {
            letterCounts[letter] = (letterCounts[letter] || 0) + 1;
        }
        
        // First pass: check for correct positions
        for (let i = 0; i < guess.length; i++) {
            if (guess[i] === target[i]) {
                result[i] = 'correct';
                letterCounts[guess[i]]--;
            }
        }
        
        // Second pass: check for present but wrong position
        for (let i = 0; i < guess.length; i++) {
            if (result[i] !== 'correct' && letterCounts[guess[i]] > 0) {
                result[i] = 'misplaced';
                letterCounts[guess[i]]--;
            }
        }
        
        return result;
    }
    
    // Global debug function to test dictionary lookup
    isWordInDictionary(word) {
        if (!word) return false;
        word = word.toUpperCase();
        
        // Log dictionary size
        console.log(`Dictionary check: ${window.WORDS_ALPHA ? window.WORDS_ALPHA.size : 0} words loaded`);
        
        // Direct check in WORDS_ALPHA
        if (window.WORDS_ALPHA && window.WORDS_ALPHA.size > 0) {
            const result = window.WORDS_ALPHA.has(word);
            console.log(`Checking '${word}' in dictionary: ${result ? 'FOUND' : 'NOT FOUND'}`);
            return result || window.ACCEPT_ALL_WORDS;
        }
        
        // If we have a global function, use it
        if (typeof window.isWordInDictionary === 'function') {
            const result = window.isWordInDictionary(word);
            console.log(`Using global isWordInDictionary for '${word}': ${result ? 'VALID' : 'INVALID'}`);
            return result;
        }
        
        // Default fallback - we'll accept the word if all else fails
        console.log(`No dictionary available to check '${word}' - accepting by default`);
        return true;
    }
    
    // Make a guess
    makeGuess(username, guess) {
        if (!this.gameState.word) {
            return { success: false, message: "No active game" };
        }
        
        // Get player data
        const playerKey = this.gameState.players.player1.username === username ? 'player1' : 'player2';
        const player = this.gameState.players[playerKey];
        
        if (!player) {
            return { success: false, message: "Player not found in game" };
        }
        
        if (player.completed) {
            return { success: false, message: "You've already completed your game" };
        }
        
        // Set start time on first guess
        if (!player.startTime) {
            player.startTime = new Date().toISOString();
        }
        
        // Validate guess
        guess = guess.toUpperCase();
        if (guess.length !== this.gameState.wordLength) {
            return { success: false, message: "Invalid guess length" };
        }
        
        // Check if word is in dictionary - improved validation
        const inDictionary = this.isWordInDictionary(guess);
        if (!inDictionary && !window.ACCEPT_ALL_WORDS) {
            return { success: false, message: "Not in word list" };
        }
        
        // Add guess and check result
        const result = this.checkGuess(guess);
        player.guesses.push({ word: guess, result: result });
        player.remainingTries--;
        
        // Check if player has won or lost
        const isCorrect = guess === this.gameState.word;
        if (isCorrect || player.remainingTries === 0) {
            player.completed = true;
            player.endTime = new Date().toISOString();
            this.gameState.gameResults[playerKey] = {
                won: isCorrect,
                tries: 6 - player.remainingTries,
                time: (new Date(player.endTime) - new Date(player.startTime)) / 1000
            };
            
            // If both players are done, calculate final results
            if (this.gameState.players.player1.completed && this.gameState.players.player2.completed) {
                this.finalizeGame();
            }
        }
        
        // Save game state
        this.saveGameState();
        
        return {
            success: true,
            result: result,
            remainingTries: player.remainingTries,
            isCorrect: isCorrect,
            isGameOver: player.completed,
            gameResults: player.completed ? this.gameState.gameResults : null
        };
    }
    
    // Finalize game and update player stats
    finalizeGame() {
        const p1Results = this.gameState.gameResults.player1;
        const p2Results = this.gameState.gameResults.player2;
        
        // Determine winner
        let winner = null;
        if (p1Results.won && !p2Results.won) {
            winner = this.gameState.players.player1.username;
        } else if (p2Results.won && !p1Results.won) {
            winner = this.gameState.players.player2.username;
        } else if (p1Results.won && p2Results.won) {
            // If both won, compare tries then time
            if (p1Results.tries < p2Results.tries) {
                winner = this.gameState.players.player1.username;
            } else if (p2Results.tries < p1Results.tries) {
                winner = this.gameState.players.player2.username;
            } else if (p1Results.time < p2Results.time) {
                winner = this.gameState.players.player1.username;
            } else {
                winner = this.gameState.players.player2.username;
            }
        }
        
        // Update player stats
        if (winner) {
            const winnerPlayer = window.userManager.getUserByUsername(winner);
            const loserPlayer = window.userManager.getUserByUsername(
                winner === this.gameState.players.player1.username ? 
                this.gameState.players.player2.username : 
                this.gameState.players.player1.username
            );
            
            // Calculate bonus points for remaining tries
            const winnerResults = winner === this.gameState.players.player1.username ? p1Results : p2Results;
            const bonusPoints = winnerResults.remainingTries * this.POINTS.BONUS_PER_REMAINING_TRY;
            
            // Update winner stats
            if (!winnerPlayer.stats.multiplayer) {
                winnerPlayer.stats.multiplayer = {
                    gamesPlayed: 0,
                    gamesWon: 0,
                    totalPoints: 0
                };
            }
            winnerPlayer.stats.multiplayer.gamesPlayed++;
            winnerPlayer.stats.multiplayer.gamesWon++;
            winnerPlayer.stats.multiplayer.totalPoints += (this.POINTS.WIN + bonusPoints);
            
            // Update loser stats
            if (!loserPlayer.stats.multiplayer) {
                loserPlayer.stats.multiplayer = {
                    gamesPlayed: 0,
                    gamesWon: 0,
                    totalPoints: 0
                };
            }
            loserPlayer.stats.multiplayer.gamesPlayed++;
            loserPlayer.stats.multiplayer.totalPoints += this.POINTS.LOSE;
            
            // Save changes
            window.userManager.saveUserDataToStorage();
        }
        
        return {
            winner: winner,
            results: this.gameState.gameResults
        };
    }
    
    // Save game state to storage
    saveGameState() {
        try {
            localStorage.setItem('multiplayer_game_state', JSON.stringify(this.gameState));
        } catch (err) {
            console.error("Error saving game state:", err);
        }
    }
    
    // Load game state from storage
    loadGameState() {
        try {
            const state = localStorage.getItem('multiplayer_game_state');
            if (state) {
                this.gameState = JSON.parse(state);
                return true;
            }
        } catch (err) {
            console.error("Error loading game state:", err);
        }
        return false;
    }
    
    // Get current game state for a player
    getGameState(username) {
        if (!this.gameState.word) {
            return null;
        }
        
        const playerKey = this.gameState.players.player1.username === username ? 'player1' : 'player2';
        const player = this.gameState.players[playerKey];
        
        if (!player) {
            return null;
        }
        
        return {
            wordLength: this.gameState.wordLength,
            guesses: player.guesses,
            remainingTries: player.remainingTries,
            completed: player.completed,
            gameResults: player.completed ? this.gameState.gameResults : null
        };
    }
}

// Initialize multiplayer system
document.addEventListener('DOMContentLoaded', function() {
    window.multiplayerGame = new MultiplayerGame();
});
