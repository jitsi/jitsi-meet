/**
 * Action type to signal that connection has disconnected.
 *
 * @type {string}
 */
export const CONNECTION_DISCONNECTED = 'CONNECTION_DISCONNECTED';

/**
 * Action type to signal that have successfully established a connection.
 *
 * @type {string}
 */
export const CONNECTION_ESTABLISHED = 'CONNECTION_ESTABLISHED';

/**
 * Action type to signal a connection failed.
 *
 * @type {string}
 */
export const CONNECTION_FAILED = 'CONNECTION_FAILED';

/**
 * Action to signal to change connection domain.
 *
 * {
 *     type: SET_DOMAIN,
 *     domain: string
 * }
 */
export const SET_DOMAIN = 'SET_DOMAIN';
