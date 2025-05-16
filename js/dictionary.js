// Dictionary of valid words for guesses
// Now primarily using words_alpha.txt, but keeping these as fallbacks

const VALID_WORDS = {
    // 4-letter words
    easy: new Set([
        'ABLE', 'ACID', 'AGED', 'ALSO', 'AREA', 'ARMY', 'AWAY', 'BABY', 'BACK', 'BALL', 
        'BAND', 'BANK', 'BASE', 'BATH', 'BEAR', 'BEAT', 'BEEN', 'BEER', 'BELL', 'BELT', 
        'BEST', 'BILL', 'BIRD', 'BLOW', 'BLUE', 'BOAT', 'BODY', 'BOMB', 'BOND', 'BONE', 
        'BOOK', 'BOOM', 'BORN', 'BOSS', 'BOTH', 'BOWL', 'BULK', 'BURN', 'BUSH', 'BUSY',
        'CALL', 'CALM', 'CAME', 'CAMP', 'CARD', 'CARE', 'CASE', 'CASH', 'CAST', 'CELL',
        'CHEF', 'CITY', 'CLUB', 'COAL', 'COAT', 'CODE', 'COLD', 'COME', 'COOK', 'COOL',
        'COPE', 'COPY', 'CORE', 'COST', 'CREW', 'CROP', 'DARK', 'DATA', 'DATE', 'DAWN',
        'DAYS', 'DEAD', 'DEAL', 'DEAN', 'DEAR', 'DEBT', 'DEEP', 'DENY', 'DESK', 'DIAL',
        'DIET', 'DIRT', 'DISH', 'DISK', 'DOES', 'DONE', 'DOOR', 'DOSE', 'DOWN', 'DRAW',
        'DROP', 'DRUG', 'DUAL', 'DUKE', 'DUST', 'DUTY', 'EACH', 'EARN', 'EASE', 'EAST',
        'EASY', 'EDGE', 'ELSE', 'EVEN', 'EVER', 'EVIL', 'EXIT', 'FACE', 'FACT', 'FADE',
        'FAIL', 'FAIR', 'FALL', 'FARM', 'FAST', 'FATE', 'FEAR', 'FEED', 'FEEL', 'FEET',
        'FELL', 'FELT', 'FILE', 'FILL', 'FILM', 'FIND', 'FINE', 'FIRE', 'FIRM', 'FISH',
        'FIVE', 'FLAT', 'FLOW', 'FOLK', 'FOOD', 'FOOT', 'FORD', 'FORM', 'FORT', 'FOUR',
        'FREE', 'FROM', 'FUEL', 'FULL', 'FUND', 'GAIN', 'GAME', 'GATE', 'GAVE', 'GEAR',
        'GENE', 'GIFT', 'GIRL', 'GIVE', 'GLAD', 'GOAL', 'GOES', 'GOLD', 'GOLF', 'GONE',
        'GOOD', 'GRAY', 'GREW', 'GREY', 'GROW', 'GULF', 'HAIR', 'HALF', 'HALL', 'HAND',
        'HANG', 'HARD', 'HARM', 'HATE', 'HAVE', 'HEAD', 'HEAR', 'HEAT', 'HELD', 'HELL',
        'HELP', 'HERE', 'HERO', 'HIGH', 'HILL', 'HIRE', 'HOLD', 'HOLE', 'HOLY', 'HOME',
        'HOPE', 'HOST', 'HOUR', 'HUGE', 'HUNG', 'HUNT', 'HURT', 'IDEA', 'INCH', 'INTO',
        'IRON', 'ITEM', 'JACK', 'JANE', 'JEAN', 'JOHN', 'JOIN', 'JUMP', 'JURY', 'JUST',
        'KEEN', 'KEEP', 'KENT', 'KEPT', 'KICK', 'KILL', 'KIND', 'KING', 'KNEE', 'KNEW',
        'KNOW', 'LACK', 'LADY', 'LAID', 'LAKE', 'LAMB', 'LAMP', 'LAND', 'LANE', 'LAST',
        'LATE', 'LEAD', 'LEAF', 'LEAN', 'LEAP', 'LEFT', 'LESS', 'LIFE', 'LIFT', 'LIKE',
        'LINE', 'LINK', 'LIST', 'LIVE', 'LOAD', 'LOAN', 'LOCK', 'LOGO', 'LONG', 'LOOK',
        'LOOP', 'LORD', 'LOSE', 'LOSS', 'LOST', 'LOVE', 'LUCK', 'MADE', 'MAIL', 'MAIN',
        'MAKE', 'MALE', 'MALL', 'MANY', 'MARK', 'MASK', 'MASS', 'MATH', 'MEAL', 'MEAN',
        'MEAT', 'MEET', 'MENU', 'MERE', 'MESS', 'MILE', 'MILK', 'MILL', 'MIND', 'MINE',
        'MISS', 'MODE', 'MOOD', 'MOON', 'MORE', 'MOST', 'MOVE', 'MUCH', 'MUST', 'NAME',
        'NAVY', 'NEAR', 'NECK', 'NEED', 'NEWS', 'NEXT', 'NICE', 'NICK', 'NINE', 'NODE',
        'NONE', 'NOSE', 'NOTE', 'OATH', 'OKAY', 'ONCE', 'ONLY', 'ONTO', 'OPEN', 'ORAL',
        'OURS', 'OVAL', 'OVEN', 'OVER', 'PACE', 'PACK', 'PAGE', 'PAID', 'PAIN', 'PAIR'
    ]),
    
    // 5-letter words
    medium: new Set([
        'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ACUTE', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER', 'AGAIN',
        'AGENT', 'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIKE', 'ALIVE', 'ALLOW', 'ALONE',
        'ALONG', 'ALTER', 'AMONG', 'ANGER', 'ANGLE', 'ANGRY', 'APART', 'APPLE', 'APPLY', 'ARENA',
        'ARGUE', 'ARISE', 'ARRAY', 'ASIDE', 'ASSET', 'AUDIO', 'AUDIT', 'AVOID', 'AWARD', 'AWARE',
        'BADLY', 'BAKER', 'BASES', 'BASIC', 'BASIS', 'BEACH', 'BEGAN', 'BEGIN', 'BLACK', 'BLAME',
        'BLANK', 'BLAST', 'BLEED', 'BLEND', 'BLESS', 'BLIND', 'BLOCK', 'BLOOD', 'BOARD', 'BOOST',
        'BOOTH', 'BOUND', 'BRAIN', 'BRAND', 'BRAVE', 'BREAD', 'BREAK', 'BREED', 'BRIEF', 'BRING',
        'BROAD', 'BROKE', 'BROWN', 'BUILD', 'BUILT', 'BUYER', 'CABLE', 'CALIF', 'CARRY', 'CATCH',
        'CAUSE', 'CHAIN', 'CHAIR', 'CHART', 'CHASE', 'CHEAP', 'CHECK', 'CHEST', 'CHIEF', 'CHILD',
        'CHINA', 'CHOSE', 'CIVIL', 'CLAIM', 'CLASS', 'CLEAN', 'CLEAR', 'CLICK', 'CLOCK', 'CLOSE',
        'COACH', 'COAST', 'COULD', 'COUNT', 'COURT', 'COVER', 'CRAFT', 'CRASH', 'CREAM', 'CRIME',
        'CROSS', 'CROWD', 'CROWN', 'CURVE', 'CYCLE', 'DAILY', 'DANCE', 'DATED', 'DEALT', 'DEATH',
        'DEBUT', 'DELAY', 'DEPTH', 'DOING', 'DOUBT', 'DOZEN', 'DRAFT', 'DRAMA', 'DRAWN', 'DREAM',
        'DRESS', 'DRILL', 'DRINK', 'DRIVE', 'DROVE', 'DYING', 'EAGER', 'EARLY', 'EARTH', 'EIGHT',
        'ELITE', 'EMPTY', 'ENEMY', 'ENJOY', 'ENTER', 'ENTRY', 'EQUAL', 'ERROR', 'EVENT', 'EVERY',
        'EXACT', 'EXIST', 'EXTRA', 'FAITH', 'FALSE', 'FAULT', 'FIBER', 'FIELD', 'FIFTH', 'FIFTY',
        'FIGHT', 'FINAL', 'FIRST', 'FIXED', 'FLASH', 'FLEET', 'FLOOR', 'FLUID', 'FOCUS', 'FORCE',
        'FORTH', 'FORTY', 'FORUM', 'FOUND', 'FRAME', 'FRANK', 'FRAUD', 'FRESH', 'FRONT', 'FRUIT',
        'FULLY', 'FUNNY', 'GIANT', 'GIVEN', 'GLASS', 'GLOBE', 'GOING', 'GRACE', 'GRADE', 'GRAIN',
        'GRAND', 'GRANT', 'GRASS', 'GREAT', 'GREEN', 'GRAPE', 'GRASP', 'GRAVE', 'GREET', 'GRILL',
        'GROSS', 'GROUP', 'GROWN', 'GUARD', 'GUESS', 'GUEST', 'GUIDE', 'HAPPY', 'HARRY', 'HEART',
        'HEAVY', 'HENCE', 'HENRY', 'HORSE', 'HOTEL', 'HOUSE', 'HUMAN', 'IDEAL', 'IMAGE', 'INDEX',
        'INNER', 'INPUT', 'ISSUE', 'JAPAN', 'JIMMY', 'JOINT', 'JONES', 'JUDGE', 'KNOWN', 'LABEL',
        'LARGE', 'LASER', 'LATER', 'LAUGH', 'LAYER', 'LEARN', 'LEASE', 'LEAST', 'LEAVE', 'LEGAL',
        'LEVEL', 'LEWIS', 'LIGHT', 'LIMIT', 'LINKS', 'LIVES', 'LOCAL', 'LOGIC', 'LOOSE', 'LOWER',
        'LUCKY', 'LUNCH', 'LYING', 'MAGIC', 'MAJOR', 'MAKER', 'MARCH', 'MARIA', 'MATCH', 'MAYBE',
        'MAYOR', 'MEANT', 'MEDIA', 'METAL', 'MIGHT', 'MINOR', 'MINUS', 'MIXED', 'MODEL', 'MONEY',
        'MONTH', 'MORAL', 'MOTOR', 'MOUNT', 'MOUSE', 'MOUTH', 'MOVIE', 'MUSIC', 'NEEDS', 'NEVER',
        'NEWLY', 'NIGHT', 'NOISE', 'NORTH', 'NOTED', 'NOVEL', 'NURSE', 'OCCUR', 'OCEAN', 'OFFER',
        'OFTEN', 'ORDER', 'OTHER', 'OUGHT', 'PAINT', 'PANEL', 'PAPER', 'PARTY', 'PASTA', 'PASTE',
        'PATCH', 'PEACE', 'PEACH', 'PEANUT', 'PEARL', 'PEDAL', 'PETER', 'PHASE', 'PHONE', 'PHOTO',
        'PIANO', 'PIECE', 'PILOT', 'PITCH', 'PIZZA', 'PLACE', 'PLAIN', 'PLANE', 'PLANT', 'PLATE',
        'PLEAD', 'POINT', 'POKER', 'POLAR', 'POUND', 'POWER', 'PRESS', 'PRICE', 'PRIDE', 'PRIME',
        'PRINT', 'PRIOR', 'PRIZE', 'PROOF', 'PROUD', 'PROVE', 'PUPPY', 'PURSE', 'QUEEN', 'QUICK',
        'QUIET', 'QUITE', 'QUOTE', 'RADIO', 'RAISE', 'RALLY', 'RANGE', 'RAPID', 'RATIO', 'RAZOR',
        'REACH', 'READY', 'REFER', 'RIGHT', 'RIVAL', 'RIVER', 'ROBIN', 'ROBOT', 'ROGER', 'ROMAN',
        'ROUGH', 'ROUND', 'ROUTE', 'ROYAL', 'RURAL', 'SCALE', 'SCENE', 'SCOPE', 'SCORE', 'SCREW',
        'SENSE', 'SERVE', 'SEVEN', 'SHALL', 'SHAPE', 'SHARE', 'SHARP', 'SHEEP', 'SHEET', 'SHELF',
        'SHELL', 'SHIFT', 'SHIRT', 'SHOCK', 'SHOES', 'SHOOT', 'SHORT', 'SHOWN', 'SIGHT', 'SINCE',
        'SIXTH', 'SIXTY', 'SIZED', 'SKILL', 'SKIRT', 'SLEEP', 'SLIDE', 'SMALL', 'SMART', 'SMILE',
        'SMITH', 'SMOKE', 'SNAKE', 'SOLAR', 'SOLID', 'SOLVE', 'SORRY', 'SOUND', 'SOUTH', 'SPACE',
        'SPARE', 'SPEAK', 'SPEED', 'SPEND', 'SPENT', 'SPICY', 'SPILL', 'SPINE', 'SPLIT', 'SPOKE',
        'SPOON', 'SPORT', 'SPRAY', 'STAFF', 'STAGE', 'STAKE', 'STAND', 'STARE', 'STARS', 'START',
        'STATE', 'STEAM', 'STEEL', 'STEEP', 'STEER', 'STICK', 'STILL', 'STOCK', 'STONE', 'STOOD',
        'STORE', 'STORM', 'STORY', 'STRAW', 'STRIP', 'STUCK', 'STUDY', 'STUFF', 'STYLE', 'SUGAR',
        'SUITE', 'SUPER', 'SWEAT', 'SWEET', 'SWING', 'SWORD', 'TABLE', 'TAKEN', 'TASTE', 'TAXES',
        'TEACH', 'TEETH', 'TERRY', 'TEXAS', 'THANK', 'THEFT', 'THEIR', 'THEME', 'THERE', 'THESE',
        'THICK', 'THING', 'THINK', 'THIRD', 'THOSE', 'THREE', 'THREW', 'THROW', 'THUMB', 'TIGER',
        'TIGHT', 'TIMES', 'TIRED', 'TITLE', 'TODAY', 'TOPIC', 'TOTAL', 'TOUCH', 'TOUGH', 'TOWER',
        'TRACK', 'TRADE', 'TRAIN', 'TREAT', 'TREND', 'TRIAL', 'TRIED', 'TRIES', 'TRUCK', 'TRULY',
        'TRUST', 'TRUTH', 'TWICE', 'UNDER', 'UNDUE', 'UNION', 'UNITY', 'UNTIL', 'UPPER', 'UPSET',
        'URBAN', 'USAGE', 'USUAL', 'VALID', 'VALUE', 'VIDEO', 'VIRUS', 'VISIT', 'VITAL', 'VOICE',
        'VOTER', 'WAGON', 'WAIST', 'WATCH', 'WATER', 'WEALTH', 'WEAR', 'WHEEL', 'WHERE', 'WHICH',
        'WHILE', 'WHITE', 'WHOLE', 'WHOSE', 'WOMAN', 'WOMEN', 'WORLD', 'WORRY', 'WORSE', 'WORST',
        'WORTH', 'WOULD', 'WOUND', 'WRITE', 'WRONG', 'WROTE', 'YACHT', 'YIELD', 'YOUNG', 'YOUTH',
        'ZEBRA'
    ]),
    
    // 6-letter words
    hard: new Set([
        'ACCEPT', 'ACCESS', 'ACROSS', 'ACTING', 'ACTION', 'ACTIVE', 'ACTUAL', 'ADVICE', 'ADVISE', 'AFFECT',
        'AFFORD', 'AFRAID', 'AGENCY', 'AGENDA', 'ALMOST', 'ALWAYS', 'AMOUNT', 'ANIMAL', 'ANNUAL', 'ANSWER',
        'ANYONE', 'ANYWAY', 'APPEAL', 'APPEAR', 'AROUND', 'ARRIVE', 'ARTIST', 'ASPECT', 'ASSESS', 'ASSIST',
        'ASSUME', 'ATTACK', 'ATTEND', 'AUGUST', 'AUTHOR', 'AVENUE', 'BACKED', 'BARELY', 'BATTLE', 'BEAUTY',
        'BECAME', 'BECOME', 'BEFORE', 'BEHALF', 'BEHIND', 'BELIEF', 'BELONG', 'BERLIN', 'BETTER', 'BEYOND',
        'BISHOP', 'BORDER', 'BOTTLE', 'BOTTOM', 'BOUGHT', 'BRANCH', 'BREATH', 'BRIDGE', 'BRIGHT', 'BROKEN',
        'BUDGET', 'BURDEN', 'BUREAU', 'BUTTON', 'CAMERA', 'CANCER', 'CANNOT', 'CARBON', 'CAREER', 'CASTLE',
        'CASUAL', 'CAUGHT', 'CENTER', 'CENTRE', 'CHANCE', 'CHANGE', 'CHARGE', 'CHOICE', 'CHOOSE', 'CHOSEN',
        'CHURCH', 'CIRCLE', 'CLIENT', 'CLOSED', 'CLOSER', 'COFFEE', 'COLUMN', 'COMBAT', 'COMING', 'COMMON',
        'COMPLY', 'COPPER', 'CORNER', 'COSTLY', 'COUNTY', 'COUPLE', 'COURSE', 'COVERS', 'CREATE', 'CREDIT',
        'CRISIS', 'CUSTOM', 'DAMAGE', 'DANGER', 'DEALER', 'DEBATE', 'DECADE', 'DECIDE', 'DEFEAT', 'DEFEND',
        'DEFINE', 'DEGREE', 'DEMAND', 'DEPEND', 'DEPUTY', 'DESERT', 'DESIGN', 'DESIRE', 'DETAIL', 'DETECT',
        'DEVICE', 'DIFFER', 'DINNER', 'DIRECT', 'DOCTOR', 'DOLLAR', 'DOMAIN', 'DOUBLE', 'DRIVEN', 'DRIVER',
        'DURING', 'EASILY', 'EATING', 'EDITOR', 'EFFECT', 'EFFORT', 'EIGHTH', 'EITHER', 'ELEVEN', 'EMERGE',
        'EMPIRE', 'EMPLOY', 'ENABLE', 'ENDING', 'ENERGY', 'ENGAGE', 'ENGINE', 'ENOUGH', 'ENSURE', 'ENTIRE',
        'ENTITY', 'EQUITY', 'ESCAPE', 'ESTATE', 'ETHNIC', 'EVOLVE', 'EXCEED', 'EXCEPT', 'EXCESS', 'EXPAND',
        'EXPECT', 'EXPERT', 'EXPORT', 'EXTEND', 'EXTENT', 'FABRIC', 'FACING', 'FACTOR', 'FAILED', 'FAIRLY',
        'FALLEN', 'FAMILY', 'FAMOUS', 'FATHER', 'FELLOW', 'FEMALE', 'FIGURE', 'FILING', 'FINGER', 'FINISH',
        'FISCAL', 'FLIGHT', 'FLYING', 'FOLLOW', 'FORCED', 'FOREST', 'FORGET', 'FORMAL', 'FORMAT', 'FORMER',
        'FOSTER', 'FOUGHT', 'FOURTH', 'FRENCH', 'FRIEND', 'FUTURE', 'GARDEN', 'GATHER', 'GENDER', 'GERMAN',
        'GLOBAL', 'GOLDEN', 'GROUND', 'GROWTH', 'GUILTY', 'HANDED', 'HANDLE', 'HAPPEN', 'HARDLY', 'HEADED',
        'HEALTH', 'HEIGHT', 'HIDDEN', 'HOLDER', 'HONEST', 'IMPACT', 'IMPORT', 'INCOME', 'INDEED', 'INJURY',
        'INSIDE', 'INSIST', 'INTEND', 'INTENT', 'INVEST', 'ISLAND', 'ITSELF', 'JERSEY', 'JOSEPH', 'JUNIOR',
        'JUSTICE', 'KEEPER', 'KERNEL', 'KILLED', 'LABOUR', 'LATEST', 'LATTER', 'LAUNCH', 'LAWYER', 'LEADER',
        'LEAGUE', 'LEAVES', 'LEGACY', 'LENGTH', 'LESSON', 'LETTER', 'LIGHTS', 'LIKELY', 'LINKED', 'LIQUID',
        'LISTEN', 'LITTLE', 'LIVING', 'LONDON', 'LONELY', 'LOOKED', 'LOSING', 'LUCENT', 'LUXURY', 'MAINLY',
        'MAKING', 'MANAGE', 'MANNER', 'MANUAL', 'MARGIN', 'MARINE', 'MARKED', 'MARKET', 'MARTIN', 'MASTER',
        'MATTER', 'MATURE', 'MEDIUM', 'MEMBER', 'MEMORY', 'MENTAL', 'MERELY', 'MERGER', 'METHOD', 'MIDDLE',
        'MILLER', 'MINING', 'MINUTE', 'MIRROR', 'MOBILE', 'MODERN', 'MODEST', 'MODULE', 'MOMENT', 'MORRIS',
        'MOSTLY', 'MOTHER', 'MOTION', 'MOVING', 'MURDER', 'MUSEUM', 'MUTUAL', 'MYSELF', 'NARROW', 'NATION',
        'NATIVE', 'NATURE', 'NEARBY', 'NEARLY', 'NIGHTS', 'NOBODY', 'NORMAL', 'NOTICE', 'NOTION', 'NUMBER',
        'OBJECT', 'OBTAIN', 'OFFICE', 'OFFSET', 'ONLINE', 'OPTION', 'ORANGE', 'ORIGIN', 'OUTPUT', 'OXFORD',
        'PACKED', 'PALACE', 'PARENT', 'PARTLY', 'PATENT', 'PEOPLE', 'PERIOD', 'PERMIT', 'PERSON', 'PHRASE',
        'PICKED', 'PLANET', 'PLAYER', 'PLEASE', 'PLENTY', 'POCKET', 'POLICE', 'POLICY', 'PREFER', 'PRETTY',
        'PRINCE', 'PRISON', 'PROFIT', 'PROPER', 'PROVEN', 'PUBLIC', 'PURSUE', 'RAISED', 'RANDOM', 'RARELY',
        'RATHER', 'RATING', 'READER', 'REALLY', 'REASON', 'RECALL', 'RECENT', 'RECORD', 'REDUCE', 'REFORM',
        'REGARD', 'REGIME', 'REGION', 'RELATE', 'RELIEF', 'REMAIN', 'REMOTE', 'REMOVE', 'REPAIR', 'REPEAT',
        'REPLAY', 'REPORT', 'RESCUE', 'RESORT', 'RESULT', 'RETAIL', 'RETAIN', 'RETURN', 'REVEAL', 'REVIEW',
        'REWARD', 'RIDING', 'RISING', 'ROBUST', 'RULING', 'SAFETY', 'SALARY', 'SAMPLE', 'SAVING', 'SAYING',
        'SCHEME', 'SCHOOL', 'SCREEN', 'SEARCH', 'SEASON', 'SECOND', 'SECRET', 'SECTOR', 'SECURE', 'SEEING',
        'SELECT', 'SELLER', 'SENIOR', 'SERIES', 'SERVER', 'SETTLE', 'SEVERE', 'SEXUAL', 'SHALL', 'SHAPE',
        'SHARE', 'SHARP', 'SHEEP', 'SHEET', 'SHELF', 'SHELL', 'SHIFT', 'SHIRT', 'SHOCK', 'SHOES', 'SHOOT',
        'SHORT', 'SHOWN', 'SIGHT', 'SINCE', 'SIXTH', 'SIXTY', 'SIZED', 'SKILL', 'SKIRT', 'SLEEP', 'SLIDE',
        'SMALL', 'SMART', 'SMILE', 'SMITH', 'SMOKE', 'SNAKE', 'SOLAR', 'SOLID', 'SOLVE', 'SORRY', 'SOUND',
        'SOUTH', 'SPACE', 'SPARE', 'SPEAK', 'SPEED', 'SPEND', 'SPENT', 'SPICY', 'SPILL', 'SPINE', 'SPLIT',
        'SPOKE', 'SPOON', 'SPORT', 'SPRAY', 'STAFF', 'STAGE', 'STAKE', 'STAND', 'STARE', 'STARS', 'START',
        'STATE', 'STEAM', 'STEEL', 'STEEP', 'STEER', 'STICK', 'STILL', 'STOCK', 'STONE', 'STOOD', 'STORE',
        'STORM', 'STORY', 'STRAW', 'STRIP', 'STUCK', 'STUDY', 'STUFF', 'STYLE', 'SUGAR', 'SUITE', 'SUPER',
        'SWEAT', 'SWEET', 'SWING', 'SWORD', 'TABLE', 'TAKEN', 'TASTE', 'TAXES', 'TEACH', 'TEETH', 'TERRY',
        'TEXAS', 'THANK', 'THEFT', 'THEIR', 'THEME', 'THERE', 'THESE', 'THICK', 'THING', 'THINK', 'THIRD',
        'THOSE', 'THREE', 'THREW', 'THROW', 'THUMB', 'TIGER', 'TIGHT', 'TIMES', 'TIRED', 'TITLE', 'TODAY',
        'TOPIC', 'TOTAL', 'TOUCH', 'TOUGH', 'TOWER', 'TRACK', 'TRADE', 'TRAIN', 'TREAT', 'TREND', 'TRIAL',
        'TRIED', 'TRIES', 'TRUCK', 'TRULY', 'TRUST', 'TRUTH', 'TWICE', 'UNDER', 'UNDUE', 'UNION', 'UNITY',
        'UNTIL', 'UPPER', 'UPSET', 'URBAN', 'USAGE', 'USUAL', 'VALID', 'VALUE', 'VIDEO', 'VIRUS', 'VISIT',
        'VITAL', 'VOICE', 'VOTER', 'WAGON', 'WAIST', 'WATCH', 'WATER', 'WEALTH', 'WEAR', 'WHEEL', 'WHERE',
        'WHICH', 'WHILE', 'WHITE', 'WHOLE', 'WHOSE', 'WOMAN', 'WOMEN', 'WORLD', 'WORRY', 'WORSE', 'WORST',
        'WORTH', 'WOULD', 'WOUND', 'WRITE', 'WRONG', 'WROTE', 'YACHT', 'YIELD', 'YOUNG', 'YOUTH', 'ZEBRA'
    ]),
    
    // 7-letter words
    expert: new Set([
        'ABSOLUTE', 'ACADEMY', 'ACCOUNT', 'ACHIEVE', 'ADDRESS', 'ADVANCE', 'ADVISED', 'ADVISER', 'AGAINST', 'AIRLINE',
        'AIRPORT', 'ALCOHOL', 'ALLIANCE', 'ALREADY', 'ALTHOUGH', 'AMAZING', 'ANALYST', 'ANALYZE', 'ANCIENT', 'ANOTHER',
        'ANXIETY', 'ANXIOUS', 'ANYBODY', 'APPLIED', 'ARRANGE', 'ARRIVAL', 'ARTICLE', 'ASSAULT', 'ASSERTED', 'ATTRACT',
        'AUCTION', 'AVERAGE', 'BACKING', 'BALANCE', 'BANKING', 'BARRIER', 'BATTERY', 'BEARING', 'BEATING', 'BECAUSE',
        'BEDROOM', 'BELIEVE', 'BENEATH', 'BENEFIT', 'BESIDES', 'BETWEEN', 'BILLION', 'BINDING', 'BROTHER', 'BROUGHT',
        'BURNING', 'CABINET', 'CALIBER', 'CALLING', 'CAPABLE', 'CAPITAL', 'CAPTAIN', 'CAPTION', 'CAPTURE', 'CAREFUL',
        'CARRIER', 'CAUTION', 'CEILING', 'CENTRAL', 'CENTURY', 'CERTAIN', 'CHAMBER', 'CHANNEL', 'CHAPTER', 'CHARITY',
        'CHARLIE', 'CHARTER', 'CHECKED', 'CHICKEN', 'CHRONIC', 'CIRCUIT', 'CLARITY', 'CLASSIC', 'CLIMATE', 'CLOSING',
        'CLOSURE', 'CLOTHES', 'COLLECT', 'COLLEGE', 'COMBINE', 'COMFORT', 'COMMAND', 'COMMENT', 'COMPANY', 'COMPARE',
        'COMPETE', 'COMPLEX', 'CONCEPT', 'CONCERN', 'CONCERT', 'CONDUCT', 'CONFIRM', 'CONNECT', 'CONSENT', 'CONSIST',
        'CONTACT', 'CONTAIN', 'CONTENT', 'CONTEST', 'CONTEXT', 'CONTROL', 'CONVERT', 'CORRECT', 'COUNCIL', 'COUNSEL',
        'COUNTER', 'COUNTRY', 'CRUCIAL', 'CRYSTAL', 'CULTURE', 'CURRENT', 'CUTTING', 'DEALING', 'DECIDED', 'DECLINE',
        'DEFAULT', 'DEFENCE', 'DEFICIT', 'DELIVER', 'DENSITY', 'DEPOSIT', 'DESKTOP', 'DESPITE', 'DESTROY', 'DEVELOP',
        'DEVOTED', 'DIAMOND', 'DIGITAL', 'DISCUSS', 'DISEASE', 'DISPLAY', 'DISPUTE', 'DISTANT', 'DIVERSE', 'DIVIDED',
        'DRAWING', 'DRIVING', 'DYNAMIC', 'EASTERN', 'ECONOMY', 'EDITION', 'ELDERLY', 'ELEMENT', 'ENGAGED', 'ENHANCE',
        'ESSENCE', 'EVENING', 'EVIDENT', 'EXACTLY', 'EXAMINE', 'EXAMPLE', 'EXCITED', 'EXCLUDE', 'EXECUTE', 'EXHIBIT',
        'EXPENSE', 'EXPLAIN', 'EXPRESS', 'EXTEND', 'EXTRACT', 'EXTREME', 'FACTORY', 'FACULTY', 'FAILING', 'FAILURE',
        'FASHION', 'FEATURE', 'FEDERAL', 'FEELING', 'FICTION', 'FIFTEEN', 'FILLING', 'FINANCE', 'FINDING', 'FISHING',
        'FITNESS', 'FOREIGN', 'FOREVER', 'FORMULA', 'FORTUNE', 'FORWARD', 'FOUNDER', 'FREEDOM', 'FURTHER', 'GALLERY',
        'GATEWAY', 'GENERAL', 'GENETIC', 'GENUINE', 'GIGABIT', 'GREATER', 'HANGING', 'HEADING', 'HEALTHY', 'HEARING',
        'HEAVILY', 'HELPFUL', 'HELPING', 'HERSELF', 'HIGHWAY', 'HIMSELF', 'HISTORY', 'HOLDING', 'HOLIDAY', 'HOUSING',
        'HOWEVER', 'HUNDRED', 'HUSBAND', 'ILLEGAL', 'ILLNESS', 'IMAGINE', 'IMAGING', 'IMPROVE', 'INCLUDE', 'INITIAL',
        'INQUIRY', 'INSIGHT', 'INSTALL', 'INSTANT', 'INSTEAD', 'INTENSE', 'INTERIM', 'INVOLVE', 'JOINTLY', 'JOURNAL',
        'JOURNEY', 'JUSTICE', 'JUSTIFY', 'KEEPING', 'KILLING', 'KINGDOM', 'KITCHEN', 'KNOWING', 'LANDING', 'LARGELY',
        'LASTING', 'LEADING', 'LEARNED', 'LEISURE', 'LIBERAL', 'LIBRARY', 'LICENSE', 'LIMITED', 'LISTING', 'LOGICAL',
        'LOYALTY', 'MACHINE', 'MANAGER', 'MARRIED', 'MASSIVE', 'MAXIMUM', 'MEANING', 'MEASURE', 'MEDICAL', 'MEETING',
        'MENTION', 'MESSAGE', 'MILLION', 'MINERAL', 'MINIMAL', 'MINIMUM', 'MISSING', 'MISSION', 'MISTAKE', 'MIXTURE',
        'MONITOR', 'MONTHLY', 'MORNING', 'MUSICAL', 'MYSTERY', 'NATURAL', 'NEITHER', 'NERVOUS', 'NETWORK', 'NEUTRAL',
        'NOTABLE', 'NOTHING', 'NOWHERE', 'NUCLEAR', 'NURSING', 'OBVIOUS', 'OFFENSE', 'OFFICER', 'ONGOING', 'OPENING',
        'OPERATE', 'OPINION', 'OPTICAL', 'ORGANIC', 'OUTCOME', 'OUTDOOR', 'OUTLOOK', 'OUTSIDE', 'OVERALL', 'PACKAGE',
        'PAINFUL', 'PAINTER', 'PARKING', 'PARTIAL', 'PARTNER', 'PASSAGE', 'PASSING', 'PASSION', 'PASSIVE', 'PATIENT',
        'PATTERN', 'PAYABLE', 'PAYMENT', 'PENALTY', 'PENDING', 'PENSION', 'PERCENT', 'PERFECT', 'PERHAPS', 'PHOENIX',
        'PICKING', 'PICTURE', 'PIONEER', 'PLASTIC', 'POINTED', 'POPULAR', 'PORTION', 'POVERTY', 'PRECISE', 'PREDICT',
        'PREMIUM', 'PREPARE', 'PRESENT', 'PREVENT', 'PRIMARY', 'PRINTER', 'PRIVACY', 'PRIVATE', 'PROBLEM', 'PROCEED',
        'PROCESS', 'PRODUCE', 'PRODUCT', 'PROFILE', 'PROGRAM', 'PROJECT', 'PROMISE', 'PROMOTE', 'PROTECT', 'PROTEIN',
        'PROTEST', 'PROVIDE', 'PUBLISH', 'PURPOSE', 'PUSHING', 'QUALIFY', 'QUALITY', 'QUARTER', 'RADICAL', 'RAILWAY',
        'READING', 'REALITY', 'REALIZE', 'RECEIPT', 'RECEIVE', 'RECOVER', 'REFLECT', 'REGULAR', 'RELEASE', 'REMAINS',
        'REMOVAL', 'REMOVED', 'REPLACE', 'REQUEST', 'REQUIRE', 'RESERVE', 'RESOLVE', 'RESPECT', 'RESPOND', 'RESTORE',
        'RETIRED', 'REVENUE', 'REVERSE', 'ROUTINE', 'RUNNING', 'SATISFY', 'SCIENCE', 'SECTION', 'SEGMENT', 'SERIOUS',
        'SERVICE', 'SERVING', 'SESSION', 'SETTING', 'SEVENTH', 'SEVERAL', 'SHORTLY', 'SHOWING', 'SILENCE', 'SIMILAR',
        'SITTING', 'SIXTEEN', 'SKILLED', 'SMOKING', 'SOCIETY', 'SOMEHOW', 'SOMEONE', 'SPEAKER', 'SPECIAL', 'SPECIES',
        'SPONSOR', 'STATION', 'STORAGE', 'STRANGE', 'STRETCH', 'STUDENT', 'STUDIED', 'SUBJECT', 'SUCCESS', 'SUGGEST',
        'SUMMARY', 'SUPPORT', 'SUPPOSE', 'SUPREME', 'SURFACE', 'SURGERY', 'SURPLUS', 'SURVIVE', 'SUSPECT', 'SUSTAIN',
        'TEACHER', 'TELECOM', 'TELLING', 'TENSION', 'THEATRE', 'THERAPY', 'THEREBY', 'THOUGHT', 'THROUGH', 'TONIGHT',
        'TOTALLY', 'TOUCHED', 'TOWARDS', 'TRAFFIC', 'TREATY', 'TRYING', 'TWELVE', 'TWENTY', 'UNABLE', 'UNIQUE', 'UNITED',
        'UNLESS', 'UNLIKE', 'UPDATE', 'USEFUL', 'VALLEY', 'VARIED', 'VENDOR', 'VERSUS', 'VICTIM', 'VISION', 'VISUAL',
        'VOLUME', 'WALKER', 'WEALTH', 'WEEKLY', 'WEIGHT', 'WHOLLY', 'WINDOW', 'WINNER', 'WINTER', 'WITHIN', 'WONDER',
        'WORKER', 'WRIGHT', 'WRITER', 'YELLOW'
    ])
};

