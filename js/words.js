const WORD_LISTS = {
    easy: [
        'ABLE', 'ACID', 'AGED', 'ALSO', 'AREA', 'ARMY', 'AWAY', 'BABY', 'BACK', 'BALL', 
        'BAND', 'BANK', 'BASE', 'BATH', 'BEAR', 'BEAT', 'BEEN', 'BEER', 'BELL', 'BELT', 
        'BEST', 'BILL', 'BIRD', 'BLOW', 'BLUE', 'BOAT', 'BODY', 'BOMB', 'BOND', 'BONE', 
        'BOOK', 'BOOM', 'BORN', 'BOSS', 'BOTH', 'BOWL', 'BULK', 'BURN', 'BUSH', 'BUSY',
        'CALL', 'CALM', 'CAME', 'CAMP', 'CARD', 'CARE', 'CASE', 'CASH', 'CAST', 'CELL'
    ],
    medium: [
        'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ACUTE', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER', 'AGAIN',
        'AGENT', 'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIKE', 'ALIVE', 'ALLOW', 'ALONE',
        'ALONG', 'ALTER', 'AMONG', 'ANGER', 'ANGLE', 'ANGRY', 'APART', 'APPLE', 'APPLY', 'ARENA',
        'ARGUE', 'ARISE', 'ARRAY', 'ASIDE', 'ASSET', 'AUDIO', 'AUDIT', 'AVOID', 'AWARD', 'AWARE',
        'BADLY', 'BAKER', 'BASES', 'BASIC', 'BASIS', 'BEACH', 'BEGAN', 'BEGIN', 'BLACK', 'BLAME'
    ],
    hard: [
        'ACCEPT', 'ACCESS', 'ACROSS', 'ACTING', 'ACTION', 'ACTIVE', 'ACTUAL', 'ADVICE', 'ADVISE', 'AFFECT',
        'AFFORD', 'AFRAID', 'AGENCY', 'AGENDA', 'ALMOST', 'ALWAYS', 'AMOUNT', 'ANIMAL', 'ANNUAL', 'ANSWER',
        'ANYONE', 'ANYWAY', 'APPEAL', 'APPEAR', 'AROUND', 'ARRIVE', 'ARTIST', 'ASPECT', 'ASSESS', 'ASSIST',
        'ASSUME', 'ATTACK', 'ATTEND', 'AUGUST', 'AUTHOR', 'AVENUE', 'BACKED', 'BARELY', 'BATTLE', 'BEAUTY'
    ],
    expert: [
        'ABSOLUTE', 'ACADEMY', 'ACCOUNT', 'ACHIEVE', 'ADDRESS', 'ADVANCE', 'ADVISED', 'ADVISER', 'AGAINST', 'AIRLINE',
        'AIRPORT', 'ALCOHOL', 'ALLIANCE', 'ALREADY', 'ALTHOUGH', 'AMAZING', 'ANALYST', 'ANALYZE', 'ANCIENT', 'ANOTHER',
        'ANXIETY', 'ANXIOUS', 'ANYBODY', 'APPLIED', 'ARRANGE', 'ARRIVAL', 'ARTICLE', 'ASSAULT', 'ASSERTED', 'ATTRACT',
        'AUCTION', 'AVERAGE', 'BACKING', 'BALANCE', 'BANKING', 'BARRIER', 'BATTERY', 'BEARING', 'BEATING', 'BECAUSE'
    ]
};

// Function to get a random word based on difficulty
function getRandomWord(difficulty) {
    // First try to use words_alpha.txt if available
    if (typeof getRandomWordForDifficulty === 'function') {
        const alphaDictWord = getRandomWordForDifficulty(difficulty);
        if (alphaDictWord) {
            console.log(`Selected target word from words_alpha: ${alphaDictWord} (${difficulty})`);
            return alphaDictWord;
        }
    }
    
    // Fallback to original dictionary if words_alpha.txt not available or returned null
    const wordList = WORD_LISTS[difficulty];
    
    // If no dictionary is available for this difficulty, use a default
    if (!wordList || wordList.length === 0) {
        console.error(`No word list available for difficulty: ${difficulty}`);
        // Default to medium if the requested difficulty isn't available
        return WORD_LISTS['medium'][Math.floor(Math.random() * WORD_LISTS['medium'].length)];
    }
    
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    console.log(`Selected target word from original list: ${randomWord} (${difficulty})`);
    return randomWord;
}

// Function to check if a word exists in our word list (for validation)
function isValidWord(word, difficulty) {
    // First check in words_alpha.txt if available
    if (typeof isWordInWordsAlpha === 'function') {
        if (isWordInWordsAlpha(word.toUpperCase())) {
            return true;
        }
    }
    
    // If not in words_alpha or function not available, check in original lists
    // First check in the specific difficulty list
    if (WORD_LISTS[difficulty] && WORD_LISTS[difficulty].includes(word.toUpperCase())) {
        return true;
    }
    
    // If not found but we're being lenient about validation
    // Check that it's the right length for the difficulty
    const wordLength = word.length;
    let expectedLength = 5; // Default to medium
    
    if (difficulty === 'easy') expectedLength = 4;
    else if (difficulty === 'medium') expectedLength = 5;
    else if (difficulty === 'hard') expectedLength = 6;
    else if (difficulty === 'expert') expectedLength = 7;
    
    // If it's the right length and consists of letters, consider it valid
    return wordLength === expectedLength && /^[A-Z]+$/i.test(word);
} 