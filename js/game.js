
window.S_WORDS = new Set();
window.S_WORDS_LOADED = false;

fetch('s.txt')
  .then(res => {
    if (!res.ok) throw new Error(res.statusText);
    return res.text();
  })
  .then(text => {
    text.split(/\r?\n/).forEach(line => {
      const w = line.trim().toUpperCase();
      if (w) window.S_WORDS.add(w);
    });
    window.S_WORDS_LOADED = true;
    console.log(`Loaded ${window.S_WORDS.size} target words from s.txt`);
  })
  .catch(err => console.error('Error loading s.txt:', err));
class WordleGame {
    constructor(gameContentContainer) {
        console.log("WordleGame constructor called, container:", gameContentContainer);
        this.difficulty = 'medium';
        this.maxAttempts = 6;
        this.currentAttempt = 0;
        this.currentWord = '';
        this.gameOver = false;
        this.targetWord = '';
        this.stats = null;
        this.points = 0;
        this._boundKeyHandler = null;
        this.usedWords = new Set();

        if (!gameContentContainer) {
            console.error("WordleGame requires a container element!");
            return;
        }
        this.parentContainer = gameContentContainer;
        
        this.boardElement = document.createElement('div');
        this.boardElement.id = 'game-board';
        this.boardElement.style.cssText = 'display:flex;flex-direction:column;gap:5px;margin-bottom:30px;';
        
        this.keyboardElement = document.createElement('div');
        this.keyboardElement.id = 'keyboard';
        this.keyboardElement.style.cssText = 'display:flex;flex-direction:column;gap:8px;width:100%;max-width:500px;';
        
        this.messageElement = document.createElement('div');
        this.messageElement.id = 'message';
        this.messageElement.className = 'hidden';
        
        this.modalElement = document.getElementById('modal');
        if (!this.modalElement) {
             console.warn("Modal element not found, creating locally. Might cause issues.");
             this.modalElement = document.createElement('div');
             this.modalElement.id = 'modal';
             this.modalElement.className = 'modal hidden';
             this.modalElement.innerHTML = `
                 <div class="modal-content">
                     <h2 id="modal-title"></h2>
                     <p id="modal-message"></p>
                     <button id="modal-close">Next Word</button>
                 </div>
             `;
             document.body.appendChild(this.modalElement);
        } else {
             console.log("Reusing modal element from GameManager.");
        }
        
        this.parentContainer.appendChild(this.boardElement);
        this.parentContainer.appendChild(this.keyboardElement);
        this.parentContainer.appendChild(this.messageElement);
        
        this.createKeyboard();
        
        this.setupEventListeners();
        
        console.log("WordleGame initialized within provided container.");
    }

    createKeyboard() {
        this.keyboardElement.innerHTML = '';
        
        const keyRows = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
        ];
        
        keyRows.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'display:flex;justify-content:center;gap:6px;';
            
            row.forEach(key => {
                const button = document.createElement('button');
                button.textContent = key === 'BACKSPACE' ? '⌫' : key;
                button.dataset.key = key;
                button.style.cssText = 'min-width:40px;height:58px;padding:0 10px;font-size:1.1em;font-weight:bold;background:#d3d6da;border:none;border-radius:4px;cursor:pointer;text-transform:uppercase;';
                
                if (key === 'ENTER' || key === 'BACKSPACE') {
                    button.style.width = '65px';
                }
                
                rowDiv.appendChild(button);
            });
            
