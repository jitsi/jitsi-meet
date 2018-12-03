/* @flow */

import Logger from 'jitsi-meet-logger';

import { APP_WILL_MOUNT } from '../app';
import JitsiMeetJS, { LIB_WILL_INIT } from '../lib-jitsi-meet';
import { MiddlewareRegistry } from '../redux';

import JitsiMeetInMemoryLogStorage
    from '../../../../modules/util/JitsiMeetInMemoryLogStorage';
import JitsiMeetLogStorage from '../../../../modules/util/JitsiMeetLogStorage';

import { isTestModeEnabled } from '../testing';

import { SET_LOGGING_CONFIG } from './actionTypes';

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
function _appWillMount({ getState }, next, action) {
    const { config } = getState()['features/base/logging'];

    _setLogLevels(Logger, config);

    // FIXME Until the logic of conference.js is rewritten into the React
    // app we, JitsiMeetJS.init is to not be used for the React app.
    // Consequently, LIB_WILL_INIT will not be dispatched. In the meantime, do
    // the following:
    typeof APP === 'undefined' || _setLogLevels(JitsiMeetJS, config);

    return next(action);
}

/**
 * Initializes logging in the app.
 *
 * @param {Object} loggingConfig - The configuration with which logging is to be
 * initialized.
 * @param {boolean} isTestingEnabled - Is debug logging enabled.
 * @private
 * @returns {void}
 */
function _initLogging(loggingConfig, isTestingEnabled) {
    // Create the LogCollector and register it as the global log transport. It
    // is done early to capture as much logs as possible. Captured logs will be
    // cached, before the JitsiMeetLogStorage gets ready (statistics module is
    // initialized).
    if (typeof APP === 'object'
            && !APP.logCollector
            && !loggingConfig.disableLogCollector) {
        APP.logCollector = new Logger.LogCollector(new JitsiMeetLogStorage());
        Logger.addGlobalTransport(APP.logCollector);
        JitsiMeetJS.addGlobalLogTransport(APP.logCollector);

        if (isTestingEnabled) {
            APP.debugLogs = new JitsiMeetInMemoryLogStorage();
            const debugLogCollector = new Logger.LogCollector(
                APP.debugLogs, { storeInterval: 1000 });

            Logger.addGlobalTransport(debugLogCollector);
            JitsiMeetJS.addGlobalLogTransport(debugLogCollector);
            debugLogCollector.start();
        }
    }
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
    // Adding the if in order to preserve the logic for web after enabling
    // LIB_WILL_INIT action for web in initLib action.
    if (typeof APP === 'undefined') {
        _setLogLevels(JitsiMeetJS, getState()['features/base/logging'].config);
    }

    return next(action);
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
    const result = next(action);
    const newValue = getState()['features/base/logging'].config;
    const isTestingEnabled = isTestModeEnabled(getState());

    // TODO Generally, we'll want to _setLogLevels and _initLogging only if the
    // logging config values actually change.
    // XXX Unfortunately, we don't currently have a (nice) way of determining
    // whether _setLogLevels or _initLogging have been invoked so we have to
    // invoke them unconditionally even if none of the values have actually
    // changed.
    _setLogLevels(Logger, newValue);
    _setLogLevels(JitsiMeetJS, newValue);

    _initLogging(newValue, isTestingEnabled);

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
