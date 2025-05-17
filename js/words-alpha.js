// Ultra-simple words_alpha.txt loader - MODIFIED TO USE HARDCODED TARGET WORDS
console.log("WORDS_ALPHA: Starting loader with hardcoded target words");

// Global dictionary variables
window.WORDS_ALPHA = new Set();
window.S_WORDS = new Set();
window.S_WORDS_LOADED = false;
window.ACCEPT_ALL_WORDS = false; // Set to false by default to enforce validation

// Global flag to indicate dictionary loading status
window.DICTIONARY_LOADED = false;

// This is the critical function that checks if a word is in the dictionary
window.isWordInDictionary = function(word) {
    if (!word) return false;
    
    // Always convert to uppercase for case-insensitive matching
    const upperWord = word.toUpperCase().trim();
    
    // Check if it's in the allowed guesses dictionary (S_WORDS)
    const result = window.S_WORDS.has(upperWord);
    console.log(`Word check: "${upperWord}" - ${result ? 'FOUND' : 'NOT FOUND'} in dictionary (${window.S_WORDS.size} words)`);
    
    return result;
};

// For backwards compatibility with dictionary.js
window.isWordInWordsAlpha = function(word) {
    return window.isWordInDictionary(word);
};

// Load the dictionary from hardcoded words and s.txt
function loadDictionary() {
    console.log("Loading target words from hardcoded list and allowed guesses from s.txt...");
    
    // Clear the dictionaries first
    window.WORDS_ALPHA.clear();
    window.S_WORDS.clear();
    window.DICTIONARY_LOADED = false;
    window.S_WORDS_LOADED = false;
    
    // Load hardcoded target words from words_alpha.txt contents
    loadHardcodedTargetWords();
    
    // Load allowed guesses from s.txt
    loadSWords();
    
    // Add final safety check to make sure problematic words are removed
    // Run after a short delay to ensure dictionaries are loaded first
    setTimeout(() => {
        console.log("Running final verification of dictionaries");
        const problematicWords = ["HOWTO", "README", "FIXME", "TODO", "TEST", "DEBUG"];
        
        // Remove from WORDS_ALPHA (target words)
        if (window.WORDS_ALPHA) {
            let removed = 0;
            problematicWords.forEach(word => {
                if (window.WORDS_ALPHA.has(word)) {
                    window.WORDS_ALPHA.delete(word);
                    removed++;
                    console.warn(`FINAL SAFETY: Removed "${word}" from target words`);
                }
            });
            
            if (removed > 0) {
                console.warn(`FINAL SAFETY: Removed ${removed} problematic words from target words dictionary`);
            } else {
                console.log("FINAL SAFETY: No problematic words found in target words dictionary");
            }
        }
    }, 2000);
}

// Load hardcoded target words from words_alpha.txt
function loadHardcodedTargetWords() {
    console.log("Loading hardcoded target words...");
    
    // Hardcoded words from words_alpha.txt (all uppercase for consistency)
    const targetWords = {
        // 4-letter words
        easy: [
            "LUCK", "GAME", "CALM", "KIND", "FAST", "RICH", "TIME", "JUMP", 
            "DARK", "BLUE", "COLD", "GOLD", "FIRE", "FISH", "GOOD", "RAIN", 
            "MOON", "STAR", "SING", "ROAD", "WIND", "TREE", "SOFT", "WARM"
        ],
        // 5-letter words
        medium: [
            "APPLE", "BRAVE", "CHASE", "DRESS", "EAGLE", "FROST", "GIANT", 
            "HOUSE", "JELLY", "KNIFE", "LAUGH", "MAGIC", "NIGHT", "OCEAN", 
            "PLANT", "QUEEN", "RIVER", "SLEEP", "TIGER", "TRAIN", "USUAL", 
            "VOICE", "WORLD", "YOUTH", "ZEBRA"
        ],
        // 6-letter words
        hard: [
            "ANIMAL", "BUTTER", "CIRCLE", "DANGER", "ENERGY", "FINGER", 
            "GARDEN", "HAMMER", "ISLAND", "JUNGLE", "KEEPER", "LAPTOP", 
            "MARKET", "NATURE", "ORANGE", "PERSON", "QUESTER", "ROCKET", 
            "SUMMER", "TABLET", "VELVET", "WINDOW", "YELLOW", "ZIPPER", "BEACON"
        ],
        // 7-letter words
        expert: [
            "AMAZING", "BLANKET", "CAPTAIN", "DIGITAL", "ECONOMY", "FREEDOM", 
            "GALLERY", "HARVEST", "IMAGINE", "JOURNEY", "KITCHEN", "LIBERTY", 
            "MONSTER", "NATURAL", "OBSERVE", "PACKAGE", "QUALITY", "RESCUEE", 
            "SHELTER", "TEACHER", "UNICORN", "VEHICLE", "WELCOME", "ZEPPELIN", "ANTENNA"
        ]
    };
    
    // Add all the words to the WORDS_ALPHA dictionary
    let wordCount = 0;
    Object.values(targetWords).forEach(wordList => {
        wordList.forEach(word => {
            window.WORDS_ALPHA.add(word);
            wordCount++;
        });
    });
    
    console.log(`Added ${wordCount} hardcoded target words to dictionary`);
    window.DICTIONARY_LOADED = true;
    
    // Check for problematic words
    checkForProblematicWords();
    
    // Check sample words to verify dictionary load
    checkSampleWords();
}

