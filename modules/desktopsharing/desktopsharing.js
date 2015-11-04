/* global APP, config */
var EventEmitter = require("events");
var DesktopSharingEventTypes
    = require("../../service/desktopsharing/DesktopSharingEventTypes");
var RTCBrowserType = require("../RTC/RTCBrowserType");
var RTCEvents = require("../../service/RTC/RTCEvents");
var ScreenObtainer = require("./ScreenObtainer");

/**
 * Indicates that desktop stream is currently in use (for toggle purpose).
 * @type {boolean}
 */
var isUsingScreenStream = false;

/**
 * Indicates that switch stream operation is in progress and prevent from
 * triggering new events.
 * @type {boolean}
 */
var switchInProgress = false;

/**
 * Used to obtain the screen sharing stream from the browser.
 */
var screenObtainer = new ScreenObtainer();

var eventEmitter = new EventEmitter();

function streamSwitchDone() {
    switchInProgress = false;
    eventEmitter.emit(
        DesktopSharingEventTypes.SWITCHING_DONE,
        isUsingScreenStream);
}

function newStreamCreated(stream) {
    eventEmitter.emit(DesktopSharingEventTypes.NEW_STREAM_CREATED,
        stream, isUsingScreenStream, streamSwitchDone);
}

function getVideoStreamFailed(error) {
    console.error("Failed to obtain the stream to switch to", error);
    switchInProgress = false;
    isUsingScreenStream = false;
    newStreamCreated(null);
}

function getDesktopStreamFailed(error) {
    console.error("Failed to obtain the stream to switch to", error);
    switchInProgress = false;
}

function onEndedHandler(stream) {
    if (!switchInProgress && isUsingScreenStream) {
        APP.desktopsharing.toggleScreenSharing();
    }

    APP.RTC.removeMediaStreamInactiveHandler(stream, onEndedHandler);
}

module.exports = {
    isUsingScreenStream: function () {
        return isUsingScreenStream;
    },

    /**
     * @returns {boolean} <tt>true</tt> if desktop sharing feature is available
     *          and enabled.
     */
    isDesktopSharingEnabled: function () {
        return screenObtainer.isSupported();
    },
    
    init: function () {
        // Called when RTC finishes initialization
        APP.RTC.addListener(RTCEvents.RTC_READY,
            function() {
                screenObtainer.init(eventEmitter);
                eventEmitter.emit(DesktopSharingEventTypes.INIT);
            });
    },

    addListener: function (type, listener) {
        eventEmitter.on(type, listener);
    },

    removeListener: function (type, listener) {
        eventEmitter.removeListener(type, listener);
    },

    /*
     * Toggles screen sharing.
     */
    toggleScreenSharing: function () {
        if (switchInProgress) {
            console.warn("Switch in progress.");
            return;
        } else if (!screenObtainer.isSupported()) {
            console.warn("Cannot toggle screen sharing: not supported.");
            return;
        }
        switchInProgress = true;

        if (!isUsingScreenStream) {
            // Switch to desktop stream
            screenObtainer.obtainStream(
                function (stream) {
                    // We now use screen stream
                    isUsingScreenStream = true;
                    // Hook 'ended' event to restore camera
                    // when screen stream stops
                    APP.RTC.addMediaStreamInactiveHandler(
                        stream, onEndedHandler);
                    newStreamCreated(stream);
                },
                getDesktopStreamFailed);
        } else {
            // Disable screen stream
            APP.RTC.getUserMediaWithConstraints(
                ['video'],
                function (stream) {
                    // We are now using camera stream
                    isUsingScreenStream = false;
                    newStreamCreated(stream);
                },
                getVideoStreamFailed,
                config.resolution || '360'
            );
        }
    },
    /*
     * Exports the event emitter to allow use by ScreenObtainer. Not for outside
     * use.
     */
    eventEmitter: eventEmitter
};

