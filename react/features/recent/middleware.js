/* @flow */

import { MiddlewareRegistry } from '../base/redux';
import { getInviteURL } from '../base/connection';
import { CONFERENCE_WILL_JOIN } from '../base/conference';
import { LIB_LOAD_STORAGE_DONE } from '../base/lib-jitsi-meet';

import {ADD_RECENT_URL, LOADED_RECENT_URLS} from './actionTypes';

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
    case LIB_LOAD_STORAGE_DONE: {
        // FIXME this appears to be called when a conference is left
        let entries = [];
        const recentURLs = window.localStorage.getItem('recentURLs');

        if (recentURLs) {
            console.info('FOUND STORED URLs', recentURLs);
            try {
                entries = JSON.parse(recentURLs);
            } catch (error) {
                console.error('Failed to parse recent URLS', error);
            }
        } else {
            console.info('NO STORED URLs found');
        }
        dispatch({
            type: LOADED_RECENT_URLS,
            entries
        });
        break;
    }
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
