/* global APP, require */
/* jshint -W101 */
var EventEmitter = require("events");
var eventEmitter = new EventEmitter();
var CQEvents = require("../../service/connectionquality/CQEvents");
var StatisticsEvents = require("../../service/statistics/Events");

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

var ConnectionQuality = {
    init: function () {
        APP.statistics.addListener(
            StatisticsEvents.CONNECTION_STATS, this.updateLocalStats
        );
        APP.statistics.addListener(
            StatisticsEvents.STOP, this.stopSendingStats
        );
    },

    /**
     * Updates the local statistics
     * @param data new statistics
     */
    updateLocalStats: function (data) {
        stats = data;
        eventEmitter.emit(CQEvents.LOCALSTATS_UPDATED, 100 - stats.packetLoss.total, stats);
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

        eventEmitter.emit(
            CQEvents.REMOTESTATS_UPDATED, id, 100 - data.packetLoss_total, remoteStats[id]
        );
    },

    /**
     * Stops statistics sending.
     */
    stopSendingStats: function () {
        //notify UI about stopping statistics gathering
        eventEmitter.emit(CQEvents.STOP);
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

module.exports = ConnectionQuality;
