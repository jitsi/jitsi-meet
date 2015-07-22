var UsernameGenerator = require('../util/UsernameGenerator');

var email = '';
var displayName = '';
var userId;
var language = null;
var callStatsUserName;


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

    if (!window.localStorage.callStatsUserName) {
        window.localStorage.callStatsUserName
            = UsernameGenerator.generateUsername();
        console.log('generated callstats uid',
            window.localStorage.callStatsUserName);

    }
    userId = window.localStorage.jitsiMeetId || '';
    callStatsUserName = window.localStorage.callStatsUserName;
    email = window.localStorage.email || '';
    displayName = window.localStorage.displayname || '';
    language = window.localStorage.language;
} else {
    console.log("local storage is not supported");
    userId = generateUniqueId();
    callStatsUserName = UsernameGenerator.generateUsername();
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
     * Returns fake username for callstats
     * @returns {string} fake username for callstats
     */
    getCallStatsUserName: function () {
        return callStatsUserName;
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
    },
    getJid: function() {
      var configDomain = config.hosts.anonymousdomain || config.hosts.domain;
      // Force authenticated domain if room is appended with '?login=true'
      if (config.hosts.anonymousdomain &&
          window.location.search.indexOf("login=true") !== -1) {
          configDomain = config.hosts.domain;
      }
      var jid = configDomain || window.location.hostname;
    }

};

module.exports = Settings;
