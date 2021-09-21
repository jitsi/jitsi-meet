/**
 * The type of the action which signals that E2EE needs to be enabled / disabled.
 *
 * {
 *     type: TOGGLE_E2EE
 * }
 */
export const TOGGLE_E2EE = 'TOGGLE_E2EE';

/**
 * The type of the action which signals to set new value whether everyone has E2EE enabled.
 *
 * {
 *     type: SET_EVERYONE_ENABLED_E2EE,
 *     everyoneEnabledE2EE: boolean
 * }
 */
export const SET_EVERYONE_ENABLED_E2EE = 'SET_EVERYONE_ENABLED_E2EE';

/**
 * The type of the action which signals to set new value whether everyone supports E2EE.
 *
 * {
 *     type: SET_EVERYONE_SUPPORT_E2EE
 * }
 */
export const SET_EVERYONE_SUPPORT_E2EE = 'SET_EVERYONE_SUPPORT_E2EE';

/**
 * The type of the action which signals to set new value E2EE maxMode.
 *
 * {
 *     type: SET_MAX_MODE
 * }
 */
export const SET_MAX_MODE = 'SET_MAX_MODE';
