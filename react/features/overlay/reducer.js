import { CONFERENCE_FAILED } from '../base/conference';
import {
    CONNECTION_ESTABLISHED,
    CONNECTION_FAILED,
    CONNECTION_WILL_CONNECT
} from '../base/connection';
import {
    isFatalJitsiConnectionError,
    JitsiConferenceErrors,
    JitsiConnectionErrors
} from '../base/lib-jitsi-meet';
import { assign, ReducerRegistry, set } from '../base/redux';

import {
    MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
    SUSPEND_DETECTED
} from './actionTypes';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Reduces the redux actions of the feature overlay.
 */
ReducerRegistry.register('features/overlay', (state = {}, action) => {
    switch (action.type) {
    case CONFERENCE_FAILED:
        return _conferenceFailed(state, action);

    case CONNECTION_ESTABLISHED:
        return _connectionEstablished(state, action);

    case CONNECTION_FAILED:
        return _connectionFailed(state, action);

    case CONNECTION_WILL_CONNECT:
        return _connectionWillConnect(state, action);

    case MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED:
        return _mediaPermissionPromptVisibilityChanged(state, action);

    case SUSPEND_DETECTED:
        return _suspendDetected(state, action);
    }

    return state;
});

/**
 * Reduces a specific redux action CONFERENCE_FAILED of the feature overlay.
 *
 * @param {Object} state - The redux state of the feature overlay.
 * @param {Action} action - The redux action CONFERENCE_FAILED to reduce.
 * @private
 * @returns {Object} The new state of the feature overlay after the reduction of
 * the specified action.
 */
function _conferenceFailed(state, { error, message }) {
    if (error === JitsiConferenceErrors.FOCUS_LEFT
            || error === JitsiConferenceErrors.VIDEOBRIDGE_NOT_AVAILABLE) {
        return assign(state, {
            haveToReload: true,
            isNetworkFailure: false,
            reason: message
        });
    }

    return state;
}

/**
 * Reduces a specific redux action CONNECTION_ESTABLISHED of the feature
 * overlay.
 *
 * @param {Object} state - The redux state of the feature overlay.
 * @private
 * @returns {Object} The new state of the feature overlay after the reduction of
 * the specified action.
 */
function _connectionEstablished(state) {
    return set(state, 'connectionEstablished', true);
}

/**
 * Reduces a specific redux action CONNECTION_FAILED of the feature overlay.
 *
 * @param {Object} state - The redux state of the feature overlay.
 * @param {Action} action - The redux action CONNECTION_FAILED to reduce.
 * @private
 * @returns {Object} The new state of the feature overlay after the reduction of
 * the specified action.
 */
function _connectionFailed(state, { error }) {
    if (isFatalJitsiConnectionError(error)) {
        const { message } = error;

        logger.error(`FATAL XMPP connection error: ${message}`);

        return assign(state, {
            haveToReload: true,

            // From all of the cases above only CONNECTION_DROPPED_ERROR is
            // considered a network type of failure.
            isNetworkFailure:
                error.name === JitsiConnectionErrors.CONNECTION_DROPPED_ERROR,
            reason: `xmpp-conn-dropped: ${message}`
        });
    }

    return state;
}

/**
 * Reduces a specific redux action CONNECTION_WILL_CONNECT in the feature
 * overlay. Clears the redux state related to the XMPP connection's status.
 *
 * @param {Object} state - The redux state of the feature overlay.
 * @param {Action} action - The redux action to reduce.
 * @private
 * @returns {Object} The new state of the feature overlay after reducing the
 * specified {@code action} in the feature overlay.
 */
function _connectionWillConnect(
        state,
        action) { // eslint-disable-line no-unused-vars
    return assign(state, {
        connectionEstablished: undefined,
        haveToReload: undefined,
        isNetworkFailure: undefined,
        reason: undefined
    });
}

/**
 * Reduces a specific redux action MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED of
 * the feature overlay.
 *
 * @param {Object} state - The redux state of the feature overlay.
 * @param {Action} action - The redux action to reduce.
 * @private
 * @returns {Object} The new state of the feature overlay after the reduction of
 * the specified action.
 */
function _mediaPermissionPromptVisibilityChanged(state, action) {
    return assign(state, {
        browser: action.browser,
        isMediaPermissionPromptVisible: action.isVisible
    });
}

/**
 * Reduces a specific redux action SUSPEND_DETECTED of the feature overlay.
 *
 * @param {Object} state - The redux state of the feature overlay.
 * @private
 * @returns {Object} The new state of the feature overlay after the reduction of
 * the specified action.
 */
function _suspendDetected(state) {
    return set(state, 'suspendDetected', true);
}
