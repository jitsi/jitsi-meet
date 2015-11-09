
var logger = require("jitsi-meet-logger").getLogger(__filename);
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
    this.email = '';
    this.displayName = '';
    this.userId;
    this.language = null;
    this.confSettings = null;
    this.conferenceID = conferenceID;
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
        this.userId = this.confSettings.jitsiMeetId || '';
        this.email = this.confSettings.email || '';
        this.displayName = this.confSettings.displayname || '';
        this.language = this.confSettings.language;
    } else {
        logger.log("local storage is not supported");
        this.userId = generateUniqueId();
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
},
Settings.prototype.setEmail = function (newEmail) {
    this.email = newEmail;
    if(this.confSettings != null)
        this.confSettings.email = newEmail;
    this.save();
    return this.email;
},
Settings.prototype.getSettings = function () {
    return {
        email: this.email,
        displayName: this.displayName,
        uid: this.userId,
        language: this.language
    };
},
Settings.prototype.setLanguage = function (lang) {
    this.language = lang;
    if(this.confSettings != null)
        this.confSettings.language = lang;
    this.save();
}

module.exports = Settings;
