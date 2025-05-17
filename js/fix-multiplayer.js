// fix-multiplayer.js - Immediate patch for multiplayer dictionary validation
(function() {
  console.log("🔧 Loading multiplayer fix...");
  
  // Function to attempt the patch
  function attemptPatch() {
    if (typeof MultiplayerGameUI === 'undefined' || !MultiplayerGameUI.prototype) {
      console.log("⏳ MultiplayerGameUI not found yet, waiting...");
      setTimeout(attemptPatch, 500);
      return;
    }
    
    try {
      // Store the original method
      const originalSubmitGuess = MultiplayerGameUI.prototype.submitGuess;
      
      // Replace with patched version that skips dictionary validation
      MultiplayerGameUI.prototype.submitGuess = function() {
        try {
          // Basic validation checks
          if (this.submittingGuess) {
            console.log("Already submitting a guess, preventing duplicate");
            return false;
          }
          
          if (!window.multiplayerSocket) {
            console.error("Socket not initialized");
            this.shakeCurrentRow();
            return false;
          }
          
          if (!window.multiplayerSocket.gameId) {
            console.error("No active game found");
            this.shakeCurrentRow();
            return false;
          }
          
          if (this.currentGuess.length !== this.wordLength) {
            console.error(`Guess must be ${this.wordLength} letters, got ${this.currentGuess.length}`);
            this.showMessage(`Word must be ${this.wordLength} letters`);
            this.shakeCurrentRow();
            return false;
          }
          
          // EMERGENCY FIX: Skip dictionary validation entirely
          console.log(`🔧 FIX APPLIED: Bypassing dictionary check for word "${this.currentGuess}"`);
          
          // Continue with the rest of the submission process
          const currentTime = Date.now();
          const guessId = `${this.currentGuess}_${window.multiplayerSocket.gameId}`;
          
          if (this.lastSubmittedGuesses && this.lastSubmittedGuesses[guessId]) {
            const timeSinceLastSubmit = currentTime - this.lastSubmittedGuesses[guessId];
            if (timeSinceLastSubmit < 2000) {
              console.log(`Preventing duplicate submission of ${this.currentGuess}`);
              return false;
            }
          }
          
          // Track this guess submission
          if (!this.lastSubmittedGuesses) {
            this.lastSubmittedGuesses = {};
          }
          this.lastSubmittedGuesses[guessId] = currentTime;
          
          console.log(`Submitting guess: ${this.currentGuess}`);
          
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
                console.log(`Processing guess result for submission ${submissionId}`);
                this.handleGuessResult(data);
              } else {
                console.log(`Ignoring guess result for old submission ID ${submissionId}, current is ${this.currentSubmissionId}`);
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
            
            // Send the guess to the server
            window.multiplayerSocket.socket.emit('submit_guess', {
              gameId: window.multiplayerSocket.gameId,
              guess: currentGuess
            });
            
            success = true; // Assume emission was successful
            
            // Safety timeout to clear lock after 5 seconds in case response never comes
            setTimeout(() => {
              if (this.currentSubmissionId === submissionId && this.submittingGuess) {
                console.log(`Clearing submission lock after timeout for ${submissionId}`);
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
          console.error("Error in patched submitGuess:", error);
          this.showMessage("Error submitting guess. Try again.");
          this.shakeCurrentRow();
          this.submittingGuess = false; // Reset submission lock
          return false;
        }
      };
      
      console.log("✅ Dictionary validation patch APPLIED! All guesses will be sent to the server regardless of local dictionary.");
      
      // Also add a global helper function to force the patch again if needed
      window.fixMultiplayerDictionary = function() {
        attemptPatch();
        return "Patch applied again. Try your guess now.";
      };
      
    } catch (error) {
      console.error("❌ Failed to patch multiplayer validation:", error);
    }
  }
  
  // Try to patch immediately
  attemptPatch();
  
  // Also try again after the page fully loads
  window.addEventListener('load', attemptPatch);
  
  // Create a visual indicator that the fix is active
  const fixIndicator = document.createElement('div');
  fixIndicator.style.cssText = 'position:fixed;bottom:10px;right:10px;background:rgba(0,150,0,0.7);color:white;padding:5px 10px;border-radius:4px;font-size:12px;z-index:9999;';
  fixIndicator.textContent = '🔧 Dictionary Fix Active';
  
  // Add to DOM when ready
  if (document.body) {
    document.body.appendChild(fixIndicator);
  } else {
    window.addEventListener('DOMContentLoaded', function() {
      document.body.appendChild(fixIndicator);
    });
  }
})(); 