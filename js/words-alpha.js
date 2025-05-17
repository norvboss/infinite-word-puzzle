// Ultra-simple words_alpha.txt loader
console.log("WORDS_ALPHA: Starting loader");

// Global dictionary variables
window.WORDS_ALPHA = new Set();
window.ACCEPT_ALL_WORDS = false; // Set to false by default to enforce validation

// Global flag to indicate dictionary loading status
window.DICTIONARY_LOADED = false;

// This is the critical function that checks if a word is in the dictionary
window.isWordInDictionary = function(word) {
    if (!word) return false;
    
    // Always convert to uppercase for case-insensitive matching
    const upperWord = word.toUpperCase().trim();
    
    // Check if it's in the dictionary
    const result = window.WORDS_ALPHA.has(upperWord);
    console.log(`Word check: "${upperWord}" - ${result ? 'FOUND' : 'NOT FOUND'} in dictionary (${window.WORDS_ALPHA.size} words)`);
    
    return result;
};

// For backwards compatibility with dictionary.js
window.isWordInWordsAlpha = function(word) {
    return window.isWordInDictionary(word);
};

// Load the dictionary from words_alpha.txt
function loadDictionary() {
    console.log("Loading dictionary from words_alpha.txt...");
    
    // Clear the dictionary first
    window.WORDS_ALPHA.clear();
    window.DICTIONARY_LOADED = false;
    
    // CRITICAL FIX: We need to make sure we're using the correct path for words_alpha.txt
    // Try different possible locations
    const possiblePaths = [
        'words_alpha.txt',         // Root directory
        '/words_alpha.txt',        // Root with leading slash
        './words_alpha.txt',       // Explicit current directory
        '../words_alpha.txt',      // Parent directory
        'assets/words_alpha.txt',  // Assets directory
        'data/words_alpha.txt'     // Data directory
    ];
    
    // Try to load from each path
    function tryNextPath(index) {
        if (index >= possiblePaths.length) {
            console.error('Failed to load dictionary from any path');
            addFallbackWords();
            return;
        }
        
        const path = possiblePaths[index];
        console.log(`Trying to load dictionary from: ${path}`);
        
        // Make the fetch request
        fetch(path)
        .then(response => {
                if (!response.ok) {
                    console.error(`Failed to load dictionary with status: ${response.status}`);
                    throw new Error(`Failed with status: ${response.status}`);
                }
                console.log("Dictionary file found, processing content...");
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
                        window.WORDS_ALPHA.add(word.toUpperCase());
                        wordCount++;
                    }
                }
                
                // Check if we got a reasonable number of words
                if (wordCount < 1000) {
                    console.warn(`Only loaded ${wordCount} words, which seems too few. Dictionary may be incomplete.`);
                } else {
                    console.log(`Successfully loaded ${wordCount} words from dictionary`);
                    window.DICTIONARY_LOADED = true;
                }
                
                // Check some common words
                checkSampleWords();
            })
            .catch(error => {
                console.error(`Error loading from ${path}:`, error);
                // Try the next path
                tryNextPath(index + 1);
            });
    }
    
    // Start trying paths
    tryNextPath(0);
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

