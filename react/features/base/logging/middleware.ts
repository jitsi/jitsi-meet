// @ts-expect-error
import Logger from '@jitsi/logger';
import { AnyAction } from 'redux';

import { IStore } from '../../app/types';
import { APP_WILL_MOUNT } from '../app/actionTypes';
import { CONFERENCE_FAILED, CONFERENCE_JOINED } from '../conference/actionTypes';
import { getCurrentConference } from '../conference/functions';
import { SET_CONFIG } from '../config/actionTypes';
import JitsiMeetJS, {
    JitsiConferenceEvents
} from '../lib-jitsi-meet';
import { LIB_WILL_INIT } from '../lib-jitsi-meet/actionTypes';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';
import { isTestModeEnabled } from '../testing/functions';

import buildExternalApiLogTransport from './ExternalApiLogTransport';
import JitsiMeetInMemoryLogStorage from './JitsiMeetInMemoryLogStorage';
import JitsiMeetLogStorage from './JitsiMeetLogStorage';
import { SET_LOGGING_CONFIG } from './actionTypes';
import { setLogCollector, setLoggingConfig } from './actions';

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

    case CONFERENCE_FAILED: {
        const result = next(action);
        const { logCollector } = store.getState()['features/base/logging'];

        logCollector?.flush();

        return result;
    }

    case LIB_WILL_INIT:
        return _libWillInit(store, next, action);

    case SET_CONFIG:
        return _setConfig(store, next, action);

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
function _appWillMount(store: IStore, next: Function, action: AnyAction) {
    const { config } = store.getState()['features/base/logging'];

    _setLogLevels(Logger, config);

    _initEarlyLogging(store);

    // FIXME Until the logic of conference.js is rewritten into the React
    // app we, JitsiMeetJS.init is to not be used for the React app.
    // Consequently, LIB_WILL_INIT will not be dispatched. In the meantime, do
    // the following:
    typeof APP === 'undefined' || _setLogLevels(JitsiMeetJS, config);

    return next(action);
}

/**
 * Create the LogCollector and register it as the global log transport. It
 * is done early to capture as much logs as possible. Captured logs will be
 * cached, before the JitsiMeetLogStorage gets ready (RTCStats trace is
 * available).
 *
 * @param {Store} store - The Redux store in which context the early logging is to be
 * initialized.
 * @private
 * @returns {void}
 */
