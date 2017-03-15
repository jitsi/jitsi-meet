import { Symbol } from '../react';

/**
 * Action type to signal that connection has disconnected.
 */
export const CONNECTION_DISCONNECTED = Symbol('CONNECTION_DISCONNECTED');

/**
 * Action type to signal that have successfully established a connection.
 */
export const CONNECTION_ESTABLISHED = Symbol('CONNECTION_ESTABLISHED');

/**
 * Action type to signal a connection failed.
 */
export const CONNECTION_FAILED = Symbol('CONNECTION_FAILED');

/**
 * Action type to signal a connection will connect.
 */
export const CONNECTION_WILL_CONNECT = Symbol('CONNECTION_WILL_CONNECT');

/**
 * Action to signal to change connection domain.
 *
 * {
 *     type: SET_DOMAIN,
 *     domain: string
 * }
 */
export const SET_DOMAIN = Symbol('SET_DOMAIN');
