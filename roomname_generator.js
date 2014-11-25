var RoomNameGenerator = function(my) {
    /**
     * Constructs new RoomNameGenerator object.
     * @constructor constructs new RoomNameGenerator object.
     */
    function RoomNameGeneratorProto()
    {
    }

    //var nouns = [
    //];
    var pluralNouns = [
        "Aliens", "Animals", "Antelopes", "Ants", "Apes", "Apples", "Baboons", "Bacteria", "Badgers", "Bananas", "Bats",
        "Bears", "Birds", "Bonobos", "Brides", "Bugs", "Bulls", "Butterflies", "Cheetahs",
        "Cherries", "Chicken", "Children", "Chimps", "Clowns", "Cows", "Creatures", "Dinosaurs", "Dogs", "Dolphins",
        "Donkeys", "Dragons", "Ducks", "Dwarfs", "Eagles", "Elephants", "Elves", "FAIL", "Fathers",
        "Fish", "Flowers", "Frogs", "Fruit", "Fungi", "Galaxies", "Geese", "Goats",
        "Gorillas", "Hedgehogs", "Hippos", "Horses", "Hunters", "Insects", "Kids", "Knights",
        "Lemons", "Lemurs", "Leopards", "LifeForms", "Lions", "Lizards", "Mice", "Monkeys", "Monsters",
        "Mushrooms", "Octopodes", "Oranges", "Orangutans", "Organisms", "Pants", "Parrots", "Penguins",
        "People", "Pigeons", "Pigs", "Pineapples", "Plants", "Potatoes", "Priests", "Rats", "Reptiles", "Reptilians",
        "Rhinos", "Seagulls", "Sheep", "Siblings", "Snakes", "Spaghetti", "Spiders", "Squid", "Squirrels",
        "Stars", "Students", "Teachers", "Tigers", "Tomatoes", "Trees", "Vampires", "Vegetables", "Viruses", "Vulcans",
        "Warewolves", "Weasels", "Whales", "Witches", "Wizards", "Wolves", "Workers", "Worms", "Zebras"
    ];
    //var places = [
    //"Pub", "University", "Airport", "Library", "Mall", "Theater", "Stadium", "Office", "Show", "Gallows", "Beach",
    // "Cemetery", "Hospital", "Reception", "Restaurant", "Bar", "Church", "House", "School", "Square", "Village",
    // "Cinema", "Movies", "Party", "Restroom", "End", "Jail", "PostOffice", "Station", "Circus", "Gates", "Entrance",
    // "Bridge"
    //];
    var verbs = [
        "Abandon", "Adapt", "Advertise", "Answer", "Anticipate", "Appreciate",
        "Approach", "Argue", "Ask", "Bite", "Blossom", "Blush", "Breathe", "Breed", "Bribe", "Burn", "Calculate",
        "Clean", "Code", "Communicate", "Compute", "Confess", "Confiscate", "Conjugate", "Conjure", "Consume",
        "Contemplate", "Crawl", "Dance", "Delegate", "Devour", "Develop", "Differ", "Discuss",
        "Dissolve", "Drink", "Eat", "Elaborate", "Emancipate", "Estimate", "Expire", "Extinguish",
        "Extract", "FAIL", "Facilitate", "Fall", "Feed", "Finish", "Floss", "Fly", "Follow", "Fragment", "Freeze",
        "Gather", "Glow", "Grow", "Hex", "Hide", "Hug", "Hurry", "Improve", "Intersect", "Investigate", "Jinx",
        "Joke", "Jubilate", "Kiss", "Laugh", "Manage", "Meet", "Merge", "Move", "Object", "Observe", "Offer",
        "Paint", "Participate", "Party", "Perform", "Plan", "Pursue", "Pierce", "Play", "Postpone", "Pray", "Proclaim",
        "Question", "Read", "Reckon", "Rejoice", "Represent", "Resize", "Rhyme", "Scream", "Search", "Select", "Share", "Shoot",
        "Shout", "Signal", "Sing", "Skate", "Sleep", "Smile", "Smoke", "Solve", "Spell", "Steer", "Stink",
        "Substitute", "Swim", "Taste", "Teach", "Terminate", "Think", "Type", "Unite", "Vanish", "Worship"
    ];
    var adverbs = [
        "Absently", "Accurately", "Accusingly", "Adorably", "AllTheTime", "Alone", "Always", "Amazingly", "Angrily",
        "Anxiously", "Anywhere", "Appallingly", "Apparently", "Articulately", "Astonishingly", "Badly", "Barely",
        "Beautifully", "Blindly", "Bravely", "Brightly", "Briskly", "Brutally", "Calmly", "Carefully", "Casually",
        "Cautiously", "Cleverly", "Constantly", "Correctly", "Crazily", "Curiously", "Cynically", "Daily",
        "Dangerously", "Deliberately", "Delicately", "Desperately", "Discreetly", "Eagerly", "Easily", "Euphoricly",
        "Evenly", "Everywhere", "Exactly", "Expectantly", "Extensively", "FAIL", "Ferociously", "Fiercely", "Finely",
        "Flatly", "Frequently", "Frighteningly", "Gently", "Gloriously", "Grimly", "Guiltily", "Happily",
        "Hard", "Hastily", "Heroically", "High", "Highly", "Hourly", "Humbly", "Hysterically", "Immensely",
        "Impartially", "Impolitely", "Indifferently", "Intensely", "Jealously", "Jovially", "Kindly", "Lazily",
        "Lightly", "Loudly", "Lovingly", "Loyally", "Magnificently", "Malevolently", "Merrily", "Mightily", "Miserably",
        "Mysteriously", "NOT", "Nervously", "Nicely", "Nowhere", "Objectively", "Obnoxiously", "Obsessively",
        "Obviously", "Often", "Painfully", "Patiently", "Playfully", "Politely", "Poorly", "Precisely", "Promptly",
        "Quickly", "Quietly", "Randomly", "Rapidly", "Rarely", "Recklessly", "Regularly", "Remorsefully", "Responsibly",
        "Rudely", "Ruthlessly", "Sadly", "Scornfully", "Seamlessly", "Seldom", "Selfishly", "Seriously", "Shakily",
        "Sharply", "Sideways", "Silently", "Sleepily", "Slightly", "Slowly", "Slyly", "Smoothly", "Softly", "Solemnly", "Steadily", "Sternly", "Strangely", "Strongly", "Stunningly", "Surely", "Tenderly", "Thoughtfully",
        "Tightly", "Uneasily", "Vanishingly", "Violently", "Warmly", "Weakly", "Wearily", "Weekly", "Weirdly", "Well",
        "Well", "Wickedly", "Wildly", "Wisely", "Wonderfully", "Yearly"
    ];
    var adjectives = [
        "Abominable", "Accurate", "Adorable", "All", "Alleged", "Ancient", "Angry", "Angry", "Anxious", "Appalling",
        "Apparent", "Astonishing", "Attractive", "Awesome", "Baby", "Bad", "Beautiful", "Benign", "Big", "Bitter",
        "Blind", "Blue", "Bold", "Brave", "Bright", "Brisk", "Calm", "Camouflaged", "Casual", "Cautious",
        "Choppy", "Chosen", "Clever", "Cold", "Cool", "Crawly", "Crazy", "Creepy", "Cruel", "Curious", "Cynical",
        "Dangerous", "Dark", "Delicate", "Desperate", "Difficult", "Discreet", "Disguised", "Dizzy",
        "Dumb", "Eager", "Easy", "Edgy", "Electric", "Elegant", "Emancipated", "Enormous", "Euphoric", "Evil",
        "FAIL", "Fast", "Ferocious", "Fierce", "Fine", "Flawed", "Flying", "Foolish", "Foxy",
        "Freezing", "Funny", "Furious", "Gentle", "Glorious", "Golden", "Good", "Green", "Green", "Guilty",
        "Hairy", "Happy", "Hard", "Hasty", "Hazy", "Heroic", "Hostile", "Hot", "Humble", "Humongous",
        "Humorous", "Hysterical", "Idealistic", "Ignorant", "Immense", "Impartial", "Impolite", "Indifferent",
        "Infuriated", "Insightful", "Intense", "Interesting", "Intimidated", "Intriguing", "Jealous", "Jolly", "Jovial",
        "Jumpy", "Kind", "Laughing", "Lazy", "Liquid", "Lonely", "Longing", "Loud", "Loving", "Loyal", "Macabre", "Mad",
        "Magical", "Magnificent", "Malevolent", "Medieval", "Memorable", "Mere", "Merry", "Mighty",
        "Mischievous", "Miserable", "Modified", "Moody", "Most", "Mysterious", "Mystical", "Needy",
        "Nervous", "Nice", "Objective", "Obnoxious", "Obsessive", "Obvious", "Opinionated", "Orange",
        "Painful", "Passionate", "Perfect", "Pink", "Playful", "Poisonous", "Polite", "Poor", "Popular", "Powerful", 
        "Precise", "Preserved", "Pretty", "Purple", "Quick", "Quiet", "Random", "Rapid", "Rare", "Real",
        "Reassuring", "Reckless", "Red", "Regular", "Remorseful", "Responsible", "Rich", "Rude", "Ruthless",
        "Sad", "Scared", "Scary", "Scornful", "Screaming", "Selfish", "Serious", "Shady", "Shaky", "Sharp",
        "Shiny", "Shy", "Simple", "Sleepy", "Slow", "Sly", "Small", "Smart", "Smelly", "Smiling", "Smooth",
        "Smug", "Sober", "Soft", "Solemn", "Square", "Square", "Steady", "Strange", "Strong",
        "Stunning", "Subjective", "Successful", "Surly", "Sweet", "Tactful", "Tense",
        "Thoughtful", "Tight", "Tiny", "Tolerant", "Uneasy", "Unique", "Unseen", "Warm", "Weak",
        "Weird", "WellCooked", "Wild", "Wise", "Witty", "Wonderful", "Worried", "Yellow", "Young",
        "Zealous"
        ];
    //var pronouns = [
    //];
    //var conjunctions = [
    //"And", "Or", "For", "Above", "Before", "Against", "Between"
    //];

    /*
     * Maps a string (category name) to the array of words from that category.
     */
    var CATEGORIES =
    {
        //"_NOUN_": nouns,
        "_PLURALNOUN_": pluralNouns,
        //"_PLACE_": places,
        "_VERB_": verbs,
        "_ADVERB_": adverbs,
        "_ADJECTIVE_": adjectives
        //"_PRONOUN_": pronouns,
        //"_CONJUNCTION_": conjunctions,
    };

    var PATTERNS = [
        "_ADJECTIVE__PLURALNOUN__VERB__ADVERB_"

        // BeautifulFungiOrSpaghetti
        //"_ADJECTIVE__PLURALNOUN__CONJUNCTION__PLURALNOUN_",

        // AmazinglyScaryToy
        //"_ADVERB__ADJECTIVE__NOUN_",

        // NeitherTrashNorRifle
        //"Neither_NOUN_Nor_NOUN_",
        //"Either_NOUN_Or_NOUN_",

        // EitherCopulateOrInvestigate
        //"Either_VERB_Or_VERB_",
        //"Neither_VERB_Nor_VERB_",

        //"The_ADJECTIVE__ADJECTIVE__NOUN_",
        //"The_ADVERB__ADJECTIVE__NOUN_",
        //"The_ADVERB__ADJECTIVE__NOUN_s",
        //"The_ADVERB__ADJECTIVE__PLURALNOUN__VERB_",

        // WolvesComputeBadly
        //"_PLURALNOUN__VERB__ADVERB_",

        // UniteFacilitateAndMerge
        //"_VERB__VERB_And_VERB_",

        //NastyWitchesAtThePub
        //"_ADJECTIVE__PLURALNOUN_AtThe_PLACE_",
    ];


    /*
     * Returns a random element from the array 'arr' 
     */
    function randomElement(arr)
    {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /*
     * Returns true if the string 's' contains one of the
     * template strings.
     */
    function hasTemplate(s)
    {
        for (var template in CATEGORIES){
            if (s.indexOf(template) >= 0){
                return true;
            }
        }
    }

    /**
     * Generates new room name.
     */
    RoomNameGeneratorProto.generateRoomWithoutSeparator = function()
    {
        // Note that if more than one pattern is available, the choice of 'name' won't be random (names from patterns
        // with fewer options will have higher probability of being chosen that names from patterns with more options).
        var name = randomElement(PATTERNS);
        var word;
        while (hasTemplate(name)){
            for (var template in CATEGORIES){
                word = randomElement(CATEGORIES[template]);
                name = name.replace(template, word);
            }
        }

        return name;
    };

    return RoomNameGeneratorProto;
}();

