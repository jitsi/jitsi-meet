import { createVpaasConferenceJoinedEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IReduxState } from '../app/types';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { getVpaasTenant, isVpaasMeeting } from './functions';

/**
 * The redux middleware for billing counter.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */

MiddlewareRegistry.register(store => next => action => {
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
function _maybeTrackVpaasConferenceJoin(state: IReduxState) {
    if (isVpaasMeeting(state)) {
        sendAnalytics(createVpaasConferenceJoinedEvent(
            getVpaasTenant(state)));
    }
}
