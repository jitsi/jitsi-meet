/**
 * An object representing a transcribed word, with some additional information
 * @param word the word 
 * @param begin the time the word was started being uttered
 * @param end the tome the word stopped being uttered
 */
var Word = function (word, begin, end, name) {
    this.word = word;
    this.begin = begin;
    this.end = end;
};

/**
 * Get the string representation of the word
 * @returns {*} the word as a string
 */
Word.prototype.getWord = function() {
    return this.word;  
};

/**
 * Get the time the word started being uttered
 * @returns {*} the start time as an integer
 */
Word.prototype.getBeginTime = function () {
    return this.begin;
};

/**
 * Get the time the word stopped being uttered
 * @returns {*} the end time as an integer
 */
Word.prototype.getEndTime = function () {
    return this.end;
};

module.exports = Word;