function _initEarlyLogging({ dispatch, getState }: IStore) {
    const { logCollector } = getState()['features/base/logging'];

    if (!logCollector) {
        // Create the LogCollector with minimal configuration
        // Use default values since config is not available yet
        const _logCollector = new Logger.LogCollector(new JitsiMeetLogStorage(getState), {});

        Logger.addGlobalTransport(_logCollector as any);
        _logCollector.start();

        dispatch(setLogCollector(_logCollector));
    }
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
function _conferenceJoined({ getState }: IStore, next: Function, action: AnyAction) {

    // Wait until the joined event is processed, so that the JitsiMeetLogStorage
    // will be ready.
    const result = next(action);

    const { conference } = action;
    const { logCollector } = getState()['features/base/logging'];

    if (logCollector && conference === getCurrentConference(getState())) {
        // Make an attempt to flush in case a lot of logs have been cached,
        // before the collector was started.
        logCollector.flush();

        // This event listener will flush the logs, before the statistics module
        // is stopped.
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
function _initLogging({ dispatch, getState }: IStore,
        loggingConfig: any, isTestingEnabled: boolean) {
    const state = getState();
    const { analytics: { rtcstatsLogFlushSizeBytes } = {}, apiLogLevels } = state['features/base/config'];
    const { logCollector } = state['features/base/logging'];
    const { disableLogCollector } = loggingConfig;

    if (disableLogCollector) {
        _disableLogCollector(logCollector, dispatch);

        return;
    }

    _setupExternalApiTransport(apiLogLevels);
    _setupDebugLogging(isTestingEnabled);
    _configureLogCollector(logCollector, rtcstatsLogFlushSizeBytes);
}

/**
 * Sets up external API log transport if configured.
 *
 * @param {Array} apiLogLevels - The API log levels configuration.
 * @private
 * @returns {void}
 */
function _setupExternalApiTransport(apiLogLevels: any) {
    if (apiLogLevels && Array.isArray(apiLogLevels) && typeof APP === 'object') {
        const transport = buildExternalApiLogTransport(apiLogLevels);

        Logger.addGlobalTransport(transport);
        JitsiMeetJS.addGlobalLogTransport(transport);
    }
}

/**
 * Sets up debug logging for testing mode.
 *
 * @param {boolean} isTestingEnabled - Whether testing mode is enabled.
 * @private
 * @returns {void}
 */
function _setupDebugLogging(isTestingEnabled: boolean) {
    // The JitsiMeetInMemoryLogStorage cannot be accessed on mobile through
    // the 'executeScript' method like it's done in torture tests for WEB.
    if (!isTestingEnabled || typeof APP !== 'object') {
        return;
    }

    APP.debugLogs = new JitsiMeetInMemoryLogStorage();
    const debugLogCollector = new Logger.LogCollector(
        APP.debugLogs, 
        { storeInterval: 1000 }
    );

    Logger.addGlobalTransport(debugLogCollector);
    JitsiMeetJS.addGlobalLogTransport(debugLogCollector);
    debugLogCollector.start();
}

/**
 * Configures the existing log collector with flush size settings.
 *
 * @param {Object} logCollector - The log collector instance.
 * @param {number|undefined} rtcstatsLogFlushSizeBytes - The flush size in bytes.
 * @private
 * @returns {void}
 */
function _configureLogCollector(logCollector: any, rtcstatsLogFlushSizeBytes: number | undefined) {

    // Log collector should be available at this point, as we initialize it early at appMount in
    // order for it to capture and cache as many logs as possible with it's default behavior.
    // We then update it's settings here after the config is in it's final form.
    // Data will only be sent to the server once the RTCStats trace is available, if it's available.
    if (!logCollector) {
        return;
    }

    // The smaller the flush size, the smaller the chance of losing logs, but
    // the more often the logs will be sent to the server. By default, the LogCollector
    // will flush once the logs reach 10KB or 30 seconds have passed since the last flush.
    // This means if something happens between that interval and the logs don't get flushed,
    // they will be lost (e.g., meeting tab is closed, browser crashes, uncaught exception).
    // If undefined is passed, the default values will be used.
    logCollector.maxEntryLength = rtcstatsLogFlushSizeBytes;
}

/**
 * Disables and cleans up the log collector.
 *
 * @param {Object} logCollector - The log collector instance.
 * @param {Function} dispatch - The Redux dispatch function.
 * @private
 * @returns {void}
 */
function _disableLogCollector(logCollector: any, dispatch: Function) {
    if (!logCollector) {
        return;
    }

    Logger.removeGlobalTransport(logCollector);
    JitsiMeetJS.removeGlobalLogTransport(logCollector);
    logCollector.stop();
    dispatch(setLogCollector(undefined));
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
function _libWillInit({ getState }: IStore, next: Function, action: AnyAction) {
    // Adding the if in order to preserve the logic for web after enabling
    // LIB_WILL_INIT action for web in initLib action.
    if (typeof APP === 'undefined') {
        _setLogLevels(JitsiMeetJS, getState()['features/base/logging'].config);
    }

    return next(action);
}

/**
 * This feature that the action SET_CONFIG is being
 * dispatched within a specific Redux store.
 *
 * @param {Store} store - The Redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The Redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The Redux action SET_CONFIG which is being
 * dispatched in the specified store.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
 */
function _setConfig({ dispatch }: IStore, next: Function, action: AnyAction) {
    const result = next(action);

    dispatch(setLoggingConfig(action.config?.logging));

    return result;
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
function _setLoggingConfig({ dispatch, getState }: IStore,
        next: Function, action: AnyAction) {
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
function _setLogLevels(logger: any, config: any) {
    // XXX The loggers of the library lib-jitsi-meet and the application
    // jitsi-meet are separate, so the log levels have to be set in both.

    // First, set the default log level.
    logger.setLogLevel(config.defaultLogLevel);

    // Second, set the log level of each logger explicitly overridden by config.
    for (const [ id, level ] of Object.entries(config.loggers)) {
        logger.setLogLevelById(level, id);
    }
}
