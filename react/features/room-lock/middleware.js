// @flow

import {
    CONFERENCE_FAILED,
    LOCK_STATE_CHANGED,
    SET_PASSWORD_FAILED
} from '../base/conference';
import { JitsiConferenceErrors } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';
import UIEvents from '../../../service/UI/UIEvents';

import { _openPasswordRequiredPrompt } from './actions';

declare var APP: Object;

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Middleware that captures conference failed and checks for password required
 * error and requests a dialog for user to enter password.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_FAILED: {
        const { conference, error } = action;

        if (conference
                && error.name === JitsiConferenceErrors.PASSWORD_REQUIRED) {
            // XXX The feature room-lock affords recovery after
            // CONFERENCE_FAILED caused by
            // JitsiConferenceErrors.PASSWORD_REQUIRED.
            if (typeof error.recoverable === 'undefined') {
                error.recoverable = true;
            }
            if (error.recoverable) {
                store.dispatch(_openPasswordRequiredPrompt(conference));
            }
        }
        break;
    }

    case LOCK_STATE_CHANGED:
        // TODO Remove this logic when all components interested in the lock
        // state change event are moved into react/redux.
        if (typeof APP !== 'undefined') {
            APP.UI.emitEvent(UIEvents.TOGGLE_ROOM_LOCK, action.locked);
        }
        break;

    case SET_PASSWORD_FAILED:
        return _setPasswordFailed(store, next, action);
    }

    return next(action);
});

/**
 * Handles errors that occur when a password fails to be set.
 *
 * @param {Store} store - The Redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The Redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The Redux action SET_PASSWORD_ERROR which has the
 * error type that should be handled.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
 */
function _setPasswordFailed(store, next, action) {
    if (typeof APP !== 'undefined') {
        // TODO Remove this logic when displaying of error messages on web is
        // handled through react/redux.
        const { error } = action;
        let title;
        let message;

        if (error === JitsiConferenceErrors.PASSWORD_NOT_SUPPORTED) {
            logger.warn('room passwords not supported');
            title = 'dialog.warning';
            message = 'dialog.passwordNotSupported';
        } else {
            logger.warn('setting password failed', error);
            title = 'dialog.lockTitle';
            message = 'dialog.lockMessage';
        }
        APP.UI.messageHandler.showError(title, message);
    }

    return next(action);
}
