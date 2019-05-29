/* @flow */

import { getCurrentConference } from '../base/conference';
import { StateListenerRegistry } from '../base/redux';

import { clearNotifications } from './actions';

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
