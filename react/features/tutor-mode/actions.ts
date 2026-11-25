import {
    CLEAR_TUTOR_MODE_STATE,
    DISABLE_TUTOR_MODE,
    ENABLE_TUTOR_MODE,
    SET_TUTOR_MODE_ERROR,
    SET_TUTOR_MODE_LISTEN_TARGETS,
    SET_TUTOR_MODE_PENDING
} from './actionTypes';

/**
 * Asks the middleware to turn tutor-centered mode on. The middleware writes the
 * room metadata and the authoritative state arrives back through the normal
 * metadata update path.
 *
 * @returns {{
 *     type: string
 * }}
 */
export function enableTutorMode() {
    return {
        type: ENABLE_TUTOR_MODE
    };
}

/**
 * Asks the middleware to turn tutor-centered mode off.
 *
 * @returns {{
 *     type: string
 * }}
 */
export function disableTutorMode() {
    return {
        type: DISABLE_TUTOR_MODE
    };
}

/**
 * Clears all local tutor-mode state. Used when the conference is left or the
 * server reports that the mode is no longer enforced.
 *
 * @returns {{
 *     type: string
 * }}
 */
export function clearTutorModeState() {
    return {
        type: CLEAR_TUTOR_MODE_STATE
    };
}

/**
 * Records an error to display in the tutor-mode dialog.
 *
 * @param {string|null} error - A translation key, or null to clear it.
 * @returns {{
 *     error: (string | null),
 *     type: string
 * }}
 */
export function setTutorModeError(error: string | null) {
    return {
        type: SET_TUTOR_MODE_ERROR,
        error
    };
}

/**
 * Sets the participants the tutor wants to listen to. Passing null or an empty
 * array means everyone. This only filters local playback; it does not change
 * what the server sends.
 *
 * @param {Array<string>|null} targets - Participant ids, or null for everyone.
 * @returns {{
 *     targets: (Array<string> | null),
 *     type: string
 * }}
 */
export function setTutorModeListenTargets(targets: string[] | null) {
    return {
        type: SET_TUTOR_MODE_LISTEN_TARGETS,
        targets
    };
}

/**
 * Marks a tutor-mode metadata request as pending until the server confirms or
 * rejects it.
 *
 * @param {boolean} pending - Whether a request is in flight.
 * @returns {{
 *     pending: boolean,
 *     type: string
 * }}
 */
export function setTutorModePending(pending: boolean) {
    return {
        type: SET_TUTOR_MODE_PENDING,
        pending
    };
}
