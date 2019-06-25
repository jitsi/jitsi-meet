/* @flow */

import { getCurrentConference } from '../base/conference';
import {
    PARTICIPANT_JOINED,
    getParticipantDisplayName
} from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';

import {
    clearNotifications,
    showParticipantJoinedNotification
} from './actions';

/**
 * Middleware that captures actions to display notifications.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case PARTICIPANT_JOINED: {
        const { participant: p } = action;

        if (!p.local) {
            store.dispatch(showParticipantJoinedNotification(
                getParticipantDisplayName(store.getState, p.id)
            ));
        }
    }
    }

    return result;
});

/**
 * StateListenerRegistry provides a reliable way to detect the leaving of a
 * conference, where we need to clean up the notifications.
 */
StateListenerRegistry.register(
    /* selector */ state => getCurrentConference(state),
    /* listener */ (conference, { dispatch }) => {
        if (!conference) {
            dispatch(clearNotifications());
        }
    }
);