// Load the allowed guesses from s.txt
function loadSWords() {
    console.log("Loading allowed guesses from s.txt...");
    
    // Try different possible locations for s.txt
    const possiblePaths = [
        's.txt',         // Root directory
        '/s.txt',        // Root with leading slash
        './s.txt',       // Explicit current directory
        '../s.txt',      // Parent directory
        'assets/s.txt',  // Assets directory
        'data/s.txt'     // Data directory
    ];
    
    // Try to load from each path
    function tryNextPath(index) {
        if (index >= possiblePaths.length) {
            console.error('Failed to load s.txt from any path');
            console.log('Using target words for allowed guesses as well');
            // If s.txt fails to load, use target words for allowed guesses too
            if (window.WORDS_ALPHA.size > 0) {
                window.S_WORDS = new Set(window.WORDS_ALPHA);
                window.S_WORDS_LOADED = true;
                console.log(`Using ${window.S_WORDS.size} target words as allowed guesses too`);
            } else {
                // If both fail, add fallback words
                addFallbackSWords();
            }
            return;
        }
        
        const path = possiblePaths[index];
        console.log(`Trying to load s.txt from: ${path}`);
        
        // Make the fetch request
        fetch(path)
        .then(response => {
                if (!response.ok) {
                    console.error(`Failed to load s.txt with status: ${response.status}`);
                    throw new Error(`Failed with status: ${response.status}`);
                }
                console.log("s.txt file found, processing content...");
            return response.text();
        })
        .then(text => {
                // Process the file content
                const lines = text.split(/\r?\n/);
                let wordCount = 0;
                
                // Process each line as a word
                for (const line of lines) {
                    const word = line.trim();
                    if (word) {
                        window.S_WORDS.add(word.toUpperCase());
                        wordCount++;
                    }
                }
                
                // Set flag and log success
                window.S_WORDS_LOADED = true;
                console.log(`Successfully loaded ${wordCount} allowed guess words from s.txt`);
            })
            .catch(error => {
                console.error(`Error loading s.txt from ${path}:`, error);
                // Try the next path
                tryNextPath(index + 1);
            });
    }
    
    // Start trying paths
    tryNextPath(0);
}

// Add fallback allowed guess words if s.txt fails to load
function addFallbackSWords() {
    console.log("ADDING FALLBACK WORDS TO S_WORDS");
    
    // Use the same basic words for allowed guesses
    const basicWords = [
        // Common words like in addFallbackWords()
        "THE", "AND", "FOR", "NOT", "BUT", "YOU", "ALL", "ANY", "CAN", "HAD"
        // ... add more as needed
    ];
    
    // Add to S_WORDS
    basicWords.forEach(word => {
        window.S_WORDS.add(word);
    });
    
    window.S_WORDS_LOADED = true;
    console.log(`Added ${basicWords.length} fallback words to S_WORDS`);
    
    // If WORDS_ALPHA is also empty, copy these words there too
    if (!window.DICTIONARY_LOADED && window.WORDS_ALPHA.size === 0) {
        basicWords.forEach(word => {
            window.WORDS_ALPHA.add(word);
        });
        window.DICTIONARY_LOADED = true;
        console.log(`Also added ${basicWords.length} fallback words to WORDS_ALPHA`);
    }
}

// Check some sample words to verify dictionary load
function checkSampleWords() {
    const samples = ['THE', 'AND', 'HELLO', 'WORLD', 'APPLE', 'BANANA'];
    console.log('Checking sample words in dictionary:');
    
    samples.forEach(word => {
        const exists = window.WORDS_ALPHA.has(word);
        console.log(`- "${word}": ${exists ? 'FOUND ✓' : 'NOT FOUND ✗'}`);
    });
}

