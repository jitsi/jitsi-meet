import JitsiMeetJS from '../base/lib-jitsi-meet';

declare var APP: Object;

/**
 * Contains all the callbacks to be notified when stats are updated.
 *
 * {
 *     userId: Function[]
 * }
 */
const subscribers = {};

/**
 * A singleton that acts as a pub/sub service for connection stat updates.
 */
const statsEmitter = {
    /**
     * Have {@code statsEmitter} subscribe to stat updates from a given
     * conference.
     *
     * @param {JitsiConference} conference - The conference for which
     * {@code statsEmitter} should subscribe for stat updates.
     * @returns {void}
     */
    startListeningForStats(conference) {
        const { connectionQuality } = JitsiMeetJS.events;

        conference.on(connectionQuality.LOCAL_STATS_UPDATED,
            stats => this._onStatsUpdated(stats));

        conference.on(connectionQuality.REMOTE_STATS_UPDATED,
            (id, stats) => this._emitStatsUpdate(id, stats));
    },

    /**
     * Add a subscriber to be notified when stats are updated for a specified
     * user id.
     *
     * @param {string} id - The user id whose stats updates are of interest.
     * @param {Function} callback - The function to invoke when stats for the
     * user have been updated.
     * @returns {void}
     */
    subscribeToClientStats(id, callback) {
        if (!id) {
            return;
        }

        if (!subscribers[id]) {
            subscribers[id] = [];
        }

        subscribers[id].push(callback);
    },

    /**
     * Remove a subscriber that is listening for stats updates for a specified
     * user id.
     *
     * @param {string} id - The user id whose stats updates are no longer of
     * interest.
     * @param {Function} callback - The function that is currently subscribed to
     * stat updates for the specified user id.
     * @returns {void}
     */
    unsubscribeToClientStats(id, callback) {
        if (!subscribers[id]) {
            return;
        }

        const filteredSubscribers = subscribers[id].filter(
            subscriber => subscriber !== callback);

        if (filteredSubscribers.length) {
            subscribers[id] = filteredSubscribers;
        } else {
            delete subscribers[id];
        }
    },

    /**
     * Emit a stat update to all those listening for a specific user's
     * connection stats.
     *
     * @param {string} id - The user id the stats are associated with.
     * @param {Object} stats - New connection stats for the user.
     * @returns {void}
     */
    _emitStatsUpdate(id, stats = {}) {
        const callbacks = subscribers[id] || [];

        callbacks.forEach(callback => {
            callback(stats);
        });
    },

    /**
     * Emit a stat update to all those listening for local stat updates. Will
     * also update listeners of remote user stats of changes related to their
     * stats.
     *
     * @param {Object} stats - Connection stats for the local user as provided
     * by the library.
     * @returns {void}
     */
    _onStatsUpdated(stats) {
        const allUserFramerates = stats.framerate;
        const allUserResolutions = stats.resolution;

        const currentUserId = APP.conference.getMyUserId();
        const currentUserFramerate = allUserFramerates[currentUserId];
        const currentUserResolution = allUserResolutions[currentUserId];

        // FIXME resolution and framerate are hashes keyed off of user ids with
        // stat values. Receivers of stats expect resolution and framerate to
        // be primatives, not hashes, so overwrites the 'lib-jitsi-meet' stats
        // objects.
        stats.framerate = currentUserFramerate;
        stats.resolution = currentUserResolution;

        this._emitStatsUpdate(currentUserId, stats);

        Object.keys(allUserFramerates)
            .filter(id => id !== currentUserId)
            .forEach(id => {
                const framerate = allUserFramerates[id];

                if (framerate) {
                    this._emitStatsUpdate(id, { framerate });
                }
            });

        Object.keys(allUserResolutions)
            .filter(id => id !== currentUserId)
            .forEach(id => {
                const resolution = allUserResolutions[id];

                if (resolution) {
                    this._emitStatsUpdate(id, { resolution });
                }
            });

    }
};

export default statsEmitter;
