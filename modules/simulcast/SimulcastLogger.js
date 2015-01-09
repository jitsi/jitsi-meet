/**
 *
 * @constructor
 */
function SimulcastLogger(name, lvl) {
    this.name = name;
    this.lvl = lvl;
}

SimulcastLogger.prototype.log = function (text) {
    if (this.lvl) {
        console.log(text);
    }
};

SimulcastLogger.prototype.info = function (text) {
    if (this.lvl > 1) {
        console.info(text);
    }
};

SimulcastLogger.prototype.fine = function (text) {
    if (this.lvl > 2) {
        console.log(text);
    }
};

SimulcastLogger.prototype.error = function (text) {
    console.error(text);
};

module.exports = SimulcastLogger;