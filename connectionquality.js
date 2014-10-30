var ConnectionQuality = (function () {

    /**
     * Constructs new ConnectionQuality object
     * @constructor
     */
    function ConnectionQuality() {

    }

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
     * Updates the local statistics
     * @param data new statistics
     */
    ConnectionQuality.updateLocalStats = function (data) {
        stats = data;
        VideoLayout.updateLocalConnectionStats(100 - stats.packetLoss.total,stats);
        if(sendIntervalId == null)
        {
            startSendingStats();
        }
    };

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
        connection.emuc.addConnectionInfoToPresence(convertToMUCStats(stats));
        connection.emuc.sendPresence();
    }

    /**
     * Converts statistics to format for sending through XMPP
     * @param stats the statistics
     * @returns {{bitrate_donwload: *, bitrate_uplpoad: *, packetLoss_total: *, packetLoss_download: *, packetLoss_upload: *}}
     */
    function convertToMUCStats(stats) {
        return {
            "bitrate_download": stats.bitrate.download,
            "bitrate_upload": stats.bitrate.upload,
            "packetLoss_total": stats.packetLoss.total,
            "packetLoss_download": stats.packetLoss.download,
            "packetLoss_upload": stats.packetLoss.upload
        };
    }

    /**
     * Converts statitistics to format used by VideoLayout
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

    /**
     * Updates remote statistics
     * @param jid the jid associated with the statistics
     * @param data the statistics
     */
    ConnectionQuality.updateRemoteStats = function (jid, data) {
        if(data == null || data.packetLoss_total == null)
        {
            VideoLayout.updateConnectionStats(jid, null, null);
            return;
        }
        remoteStats[jid] = parseMUCStats(data);

        VideoLayout.updateConnectionStats(jid, 100 - data.packetLoss_total,remoteStats[jid]);

    };

    /**
     * Stops statistics sending.
     */
    ConnectionQuality.stopSendingStats = function () {
        clearInterval(sendIntervalId);
        sendIntervalId = null;
        //notify UI about stopping statistics gathering
        VideoLayout.onStatsStop();
    };

    /**
     * Returns the local statistics.
     */
    ConnectionQuality.getStats = function () {
        return stats;
    }

    return ConnectionQuality;
})();