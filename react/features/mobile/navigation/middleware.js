import { CONFERENCE_FAILED } from '../../base/conference/actionTypes';
import { JitsiConferenceErrors } from '../../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../../base/redux';

import { isWelcomePageAppEnabled } from './components/welcome/functions';
import { _sendReadyToClose } from './constants';
import { navigateRoot } from './rootNavigationContainerRef';
import { screen } from './routes';


MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {

    case CONFERENCE_FAILED:
        return _conferenceFailed(store, next, action);
    }

    return next(action);
});

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
