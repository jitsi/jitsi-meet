import RandomUtil from './RandomUtil';

/**
* The list of available nouns. It is used while generating new room names.
* @const
**/
const PLURAL_NOUNS = [
    "Aliens", "Animals", "Antelopes", "Ants", "Apes", "Apples", "Baboons",
    "Bacteria", "Badgers", "Bananas", "Bats", "Bears", "Birds", "Bonobos",
    "Brides", "Bugs", "Bulls", "Butterflies", "Cheetahs", "Cherries", "Chicken",
    "Children", "Chimps", "Clowns", "Cows", "Creatures", "Dinosaurs", "Dogs",
    "Dolphins", "Donkeys", "Dragons", "Ducks", "Dwarfs", "Eagles", "Elephants",
    "Elves", "Fathers", "Fish", "Flowers", "Frogs", "Fruit", "Fungi",
    "Galaxies", "Geese", "Goats", "Gorillas", "Hedgehogs", "Hippos", "Horses",
    "Hunters", "Insects", "Kids", "Knights", "Lemons", "Lemurs", "Leopards",
    "LifeForms", "Lions", "Lizards", "Mice", "Monkeys", "Monsters", "Mushrooms",
    "Octopodes", "Oranges", "Orangutans", "Organisms", "Pants", "Parrots",
    "Penguins", "People", "Pigeons", "Pigs", "Pineapples", "Plants", "Potatoes",
    "Priests", "Rats", "Reptiles", "Reptilians", "Rhinos", "Seagulls", "Sheep",
    "Siblings", "Snakes", "Spaghetti", "Spiders", "Squid", "Squirrels",
    "Stars", "Students", "Teachers", "Tigers", "Tomatoes", "Trees", "Vampires",
    "Vegetables", "Viruses", "Vulcans", "Weasels", "Werewolves", "Whales",
    "Witches", "Wizards", "Wolves", "Workers", "Worms", "Zebras"
];

/**
* The list of available verbs. It is used while generating new room names.
* @const
**/
const VERBS = [
    "Abandon", "Adapt", "Advertise", "Answer", "Anticipate", "Appreciate",
    "Approach", "Argue", "Ask", "Bite", "Blossom", "Blush", "Breathe", "Breed",
    "Bribe", "Burn", "Calculate", "Clean", "Code", "Communicate", "Compute",
    "Confess", "Confiscate", "Conjugate", "Conjure", "Consume", "Contemplate",
    "Crawl", "Dance", "Delegate", "Devour", "Develop", "Differ", "Discuss",
    "Dissolve", "Drink", "Eat", "Elaborate", "Emancipate", "Estimate", "Expire",
    "Extinguish", "Extract", "Facilitate", "Fall", "Feed", "Finish", "Floss",
    "Fly", "Follow", "Fragment", "Freeze", "Gather", "Glow", "Grow", "Hex",
    "Hide", "Hug", "Hurry", "Improve", "Intersect", "Investigate", "Jinx",
    "Joke", "Jubilate", "Kiss", "Laugh", "Manage", "Meet", "Merge", "Move",
    "Object", "Observe", "Offer", "Paint", "Participate", "Party", "Perform",
    "Plan", "Pursue", "Pierce", "Play", "Postpone", "Pray", "Proclaim",
    "Question", "Read", "Reckon", "Rejoice", "Represent", "Resize", "Rhyme",
    "Scream", "Search", "Select", "Share", "Shoot", "Shout", "Signal", "Sing",
    "Skate", "Sleep", "Smile", "Smoke", "Solve", "Spell", "Steer", "Stink",
    "Substitute", "Swim", "Taste", "Teach", "Terminate", "Think", "Type",
    "Unite", "Vanish", "Worship"
];

/**
* The list of available adverbs. It is used while generating new room names.
* @const
**/
const ADVERBS = [
    "Absently", "Accurately", "Accusingly", "Adorably", "AllTheTime", "Alone",
    "Always", "Amazingly", "Angrily", "Anxiously", "Anywhere", "Appallingly",
    "Apparently", "Articulately", "Astonishingly", "Badly", "Barely",
    "Beautifully", "Blindly", "Bravely", "Brightly", "Briskly", "Brutally",
    "Calmly", "Carefully", "Casually", "Cautiously", "Cleverly", "Constantly",
    "Correctly", "Crazily", "Curiously", "Cynically", "Daily", "Dangerously",
    "Deliberately", "Delicately", "Desperately", "Discreetly", "Eagerly",
    "Easily", "Euphoricly", "Evenly", "Everywhere", "Exactly", "Expectantly",
    "Extensively", "Ferociously", "Fiercely", "Finely", "Flatly", "Frequently",
    "Frighteningly", "Gently", "Gloriously", "Grimly", "Guiltily", "Happily",
    "Hard", "Hastily", "Heroically", "High", "Highly", "Hourly", "Humbly",
    "Hysterically", "Immensely", "Impartially", "Impolitely", "Indifferently",
    "Intensely", "Jealously", "Jovially", "Kindly", "Lazily", "Lightly",
    "Loudly", "Lovingly", "Loyally", "Magnificently", "Malevolently", "Merrily",
    "Mightily", "Miserably", "Mysteriously", "NOT", "Nervously", "Nicely",
    "Nowhere", "Objectively", "Obnoxiously", "Obsessively", "Obviously",
    "Often", "Painfully", "Patiently", "Playfully", "Politely", "Poorly",
    "Precisely", "Promptly", "Quickly", "Quietly", "Randomly", "Rapidly",
    "Rarely", "Recklessly", "Regularly", "Remorsefully", "Responsibly",
    "Rudely", "Ruthlessly", "Sadly", "Scornfully", "Seamlessly", "Seldom",
    "Selfishly", "Seriously", "Shakily", "Sharply", "Sideways", "Silently",
    "Sleepily", "Slightly", "Slowly", "Slyly", "Smoothly", "Softly", "Solemnly",
    "Steadily", "Sternly", "Strangely", "Strongly", "Stunningly", "Surely",
    "Tenderly", "Thoughtfully", "Tightly", "Uneasily", "Vanishingly",
    "Violently", "Warmly", "Weakly", "Wearily", "Weekly", "Weirdly", "Well",
    "Well", "Wickedly", "Wildly", "Wisely", "Wonderfully", "Yearly"
];

