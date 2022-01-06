import { redirectToStaticPage } from '../app/actions';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import {
    JitsiConferenceErrors,
    JitsiConferenceEvents
} from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';

import { SET_DETAILS } from './actionTypes';
import { STATUSES } from './constants';
import logger from './logger';

/**
 * The redux middleware for jaas.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => async action => {
    switch (action.type) {
    case SET_DETAILS: {
        const { status } = action.payload;

        if (status === STATUSES.BLOCKED) {
            store.dispatch(redirectToStaticPage('/static/planLimit.html'));
        }
        break;
    }

    case CONFERENCE_JOINED:{
        _addErrorMsgListener(action.conference, store);
    }
    }

    return next(action);
});

/** .........
 * Registers listener for {@link JitsiConferenceEvents.CONFERENCE_ERROR} that will
 * log the error message if the error type is {@link JitsiConferenceErrors.SETTINGS_ERROR} .
 *
 * @param {JitsiConference} conference - The conference instance on which the
 * new event listener will be registered.
 * @param {Object} store - The redux store object.
 * @private
 * @returns {void}
 */
function _addErrorMsgListener(conference, store) {
    if (store.getState()['features/base/config'].iAmRecorder) {
        // We don't register anything on web if we are in iAmRecorder mode
        return;
    }

    conference.on(
        JitsiConferenceEvents.CONFERENCE_ERROR, (errorType, errorMsg) => {
            errorType === JitsiConferenceErrors.SETTINGS_ERROR && logger.error(errorMsg);
        });
}
