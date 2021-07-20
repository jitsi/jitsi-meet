import { sendAnalytics, createVpaasConferenceJoinedEvent } from '../analytics';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { MiddlewareRegistry } from '../base/redux';

import { isVpaasMeeting, getVpaasTenant } from './functions';

/**
 * The redux middleware for billing counter.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */

MiddlewareRegistry.register(store => next => async action => {
    switch (action.type) {
    case CONFERENCE_JOINED: {
        _maybeTrackVpaasConferenceJoin(store.getState());

        break;
    }
    }

    return next(action);
});

/**
 * Tracks the conference join event if the meeting is a vpaas one.
 *
 * @param {Store} state - The app state.
 * @returns {Function}
 */
function _maybeTrackVpaasConferenceJoin(state) {
    if (isVpaasMeeting(state)) {
        sendAnalytics(createVpaasConferenceJoinedEvent(
            getVpaasTenant(state)));
    }
}
