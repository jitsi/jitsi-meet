/* global APP, require */
var EventEmitter = require("events");
var eventEmitter = new EventEmitter();
var CQEvents = require("../../service/connectionquality/CQEvents");
var XMPPEvents = require("../../service/xmpp/XMPPEvents");
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
 * Interval for sending statistics to other participants
 * @type {null}
 */
var sendIntervalId = null;


/**
 * Start statistics sending.
 */
function startSendingStats() {
    sendStats();
    sendIntervalId = setInterval(sendStats, 10000);
}

/**
 * Sends statistics to other participants
 */
function sendStats() {
    APP.xmpp.addToPresence("stats", convertToMUCStats(stats));
}

/**
 * Converts statistics to format for sending through XMPP
 * @param stats the statistics
 * @returns {{bitrate_donwload: *, bitrate_uplpoad: *, packetLoss_total: *, packetLoss_download: *, packetLoss_upload: *}}
 */
function convertToMUCStats(stats) {
    return {
        tagName: "stats",
        attributes: {
            xmlns: 'http://jitsi.org/jitmeet/stats'
        },
        children: [
            {
                tagName: "stat",
                attributes: {name: "bitrate_download", value: stats.bitrate.download}
            },
            {
                tagName: "stat",
                attributes: {name: "bitrate_upload", value: stats.bitrate.upload}
            },
            {
                tagName: "stat",
                attributes: {name: "packetLoss_total", value: stats.packetLoss.total}
            },
            {
                tagName: "stat",
                attributes: {name: "packetLoss_download", value: stats.packetLoss.download}
            },
            {
                tagName: "stat",
                attributes: {name: "packetLoss_upload", value: stats.packetLoss.upload}
            }
        ]
    };
}

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
        APP.xmpp.addListener(XMPPEvents.REMOTE_STATS, this.updateRemoteStats);
        APP.statistics.addListener(StatisticsEvents.CONNECTION_STATS,
                                   this.updateLocalStats);
        APP.statistics.addListener(StatisticsEvents.STOP,
                                   this.stopSendingStats);
    },

    /**
     * Updates the local statistics
     * @param data new statistics
     */
    updateLocalStats: function (data) {
        stats = data;
        eventEmitter.emit(CQEvents.LOCALSTATS_UPDATED, 100 - stats.packetLoss.total, stats);
        if (!sendIntervalId) {
            startSendingStats();
        }
    },

    /**
     * Updates remote statistics
     * @param jid the jid associated with the statistics
     * @param data the statistics
     */
    updateRemoteStats: function (jid, data) {
        if (!data || !data.packetLoss_total) {
            eventEmitter.emit(CQEvents.REMOTESTATS_UPDATED, jid, null, null);
            return;
        }
        remoteStats[jid] = parseMUCStats(data);

        eventEmitter.emit(CQEvents.REMOTESTATS_UPDATED,
            jid, 100 - data.packetLoss_total, remoteStats[jid]);
    },

    /**
     * Stops statistics sending.
     */
    stopSendingStats: function () {
        clearInterval(sendIntervalId);
        sendIntervalId = null;
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
    }

};

module.exports = ConnectionQuality;