            this.keyboardElement.appendChild(rowDiv);
        });
    }

    setupEventListeners() {
        console.log("Setting up event listeners");
        
        const handleKeyDown = (e) => {
            if (this.gameOver) return;
            
            const key = e.key.toUpperCase();
            console.log(`Key pressed: ${key}`);
            
            if (key === 'ENTER') {
                this.checkWord();
                e.preventDefault();
            } else if (key === 'BACKSPACE') {
                this.currentWord = this.currentWord.slice(0, -1);
                this.updateBoard();
                e.preventDefault();
            } else if (/^[A-Z]$/.test(key) && this.currentWord.length < this.targetWord.length) {
                this.currentWord += key;
                this.updateBoard();
                e.preventDefault();
            }
            
            this.saveGameState();
        };
        
        document.removeEventListener('keydown', this._boundKeyHandler);
        this._boundKeyHandler = handleKeyDown.bind(this);
        document.addEventListener('keydown', this._boundKeyHandler);

        this.keyboardElement.addEventListener('click', (e) => {
            if (this.gameOver) return;
            
            const button = e.target.closest('button');
            if (!button) return;
            
            const key = button.dataset.key;
            console.log(`Virtual keyboard click: ${key}`);
            
            if (key === 'ENTER') {
                this.checkWord();
            } else if (key === 'BACKSPACE') {
                this.currentWord = this.currentWord.slice(0, -1);
                this.updateBoard();
            } else if (/^[A-Z]$/.test(key) && this.currentWord.length < this.targetWord.length) {
                this.currentWord += key;
                this.updateBoard();
            }
            
            this.saveGameState();
        });

        const closeButton = this.modalElement.querySelector('#modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.modalElement.classList.add('hidden');
                this.startNewGame();
            });
        }
    }

    saveGameState() {
        const gameState = {
            difficulty: this.difficulty,
            currentAttempt: this.currentAttempt,
            currentWord: this.currentWord,
            gameOver: this.gameOver,
            targetWord: this.targetWord,
            points: this.points,
            stats: this.stats,
            boardState: this.getBoardState()
        };
        
        localStorage.setItem('wordleGameState', JSON.stringify(gameState));
        console.log("Game state saved");
    }

    loadGameState() {
        const savedState = localStorage.getItem('wordleGameState');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            this.difficulty = gameState.difficulty;
            this.currentAttempt = gameState.currentAttempt;
            this.currentWord = gameState.currentWord;
            this.gameOver = gameState.gameOver;
            this.targetWord = gameState.targetWord;
            this.points = gameState.points;
            this.stats = gameState.stats;
            this.boardState = gameState.boardState;
            console.log("Game state loaded");
        }
    }

    getBoardState() {
        if (!this.boardElement) return [];
        
        const boardState = [];
        const rows = this.boardElement.children;
        
        for (let i = 0; i < rows.length; i++) {
            const rowState = [];
            const tiles = rows[i].children;
            
            for (let j = 0; j < tiles.length; j++) {
                const tile = tiles[j];
                rowState.push({
                    letter: tile.textContent,
                    state: this.getTileState(tile)
                });
            }
            
            boardState.push(rowState);
        }
        
        return boardState;
    }

    getTileState(tile) {
        if (tile.classList.contains('correct')) return 'correct';
        if (tile.classList.contains('present')) return 'present';
        if (tile.classList.contains('absent')) return 'absent';
        return '';
    }

    restoreGameBoard() {
        if (!this.boardState || !this.boardElement) return;
        
        this.boardState.forEach((rowState, i) => {
            const row = this.boardElement.children[i];
            if (!row) return;
            
            rowState.forEach((tileState, j) => {
                const tile = row.children[j];
                if (!tile) return;
                
                tile.textContent = tileState.letter;
                if (tileState.state) {
                    tile.classList.add(tileState.state);
                    // Apply background color based on state (ensure correct CSS exists)
                    switch (tileState.state) {
                        case 'correct': tile.style.backgroundColor = 'var(--correct-color)'; break;
                        case 'present': tile.style.backgroundColor = 'var(--present-color)'; break;
                        case 'absent': tile.style.backgroundColor = 'var(--absent-color)'; break;
                    }
                    if (tileState.state !== '' && tileState.state !== 'filled') {
                         tile.style.color = 'white'; 
                    }
                }
            });
        });
        // Restore keyboard colors based on all past guesses
        this.updateKeyboardBasedOnBoardState();
    }

    updateKeyboardBasedOnBoardState() {
        const letterStates = {}; // Track highest state for each letter ('correct' > 'present' > 'absent')
        if (!this.boardState) return;

        this.boardState.forEach(row => {
            row.forEach(tile => {
                if (tile.letter && tile.state) {
                    const current = letterStates[tile.letter];
                    if (tile.state === 'correct') {
                        letterStates[tile.letter] = 'correct';
                    } else if (tile.state === 'present' && current !== 'correct') {
                        letterStates[tile.letter] = 'present';
                    } else if (tile.state === 'absent' && !current) {
                        letterStates[tile.letter] = 'absent';
                    }
                }
            });
        });

        // Apply states to keyboard
        if (this.keyboardElement) {
            Object.entries(letterStates).forEach(([letter, state]) => {
                const key = this.keyboardElement.querySelector(`button[data-key="${letter}"]`);
                if (key) {
                    key.classList.remove('correct', 'present', 'absent'); // Clear previous
                    key.classList.add(state);
                    // Apply styles directly too
                     switch (state) {
                         case 'correct': key.style.backgroundColor = 'var(--correct-color)'; key.style.color = 'white'; break;
                         case 'present': key.style.backgroundColor = 'var(--present-color)'; key.style.color = 'white'; break;
                         case 'absent': key.style.backgroundColor = 'var(--absent-color)'; key.style.color = 'white'; break;
                     }
                }
            });
        }
    }

    startNewGame() {
        console.log("Starting new game with difficulty:", this.difficulty);
        this.gameOver = false;
        this.currentAttempt = 0;
        this.currentWord = '';
        
        // Ensure the word list is loaded
        this.ensureWordsLoaded();
        
        // Get target word (this now uses the usedWords set)
        this.targetWord = this.getTargetWord();
        
        if (!this.targetWord) {
            console.error("Failed to get a target word for difficulty:", this.difficulty);
            this.showMessage("Error: Could not start game. No word found.");
            
            // Try once more with a manually defined word
            this.targetWord = this.getFallbackWord();
            if (!this.targetWord) {
                this.gameOver = true;
                return;
            }
        }
        console.log("Target word:", this.targetWord);
        
        // Ensure board element exists before clearing/creating
        if (!this.boardElement) {
             console.error("Board element is missing, cannot create board.");
             return;
        }
        this.boardElement.innerHTML = ''; // Clear previous board
        this.createBoard(); // Create new board structure
        
        // Reset keyboard colors
        if (this.keyboardElement) {
            const keys = this.keyboardElement.querySelectorAll('button');
            keys.forEach(key => {
                key.classList.remove('correct', 'present', 'absent');
                key.style.backgroundColor = 'var(--key-bg, #d3d6da)'; // Reset to default background
                key.style.color = 'black'; // Reset text color
            });
        }
        
        this.saveGameState(); // Save the initial state of the new game
    }
    
    // Ensure that we have words loaded
    ensureWordsLoaded() {
        if (typeof window.WORDS_ALPHA === 'undefined' || !window.WORDS_ALPHA || window.WORDS_ALPHA.size === 0) {
            console.warn("Word list not loaded, creating fallback word list");
            
            // Create a fallback word list
            window.WORDS_ALPHA = new Set();
            
            // Add words based on difficulty
            const fallbackWords = {
                'easy': ['CAKE', 'FISH', 'TIME', 'BALL', 'DUCK', 'FROG', 'JUMP', 'KIND', 'LAKE', 'MOON'],
                'medium': ['APPLE', 'BEACH', 'CRANE', 'FRESH', 'GRAPE', 'HOUSE', 'LEMON', 'PLANT', 'STEAM', 'WORLD'],
                'hard': ['ADJUST', 'BRONZE', 'CLOUDY', 'FACTOR', 'GLOBAL', 'IMAGES', 'OXYGEN', 'PUZZLE', 'SYSTEM', 'VOYAGE'],
                'expert': ['ABANDON', 'BENEATH', 'DISPLAY', 'EXAMPLE', 'FITNESS', 'JOURNEY', 'MANAGER', 'NETWORK', 'PACKAGE', 'QUALITY']
            };
            
            // Add all fallback words to the global set
            Object.values(fallbackWords).forEach(wordList => {
                wordList.forEach(word => window.WORDS_ALPHA.add(word));
            });
            
            console.log("Created fallback word list with", window.WORDS_ALPHA.size, "words");
            
            // Try to load the dictionary.js script
            this.loadDictionaryScript();
        }
    }
    
    // Load the dictionary script if needed
    loadDictionaryScript() {
        if (document.getElementById('dictionary-script')) {
            return; // Already loaded or loading
        }
        
        const script = document.createElement('script');
        script.id = 'dictionary-script';
        script.src = 'js/dictionary.js';
        script.onload = () => {
            console.log("Dictionary script loaded");
            // Reload the game if we're still on the first attempt
            if (this.currentAttempt === 0 && !this.gameOver) {
                this.startNewGame();
            }
        };
        document.head.appendChild(script);
    }
    
    // Get the target word, avoiding used words
    getTargetWord() {
        const lengthMap = { easy: 4, medium: 5, hard: 6, expert: 7 };
        const wordLength = lengthMap[this.difficulty] || 5;
      
        // ← the only change is here:
        const source = window.S_WORDS_LOADED
          ? window.S_WORDS
          : window.WORDS_ALPHA;
      
        const candidates = Array.from(source).filter(w => w.length === wordLength);
      
        if (!candidates.length) {
          console.error(`No words of length ${wordLength}`);
          return this.getFallbackWord();
        }
      
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
      
    
    
    // Get a fallback word if all else fails
    getFallbackWord() {
        const fallbackWordsByDifficulty = {
            'easy': ['CAKE', 'FISH', 'TIME', 'BALL', 'DUCK'],
            'medium': ['APPLE', 'BEACH', 'CRANE', 'FRESH', 'GRAPE'],
            'hard': ['ADJUST', 'BRONZE', 'CLOUDY', 'FACTOR', 'GLOBAL'],
            'expert': ['ABANDON', 'BENEATH', 'DISPLAY', 'EXAMPLE', 'FITNESS']
        };
        
        const words = fallbackWordsByDifficulty[this.difficulty] || fallbackWordsByDifficulty['medium'];
        const randomIndex = Math.floor(Math.random() * words.length);
        
        console.log("Using fallback word:", words[randomIndex]);
        return words[randomIndex];
    }

    createBoard() {
        console.log("Creating game board");
        const wordLength = this.targetWord.length;
        for (let i = 0; i < this.maxAttempts; i++) {
            const row = document.createElement('div');
            row.className = 'board-row';
            
            for (let j = 0; j < wordLength; j++) {
                const tile = document.createElement('div');
                tile.className = 'board-tile';
                row.appendChild(tile);
            }
            
            this.boardElement.appendChild(row);
        }
        
        this.createKeyboard();
        
        this.parentContainer.appendChild(this.boardElement);
        this.parentContainer.appendChild(this.keyboardElement);
    }
    
    getWordValidationInfo(word) {
        if (!word) return { isValid: false, reason: "No word entered", inDictionary: false };
        
        const upperWord = word.toUpperCase();
        
        if (upperWord.length < this.targetWord.length) {
            return { 
                isValid: false, 
                reason: "Too short",
                inDictionary: false
            };
        }
        
        if (upperWord.length > this.targetWord.length) {
            return { 
                isValid: false, 
                reason: "Too long",
                inDictionary: false
            };
        }
        
        const inDict = window.WORDS_ALPHA ? window.WORDS_ALPHA.has(upperWord) : false;
        const acceptAnyMode = window.ACCEPT_ALL_WORDS || false;
        
        if (!inDict && !acceptAnyMode) {
            return { 
                isValid: false, 
                reason: "Not in dictionary",
                inDictionary: false
            };
        }
        
        return { 
            isValid: true, 
            reason: inDict ? "Valid word" : "Accepted (bypass mode)",
            inDictionary: inDict
        };
    }

    showMessage(text, duration = 2000) {
        if (!this.messageElement) {
            this.messageElement = document.createElement('div');
            this.messageElement.id = 'message';
            this.messageElement.className = 'hidden';
            document.body.appendChild(this.messageElement);
        }
        
        this.messageElement.textContent = text;
        this.messageElement.classList.remove('hidden');
        setTimeout(() => {
            this.messageElement.classList.add('hidden');
        }, duration);
    }

    showModal(title, message) {
        if (!this.modalElement) {
            this.modalElement = document.createElement('div');
            this.modalElement.id = 'modal';
            this.modalElement.className = 'modal hidden';
            this.modalElement.innerHTML = `
                <div class="modal-content">
                    <h2 id="modal-title"></h2>
                    <p id="modal-message"></p>
                    <button id="modal-close">Close</button>
                </div>
            `;
            document.body.appendChild(this.modalElement);
            
            this.modalElement.querySelector('#modal-close').addEventListener('click', () => {
                this.modalElement.classList.add('hidden');
            });
        }
        
        this.modalElement.querySelector('#modal-title').textContent = title;
        this.modalElement.querySelector('#modal-message').textContent = message;
        this.modalElement.classList.remove('hidden');
    }

    updateBoard() {
        if (!this.boardElement) return;
        
        const row = this.boardElement.children[this.currentAttempt];
        if (!row) return;
        
        const tiles = row.children;
        const wordLength = this.targetWord.length;

        for (let i = 0; i < wordLength; i++) {
            tiles[i].textContent = '';
            tiles[i].className = 'board-tile';
        }

        for (let i = 0; i < this.currentWord.length; i++) {
            tiles[i].textContent = this.currentWord[i];
            tiles[i].classList.add('filled');
        }
        
        console.log(`Updated board - current word: "${this.currentWord}" (${this.currentWord.length} letters), target length: ${wordLength}`);
    }

    getCurrentWord() {
        return this.currentWord.toUpperCase();
    }

    checkWord() {
        const currentWord = this.getCurrentWord();
        console.log(`CheckWord called with: "${currentWord}" (${currentWord.length} letters), target: ${this.targetWord} (${this.targetWord.length} letters)`);
        
        if (currentWord.length < this.targetWord.length) {
            console.log(`Word "${currentWord}" is too short (${currentWord.length}/${this.targetWord.length})`);
            this.showMessage("Not enough letters");
            return false;
        }
        
        if (currentWord.length > this.targetWord.length) {
            console.log(`Word "${currentWord}" is too long (${currentWord.length}/${this.targetWord.length})`);
            this.showMessage("Too many letters");
            return false;
        }

        const upperWord = currentWord.toUpperCase();
        
        if (window.WORDS_ALPHA && window.WORDS_ALPHA.size > 0) {
            const inDictionary = window.WORDS_ALPHA.has(upperWord);
            
            if (!inDictionary) {
                this.showMessage("Not in word list");
                return false;
            }
        } 
        else if (typeof window.isWordInDictionary === 'function') {
            const isValid = window.isWordInDictionary(currentWord);
            
            if (!isValid) {
                this.showMessage("Not in word list");
                return false;
            }
        }

        const result = [];
        const targetLetters = this.targetWord.split('');
        const guessLetters = currentWord.split('');
        
        for (let i = 0; i < guessLetters.length; i++) {
            if (guessLetters[i] === targetLetters[i]) {
                result[i] = 'correct';
                targetLetters[i] = null;
                guessLetters[i] = null;
            }
        }
        
        for (let i = 0; i < guessLetters.length; i++) {
            if (guessLetters[i] === null) continue;
            
            const targetIndex = targetLetters.indexOf(guessLetters[i]);
            if (targetIndex !== -1) {
                result[i] = 'present';
                targetLetters[targetIndex] = null;
            } else {
                result[i] = 'absent';
            }
        }
        
        this.updateKeyboardColors(currentWord, result);
        
        this.addGuessToBoard(currentWord, result);
        
        this.saveGameState();
        
        if (result.every(r => r === 'correct')) {
            this.handleWin();
            return true;
        }
        
        if (this.currentAttempt >= this.maxAttempts - 1) {
            this.handleLoss();
            return true;
        }
        
        this.currentAttempt++;
        this.currentWord = '';
        this.updateBoard();
        
        return true;
    }

    handleWin() {
        this.gameOver = true;
        
        // Update stats (excluding points, handled by GameManager)
        if (this.stats) {
            this.stats.gamesPlayed = (this.stats.gamesPlayed || 0) + 1;
            this.stats.gamesWon = (this.stats.gamesWon || 0) + 1;
            this.stats.currentStreak = (this.stats.currentStreak || 0) + 1;
            this.stats.maxStreak = Math.max(this.stats.maxStreak || 0, this.stats.currentStreak);
        }
        
        setTimeout(() => {
            this.showModal('Congratulations!', 
                `You won in ${this.currentAttempt + 1} ${this.currentAttempt === 0 ? 'try' : 'tries'}!`);
        }, 1500);
    }

    handleLoss() {
        this.gameOver = true;
        
        // Update stats if available
        if (this.stats) {
            this.stats.gamesPlayed++;
            this.stats.currentStreak = 0;
        }

        setTimeout(() => {
            this.showModal('Game Over', 
                `The word was ${this.targetWord}. Better luck next time!`);
        }, 1500);
    }

    calculatePoints(difficulty, attemptsUsed) {
        // Base points by difficulty
        const difficultyPoints = {
            'easy': 100,
            'medium': 200,
            'hard': 300,
            'expert': 500
        };
        
        // More points for fewer attempts
        // Maximum points if solved in 1 attempt, minimum if used all attempts
        const attemptMultiplier = Math.max(0, (this.maxAttempts - attemptsUsed + 1)) / this.maxAttempts;
        
        // Calculate and round points
        return Math.round(difficultyPoints[difficulty] * (1 + attemptMultiplier));
    }

    addGuessToBoard(word, result) {
        const row = this.boardElement.children[this.currentAttempt];
        if (!row) return;
        
        const tiles = row.children;
        
        for (let i = 0; i < word.length; i++) {
            const tile = tiles[i];
            tile.textContent = word[i];
            tile.classList.add(result[i]);
            
            // Animate the tile
            setTimeout(() => {
                tile.classList.add('revealed');
            }, i * 100);
        }
    }
    
    updateKeyboardColors(word, result) {
        if (!this.keyboardElement) return;
        
        for (let i = 0; i < word.length; i++) {
            const letter = word[i];
            const status = result[i];
            const key = this.keyboardElement.querySelector(`button[data-key="${letter}"]`);
            
            if (key) {
                // Update only if the new status is better than current
                if (status === 'correct') {
                    key.className = 'correct';
                    key.style.background = '#6aaa64';
                    key.style.color = 'white';
                } else if (status === 'present' && !key.classList.contains('correct')) {
                    key.className = 'present';
                    key.style.background = '#c9b458';
                    key.style.color = 'white';
                } else if (!key.classList.contains('correct') && !key.classList.contains('present')) {
                    key.className = 'absent';
                    key.style.background = '#787c7e';
                    key.style.color = 'white';
                }
            }
        }
    }

    // --- ADDED CLEANUP METHOD --- 
    cleanup() {
        console.log("Cleaning up WordleGame...");
        // Remove event listeners
        if (this._boundKeyHandler) {
            document.removeEventListener('keydown', this._boundKeyHandler);
            this._boundKeyHandler = null;
        }
        // Remove UI elements created by this instance within its parent
        if (this.parentContainer) {
             // More robust check: remove only if they are direct children
             if (this.boardElement && this.boardElement.parentNode === this.parentContainer) {
                 this.parentContainer.removeChild(this.boardElement);
             }
             if (this.keyboardElement && this.keyboardElement.parentNode === this.parentContainer) {
                 this.parentContainer.removeChild(this.keyboardElement);
             }
             if (this.messageElement && this.messageElement.parentNode === this.parentContainer) {
                 this.parentContainer.removeChild(this.messageElement);
             }
        }
        
        // Reset state
        this.boardElement = null;
        this.keyboardElement = null;
        this.messageElement = null;
        this.parentContainer = null; // Clear reference to parent
        this.currentAttempt = 0;
        this.currentWord = '';
        this.gameOver = false;
        this.targetWord = '';
        
        // Hide the modal if it's visible (and managed by this game instance)
        if (this.modalElement && !this.modalElement.classList.contains('hidden')) {
            // Check if modal was created/is managed locally or globally
            // Let GameManager handle global modal state if needed
            // this.modalElement.classList.add('hidden');
        }
        // Don't remove the global modal here, just detach listeners if needed
        const closeButton = this.modalElement?.querySelector('#modal-close');
        if (closeButton) {
             // Need a way to remove the specific listener added in overrideGameMethods
             // This requires storing the listener reference, which is complex
             // For now, relying on GameManager clearing #game-content might be sufficient
        }

        console.log("WordleGame cleanup finished.");
    }

    // Method to receive used words from GameManager
    setUsedWords(usedWordsSet) {
        if (usedWordsSet instanceof Set) {
            this.usedWords = usedWordsSet;
            console.log(`WordleGame received usedWords set with ${this.usedWords.size} words.`);
        } else {
            console.error("Invalid usedWords set received from GameManager.");
        }
    }
}

// --- REMOVED Automatic Game Start on Load ---
/*
window.addEventListener('load', () => {
    const waitForDictionary = setInterval(() => {
        if (window.DICTIONARY_LOADED) {
            clearInterval(waitForDictionary);
            new WordleGame(); 
        } else {
            console.log("Waiting for dictionary to load...");
        }
    }, 100);
}); 
*/ 