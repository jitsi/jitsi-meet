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

export default {
    /**
     * Updates the local statistics
     * @param data new statistics
     * @param dontUpdateLocalConnectionQuality {boolean} if true -
     * localConnectionQuality wont be recalculated.
     */
    updateLocalStats: function (data, dontUpdateLocalConnectionQuality) {
        stats = data;
        if(!dontUpdateLocalConnectionQuality) {
            var newVal = 100 - stats.packetLoss.total;
            localConnectionQuality =
                calculateQuality(newVal, localConnectionQuality);
        }
        eventEmitter.emit(CQEvents.LOCALSTATS_UPDATED, localConnectionQuality,
            stats);
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
    updateRemoteStats: function (id, data) {
        if (!data || !("packetLoss" in data) || !("total" in data.packetLoss)) {
            eventEmitter.emit(CQEvents.REMOTESTATS_UPDATED, id, null, null);
            return;
        }
        // Use only the fields we need
        data = {bitrate: data.bitrate, packetLoss: data.packetLoss};

        remoteStats[id] = data;

        var newVal = 100 - data.packetLoss.total;
        var oldVal = remoteConnectionQuality[id];
        remoteConnectionQuality[id] = calculateQuality(newVal, oldVal || 100);

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
    }
};
