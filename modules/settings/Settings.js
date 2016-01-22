var logger = require("jitsi-meet-logger").getLogger(__filename);

var UsernameGenerator = require('../util/UsernameGenerator');

function supportsLocalStorage() {
    try {
        return 'localStorage' in window && window.localStorage !== null;
    } catch (e) {
        logger.log("localstorage is not supported");
        return false;
    }
}


function generateUniqueId() {
    function _p8() {
        return (Math.random().toString(16) + "000000000").substr(2, 8);
    }
    return _p8() + _p8() + _p8() + _p8();
}

function Settings(conferenceID) {
    this.displayName = '';
    this.userId;
    this.confSettings = null;
    this.conferenceID = conferenceID;
    this.callStatsUserName;
    if (supportsLocalStorage()) {
        if(!window.localStorage.getItem(conferenceID))
            this.confSettings = {};
        else
            this.confSettings = JSON.parse(window.localStorage.getItem(conferenceID));
        if(!this.confSettings.jitsiMeetId) {
            this.confSettings.jitsiMeetId = generateUniqueId();
            logger.log("generated id",
                this.confSettings.jitsiMeetId);
            this.save();
        }
        if (!this.confSettings.callStatsUserName) {
            this.confSettings.callStatsUserName
                = UsernameGenerator.generateUsername();
            logger.log('generated callstats uid',
                this.confSettings.callStatsUserName);
            this.save();
        }

        this.userId = this.confSettings.jitsiMeetId || '';
        this.displayName = this.confSettings.displayname || '';
        this.callStatsUserName = this.confSettings.callStatsUserName || '';
    } else {
        logger.log("local storage is not supported");
        this.userId = generateUniqueId();
        this.callStatsUserName = UsernameGenerator.generateUsername();
    }
}

Settings.prototype.save = function () {
    if(!supportsLocalStorage())
        window.localStorage.setItem(this.conferenceID, JSON.stringify(this.confSettings));
}

Settings.prototype.setDisplayName = function (newDisplayName) {
    this.displayName = newDisplayName;
    if(this.confSettings != null)
        this.confSettings.displayname = displayName;
    this.save();
    return this.displayName;
}

Settings.prototype.getSettings = function () {
    return {
        displayName: this.displayName,
        uid: this.userId
    };
}

/**
 * Returns fake username for callstats
 * @returns {string} fake username for callstats
 */
Settings.prototype.getCallStatsUserName = function () {
    return this.callStatsUserName;
}

module.exports = Settings;
