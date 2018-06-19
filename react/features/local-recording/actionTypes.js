/**
 * Action to signal that the local client has started to perform recording,
 * (as in: {@code RecordingAdapter} is actively collecting audio data).
 *
 * {
 *     type: LOCAL_RECORDING_ENGAGED
 * }
 */
export const LOCAL_RECORDING_ENGAGED = Symbol('LOCAL_RECORDING_ENGAGED');

/**
 * Action to signal that the local client has stopped recording,
 * (as in: {@code RecordingAdapter} is no longer collecting audio data).
 *
 * {
 *     type: LOCAL_RECORDING_UNENGAGED
 * }
 */
export const LOCAL_RECORDING_UNENGAGED = Symbol('LOCAL_RECORDING_UNENGAGED');

/**
 * Action to show/hide {@code LocalRecordingInfoDialog}.
 *
 * {
 *     type: LOCAL_RECORDING_TOGGLE_DIALOG
 * }
 */
export const LOCAL_RECORDING_TOGGLE_DIALOG
    = Symbol('LOCAL_RECORDING_TOGGLE_DIALOG');

/**
 * Action to update {@code LocalRecordingInfoDialog} with stats
 * from all clients.
 *
 * {
 *     type: LOCAL_RECORDING_STATS_UPDATE
 * }
 */
export const LOCAL_RECORDING_STATS_UPDATE
    = Symbol('LOCAL_RECORDING_STATS_UPDATE');
