
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
    random4digitsHex: function () {
        return rangeRandomHex(0x1000, 0xFFFF);
    },
    /**
     * Generates hex number with length 8
     */
    random8digitsHex: function () {
        return rangeRandomHex(0x10000000, 0xFFFFFFFF);
    },
    /**
     * Generates hex number with length 12
     */
    random12digitsHex: function () {
        return rangeRandomHex(0x100000000000, 0xFFFFFFFFFFFF);
    }
};

module.exports = RandomUtil;
