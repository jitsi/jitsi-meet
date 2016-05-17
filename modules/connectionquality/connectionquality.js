/* global APP, require */
/* jshint -W101 */
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
 * Converts statistics to format used by VideoLayout
 * @param stats
 * @returns {{bitrate: {download: *, upload: *}, packetLoss: {total: *, download: *, upload: *}}}
 */
function parseMUCStats(stats) {
    if(!stats || !stats.children || !stats.children.length)
        return null;
    var children = stats.children;
    var extractedStats = {};
    children.forEach((child) => {
        if(child.tagName !== "stat" || !child.attributes)
            return;
        var attrKeys = Object.keys(child.attributes);
        if(!attrKeys || !attrKeys.length)
            return;
        attrKeys.forEach((attr) => {
            extractedStats[attr] = child.attributes[attr];
        });
    });
    return {
        bitrate: {
            download: extractedStats.bitrate_download,
            upload: extractedStats.bitrate_upload
        },
        packetLoss: {
            total: extractedStats.packetLoss_total,
            download: extractedStats.packetLoss_download,
            upload: extractedStats.packetLoss_upload
        }
    };
}

/**
 * Calculates the quality percent based on passed new and old value.
 * @param newVal the new value
 * @param oldVal the old value
 */
function calculateQuality(newVal, oldVal) {
    return (newVal <= oldVal) ? newVal : (9*oldVal + newVal) / 10;
}

export default {
    /**
     * Updates the local statistics
     * @param data new statistics
     */
    updateLocalStats: function (data) {
        stats = data;
        var newVal = 100 - stats.packetLoss.total;
        localConnectionQuality =
            calculateQuality(newVal, localConnectionQuality);
        eventEmitter.emit(CQEvents.LOCALSTATS_UPDATED, localConnectionQuality,
            stats);
    },

    /**
     * Updates remote statistics
     * @param id the id associated with the statistics
     * @param data the statistics
     */
    updateRemoteStats: function (id, data) {
        data = parseMUCStats(data);
        if (!data || !data.packetLoss || !data.packetLoss.total) {
            eventEmitter.emit(CQEvents.REMOTESTATS_UPDATED, id, null, null);
            return;
        }
        remoteStats[id] = data;

        var newVal = 100 - data.packetLoss.total;
        var oldVal = remoteConnectionQuality[id];
        remoteConnectionQuality[id] = calculateQuality(newVal, oldVal);

        eventEmitter.emit(
            CQEvents.REMOTESTATS_UPDATED, id, remoteConnectionQuality[id],
            remoteStats[id]);
    },

    /**
     * Returns the local statistics.
     */
    getStats: function () {
        return stats;
    },

    addListener: function (type, listener) {
        eventEmitter.on(type, listener);
    },

    /**
     * Converts statistics to format for sending through XMPP
     * @param stats the statistics
     * @returns [{tagName: "stat", attributes: {{bitrate_donwload: *}},
     * {tagName: "stat", attributes: {{ bitrate_uplpoad: *}},
     * {tagName: "stat", attributes: {{ packetLoss_total: *}},
     * {tagName: "stat", attributes: {{ packetLoss_download: *}},
     * {tagName: "stat", attributes: {{ packetLoss_upload: *}}]
     */
    convertToMUCStats: function (stats) {
        return [
            {tagName: "stat", attributes: {"bitrate_download": stats.bitrate.download}},
            {tagName: "stat", attributes: {"bitrate_upload": stats.bitrate.upload}},
            {tagName: "stat", attributes: {"packetLoss_total": stats.packetLoss.total}},
            {tagName: "stat", attributes: {"packetLoss_download": stats.packetLoss.download}},
            {tagName: "stat", attributes: {"packetLoss_upload": stats.packetLoss.upload}}
        ];
    }
};
