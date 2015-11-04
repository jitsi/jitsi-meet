var UsernameGenerator = require('../util/UsernameGenerator');

var email = '';
var displayName = '';
var userId;
var language = null;
var callStatsUID;


function supportsLocalStorage() {
    try {
        return 'localStorage' in window && window.localStorage !== null;
    } catch (e) {
        console.log("localstorage is not supported");
        return false;
    }
}


function generateUniqueId() {
    function _p8() {
        return (Math.random().toString(16) + "000000000").substr(2, 8);
    }
    return _p8() + _p8() + _p8() + _p8();
}

if (supportsLocalStorage()) {
    if (!window.localStorage.jitsiMeetId) {
        window.localStorage.jitsiMeetId = generateUniqueId();
        console.log("generated id", window.localStorage.jitsiMeetId);
    }
    if (!window.localStorage.callStatsUID) {
        window.localStorage.callStatsUID = UsernameGenerator.generateUsername();
        console.log('generated callstats uid',
            window.localStorage.callStatsUID);
    }
    userId = window.localStorage.jitsiMeetId || '';
    callStatsUID = window.localStorage.callStatsUID;
    email = window.localStorage.email || '';
    displayName = window.localStorage.displayname || '';
    language = window.localStorage.language;
} else {
    console.log("local storage is not supported");
    userId = generateUniqueId();
    callStatsUID = UsernameGenerator.generateUsername();
}

var Settings = {

    /**
     * Sets the local user display name and saves it to local storage
     *
     * @param newDisplayName the new display name for the local user
     * @returns {string} the display name we just set
     */
    setDisplayName: function (newDisplayName) {
        displayName = newDisplayName;
        window.localStorage.displayname = displayName;
        return displayName;
    },

    /**
     * Returns the currently used by the user
     * @returns {string} currently valid user display name.
     */
    getDisplayName: function () {
        return displayName;
    },

    /**
     * Returns user id for callstats
     * @returns {string} user id for callstats
     */
    getCallStatsUID: function () {
        return callStatsUID;
    },

    setEmail: function (newEmail) {
        email = newEmail;
        window.localStorage.email = newEmail;
        return email;
    },

    getSettings: function () {
        return {
            email: email,
            displayName: displayName,
            uid: userId,
            language: language
        };
    },
    setLanguage: function (lang) {
        language = lang;
        window.localStorage.language = lang;
    }
};

module.exports = Settings;
