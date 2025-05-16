// Home Screen Module
class HomeScreen {
    constructor() {
        this.currentUser = null;
        this.container = document.getElementById('home-container');
        
        // Try to get the container, create if needed
        if (!this.container) {
            this.createHomeUI();
        }
        
        // Get references to UI elements *after* potentially creating them
        this.profileSection = document.getElementById('profile-section');
        this.statsSection = document.getElementById('stats-section');
        this.gameOptionsSection = document.getElementById('game-options');
        this.friendsSection = document.getElementById('friends-section');
        this.friendsList = document.getElementById('friends-list');
        this.friendSearchInput = document.getElementById('friend-search');
        this.friendSearchResults = document.getElementById('friend-search-results');
        this.leaderboardList = document.getElementById('leaderboard-list'); // Reference leaderboard list element
        
        // Set up event listeners only if container exists
        if(this.container) {
        this.setupEventListeners();
        }
        
        this.fetchLeaderboard(); // Fetch initial leaderboard
        this.initializeSocketListeners(); // Add socket listeners
    }
    
    createHomeUI() {
        // Create container
        this.container = document.createElement('div');
        this.container.id = 'home-container';
        this.container.className = 'hidden';
        document.body.appendChild(this.container);
        
        // Add home screen content
        this.container.innerHTML = `
            <header class="home-header">
                <h1>Infinite Wordle</h1>
                <div class="user-account-controls">
                    <span id="home-username-display">Loading...</span>
                    <button id="logout-button" class="hidden">Logout</button> 
                </div>
            </header>
            
            <div class="home-content">
                <section id="profile-section" class="home-section">
                    <h2>Profile</h2>
                    <div class="profile-info">
                        <div class="avatar">
                            <span id="avatar-initials"></span>
                        </div>
                        <div class="user-info">
                            <h3 id="profile-username"></h3>
                            <p id="profile-level">Level: <span id="user-level">1</span></p>
                            <p id="profile-points">Points: <span id="user-points">0</span></p>
                        </div>
                    </div>
                </section>
                
                <section id="leaderboard-section" class="home-section">
                    <h2>Leaderboard</h2>
                    <div class="leaderboard-container">
                        <div class="leaderboard-header">
                            <span class="rank-col">Rank</span>
                            <span class="name-col">Player</span>
                            <span class="points-col">Points</span>
                            <span class="level-col">Level</span>
                        </div>
                        <div id="leaderboard-list" class="leaderboard-rows">
                            <div class="loading">Loading leaderboard...</div>
                        </div>
                    </div>
                </section>
                
                <section id="stats-section" class="home-section">
                    <h2>Statistics</h2>
                    <div class="stats-grid">
                        <div class="stat-box">
                            <span id="stats-played">0</span>
                            <label>Games Played</label>
                        </div>
                        <div class="stat-box">
                            <span id="stats-won">0</span>
                            <label>Games Won</label>
                        </div>
                        <div class="stat-box">
                            <span id="stats-streak">0</span>
                            <label>Current Streak</label>
                        </div>
                        <div class="stat-box">
                            <span id="stats-max-streak">0</span>
                            <label>Max Streak</label>
                        </div>
                    </div>
                </section>
                
                <section id="game-options" class="home-section">
                    <h2>Play Game</h2>
                    <div class="game-buttons">
                        <button id="single-player-btn" class="game-button">
                            <span class="icon">🎮</span>
                            <span class="label">Single Player</span>
                        </button>
                        <button id="multiplayer-btn" class="game-button">
                            <span class="icon">👥</span>
                            <span class="label">Multiplayer</span>
                        </button>
                    </div>
                </section>
                
                <section id="friends-section" class="home-section">
                    <h2>Friends</h2>
                    <div class="friends-search">
                        <input type="text" id="friend-search" placeholder="Search for friends...">
                        <button id="search-friend-btn">Search</button>
                    </div>
                    <div id="friend-search-results" class="friends-results hidden"></div>
                    <h3>Your Friends</h3>
                    <div id="friends-list" class="friends-list">
                        <p class="no-friends">You haven't added any friends yet.</p>
                    </div>
                </section>
            </div>
        `;
        
        // Add CSS
        const style = document.createElement('style');
        style.textContent = `
            #home-container {
                width: 100%;
                height: 100%;
                background-color: var(--background-color);
                overflow-y: auto;
                padding-bottom: 30px;
            }
            
            .home-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background-color: white;
                border-bottom: 1px solid #eee;
                box-shadow: 0 2px 4px rgba(0,0,0,0.08);
                position: sticky;
                top: 0;
                z-index: 10;
            }
            
            .home-header h1 {
                margin: 0;
                color: var(--correct-color);
                font-size: 1.8rem;
            }
            
            /* UPDATED: User account controls in header */
            .user-account-controls {
                 display: flex;
                 align-items: center;
                 gap: 15px;
            }
            #home-username-display {
                 font-weight: bold;
            }
            #logout-button {
                padding: 8px 16px;
                border: none;
                background-color: #f0f0f0;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .home-content {
                max-width: 900px;
                margin: 0 auto;
                padding: 20px;
                display: grid;
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            @media (min-width: 768px) {
                .home-content {
                    grid-template-columns: 1fr 1fr;
                }
            }
            
            .home-section {
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.08);
                padding: 20px;
            }
            
            .home-section h2 {
                margin-top: 0;
                margin-bottom: 15px;
                color: #333;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
            }
            
            /* Profile Section */
            .profile-info {
                display: flex;
                align-items: center;
                gap: 20px;
            }
            
            .avatar {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background-color: var(--correct-color);
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-size: 2rem;
                font-weight: bold;
            }
            
            .user-info h3 {
                margin: 0 0 10px 0;
                font-size: 1.5rem;
            }
            
            .user-info p {
                margin: 5px 0;
            }
            
            /* Stats Section */
            .stats-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            
            .stat-box {
                text-align: center;
                padding: 15px;
                background-color: #f8f8f8;
                border-radius: 6px;
            }
            
            .stat-box span {
                display: block;
                font-size: 1.8rem;
                font-weight: bold;
                color: var(--correct-color);
                margin-bottom: 5px;
            }
            
            .stat-box label {
                font-size: 14px;
                color: #555;
            }
            
            /* Leaderboard Section */
            .leaderboard-container {
                display: flex;
                flex-direction: column;
            }
            
            .leaderboard-header {
                display: flex;
                background-color: #f0f0f0;
                padding: 10px;
                font-weight: bold;
                border-radius: 4px 4px 0 0;
            }
            
            .leaderboard-rows {
                display: flex;
                flex-direction: column;
            }
            
            .leaderboard-row {
                display: flex;
                padding: 10px;
                border-bottom: 1px solid #eee;
            }
            
            .leaderboard-row.current-user {
                background-color: rgba(76, 175, 80, 0.1);
                font-weight: bold;
            }
            
            .rank-col {
                width: 50px;
                text-align: center;
            }
            
            .name-col {
                flex: 1;
            }
            
            .points-col, .level-col {
                width: 80px;
                text-align: center;
            }
            
            .no-data, .error, .loading {
                padding: 15px;
                text-align: center;
                color: #777;
                font-style: italic;
            }
            
            .error {
                color: #d32f2f;
            }
            
            /* Game Options */
            .game-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            
            .game-button {
                padding: 25px 15px;
                border: none;
                border-radius: 8px;
                background-color: #f0f0f0;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }
            
            .game-button:hover {
                transform: translateY(-3px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            
            .game-button .icon {
                font-size: 2rem;
            }
            
            .game-button .label {
                font-weight: bold;
                color: #444;
            }
            
            /* Friends Section */
            .friends-search {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            #friend-search {
                flex-grow: 1;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            
            #search-friend-btn {
                padding: 8px 16px;
                background-color: var(--correct-color);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .friends-results {
                margin-bottom: 20px;
                background-color: #f8f8f8;
                border-radius: 6px;
                padding: 15px;
            }
            
            .search-result-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                border-bottom: 1px solid #eee;
            }
            
            .search-result-item:last-child {
                border-bottom: none;
            }
            
            .search-result-item button {
                padding: 6px 12px;
                background-color: var(--correct-color);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .friends-list {
                margin-top: 15px;
            }
            
            .friend-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                background-color: #f8f8f8;
                border-radius: 6px;
                margin-bottom: 10px;
            }
            
            .friend-info {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .friend-avatar {
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
            
            .friend-item .actions button {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                background-color: #6a89cc;
                color: white;
            }
            
            .no-friends {
                color: #777;
                text-align: center;
                font-style: italic;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        if (!this.container) return;
        
        // Logout button
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                if (window.authSystem) {
                    window.authSystem.logout();
                }
            });
        }
        
        // Play buttons
        const singlePlayerBtn = document.getElementById('single-player-btn');
        if (singlePlayerBtn) {
            singlePlayerBtn.addEventListener('click', () => {
                this.startSinglePlayerGame();
            });
        }
        
        const multiplayerBtn = document.getElementById('multiplayer-btn');
        if (multiplayerBtn) {
            multiplayerBtn.addEventListener('click', () => {
                this.showMultiplayerOptions();
            });
        }
        
        // Friends search
        const searchFriendBtn = document.getElementById('search-friend-btn');
        if (searchFriendBtn) {
            searchFriendBtn.addEventListener('click', () => {
                this.searchFriends();
            });
        }
        
        // Enter key for search
        if (this.friendSearchInput) {
            this.friendSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchFriends();
                }
            });
        }
    }
    
    init(user) {
        if (!user) {
            console.warn("HomeScreen.init: Called with no user data");
            return;
        }
        
        console.log("HomeScreen.init: Initializing with user:", user.username);
        this.currentUser = user;
        
        // Update the top-right username from "Loading..." to actual username
        const usernameDisplay = document.getElementById('home-username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = this.currentUser.username || 'Guest';
        }
        
        this.updateProfileUI();
        this.updateStatsUI();
        this.updateFriendsUI();
        
        // Make sure our container is visible
        if (this.container) {
            this.container.classList.remove('hidden');
        }
    }
    
    updateProfileUI() {
        console.log("[updateProfileUI] Called. Current user data:", JSON.stringify(this.currentUser));
        if (!this.currentUser) {
             console.log("[updateProfileUI] No current user.");
             return;
        }
        
        // Update avatar initials
        const avatarInitials = document.getElementById('avatar-initials');
        if (avatarInitials) {
            avatarInitials.textContent = this.currentUser.username.substring(0, 2).toUpperCase();
        }
        
        // Update user info
        const profileUsername = document.getElementById('profile-username');
        if (profileUsername) {
            profileUsername.textContent = this.currentUser.username;
        }
        
        const currentPoints = this.currentUser.stats?.totalPoints ?? 0;
        const calculatedLevel = Math.max(1, Math.floor(currentPoints / 500) + 1);
        
        console.log(`[updateProfileUI] Points: ${currentPoints}, Calculated Level: ${calculatedLevel}`);

        // We probably shouldn't update the highestLevel here, just display it
        // if (this.currentUser.stats) {
        //     this.currentUser.stats.highestLevel = Math.max(this.currentUser.stats.highestLevel || 1, level);
        // }
        
        // Update UI
        const userLevel = document.getElementById('user-level');
        if (userLevel) {
             // Display the *calculated* current level based on points, or highestLevel if that's intended
            userLevel.textContent = this.currentUser.stats?.highestLevel || calculatedLevel; // Use highestLevel from stats if available, otherwise calculated
            console.log("[updateProfileUI] Updating user-level element to:", userLevel.textContent);
        }
        
        const userPoints = document.getElementById('user-points');
        if (userPoints) {
            userPoints.textContent = currentPoints;
            console.log("[updateProfileUI] Updating user-points element to:", userPoints.textContent);
        }
    }
    
    updateStatsUI() {
         console.log("[updateStatsUI] Called. Current user stats:", JSON.stringify(this.currentUser?.stats));
        if (!this.currentUser || !this.currentUser.stats) {
             console.log("[updateStatsUI] No current user or stats.");
             return;
        }
        
        const stats = this.currentUser.stats;
        
        const statsPlayed = document.getElementById('stats-played');
        if (statsPlayed) {
            statsPlayed.textContent = stats.gamesPlayed ?? 0;
             console.log("[updateStatsUI] Updating stats-played element to:", statsPlayed.textContent);
        }
        
        const statsWon = document.getElementById('stats-won');
        if (statsWon) {
            statsWon.textContent = stats.gamesWon ?? 0;
             console.log("[updateStatsUI] Updating stats-won element to:", statsWon.textContent);
        }
        
        const statsStreak = document.getElementById('stats-streak');
        if (statsStreak) {
            statsStreak.textContent = stats.currentStreak ?? 0;
             console.log("[updateStatsUI] Updating stats-streak element to:", statsStreak.textContent);
        }
        
        const statsMaxStreak = document.getElementById('stats-max-streak');
        if (statsMaxStreak) {
            statsMaxStreak.textContent = stats.maxStreak ?? 0;
             console.log("[updateStatsUI] Updating stats-max-streak element to:", statsMaxStreak.textContent);
        }
    }
    
    updateFriendsUI() {
        if (!this.currentUser || !this.friendsList) return;
        
        // TODO: Fetch friends data from backend API instead of relying on currentUser.friends
        console.warn("updateFriendsUI: Using potentially incomplete friends list from currentUser object. Needs API integration.");
        
        this.friendsList.innerHTML = '';
        const friends = this.currentUser.friends || []; // Use empty array if undefined
        
        if (friends.length === 0) {
            this.friendsList.innerHTML = '<p class="no-friends">You haven\'t added any friends yet.</p>'; // Updated message
            return;
        }
        
        // Assuming this.currentUser.friends is just an array of usernames for now
        friends.forEach(friendUsername => { 
            const friendElement = document.createElement('div');
            friendElement.className = 'friend-item';
            
            // Fetch detailed friend data? For now, just display username.
            const initials = friendUsername.substring(0, 2).toUpperCase(); 
            
            friendElement.innerHTML = `
                <div class="friend-info">
                    <div class="friend-avatar">${initials}</div>
                    <div>
                        <h4>${friendUsername}</h4>
                        <!-- <small>Level X</small>  Need to fetch friend stats -->
                    </div>
                </div>
                <div class="actions">
                    <button class="play-button" data-username="${friendUsername}">Challenge</button>
                </div>
            `;
            
            this.friendsList.appendChild(friendElement);
            
            // Add event listener for play button
            friendElement.querySelector('.play-button').addEventListener('click', (e) => {
                const username = e.target.dataset.username;
                this.startGameWithFriend(username);
            });
        });
    }
    
    searchFriends() {
        const searchTerm = this.friendSearchInput.value.trim();
        
        if (!searchTerm) {
            this.showMessage('Please enter a search term', true);
            return;
        }
        
        // Show loading state
        this.friendSearchResults.innerHTML = '<p><i>Searching...</i></p>';
        this.friendSearchResults.classList.remove('hidden');
        
        // Make API request to search for users
        const token = localStorage.getItem('wordleToken');
        if (!token) {
            this.showMessage('You must be logged in to search for friends', true);
            return;
        }
        
        fetch(`${window.API_BASE_URL}/search-users?q=${encodeURIComponent(searchTerm)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(users => {
            this.displaySearchResults(users);
        })
        .catch(error => {
            console.error('Error searching for friends:', error);
            this.friendSearchResults.innerHTML = '<p>Error searching for users. Please try again.</p>';
        });
    }
    
    displaySearchResults(results) {
        if (!this.friendSearchResults) return;
        
        this.friendSearchResults.innerHTML = '';
        
        if (results.length === 0) {
            this.friendSearchResults.innerHTML = '<p>No users found.</p>';
            return;
        }
        
            results.forEach(user => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
            
            // Add friend button or already friends indicator
            let actionButton = '';
            if (user.isFriend) {
                actionButton = '<span class="already-friend">Already Friends</span>';
            } else {
                actionButton = `<button class="add-friend-btn" data-username="${user.username}">Add Friend</button>`;
            }
                
                resultItem.innerHTML = `
                <div class="search-user-info">
                    <div class="search-user-avatar">${user.username.substring(0, 2).toUpperCase()}</div>
                    <span>${user.username}</span>
                </div>
                ${actionButton}
                `;
                
                this.friendSearchResults.appendChild(resultItem);
                
            // Add event listener to the Add Friend button if present
            const addButton = resultItem.querySelector('.add-friend-btn');
            if (addButton) {
                addButton.addEventListener('click', (e) => {
                    const username = e.target.dataset.username;
                    this.addFriend(username);
                });
            }
        });
        
        // Add some style for the search results
        const style = document.createElement('style');
        style.textContent = `
            .search-result-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                border-bottom: 1px solid #eee;
            }
            
            .search-user-info {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .search-user-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background-color: var(--present-color);
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-weight: bold;
                font-size: 14px;
            }
            
            .add-friend-btn {
                padding: 6px 12px;
                background-color: var(--correct-color);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .already-friend {
                color: #888;
                font-style: italic;
            }
        `;
        document.head.appendChild(style);
        
        this.friendSearchResults.classList.remove('hidden');
    }
    
