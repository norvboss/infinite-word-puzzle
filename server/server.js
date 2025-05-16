const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs');
require('dotenv').config();
const app = express();
const server = http.createServer(app);

// Configure CORS properly for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.static(path.join(__dirname, '../')));
app.use(express.json());

// Game state management
const waitingPlayers = {
  random: [], // for random matchmaking
  friendly: {} // for friend invites with game codes
};

const pendingChallenges = new Map(); // for friend challenges awaiting acceptance

const activeGames = new Map(); // track ongoing games

// Create a mapping to track which socket belongs to which username
const usernameSockets = {};

// Create a map to track recent challenges to prevent duplicates
const recentChallenges = new Map();

// Send notifications for pending challenges
function force_check_challenges() {
  // Define max age for challenges - don't notify about old challenges
  const MAX_CHALLENGE_AGE = 60 * 1000; // 60 seconds
  const now = Date.now();

  // Log active users for debugging
  console.log("Connected users:", Object.keys(usernameSockets));
  
  // Loop through all active users
  Object.keys(usernameSockets).forEach(username => {
    const pendingChallenges = [];
    
    // Find all pending challenges for this user
    Object.values(waitingPlayers.friendly).forEach(challenge => {
      if (challenge.target === username && challenge.status === 'pending') {
        // Check challenge age
        const challengeAge = now - challenge.createdAt;
        if (challengeAge < MAX_CHALLENGE_AGE) {
          pendingChallenges.push({
            ...challenge,
            age: challengeAge
          });
        }
      }
    });
    
    // If there are pending challenges, notify the user
    if (pendingChallenges.length > 0) {
      // Sort challenges by age (newest first)
      pendingChallenges.sort((a, b) => a.age - b.age);
      
      // Take only the newest challenge to avoid spamming
      const newestChallenge = pendingChallenges[0];
      
      console.log(`Sending challenge notification to ${username} for game ${newestChallenge.gameCode}`);
      
      // Get the socket for this user
      const userSocket = usernameSockets[username];
      if (userSocket) {
        userSocket.emit('friend_challenge', {
          gameCode: newestChallenge.gameCode,
          challenger: newestChallenge.creator
        });
      } else {
        console.log(`Failed to notify ${username} - not connected`);
      }
    }
  });
}

