// Dummy accounts for testing friends functionality

// This file adds dummy accounts to make it easier to test the friends system
// It also provides helper functions to simulate friend requests

class DummyAccountManager {
    constructor() {
        this.dummyAccounts = [
            { username: 'Alice', status: 'online' },
            { username: 'Bob', status: 'online' },
            { username: 'Charlie', status: 'offline' },
            { username: 'Diana', status: 'online' },
            { username: 'Eva', status: 'online' },
            { username: 'Frank', status: 'offline' },
            { username: 'Grace', status: 'online' },
            { username: 'Henry', status: 'online' },
            { username: 'Ivy', status: 'offline' },
            { username: 'Jack', status: 'online' }
        ];
        
        // Check if we need to create the dummy accounts in the user database
        this.createDummyAccountsInDatabase();
        
        console.log("Dummy Account Manager initialized with", this.dummyAccounts.length, "accounts");
    }
    
    // Create dummy accounts in the user database
    createDummyAccountsInDatabase() {
        if (!window.userManager) {
            console.error("User Manager not found, cannot create dummy accounts");
            return;
        }
        
        let createdCount = 0;
        
        this.dummyAccounts.forEach(account => {
            // Only create if it doesn't already exist
            if (!window.userManager.usernameExists(account.username)) {
                // Temporarily store current user
                const currentUser = window.userManager.currentUser;
                
                // Create the dummy account
                const newUser = {
                    username: account.username,
                    created: new Date().toISOString(),
                    stats: {
                        gamesPlayed: Math.floor(Math.random() * 50),
                        gamesWon: Math.floor(Math.random() * 30),
                        currentStreak: Math.floor(Math.random() * 5),
                        maxStreak: Math.floor(Math.random() * 10),
                        lastPlayed: new Date().toISOString()
                    },
                    preferences: {
                        theme: 'light',
                        difficulty: 'normal'
                    },
                    friends: [],
                    friendRequests: {
                        sent: [],
                        received: []
                    }
                };
                
                // Add to all users database
                window.userManager.allUsers[account.username] = newUser;
                createdCount++;
                
                // Restore current user
                window.userManager.currentUser = currentUser;
            }
        });
        
        // Save all users to storage
        if (createdCount > 0) {
            window.userManager.saveUserDataToStorage();
            console.log(`Created ${createdCount} new dummy accounts in the database`);
        } else {
            console.log("All dummy accounts already exist in the database");
        }
    }
    
    // Get all dummy accounts
    getAllAccounts() {
        return this.dummyAccounts;
    }
    
    // Get a random dummy account
    getRandomAccount() {
        const randomIndex = Math.floor(Math.random() * this.dummyAccounts.length);
        return this.dummyAccounts[randomIndex];
    }
    
    // Send a simulated friend request from a random dummy account
    sendRandomFriendRequest() {
        if (!window.friendsManager || !window.userManager || !window.userManager.isLoggedIn()) {
            console.error("Friends Manager not found or user not logged in");
            return null;
        }
        
        const account = this.getRandomAccount();
        const result = window.friendsManager.receiveMockFriendRequest(account.username);
        
        console.log("Simulated friend request from", account.username, "Result:", result.success);
        
        // Update the friends button to show the notification
        if (window.friendsUI && typeof window.friendsUI.createFriendsButton === 'function') {
            // Remove old button
            const oldBtn = document.getElementById('friends-btn');
            if (oldBtn) oldBtn.remove();
            
            // Create new button with updated counts
            window.friendsUI.createFriendsButton();
        }
        
        return account.username;
    }
    