    addFriend(username) {
        // Show loading state
        this.showMessage('Adding friend...', false);
        
        // Make API request to add friend
        const token = localStorage.getItem('wordleToken');
        if (!token) {
            this.showMessage('You must be logged in to add friends', true);
            return;
        }
        
        fetch(`${window.API_BASE_URL}/add-friend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ friendUsername: username })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || `Error adding friend: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            // Update current user with the updated user data including the new friend
        if (window.authSystem) {
                window.authSystem.currentUser = data.user;
        }
        
        // Update UI
            this.showMessage(`${username} added to your friends!`, false);
        this.updateFriendsUI();
            
            // Clear search results
        this.friendSearchInput.value = '';
            this.friendSearchResults.classList.add('hidden');
            
            // Refresh search results if still visible
            if (!this.friendSearchResults.classList.contains('hidden')) {
                this.searchFriends();
            }
        })
        .catch(error => {
            console.error('Error adding friend:', error);
            this.showMessage(error.message || 'Error adding friend. Please try again.', true);
        });
    }
    
    startSinglePlayerGame() {
        console.log("Starting single player game from home screen");
        if (!this.container) return;
        
        this.container.classList.add('hidden');
        
        // Start the game
        if (window.gameManager) {
            console.log("Game manager found, starting game");
            window.gameManager.startGame('single', this.currentUser);
        } else {
            console.error('Game manager not initialized');
            // Try to initialize game manager if it doesn't exist
            window.gameManager = new GameManager();
            if (window.gameManager) {
                console.log("Game manager created, starting game");
                window.gameManager.startGame('single', this.currentUser);
            } else {
                console.error("Failed to create game manager");
                // Show error message to user
                this.showMessage("Error starting game. Please refresh the page and try again.", true);
                this.container.classList.remove('hidden');
            }
        }
    }
    
    showMultiplayerOptions() {
        console.log("Showing multiplayer options");
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'multiplayer-modal';
        modal.className = 'modal';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content multiplayer-modal-content';
        modalContent.style.width = 'min(600px, 90%)';
        modalContent.style.maxWidth = '600px';
        
        // Add content
        modalContent.innerHTML = `
            <h2>Multiplayer Mode</h2>
            <div class="multiplayer-options">
                <button id="random-match-btn" class="multiplayer-option">
                    <div class="option-icon">🎲</div>
                    <div class="option-label">Random Match</div>
                    <div class="option-desc">Play against a random opponent</div>
                        </button>
                <button id="friend-match-btn" class="multiplayer-option">
                    <div class="option-icon">👥</div>
                    <div class="option-label">Play with Friend</div>
                    <div class="option-desc">Challenge a friend to a game</div>
                        </button>
                    </div>
            <div class="difficulty-selection">
                <h3>Select Difficulty</h3>
                <div class="difficulty-options">
                    <label class="difficulty-option">
                        <input type="radio" name="difficulty" value="easy">
                        <span class="difficulty-label">Easy</span>
                        <span class="difficulty-desc">4-letter words</span>
                    </label>
                    <label class="difficulty-option">
                        <input type="radio" name="difficulty" value="medium" checked>
                        <span class="difficulty-label">Medium</span>
                        <span class="difficulty-desc">5-letter words</span>
                    </label>
                    <label class="difficulty-option">
                        <input type="radio" name="difficulty" value="hard">
                        <span class="difficulty-label">Hard</span>
                        <span class="difficulty-desc">6-letter words</span>
                    </label>
                    <label class="difficulty-option">
                        <input type="radio" name="difficulty" value="expert">
                        <span class="difficulty-label">Expert</span>
                        <span class="difficulty-desc">7-letter words</span>
                    </label>
                </div>
            </div>
            <div class="modal-buttons">
                <button id="back-from-multiplayer" class="secondary-button">Back</button>
                </div>
            `;
        
        // Add modal to document
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
            
            // Add CSS
            const style = document.createElement('style');
            style.textContent = `
            .multiplayer-modal-content {
                padding: 30px;
            }
            
            .multiplayer-options {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 25px;
            }
            
            .multiplayer-option {
                padding: 20px;
                border: 1px solid #ddd;
                    border-radius: 8px;
                background-color: white;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                    text-align: center;
                transition: all 0.2s ease;
            }
            
            .multiplayer-option:hover {
                border-color: var(--correct-color);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            
            .option-icon {
                font-size: 2rem;
                margin-bottom: 10px;
            }
            
            .option-label {
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .option-desc {
                font-size: 0.9rem;
                color: #777;
            }
            
            .difficulty-selection {
                    margin-bottom: 25px;
            }
            
            .difficulty-selection h3 {
                margin-bottom: 15px;
            }
            
            .difficulty-options {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            
            .difficulty-option {
                    display: flex;
                    flex-direction: column;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 12px;
                cursor: pointer;
                position: relative;
                overflow: hidden;
            }
            
            .difficulty-option input {
                position: absolute;
                opacity: 0;
            }
            
            .difficulty-option input:checked + .difficulty-label {
                color: var(--correct-color);
            }
            
            .difficulty-option input:checked ~ .difficulty-option {
                border-color: var(--correct-color);
                background-color: rgba(106, 170, 100, 0.1);
            }
            
            .difficulty-label {
                    font-weight: bold;
                margin-bottom: 5px;
            }
            
            .difficulty-desc {
                font-size: 0.8rem;
                color: #777;
            }
            
            .modal-buttons {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            .secondary-button {
                padding: 10px 20px;
                    background-color: #f0f0f0;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
        `;
        document.head.appendChild(style);
        
        // Set up event listeners
        document.getElementById('random-match-btn').addEventListener('click', () => {
            // Remove modal
            modal.remove();
            
            // Get selected difficulty
            const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
            
            // Start random multiplayer game
            this.startMultiplayerGame('random', null, difficulty);
        });
        
        document.getElementById('friend-match-btn').addEventListener('click', () => {
            // Remove modal
            modal.remove();
            
            // Initialize socket connection and friend challenge system
            if (window.multiplayerSocket && !window.multiplayerSocket.connected) {
                window.multiplayerSocket.connect();
            }
            
            if (window.friendChallengesUI) {
                window.friendChallengesUI.initialize();
            }
            
            // Show friends list
                this.showFriendsList();
            });
            
        document.getElementById('back-from-multiplayer').addEventListener('click', () => {
            // Remove modal
            modal.remove();
        });
        
        // Allow click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    showFriendsList() {
        console.log("Showing friends list");
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'friends-modal';
        modal.className = 'modal';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content friends-modal-content';
        modalContent.style.width = 'min(600px, 90%)';
        modalContent.style.maxWidth = '600px';
        
        // Get logged in user
        const user = window.userManager.getCurrentUser();
        
        // Create friends list container
        const friendsListContainer = document.createElement('div');
        friendsListContainer.id = 'modal-friends-list';
        friendsListContainer.className = 'modal-friends-list';
        
        // Add header
        modalContent.innerHTML = `
            <h2>Play with Friends</h2>
            <div id="challenge-form-container"></div>
            <h3>Your Friends</h3>
        `;
        
        // Add friends list
        modalContent.appendChild(friendsListContainer);
        
        // Add back button
        const backButton = document.createElement('button');
        backButton.id = 'back-from-friends';
        backButton.className = 'secondary-button';
        backButton.textContent = 'Back';
        backButton.style.marginTop = '20px';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'modal-buttons';
        buttonContainer.appendChild(backButton);
        
        modalContent.appendChild(buttonContainer);
        
        // Add modal to document
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Add CSS
        const style = document.createElement('style');
        style.textContent = `
            .friends-modal-content {
                padding: 30px;
            }
            
            .modal-friends-list {
                max-height: 300px;
                overflow-y: auto;
                margin-bottom: 20px;
                border: 1px solid #eee;
                border-radius: 8px;
                padding: 10px;
            }
            
            .friend-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                border-bottom: 1px solid #eee;
            }
            
            .friend-item:last-child {
                border-bottom: none;
            }
            
            .friend-info {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .friend-avatar {
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
            
            .friend-name {
                font-weight: bold;
            }
            
            .play-with-friend-btn {
                padding: 6px 12px;
                background-color: var(--correct-color);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .no-friends-message {
                text-align: center;
                padding: 20px;
                color: #777;
            }
        `;
        document.head.appendChild(style);
        
        // Check for friendChallengesUI and create challenge form
        if (window.friendChallengesUI && user && user.friends) {
            const challengeFormContainer = document.getElementById('challenge-form-container');
            window.friendChallengesUI.createChallengeForm(challengeFormContainer, user.friends);
        }
        
        // Populate friends list
        this.populateFriendsListModal();
        
        // Set up event listeners
        document.getElementById('back-from-friends').addEventListener('click', () => {
            // Remove modal
            modal.remove();
            
            // Show multiplayer options
            this.showMultiplayerOptions();
        });
        
        // Allow click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    startGameWithFriend(friendUsername) {
        // Instead of starting the game immediately, create a challenge first
        if (window.multiplayerSocket && window.friendChallengesUI) {
            // Initialize the socket and friend challenge system if not already initialized
            if (!window.multiplayerSocket.connected) {
                window.multiplayerSocket.connect();
            }
            window.friendChallengesUI.initialize();
            
            // Show form to challenge friend with difficulty selection
            if (window.gameManager) {
                const gameManager = window.gameManager;
                
                // Create a modal for difficulty selection
                const modal = document.createElement('div');
                modal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                `;
                
                const modalContent = document.createElement('div');
                modalContent.style.cssText = `
                    background-color: white;
                    padding: 20px;
                    border-radius: 8px;
                    max-width: 400px;
                    width: 90%;
                `;
                
                modalContent.innerHTML = `
                    <h3 style="margin-top: 0;">Challenge ${friendUsername}</h3>
                    <div style="margin-bottom: 15px;">
                        <label for="challenge-difficulty" style="display: block; margin-bottom: 5px;">Difficulty:</label>
                        <select id="challenge-difficulty" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="easy">Easy (4 letters)</option>
                            <option value="medium" selected>Medium (5 letters)</option>
                            <option value="hard">Hard (6 letters)</option>
                            <option value="expert">Expert (7 letters)</option>
                        </select>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 10px;">
                        <button id="cancel-challenge" style="padding: 8px 15px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                        <button id="send-challenge" style="padding: 8px 15px; background-color: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer;">Challenge</button>
                    </div>
                `;
                
                // Add buttons event listeners
                modal.appendChild(modalContent);
                document.body.appendChild(modal);
                
                document.getElementById('cancel-challenge').addEventListener('click', () => {
                    modal.remove();
                });
                
                document.getElementById('send-challenge').addEventListener('click', () => {
                    const difficulty = document.getElementById('challenge-difficulty').value;
                    console.log(`Challenging ${friendUsername} with difficulty: ${difficulty}`);
                    
                    // Check if multiplayerSocket is available
                    if (window.multiplayerSocket) {
                        if (typeof window.multiplayerSocket.createFriendChallenge === 'function') {
                            // Use the correct function if available
                            window.multiplayerSocket.createFriendChallenge(friendUsername, difficulty);
                        } else if (typeof window.multiplayerSocket.socket?.emit === 'function') {
                            // Fallback to direct socket emission
                            console.log('Using fallback socket emission for challenge');
                            
                            // Get current username
                            const username = window.username || 
                                           (window.userManager ? window.userManager.getCurrentUsername() : null) || 
                                           (window.currentUser ? window.currentUser.username : 'Player');
                            
                            // Create challenge ID
                            const challengeId = Math.floor(Math.random() * 1000000).toString();
                            
                            // Send challenge directly
                            window.multiplayerSocket.socket.emit('challenge', {
                                fromUsername: username,
                                toUsername: friendUsername,
                                difficulty: difficulty,
                                challengeId: challengeId,
                                timestamp: Date.now()
                            });
                            
                            console.log(`Direct challenge sent with ID: ${challengeId}`);
                        }
                    } else {
                        console.error('MultiplayerSocket not available');
                        this.showMessage('Cannot challenge player: Multiplayer not connected', true);
                    }
                    
                    this.showMessage(`Challenging ${friendUsername}...`, false);
                    modal.remove();
                });
            } else {
                // Fallback if game manager isn't available
                const difficulty = 'medium';
                
                // Check if multiplayerSocket is available
                if (window.multiplayerSocket) {
                    if (typeof window.multiplayerSocket.createFriendChallenge === 'function') {
                        // Use the correct function if available
                        window.multiplayerSocket.createFriendChallenge(friendUsername, difficulty);
                    } else if (typeof window.multiplayerSocket.socket?.emit === 'function') {
                        // Fallback to direct socket emission
                        console.log('Using fallback socket emission for challenge');
                        
                        // Get current username
                        const username = window.username || 
                                      (window.userManager ? window.userManager.getCurrentUsername() : null) || 
                                      (window.currentUser ? window.currentUser.username : 'Player');
                        
                        // Create challenge ID
                        const challengeId = Math.floor(Math.random() * 1000000).toString();
                        
                        // Send challenge directly
                        window.multiplayerSocket.socket.emit('challenge', {
                            fromUsername: username,
                            toUsername: friendUsername,
                            difficulty: difficulty,
                            challengeId: challengeId,
                            timestamp: Date.now()
                        });
                        
                        console.log(`Direct challenge sent with ID: ${challengeId}`);
                    }
                } else {
                    console.error('MultiplayerSocket not available');
                    this.showMessage('Cannot challenge player: Multiplayer not connected', true);
                }
                
                this.showMessage(`Challenging ${friendUsername}...`, false);
            }
        } else {
            this.showMessage('Error: Multiplayer system not initialized.', true);
        }
    }
    
    startMultiplayerGame(mode, opponent = null, difficulty = null) {
        const mpContainer = document.getElementById('multiplayer-container');
        if (mpContainer) {
            mpContainer.classList.add('hidden');
        }
        
        // Start the game
        if (window.gameManager) {
            window.gameManager.startGame('multiplayer', this.currentUser, { mode, opponent, difficulty });
        } else {
            console.error('Game manager not initialized');
        }
    }
    
    showMessage(message, isError = true) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'error' : 'success'}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Add CSS if not already added
        if (!document.querySelector('style#toast-style')) {
            const style = document.createElement('style');
            style.id = 'toast-style';
            style.textContent = `
                .toast {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 12px 20px;
                    border-radius: 4px;
                    color: white;
                    font-weight: bold;
                    box-shadow: 0 3px 6px rgba(0,0,0,0.16);
                    z-index: 9999;
                    animation: fadeInOut 3s ease-in-out forwards;
                }
                
                .toast.error {
                    background-color: #e74c3c;
                }
                
                .toast.success {
                    background-color: #2ecc71;
                }
                
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, 20px); }
                    10% { opacity: 1; transform: translate(-50%, 0); }
                    90% { opacity: 1; transform: translate(-50%, 0); }
                    100% { opacity: 0; transform: translate(-50%, -20px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove after animation
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    show() {
        console.log("HomeScreen.show: Called.");
        
        // Ensure we have the LATEST currentUser data from AuthSystem
        if (window.authSystem && window.authSystem.isAuthenticated) {
            this.currentUser = window.authSystem.currentUser; // Get potentially updated user data
            console.log("HomeScreen.show: Using currentUser from authSystem:", JSON.stringify(this.currentUser));
            
            if (!this.currentUser) {
                 console.error("HomeScreen.show: Auth system has no user data despite being authenticated.");
                 if (window.authSystem) {
                     console.log("HomeScreen.show: Redirecting to login screen");
                     if (this.container) this.container.classList.add('hidden');
                     this.container.style.display = 'none';
                     window.authSystem.initAuthentication();
                 return;
            }
        }

            // Update header display
            const usernameDisplay = document.getElementById('home-username-display');
            if (usernameDisplay) {
                usernameDisplay.textContent = this.currentUser.username || 'Guest';
            }
            const logoutButton = document.getElementById('logout-button');
            if (logoutButton) {
                logoutButton.classList.remove('hidden');
            }
            
            // Update all UI components with the latest data
             console.log("HomeScreen.show: Calling updateProfileUI and updateStatsUI...");
             this.updateProfileUI(); // Uses this.currentUser
             this.updateStatsUI(); // Uses this.currentUser
             this.updateFriendsUI(); // Uses this.currentUser
            
            // Make sure container is visible
            if (this.container) {
                console.log("HomeScreen.show: Making home container visible");
                this.container.classList.remove('hidden');
                this.container.style.display = 'block'; // Explicitly set display style
        } else {
                console.error("HomeScreen.show: Home container not found!");
            }
        } else {
             console.warn("HomeScreen.show: No authenticated user found");
             // Hide home container if it exists (before showing auth)
             if (this.container) {
                 this.container.classList.add('hidden');
                 this.container.style.display = 'none';
             }
             if (window.authSystem) {
                 window.authSystem.initAuthentication(); // This should show the auth container
             }
        }
    }

    // Add this new method to refreshUserData from server
    async refreshUserData() {
        console.log("Refreshing user data from server...");
        if (!window.authSystem || !window.authSystem.isAuthenticated) {
            console.warn("Cannot refresh user data - not authenticated");
            return;
        }
        
        try {
            // Use the checkSession method to refresh user data
            await window.authSystem.checkSession();
            
            // Update our local reference
            this.currentUser = window.authSystem.currentUser;
            console.log("User data refreshed. Friends:", this.currentUser.friends);
            
            // Update UI
             this.updateProfileUI();
             this.updateStatsUI();
             this.updateFriendsUI();
            
            return true;
        } catch (error) {
            console.error("Error refreshing user data:", error);
            return false;
        }
    }

    // Populate the friends list modal with the current user's friends
    populateFriendsListModal() {
        const friendsListContainer = document.getElementById('modal-friends-list');
        if (!friendsListContainer) return;
        
        // Clear the container
        friendsListContainer.innerHTML = '';
        
        // Get the current user
        const user = window.userManager.getCurrentUser();
        if (!user || !user.friends || user.friends.length === 0) {
            friendsListContainer.innerHTML = `
                <div class="no-friends-message">
                    You don't have any friends yet. Use the search function to find friends.
                </div>
            `;
            return;
        }
        
        // Add each friend to the list
        user.friends.forEach(friend => {
            const friendItem = document.createElement('div');
            friendItem.className = 'friend-item';
            
            friendItem.innerHTML = `
                <div class="friend-info">
                    <div class="friend-avatar">${friend.charAt(0).toUpperCase()}</div>
                    <div class="friend-name">${friend}</div>
                </div>
                <button class="play-with-friend-btn" data-username="${friend}">Challenge</button>
            `;
            
            // Add event listener to the challenge button
            const challengeBtn = friendItem.querySelector('.play-with-friend-btn');
            challengeBtn.addEventListener('click', () => {
                // Get selected difficulty
                const difficultySelect = document.querySelector('#difficulty-select');
                const difficulty = difficultySelect ? difficultySelect.value : 'medium';
                
                if (window.multiplayerSocket && window.multiplayerSocket.connected) {
                    // Create a challenge using the socket
                    window.multiplayerSocket.createFriendChallenge(friend, difficulty);
        } else {
                    this.showMessage('Error connecting to game server', true);
        }
            });
            
            friendsListContainer.appendChild(friendItem);
        });
    }

    initializeSocketListeners() {
        if (window.multiplayerSocket && window.multiplayerSocket.socket) {
            console.log("HomeScreen: Setting up socket listeners...");

            // Listener for leaderboard updates
            window.multiplayerSocket.socket.off('leaderboard_updated'); // Remove previous listener if any
            window.multiplayerSocket.socket.on('leaderboard_updated', (data) => {
                console.log('Received leaderboard_updated event', data);
                if (data && data.leaderboard) {
                    this.updateLeaderboardUI(data.leaderboard);
                }
            });

            // Listener for user stats updates
            window.multiplayerSocket.socket.off('user_stats_updated'); // Remove previous listener if any
            window.multiplayerSocket.socket.on('user_stats_updated', (data) => {
                console.log('Received user_stats_updated event', data);
                if (data && data.user && window.authSystem) {
                     // Check if the update is for the currently logged-in user
                    if (window.authSystem.currentUser && window.authSystem.currentUser.username === data.user.username) {
                        console.log('Updating current user stats locally...');
                        window.authSystem.updateCurrentUser(data.user); // Update local user data
                        this.show(); // Refresh the home screen UI to show new stats
        } else {
                        console.log('Stats update received, but not for the current user.');
                    }
                }
            });

        } else {
            console.warn("HomeScreen: Multiplayer socket not available for listeners.");
             // Optionally retry setup after a delay
             setTimeout(() => this.initializeSocketListeners(), 3000);
        }
    }

    // Add fetchLeaderboard method
    fetchLeaderboard() {
        if (!this.leaderboardList) {
            console.error("Leaderboard list element not found for fetching.");
            return;
        }
        this.leaderboardList.innerHTML = '<div class="loading">Loading leaderboard...</div>'; // Show loading state
        
        fetch(`${window.API_BASE_URL}/leaderboard`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
             })
            .then(data => {
                if (data.success && data.leaderboard) {
                    this.updateLeaderboardUI(data.leaderboard);
                } else {
                    this.leaderboardList.innerHTML = '<div class="error">Failed to load leaderboard data</div>';
                    console.error("Error fetching leaderboard:", data.error || "Unknown error");
                }
            })
            .catch(error => {
                console.error('Error fetching leaderboard:', error);
                this.leaderboardList.innerHTML = '<div class="error">Failed to load leaderboard</div>';
            });
    }

    // New method to update leaderboard UI from data
    updateLeaderboardUI(leaderboardData) {
        if (!this.leaderboardList) {
            console.error("Leaderboard list element not found for updating.");
            return;
        }
        
        this.leaderboardList.innerHTML = ''; // Clear previous entries or loading message
        
        if (!leaderboardData || leaderboardData.length === 0) {
            this.leaderboardList.innerHTML = '<div class="no-data">No leaderboard data available</div>';
            return;
        }
        
        const currentUsername = window.authSystem?.currentUser?.username; // Get current user for highlighting
        
        leaderboardData.forEach((user, index) => {
            const row = document.createElement('div');
            row.classList.add('leaderboard-row');
            
            // Highlight the current user
            if (user.username === currentUsername) {
                row.classList.add('current-user');
            }
            
            // Ensure stats exist before accessing properties
            const points = user.stats?.totalPoints ?? 0;
            const level = user.stats?.highestLevel ?? 1;

            row.innerHTML = `
                <span class="rank-col">${index + 1}</span>
                <span class="name-col">${user.username}</span>
                <span class="points-col">${points}</span>
                <span class="level-col">${level}</span>
            `;
            this.leaderboardList.appendChild(row);
        });
    }
}

// Initialize home screen
window.homeScreen = null;
document.addEventListener('DOMContentLoaded', () => {
    window.homeScreen = new HomeScreen();
    // Initial setup might happen here or in init.js depending on auth flow
}); 