// Generate random word for a game
function getRandomWord(difficulty) {
  console.log(`Selecting random word for difficulty: ${difficulty}`);
  
  const wordLengths = {
    'easy': 4,
    'medium': 5,
    'hard': 6,
    'expert': 7
  };
  
  // Default to medium if difficulty is not specified
  const wordLength = wordLengths[difficulty] || 5;
  
  // Expanded list of real English words for each difficulty level
  const realWords = {
    'easy': [
      'CAKE', 'FISH', 'TIME', 'BALL', 'DUCK', 'FROG', 'JUMP', 'KIND', 'LAKE', 'MOON', 
      'BLUE', 'BOOK', 'CARS', 'COAT', 'COOL', 'FARM', 'GIFT', 'GOLD', 'HELP', 'HOME',
      'LAND', 'LIKE', 'LOVE', 'MILK', 'MINT', 'NEAT', 'NICE', 'PLAY', 'RAIN', 'RIDE',
      'ROAD', 'ROOF', 'ROOM', 'ROSE', 'SAFE', 'SHIP', 'SHOE', 'SHOP', 'SING', 'STAR'
    ],
    'medium': [
      'APPLE', 'BEACH', 'CRANE', 'FRESH', 'GRAPE', 'HOUSE', 'LEMON', 'PLANT', 'STEAM', 'WORLD',
      'ABOUT', 'ALERT', 'BLAME', 'BLINK', 'BRAIN', 'BRAVE', 'BREAD', 'BRICK', 'CHAIR', 'CHARM',
      'CLEAN', 'CLOCK', 'CLOUD', 'CLOWN', 'COVER', 'DREAM', 'DRINK', 'DRIVE', 'EARTH', 'ENJOY',
      'EQUAL', 'EXACT', 'FANCY', 'FIELD', 'FLAME', 'FLASH', 'FLOAT', 'FLOOR', 'FOCUS', 'FRUIT'
    ],
    'hard': [
      'ADJUST', 'BRONZE', 'CLOUDY', 'FACTOR', 'GLOBAL', 'IMAGES', 'OXYGEN', 'PUZZLE', 'SYSTEM', 'VOYAGE',
      'ARTIST', 'AUTUMN', 'BASKET', 'BEYOND', 'CASTLE', 'CHANCE', 'COLUMN', 'DINNER', 'DOUBLE', 'ESTATE',
      'FOREST', 'FUTURE', 'GARDEN', 'GUITAR', 'IMPACT', 'ISLAND', 'MARKET', 'MUSEUM', 'OFFICE', 'ORANGE',
      'PLANET', 'PRAYER', 'REASON', 'SCHOOL', 'SILVER', 'SUMMER', 'SUNSET', 'SYMBOL', 'WONDER', 'YELLOW'
    ],
    'expert': [
      'ABANDON', 'BENEATH', 'DISPLAY', 'EXAMPLE', 'FITNESS', 'JOURNEY', 'MANAGER', 'NETWORK', 'PACKAGE', 'QUALITY',
      'AMAZING', 'BALANCE', 'CAPTAIN', 'COMPASS', 'DIAMOND', 'EXPLORE', 'FACTORY', 'HARMONY', 'HORIZON', 'IMPROVE',
      'INSPIRE', 'KINGDOM', 'LIBRARY', 'MACHINE', 'MISSION', 'NATURAL', 'PASSION', 'PERFECT', 'QUANTUM', 'RAINBOW',
      'REALIZE', 'SCIENCE', 'SILENCE', 'SOCIETY', 'STADIUM', 'THOUGHT', 'THUNDER', 'UPGRADE', 'VICTORY', 'WELCOME'
    ]
  };
  
  // Fallback words for each length in case the difficulty selection doesn't work
  const fallbackWords = {
    4: ['CAKE', 'FISH', 'TIME', 'BALL', 'DUCK'],
    5: ['APPLE', 'BEACH', 'CRANE', 'FRESH', 'GRAPE'],
    6: ['ADJUST', 'BRONZE', 'CLOUDY', 'FACTOR', 'GLOBAL'],
    7: ['ABANDON', 'BENEATH', 'DISPLAY', 'EXAMPLE', 'FITNESS']
  };
  
  let selectedWord = null;
  
  // Try to get a word from the real word list for this difficulty
  if (realWords[difficulty] && realWords[difficulty].length > 0) {
    const randomIndex = Math.floor(Math.random() * realWords[difficulty].length);
    selectedWord = realWords[difficulty][randomIndex];
    console.log(`Selected word for ${difficulty}: ${selectedWord}`);
  }
  
  // If we don't have a word yet, try the fallback list
  if (!selectedWord && fallbackWords[wordLength] && fallbackWords[wordLength].length > 0) {
    const randomIndex = Math.floor(Math.random() * fallbackWords[wordLength].length);
    selectedWord = fallbackWords[wordLength][randomIndex];
    console.log(`Using fallback word of length ${wordLength}: ${selectedWord}`);
  }
  
  // Last resort: generate a random word from letters
  if (!selectedWord) {
    console.log(`Warning: No words available for ${difficulty}, using random letters`);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    selectedWord = '';
    for (let i = 0; i < wordLength; i++) {
      selectedWord += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    console.log(`Generated random word: ${selectedWord}`);
  }
  
  // Ensure the word is the correct length
  if (selectedWord.length !== wordLength) {
    console.log(`Warning: Selected word ${selectedWord} is ${selectedWord.length} letters, but needed ${wordLength}`);
    // Use a fallback or generate random if needed
    if (fallbackWords[wordLength] && fallbackWords[wordLength].length > 0) {
      selectedWord = fallbackWords[wordLength][0]; // Use first fallback word
      console.log(`Used first fallback word instead: ${selectedWord}`);
    } else {
      // Generate random as last resort
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      selectedWord = '';
      for (let i = 0; i < wordLength; i++) {
        selectedWord += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      }
      console.log(`Generated random word as last resort: ${selectedWord}`);
    }
  }
  
  return selectedWord.toUpperCase();
}

// SOCKET HANDLING IMPROVEMENTS
// Map to track username to socket ID mappings
const userSocketMap = new Map();
// Map to track socket ID to username mappings
const socketUserMap = new Map();

// Enhanced socket connection handling
io.on('connection', (socket) => {
    console.log(`New socket connection: ${socket.id}`);
    
    // Add direct socket registration handler for redundancy
    socket.on('direct_register', (data) => {
        if (!data || !data.username) {
            console.error(`Invalid direct registration data received:`, data);
            return;
        }
        
        const username = data.username;
        console.log(`Direct registration: User ${username} with socket ${socket.id}`);
        
        // Store in both maps for easy lookup
        userSocketMap.set(username, socket.id);
        socketUserMap.set(socket.id, username);
        
        // Join a room with the username for direct messaging
        socket.join(username);
        
        // Check for pending challenges
        checkPendingChallenges(username);
        
        // Confirm registration to client
        socket.emit('registration_confirmed', { 
            username,
            socketId: socket.id,
            timestamp: Date.now()
        });
    });
    
    // Handle room joining
    socket.on('join', (data) => {
        if (data && data.room) {
            console.log(`Socket ${socket.id} joining room: ${data.room}`);
            socket.join(data.room);
            
            // If room name looks like a username, also register it
            if (data.room.length > 2 && !data.room.includes(' ')) {
                const username = data.room;
                userSocketMap.set(username, socket.id);
                socketUserMap.set(socket.id, username);
                console.log(`Registered username ${username} from room join`);
                
                // Check for pending challenges
                checkPendingChallenges(username);
            }
        }
    });
    
    // Original registration handler (keep it for backward compatibility)
    socket.on('register_user', (data) => {
        if (!data || !data.username) {
            console.error(`Invalid registration data received:`, data);
            return;
        }
        
        const username = data.username;
        console.log(`==== REGISTRATION: User ${username} with socket ${socket.id} ====`);
        
        // Check if this username was already registered with a different socket
        const existingSocketId = userSocketMap.get(username);
        if (existingSocketId && existingSocketId !== socket.id) {
            console.log(`REGISTRATION: Username ${username} was previously registered with socket ${existingSocketId}`);
            console.log(`REGISTRATION: Updating to new socket ${socket.id}`);
            
            // Clean up old mapping
            socketUserMap.delete(existingSocketId);
        }
        
        // Store in both maps for easy lookup
        userSocketMap.set(username, socket.id);
        socketUserMap.set(socket.id, username);
        
        // Join a room with the username for direct messaging
        socket.join(username);
        
        // Check for pending challenges immediately
        checkPendingChallenges(username);
        
        console.log(`REGISTRATION: User ${username} registered with socket ${socket.id}`);
        console.log(`REGISTRATION: Current users online: ${Array.from(userSocketMap.keys()).join(', ')}`);
        
        // Respond with confirmation
        socket.emit('registration_confirmed', { 
            username,
            socketId: socket.id,
            timestamp: Date.now()
        });
        
        // Send any pending challenges right away
        setTimeout(() => {
            resendRecentChallenges(username);
        }, 1000);
    });
    
    // On disconnect, clean up the mappings
    socket.on('disconnect', () => {
        const username = socketUserMap.get(socket.id);
        if (username) {
            console.log(`User ${username} disconnected (socket: ${socket.id})`);
            userSocketMap.delete(username);
            socketUserMap.delete(socket.id);
        } else {
            console.log(`Socket ${socket.id} disconnected (no associated user)`);
        }
    });
    
    // Handle submit_guess event for multiplayer games
    socket.on('submit_guess', (data) => {
        if (!data || !data.gameId || !data.guess) {
            console.error('Invalid guess data:', data);
            socket.emit('guess_error', { message: 'Invalid guess data' });
            return;
        }

        const { gameId, guess } = data;
        console.log(`Guess received for game ${gameId}: "${guess}"`);

        // Get the current game data
        const gameData = getActiveGame(gameId);
        if (!gameData) {
            console.error(`Game ${gameId} not found`);
            socket.emit('guess_error', { message: 'Game not found' });
            return;
        }
        
        // Check if game is already finished
        if (gameData.isFinished) {
            console.warn(`Guess received for already finished game ${gameId}`);
            socket.emit('guess_error', { message: 'Game has already ended' });
            return;
        }

        const targetWord = gameData.targetWord.toUpperCase();
        const submittedGuess = guess.toUpperCase();

        // Verify guess length
        if (submittedGuess.length !== targetWord.length) {
            console.error(`Invalid guess length. Expected ${targetWord.length}, got ${submittedGuess.length}`);
            socket.emit('guess_error', { message: `Invalid guess length. Expected ${targetWord.length}, got ${submittedGuess.length}` });
            return;
        }

        // Get player username
        const username = socketUserMap.get(socket.id);
        if (!username) {
            console.error(`No username found for socket ${socket.id}`);
            socket.emit('guess_error', { message: 'User not identified' });
            return;
        }

        // Calculate the result for this guess (correct, misplaced, wrong)
        const result = [];
        const targetLetters = targetWord.split('');
        
        // First pass: mark correct letters
        for (let i = 0; i < submittedGuess.length; i++) {
            if (submittedGuess[i] === targetLetters[i]) {
                result[i] = 'correct';
                targetLetters[i] = null; // Mark as used
            }
        }
        
        // Second pass: mark misplaced and wrong letters
        for (let i = 0; i < submittedGuess.length; i++) {
            if (result[i]) continue; // Skip already marked letters
            
            const index = targetLetters.indexOf(submittedGuess[i]);
            if (index !== -1) {
                result[i] = 'misplaced';
                targetLetters[index] = null; // Mark as used
            } else {
                result[i] = 'wrong';
            }
        }

        // Check if the guess is correct - ensure case-insensitive comparison
        // Check if ALL letters are correct (every position has "correct" status)
        const isWinner = result.every(status => status === 'correct');
        
        console.log(`Guess check: "${submittedGuess}" vs target "${targetWord}" - isWinner: ${isWinner}`);

        // Send the result back to the player
        socket.emit('guess_result', {
            gameId,
            guess: submittedGuess,
            result,
            isWinner
        });

        // Update game state
        if (!gameData.players) {
            gameData.players = {};
        }
        
        if (!gameData.players[username]) {
            gameData.players[username] = {
                guesses: [],
                remainingTries: 6
            };
        }
        
        // Add this guess to the player's history
        gameData.players[username].guesses.push({
            word: submittedGuess,
            result
        });
        
        gameData.players[username].remainingTries--;
        
        // Update the game data
        updateActiveGame(gameId, gameData);

        // Find opponent(s) using the stored participants list
        const currentPlayer = username;
        const opponents = gameData.participants.filter(p => p !== currentPlayer);
        console.log(`Current player: ${currentPlayer}, Opponent(s): ${opponents.join(', ')} based on participants list.`);
        
        // Notify opponent(s) about the guess
        opponents.forEach(opponent => {
            const opponentSocketId = userSocketMap.get(opponent);
            if (opponentSocketId) {
                console.log(`Notifying opponent ${opponent} about guess from ${username}`);
                
                // Include targetWord if the guess is a winner
                const notificationData = {
        gameId,
                    username,
                    guess: submittedGuess,
                    result,
                    isWinner
                };
                
                // Add target word to notification if this is a winning guess
                if (isWinner) {
                    notificationData.targetWord = targetWord;
                    console.log(`Including target word ${targetWord} in opponent notification because guess is a winner`);
                }
                
                io.to(opponentSocketId).emit('opponent_guess', notificationData);
            }
        });

        // If game is over (win or max guesses used), notify both players
        if (isWinner || (gameData.players[username] && gameData.players[username].remainingTries === 0)) {
            const gameResult = isWinner ? 'win' : 'lose';
            
            // Mark the game as finished in the game data
            gameData.isFinished = true;
            updateActiveGame(gameId, gameData);
            
            console.log(`Game ${gameId} finished. Player ${username} result: ${gameResult}`);
            
            // Get opponent data for game over notifications
            const opponentData = {};
            opponents.forEach(opponent => {
                if (gameData.players[opponent]) {
                    opponentData[opponent] = {
                        guesses: gameData.players[opponent].guesses.length,
                        remainingTries: gameData.players[opponent].remainingTries
                    };
                }
            });
            
            // Notify current player
            socket.emit('game_over', {
        gameId,
                result: gameResult,
                targetWord,
                opponentTries: opponents.length > 0 && opponentData[opponents[0]] ? 
                               gameData.players[username].guesses.length : 0,
                opponentData
            });
            
            // Notify opponents using the correct list
            opponents.forEach(opponent => {
                const opponentSocketId = userSocketMap.get(opponent);
                if (opponentSocketId) {
                    const opponentResult = isWinner ? 'lose' : 'win'; // If this player won, opponent lost
                    
                    // *** ADD LOGGING ***
                    console.log(`Preparing game_over event for opponent ${opponent} (socket: ${opponentSocketId}) with result: ${opponentResult}`);
                    
                    const eventData = {
                        gameId,
                        result: opponentResult,
                        targetWord,
                        opponentTries: gameData.players[username].guesses.length,
                        opponentData: {
                            [username]: {
                                guesses: gameData.players[username].guesses.length,
                                remainingTries: gameData.players[username].remainingTries
                            }
                        }
                    };
                    
                    console.log(`Emitting game_over to ${opponentSocketId} with data:`, eventData);
                    io.to(opponentSocketId).emit('game_over', eventData);
    } else {
                    // *** ADD LOGGING ***
                    console.log(`Opponent ${opponent} not found in userSocketMap, cannot send game_over event.`);
                }
            });
        }
    });
    
    // Handle friend challenges more reliably
    socket.on('send_friend_challenge', async (data) => {
        console.log('Received challenge request:', data);
        if (!data || !data.fromUsername || !data.toUsername) {
            console.error('Invalid challenge request data:', data);
            return;
        }
        
        const { fromUsername, toUsername, difficulty, wordLength, gameCode } = data;
        
        // Create a unique key for this challenge
        const challengeKey = `${fromUsername}_to_${toUsername}_${gameCode || ''}`;
        
        // Check if this is a duplicate recent challenge
        if (recentChallenges.has(challengeKey)) {
            const lastSentTime = recentChallenges.get(challengeKey);
            const timeSinceLastSent = Date.now() - lastSentTime;
            
            // Only allow resending after 60 seconds
            if (timeSinceLastSent < 60000) {
                console.log(`Ignoring duplicate challenge ${challengeKey} - only ${timeSinceLastSent}ms since last sent (min 60000ms)`);
                return;
            }
        }
        
        // Track this challenge to prevent duplicates
        recentChallenges.set(challengeKey, Date.now());
        
        // Automatically clean up old challenges (older than 5 minutes)
        for (const [key, timestamp] of recentChallenges.entries()) {
            if (Date.now() - timestamp > 300000) {
                recentChallenges.delete(key);
            }
        }
        
        // Check if friend is online
        const friendSocketId = userSocketMap.get(toUsername);
        if (friendSocketId) {
            console.log(`Friend ${toUsername} is online with socket ${friendSocketId}, sending direct challenge`);
            
            // Add expiration time to the challenge data
            const enhancedData = {
                ...data,
                timestamp: Date.now(),
                expiresAt: Date.now() + 60000 // 60 seconds expiration
            };
            
            // Send to the specific socket
            io.to(friendSocketId).emit('challenge_received', enhancedData);
            
            // Also emit to the room with username
            io.to(toUsername).emit('challenge_received', enhancedData);
            
            console.log(`Challenge notification sent directly to ${toUsername}`);
        } else {
            console.log(`Friend ${toUsername} not connected, challenge will be pending`);
            // Store as pending challenge
            storePendingChallenge(fromUsername, toUsername, difficulty, wordLength, gameCode);
        }
    });
    
    // Direct notification for challenges
    socket.on('notify_friend_challenge', (data) => {
        if (!data || !data.toUsername) {
            console.error('Invalid notification data:', data);
            return;
        }
        
        const { toUsername, fromUsername } = data;
        
        // Skip if this is a duplicate recent challenge
        const challengeKey = `${fromUsername}_to_${toUsername}_${data.gameCode || ''}`;
        if (recentChallenges.has(challengeKey)) {
            const lastSentTime = recentChallenges.get(challengeKey);
            const timeSinceLastSent = Date.now() - lastSentTime;
            
            // Only allow resending after 60 seconds
            if (timeSinceLastSent < 60000) {
                console.log(`Ignoring duplicate notification ${challengeKey} - only ${timeSinceLastSent}ms since last sent`);
                return;
            }
        }
        
        // Add timestamp and expiration
        const enhancedData = {
            ...data,
            timestamp: Date.now(),
            expiresAt: Date.now() + 60000 // 60 seconds expiration
        };
        
        // Try multiple notification methods
        // 1. Send to specific socket if we know it
        const friendSocketId = userSocketMap.get(toUsername);
        if (friendSocketId) {
            console.log(`Sending direct notification to socket ${friendSocketId} for user ${toUsername}`);
            io.to(friendSocketId).emit('challenge_received', enhancedData);
        }
        
        // 2. Also send to user's room
        console.log(`Also sending notification to room ${toUsername}`);
        io.to(toUsername).emit('challenge_received', enhancedData);
        
        // 3. Broadcast to all sockets (with filtering on client side)
        socket.broadcast.emit('challenge_notification', enhancedData);
        
        // Track this challenge to prevent duplicates
        recentChallenges.set(challengeKey, Date.now());
    });
    
    // Force check challenges
    socket.on('force_check_challenges', (data) => {
        if (!data || !data.username) {
            console.error('Invalid challenge check request:', data);
            return;
        }
        
        console.log(`Force checking challenges for ${data.username}`);
        checkPendingChallenges(data.username);
    });
    
    // Enhanced handling of challenge responses
    socket.on('challenge_response', (data) => {
        console.log('Challenge response received:', data);
        if (!data || !data.gameCode || !data.responder) {
            console.error('Invalid challenge response data:', data);
            return;
        }
        
        const { gameCode, accept, responder } = data;
        
        // Get challenge data
        const challenge = getPendingChallengeByCode(gameCode);
        if (!challenge) {
            console.warn(`Challenge with code ${gameCode} not found`);
            return;
        }
        
        // Handle challenge acceptance
        if (accept) {
            console.log(`${responder} accepted challenge from ${challenge.fromUsername}`);
            
            // Select a target word
            const targetWord = getRandomWord(challenge.difficulty || 'medium');
            const wordLength = challenge.wordLength || 5;
            
            // Create game data - ADD PARTICIPANTS HERE
            const gameData = {
                gameId: gameCode,
                participants: [challenge.fromUsername, challenge.toUsername], // Store both players
                players: {}, // Initialize empty players object for guesses
                difficulty: challenge.difficulty,
                wordLength: wordLength,
                targetWord: targetWord,
                isFinished: false // Initialize isFinished flag
            };
            
            // Store the active game data
            storeActiveGame(gameCode, gameData);
            console.log(`Stored new active game ${gameCode} with participants: ${gameData.participants.join(', ')}`);
            
            // Notify the challenger
            const challengerSocketId = userSocketMap.get(challenge.fromUsername);
            if (challengerSocketId) {
                console.log(`Notifying challenger ${challenge.fromUsername} (socket ${challengerSocketId}) about acceptance`);
                io.to(challengerSocketId).emit('challenge_accepted', gameData);
                io.to(challengerSocketId).emit('game_start', gameData);
            } else {
                console.log(`Challenger ${challenge.fromUsername} is not connected`);
            }
            
            // Notify the responder (who accepted)
            const responderSocketId = userSocketMap.get(responder);
            if (responderSocketId) {
                console.log(`Notifying responder ${responder} (socket ${responderSocketId}) about game start`);
                io.to(responderSocketId).emit('challenge_response_result', gameData);
                io.to(responderSocketId).emit('game_start', gameData);
            }
            
            // Send game sync response to both players
            const syncData = {
                gameId: gameCode,
                targetWord: targetWord,
                wordLength: wordLength,
        startTime: Date.now()
      };
      
            io.to(challenge.fromUsername).emit('game_sync_response', syncData);
            io.to(responder).emit('game_sync_response', syncData);
            
            // Remove from pending challenges
            removePendingChallenge(gameCode);
        } else {
            // Handle challenge decline
            console.log(`${responder} declined challenge from ${challenge.fromUsername}`);
            
            // Notify the challenger about the decline
            const challengerSocketId = userSocketMap.get(challenge.fromUsername);
            if (challengerSocketId) {
                io.to(challengerSocketId).emit('challenge_declined', { 
                    gameCode: gameCode,
                    responder: responder
                });
            }
            
            // Remove from pending challenges
            removePendingChallenge(gameCode);
        }
    });
    
    // Game synchronization handler
    socket.on('game_sync', (data) => {
        const { gameId, username } = data;
        console.log(`Game sync request for game ${gameId} from ${username}`);
        
        // If the game exists and has a target word, emit that information
        if (activeGames.has(gameId) && activeGames.get(gameId).targetWord) {
            console.log(`Game ${gameId} found with target word: ${activeGames.get(gameId).targetWord}`);
            socket.emit('game_sync_response', {
                gameId: gameId,
                targetWord: activeGames.get(gameId).targetWord,
                difficulty: activeGames.get(gameId).difficulty,
                wordLength: activeGames.get(gameId).targetWord.length
            });
        } else {
            // If the game doesn't exist, create a new one
            console.log(`Game ${gameId} not found or no target word available`);
            
            // Use the difficulty from client data or default to medium
            const difficulty = data.difficulty || 'medium';
            console.log(`Selecting random word for difficulty: ${difficulty}`);
            
            const targetWord = getRandomWord(difficulty);
            console.log(`Selected word for ${difficulty}: ${targetWord}`);
            
            activeGames.set(gameId, {
                targetWord: targetWord,
                players: {},
                difficulty: difficulty,
        wordLength: targetWord.length
      });
      
            console.log(`Creating new game ${gameId} with target word: ${targetWord}`);
            
            socket.emit('game_sync_response', {
                gameId: gameId,
                targetWord: targetWord,
                difficulty: difficulty,
        wordLength: targetWord.length
            });
        }
    });
    
    // Player finished game
    socket.on('player_finished', (data) => {
        if (!data || !data.gameId || !data.username) {
            console.error('Invalid player finished data:', data);
            return;
        }
        
        console.log(`Player ${data.username} finished game ${data.gameId}. Won: ${data.won}, Tries: ${data.tries}`);
        
        // Get the game data
        const gameData = getActiveGame(data.gameId);
        if (!gameData) {
            console.warn(`Game ${data.gameId} not found for player finished event`);
            return;
        }
        
        // Store player result
        if (!gameData.playerResults) {
            gameData.playerResults = {};
        }
        
        gameData.playerResults[data.username] = {
            won: data.won,
            tries: data.tries,
            finishTime: Date.now()
        };
        
        // Update the game data
        updateActiveGame(data.gameId, gameData);
        
        // Determine the opponent
        const opponents = Object.keys(gameData.players || {}).filter(
            player => player !== data.username
        );
        
        // Notify the opponent(s)
        opponents.forEach(opponentName => {
            const opponentSocketId = userSocketMap.get(opponentName);
            if (opponentSocketId) {
                console.log(`Notifying opponent ${opponentName} that ${data.username} finished`);
                io.to(opponentSocketId).emit('opponentFinished', {
                    gameId: data.gameId,
                    username: data.username,
                    won: data.won,
                    tries: data.tries,
                    word: gameData.targetWord
                });
            }
        });
    });
    
    // Enhanced broadcast challenge handler
    socket.on('broadcast_challenge', (data) => {
        if (!data || !data.fromUsername || !data.target) {
            console.error('Invalid broadcast challenge data:', data);
            return;
        }
        
        console.log(`BROADCAST: Challenge from ${data.fromUsername} to ${data.target}`);
        
        // Try to find target's socket
        const targetSocketId = userSocketMap.get(data.target);
        if (targetSocketId) {
            console.log(`Found target ${data.target} with socket ${targetSocketId}, sending direct challenge`);
            io.to(targetSocketId).emit('challenge_received', data);
    } else {
            // Broadcast to all sockets and let client handle filtering
            console.log(`Target ${data.target} not found in socket map, broadcasting to all`);
            socket.broadcast.emit('challenge_notification', data);
            
            // Also store as pending challenge
            storePendingChallenge(data.fromUsername, data.target, data.difficulty, data.wordLength, data.gameCode);
        }
    });

    // Direct challenge handler
    socket.on('challenge', (data) => {
        console.log('DIRECT CHALLENGE: Received challenge event with data:', data);
        
        if (!data || !data.fromUsername || !data.toUsername) {
            console.error('Invalid challenge data:', data);
            return;
        }
        
        const { fromUsername, toUsername, difficulty, challengeId } = data;
        console.log(`Challenge from ${fromUsername} to ${toUsername} with difficulty ${difficulty}`);
        
        // Store the challenge ID for later reference
        const gameCode = challengeId || Math.floor(Math.random() * 1000000).toString();
        
        // Try to find target's socket
        const targetSocketId = userSocketMap.get(toUsername);
        if (targetSocketId) {
            console.log(`Found target ${toUsername} with socket ${targetSocketId}, sending direct challenge`);
            
            // Add challenge to pending
            storePendingChallenge(fromUsername, toUsername, difficulty, 5, gameCode);
            
            // Format data properly
            const challengeData = {
                fromUsername: fromUsername,
                toUsername: toUsername,
                difficulty: difficulty || 'medium',
                challengeId: gameCode,
                gameCode: gameCode,
                timestamp: Date.now()
            };
            
            // Send to the target using multiple event types for compatibility
            io.to(targetSocketId).emit('challenge_received', challengeData);
            io.to(targetSocketId).emit('challenge_notification', challengeData);
            io.to(targetSocketId).emit('direct_challenge', challengeData);
            
            // Also notify the sender that the challenge was sent
            socket.emit('challenge_sent', {
                success: true,
                toUsername: toUsername,
                challengeId: gameCode
            });
            
            return;
        }
        
        console.log(`Target ${toUsername} not found in socket map, storing as pending`);
        
        // Store as pending challenge for when they reconnect
        storePendingChallenge(fromUsername, toUsername, difficulty, 5, gameCode);
        
        // Also broadcast to all sockets as fallback (client will filter)
        socket.broadcast.emit('challenge_notification', {
            fromUsername: fromUsername,
            toUsername: toUsername,
            target: toUsername,
            difficulty: difficulty || 'medium',
            challengeId: gameCode,
            gameCode: gameCode,
            timestamp: Date.now()
        });
        
        // Notify the sender
        socket.emit('challenge_sent', {
            success: true, 
            toUsername: toUsername,
            challengeId: gameCode,
            pending: true
        });
    });

    // Handle game won events
    socket.on('game_won', async (data) => {
        const username = socketUserMap.get(socket.id);
        if (!username) {
            console.error('game_won event received but no username found for socket', socket.id);
            return;
        }

        console.log(`Player ${username} won a game with difficulty: ${data.difficulty}`);
        
        // Update player points - add points based on difficulty
        const pointsEarned = data.difficulty === 'easy' ? 10 : 
                            data.difficulty === 'medium' ? 20 : 30;
        
        // Update points using the async function (which also handles leaderboard emission)
        await updatePlayerPoints(username, pointsEarned);
        
        let updatedUserStats = null;

        // If using MongoDB and the user is authenticated, update their stats there too
        const userId = userSocketMap.get(username)?.userId || socket.userId;
        if (userId && isMongoConnected()) {
            try {
                const updatedUser = await User.findByIdAndUpdate(
                    userId,
                    {
                        $inc: {
                            'stats.gamesWon': 1,
                            'stats.totalPoints': pointsEarned,
                            'stats.gamesPlayed': 1
                        },
                        $set: {
                            'stats.lastPlayed': new Date(),
                        },
                    },
                    { new: true }
                ).select('stats username');

                if (updatedUser) {
                    updatedUserStats = updatedUser.stats;
                    console.log(`Updated MongoDB stats for user ${updatedUser.username}`);
                    
                    // Emit the updated stats back to the specific user
                    socket.emit('user_stats_updated', { user: { username: updatedUser.username, stats: updatedUserStats } });
                    console.log(`Emitted user_stats_updated to ${username}`);

                } else {
                     console.error(`Failed to find user with ID ${userId} to update stats.`);
                }

            } catch (error) {
                console.error('Error updating MongoDB user stats:', error);
            }
        } else {
             // If not using MongoDB or user not authenticated via DB, construct stats from file data
             const players = loadPlayerData();
             const filePlayer = players.find(p => p.username === username);
             if (filePlayer) {
                 // Construct a basic stats object matching the DB structure as much as possible
                 updatedUserStats = {
                     totalPoints: filePlayer.points || 0,
                     highestLevel: filePlayer.level || 1,
                     gamesWon: (filePlayer.gamesWon || 0) + 1,
                     gamesPlayed: (filePlayer.gamesPlayed || 0) + 1
                 };
                 
                 // Update the wins/played in the file data
                 filePlayer.gamesWon = updatedUserStats.gamesWon;
                 filePlayer.gamesPlayed = updatedUserStats.gamesPlayed;
                 savePlayerData(players);

                 // Emit the updated stats back to the specific user
                 socket.emit('user_stats_updated', { user: { username: username, stats: updatedUserStats } });
                 console.log(`Emitted file-based user_stats_updated to ${username}`);
             }
        }
    });
});

// Helper functions for challenge management
// Use existing global variables instead of redeclaring
// const pendingChallenges = new Map();
// const activeGames = new Map();

function storePendingChallenge(fromUsername, toUsername, difficulty, wordLength, gameCode) {
    const challenge = {
        fromUsername,
        toUsername,
        difficulty,
        wordLength,
        gameCode,
        timestamp: Date.now()
    };
    
    pendingChallenges.set(gameCode, challenge);
    console.log(`Stored pending challenge from ${fromUsername} to ${toUsername} with code ${gameCode}`);
}

function getPendingChallengeByCode(gameCode) {
    return pendingChallenges.get(gameCode);
}

function removePendingChallenge(gameCode) {
    pendingChallenges.delete(gameCode);
    console.log(`Removed pending challenge with code ${gameCode}`);
}

function checkPendingChallenges(username) {
    if (!username) {
        console.error('Invalid username provided to checkPendingChallenges');
        return;
    }
    
    try {
        console.log(`Checking pending challenges for ${username}`);
        
        const userChallenges = [];
        
        // Find all challenges for this user
        if (pendingChallenges instanceof Map) {
            for (const [code, challenge] of pendingChallenges.entries()) {
                if (challenge.toUsername === username) {
                    console.log(`Found pending challenge for ${username} from ${challenge.fromUsername}`);
                    userChallenges.push(challenge);
                }
            }
        } else if (typeof pendingChallenges === 'object') {
            // Handle as regular object 
            Object.keys(pendingChallenges).forEach(code => {
                const challenge = pendingChallenges[code];
                if (challenge && challenge.toUsername === username) {
                    console.log(`Found pending challenge for ${username} from ${challenge.fromUsername}`);
                    userChallenges.push(challenge);
                }
            });
        }
        
        if (userChallenges.length === 0) {
            console.log(`No pending challenges found for ${username}`);
            return;
        }
        
        // Get the user's socket
        const socketId = userSocketMap.get(username);
        if (!socketId) {
            console.log(`User ${username} has pending challenges but no socket connection`);
            return;
        }
        
        // Send each challenge
        userChallenges.forEach(challenge => {
            console.log(`Sending pending challenge to ${username} from ${challenge.fromUsername}`);
            io.to(socketId).emit('challenge_received', challenge);
            
            // Also try direct user notification
            io.to(username).emit('challenge_received', challenge);
        });
    } catch (error) {
        console.error(`Error in checkPendingChallenges for ${username}:`, error);
    }
}

function storeActiveGame(gameId, data) {
    activeGames.set(gameId, data);
    console.log(`Stored active game ${gameId} with target word ${data.targetWord}`);
}

function getActiveGame(gameId) {
    return activeGames.get(gameId);
}

function updateActiveGame(gameId, data) {
    activeGames.set(gameId, data);
    console.log(`Updated active game ${gameId}`);
}

// Log active connections every minute for debugging
setInterval(() => {
    console.log(`=== ACTIVE CONNECTIONS ===`);
    console.log(`Users online: ${Array.from(userSocketMap.keys()).join(', ')}`);
    console.log(`Socket connections: ${Array.from(socketUserMap.keys()).length}`);
    console.log(`Pending challenges: ${pendingChallenges.size}`);
    console.log(`Active games: ${activeGames.size}`);
}, 60000);

console.log(">>> Script start. Preparing MongoDB connection..."); // Add log

// Fix MongoDB connection to properly handle errors and start server regardless
// MongoDB Connection - with better error handling
let mongoConnected = false;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wordleDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // 5 second timeout for selection
    connectTimeoutMS: 10000 // 10 second timeout for initial connect
}).then(() => {
    mongoConnected = true;
    console.log('>>> MongoDB connected successfully');
}).catch(err => {
    mongoConnected = false;
    console.error('>>> MongoDB connection error:', err);
    console.warn('>>> Server will continue without MongoDB. User authentication disabled.');
    // Do not crash the server - we'll continue without MongoDB
});