// Common English words of different lengths also kept as fallback
const COMMON_ENGLISH_WORDS = {
    // Additional 4-letter words
    4: new Set([
        'ABED', 'ABET', 'ABLE', 'ABUT', 'ACED', 'ACES', 'ACHE', 'ACID', 'ACME', 'ACNE', 'ACRE', 'ACT', 'ACTS', 'ADDS', 'ADEPT',
        'AFAR', 'AFRO', 'AGER', 'AGES', 'AGOG', 'AHEM', 'AHOY', 'AIDE', 'AIDS', 'AILS', 'AIMS', 'AINT', 'AIRS', 'AIRY', 'AJAR',
        'AKIN', 'ALAS', 'ALBS', 'ALEE', 'ALES', 'ALGA', 'ALIA', 'ALLY', 'ALMS', 'ALOE', 'ALPS', 'ALSO', 'ALTO', 'ALUM', 'AMBO',
        'AMEN', 'AMID', 'AMMO', 'AMOK', 'AMPS', 'ANAL', 'ANEW', 'ANKH', 'ANNA', 'ANON', 'ANTE', 'ANTI', 'ANTS', 'ANUS', 'APED',
        'APES', 'APEX', 'APPS', 'AQUA', 'ARCH', 'ARCS', 'AREA', 'ARES', 'ARIA', 'ARID', 'ARKS', 'ARMS', 'ARMY', 'ARSE', 'ARTS',
        'ARTY', 'ARUM', 'ASHY', 'ASKS', 'ASPS', 'ATOM', 'ATOP', 'AUKS', 'AUNT', 'AURA', 'AUTO', 'AVER', 'AVID', 'AVOW', 'AWAY',
        'AWED', 'AWES', 'AWLS', 'AWNS', 'AWOL', 'AWRY', 'AXED', 'AXEL', 'AXES', 'AXIS', 'AXLE', 'AXON', 'AYAH', 'AYES', 'BAAS',
        'BABE', 'BABY', 'BACK', 'BADE', 'BADS', 'BAGS', 'BAHT', 'BAIL', 'BAIT', 'BAKE', 'BALD', 'BALE', 'BALK', 'BALL', 'BALM',
        'BAND', 'BANE', 'BANG', 'BANK', 'BANS', 'BARB', 'BARD', 'BARE', 'BARF', 'BARK', 'BARN', 'BARS', 'BART', 'BASE', 'BASH',
        'BASK', 'BASS', 'BAST', 'BATE', 'BATH', 'BATS', 'BAUD', 'BAWD', 'BAWL', 'BAYS', 'BEAD', 'BEAK', 'BEAM', 'BEAN', 'BEAR',
        'BEAT', 'BEAU', 'BECK', 'BEDS', 'BEEF', 'BEEN', 'BEEP', 'BEER', 'BEES', 'BEET', 'BEGS', 'BELL', 'BELT', 'BEND', 'BENT',
        'BERG', 'BERM', 'BEST', 'BETA', 'BETS', 'BEVY', 'BIAS', 'BIBS', 'BIDE', 'BIDS', 'BIER', 'BIFF', 'BIKE', 'BILE', 'BILK',
        'BILL', 'BIND', 'BINS', 'BIRD', 'BITE', 'BITS', 'BLAB', 'BLAH', 'BLAM', 'BLED', 'BLEW', 'BLIP', 'BLOB', 'BLOC', 'BLOT',
        'BLOW', 'BLUE', 'BLUR', 'BOAR', 'BOAT', 'BOBS', 'BODE', 'BODY', 'BOGS', 'BOIL', 'BOLD', 'BOLE', 'BOLL', 'BOLT', 'BOMB',
        'BOND', 'BONE', 'BONG', 'BONK', 'BONY', 'BOOB', 'BOOK', 'BOOM', 'BOON', 'BOOR', 'BOOS', 'BOOT', 'BORE', 'BORN', 'BOSS',
        'BOTH', 'BOTS', 'BOUT', 'BOWL', 'BOWS', 'BOXY', 'BOYS', 'BRAD', 'BRAG', 'BRAN', 'BRAS', 'BRAT', 'BRAY', 'BRED', 'BREW',
        'BRIE', 'BRIG', 'BRIM', 'BRIS', 'BRIT', 'BROW', 'BRUT', 'BUBO', 'BUBS', 'BUCK', 'BUDS', 'BUFF', 'BUGS', 'BULB', 'BULK',
        'BULL', 'BUMP', 'BUMS', 'BUNK', 'BUNS', 'BUNT', 'BUOY', 'BURL', 'BURN', 'BURP', 'BURR', 'BURT', 'BURY', 'BUSH', 'BUSK',
        'BUST', 'BUSY', 'BUTS', 'BUTT', 'BUYS', 'BUZZ', 'BYES', 'BYRE'
    ]),

    // Additional 5-letter words
    5: new Set([
        'ABACK', 'ABASE', 'ABATE', 'ABBEY', 'ABBOT', 'ABHOR', 'ABIDE', 'ABLED', 'ABODE', 'ABORT', 'ABOUT', 'ABOVE', 'ABUSE',
        'ABYSS', 'ACORN', 'ACRID', 'ACTOR', 'ACUTE', 'ADAGE', 'ADAPT', 'ADDER', 'ADDLE', 'ADEPT', 'ADMIN', 'ADMIT', 'ADOBE',
        'ADOPT', 'ADORE', 'ADORN', 'ADULT', 'AFFIX', 'AFIRE', 'AFOOT', 'AFOUL', 'AFTER', 'AGAIN', 'AGAPE', 'AGATE', 'AGENT',
        'AGILE', 'AGING', 'AGLOW', 'AGONY', 'AGREE', 'AHEAD', 'AIDER', 'AISLE', 'ALARM', 'ALBUM', 'ALERT', 'ALGAE', 'ALIBI',
        'ALIEN', 'ALIGN', 'ALIKE', 'ALIVE', 'ALLAY', 'ALLEY', 'ALLOT', 'ALLOW', 'ALLOY', 'ALOFT', 'ALONE', 'ALONG', 'ALOOF',
        'ALOUD', 'ALPHA', 'ALTAR', 'ALTER', 'AMASS', 'AMAZE', 'AMBER', 'AMBLE', 'AMEND', 'AMIDST', 'AMISS', 'AMITY', 'AMONG',
        'AMOUR', 'AMPLE', 'AMPLY', 'AMUSE', 'ANGEL', 'ANGER', 'ANGLE', 'ANGRY', 'ANGST', 'ANIME', 'ANKLE', 'ANNEX', 'ANNOY',
        'ANNUL', 'ANODE', 'ANTIC', 'ANVIL', 'AORTA', 'APART', 'APHID', 'APNEA', 'APPLE', 'APPLY', 'APRON', 'APTLY', 'ARBOR',
        'ARDOR', 'ARENA', 'ARGUE', 'ARISE', 'ARMOR', 'AROMA', 'AROSE', 'ARRAY', 'ARROW', 'ARSON', 'ARTSY', 'ASCOT', 'ASHEN',
        'ASIDE', 'ASKEW', 'ASSAY', 'ASSET', 'ATOLL', 'ATONE', 'ATTIC', 'AUDIO', 'AUDIT', 'AUGUR', 'AUNTY', 'AVAIL', 'AVERT',
        'AVIAN', 'AVOID', 'AWAIT', 'AWAKE', 'AWARD', 'AWARE', 'AWASH', 'AWFUL', 'AWOKE', 'AXIAL', 'AXIOM', 'AZURE'
    ]),

    // Additional 6-letter words
    6: new Set([
        'ABACUS', 'ABAIST', 'ABASED', 'ABASER', 'ABASES', 'ABATED', 'ABATES', 'ABATOR', 'ABBESS', 'ABBEYS', 'ABBOTS',
        'ABDUCT', 'ABHORS', 'ABIDED', 'ABIDER', 'ABIDES', 'ABJECT', 'ABJURE', 'ABLATE', 'ABLAUT', 'ABLAZE', 'ABOARD',
        'ABODES', 'ABOLISH', 'ABOLLA', 'ABORTS', 'ABOUND', 'ABRADE', 'ABROAD', 'ABRUPT', 'ABSEIL', 'ABSENT', 'ABSORB',
        'ABSURD', 'ABULIA', 'ABUSED', 'ABUSER', 'ABUSES', 'ACACIA', 'ACADEME', 'ACCEDE', 'ACCENT', 'ACCEPT', 'ACCESS',
        'ACCORD', 'ACCOST', 'ACCRUE', 'ACCUSE', 'ACETIC', 'ACETYL', 'ACHENE', 'ACHING', 'ACIDIC', 'ACINAR', 'ACINIC',
        'ACINUS', 'ACKNOW', 'ACORNS', 'ACQUIT', 'ACROSS', 'ACTING', 'ACTION', 'ACTIVE', 'ACTORS', 'ACTUAL', 'ACUITY',
        'ACUMEN', 'ACUTER', 'ADAGES', 'ADAGIO', 'ADAPTS', 'ADDEND', 'ADDERS', 'ADDICT', 'ADDING', 'ADDLED', 'ADDLES',
        'ADDUCE', 'ADDUCT', 'ADEPTS', 'ADHERE', 'ADIPIC', 'ADJOIN', 'ADJUST', 'ADMIRE', 'ADMITS', 'ADNATE', 'ADNEXA',
        'ADONIS', 'ADOPTS', 'ADORED', 'ADORER', 'ADORES', 'ADORNS', 'ADRIFT', 'ADROIT', 'ADSORB', 'ADULTS', 'ADVENT',
        'ADVERB', 'ADVERT', 'ADVICE', 'ADVISE', 'ADYTUM', 'ADZUKI', 'AEDILE', 'AERATE', 'AERIAL', 'AERIER', 'AERIFY',
        'AEROBE', 'AERUGO', 'AFFAIR', 'AFFECT', 'AFFINE', 'AFFIRM', 'AFFLUX', 'AFFORD', 'AFFRAY'
    ]),

    // Additional 7-letter words
    7: new Set([
        'AARDVARK', 'ABACUSES', 'ABANDON', 'ABASHED', 'ABASHES', 'ABASING', 'ABATE', 'ABATING', 'ABDICATE', 'ABDOMEN',
        'ABDOMINAL', 'ABDUCT', 'ABDUCTED', 'ABDUCTOR', 'ABEAM', 'ABHOR', 'ABHORRED', 'ABIDING', 'ABILITY', 'ABIOTIC',
        'ABJECT', 'ABJURE', 'ABLATE', 'ABLATION', 'ABLATIVE', 'ABLAZE', 'ABLEPSY', 'ABLINGS', 'ABOARD', 'ABODING',
        'ABOLISH', 'ABOLLA', 'ABOLLAE', 'ABOMA', 'ABOMASA', 'ABOMASI', 'ABOMASUS', 'ABORTION', 'ABORTIVE', 'ABOUND',
        'ABOUNDED', 'ABOULIA', 'ABOULIC', 'ABRASION', 'ABRASIVE', 'ABREACT', 'ABREAST', 'ABRIDGE', 'ABROGATE',
        'ABRUPT', 'ABSCISE', 'ABSCISSA', 'ABSCOND', 'ABSEIL', 'ABSENCE', 'ABSCESS', 'ABSCISE', 'ABSCOND',
        'ABSOLUTE', 'ABSOLVER', 'ABSORB', 'ABSTRACT', 'ABSTRUSE', 'ABSURD', 'ABUSIVE', 'ABYSMAL', 'ABYSSAL',
        'ACADEMIC', 'ACADEMY', 'ACANTHA', 'ACANTHAE', 'ACAPNIA', 'ACARBOSE', 'ACARIAN', 'ACARIDAN', 'ACAROID'
    ])
};

