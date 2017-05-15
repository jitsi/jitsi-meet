import { Symbol } from '../react';

/**
 * The type of redux action which sets the configuration of the feature
 * base/logging.
 *
 * {
 *     type: SET_LOGGING_CONFIG,
 *     config: Object
 * }
 */
export const SET_LOGGING_CONFIG = Symbol('SET_LOGGING_CONFIG');