    // Create UI for adding dummy accounts
    createDummyUI() {
        // Create a button for sending random friend requests
        const button = document.createElement('button');
        button.id = 'simulate-friend-btn';
        button.innerHTML = '🤖 Simulate Request';
        button.style.cssText = 'position:fixed;bottom:50px;right:10px;padding:8px 15px;background:#9c27b0;color:white;border:none;border-radius:4px;cursor:pointer;z-index:1000;';
        
        button.addEventListener('click', () => {
            if (!window.userManager || !window.userManager.isLoggedIn()) {
                alert("You need to create a user account first!");
                return;
            }
            
            const username = this.sendRandomFriendRequest();
            if (username) {
                // Show notification
                const notification = document.createElement('div');
                notification.style.cssText = 'position:fixed;bottom:100px;right:10px;padding:10px 15px;background:#9c27b0;color:white;border-radius:4px;z-index:1000;animation:fadeOut 5s forwards;';
                notification.innerHTML = `<strong>New friend request from:</strong> ${username}`;
                document.body.appendChild(notification);
                
                // Remove after 5 seconds
                setTimeout(() => {
                    notification.remove();
                }, 5000);
            }
        });
        
        // Add animation style
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeOut {
                0% { opacity: 1; }
                70% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // Add button to page
        document.body.appendChild(button);
        
        // Add a floating panel to show all dummy accounts
        const accountsButton = document.createElement('button');
        accountsButton.id = 'show-dummies-btn';
        accountsButton.innerHTML = '👻 Show Dummies';
        accountsButton.style.cssText = 'position:fixed;bottom:90px;right:10px;padding:8px 15px;background:#673ab7;color:white;border:none;border-radius:4px;cursor:pointer;z-index:1000;';
        
        accountsButton.addEventListener('click', () => {
            this.toggleDummyPanel();
        });
        
        document.body.appendChild(accountsButton);
        
        // Create the panel (initially hidden)
        this.createDummyPanel();
    }
    
    // Create panel to show dummy accounts
    createDummyPanel() {
        // Check if panel already exists
        if (document.getElementById('dummy-panel')) return;
        
        // Create panel container
        const panel = document.createElement('div');
        panel.id = 'dummy-panel';
        panel.style.cssText = 'position:fixed;bottom:130px;right:10px;width:250px;background:white;border-radius:8px;box-shadow:0 0 10px rgba(0,0,0,0.2);overflow:hidden;z-index:1000;display:none;';
        
        // Add header
        const header = document.createElement('div');
        header.style.cssText = 'padding:10px;background:#673ab7;color:white;display:flex;justify-content:space-between;align-items:center;';
        
        const title = document.createElement('h3');
        title.textContent = 'Dummy Accounts';
        title.style.margin = '0';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = 'background:none;border:none;color:white;font-size:20px;cursor:pointer;';
        closeBtn.addEventListener('click', () => {
            this.toggleDummyPanel();
        });
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        panel.appendChild(header);
        
        // Add login message
        if (!window.userManager || !window.userManager.isLoggedIn()) {
            const loginMsg = document.createElement('div');
            loginMsg.style.cssText = 'padding:15px;text-align:center;';
            loginMsg.innerHTML = '<strong>Please create a user account first!</strong>';
            panel.appendChild(loginMsg);
            document.body.appendChild(panel);
            return;
        }
        
        // Add content
        const content = document.createElement('div');
        content.style.cssText = 'padding:10px;max-height:300px;overflow-y:auto;';
        
        // Create account list
        this.dummyAccounts.forEach(account => {
            const item = document.createElement('div');
            item.style.cssText = 'padding:8px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;';
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = account.username;
            nameSpan.style.fontWeight = 'bold';
            
            const statusSpan = document.createElement('span');
            statusSpan.textContent = account.status;
            statusSpan.style.cssText = `color:${account.status === 'online' ? 'green' : '#999'};`;
            
            const addButton = document.createElement('button');
            addButton.textContent = 'Add';
            addButton.style.cssText = 'padding:4px 8px;background:#4caf50;color:white;border:none;border-radius:4px;cursor:pointer;';
            addButton.addEventListener('click', () => {
                // Send friend request
                if (window.friendsManager) {
                    const result = window.friendsManager.sendFriendRequest(account.username);
                    
                    // Show toast message
                    const toast = document.createElement('div');
                    toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);padding:10px 20px;background:rgba(0,0,0,0.7);color:white;border-radius:4px;z-index:10000;';
                    toast.textContent = result.message;
                    document.body.appendChild(toast);
                    
                    // Remove after 3 seconds
                    setTimeout(() => {
                        toast.remove();
                    }, 3000);
                }
            });
            
            item.appendChild(nameSpan);
            item.appendChild(statusSpan);
            item.appendChild(addButton);
            content.appendChild(item);
        });
        
        panel.appendChild(content);
        
        // Add to body
        document.body.appendChild(panel);
    }
    
    // Toggle visibility of dummy accounts panel
    toggleDummyPanel() {
        const panel = document.getElementById('dummy-panel');
        if (panel) {
            if (panel.style.display === 'none') {
                // Recreate panel if user logged in since last check
                if (!window.userManager || !window.userManager.isLoggedIn()) {
                    panel.remove();
                    this.createDummyPanel();
                }
                panel.style.display = 'block';
            } else {
                panel.style.display = 'none';
            }
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Wait for the friends system to initialize first
    setTimeout(() => {
        if (window.userManager) {
            window.dummyManager = new DummyAccountManager();
            window.dummyManager.createDummyUI();
            
            console.log("Dummy accounts ready for testing");
        } else {
            console.warn("User Manager not found - dummy accounts not initialized");
        }
    }, 1500);
}); 