// Add connection state check function
function isMongoConnected() {
    return mongoConnected && mongoose.connection.readyState === 1;
}

// Always start the server, regardless of MongoDB connection
const PORT = process.env.PORT || 3001;
console.log(`>>> Starting server on port ${PORT}...`);
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`MongoDB connection status: ${isMongoConnected() ? 'Connected' : 'Disconnected'}`);
});

// Add middleware to handle authentication routes when MongoDB is down - return a clear error
app.use('/register', (req, res, next) => {
    if (!isMongoConnected()) {
        return res.status(503).json({ 
            error: 'Database connection unavailable',
            message: 'Authentication service is temporarily unavailable. You can continue using the app without logging in.'
        });
    }
    next();
});

app.use('/login', (req, res, next) => {
    if (!isMongoConnected()) {
        return res.status(503).json({ 
            error: 'Database connection unavailable',
            message: 'Authentication service is temporarily unavailable. You can continue using the app without logging in.'
        });
    }
    next();
});

// Add special login route for when MongoDB is down - this creates a temporary guest login
app.post('/guest-login', (req, res) => {
    const guestUsername = `guest_${Math.floor(Math.random() * 10000)}`;
    
    // Generate a temporary token that doesn't require MongoDB
    const token = 'GUEST_' + Buffer.from(guestUsername).toString('base64');
    
    console.log(`Created guest login for: ${guestUsername}`);
    
    // Return a guest user object
    res.json({
        token,
        user: {
            id: 'guest',
            username: guestUsername,
            email: 'guest@example.com',
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                currentStreak: 0,
                maxStreak: 0,
                totalPoints: 0
            },
            friends: []
        },
        isGuest: true
  });
});

