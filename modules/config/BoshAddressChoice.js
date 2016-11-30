const logger = require("jitsi-meet-logger").getLogger(__filename);

var JSSHA = require('jssha');

module.exports = {
    /**
     * Looks for a list of possible BOSH addresses in 'config.boshList' and
     * sets the value of 'config.bosh' based on that list and 'roomName'.
     * @param config the configuration object.
     * @param roomName the name of the room/conference.
     */
    chooseAddress: function(config, roomName) {
        if (!roomName || !config.boshList || !Array.isArray(config.boshList) ||
            !config.boshList.length) {
            return;
        }

        // This implements the actual choice of an entry in the list based on
        // roomName. Please consider the implications for existing deployments
        // before introducing changes.
        var hash = (new JSSHA(roomName, 'TEXT')).getHash('SHA-1', 'HEX');
        var n = parseInt("0x"+hash.substr(-6));
        var idx = n % config.boshList.length;
        var attemptFirstAddress;

        config.bosh = config.boshList[idx];
        logger.log('Setting config.bosh to ' + config.bosh +
            ' (idx=' + idx + ')');

        if (config.boshAttemptFirstList &&
            Array.isArray(config.boshAttemptFirstList) &&
            config.boshAttemptFirstList.length > 0) {

            idx = n % config.boshAttemptFirstList.length;
            attemptFirstAddress = config.boshAttemptFirstList[idx];

            if (attemptFirstAddress != config.bosh) {
                config.boshAttemptFirst = attemptFirstAddress;
                logger.log('Setting config.boshAttemptFirst=' +
                    attemptFirstAddress + ' (idx=' + idx + ')');
            } else {
                logger.log('Not setting boshAttemptFirst, address matches.');
            }
        }
    }
};
