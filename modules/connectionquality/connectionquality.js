/* global config */
import EventEmitter from "events";

import CQEvents from "../../service/connectionquality/CQEvents";

const eventEmitter = new EventEmitter();

/**
 * local stats
 * @type {{}}
 */
var stats = {};

/**
 * remote stats
 * @type {{}}
 */
var remoteStats = {};

/**
 * Quality percent( 100% - good, 0% - bad.) for the local user.
 */
var localConnectionQuality = 100;

/**
 * Quality percent( 100% - good, 0% - bad.) stored per id.
 */
var remoteConnectionQuality = {};

/**
 * Calculates the quality percent based on passed new and old value.
 * @param newVal the new value
 * @param oldVal the old value
 */
function calculateQuality(newVal, oldVal) {
    return (newVal <= oldVal) ? newVal : (9*oldVal + newVal) / 10;
}

// webrtc table describing simulcast resolutions and used bandwidth
// https://chromium.googlesource.com/external/webrtc/+/master/webrtc/media/engine/simulcast.cc#42
var _bandwidthMap = [
    { width: 1920, height: 1080, layers:3, max: 5000, min: 800 },
    { width: 1280, height: 720,  layers:3, max: 2500, min: 600 },
    { width: 960,  height: 540,  layers:3, max: 900,  min: 450 },
    { width: 640,  height: 360,  layers:2, max: 700,  min: 150 },
    { width: 480,  height: 270,  layers:2, max: 450,  min: 150 },
    { width: 320,  height: 180,  layers:1, max: 200,  min: 30 }
];

/**
 * We disable quality calculations based on bandwidth if simulcast is disabled,
 * or enable it in case of no simulcast and we force it.
 * @type {boolean}
 */
var disableQualityBasedOnBandwidth =
    config.forceQualityBasedOnBandwidth ? false : config.disableSimulcast;

/**
 * Calculates the quality percentage based on the input resolution height and
 * the upload reported by the client. The value is based on the interval from
 * _bandwidthMap.
 * @param inputHeight the resolution used to open the camera.
 * @param upload the upload rate reported by client.
 * @returns {*} the percent of upload based on _bandwidthMap and maximum value
 * of 100, as values of the map are approximate and clients can stream above
 * those values.
 */
function calculateQualityUsingUpload(inputHeight, upload) {
    let foundResolution = null;

    for (let i in _bandwidthMap) {
        let r = _bandwidthMap[i];
        if (r.height <= inputHeight) {
            foundResolution = r;
            break;
        }
    }

    if (!foundResolution)
        return false;

    if (upload <= foundResolution.min)
        return 0;

    return Math.min(
        ((upload - foundResolution.min)*100)
            / (foundResolution.max - foundResolution.min),
        100);
}

export default {
    /**
     * Updates the local statistics
     * @param data new statistics
     * @param dontUpdateLocalConnectionQuality {boolean} if true -
     * localConnectionQuality wont be recalculated.
     */
    updateLocalStats:
        function (data, dontUpdateLocalConnectionQuality, localVideo) {
            stats = data;
            if(!dontUpdateLocalConnectionQuality) {
                if (!disableQualityBasedOnBandwidth
                    && !localVideo.isMuted()
                    && localVideo.videoType !== 'desktop'
                    && localVideo.resolution) {
                        let val = calculateQualityUsingUpload(
                            localVideo.resolution,
                            data.bitrate.upload);
                        if (val) {
                            localConnectionQuality = val;
                        }
                    } else {
                        var newVal = 100 - stats.packetLoss.total;
                        localConnectionQuality =
                            calculateQuality(newVal, localConnectionQuality);
                    }
            }
            eventEmitter.emit(
                CQEvents.LOCALSTATS_UPDATED, localConnectionQuality, stats);
    },

    /**
     * Updates only the localConnectionQuality value
     * @param values {int} the new value. should be from 0 - 100.
     */
    updateLocalConnectionQuality: function (value) {
        localConnectionQuality = value;
        eventEmitter.emit(CQEvents.LOCALSTATS_UPDATED, localConnectionQuality,
            stats);
    },

    /**
     * Updates remote statistics
     * @param id the id associated with the statistics
     * @param data the statistics
     */
    updateRemoteStats:
        function (id, data, remoteVideoType, isRemoteVideoMuted) {
            if (!data ||
                !("packetLoss" in data) ||
                !("total" in data.packetLoss)) {
                eventEmitter.emit(CQEvents.REMOTESTATS_UPDATED, id, null, null);
                return;
            }

            let inputResolution = data.resolution;
            // Use only the fields we need
            data = {bitrate: data.bitrate, packetLoss: data.packetLoss};

            remoteStats[id] = data;

            if (disableQualityBasedOnBandwidth
                || isRemoteVideoMuted
                || remoteVideoType === 'desktop'
                || !inputResolution) {
                var newVal = 100 - data.packetLoss.total;
                var oldVal = remoteConnectionQuality[id];
                remoteConnectionQuality[id]
                    = calculateQuality(newVal, oldVal || 100);
            } else {
                let val = calculateQualityUsingUpload(
                    inputResolution.inputHeight,
                    data.bitrate.upload);
                if (val) {
                    remoteConnectionQuality[id] = val;
                }
            }

            eventEmitter.emit(
                CQEvents.REMOTESTATS_UPDATED, id,
                remoteConnectionQuality[id], remoteStats[id]);
    },

    /**
     * Returns the local statistics.
     */
    getStats: function () {
        return stats;
    },

    addListener: function (type, listener) {
        eventEmitter.on(type, listener);
    }
};
