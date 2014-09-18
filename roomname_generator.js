var RoomNameGenerator = function(my) {


    /**
     * Constructs new RoomNameGenerator object.
     * @constructor constructs new RoomNameGenerator object.
     */
    function RoomNameGeneratorProto()
    {

    }

    /**
     * Default separator the words in the room name
     * @type {string}
     */
    var DEFAULT_SEPARATOR = "-";

    /**
     * Default number of words in the room name.
     * @type {number}
     */
    var NUMBER_OF_WORDS = 3;


    /**
     * The list with words.
     * @type {string[]}
     */
    var words = [
        "definite", "indefinite", "articles", "name", "preposition", "help", "very", "to", "through", "and", "just",
        "a", "form", "in", "sentence", "is", "great", "it", "think", "you", "say", "that", "help", "he", "low", "was",
        "line", "for", "differ", "on", "turn", "are", "cause", "with", "much", "as", "mean", "before", "his", "move",
        "they", "right", "be", "boy", "at", "old", "one", "too", "have", "same", "this", "tell", "from", "does", "or",
        "set", "had", "three", "by", "want", "hot", "air", "word", "well", "but", "also", "what", "play", "some", "small",
        "we", "end", "can", "put", "out", "home", "other", "read", "were", "hand", "all", "port", "there", "large",
        "when", "spell", "up", "add", "use", "even", "your", "land", "how", "here", "said", "must", "an", "big", "each",
        "high", "she", "such", "which", "follow", "do", "act", "their", "why", "time", "ask", "if", "men", "will", "change",
        "way", "went", "about", "light", "many", "kind", "then", "off", "them", "need", "write", "house", "would",
        "picture", "like", "try", "so", "us", "these", "again", "her", "animal", "long", "point", "make", "mother",
        "thing", "world", "see", "near", "him", "build", "two", "self", "has", "earth", "look", "father", "more", "head",
        "day", "stand", "could", "own", "go", "page", "come", "should", "did", "country", "number", "found", "sound",
        "answer", "no", "school", "most", "grow", "people", "study", "my", "still", "over", "learn", "know", "plant",
        "water", "cover", "than", "food", "call", "sun", "first", "four", "who", "between", "may", "state", "down",
        "keep", "side", "eye", "been", "never", "now", "last", "find", "let", "any", "thought", "new", "city", "work",
        "tree", "part", "cross", "take", "farm", "get", "hard", "place", "start", "made", "might", "live", "story",
        "where", "saw", "after", "far", "back", "sea", "little", "draw", "only", "left", "round", "late", "man", "run",
        "year", "don't", "came", "while", "show", "press", "every", "close", "good", "night", "me", "real", "give",
        "life", "our", "few", "under", "north", "open", "ten", "seem", "simple", "together", "several", "next", "vowel",
        "white", "toward", "children", "war", "begin", "lay", "got", "against", "walk", "pattern", "example", "slow",
        "ease", "center", "paper", "love", "group", "person", "always", "money", "music", "serve", "those", "appear",
        "both", "road", "mark", "map", "often", "rain", "letter", "rule", "until", "govern", "mile", "pull", "river",
        "cold", "car", "notice", "feet", "voice", "care", "unit", "second", "power", "book", "town", "carry", "fine",
        "took", "certain", "science", "fly", "eat", "fall", "room", "lead", "friend", "cry", "began", "dark", "idea",
        "machine", "fish", "note", "mountain", "wait", "stop", "plan", "once", "figure", "base", "star", "hear", "box",
        "horse", "noun", "cut", "field", "sure", "rest", "watch", "correct", "color", "able", "face", "pound", "wood",
        "done", "main", "beauty", "enough", "drive", "plain", "stood", "girl", "contain", "usual", "front", "young",
        "teach", "ready", "week", "above", "final", "ever", "gave", "red", "green", "list", "oh", "though", "quick",
        "feel", "develop", "talk", "ocean", "bird", "warm", "soon", "free", "body", "minute", "dog", "strong", "family",
        "special", "direct", "mind", "pose", "behind", "leave", "clear", "song", "tail", "measure", "produce", "door",
        "fact", "product", "street", "black", "inch", "short", "multiply", "numeral", "nothing", "class", "course", "wind",
        "stay", "question", "wheel", "happen", "full", "complete", "force", "ship", "blue", "area", "object", "half",
        "decide", "rock", "surface", "order", "deep", "fire", "moon", "south", "island", "problem", "foot", "piece",
        "system", "told", "busy", "knew", "test", "pass", "record", "since", "boat", "top", "common", "whole", "gold",
        "king", "possible", "space", "plane", "heard", "stead", "best", "dry", "hour", "wonder", "better", "laugh",
        "true", "thousand", "during", "ago", "hundred", "ran", "five", "check", "remember", "game", "step", "shape",
        "early", "equate", "hold", "hot", "west", "miss", "ground", "brought", "interest", "heat", "reach", "snow",
        "fast", "tire", "verb", "bring", "sing", "yes", "listen", "distant", "six", "fill", "table", "east", "travel",
        "paint", "less", "language", "morning", "among", "grand", "cat", "ball", "century", "yet", "consider", "wave",
        "type", "drop", "law", "heart", "bit", "am", "coast", "present", "copy", "heavy", "phrase", "dance", "silent",
        "engine", "tall", "position", "sand", "arm", "soil", "wide", "roll", "sail", "temperature", "material", "finger",
        "size", "industry", "vary", "value", "settle", "fight", "speak", "lie", "weight", "beat", "general", "excite",
        "ice", "natural", "matter", "view", "circle", "sense", "pair", "ear", "include", "else", "divide", "quite",
        "syllable", "broke", "felt", "case", "perhaps", "middle", "pick", "kill", "sudden", "son", "count", "lake",
        "square", "moment", "reason", "scale", "length", "loud", "represent", "spring", "art", "observe", "subject",
        "child", "region", "straight", "energy", "consonant", "hunt", "nation", "probable", "dictionary", "bed", "milk",
        "brother", "speed", "egg", "method", "ride", "organ", "cell", "pay", "believe", "age", "fraction", "section",
        "forest", "dress", "sit", "cloud", "race", "surprise", "window", "quiet", "store", "stone", "summer", "tiny",
        "train", "climb", "sleep", "cool", "prove", "design", "lone", "poor", "leg", "lot", "exercise", "experiment",
        "wall", "bottom", "catch", "key", "mount", "iron", "wish", "single", "sky", "stick", "board", "flat", "joy",
        "twenty", "winter", "skin", "sat", "smile", "written", "crease", "wild", "hole", "instrument", "trade", "kept",
        "melody", "glass", "trip", "grass", "office", "cow", "receive", "job", "row", "edge", "mouth", "sign", "exact",
        "visit", "symbol", "past", "die", "soft", "least", "fun", "trouble", "bright", "shout", "gas", "except",
        "weather", "wrote", "month", "seed", "million", "tone", "bear", "join", "finish", "suggest", "happy", "clean",
        "hope", "break", "flower", "lady", "clothe", "yard", "strange", "rise", "gone", "bad", "jump", "blow", "baby",
        "oil", "eight", "blood", "village", "touch", "meet", "grew", "root", "cent", "buy", "mix", "raise", "team",
        "solve", "wire", "metal", "cost", "whether", "lost", "push", "brown", "seven", "wear", "paragraph", "garden",
        "third", "equal", "shall", "sent", "held", "choose", "hair", "fell", "describe", "fit", "cook", "flow", "floor",
        "fair", "either", "bank", "result", "collect", "burn", "save", "hill", "control", "safe", "decimal", "rank",
        "word", "reference", "gentle", "truck", "woman", "noise", "captain", "level",
        "practice", "chance", "separate", "gather", "difficult", "shop", "doctor", "stretch", "please", "throw",
        "protect", "shine", "noon", "property", "whose", "column", "locate", "molecule", "ring", "select", "character",
        "wrong", "insect", "gray", "caught", "repeat", "period", "require", "indicate", "broad", "radio", "prepare",
        "spoke", "salt", "atom", "nose", "human", "plural", "history", "anger", "effect", "claim", "electric",
        "continent", "expect", "oxygen", "crop", "sugar", "modern", "death", "element", "pretty", "hit", "skill",
        "student", "women", "corner", "season", "party", "solution", "supply", "magnet", "bone", "silver", "rail",
        "thank", "imagine", "branch", "provide", "match", "agree", "suffix", "thus", "especially", "capital", "fig",
        "won't", "afraid", "chair", "huge", "danger", "sister", "fruit", "steel", "rich", "discuss", "thick", "forward",
        "soldier", "similar", "process", "guide", "operate", "experience", "guess", "score", "necessary", "apple",
        "sharp", "bought", "wing", "led", "create", "pitch", "neighbor", "coat", "wash", "mass", "bat", "card", "rather",
        "band", "crowd", "rope", "corn", "slip", "compare", "win", "poem", "dream", "string", "evening", "bell",
        "condition", "depend", "feed", "meat", "tool", "rub", "total", "tube", "basic", "famous", "smell", "dollar",
        "valley", "stream", "nor", "fear", "double", "sight", "seat", "thin", "arrive", "triangle", "master", "planet",
        "track", "hurry", "parent", "chief", "shore", "colony", "division", "clock", "sheet", "mine", "substance", "tie",
        "favor", "enter", "connect", "major", "post", "fresh", "spend", "search", "chord", "send", "fat", "yellow",
        "glad", "gun", "original", "allow", "share", "print", "station", "dead", "dad", "spot", "bread", "desert",
        "charge", "suit", "proper", "current", "bar", "lift", "offer", "rose", "segment", "continue", "slave", "block",
        "duck", "chart", "instant", "hat", "market", "sell", "degree", "success", "populate", "company", "chick",
        "subtract", "dear", "event", "enemy", "particular", "reply", "deal", "drink", "swim", "occur", "term", "support",
        "opposite", "speech", "wife", "nature", "shoe", "range", "shoulder", "steam", "spread", "motion", "arrange",
        "path", "camp", "liquid", "invent", "log", "cotton", "meant", "born", "quotient", "determine", "teeth", "quart",
        "shell", "nine", "neck", "fancy", "fan", "football"
    ];

    /**
     * Returns random word from the array of words.
     * @returns {string} random word from the array of words.
     */
    function generateWord()
    {
        return words[Math.floor(Math.random() * words.length)];
    }

    /**
     * Generates new room name.
     * @param separator the separator for the words.
     * @param number_of_words number of words in the room name
     * @returns {string} the room name
     */
    RoomNameGeneratorProto.generateRoom = function(separator, number_of_words)
    {
        if(!separator)
            separator = DEFAULT_SEPARATOR;
        if(!number_of_words)
            number_of_words = NUMBER_OF_WORDS;
        var name = "";
        for(var i = 0; i<number_of_words; i++)
            name += ((i != 0)? separator : "") + generateWord();
        return name;
    }

    /**
     * Generates new room name.
     * @param number_of_words number of words in the room name
     * @returns {string} the room name
     */
    RoomNameGeneratorProto.generateRoomWithoutSeparator = function(number_of_words)
    {
        if(!number_of_words)
            number_of_words = NUMBER_OF_WORDS;
        var name = "";
        for(var i = 0; i<number_of_words; i++) {
            var word = generateWord();
            word = word.substring(0, 1).toUpperCase() + word.substring(1, word.length);
            name += word ;
        }
        return name;
    }

    return RoomNameGeneratorProto;
}();

