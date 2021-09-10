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
    showParticipantJoinedNotification
} from './actions';
import { NOTIFICATION_TIMEOUT } from './constants';
import { joinLeaveNotificationsDisabled } from './functions';

declare var interfaceConfig: Object;

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
            const participant = getParticipantById(
                store.getState(),
                action.participant.id
            );

            if (typeof interfaceConfig === 'object'
                && participant
                && !participant.local
                && !action.participant.isReplaced) {
                store.dispatch(showNotification({
                    descriptionKey: 'notify.disconnected',
                    titleKey: 'notify.somebody',
                    title: participant.name
                }, NOTIFICATION_TIMEOUT));
            }
        }

        return next(action);
    }
    case PARTICIPANT_UPDATED: {
        if (typeof interfaceConfig === 'undefined') {
            // Do not show the notification for mobile and also when the focus indicator is disabled.
            return next(action);
        }

        const { id, role } = action.participant;
        const state = store.getState();
        const localParticipant = getLocalParticipant(state);

        if (localParticipant.id !== id) {
            return next(action);
        }

        const oldParticipant = getParticipantById(state, id);
        const oldRole = oldParticipant?.role;

        if (oldRole && oldRole !== role && role === PARTICIPANT_ROLE.MODERATOR) {

            store.dispatch(showNotification({
                titleKey: 'notify.moderator'
            },
            NOTIFICATION_TIMEOUT));
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
