/**
 * The type of Redux action which signals that {@link JitsiMeetJS} was disposed.
 *
 * {
 *     type: LIB_DID_DISPOSE
 * }
 */
export const LIB_DID_DISPOSE = 'LIB_DID_DISPOSE';

/**
 * The type of Redux action which signals that {@link JitsiMeetJS.init()} was
 * invoked and completed successfully.
 *
 * {
 *     type: LIB_DID_INIT
 * }
 */
export const LIB_DID_INIT = 'LIB_DID_INIT';

/**
 * Action to signal that lib-jitsi-meet initialized failed with error.
 *
 * {
 *     type: LIB_INIT_ERROR,
 *     error: Error
 * }
 */
export const LIB_INIT_ERROR = 'LIB_INIT_ERROR';

/**
 * The type of Redux action which signals that {@link JitsiMeetJS} will be
 * disposed.
 *
 * {
 *     type: LIB_WILL_DISPOSE
 * }
 */
export const LIB_WILL_DISPOSE = 'LIB_WILL_DISPOSE';

/**
 * The type of Redux action which signals that {@link JitsiMeetJS.init()} will
 * be invoked.
 *
 * {
 *     type: LIB_WILL_INIT
 * }
 */
export const LIB_WILL_INIT = 'LIB_WILL_INIT';
