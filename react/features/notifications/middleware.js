/* @flow */

import { getCurrentConference } from '../base/conference';
import {
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED
} from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';

import { clearNotifications } from './actions';

declare var interfaceConfig: Object;

/**
 * Middleware that captures actions to display notifications.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(() => next => action => {
    switch (action.type) {
    case PARTICIPANT_JOINED: {
        return next(action);
    }
    case PARTICIPANT_LEFT: {
        return next(action);
    }
    case PARTICIPANT_UPDATED: {
        if (typeof interfaceConfig === 'undefined' || interfaceConfig.DISABLE_FOCUS_INDICATOR) {
            // Do not show the notification for mobile and also when the focus indicator is disabled.
            return next(action);
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
