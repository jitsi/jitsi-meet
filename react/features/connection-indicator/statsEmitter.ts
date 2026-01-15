import { union } from 'lodash-es';

import { IJitsiConference } from '../base/conference/reducer';
import {
    JitsiConnectionQualityEvents
} from '../base/lib-jitsi-meet';
import { trackCodecChanged } from '../base/tracks/actions.any';
import { getLocalTracks } from '../base/tracks/functions.any';

/**
 * Contains all the callbacks to be notified when stats are updated.
 *
 * ```
 * {
 *     userId: Function[]
 * }
 * ```
 */
const subscribers: any = {};

interface IStats {
    codec?: Object;
    framerate?: Object;
    resolution?: Object;
}

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
    startListeningForStats(conference: IJitsiConference) {
        conference.on(JitsiConnectionQualityEvents.LOCAL_STATS_UPDATED,
            (stats: IStats) => this._onStatsUpdated(conference.myUserId(), stats));

        conference.on(JitsiConnectionQualityEvents.REMOTE_STATS_UPDATED,
            (id: string, stats: IStats) => this._emitStatsUpdate(id, stats));
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
    subscribeToClientStats(id: string | undefined, callback: Function) {
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
    unsubscribeToClientStats(id: string, callback: Function) {
        if (!subscribers[id]) {
            return;
        }

        const filteredSubscribers = subscribers[id].filter(
            (subscriber: Function) => subscriber !== callback);

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
    _emitStatsUpdate(id: string, stats: IStats = {}) {
        const callbacks = subscribers[id] || [];

        callbacks.forEach((callback: Function) => {
            callback(stats);
        });
    },

    /**
     * Emit a stat update to all those listening for local stat updates. Will
     * also update listeners of remote user stats of changes related to their
     * stats.
     *
     * @param {string} localUserId - The user id for the local user.
     * @param {Object} stats - Connection stats for the local user as provided
     * by the library.
     * @returns {void}
     */
    _onStatsUpdated(localUserId: string, stats: IStats) {
        const allUserFramerates = stats.framerate || {};
        const allUserResolutions = stats.resolution || {};
        const allUserCodecs = stats.codec || {};

        // FIXME resolution and framerate are maps keyed off of user ids with
        // stat values. Receivers of stats expect resolution and framerate to
        // be primitives, not maps, so here we override the 'lib-jitsi-meet'
        // stats objects.
        const modifiedLocalStats = Object.assign({}, stats, {
            framerate: allUserFramerates[localUserId as keyof typeof allUserFramerates],
            resolution: allUserResolutions[localUserId as keyof typeof allUserResolutions],
            codec: allUserCodecs[localUserId as keyof typeof allUserCodecs]
        });

        modifiedLocalStats.codec
            && Object.keys(modifiedLocalStats.codec).length
            && this._updateLocalCodecs(modifiedLocalStats.codec);

        this._emitStatsUpdate(localUserId, modifiedLocalStats);

        // Get all the unique user ids from the framerate and resolution stats
        // and update remote user stats as needed.
        const framerateUserIds = Object.keys(allUserFramerates);
        const resolutionUserIds = Object.keys(allUserResolutions);
        const codecUserIds = Object.keys(allUserCodecs);

        union(framerateUserIds, resolutionUserIds, codecUserIds)
            .filter(id => id !== localUserId)
            .forEach(id => {
                const remoteUserStats: IStats = {};

                const framerate = allUserFramerates[id as keyof typeof allUserFramerates];

                if (framerate) {
                    remoteUserStats.framerate = framerate;
                }

                const resolution = allUserResolutions[id as keyof typeof allUserResolutions];

                if (resolution) {
                    remoteUserStats.resolution = resolution;
                }

                const codec = allUserCodecs[id as keyof typeof allUserCodecs];

                if (codec) {
                    remoteUserStats.codec = codec;
                }

                this._emitStatsUpdate(id, remoteUserStats);
            });
    },

    /**
     * Updates the codec associated with the local tracks.
     * This is currently used for torture tests.
     *
     * @param {any} codecs - Codec information per local SSRC.
     * @returns {void}
     */
    _updateLocalCodecs(codecs: any) {
        if (typeof APP !== 'undefined') {
            const tracks = APP.store.getState()['features/base/tracks'];
            const localTracks = getLocalTracks(tracks);

            for (const track of localTracks) {
                const ssrc = track.jitsiTrack?.getSsrc();

                if (ssrc && Object.keys(codecs).find(key => Number(key) === ssrc)) {
                    const codecsPerSsrc = codecs[ssrc];
                    const codec = codecsPerSsrc.audio ?? codecsPerSsrc.video;

                    if (track.codec !== codec) {
                        APP.store.dispatch(trackCodecChanged(track.jitsiTrack, codec));
                    }
                }
            }
        }
    }
};

export default statsEmitter;
