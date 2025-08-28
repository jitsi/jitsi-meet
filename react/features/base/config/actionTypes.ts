/**
 * The redux action which signals that a configuration (commonly known in Jitsi
 * Meet as config.js) will be loaded for a specific locationURL.
 *
 * {
 *     type: CONFIG_WILL_LOAD,
 *     locationURL: URL,
 *     room: string
 * }
 */
export const CONFIG_WILL_LOAD = 'CONFIG_WILL_LOAD';

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
export const LOAD_CONFIG_ERROR = 'LOAD_CONFIG_ERROR';

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
export const SET_CONFIG = 'SET_CONFIG';

/**
 * The redux action which updates the configuration represented by the feature
 * base/config. The configuration is defined and consumed by the library
 * lib-jitsi-meet but some of its properties are consumed by the application
 * jitsi-meet as well. A merge operation is performed between the existing config
 * and the passed object.
 *
 * {
 *     type: UPDATE_CONFIG,
 *     config: Object
 * }
 */
export const UPDATE_CONFIG = 'UPDATE_CONFIG';

/**
 * The redux action which overwrites configurations represented by the feature
 * base/config. The passed on config values overwrite the current values for given props.
 *
 * {
 *     type: OVERWRITE_CONFIG,
 *     config: Object
 * }
 */
export const OVERWRITE_CONFIG = 'OVERWRITE_CONFIG';
