!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var n;"undefined"!=typeof window?n=window:"undefined"!=typeof global?n=global:"undefined"!=typeof self&&(n=self),n.connectionquality=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    xmpp.addToPresence("connectionQuality", convertToMUCStats(stats));
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


var ConnectionQuality = {
    /**
     * Updates the local statistics
     * @param data new statistics
     */
    updateLocalStats: function (data) {
        stats = data;
        UI.updateLocalConnectionStats(100 - stats.packetLoss.total, stats);
        if (sendIntervalId == null) {
            startSendingStats();
        }
    },

    /**
     * Updates remote statistics
     * @param jid the jid associated with the statistics
     * @param data the statistics
     */
    updateRemoteStats: function (jid, data) {
        if (data == null || data.packetLoss_total == null) {
            UI.updateConnectionStats(jid, null, null);
            return;
        }
        remoteStats[jid] = parseMUCStats(data);

        UI.updateConnectionStats(jid, 100 - data.packetLoss_total, remoteStats[jid]);

    },

    /**
     * Stops statistics sending.
     */
    stopSendingStats: function () {
        clearInterval(sendIntervalId);
        sendIntervalId = null;
        //notify UI about stopping statistics gathering
        UI.onStatsStop();
    },

    /**
     * Returns the local statistics.
     */
    getStats: function () {
        return stats;
    }

};

