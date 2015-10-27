
/**
 * Generates random hex number within the range [min, max]
 * @param max the maximum value for the generated number
 * @param min the minimum value for the generated number
 * @returns random hex number
 */
function rangeRandomHex(min, max)
{
    return Math.floor(Math.random() * (max - min) + min).toString(16);
}

/**
 * Exported interface.
 */
var RandomUtil = {
    /**
     * Generates hex number with length 4
     */
    random4digitsHex: function() {
        return rangeRandomHex(4096, 65535);
    },
    /**
     * Generates hex number with length 8
     */
    random8digitsHex: function() {
        return rangeRandomHex(268435456, 4294967295);
    },
    /**
     * Generates hex number with length 12
     */
    random12digitsHex: function() {
        return rangeRandomHex(17592186044416, 281474976710655);
    }
};

module.exports = RandomUtil;
