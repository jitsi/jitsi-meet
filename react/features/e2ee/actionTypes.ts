/**
 * The type of the action which signals that E2EE needs to be enabled / disabled.
 *
 * {
 *     type: TOGGLE_E2EE
 * }
 */
export const TOGGLE_E2EE = 'TOGGLE_E2EE';

/**
 * The type of the action which signals to set new value E2EE maxMode.
 *
 * {
 *     type: SET_MAX_MODE
 * }
 */
export const SET_MAX_MODE = 'SET_MAX_MODE';

/**
 * The type of the action which signals to set media encryption key for e2ee.
 *
 * {
 *     type: SET_MEDIA_ENCRYPTION_KEY
 * }
 */
export const SET_MEDIA_ENCRYPTION_KEY = 'SET_MEDIA_ENCRYPTION_KEY';

/**
 * The type of the action which signals to set the E2EE key (passphrase)
 * received from an external source, e.g. the hosting application on mobile.
 *
 * {
 *     type: SET_E2EE_KEY,
 *     key: string
 * }
 */
export const SET_E2EE_KEY = 'SET_E2EE_KEY';

export const START_VERIFICATION = 'START_VERIFICATION';

export const PARTICIPANT_VERIFIED = 'PARTICIPANT_VERIFIED';