// User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Will be hashed by pre-save hook
    stats: {
        gamesPlayed: { type: Number, default: 0 },
        gamesWon: { type: Number, default: 0 },
        currentStreak: { type: Number, default: 0 },
        maxStreak: { type: Number, default: 0 },
        totalPoints: { type: Number, default: 0 },
        highestLevel: { type: Number, default: 1 },
        levelProgress: { type: Number, default: 0 },
        currentLevel: { type: Number, default: 1 },
        currentLevelProgress: { type: Number, default: 0 }
    },
    friends: [{ type: String }]
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Create the User model from the schema
const User = mongoose.model('User', UserSchema);

// API Routes
app.post('/register', async (req, res) => {
    console.log("--- Received POST /register request ---");
    console.log("Request body:", req.body);
    
    try {
        const { username, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        
        if (existingUser) {
            console.log("Register: User already exists:", existingUser.username);
            return res.status(400).json({ 
                error: 'Username already taken' 
            });
        }
        
        // Create new user
        const user = new User({
            username,
            password
        });
        
        // Save to database
        try {
            await user.save();
            console.log("Register: New user created:", username);
            
            // Generate token
            const token = jwt.sign(
                { id: user._id, username: user.username },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '7d' }
            );
            
            // Return user info and token
            return res.status(201).json({
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    stats: user.stats,
                    friends: user.friends
                }
            });
        } catch (err) {
            if (err.code === 11000) {
                console.log("Register: Duplicate key error detected");
                return res.status(400).json({
                    error: 'Username already exists'
                });
            }
            throw err;
        }
    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({ error: 'Server error' });
    }
});
app.post('/login', async (req, res) => {
    console.log("--- Received POST /login request ---");
    console.log("Request body:", req.body);
    
    try {
        const { username, password } = req.body;
        
        // Find user
        const user = await User.findOne({ username });
        
        if (!user) {
            console.log("Login: User not found:", username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            console.log("Login: Password incorrect for user:", username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        console.log("Login: Successful for user:", username);
        
        // Generate token
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
        
        // Return user info and token
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                stats: user.stats,
                friends: user.friends
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Save user stats endpoint
app.post('/stats', async (req, res) => {
    console.log("--- Received POST /stats request ---");
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        console.log("Stats: No token provided");
        return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, 'your-secret-key');
        const stats = req.body.stats;
        
        if (!stats) {
            console.log("Stats: No stats data provided");
            return res.status(400).json({ error: 'No stats data provided' });
        }
        
        // Update user stats
        const user = await User.findByIdAndUpdate(
            decoded.id,
            { $set: { stats } },
            { new: true }
        ).select('-password');
        
        if (!user) {
            console.log("Stats: User not found");
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log("Stats: Updated for user:", user.username);
        res.json({ success: true, user });
    } catch (error) {
        console.error("Stats update error:", error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Search for users by username
app.get('/search-users', async (req, res) => {
    console.log("--- Received GET /search-users request ---");
    const token = req.headers.authorization?.split(' ')[1];
    const searchTerm = req.query.q;
    
    if (!token) {
        console.log("Search Users: No token provided");
        return res.status(401).json({ error: 'No token provided' });
    }
    
    if (!searchTerm) {
        console.log("Search Users: No search term provided");
        return res.status(400).json({ error: 'No search term provided' });
    }
    
    try {
        // Verify the token and get the current user's ID
        const decoded = jwt.verify(token, 'your-secret-key');
        const currentUserId = decoded.id;
        
        // Find the current user to get their friends list
        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            console.log("Search Users: Current user not found");
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Search for users whose username contains the search term
        // Exclude the current user and limit to 10 results
        const users = await User.find({
            username: { $regex: searchTerm, $options: 'i' },
            _id: { $ne: currentUserId }
        })
        .select('username _id')
        .limit(10);
        
        // Add a property to indicate if each user is already a friend
        const usersWithFriendStatus = users.map(user => {
            return {
                id: user._id,
                username: user.username,
                isFriend: currentUser.friends.includes(user.username)
            };
        });
        
        console.log(`Search Users: Found ${users.length} users matching "${searchTerm}"`);
        res.json(usersWithFriendStatus);
    } catch (error) {
        console.error("Search Users error:", error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Add friend endpoint
app.post('/add-friend', async (req, res) => {
    console.log("--- Received POST /add-friend request ---");
    const token = req.headers.authorization?.split(' ')[1];
    const { friendUsername } = req.body;
    
    if (!token) {
        console.log("Add Friend: No token provided");
        return res.status(401).json({ error: 'No token provided' });
    }
    
    if (!friendUsername) {
        console.log("Add Friend: No friend username provided");
        return res.status(400).json({ error: 'No friend username provided' });
    }
    
    try {
        // Verify the token and get the current user's ID
        const decoded = jwt.verify(token, 'your-secret-key');
        
        // Check if friend exists
        const friendUser = await User.findOne({ username: friendUsername });
        if (!friendUser) {
            console.log("Add Friend: Friend not found:", friendUsername);
            return res.status(404).json({ error: 'Friend not found' });
        }
        
        // Add friend to user's friend list
        const user = await User.findById(decoded.id);
        if (!user) {
            console.log("Add Friend: User not found");
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (user.friends.includes(friendUsername)) {
            console.log("Add Friend: Already friends with", friendUsername);
            return res.status(400).json({ error: 'Already friends with this user' });
        }
        
        // Add friend to user's friend list
        user.friends.push(friendUsername);
        await user.save();
        
        // Make friendship mutual - add the user to the friend's friend list too
        if (!friendUser.friends.includes(user.username)) {
            friendUser.friends.push(user.username);
            await friendUser.save();
            console.log("Add Friend: Also added", user.username, "to", friendUsername, "friends (mutual)");
        }
        
        console.log("Add Friend: Added", friendUsername, "to", user.username, "friends");
        res.json({ 
            success: true, 
            message: `Added ${friendUsername} to your friends`,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                stats: user.stats,
                friends: user.friends
            }
        });
    } catch (error) {
        console.error("Add Friend error:", error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

app.get('/me', async (req, res) => {
    console.log("--- Received GET /me request ---"); // Log entry
    const token = req.headers.authorization?.split(' ')[1];
    console.log("Token from header:", token ? "Present" : "Missing"); // Log token presence

    if (!token) {
         console.log("GET /me: No token provided, sending 401");
         return res.status(401).json({ error: 'No token provided' });
    }
    try {
        console.log("GET /me: Verifying token...");
        const decoded = jwt.verify(token, 'your-secret-key');
        console.log("GET /me: Token verified, decoded payload:", decoded);

        console.log(`GET /me: Finding user by ID: ${decoded.id}`);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            console.log("GET /me: User not found for ID in token, sending 404");
            return res.status(404).json({ error: 'User not found' });
        }
        console.log("GET /me: User found, sending user data:", user.username);
        res.json(user);
    } catch (error) {
        console.error("GET /me: Error during token verification or user lookup:", error.name, error.message);
        res.status(401).json({ error: 'Invalid token' });
    }
});

// *** NEW ENDPOINT: Save Single Player Progress ***
app.post('/save-progress', async (req, res) => {
    console.log("--- Received POST /save-progress request ---");
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        console.log("Save Progress: No token provided");
        return res.status(401).json({ error: 'No token provided' });
    }

    if (!isMongoConnected()) {
         return res.status(503).json({ 
            error: 'Database connection unavailable',
            message: 'Cannot save progress at this time.'
        });
    }

    try {
        const decoded = jwt.verify(token, 'your-secret-key');
        const userId = decoded.id;
        const { currentLevel, currentLevelProgress, totalPoints, gamesPlayed, gamesWon, currentStreak, maxStreak } = req.body;

        // Validate received data (basic check)
        if (typeof currentLevel !== 'number' || typeof currentLevelProgress !== 'number' || typeof totalPoints !== 'number') {
            console.log("Save Progress: Invalid progress data received", req.body);
            return res.status(400).json({ error: 'Invalid progress data provided' });
        }

        // Update user stats in the database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { 
                $set: { 
                    'stats.currentLevel': currentLevel,
                    'stats.currentLevelProgress': currentLevelProgress,
                    'stats.totalPoints': totalPoints,
                    'stats.highestLevel': Math.max(currentLevel, req.body.highestLevel || 1),
                    ...(gamesPlayed !== undefined && { 'stats.gamesPlayed': gamesPlayed }),
                    ...(gamesWon !== undefined && { 'stats.gamesWon': gamesWon }),
                    ...(currentStreak !== undefined && { 'stats.currentStreak': currentStreak }),
                    ...(maxStreak !== undefined && { 'stats.maxStreak': maxStreak }),
                    'stats.lastPlayed': new Date()
                }
            },
            { new: true }
        ).select('stats username');

        if (!updatedUser) {
            console.log("Save Progress: User not found for ID:", userId);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log("Save Progress: Updated stats for user:", updatedUser.username, updatedUser.stats);
        
        // Also update file-based data if user exists there
        const players = loadPlayerData();
        const playerIndex = players.findIndex(p => p.username === updatedUser.username);
        if (playerIndex !== -1) {
            players[playerIndex].points = updatedUser.stats.totalPoints;
            players[playerIndex].level = updatedUser.stats.highestLevel;
            players[playerIndex].gamesWon = updatedUser.stats.gamesWon;
            players[playerIndex].gamesPlayed = updatedUser.stats.gamesPlayed;
            savePlayerData(players);
            console.log(`Synced file-based data for ${updatedUser.username} after single-player save.`);
            
            // Fetch and emit leaderboard update after saving progress potentially changed points
            const newLeaderboard = await fetchLeaderboardData();
            io.emit('leaderboard_updated', { leaderboard: newLeaderboard });
            console.log("Emitted leaderboard_updated event after save-progress");
        }

        res.json({ success: true, stats: updatedUser.stats });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            console.error("Save Progress: Invalid token", error.name);
            res.status(401).json({ error: 'Invalid token' });
        } else {
            console.error("Save Progress: Server error", error);
            res.status(500).json({ error: 'Server error during progress save' });
        }
    }
});

// Function to resend recent challenges to a user
function resendRecentChallenges(username) {
    console.log(`Checking for recent challenges to resend to ${username}`);
    
    // Find recent challenges for this user
    const now = Date.now();
    const recentTimeThreshold = now - 300000; // Last 5 minutes
    
    // Check the recentChallenges map
    for (const [key, timestamp] of recentChallenges.entries()) {
        if (timestamp > recentTimeThreshold && key.includes(`_to_${username}_`)) {
            // Parse the key to get challenge info
            const parts = key.split('_to_');
            if (parts.length === 2) {
                const fromUsername = parts[0];
                const remaining = parts[1].split('_');
                const toUsername = remaining[0];
                
                if (toUsername === username) {
                    console.log(`Found recent challenge from ${fromUsername} to ${toUsername}`);
                    
                    // Create a minimal challenge to resend
                    const minimalChallenge = {
                        fromUsername: fromUsername,
                        toUsername: toUsername,
                        gameCode: remaining.length > 1 ? remaining[1] : `resend-${Date.now()}`,
                        timestamp: now,
                        expiresAt: now + 60000,
                        difficulty: 'medium',
                        wordLength: 5,
                        resend: true
                    };
                    
                    // Get user's socket
                    const userSocketId = userSocketMap.get(username);
                    if (userSocketId) {
                        console.log(`Resending challenge to ${username} on socket ${userSocketId}`);
                        io.to(userSocketId).emit('challenge_received', minimalChallenge);
                    }
                }
            }
        }
    }
}

// Get leaderboard endpoint
app.get('/leaderboard', async (req, res) => {
    console.log("--- Received GET /leaderboard request ---");
    try {
        const leaderboard = await fetchLeaderboardData();
        res.json({ success: true, leaderboard });
    } catch (error) {
        console.error("Leaderboard API error:", error);
        res.status(500).json({ error: 'Failed to retrieve leaderboard' });
    }
});

// Add this function to load or initialize player data
function loadPlayerData() {
    const dataPath = path.join(__dirname, 'data', 'players.json');
    try {
        if (fs.existsSync(dataPath)) {
            const data = fs.readFileSync(dataPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading player data:', error);
    }
    
    // Return empty array if file doesn't exist or there's an error
    return [];
}

function savePlayerData(players) {
    const dataDir = path.join(__dirname, 'data');
    const dataPath = path.join(dataDir, 'players.json');
    
    try {
        // Ensure the data directory exists
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(dataPath, JSON.stringify(players, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving player data:', error);
    }
}

// Add this with your socket events to update player points
async function updatePlayerPoints(username, pointsToAdd) {
    if (!username) return;
    
    const players = loadPlayerData();
    let player = players.find(p => p.username === username);
    
    if (player) {
        player.points = (player.points || 0) + pointsToAdd;
        player.level = Math.max(1, Math.floor(player.points / 100) + 1);
    } else {
        player = {
            username,
            points: pointsToAdd,
            level: 1
        };
        players.push(player);
    }
    
    savePlayerData(players);
    console.log(`Updated file-based points for ${username}: ${player.points}, Level: ${player.level}`);

    // After updating points, fetch the new leaderboard and emit it
    try {
        const newLeaderboard = await fetchLeaderboardData();
        io.emit('leaderboard_updated', { leaderboard: newLeaderboard });
        console.log("Emitted leaderboard_updated event");
    } catch (error) {
        console.error("Error fetching/emitting leaderboard after points update:", error);
    }
}

async function fetchLeaderboardData() {
    let leaderboard = [];
    // Try to get data from MongoDB first
    if (isMongoConnected()) {
        try {
            leaderboard = await User.find({}, {
                username: 1,
                'stats.totalPoints': 1,
                'stats.highestLevel': 1,
                'stats.gamesWon': 1
            })
            .sort({ 'stats.totalPoints': -1 })
            .limit(10);
            console.log("Leaderboard Helper: Retrieved top users from MongoDB");
        } catch (error) {
            console.error("MongoDB leaderboard helper error:", error);
        }
    }
    
    // If MongoDB failed or is not connected or returned no results, try to get data from file
    if (leaderboard.length === 0) {
        try {
            const players = loadPlayerData();
            leaderboard = players.map(player => ({
                username: player.username,
                stats: {
                    totalPoints: player.points || 0,
                    highestLevel: player.level || 1,
                    gamesWon: player.gamesWon || 0
                }
            }))
            .sort((a, b) => b.stats.totalPoints - a.stats.totalPoints)
            .slice(0, 10);
            console.log("Leaderboard Helper: Retrieved top users from file");
        } catch (error) {
            console.error("File-based leaderboard helper error:", error);
        }
    }
    return leaderboard;
}

// ... existing code ... 