/**
 * The type of Redux action which signals for the label indicating current
 * recording state to stop displaying.
 *
 * {
 *     type: HIDE_RECORDING_LABEL
 * }
 * @public
 */
export const HIDE_RECORDING_LABEL = Symbol('HIDE_RECORDING_LABEL');

/**
 * The type of Redux action which updates the current known state of the
 * recording feature.
 *
 * {
 *     type: RECORDING_STATE_UPDATED,
 *     recordingState: string
 * }
 * @public
 */
export const RECORDING_STATE_UPDATED = Symbol('RECORDING_STATE_UPDATED');
