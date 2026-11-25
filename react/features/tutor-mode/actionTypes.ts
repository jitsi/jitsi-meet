/**
 * The type of (redux) action which asks the middleware to turn tutor-centered
 * mode on. The authoritative state is read back from room metadata.
 */
export const ENABLE_TUTOR_MODE = 'ENABLE_TUTOR_MODE';

/**
 * The type of (redux) action which asks the middleware to turn tutor-centered
 * mode off.
 */
export const DISABLE_TUTOR_MODE = 'DISABLE_TUTOR_MODE';

/**
 * The type of (redux) action which clears the local tutor-mode state, e.g. when
 * the conference is left.
 */
export const CLEAR_TUTOR_MODE_STATE = 'CLEAR_TUTOR_MODE_STATE';

/**
 * The type of (redux) action which records an error to show in the tutor-mode
 * dialog.
 */
export const SET_TUTOR_MODE_ERROR = 'SET_TUTOR_MODE_ERROR';

/**
 * The type of (redux) action which sets the participants the tutor wants to
 * listen to. An empty array or null means everyone. This is a local playback
 * preference of the tutor and has no security meaning.
 */
export const SET_TUTOR_MODE_LISTEN_TARGETS = 'SET_TUTOR_MODE_LISTEN_TARGETS';

/**
 * The type of (redux) action which marks a tutor-mode metadata request as
 * pending until the server confirms or rejects it.
 */
export const SET_TUTOR_MODE_PENDING = 'SET_TUTOR_MODE_PENDING';
