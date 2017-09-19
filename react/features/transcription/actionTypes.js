/**
 * The type of Redux action which updates the current known state of the
 * transcription feature.
 *
 * {
 *     type: TRANSCRIPTION_STATE_UPDATED,
 *     recordingState: string
 * }
 * @public
 */
export const TRANSCRIPTION_STATE_UPDATED
    = Symbol('TRANSCRIPTION_STATE_UPDATED');
