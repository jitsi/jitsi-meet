import debounce from 'lodash/debounce';

import { CONFERENCE_FAILED, SET_ROOM } from '../../base/conference/actionTypes';
import { JitsiConferenceErrors } from '../../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../../base/redux';
import { readyToClose } from '../external-api/actions';


import { isWelcomePageAppEnabled } from './components/welcome/functions';
import { navigateRoot } from './rootNavigationContainerRef';
import { screen } from './routes';


MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_ROOM:
        return _setRoom(store, next, action);

    case CONFERENCE_FAILED:
        return _conferenceFailed(store, next, action);
    }

    return next(action);
});

/**
 * Debounced sending of `readyToClose`.
 */
const _sendReadyToClose = debounce(dispatch => {
    dispatch(readyToClose());
}, 2500, { leading: true });

/**
 * Notifies the feature base/conference that the action
 * {@code SET_ROOM} is being dispatched within a specific
 *  redux store.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code SET_ROOM}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _setRoom({ dispatch, getState }, next, action) {
    const { room: oldRoom } = getState()['features/base/conference'];
    const result = next(action);
    const { room: newRoom } = getState()['features/base/conference'];
    const isWelcomePageEnabled = isWelcomePageAppEnabled(getState());

    if (!oldRoom && newRoom) {
        navigateRoot(screen.conference.root);
    } else if (!newRoom) {
        if (isWelcomePageEnabled) {
            navigateRoot(screen.root);
        } else {
            // For JitsiSDK, WelcomePage is not available
            _sendReadyToClose(dispatch);
        }
    }

    return result;
}

/**
 * Function to handle the conference failed event and navigate the user to the lobby screen
 * based on the failure reason.
 *
 * @param {Object} store - The Redux store.
 * @param {Function} next - The Redux next function.
 * @param {Object} action - The Redux action.
 * @returns {Object}
 */
function _conferenceFailed({ dispatch, getState }, next, action) {
    const state = getState();
    const isWelcomePageEnabled = isWelcomePageAppEnabled(state);
    const { error } = action;

    // We need to cover the case where knocking participant
    // is rejected from entering the conference
    if (error.name === JitsiConferenceErrors.CONFERENCE_ACCESS_DENIED) {
        if (isWelcomePageEnabled) {
            navigateRoot(screen.root);
        } else {
            // For JitsiSDK, WelcomePage is not available
            _sendReadyToClose(dispatch);
        }
    }

    return next(action);
}
