/**
 * The redux action which signals that a configuration (commonly known in Jitsi
 * Meet as config.js) will be loaded for a specific locationURL.
 *
 * {
 *     type: CONFIG_WILL_LOAD,
 *     locationURL: URL
 * }
 */
export const CONFIG_WILL_LOAD = Symbol('CONFIG_WILL_LOAD');

/**
 * The redux action which signals that a configuration (commonly known in Jitsi
 * Meet as config.js) could not be loaded due to a specific error.
 *
 * {
 *     type: LOAD_CONFIG_ERROR,
 *     error: Error,
 *     locationURL: URL
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
