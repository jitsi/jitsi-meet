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
 *     type: EVERYONE_ENABLED_E2EE
 * }
 */
export const SET_EVERYONE_ENABLED = 'EVERYONE_ENABLED_E2EE';

/**
 * The type of the action which signals to set new value whether everyone supports E2EE.
 *
 * {
 *     type: EVERYONE_SUPPORTS_E2EE
 * }
 */
export const SET_EVERYONE_SUPPORTS = 'EVERYONE_SUPPORTS_E2EE';
