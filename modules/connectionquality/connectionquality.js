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
const _bandwidthMap = [
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
const disableQualityBasedOnBandwidth =
    config.forceQualityBasedOnBandwidth ? false : config.disableSimulcast;

/**
 * Calculates the quality percentage based on the input resolution height and
 * the upload reported by the client. The value is based on the interval from
 * _bandwidthMap.
 * @param inputHeight the resolution used to open the camera.
 * @param upload the upload rate reported by client.
 * @returns {int} the percent of upload based on _bandwidthMap and maximum value
 * of 100, as values of the map are approximate and clients can stream above
 * those values. Returns undefined if no result is found.
 */
function calculateQualityUsingUpload(inputHeight, upload) {
    // found resolution from _bandwidthMap which height is equal or less than
    // the inputHeight
    let foundResolution = _bandwidthMap.find((r) => (r.height <= inputHeight));

    if (!foundResolution)
        return undefined;

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
     * @param videoType the local video type
     * @param isMuted current state of local video, whether it is muted
     * @param resolution the current resolution used by local video
     */
    updateLocalStats:
        function (data, dontUpdateLocalConnectionQuality,
                  videoType, isMuted, resolution) {
            stats = data;
            if(!dontUpdateLocalConnectionQuality) {
                let val = this._getNewQualityValue(
                    stats,
                    localConnectionQuality,
                    videoType,
                    isMuted,
                    resolution);
                if (val !== undefined)
                    localConnectionQuality = val;
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
     * @param data the statistics received
     * @param remoteVideoType the video type of the remote video
     * @param isRemoteVideoMuted whether remote video is muted
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

            let val = this._getNewQualityValue(
                data,
                remoteConnectionQuality[id],
                remoteVideoType,
                isRemoteVideoMuted,
                inputResolution);
            if (val !== undefined)
                remoteConnectionQuality[id] = val;

            eventEmitter.emit(
                CQEvents.REMOTESTATS_UPDATED, id,
                remoteConnectionQuality[id], remoteStats[id]);
    },

    /**
     * Returns the new quality value based on the input parameters.
     * Used to calculate remote and local values.
     * @param data the data
     * @param lastQualityValue the last value we calculated
     * @param videoType need to check whether we are screen sharing
     * @param isMuted is video muted
     * @param resolution the input resolution used by the camera
     * @returns {*} the newly calculated value or undefined if no result
     * @private
     */
    _getNewQualityValue:
        function (data, lastQualityValue, videoType, isMuted, resolution) {
            if (disableQualityBasedOnBandwidth
                || isMuted
                || videoType === 'desktop'
                || !resolution) {
                return calculateQuality(
                    100 - data.packetLoss.total,
                    lastQualityValue || 100);
            } else {
                return calculateQualityUsingUpload(
                    resolution,
                    data.bitrate.upload);
            }
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
