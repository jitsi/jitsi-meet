import { Symbol } from '../react';

/**
 * Action to signal that lib-jitsi-meet library was disposed.
 *
 * {
 *     type: LIB_DISPOSED
 * }
 */
export const LIB_DISPOSED = Symbol('LIB_DISPOSED');

/**
 * Action to signal that lib-jitsi-meet initialized failed with error.
 *
 * {
 *     type: LIB_INIT_ERROR,
 *     error: Error
 * }
 */
export const LIB_INIT_ERROR = Symbol('LIB_INIT_ERROR');

/**
 * Action to signal that lib-jitsi-meet initialization succeeded.
 *
 * {
 *     type: LIB_INITIALIZED
 * }
 */
export const LIB_INITIALIZED = Symbol('LIB_INITIALIZED');

/**
 * Action to signal that config was set.
 *
 * {
 *     type: SET_CONFIG,
 *     config: Object
 * }
 */
export const SET_CONFIG = Symbol('SET_CONFIG');
