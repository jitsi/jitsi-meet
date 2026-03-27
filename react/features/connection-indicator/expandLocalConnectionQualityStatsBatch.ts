import { union } from 'lodash-es';

/**
 * Expands lib-jitsi-meet LOCAL_STATS_UPDATED batches where framerate, resolution,
 * and codec are maps keyed by participant id. Connection indicators subscribe
 * per participant and expect scalar or per-track values, not full maps
 * (see statsEmitter).
 */
export type ParticipantMediaStatsMap = Record<string, unknown>;

export interface IExpandedLocalConnectionQualityStats {

    /**
     * Full stats object for the local user's subscribers: same shape as
     * {@code stats} but with framerate, resolution, and codec taken from the
     * per-participant maps for {@code localUserId}.
     */
    localStats: Record<string, unknown>;

    /**
     * Partial stat objects to emit for each remote participant appearing in any
     * of the three maps (only keys present for that id are included).
     */
    remoteEmissions: Array<{

        /**
         * Subset of stats (framerate / resolution / codec) for that id.
         */
        partialStats: Record<string, unknown>;

        /**
         * Remote participant id.
         */
        participantId: string;
    }>;
}

/**
 * Coerces a value from lib-jitsi-meet into a participant-id → stat map, or
 * empty object if the value is not a plain object map.
 *
 * @param {unknown} value - Raw field from stats batch.
 * @returns {ParticipantMediaStatsMap}
 */
function asParticipantMap(value: unknown): ParticipantMediaStatsMap {
    if (value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)) {
        return value as ParticipantMediaStatsMap;
    }

    return {};
}

/**
 * Expands one {@code LOCAL_STATS_UPDATED} batch into a local full payload and
 * per-remote partial emissions so {@link statsEmitter} can fan out to
 * per-participant subscriptions.
 *
 * @param {string} localUserId - The local participant id.
 * @param {Record<string, unknown>} stats - Raw stats object from lib-jitsi-meet.
 * @returns {IExpandedLocalConnectionQualityStats}
 */
export function expandLocalConnectionQualityStatsBatch(
        localUserId: string,
        stats: Record<string, unknown>): IExpandedLocalConnectionQualityStats {
    const allUserFramerates = asParticipantMap(stats.framerate);
    const allUserResolutions = asParticipantMap(stats.resolution);
    const allUserCodecs = asParticipantMap(stats.codec);

    const localStats = {
        ...stats,
        framerate: allUserFramerates[localUserId],
        resolution: allUserResolutions[localUserId],
        codec: allUserCodecs[localUserId]
    };

    const framerateUserIds = Object.keys(allUserFramerates);
    const resolutionUserIds = Object.keys(allUserResolutions);
    const codecUserIds = Object.keys(allUserCodecs);

    const remoteEmissions = union(framerateUserIds, resolutionUserIds, codecUserIds)
        .filter(id => id !== localUserId)
        .map(participantId => {
            const partialStats: Record<string, unknown> = {};
            const framerate = allUserFramerates[participantId];

            if (framerate) {
                partialStats.framerate = framerate;
            }

            const resolution = allUserResolutions[participantId];

            if (resolution) {
                partialStats.resolution = resolution;
            }

            const codec = allUserCodecs[participantId];

            if (codec) {
                partialStats.codec = codec;
            }

            return {
                partialStats,
                participantId
            };
        });

    return {
        localStats,
        remoteEmissions
    };
}
