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
    return {
        bitrate: {
            download: stats.bitrate_download,
            upload: stats.bitrate_upload
        },
        packetLoss: {
            total: stats.packetLoss_total,
            download: stats.packetLoss_download,
            upload: stats.packetLoss_upload
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
        if (!data || !data.packetLoss_total) {
            eventEmitter.emit(CQEvents.REMOTESTATS_UPDATED, id, null, null);
            return;
        }
        remoteStats[id] = parseMUCStats(data);

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
     * @returns {{bitrate_donwload: *, bitrate_uplpoad: *, packetLoss_total: *, packetLoss_download: *, packetLoss_upload: *}}
     */
    convertToMUCStats: function (stats) {
        return {
            "bitrate_download": stats.bitrate.download,
            "bitrate_upload": stats.bitrate.upload,
            "packetLoss_total": stats.packetLoss.total,
            "packetLoss_download": stats.packetLoss.download,
            "packetLoss_upload": stats.packetLoss.upload
        };
    }
};

module.exports = ConnectionQuality;