module.exports = ConnectionQuality;
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL2Nvbm5lY3Rpb25xdWFsaXR5L2Nvbm5lY3Rpb25xdWFsaXR5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBsb2NhbCBzdGF0c1xuICogQHR5cGUge3t9fVxuICovXG52YXIgc3RhdHMgPSB7fTtcblxuLyoqXG4gKiByZW1vdGUgc3RhdHNcbiAqIEB0eXBlIHt7fX1cbiAqL1xudmFyIHJlbW90ZVN0YXRzID0ge307XG5cbi8qKlxuICogSW50ZXJ2YWwgZm9yIHNlbmRpbmcgc3RhdGlzdGljcyB0byBvdGhlciBwYXJ0aWNpcGFudHNcbiAqIEB0eXBlIHtudWxsfVxuICovXG52YXIgc2VuZEludGVydmFsSWQgPSBudWxsO1xuXG5cbi8qKlxuICogU3RhcnQgc3RhdGlzdGljcyBzZW5kaW5nLlxuICovXG5mdW5jdGlvbiBzdGFydFNlbmRpbmdTdGF0cygpIHtcbiAgICBzZW5kU3RhdHMoKTtcbiAgICBzZW5kSW50ZXJ2YWxJZCA9IHNldEludGVydmFsKHNlbmRTdGF0cywgMTAwMDApO1xufVxuXG4vKipcbiAqIFNlbmRzIHN0YXRpc3RpY3MgdG8gb3RoZXIgcGFydGljaXBhbnRzXG4gKi9cbmZ1bmN0aW9uIHNlbmRTdGF0cygpIHtcbiAgICB4bXBwLmFkZFRvUHJlc2VuY2UoXCJjb25uZWN0aW9uUXVhbGl0eVwiLCBjb252ZXJ0VG9NVUNTdGF0cyhzdGF0cykpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHN0YXRpc3RpY3MgdG8gZm9ybWF0IGZvciBzZW5kaW5nIHRocm91Z2ggWE1QUFxuICogQHBhcmFtIHN0YXRzIHRoZSBzdGF0aXN0aWNzXG4gKiBAcmV0dXJucyB7e2JpdHJhdGVfZG9ud2xvYWQ6ICosIGJpdHJhdGVfdXBscG9hZDogKiwgcGFja2V0TG9zc190b3RhbDogKiwgcGFja2V0TG9zc19kb3dubG9hZDogKiwgcGFja2V0TG9zc191cGxvYWQ6ICp9fVxuICovXG5mdW5jdGlvbiBjb252ZXJ0VG9NVUNTdGF0cyhzdGF0cykge1xuICAgIHJldHVybiB7XG4gICAgICAgIFwiYml0cmF0ZV9kb3dubG9hZFwiOiBzdGF0cy5iaXRyYXRlLmRvd25sb2FkLFxuICAgICAgICBcImJpdHJhdGVfdXBsb2FkXCI6IHN0YXRzLmJpdHJhdGUudXBsb2FkLFxuICAgICAgICBcInBhY2tldExvc3NfdG90YWxcIjogc3RhdHMucGFja2V0TG9zcy50b3RhbCxcbiAgICAgICAgXCJwYWNrZXRMb3NzX2Rvd25sb2FkXCI6IHN0YXRzLnBhY2tldExvc3MuZG93bmxvYWQsXG4gICAgICAgIFwicGFja2V0TG9zc191cGxvYWRcIjogc3RhdHMucGFja2V0TG9zcy51cGxvYWRcbiAgICB9O1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHN0YXRpdGlzdGljcyB0byBmb3JtYXQgdXNlZCBieSBWaWRlb0xheW91dFxuICogQHBhcmFtIHN0YXRzXG4gKiBAcmV0dXJucyB7e2JpdHJhdGU6IHtkb3dubG9hZDogKiwgdXBsb2FkOiAqfSwgcGFja2V0TG9zczoge3RvdGFsOiAqLCBkb3dubG9hZDogKiwgdXBsb2FkOiAqfX19XG4gKi9cbmZ1bmN0aW9uIHBhcnNlTVVDU3RhdHMoc3RhdHMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBiaXRyYXRlOiB7XG4gICAgICAgICAgICBkb3dubG9hZDogc3RhdHMuYml0cmF0ZV9kb3dubG9hZCxcbiAgICAgICAgICAgIHVwbG9hZDogc3RhdHMuYml0cmF0ZV91cGxvYWRcbiAgICAgICAgfSxcbiAgICAgICAgcGFja2V0TG9zczoge1xuICAgICAgICAgICAgdG90YWw6IHN0YXRzLnBhY2tldExvc3NfdG90YWwsXG4gICAgICAgICAgICBkb3dubG9hZDogc3RhdHMucGFja2V0TG9zc19kb3dubG9hZCxcbiAgICAgICAgICAgIHVwbG9hZDogc3RhdHMucGFja2V0TG9zc191cGxvYWRcbiAgICAgICAgfVxuICAgIH07XG59XG5cblxudmFyIENvbm5lY3Rpb25RdWFsaXR5ID0ge1xuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIGxvY2FsIHN0YXRpc3RpY3NcbiAgICAgKiBAcGFyYW0gZGF0YSBuZXcgc3RhdGlzdGljc1xuICAgICAqL1xuICAgIHVwZGF0ZUxvY2FsU3RhdHM6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIHN0YXRzID0gZGF0YTtcbiAgICAgICAgVUkudXBkYXRlTG9jYWxDb25uZWN0aW9uU3RhdHMoMTAwIC0gc3RhdHMucGFja2V0TG9zcy50b3RhbCwgc3RhdHMpO1xuICAgICAgICBpZiAoc2VuZEludGVydmFsSWQgPT0gbnVsbCkge1xuICAgICAgICAgICAgc3RhcnRTZW5kaW5nU3RhdHMoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHJlbW90ZSBzdGF0aXN0aWNzXG4gICAgICogQHBhcmFtIGppZCB0aGUgamlkIGFzc29jaWF0ZWQgd2l0aCB0aGUgc3RhdGlzdGljc1xuICAgICAqIEBwYXJhbSBkYXRhIHRoZSBzdGF0aXN0aWNzXG4gICAgICovXG4gICAgdXBkYXRlUmVtb3RlU3RhdHM6IGZ1bmN0aW9uIChqaWQsIGRhdGEpIHtcbiAgICAgICAgaWYgKGRhdGEgPT0gbnVsbCB8fCBkYXRhLnBhY2tldExvc3NfdG90YWwgPT0gbnVsbCkge1xuICAgICAgICAgICAgVUkudXBkYXRlQ29ubmVjdGlvblN0YXRzKGppZCwgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmVtb3RlU3RhdHNbamlkXSA9IHBhcnNlTVVDU3RhdHMoZGF0YSk7XG5cbiAgICAgICAgVUkudXBkYXRlQ29ubmVjdGlvblN0YXRzKGppZCwgMTAwIC0gZGF0YS5wYWNrZXRMb3NzX3RvdGFsLCByZW1vdGVTdGF0c1tqaWRdKTtcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdG9wcyBzdGF0aXN0aWNzIHNlbmRpbmcuXG4gICAgICovXG4gICAgc3RvcFNlbmRpbmdTdGF0czogZnVuY3Rpb24gKCkge1xuICAgICAgICBjbGVhckludGVydmFsKHNlbmRJbnRlcnZhbElkKTtcbiAgICAgICAgc2VuZEludGVydmFsSWQgPSBudWxsO1xuICAgICAgICAvL25vdGlmeSBVSSBhYm91dCBzdG9wcGluZyBzdGF0aXN0aWNzIGdhdGhlcmluZ1xuICAgICAgICBVSS5vblN0YXRzU3RvcCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBsb2NhbCBzdGF0aXN0aWNzLlxuICAgICAqL1xuICAgIGdldFN0YXRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzdGF0cztcbiAgICB9XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29ubmVjdGlvblF1YWxpdHk7Il19
