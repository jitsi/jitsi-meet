/* @flow */

import { getCurrentConference } from '../base/conference';
import {
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    getParticipantById,
    getParticipantDisplayName
} from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';

import {
    clearNotifications,
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

        if (!p.local && !joinLeaveNotificationsDisabled()) {
            store.dispatch(showParticipantJoinedNotification(
                getParticipantDisplayName(store.getState, p.id)
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
                && !participant.local) {
                store.dispatch(showNotification({
                    descriptionKey: 'notify.disconnected',
                    titleKey: 'notify.somebody',
                    title: participant.name
                }, NOTIFICATION_TIMEOUT));
            }
        }

        return next(action);
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
