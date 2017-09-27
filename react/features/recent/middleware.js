/* @flow */

import { MiddlewareRegistry } from '../base/redux';
import { getInviteURL } from '../base/connection';
import { CONFERENCE_WILL_JOIN } from '../base/conference';

import { ADD_RECENT_URL } from './actionTypes';

/**
 * Middleware that captures conference actions and sets the correct audio mode
 * based on the type of conference. Audio-only conferences don't use the speaker
 * by default, and video conferences do.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_WILL_JOIN: {
        dispatch({
            type: ADD_RECENT_URL,
            roomURL: getInviteURL(getState),
            timestamp: Date.now()
        });
        break;
    }
    }

    return result;
});
