// Friends Management System
class FriendsManager {
    constructor() {
        console.log("Friends Manager initialized");
    }
    
    // Get the current user data from AuthSystem
    getCurrentUser() {
        // Use authSystem instead of userManager
        if (!window.authSystem || !window.authSystem.currentUser) {
            console.warn("FriendsManager: No user logged in via authSystem.");
            return null;
        }
        return window.authSystem.currentUser;
    }

    // Get the current user's username from AuthSystem
    getCurrentUsername() {
        const user = this.getCurrentUser();
        return user ? user.username : null;
    }
    
    // Placeholder for saving changes via API
    async saveChanges(updateData) { 
        // TODO: Implement backend API call to save friend list updates
        console.warn("FriendsManager.saveChanges: Backend API call needed.", updateData);
        // Example structure (needs actual endpoint):
        /*
        const token = localStorage.getItem('wordleToken');
        if (!token) return { success: false, message: "Not authenticated" };
        try {
            const response = await fetch('/api/friends', { // Replace with actual endpoint
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(updateData)
            });
            if (!response.ok) {
                 throw new Error('Failed to save friend changes');
            }
            return await response.json(); // Expect { success: true, ... } or { success: false, message: ... }
        } catch (error) {
            console.error("Error saving friend changes:", error);
            return { success: false, message: "Error saving changes" };
        }
        */
       return { success: true, message: "Save skipped (needs backend)" }; // Temporary success
    }
    
    // Add a friend (This now becomes sending a request)
    async addFriend(username) {
         return this.sendFriendRequest(username); // Adding directly is usually done via requests
    }
    
