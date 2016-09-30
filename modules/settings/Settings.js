/* global JitsiMeetJS */

import UIUtil from '../UI/util/UIUtil';

let email = '';
let avatarId = '';
let displayName = '';
let language = null;
let cameraDeviceId = '';
let micDeviceId = '';
let welcomePageDisabled = false;
let localFlipX = null;
let avatarUrl = '';

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

    email = UIUtil.unescapeHtml(window.localStorage.email || '');
    avatarId = UIUtil.unescapeHtml(window.localStorage.avatarId || '');
    if (!avatarId) {
        // if there is no avatar id, we generate a unique one and use it forever
        avatarId = generateUniqueId();
        window.localStorage.avatarId = avatarId;
    }

    localFlipX = JSON.parse(window.localStorage.localFlipX || true);
    displayName = UIUtil.unescapeHtml(window.localStorage.displayname || '');
    language = window.localStorage.language;
    cameraDeviceId = window.localStorage.cameraDeviceId || '';
    micDeviceId = window.localStorage.micDeviceId || '';
    welcomePageDisabled = JSON.parse(
        window.localStorage.welcomePageDisabled || false
    );

    // Currently audio output device change is supported only in Chrome and
    // default output always has 'default' device ID
    var audioOutputDeviceId = window.localStorage.audioOutputDeviceId
        || 'default';

    if (audioOutputDeviceId !==
        JitsiMeetJS.mediaDevices.getAudioOutputDevice()) {
        JitsiMeetJS.mediaDevices.setAudioOutputDevice(audioOutputDeviceId)
            .catch((ex) => {
                console.warn('Failed to set audio output device from local ' +
                    'storage. Default audio output device will be used' +
                    'instead.', ex);
            });
    }
} else {
    console.log("local storage is not supported");
}

export default {

    /**
     * Sets the local user display name and saves it to local storage
     *
     * @param {string} newDisplayName unescaped display name for the local user
     * @param {boolean} disableLocalStore disables local store the display name
     */
    setDisplayName (newDisplayName, disableLocalStore) {
        displayName = newDisplayName;

        if (!disableLocalStore)
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
     * Sets new email for local user and saves it to the local storage.
     * @param {string} newEmail new email for the local user
     * @param {boolean} disableLocalStore disables local store the email
     */
    setEmail: function (newEmail, disableLocalStore) {
        email = newEmail;

        if (!disableLocalStore)
            window.localStorage.email = UIUtil.escapeHtml(newEmail);
    },

    /**
     * Returns email address of the local user.
     * @returns {string} email
     */
    getEmail: function () {
        return email;
    },

    /**
     * Returns avatar id of the local user.
     * @returns {string} avatar id
     */
    getAvatarId: function () {
        return avatarId;
    },

    /**
     * Sets new avatarUrl for local user and saves it to the local storage.
     * @param {string} newAvatarUrl new avatarUrl for the local user
     */
    setAvatarUrl: function (newAvatarUrl) {
        avatarUrl = newAvatarUrl;
    },

    /**
     * Returns avatarUrl address of the local user.
     * @returns {string} avatarUrl
     */
    getAvatarUrl: function () {
        return avatarUrl;
    },

    getLanguage () {
        return language;
    },
    setLanguage: function (lang) {
        language = lang;
        window.localStorage.language = lang;
    },

    /**
     * Sets new flipX state of local video and saves it to the local storage.
     * @param {string} val flipX state of local video
     */
    setLocalFlipX: function (val) {
        localFlipX = val;
        window.localStorage.localFlipX = val;
    },

    /**
     * Returns flipX state of local video.
     * @returns {string} flipX
     */
    getLocalFlipX: function () {
        return localFlipX;
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
     * @param {boolean} whether we need to store the value
     */
    setCameraDeviceId: function (newId, store) {
        cameraDeviceId = newId;
        if (store)
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
     * @param {boolean} whether we need to store the value
     */
    setMicDeviceId: function (newId, store) {
        micDeviceId = newId;
        if (store)
            window.localStorage.micDeviceId = newId;
    },

    /**
     * Get device id of the audio output device which is currently in use.
     * Empty string stands for default device.
     * @returns {String}
     */
    getAudioOutputDeviceId: function () {
        return JitsiMeetJS.mediaDevices.getAudioOutputDevice();
    },
    /**
     * Set device id of the audio output device which is currently in use.
     * Empty string stands for default device.
     * @param {string} newId='default' - new audio output device id
     * @returns {Promise}
     */
    setAudioOutputDeviceId: function (newId = 'default') {
        return JitsiMeetJS.mediaDevices.setAudioOutputDevice(newId)
            .then(() => window.localStorage.audioOutputDeviceId = newId);
    },

    /**
     * Check if welcome page is enabled or not.
     * @returns {boolean}
     */
    isWelcomePageEnabled () {
        return !welcomePageDisabled;
    },

    /**
     * Enable or disable welcome page.
     * @param {boolean} enabled if welcome page should be enabled or not
     */
    setWelcomePageEnabled (enabled) {
        welcomePageDisabled = !enabled;
        window.localStorage.welcomePageDisabled = welcomePageDisabled;
    }
};