// Add function to check for and report problematic words
function checkForProblematicWords() {
    const problematicWords = ["HOWTO", "FIXME", "README", "TODO"];
    console.log("=== CHECKING FOR PROBLEMATIC WORDS IN DICTIONARIES ===");
    
    // Check WORDS_ALPHA (target words)
    if (window.WORDS_ALPHA) {
        problematicWords.forEach(word => {
            if (window.WORDS_ALPHA.has(word)) {
                console.warn(`PROBLEM DETECTED: "${word}" found in WORDS_ALPHA (target words)! Removing it.`);
                window.WORDS_ALPHA.delete(word);
            } else {
                console.log(`Good: "${word}" not found in WORDS_ALPHA (target words)`);
            }
        });
    }
    
    // Check S_WORDS (allowed guesses)
    if (window.S_WORDS) {
        problematicWords.forEach(word => {
            if (window.S_WORDS.has(word)) {
                console.log(`Note: "${word}" found in S_WORDS (allowed guesses) - this is ok.`);
            }
        });
    }
}

// User-friendly word check function
window.checkWord = function(word) {
    if (!word) {
        console.log('Please provide a word to check');
        return 'No word provided';
    }
    
    const upperWord = word.toUpperCase().trim();
    const inDict = window.WORDS_ALPHA.has(upperWord);
    
    console.log(`
==== WORD CHECK ====
Word: "${upperWord}"
In dictionary: ${inDict ? 'YES ✓' : 'NO ✗'}
Dictionary size: ${window.WORDS_ALPHA.size} words
Dictionary loaded: ${window.DICTIONARY_LOADED ? 'YES' : 'NO'}
====================
`);
    
    return inDict ? 'Word found in dictionary' : 'Word NOT found in dictionary';
};

// Reload dictionary function
window.reloadDictionary = function() {
    console.log('Manually reloading dictionary...');
    loadDictionary();
    return 'Dictionary reload initiated';
};

// Load dictionary on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, loading dictionary...');
    loadDictionary();
    
    // Add a check for problematic words after a delay to ensure dictionaries are loaded
    setTimeout(checkForProblematicWords, 5000);
});

// Make functions available globally
window.loadDictionary = loadDictionary;
window.loadWordsAlpha = loadDictionary; // Alias for backward compatibility

// Add a debug function to check dictionary status
window.checkDictionaryStatus = function() {
    console.log(`
Dictionary Status:
-----------------
Dictionary size: ${window.WORDS_ALPHA.size} words
Dictionary loaded: ${window.DICTIONARY_LOADED}
Accept all words: ${window.ACCEPT_ALL_WORDS}
isWordInDictionary exists: ${typeof window.isWordInDictionary === 'function'}
isWordInWordsAlpha exists: ${typeof window.isWordInWordsAlpha === 'function'}

Test words:
----------
THE: ${window.WORDS_ALPHA.has('THE')}
AND: ${window.WORDS_ALPHA.has('AND')}
HELLO: ${window.WORDS_ALPHA.has('HELLO')}
WORLD: ${window.WORDS_ALPHA.has('WORLD')}
`);
    return "Dictionary status check complete";
};

// Add a debug button
function addDictionaryDebugButton() {
    const button = document.createElement('button');
    button.textContent = 'Dictionary Debug';
    button.style.cssText = 'position:fixed;bottom:10px;left:10px;padding:8px 15px;background:#ff5722;color:white;border:none;border-radius:4px;z-index:9999;font-weight:bold;';
    button.addEventListener('click', window.showDictionaryInfo);
    document.body.appendChild(button);
    
    // Also add a word check form
    const form = document.createElement('div');
    form.style.cssText = 'position:fixed;bottom:10px;left:150px;padding:8px;background:rgba(0,0,0,0.7);color:white;border-radius:4px;z-index:9999;display:flex;';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter word to check';
    input.style.padding = '4px';
    input.style.marginRight = '5px';
    
    const checkBtn = document.createElement('button');
    checkBtn.textContent = 'Check';
    checkBtn.style.padding = '4px 8px';
    
    const result = document.createElement('span');
    result.style.marginLeft = '10px';
    result.style.fontWeight = 'bold';
    
    form.appendChild(input);
    form.appendChild(checkBtn);
    form.appendChild(result);
    
    checkBtn.addEventListener('click', function() {
        const word = input.value.trim();
        if (!word) {
            result.textContent = 'Enter a word';
            result.style.color = 'yellow';
            return;
        }
        
        const upperWord = word.toUpperCase();
        const inDict = window.WORDS_ALPHA.has(upperWord);
        
        result.textContent = inDict ? '✓ In Dictionary' : '✗ Not Found';
        result.style.color = inDict ? '#4CAF50' : '#F44336';
        
        console.log(`Quick check: "${upperWord}" - ${inDict ? 'Found' : 'Not found'} in dictionary`);
    });
    
    input.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            checkBtn.click();
        }
    });
    
    document.body.appendChild(form);
}