    // Send a friend request (Needs Backend)
    async sendFriendRequest(username) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            return { success: false, message: "You must be logged in to send friend requests" };
        }
        
        // Check if username is valid
        if (!username || username.trim() === '' || username === currentUser.username) {
            return { success: false, message: "Invalid username or cannot add yourself" };
        }

        // TODO: Implement backend API call to send friend request
        console.warn("sendFriendRequest: Backend API call needed to send request to", username);
        // Example structure:
        /*
        const result = await this.saveChanges({ action: 'send_request', targetUsername: username });
        if (result.success) {
            // Optionally update local state if API doesn't return full user object
            if (!currentUser.friendRequests) currentUser.friendRequests = { sent: [], received: [] };
            if (!currentUser.friendRequests.sent.some(r => r.username === username)) {
                 currentUser.friendRequests.sent.push({ username: username, sentOn: new Date().toISOString() });
            }
        }
        return result; 
        */
       return { success: false, message: "Sending requests disabled (needs backend)" }; // Temporary failure
    }
    
    // Accept a friend request (Needs Backend)
    async acceptFriendRequest(requestUsername) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            return { success: false, message: "You must be logged in" };
        }
        
        // TODO: Implement backend API call to accept friend request
        console.warn("acceptFriendRequest: Backend API call needed for", requestUsername);
        /*
        const result = await this.saveChanges({ action: 'accept_request', requesterUsername: requestUsername });
        if (result.success) {
             // Update local state if necessary (API might return updated user)
             if (currentUser.friendRequests?.received) {
                  currentUser.friendRequests.received = currentUser.friendRequests.received.filter(r => r.username !== requestUsername);
             }
             if (currentUser.friends && !currentUser.friends.some(f => f.username === requestUsername)) {
                  currentUser.friends.push({ username: requestUsername, addedOn: new Date().toISOString(), status: 'online' });
             }
        }
        return result;
        */
       return { success: false, message: "Accepting requests disabled (needs backend)" }; // Temporary failure
    }
    
    // Reject a friend request (Needs Backend)
    async rejectFriendRequest(requestUsername) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            return { success: false, message: "You must be logged in" };
        }
        
        // TODO: Implement backend API call to reject friend request
        console.warn("rejectFriendRequest: Backend API call needed for", requestUsername);
        /*
        const result = await this.saveChanges({ action: 'reject_request', requesterUsername: requestUsername });
        if (result.success) {
             // Update local state
             if (currentUser.friendRequests?.received) {
                  currentUser.friendRequests.received = currentUser.friendRequests.received.filter(r => r.username !== requestUsername);
             }
        }
        return result;
        */
       return { success: false, message: "Rejecting requests disabled (needs backend)" }; // Temporary failure
    }
    
    // Cancel a sent friend request (Needs Backend)
    async cancelFriendRequest(targetUsername) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            return { success: false, message: "You must be logged in" };
        }

        // TODO: Implement backend API call to cancel friend request
        console.warn("cancelFriendRequest: Backend API call needed for", targetUsername);
        /*
        const result = await this.saveChanges({ action: 'cancel_request', targetUsername: targetUsername });
         if (result.success) {
             // Update local state
             if (currentUser.friendRequests?.sent) {
                  currentUser.friendRequests.sent = currentUser.friendRequests.sent.filter(r => r.username !== targetUsername);
             }
        }
        return result;
        */
       return { success: false, message: "Canceling requests disabled (needs backend)" }; // Temporary failure
    }
    
    // Remove a friend (Needs Backend)
    async removeFriend(friendUsername) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            return { success: false, message: "You must be logged in" };
        }

        // TODO: Implement backend API call to remove friend
        console.warn("removeFriend: Backend API call needed for", friendUsername);
        /*
        const result = await this.saveChanges({ action: 'remove_friend', targetUsername: friendUsername });
        if (result.success) {
            // Update local state
            if (currentUser.friends) {
                 currentUser.friends = currentUser.friends.filter(f => f.username !== friendUsername);
            }
        }
        return result;
        */
       return { success: false, message: "Removing friends disabled (needs backend)" }; // Temporary failure
    }
    
    // Check if a user is already a friend (uses local data for now)
    isFriend(username) {
        const currentUser = this.getCurrentUser();
        if (!currentUser || !currentUser.friends) return false;
        // Assumes currentUser.friends is an array of strings (usernames) from the /me endpoint
        return currentUser.friends.includes(username); 
    }
    
    // Get all friends (uses local data for now)
    getAllFriends() {
        const currentUser = this.getCurrentUser();
        // Assumes currentUser.friends is an array of strings from /me endpoint
        // We map it to the object structure the UI expects
        return (currentUser?.friends || []).map(username => ({ username, status: 'unknown' })); 
    }
    
    // Get pending requests (uses local data for now - needs API)
    getPendingRequests() {
        const currentUser = this.getCurrentUser();
        // TODO: This data needs to come from the backend /me endpoint or a dedicated /requests endpoint
        console.warn("getPendingRequests: Using potentially stale/missing data from currentUser object.")
        return currentUser?.friendRequests?.received || [];
    }
    
    // Get sent requests (uses local data for now - needs API)
    getSentRequests() {
        const currentUser = this.getCurrentUser();
        // TODO: This data needs to come from the backend /me endpoint or a dedicated /requests endpoint
        console.warn("getSentRequests: Using potentially stale/missing data from currentUser object.")
        return currentUser?.friendRequests?.sent || [];
    }
    
    // Mock request functionality can be removed or adapted if backend handles actual requests
    // For now, disable it as it relied on modifying the old userManager data structure
    receiveMockFriendRequest(username) {
        console.warn("receiveMockFriendRequest: Disabled as it relied on old userManager.");
        return { success: false, message: "Mock requests disabled." };
    }
}

// Create friends UI
class FriendsUI {
    constructor(friendsManager) {
        this.friendsManager = friendsManager;
        // Get initial requests (might be empty if user data isn't fully loaded yet)
        this.pendingRequests = this.friendsManager.getPendingRequests(); 
        
        // Create UI elements
        this.createFriendsButton();
    }
    
    // Create a button to open the friends panel
    createFriendsButton() {
        // Remove existing button if it exists
        const existingButton = document.getElementById('friends-btn');
        if (existingButton) {
            existingButton.remove();
        }

        const button = document.createElement('button');
        button.id = 'friends-btn';
        button.innerHTML = '👥 Friends';
        button.style.cssText = 'position:fixed;top:10px;right:10px;padding:8px 15px;background:#4caf50;color:white;border:none;border-radius:4px;cursor:pointer;z-index:1000;font-family:Arial,sans-serif;';
        
        // Add notification badge if there are requests
        const pendingCount = this.pendingRequests.length;
        if (pendingCount > 0) {
            const badge = document.createElement('span');
            badge.textContent = pendingCount;
            badge.style.cssText = 'position:absolute;top:-8px;right:-8px;background:red;color:white;border-radius:50%;padding:3px 6px;font-size:12px;';
            button.appendChild(badge);
        }
        
        // Click handler
        button.addEventListener('click', () => {
            this.toggleFriendsPanel();
        });
        
        document.body.appendChild(button);
        console.log('Friends button created and added to document');
    }
    
