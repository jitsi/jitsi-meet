/* @flow */

import Logger from 'jitsi-meet-logger';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../app';
import { CONFERENCE_JOINED } from '../conference';
import JitsiMeetJS, { LIB_WILL_INIT } from '../lib-jitsi-meet';
import { MiddlewareRegistry } from '../redux';

import {
    setLogCollector,
    startLogCollector,
    stopLogCollector
} from './actions';
import { SET_LOGGING_CONFIG } from './actionTypes';
import JitsiMeetLogStorage from './JitsiMeetLogStorage';

declare var APP: Object;

/**
 * The Redux middleware of the feature base/logging.
 *
 * @param {Store} store - The Redux store.
 * @returns {Function}
 * @private
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        return _appWillMount(store, next, action);

    case APP_WILL_UNMOUNT:
        return _appWillUnmount(store, next, action);

    case CONFERENCE_JOINED:
        return _conferenceJoined(store, next, action);

    case LIB_WILL_INIT:
        return _libWillInit(store, next, action);

    case SET_LOGGING_CONFIG:
        return _setLoggingConfig(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature base/logging that the action {@link APP_WILL_MOUNT} is
 * being dispatched within a specific Redux {@code store}.
 *
 * @param {Store} store - The Redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The Redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The Redux action {@code APP_WILL_MOUNT} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _appWillMount({ getState, dispatch }, next, action) {
    const state = getState();
    const { config } = state['features/base/logging'];

    _setLogCollector(state, dispatch);
    _setLogLevels(Logger, config);

    // FIXME Until the logic of conference.js is rewritten into the React
    // app we, JitsiMeetJS.init is to not be used for the React app.
    // Consequently, LIB_WILL_INIT will not be dispatched. In the meantime, do
    // the following:
    typeof APP === 'undefined' || _setLogLevels(JitsiMeetJS, config);

    return next(action);
}

/**
 * Notifies the feature base/logger that the action APP_WILL_UNMOUNT
 * is being dispatched within a specific Redux store.
 *
 * @param {Store} store - The Redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The Redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The Redux action {@code CONFERENCE_JOINED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _conferenceJoined(store, next, action) {
    store.dispatch(startLogCollector());

    return next(action);
}

/**
 * Notifies the feature base/logging that the action {@link LIB_WILL_INIT} is
 * being dispatched within a specific Redux {@code store}.
 *
 * @param {Store} store - The Redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The Redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The Redux action {@code LIB_WILL_INIT} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _libWillInit({ getState }, next, action) {
    const { config, logCollector } = getState()['features/base/logging'];

    _setLogLevels(JitsiMeetJS, config);
    JitsiMeetJS.addGlobalLogTransport(logCollector);

    return next(action);
}

/**
 * Sets logging collector.
 *
 * @param {Function} state - Snapshot of the Redux store.
 * @param {Function} dispatch - Redux action dispatcher.
 * @private
 * @returns {void}
 */
function _setLogCollector(state, dispatch) {
    let conference = state['features/base/conference'];
    const isAPPExist = typeof APP !== 'undefined';

    // Let's use conference object from APP global if it's defined.
    if (isAPPExist) {
        conference = APP.conference;
    }
    const {
        logCollector,
        logCollectorStarted,
        config
    } = state['features/base/logging'];

    // Create the LogCollector and register it as the global log transport. It
    // is done early to capture as much logs as possible. Captured logs will be
    // cached, before the JitsiMeetLogStorage gets ready (statistics module is
    // initialized).
    if (!logCollector && !config.disableLogCollector) {
        const logStorage
            = new JitsiMeetLogStorage(logCollectorStarted, conference);
        const newLogCollector = new Logger.LogCollector(logStorage);

        dispatch(setLogCollector(newLogCollector));
        Logger.addGlobalTransport(newLogCollector);

        // FIXME Until the logic of conference.js is rewritten into the React
        // app we, JitsiMeetJS.init is to not be used for the React app.
        // Consequently, LIB_WILL_INIT will not be dispatched. In the meantime,
        // do the following:
        if (isAPPExist) {
            JitsiMeetJS.addGlobalLogTransport(newLogCollector);
        }
    }
}

/**
 * Notifies the feature base/logging that the action {@link SET_LOGGING_CONFIG}
 * is being dispatched within a specific Redux {@code store}.
 *
 * @param {Store} store - The Redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The Redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The Redux action {@code SET_LOGGING_CONFIG} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _setLoggingConfig({ getState }, next, action) {
    const oldValue = getState()['features/base/logging'].config;
    const result = next(action);
    const newValue = getState()['features/base/logging'].config;

    if (oldValue !== newValue) {
        _setLogLevels(Logger, newValue);
        _setLogLevels(JitsiMeetJS, newValue);
    }

    return result;
}

/**
 * Sets the log levels of {@link Logger} or {@link JitsiMeetJS} in accord with
 * a specific configuration.
 *
 * @param {Object} logger - The object on which the log levels are to be set.
 * @param {Object} config - The configuration specifying the log levels to be
 * set on {@code Logger} or {@code JitsiMeetJS}.
 * @private
 * @returns {void}
 */
function _setLogLevels(logger, config) {
    // XXX The loggers of the library lib-jitsi-meet and the application
    // jitsi-meet are separate, so the log levels have to be set in both.

    // First, set the default log level.
    logger.setLogLevel(config.defaultLogLevel);

    // Second, set the log level of each logger explictly overriden by config.
    Object.keys(config).forEach(
        id =>
            id === 'defaultLogLevel' || logger.setLogLevelById(config[id], id));
}

/**
 * Notifies the feature base/logger that the action APP_WILL_UNMOUNT
 * is being dispatched within a specific Redux store.
 *
 * @param {Store} store - The Redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The Redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The Redux action APP_WILL_UNMOUNT which is
 * being dispatched in the specified store.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
 */
function _appWillUnmount(store, next, action) {
    const {
        logCollectorStarted
    } = store.getState()['features/base/logging'];

    if (logCollectorStarted) {
        store.dispatch(stopLogCollector());
    }

    return next(action);
}