/**
* The list of available adjectives. It is used while generating new room names.
* @const
**/
const ADJECTIVES = [
    "Abominable", "Accurate", "Adorable", "All", "Alleged", "Ancient", "Angry",
    "Anxious", "Appalling", "Apparent", "Astonishing", "Attractive", "Awesome",
    "Baby", "Bad", "Beautiful", "Benign", "Big", "Bitter", "Blind", "Blue",
    "Bold", "Brave", "Bright", "Brisk", "Calm", "Camouflaged", "Casual",
    "Cautious", "Choppy", "Chosen", "Clever", "Cold", "Cool", "Crawly",
    "Crazy", "Creepy", "Cruel", "Curious", "Cynical", "Dangerous", "Dark",
    "Delicate", "Desperate", "Difficult", "Discreet", "Disguised", "Dizzy",
    "Dumb", "Eager", "Easy", "Edgy", "Electric", "Elegant", "Emancipated",
    "Enormous", "Euphoric", "Evil", "Fast", "Ferocious", "Fierce", "Fine",
    "Flawed", "Flying", "Foolish", "Foxy", "Freezing", "Funny", "Furious",
    "Gentle", "Glorious", "Golden", "Good", "Green", "Green", "Guilty",
    "Hairy", "Happy", "Hard", "Hasty", "Hazy", "Heroic", "Hostile", "Hot",
    "Humble", "Humongous", "Humorous", "Hysterical", "Idealistic", "Ignorant",
    "Immense", "Impartial", "Impolite", "Indifferent", "Infuriated",
    "Insightful", "Intense", "Interesting", "Intimidated", "Intriguing",
    "Jealous", "Jolly", "Jovial", "Jumpy", "Kind", "Laughing", "Lazy", "Liquid",
    "Lonely", "Longing", "Loud", "Loving", "Loyal", "Macabre", "Mad", "Magical",
    "Magnificent", "Malevolent", "Medieval", "Memorable", "Mere", "Merry",
    "Mighty", "Mischievous", "Miserable", "Modified", "Moody", "Most",
    "Mysterious", "Mystical", "Needy", "Nervous", "Nice", "Objective",
    "Obnoxious", "Obsessive", "Obvious", "Opinionated", "Orange", "Painful",
    "Passionate", "Perfect", "Pink", "Playful", "Poisonous", "Polite", "Poor",
    "Popular", "Powerful", "Precise", "Preserved", "Pretty", "Purple", "Quick",
    "Quiet", "Random", "Rapid", "Rare", "Real", "Reassuring", "Reckless", "Red",
    "Regular", "Remorseful", "Responsible", "Rich", "Rude", "Ruthless", "Sad",
    "Scared", "Scary", "Scornful", "Screaming", "Selfish", "Serious", "Shady",
    "Shaky", "Sharp", "Shiny", "Shy", "Simple", "Sleepy", "Slow", "Sly",
    "Small", "Smart", "Smelly", "Smiling", "Smooth", "Smug", "Sober", "Soft",
    "Solemn", "Square", "Square", "Steady", "Strange", "Strong", "Stunning",
    "Subjective", "Successful", "Surly", "Sweet", "Tactful", "Tense",
    "Thoughtful", "Tight", "Tiny", "Tolerant", "Uneasy", "Unique", "Unseen",
    "Warm", "Weak", "Weird", "WellCooked", "Wild", "Wise", "Witty", "Wonderful",
    "Worried", "Yellow", "Young", "Zealous"
    ];

/**
 * Maps a string (category name) to the array of words from that category.
 * @const
 **/
const CATEGORIES = {
    "_PLURALNOUN_": pluralNouns,
    "_VERB_": verbs,
    "_ADVERB_": adverbs,
    "_ADJECTIVE_": adjectives
};

/**
* The list of available patterns for new room names generating.
* @const
**/
const PATTERNS = [
    "_ADJECTIVE__PLURALNOUN__VERB__ADVERB_"
];

/**
 * Singleton object responsible for generating of new room names.
 *
 * @singleton
 **/
export default const RoomnameGenerator = {

    /**
    * Method generating new room names without separator based on available
    * patterns.
    * @return {string} name - result room name
    **/
    generateRoomWithoutSeparator() {
        // XXX Note that if more than one pattern is available, the choice of
        // 'name' won't have a uniform distribution amongst all patterns (names
        // from patterns with fewer options will have higher probability of
        // being chosen that names from patterns with more options).
        let name = RandomUtil.randomElement(PATTERNS);
        let word;
        while (this._hasTemplate(name)) {
            let categories = Object.keys(CATEGORIES);

            name = categories.reduce((acc, template) => {
              word = RandomUtil.randomElement(CATEGORIES[template]);
              acc = acc.replace(template, word);
            }, name);
        }

        return name;
    },

    /*
     * Returns true if the string 'str' contains one of the
     * template strings.
     * @argument {string} str - String containing categories.
     *
     * @private
     **/
    _hasTemplate(s) {
      let categories = Object.keys(CATEGORIES);

      for (let i = 0, length = categories.length; i < length; i += 1) {
        if (s.indexOf(CATEGORIES[i]) >= 0){
            return true;
        }
      }
    }
};