    // Toggle the friends panel
    toggleFriendsPanel() {
        // Check if panel already exists
        let panel = document.getElementById('friends-panel');
        
        if (panel) {
            // Hide panel if it exists
            panel.remove();
        } else {
            // Create panel if it doesn't exist
            this.createFriendsPanel();
        }
    }
    
    // Create the friends panel
    createFriendsPanel() {
        // Create panel container
        const panel = document.createElement('div');
        panel.id = 'friends-panel';
        panel.style.cssText = 'position:fixed;top:50px;right:10px;width:300px;height:auto;max-height:500px;background:white;border-radius:8px;box-shadow:0 0 10px rgba(0,0,0,0.2);overflow:hidden;z-index:1000;';
        
        // Add header
        const header = document.createElement('div');
        header.style.cssText = 'padding:15px;background:#4caf50;color:white;display:flex;justify-content:space-between;align-items:center;';
        
        const title = document.createElement('h3');
        title.textContent = 'Friends';
        title.style.margin = '0';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = 'background:none;border:none;color:white;font-size:20px;cursor:pointer;';
        closeBtn.addEventListener('click', () => panel.remove());
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        panel.appendChild(header);
        
        // Add tabs
        const tabs = document.createElement('div');
        tabs.style.cssText = 'display:flex;background:#f5f5f5;border-bottom:1px solid #ddd;';
        
        const tabFriends = document.createElement('div');
        tabFriends.textContent = 'Friends';
        tabFriends.dataset.tab = 'friends';
        tabFriends.style.cssText = 'flex:1;padding:10px;text-align:center;cursor:pointer;border-bottom:2px solid #4caf50;font-weight:bold;';
        
        const tabRequests = document.createElement('div');
        tabRequests.textContent = 'Requests';
        tabRequests.dataset.tab = 'requests';
        tabRequests.style.cssText = 'flex:1;padding:10px;text-align:center;cursor:pointer;border-bottom:2px solid transparent;';
        
        // Add notification badge to requests tab
        const pendingCount = this.pendingRequests.length;
        if (pendingCount > 0) {
            const badge = document.createElement('span');
            badge.textContent = pendingCount;
            badge.style.cssText = 'display:inline-block;background:red;color:white;border-radius:50%;padding:2px 6px;font-size:10px;margin-left:5px;';
            tabRequests.appendChild(badge);
        }
        
        tabs.appendChild(tabFriends);
        tabs.appendChild(tabRequests);
        panel.appendChild(tabs);
        
        // Add content container
        const content = document.createElement('div');
        content.style.cssText = 'padding:15px;max-height:350px;overflow-y:auto;';
        panel.appendChild(content);
        
        // Tab click handlers
        tabFriends.addEventListener('click', () => {
            tabFriends.style.borderBottom = '2px solid #4caf50';
            tabFriends.style.fontWeight = 'bold';
            tabRequests.style.borderBottom = '2px solid transparent';
            tabRequests.style.fontWeight = 'normal';
            this.showFriendsList(content);
        });
        
        tabRequests.addEventListener('click', async () => {
            tabRequests.style.borderBottom = '2px solid #4caf50';
            tabRequests.style.fontWeight = 'bold';
            tabFriends.style.borderBottom = '2px solid transparent';
            tabFriends.style.fontWeight = 'normal';
            // Refresh requests data before showing
            this.pendingRequests = this.friendsManager.getPendingRequests(); 
            this.showRequestsList(content);
        });
        
        // Add content
        this.showFriendsList(content);
        
        // Add to document
        document.body.appendChild(panel);
    }
    
