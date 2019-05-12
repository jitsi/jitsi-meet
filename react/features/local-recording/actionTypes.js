/**
 * Action to signal that the local client has started to perform recording,
 * (as in: {@code RecordingAdapter} is actively collecting audio data).
 *
 * {
 *     type: LOCAL_RECORDING_ENGAGED,
 *     recordingEngagedAt: Date
 * }
 */
export const LOCAL_RECORDING_ENGAGED = 'LOCAL_RECORDING_ENGAGED';

/**
 * Action to signal that the local client has stopped recording,
 * (as in: {@code RecordingAdapter} is no longer collecting audio data).
 *
 * {
 *     type: LOCAL_RECORDING_UNENGAGED
 * }
 */
export const LOCAL_RECORDING_UNENGAGED = 'LOCAL_RECORDING_UNENGAGED';

/**
 * Action to update {@code LocalRecordingInfoDialog} with stats from all
 * clients.
 *
 * {
 *     type: LOCAL_RECORDING_STATS_UPDATE,
 *     stats: Object
 * }
 */
export const LOCAL_RECORDING_STATS_UPDATE
    = 'LOCAL_RECORDING_STATS_UPDATE';
