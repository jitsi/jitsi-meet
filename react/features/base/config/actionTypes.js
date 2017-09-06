/**
 * The redux action which signals that a configuration could not be loaded due
 * to a specific error.
 *
 * {
 *     type: LOAD_CONFIG_ERROR,
 *     error: Error,
 *     locationURL: string | URL
 * }
 */
export const LOAD_CONFIG_ERROR = Symbol('LOAD_CONFIG_ERROR');

/**
 * The redux action which sets the configuration represented by the feature
 * base/config. The configuration is defined and consumed by the library
 * lib-jitsi-meet but some of its properties are consumed by the application
 * jitsi-meet as well.
 *
 * {
 *     type: SET_CONFIG,
 *     config: Object
 * }
 */
export const SET_CONFIG = Symbol('SET_CONFIG');
