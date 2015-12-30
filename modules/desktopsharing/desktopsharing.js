/* global APP, JitsiMeetJS, config */
var EventEmitter = require("events");
var DesktopSharingEventTypes
    = require("../../service/desktopsharing/DesktopSharingEventTypes");

const TrackEvents = JitsiMeetJS.events.track;

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
 * true if desktop sharing is enabled and false otherwise.
 */
var isEnabled = false;

var eventEmitter = new EventEmitter();

function streamSwitchDone() {
    switchInProgress = false;
    eventEmitter.emit(
        DesktopSharingEventTypes.SWITCHING_DONE,
        isUsingScreenStream);
}

function newStreamCreated(track) {
    eventEmitter.emit(DesktopSharingEventTypes.NEW_STREAM_CREATED,
        track, streamSwitchDone);
}

function getVideoStreamFailed() {
    console.error("Failed to obtain the stream to switch to");
    switchInProgress = false;
    isUsingScreenStream = false;
    newStreamCreated(null);
}

function getDesktopStreamFailed() {
    console.error("Failed to obtain the stream to switch to");
    switchInProgress = false;
}

function onEndedHandler() {
    if (!switchInProgress && isUsingScreenStream) {
        APP.desktopsharing.toggleScreenSharing();
    }
}

module.exports = {
    isUsingScreenStream: function () {
        return isUsingScreenStream;
    },
    /**
     * Initializes the desktop sharing module.
     * @param {boolean} <tt>true</tt> if desktop sharing feature is available
     * and enabled.
     */
    init: function (enabled) {
        isEnabled = enabled;
    },
    /**
     * @returns {boolean} <tt>true</tt> if desktop sharing feature is available
     *          and enabled.
     */
    isDesktopSharingEnabled: function () {
        return isEnabled;
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
        } else if (!this.isDesktopSharingEnabled()) {
            console.warn("Cannot toggle screen sharing: not supported.");
            return;
        }
        switchInProgress = true;
        let type;
        if (!isUsingScreenStream) {
            // Switch to desktop stream
            type = "desktop";
        } else {
            type = "video";
        }
        APP.createLocalTracks(type).then(function (tracks) {
            if (!tracks.length) {
                if (type === 'desktop') {
                    getDesktopStreamFailed();
                } else {
                    getVideoStreamFailed();
                }

                return;
            }

            let stream = tracks[0];

            // We now use screen stream
            isUsingScreenStream = type === "desktop";
            if (isUsingScreenStream) {
                stream.on(TrackEvents.TRACK_STOPPED, onEndedHandler);
            }

            newStreamCreated(stream);
        });
    },
    /*
     * Exports the event emitter to allow use by ScreenObtainer. Not for outside
     * use.
     */
    eventEmitter: eventEmitter
};
