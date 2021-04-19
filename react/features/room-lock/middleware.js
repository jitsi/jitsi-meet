// @flow

import UIEvents from '../../../service/UI/UIEvents';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    LOCK_STATE_CHANGED,
    SET_PASSWORD_FAILED
} from '../base/conference';
import { hideDialog } from '../base/dialog';
import { JitsiConferenceErrors } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';
import {
    NOTIFICATION_TIMEOUT,
    showNotification
} from '../notifications';

import { _openPasswordRequiredPrompt } from './actions';
import { PasswordRequiredPrompt } from './components';
import { LOCKED_REMOTELY } from './constants';
import logger from './logger';

declare var APP: Object;

/**
 * Middleware that captures conference failed and checks for password required
 * error and requests a dialog for user to enter password.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_FAILED:
        return _conferenceFailed(store, next, action);

    case CONFERENCE_JOINED:
        return _conferenceJoined(store, next, action);

    case LOCK_STATE_CHANGED: {
        // TODO Remove this logic when all components interested in the lock
        // state change event are moved into react/redux.
        if (typeof APP !== 'undefined') {
            APP.UI.emitEvent(UIEvents.TOGGLE_ROOM_LOCK, action.locked);
        }

        const previousLockedState = store.getState()['features/base/conference'].locked;

        const result = next(action);

        const currentLockedState = store.getState()['features/base/conference'].locked;

        if (currentLockedState === LOCKED_REMOTELY) {
            store.dispatch(
                showNotification({
                    titleKey: 'notify.passwordSetRemotely'
                }, NOTIFICATION_TIMEOUT));
        } else if (previousLockedState === LOCKED_REMOTELY && !currentLockedState) {
            store.dispatch(
                showNotification({
                    titleKey: 'notify.passwordRemovedRemotely'
                }, NOTIFICATION_TIMEOUT));
        }

        return result;
    }
    case SET_PASSWORD_FAILED:
        return _setPasswordFailed(store, next, action);
    }

    return next(action);
});

/**
 * Handles cleanup of lock prompt state when a conference is joined.
 *
 * @param {Store} store - The redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The redux action {@code CONFERENCE_JOINED} which
 * specifies the details associated with joining the conference.
 * @private
 * @returns {*}
 */
function _conferenceJoined({ dispatch }, next, action) {
    dispatch(hideDialog(PasswordRequiredPrompt));

    return next(action);
}

/**
 * Handles errors that occur when a conference fails.
 *
 * @param {Store} store - The redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The redux action {@code CONFERENCE_FAILED} which
 * specifies the details associated with the error and the failed conference.
 * @private
 * @returns {*}
 */
function _conferenceFailed({ dispatch }, next, action) {
    const { conference, error } = action;

    if (conference && error.name === JitsiConferenceErrors.PASSWORD_REQUIRED) {
        // XXX The feature room-lock affords recovery after CONFERENCE_FAILED
        // caused by JitsiConferenceErrors.PASSWORD_REQUIRED.
        if (typeof error.recoverable === 'undefined') {
            error.recoverable = true;
        }
        if (error.recoverable) {
            dispatch(_openPasswordRequiredPrompt(conference));
        }
    } else {
        dispatch(hideDialog(PasswordRequiredPrompt));
    }

    return next(action);
}

/**
 * Handles errors that occur when a password fails to be set.
 *
 * @param {Store} store - The redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The redux action {@code SET_PASSWORD_ERROR} which
 * has the error type that should be handled.
 * @private
 * @returns {*}
 */
function _setPasswordFailed(store, next, action) {
    if (typeof APP !== 'undefined') {
        // TODO Remove this logic when displaying of error messages on web is
        // handled through react/redux.
        const { error } = action;
        let descriptionKey;
        let titleKey;

        if (error === JitsiConferenceErrors.PASSWORD_NOT_SUPPORTED) {
            logger.warn('room passwords not supported');
            descriptionKey = 'dialog.passwordNotSupported';
            titleKey = 'dialog.passwordNotSupportedTitle';
        } else {
            logger.warn('setting password failed', error);
            descriptionKey = 'dialog.lockMessage';
            titleKey = 'dialog.lockTitle';
        }
        APP.UI.messageHandler.showError({
            descriptionKey,
            titleKey
        });
    }

    return next(action);
}
