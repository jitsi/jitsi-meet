/* @flow */

import { getCurrentConference } from '../base/conference';
import {
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_ROLE,
    PARTICIPANT_UPDATED,
    getParticipantById,
    getParticipantDisplayName,
    getLocalParticipant
} from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { PARTICIPANTS_PANE_OPEN } from '../participants-pane/actionTypes';

import {
    clearNotifications,
    hideRaiseHandNotifications,
    showNotification,
    showParticipantJoinedNotification,
    showParticipantLeftNotification
} from './actions';
import { NOTIFICATION_TIMEOUT_TYPE } from './constants';
import { joinLeaveNotificationsDisabled } from './functions';

/**
 * Middleware that captures actions to display notifications.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case PARTICIPANT_JOINED: {
        const result = next(action);
        const { participant: p } = action;
        const { dispatch, getState } = store;
        const state = getState();
        const { conference } = state['features/base/conference'];

        if (conference && !p.local && !joinLeaveNotificationsDisabled() && !p.isReplacing) {
            dispatch(showParticipantJoinedNotification(
                getParticipantDisplayName(state, p.id)
            ));
        }

        return result;
    }
    case PARTICIPANT_LEFT: {
        if (!joinLeaveNotificationsDisabled()) {
            const { dispatch, getState } = store;
            const state = getState();
            const participant = getParticipantById(
                store.getState(),
                action.participant.id
            );

            if (participant && !participant.local && !action.participant.isReplaced) {
                dispatch(showParticipantLeftNotification(
                    getParticipantDisplayName(state, participant.id)
                ));
            }
        }

        return next(action);
    }
    case PARTICIPANT_UPDATED: {
        const state = store.getState();
        const { disableModeratorIndicator } = state['features/base/config'];

        if (disableModeratorIndicator) {
            return next(action);
        }

        const { id, role } = action.participant;
        const localParticipant = getLocalParticipant(state);

        if (localParticipant?.id !== id) {
            return next(action);
        }

        const oldParticipant = getParticipantById(state, id);
        const oldRole = oldParticipant?.role;

        if (oldRole && oldRole !== role && role === PARTICIPANT_ROLE.MODERATOR) {

            store.dispatch(showNotification({
                titleKey: 'notify.moderator'
            },
            NOTIFICATION_TIMEOUT_TYPE.SHORT));
        }

        return next(action);
    }
    case PARTICIPANTS_PANE_OPEN: {
        store.dispatch(hideRaiseHandNotifications());
        break;
    }
    }

    return next(action);
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
