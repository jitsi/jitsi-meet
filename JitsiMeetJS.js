var JitsiConnection = require("./JitsiConnection");
var JitsiConferenceEvents = require("./JitsiConferenceEvents");
var JitsiConnectionEvents = require("./JitsiConnectionEvents");
var JitsiConnectionErrors = require("./JitsiConnectionErrors");
var JitsiConferenceErrors = require("./JitsiConferenceErrors");
var JitsiTrackEvents = require("./JitsiTrackEvents");
var JitsiTrackErrors = require("./JitsiTrackErrors");
var Logger = require("jitsi-meet-logger");
var RTC = require("./modules/RTC/RTC");
var Statistics = require("./modules/statistics/statistics");
var Resolutions = require("./service/RTC/Resolutions");

function getLowerResolution(resolution) {
    if(!Resolutions[resolution])
        return null;
    var order = Resolutions[resolution].order;
    var res = null;
    var resName = null;
    for(var i in Resolutions) {
        var tmp = Resolutions[i];
        if (!res || (res.order < tmp.order && tmp.order < order)) {
            resName = i;
            res = tmp;
        }
    }
    return resName;
}

/**
 * Namespace for the interface of Jitsi Meet Library.
 */
var LibJitsiMeet = {

    JitsiConnection: JitsiConnection,
    events: {
        conference: JitsiConferenceEvents,
        connection: JitsiConnectionEvents,
        track: JitsiTrackEvents
    },
    errors: {
        conference: JitsiConferenceErrors,
        connection: JitsiConnectionErrors,
        track: JitsiTrackErrors
    },
    logLevels: Logger.levels,
    /**
     * Array of functions that will receive the GUM error.
     */
    _gumFailedHandler: [],
    init: function (options) {
        return RTC.init(options || {});
    },
    /**
     * Returns whether the desktop sharing is enabled or not.
     * @returns {boolean}
     */
    isDesktopSharingEnabled: function () {
        return RTC.isDesktopSharingEnabled();
    },
    setLogLevel: function (level) {
        Logger.setLogLevel(level);
    },
    /**
     * Creates the media tracks and returns them trough the callback.
     * @param options Object with properties / settings specifying the tracks which should be created.
     * should be created or some additional configurations about resolution for example.
     * @param {Array} options.devices the devices that will be requested
     * @param {string} options.resolution resolution constraints
     * @param {bool} options.dontCreateJitsiTrack if <tt>true</tt> objects with the following structure {stream: the Media Stream,
     * type: "audio" or "video", videoType: "camera" or "desktop"}
     * will be returned trough the Promise, otherwise JitsiTrack objects will be returned.
     * @param {string} options.cameraDeviceId
     * @param {string} options.micDeviceId
     * @returns {Promise.<{Array.<JitsiTrack>}, JitsiConferenceError>}
     *     A promise that returns an array of created JitsiTracks if resolved,
     *     or a JitsiConferenceError if rejected.
     */
    createLocalTracks: function (options) {
        return RTC.obtainAudioAndVideoPermissions(options || {}).then(
            function(tracks) {
                if(!RTC.options.disableAudioLevels)
                    for(var i = 0; i < tracks.length; i++) {
                        var track = tracks[i];
                        var mStream = track.getOriginalStream();
                        if(track.getType() === "audio"){
                            Statistics.startLocalStats(mStream,
                                track.setAudioLevel.bind(track));
                            track.addEventListener(
                                JitsiTrackEvents.TRACK_STOPPED,
                                function(){
                                    Statistics.stopLocalStats(mStream);
                                });
                        }
                    }
                return tracks;
            }).catch(function (error) {
                this._gumFailedHandler.forEach(function (handler) {
                    handler(error);
                });
                Statistics.sendGetUserMediaFailed(error);
                if(error === JitsiTrackErrors.UNSUPPORTED_RESOLUTION) {
                    var oldResolution = options.resolution || '360';
                    var newResolution = getLowerResolution(oldResolution);
                    if(newResolution === null)
                        return Promise.reject(error);
                    options.resolution = newResolution;
                    return LibJitsiMeet.createLocalTracks(options);
                }
                return Promise.reject(error);
            }.bind(this));
    },
    /**
     * Checks if its possible to enumerate available cameras/micropones.
     * @returns {boolean} true if available, false otherwise.
     */
    isDeviceListAvailable: function () {
        return RTC.isDeviceListAvailable();
    },
    /**
     * Returns true if changing the camera / microphone device is supported and
     * false if not.
     * @returns {boolean} true if available, false otherwise.
     */
    isDeviceChangeAvailable: function () {
        return RTC.isDeviceChangeAvailable();
    },
    enumerateDevices: function (callback) {
        RTC.enumerateDevices(callback);
    }
};

//Setups the promise object.
window.Promise = window.Promise || require("es6-promise").Promise;

module.exports = LibJitsiMeet;
