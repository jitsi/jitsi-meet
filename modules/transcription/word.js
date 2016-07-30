var word = function (word, begin, end) {
    this.word = word;
    this.begin = begin;
    this.end = end;
};

word.prototype.getWord = function() {
    return this.word;  
};

word.prototype.getBeginTime = function () {
    return this.begin;
};

word.prototype.getEndTime = function () {
    return this.end;
};