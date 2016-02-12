import {generateUsername} from '../util/UsernameGenerator';
import UIUtil from '../UI/util/UIUtil';

let email = '';
let displayName = '';
let userId;
let language = null;
let cameraDeviceId = '';
let micDeviceId = '';

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

    userId = window.localStorage.jitsiMeetId || '';
    email = window.localStorage.email || '';
    displayName = UIUtil.unescapeHtml(window.localStorage.displayname || '');
    language = window.localStorage.language;
    cameraDeviceId = window.localStorage.cameraDeviceId || '';
    micDeviceId = window.localStorage.micDeviceId || '';
} else {
    console.log("local storage is not supported");
    userId = generateUniqueId();
}

export default {

    /**
     * Sets the local user display name and saves it to local storage
     *
     * @param {string} newDisplayName unescaped display name for the local user
     */
    setDisplayName (newDisplayName) {
        displayName = newDisplayName;
        window.localStorage.displayname = UIUtil.escapeHtml(displayName);
    },

    /**
     * Returns the escaped display name currently used by the user
     * @returns {string} currently valid user display name.
     */
    getDisplayName: function () {
        return displayName;
    },

    /**
     * Returns id of the user.
     * @returns {string} user id
     */
    getUserId () {
        return userId;
    },

    setEmail: function (newEmail) {
        email = newEmail;
        window.localStorage.email = newEmail;
        return email;
    },

    getEmail: function () {
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
    getLanguage () {
        return language;
    },
    setLanguage: function (lang) {
        language = lang;
        window.localStorage.language = lang;
    },

    /**
     * Get device id of the camera which is currently in use.
     * Empty string stands for default device.
     * @returns {String}
     */
    getCameraDeviceId: function () {
        return cameraDeviceId;
    },
    /**
     * Set device id of the camera which is currently in use.
     * Empty string stands for default device.
     * @param {string} newId new camera device id
     */
    setCameraDeviceId: function (newId = '') {
        cameraDeviceId = newId;
        window.localStorage.cameraDeviceId = newId;
    },

    /**
     * Get device id of the microphone which is currently in use.
     * Empty string stands for default device.
     * @returns {String}
     */
    getMicDeviceId: function () {
        return micDeviceId;
    },
    /**
     * Set device id of the microphone which is currently in use.
     * Empty string stands for default device.
     * @param {string} newId new microphone device id
     */
    setMicDeviceId: function (newId = '') {
        micDeviceId = newId;
        window.localStorage.micDeviceId = newId;
    }
};
