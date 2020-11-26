import { sendAnalytics, createVpaasConferenceJoinedEvent } from '../analytics';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { PARTICIPANT_JOINED } from '../base/participants/actionTypes';
import { MiddlewareRegistry } from '../base/redux';

import { SET_BILLING_ID } from './actionTypes';
import { countEndpoint } from './actions';
import { isVpaasMeeting, extractVpaasTenantFromPath, setBillingId } from './functions';

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
    case SET_BILLING_ID: {
        setBillingId(action.value);

        break;
    }

    case PARTICIPANT_JOINED: {
        const shouldCount = !store.getState()['features/billing-counter'].endpointCounted
              && !action.participant.local;

        if (shouldCount) {
            store.dispatch(countEndpoint());
        }

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
            extractVpaasTenantFromPath(
                state['features/base/connection'].locationURL.pathname)));
    }
}