    // Show the friends list
    showFriendsList(container) {
        // Clear container
        container.innerHTML = '';
        
        // Get friends
        const friends = this.friendsManager.getAllFriends();
        
        // Add search/add input with autocomplete
        const addContainer = document.createElement('div');
        addContainer.style.cssText = 'margin-bottom:15px;';
        
        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = 'display:flex;position:relative;';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Search users or add friend';
        input.style.cssText = 'flex:1;padding:8px;border:1px solid #ddd;border-radius:4px 0 0 4px;';
        
        const addBtn = document.createElement('button');
        addBtn.textContent = 'Add';
        addBtn.style.cssText = 'padding:8px 15px;background:#4caf50;color:white;border:none;border-radius:0 4px 4px 0;cursor:pointer;';
        
        // Create suggestions dropdown (initially hidden)
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'user-suggestions';
        suggestionsContainer.style.cssText = 'position:absolute;top:100%;left:0;right:0;background:white;border:1px solid #ddd;border-top:none;border-radius:0 0 4px 4px;max-height:150px;overflow-y:auto;z-index:100;display:none;';
        
        inputContainer.appendChild(input);
        inputContainer.appendChild(addBtn);
        inputContainer.appendChild(suggestionsContainer);
        
        addContainer.appendChild(inputContainer);
        container.appendChild(addContainer);
        
        // Status message area
        const statusMsg = document.createElement('div');
        statusMsg.id = 'friends-status-msg';
        statusMsg.style.cssText = 'margin-bottom:15px;padding:10px;border-radius:4px;display:none;';
        container.appendChild(statusMsg);
        
        // Add button handler
        addBtn.addEventListener('click', async () => {
            const username = input.value.trim();
            const result = await this.friendsManager.sendFriendRequest(username);
            
            statusMsg.textContent = result.message;
            statusMsg.style.display = 'block';
            statusMsg.style.background = result.success ? '#e8f5e9' : '#ffebee';
            statusMsg.style.color = result.success ? '#2e7d32' : '#c62828';
            
            if (result.success) {
                input.value = '';
                suggestionsContainer.style.display = 'none';
                // Refresh the list if needed
                setTimeout(() => this.showRequestsList(container), 2000);
            }
        });
        
        // Add input event for Enter key
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                // Stop propagation to prevent it from being caught by the game
                event.stopPropagation();
                // Prevent the default form submission
                event.preventDefault();
                // Manually trigger the click on the add button
                addBtn.click();
            }
        });
        
        // Add input event for autocomplete
        input.addEventListener('input', () => {
            const searchValue = input.value.trim().toLowerCase();
            
            // TODO: Autocomplete needs backend API call to search users
            console.warn("Friends Autocomplete: Needs backend user search API.");
            // Clear suggestions for now
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
            return; 

            /* OLD Autocomplete logic using userManager
            const allUsernames = window.userManager ? window.userManager.getAllUsernames() : [];
            // ... rest of old autocomplete logic ...
            */
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (event) => {
            if (!suggestionsContainer.contains(event.target) && event.target !== input) {
                suggestionsContainer.style.display = 'none';
            }
        });
        
        // Show suggestions on input focus
        input.addEventListener('focus', () => {
            // Trigger the input event to populate suggestions
            input.dispatchEvent(new Event('input'));
        });
        
        // Create friends list
        const list = document.createElement('div');
        list.style.cssText = 'border-top:1px solid #eee;';
        
        if (friends.length === 0) {
            // Empty state
            const emptyState = document.createElement('div');
            emptyState.style.cssText = 'padding:20px;text-align:center;color:#999;';
            emptyState.textContent = 'You don\'t have any friends yet. Add some using the search box above!';
            list.appendChild(emptyState);
        } else {
            // List of friends
            friends.forEach((friend, index) => {
                const item = document.createElement('div');
                item.style.cssText = 'padding:10px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;';
                
                const info = document.createElement('div');
                
                const name = document.createElement('div');
                name.textContent = friend.username;
                name.style.fontWeight = 'bold';
                
                const status = document.createElement('div');
                status.textContent = friend.status;
                status.style.cssText = `font-size:12px;color:${friend.status === 'online' ? 'green' : '#999'};`;
                
                info.appendChild(name);
                info.appendChild(status);
                
                const actions = document.createElement('div');
                
                const playBtn = document.createElement('button');
                playBtn.textContent = 'Challenge';
                playBtn.style.cssText = 'padding:5px 10px;background:#2196f3;color:white;border:none;border-radius:4px;cursor:pointer;margin-right:5px;';
                playBtn.addEventListener('click', () => {
                    // Create game setup dialog
                    const dialog = document.createElement('div');
                    dialog.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:8px;box-shadow:0 0 20px rgba(0,0,0,0.3);z-index:2000;min-width:300px;';
                    
                    const title = document.createElement('h3');
                    title.textContent = `Challenge ${friend.username}`;
                    title.style.margin = '0 0 15px 0';
                    dialog.appendChild(title);
                    
                    // Word length selector
                    const lengthLabel = document.createElement('div');
                    lengthLabel.textContent = 'Select word length:';
                    lengthLabel.style.marginBottom = '10px';
                    dialog.appendChild(lengthLabel);
                    
                    const lengthSelect = document.createElement('select');
                    lengthSelect.style.cssText = 'width:100%;padding:8px;margin-bottom:20px;border:1px solid #ddd;border-radius:4px;';
                    
                    [4,5,6,7,8].forEach(length => {
                        const option = document.createElement('option');
                        option.value = length;
                        option.textContent = `${length} letters`;
                        if (length === 5) option.selected = true;
                        lengthSelect.appendChild(option);
                    });
                    
                    dialog.appendChild(lengthSelect);
                    
                    // Buttons
                    const buttons = document.createElement('div');
                    buttons.style.cssText = 'display:flex;justify-content:flex-end;gap:10px;';
                    
                    const cancelBtn = document.createElement('button');
                    cancelBtn.textContent = 'Cancel';
                    cancelBtn.style.cssText = 'padding:8px 15px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;';
                    cancelBtn.addEventListener('click', () => {
                        dialog.remove();
                        overlay.remove();
                    });
                    
                    const startBtn = document.createElement('button');
                    startBtn.textContent = 'Start Game';
                    startBtn.style.cssText = 'padding:8px 15px;background:#4caf50;color:white;border:none;border-radius:4px;cursor:pointer;';
                    startBtn.addEventListener('click', () => {
                        const wordLength = parseInt(lengthSelect.value);
                        const currentUser = this.friendsManager.getCurrentUsername();
                        
                        // Initialize multiplayer if needed
                        if (!window.multiplayerGame && typeof window.initializeMultiplayer === 'function') {
                            window.initializeMultiplayer();
                        }
                        
                        // Small delay to ensure initialization is complete
                        setTimeout(() => {
                            if (window.multiplayerGame) {
                                const result = window.multiplayerGame.startGame(currentUser, friend.username, wordLength);
                                if (result.success) {
                                    // Hide friends panel and dialog
                                    const panel = document.getElementById('friends-panel');
                                    if (panel) panel.remove();
                                    dialog.remove();
                                    overlay.remove();
                                    
                                    // Start the game
                                    if (typeof window.startMultiplayerGame === 'function') {
                                        window.startMultiplayerGame(result);
                                    } else {
                                        alert('Multiplayer UI system not initialized');
                                    }
                                } else {
                                    alert(result.message);
                                }
                            } else {
                                alert('Multiplayer game system not initialized');
                            }
                        }, 100);
                    });
                    
                    buttons.appendChild(cancelBtn);
                    buttons.appendChild(startBtn);
                    dialog.appendChild(buttons);
                    
                    // Add overlay
                    const overlay = document.createElement('div');
                    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1999;';
                    overlay.addEventListener('click', () => {
                        dialog.remove();
                        overlay.remove();
                    });
                    
                    // Add to document
                    document.body.appendChild(overlay);
                    document.body.appendChild(dialog);
                });
                
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Remove';
                removeBtn.style.cssText = 'padding:5px 10px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;';
                removeBtn.addEventListener('click', async () => {
                    const result = await this.friendsManager.removeFriend(friend.username);
                    
                    statusMsg.textContent = result.message;
                    statusMsg.style.display = 'block';
                    statusMsg.style.background = result.success ? '#e8f5e9' : '#ffebee';
                    statusMsg.style.color = result.success ? '#2e7d32' : '#c62828';
                    
                    if (result.success) {
                        this.showFriendsList(container);
                        
                        // Update the friends button (in case badge needs to be updated)
                        const btn = document.getElementById('friends-btn');
                        if (btn) btn.remove();
                        this.createFriendsButton();
                    }
                });
                
                actions.appendChild(playBtn);
                actions.appendChild(removeBtn);
                
                item.appendChild(info);
                item.appendChild(actions);
                list.appendChild(item);
            });
        }
        
        container.appendChild(list);
    }
    
    // Show the requests list
    async showRequestsList(container) {
        // Clear container
        container.innerHTML = '';
        
        // Get requests
        const pending = this.friendsManager.getPendingRequests();
        const sent = this.friendsManager.getSentRequests();
        
        // Status message area
        const statusMsg = document.createElement('div');
        statusMsg.id = 'friends-status-msg';
        statusMsg.style.cssText = 'margin-bottom:15px;padding:10px;border-radius:4px;display:none;';
        container.appendChild(statusMsg);
        
        // Create pending requests section
        const pendingSection = document.createElement('div');
        pendingSection.style.cssText = 'margin-bottom:20px;';
        
        const pendingTitle = document.createElement('h4');
        pendingTitle.textContent = 'Incoming Requests';
        pendingTitle.style.margin = '0 0 10px 0';
        pendingSection.appendChild(pendingTitle);
        
        if (pending.length === 0) {
            // Empty state
            const emptyState = document.createElement('div');
            emptyState.style.cssText = 'padding:10px;text-align:center;color:#999;border:1px solid #eee;border-radius:4px;';
            emptyState.textContent = 'No pending friend requests';
            pendingSection.appendChild(emptyState);
        } else {
            // List of pending requests
            pending.forEach((request, index) => {
                const item = document.createElement('div');
                item.style.cssText = 'padding:10px;display:flex;justify-content:space-between;align-items:center;border:1px solid #eee;border-radius:4px;margin-bottom:8px;';
                
                const info = document.createElement('div');
                info.textContent = request.username;
                info.style.fontWeight = 'bold';
                
                const actions = document.createElement('div');
                
                const acceptBtn = document.createElement('button');
                acceptBtn.textContent = 'Accept';
                acceptBtn.style.cssText = 'padding:5px 10px;background:#4caf50;color:white;border:none;border-radius:4px;cursor:pointer;margin-right:5px;';
                acceptBtn.addEventListener('click', async () => {
                    const result = await this.friendsManager.acceptFriendRequest(request.username);
                    
                    statusMsg.textContent = result.message;
                    statusMsg.style.display = 'block';
                    statusMsg.style.background = result.success ? '#e8f5e9' : '#ffebee';
                    statusMsg.style.color = result.success ? '#2e7d32' : '#c62828';
                    
                    if (result.success) {
                        this.showRequestsList(container);
                        
                        // Update the friends button (in case badge needs to be updated)
                        const btn = document.getElementById('friends-btn');
                        if (btn) btn.remove();
                        this.createFriendsButton();
                    }
                });
                
                const rejectBtn = document.createElement('button');
                rejectBtn.textContent = 'Reject';
                rejectBtn.style.cssText = 'padding:5px 10px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;';
                rejectBtn.addEventListener('click', async () => {
                    const result = await this.friendsManager.rejectFriendRequest(request.username);
                    
                    statusMsg.textContent = result.message;
                    statusMsg.style.display = 'block';
                    statusMsg.style.background = result.success ? '#e8f5e9' : '#ffebee';
                    statusMsg.style.color = result.success ? '#2e7d32' : '#c62828';
                    
                    if (result.success) {
                        this.showRequestsList(container);
                        
                        // Update the friends button (in case badge needs to be updated)
                        const btn = document.getElementById('friends-btn');
                        if (btn) btn.remove();
                        this.createFriendsButton();
                    }
                });
                
                actions.appendChild(acceptBtn);
                actions.appendChild(rejectBtn);
                
                item.appendChild(info);
                item.appendChild(actions);
                pendingSection.appendChild(item);
            });
        }
        
        container.appendChild(pendingSection);
        
        // Create sent requests section
        const sentSection = document.createElement('div');
        
        const sentTitle = document.createElement('h4');
        sentTitle.textContent = 'Sent Requests';
        sentTitle.style.margin = '0 0 10px 0';
        sentSection.appendChild(sentTitle);
        
        if (sent.length === 0) {
            // Empty state
            const emptyState = document.createElement('div');
            emptyState.style.cssText = 'padding:10px;text-align:center;color:#999;border:1px solid #eee;border-radius:4px;';
            emptyState.textContent = 'No outgoing friend requests';
            sentSection.appendChild(emptyState);
        } else {
            // List of sent requests
            sent.forEach((request, index) => {
                const item = document.createElement('div');
                item.style.cssText = 'padding:10px;display:flex;justify-content:space-between;align-items:center;border:1px solid #eee;border-radius:4px;margin-bottom:8px;';
                
                const info = document.createElement('div');
                info.textContent = request.username;
                info.style.fontWeight = 'bold';
                
                const actions = document.createElement('div');
                
                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = 'Cancel';
                cancelBtn.style.cssText = 'padding:5px 10px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;';
                cancelBtn.addEventListener('click', async () => {
                    const result = await this.friendsManager.cancelFriendRequest(request.username);
                    
                    statusMsg.textContent = result.message;
                    statusMsg.style.display = 'block';
                    statusMsg.style.background = result.success ? '#e8f5e9' : '#ffebee';
                    statusMsg.style.color = result.success ? '#2e7d32' : '#c62828';
                    
                    if (result.success) {
                        this.showRequestsList(container);
                    }
                });
                
                actions.appendChild(cancelBtn);
                
                item.appendChild(info);
                item.appendChild(actions);
                sentSection.appendChild(item);
            });
        }
        
        container.appendChild(sentSection);
        
        // Add debug tools for testing
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const debugSection = document.createElement('div');
            debugSection.style.cssText = 'margin-top:20px;padding-top:20px;border-top:1px solid #ddd;';
            
            const debugTitle = document.createElement('h4');
            debugTitle.textContent = 'Debug Tools';
            debugTitle.style.margin = '0 0 10px 0';
            debugSection.appendChild(debugTitle);
            
            const mockContainer = document.createElement('div');
            mockContainer.style.cssText = 'display:flex;';
            
            const mockInput = document.createElement('input');
            mockInput.type = 'text';
            mockInput.placeholder = 'Simulate request from...';
            mockInput.style.cssText = 'flex:1;padding:8px;border:1px solid #ddd;border-radius:4px 0 0 4px;';
            
            const mockBtn = document.createElement('button');
            mockBtn.textContent = 'Simulate';
            mockBtn.style.cssText = 'padding:8px 15px;background:#9c27b0;color:white;border:none;border-radius:0 4px 4px 0;cursor:pointer;';
            
            mockBtn.addEventListener('click', async () => {
                const username = mockInput.value.trim();
                if (username) {
                    // This function is now disabled/needs backend
                    const result = this.friendsManager.receiveMockFriendRequest(username);
                    
                    statusMsg.textContent = result.message;
                    statusMsg.style.display = 'block';
                    statusMsg.style.background = result.success ? '#e8f5e9' : '#ffebee';
                    statusMsg.style.color = result.success ? '#2e7d32' : '#c62828';
                    
                    if (result.success) {
                        mockInput.value = '';
                        this.showRequestsList(container);
                        
                        // Update the friends button (in case badge needs to be updated)
                        const btn = document.getElementById('friends-btn');
                        if (btn) btn.remove();
                        this.createFriendsButton();
                    }
                }
            });
            
            mockContainer.appendChild(mockInput);
            mockContainer.appendChild(mockBtn);
            debugSection.appendChild(mockContainer);
            
            container.appendChild(debugSection);
        }
    }
}

// Initialize the friends system on page load
document.addEventListener('DOMContentLoaded', function() {
    // Wait for auth system to initialize first
    setTimeout(() => {
        // Check for authSystem instead of userManager
        if (window.authSystem) {
            // Initialize friends manager
            window.friendsManager = new FriendsManager();
            
            // Initialize friends UI
            window.friendsUI = new FriendsUI(window.friendsManager);
            
            console.log("Friends system initialized");
        } else {
            console.warn("Auth System not found - friends system not initialized");
        }
    }, 500); // Wait half a second for auth system to initialize
}); 