// Add fallback words if dictionary fails to load
function addFallbackWords() {
    console.log("ADDING FALLBACK WORDS TO DICTIONARY");
    
    // Common dictionary words
    const basicWords = [
        // Common 3-letter words
        "THE", "AND", "FOR", "NOT", "BUT", "YOU", "ALL", "ANY", "CAN", "HAD", "HER", "HIM", "HIS", "HOW",
        "MAN", "NEW", "NOW", "OLD", "OUR", "OUT", "SEE", "TWO", "WAY", "WHO", "BOY", "DID", "GET", "HAS",
        "LET", "PUT", "SAY", "SHE", "TOO", "USE", "DAY", "BET", "CUT", "LIE", "PAY", "RUN", "WAR", "YES",
        
        // Common 4-letter words
        "THAT", "WITH", "HAVE", "THIS", "WILL", "YOUR", "FROM", "THEY", "KNOW", "WANT", "BEEN", "GOOD",
        "MUCH", "SOME", "TIME", "VERY", "WHEN", "COME", "HERE", "JUST", "LIKE", "LONG", "MAKE", "MANY",
        "MORE", "ONLY", "OVER", "SUCH", "TAKE", "THAN", "THEM", "THEN", "WELL", "WERE", "WHAT", "WORK",
        "BACK", "DARK", "DOWN", "EVEN", "FIND", "GIVE", "HAND", "INTO", "KEEP", "LAST", "MIND", "NAME",
        "NEXT", "SAME", "TELL", "OMAN", "AWAY", "BEND", "BOOK", "CARE", "CITY", "COOL", "DEAL", "DOOR",
        "EASY", "FAST", "FEEL", "FIRE", "FISH", "FIVE", "FOOD", "FOUR", "GAME", "GIRL", "GROW", "HARD",
        "HOLD", "HOME", "HOPE", "KIND", "KING", "LAND", "LIFE", "LIVE", "LOOK", "LOSE", "LOVE", "MOVE",
        "NEED", "OPEN", "PART", "PICK", "PLAY", "REAL", "ROAD", "ROOM", "RULE", "SEAT", "SEES", "SELF",
        "SEND", "SIDE", "STAR", "STAY", "STEP", "STOP", "SURE", "TALK", "TEAM", "TELL", "TRUE", "TURN",
        
        // Common 5-letter words
        "ABOUT", "ABOVE", "AFTER", "AGAIN", "ALONE", "ALONG", "AMONG", "BEING", "BELOW", "BLACK",
        "BREAD", "BRING", "BUILD", "CARRY", "CAUSE", "CHILD", "CLEAR", "CLOSE", "COUNT", "DREAM", 
        "DRINK", "DRIVE", "EARLY", "EARTH", "ENJOY", "ENTER", "EVERY", "FIELD", "FIRST", "FLOOR", 
        "FOCUS", "FORCE", "FRAME", "FRONT", "FUNNY", "GLASS", "GOING", "GREAT", "GREEN", "GROUP", 
        "HAPPY", "HEART", "HORSE", "HOUSE", "HUMAN", "CLEAN", "LEARN", "LEVEL", "LIGHT", "LOOSE", 
        "MAGIC", "MAJOR", "MARCH", "METAL", "MONEY", "MONTH", "MUSIC", "NEVER", "NIGHT", "NORTH", 
        "NURSE", "ORDER", "OTHER", "PARTY", "PEACE", "PHONE", "PIECE", "PLACE", "PLANE", "PLANT", 
        "PLATE", "PRICE", "QUIET", "QUITE", "RADIO", "READY", "RIGHT", "RIVER", "ROUND", "SHARP", 
        "SHEEP", "SHINY", "SHIRT", "SHOES", "SHORT", "SILLY", "SINCE", "SKILL", "SLEEP", "SMALL", 
        "SMILE", "SNAKE", "SOUND", "SOUTH", "SPACE", "SPORT", "STAGE", "STORM", "STORY", "STYLE", 
        "SUGAR", "SWEET", "TABLE", "TASTE", "TEACH", "THANK", "THEIR", "THEME", "THERE", "THESE", 
        "THICK", "THING", "THINK", "THIRD", "THOSE", "THREE", "THROW", "TODAY", "TOUCH", "TRAIN", 
        "TRUTH", "TWICE", "UNDER", "UNTIL", "VISIT", "VOICE", "WATER", "WHERE", "WHICH", "WHILE", 
        "WHITE", "WHOLE", "WHOSE", "WOMAN", "WORLD", "WORRY", "WOULD", "WRITE", "YOUNG"
    ];
    
    // More Wordle-style 5-letter words
    const wordleWords = [
        "APPLE", "BRAVE", "CABLE", "DANCE", "EAGLE", "FABLE", "GRACE", "HASTE", "IMAGE", "JOLLY",
        "KNIFE", "LEMON", "MANGO", "NOBLE", "OCEAN", "PIANO", "QUEEN", "RAPID", "SUNNY", "TABLE",
        "ULTRA", "VIVID", "WASTE", "XENON", "YACHT", "ZEBRA", "ADULT", "BLUFF", "CRANK", "DRIFT",
        "ELBOW", "FLAIR", "GLOOM", "HUNCH", "IVORY", "JOKER", "KIOSK", "LUNAR", "MOIST", "NYMPH",
        "OXIDE", "PLUCK", "QUARK", "RESIN", "SWOOP", "TONIC", "UNZIP", "VENOM", "WHELP", "XEROX"
    ];
    
    // Add all the words to the dictionary
    const allWords = [...basicWords, ...wordleWords];
    allWords.forEach(word => {
        window.WORDS_ALPHA.add(word);
    });
    
    console.log(`Added ${allWords.length} fallback words to dictionary`);
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