// Add a button to manually load dictionary content
function addManualLoadButton() {
    // Create button container
    const container = document.createElement('div');
    container.id = 'manual-dict-load';
    container.style.cssText = 'position:fixed;bottom:50px;right:20px;padding:15px;background:rgba(0,0,0,0.8);color:white;z-index:10000;border-radius:5px;';
    
    // Add heading
    const heading = document.createElement('h3');
    heading.textContent = 'Manual Dictionary Load';
    heading.style.margin = '0 0 10px 0';
    container.appendChild(heading);
    
    // Add instructions
    const instructions = document.createElement('p');
    instructions.innerHTML = 'If the dictionary won\'t load automatically, paste the contents of words_alpha.txt here:';
    instructions.style.margin = '0 0 10px 0';
    container.appendChild(instructions);
    
    // Add textarea
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Paste words_alpha.txt content here...';
    textarea.style.cssText = 'width:300px;height:100px;margin-bottom:10px;padding:5px;';
    container.appendChild(textarea);
    
    // Add load button
    const loadBtn = document.createElement('button');
    loadBtn.textContent = 'Load Dictionary';
    loadBtn.style.cssText = 'padding:8px 15px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;';
    container.appendChild(loadBtn);
    
    // Add status text
    const status = document.createElement('div');
    status.id = 'manual-load-status';
    status.style.marginTop = '10px';
    container.appendChild(status);
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'X';
    closeBtn.style.cssText = 'position:absolute;top:5px;right:5px;padding:2px 6px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;';
    closeBtn.addEventListener('click', () => container.style.display = 'none');
    container.appendChild(closeBtn);
    
    // Handle load button click
    loadBtn.addEventListener('click', function() {
        const content = textarea.value.trim();
        if (!content) {
            status.textContent = 'Error: No content pasted';
            status.style.color = '#F44336';
            return;
        }
        
        // Process the content
        const words = content.split(/\r?\n/);
        let count = 0;
        
        // Clear existing dictionary
        window.WORDS_ALPHA.clear();
        
        // Process words
        words.forEach(word => {
            const trimmed = word.trim();
            if (trimmed) {
                window.WORDS_ALPHA.add(trimmed.toUpperCase());
                count++;
            }
        });
        
        // Update status
        if (count > 1000) {
            status.textContent = `Success! Loaded ${count} words.`;
            status.style.color = '#4CAF50';
            window.DICTIONARY_LOADED = true;
        } else {
            status.textContent = `Warning: Only loaded ${count} words. This seems low.`;
            status.style.color = '#FF9800';
        }
        
        // Show the dictionary debug info
        if (typeof window.showDictionaryInfo === 'function') {
            setTimeout(window.showDictionaryInfo, 500);
        }
    });
    
    // Add to document
    document.body.appendChild(container);
    
    return container;
}

// Add a helper function to check if a specific word is in the dictionary
window.checkSpecificWord = function(word) {
    if (!word) {
        console.log('Please provide a word to check');
        return 'No word provided';
    }
    
    const upperWord = word.toUpperCase().trim();
    
    // Check in WORDS_ALPHA (target words)
    const inWordsAlpha = window.WORDS_ALPHA && window.WORDS_ALPHA.has(upperWord);
    
    // Check in S_WORDS (allowed guesses)
    const inSWords = window.S_WORDS && window.S_WORDS.has(upperWord);
    
    console.log(`
==== SPECIFIC WORD CHECK ====
Word: "${upperWord}"
In target words (WORDS_ALPHA): ${inWordsAlpha ? 'YES ✓' : 'NO ✗'}
In allowed guesses (S_WORDS): ${inSWords ? 'YES ✓' : 'NO ✗'}
Target words loaded: ${window.DICTIONARY_LOADED ? 'YES' : 'NO'}
Allowed guesses loaded: ${window.S_WORDS_LOADED ? 'YES' : 'NO'}
===========================
`);
    
    return {
        inTargetWords: inWordsAlpha,
        inAllowedGuesses: inSWords
    };
};

// Add a debug function to check for problematic words
window.checkProblematicWords = function() {
    const problematicWords = ["HOWTO", "README", "FIXME", "TODO", "TEST", "DEBUG"];
    const results = {};
    
    console.log("==== CHECKING FOR PROBLEMATIC WORDS ====");
    
    // Check WORDS_ALPHA (target words)
    problematicWords.forEach(word => {
        const inWordsAlpha = window.WORDS_ALPHA && window.WORDS_ALPHA.has(word);
        const inSWords = window.S_WORDS && window.S_WORDS.has(word);
        
        results[word] = {
            inTargetWords: inWordsAlpha,
            inAllowedGuesses: inSWords
        };
        
        if (inWordsAlpha) {
            console.warn(`PROBLEM: "${word}" found in target words (WORDS_ALPHA)!`);
        }
        
        if (inSWords) {
            console.log(`Note: "${word}" found in allowed guesses (S_WORDS) - this is ok.`);
        }
    });
    
    console.log("Problematic words status:", results);
    return results;
}; 