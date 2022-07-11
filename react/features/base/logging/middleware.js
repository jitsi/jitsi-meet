/* @flow */

import Logger from '@jitsi/logger';

import { APP_WILL_MOUNT } from '../app';
import { CONFERENCE_JOINED, getCurrentConference } from '../conference';
import JitsiMeetJS, {
    JitsiConferenceEvents
} from '../lib-jitsi-meet';
import { LIB_WILL_INIT } from '../lib-jitsi-meet/actionTypes';
import { MiddlewareRegistry } from '../redux';
import { isTestModeEnabled } from '../testing';

import buildExternalApiLogTransport from './ExternalApiLogTransport';
import JitsiMeetInMemoryLogStorage from './JitsiMeetInMemoryLogStorage';
import JitsiMeetLogStorage from './JitsiMeetLogStorage';
import { SET_LOGGING_CONFIG } from './actionTypes';
import { setLogCollector } from './actions';

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
 * Starts the log collector, after {@link CONFERENCE_JOINED} action is reduced.
 *
 * @param {Store} store - The Redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The Redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The Redux action {@code CONFERENCE_JOINED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*}
 */
function _conferenceJoined({ getState }, next, action) {

    // Wait until the joined event is processed, so that the JitsiMeetLogStorage
    // will be ready.
    const result = next(action);

    const { conference } = action;
    const { logCollector } = getState()['features/base/logging'];

    if (logCollector && conference === getCurrentConference(getState())) {
        // Start the LogCollector's periodic "store logs" task
        logCollector.start();

        // Make an attempt to flush in case a lot of logs have been cached,
        // before the collector was started.
        logCollector.flush();

        // This event listener will flush the logs, before the statistics module
        // (CallStats) is stopped.
        //
        // NOTE The LogCollector is not stopped, because this event can be
        // triggered multiple times during single conference (whenever
        // statistics module is stopped). That includes the case when Jicofo
        // terminates a single person conference (one person left in the room
        // waiting for someone to join). It will then restart the media session
        // when someone eventually joins the room which will start the stats
        // again.
        conference.on(
            JitsiConferenceEvents.BEFORE_STATISTICS_DISPOSED,
            () => logCollector.flush()
        );
    }

    return result;
}

/**
 * Initializes logging in the app.
 *
 * @param {Store} store - The Redux store in which context the logging is to be
 * initialized.
 * @param {Object} loggingConfig - The configuration with which logging is to be
 * initialized.
 * @param {boolean} isTestingEnabled - Is debug logging enabled.
 * @private
 * @returns {void}
 */
function _initLogging({ dispatch, getState }, loggingConfig, isTestingEnabled) {
    const { logCollector } = getState()['features/base/logging'];

    // Create the LogCollector and register it as the global log transport. It
    // is done early to capture as much logs as possible. Captured logs will be
    // cached, before the JitsiMeetLogStorage gets ready (statistics module is
    // initialized).
    if (!logCollector && !loggingConfig.disableLogCollector) {
        const _logCollector
            = new Logger.LogCollector(new JitsiMeetLogStorage(getState));

        const { apiLogLevels } = getState()['features/base/config'];

        if (apiLogLevels && Array.isArray(apiLogLevels) && typeof APP === 'object') {
            const transport = buildExternalApiLogTransport(apiLogLevels);

            Logger.addGlobalTransport(transport);
            JitsiMeetJS.addGlobalLogTransport(transport);
        }

        Logger.addGlobalTransport(_logCollector);
        JitsiMeetJS.addGlobalLogTransport(_logCollector);
        dispatch(setLogCollector(_logCollector));

        // The JitsiMeetInMemoryLogStorage can not be accessed on mobile through
        // the 'executeScript' method like it's done in torture tests for WEB.
        if (isTestingEnabled && typeof APP === 'object') {
            APP.debugLogs = new JitsiMeetInMemoryLogStorage();
            const debugLogCollector = new Logger.LogCollector(
                APP.debugLogs, { storeInterval: 1000 });

            Logger.addGlobalTransport(debugLogCollector);
            JitsiMeetJS.addGlobalLogTransport(debugLogCollector);
            debugLogCollector.start();
        }
    } else if (logCollector && loggingConfig.disableLogCollector) {
        Logger.removeGlobalTransport(logCollector);
        JitsiMeetJS.removeGlobalLogTransport(logCollector);
        logCollector.stop();
        dispatch(setLogCollector(undefined));
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
function _setLoggingConfig({ dispatch, getState }, next, action) {
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

    _initLogging({
        dispatch,
        getState
    }, newValue, isTestingEnabled);

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

    // Second, set the log level of each logger explicitly overridden by config.
    Object.keys(config).forEach(
        id =>
            id === 'defaultLogLevel' || logger.setLogLevelById(config[id], id));
}
