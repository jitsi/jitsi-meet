import { Symbol } from '../react';

/**
 * The type of (redux) actions which signals that new instance of log collector
 * should be stored into redux store.
 *
 * {
 *     type: SET_LOG_COLLECTOR,
 *     logCollector: Object
 * }
 */
export const SET_LOG_COLLECTOR = Symbol('SET_LOG_COLLECTOR');

/**
 * The type of (redux) actions which signals that log collector should be
 * started.
 *
 * {
 *     type: START_LOG_COLLECTOR,
 *     isStarted: boolean
 * }
 */
export const SET_LOG_COLLECTOR_STARTED = Symbol('START_LOG_COLLECTOR_STARTED');

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