// Basic vowel-consonant pattern check to filter out unlikely English words
function hasValidWordPattern(word) {
    // Convert to lowercase for easier handling
    word = word.toLowerCase();
    
    // Check for at least 1 vowel
    if (!/[aeiou]/.test(word)) {
        return false;
    }
    
    // Check for no more than 3 consecutive consonants
    if (/[^aeiou]{4,}/.test(word)) {
        return false;
    }
    
    // Check for no more than 2 consecutive vowels (with a few exceptions)
    if (/[aeiou]{3,}/.test(word) && !['queue', 'beau', 'beauty'].includes(word)) {
        return false;
    }
    
    // Check for common English patterns
    return true;
}

// Function to check if a word is a valid dictionary word
function isValidDictionaryWord(word, difficulty) {
    // Convert to uppercase for consistency
    word = word.toUpperCase();
    
    // First, check if it's in words_alpha.txt if that function is available
    if (typeof isWordInWordsAlpha === 'function') {
        const isValid = isWordInWordsAlpha(word);
        if (isValid) {
            return true;
        }
        // If we have words_alpha.txt and the word is not in it, reject immediately
        return false;
    }
    
    // If words_alpha.txt is not available, fall back to original validation logic
    
    // Check if it's in our main difficulty-specific set
    if (VALID_WORDS[difficulty] && VALID_WORDS[difficulty].has(word)) {
        return true;
    }
    
    // If not found, check in common words by length
    const wordLength = word.length;
    
    // Determine which length-based dictionary to check based on difficulty
    let lenToCheck = wordLength;
    if (difficulty === 'easy') lenToCheck = 4;
    else if (difficulty === 'medium') lenToCheck = 5;
    else if (difficulty === 'hard') lenToCheck = 6;
    else if (difficulty === 'expert') lenToCheck = 7;
    
    // Check if the word is in our common words dictionary
    if (COMMON_ENGLISH_WORDS[lenToCheck] && COMMON_ENGLISH_WORDS[lenToCheck].has(word)) {
        return true;
    }
    
    // Additionally, if the word is 4-7 letters, check other length dictionaries
    if (wordLength >= 4 && wordLength <= 7) {
        if (COMMON_ENGLISH_WORDS[wordLength] && COMMON_ENGLISH_WORDS[wordLength].has(word)) {
            return true;
        }
    }
    
    // If we have the extended dictionary available, check there too
    if (typeof EXTENDED_DICTIONARY !== 'undefined') {
        // Check in the length-specific extended dictionary
        if (EXTENDED_DICTIONARY[lenToCheck] && EXTENDED_DICTIONARY[lenToCheck].includes(word)) {
            return true;
        }
        
        // Check in any of the extended dictionaries if length matches
        if (wordLength >= 4 && wordLength <= 7) {
            if (EXTENDED_DICTIONARY[wordLength] && EXTENDED_DICTIONARY[wordLength].includes(word)) {
                return true;
            }
        }
    }
    
    // If nothing else matched, reject the word
    console.log(`Rejected word not in dictionary: ${word}`);
    return false;
} 