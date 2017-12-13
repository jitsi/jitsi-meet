/* @flow */

import { LIST_SIZE } from './constants';
import { getRecentUrls, updaterecentUrls } from './functions';

import { CONFERENCE_WILL_LEAVE, SET_ROOM } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';

/**
 * Middleware that captures joined rooms so then it can be saved to
 * {@code localStorage}
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_WILL_LEAVE:
        return _updateConferenceDuration(store, next, action);

    case SET_ROOM:
        return _storeJoinedRoom(store, next, action);
    }

    return next(action);
});

/**
* Stores the recently joined room in {@code localStorage}.
*
* @param {Store} store - The redux store in which the specified action is being
* dispatched.
* @param {Dispatch} next - The redux dispatch function to dispatch the
* specified action to the specified store.
* @param {Action} action - The redux action CONFERENCE_JOINED which is being
* dispatched in the specified store.
* @returns {Object} The new state that is the result of the reduction of the
* specified action.
*/
function _storeJoinedRoom(store, next, action) {
    const result = next(action);
    const { room } = action;

    if (room) {
        const { locationURL } = store.getState()['features/base/connection'];
        const conferenceLink = locationURL.href;

        // if the current conference is already in the list,
        // we remove it to add it
        // to the top at the end
        const recentUrls = getRecentUrls().filter(
            entry => entry.conference !== conferenceLink
        );

        // please note, this is a reverse sorted array
        // (newer elements at the end)
        recentUrls.push({
            conference: conferenceLink,
            date: Date.now(),
            conferenceDuration: 0
        });

        // maximising the size
        recentUrls.splice(0, recentUrls.length - LIST_SIZE);

        updaterecentUrls(recentUrls);
    }

    return result;
}

/**
* Updates the conference length when left.
*
* @private
* @param {Store} store - The redux store in which the specified action is being
* dispatched.
* @param {Dispatch} next - The redux dispatch function to dispatch the
* specified action to the specified store.
* @param {Action} action - The redux action CONFERENCE_JOINED which is being
* dispatched in the specified store.
* @returns {Object} The new state that is the result of the reduction of the
* specified action.
*/
function _updateConferenceDuration(store, next, action) {
    const result = next(action);
    const { locationURL } = store.getState()['features/base/connection'];

    if (locationURL && locationURL.href) {
        const recentUrls = getRecentUrls();

        if (recentUrls.length > 0
            && recentUrls[recentUrls.length - 1].conference
                === locationURL.href) {
            // the last conference start was stored
            // so we need to update the length

            recentUrls[recentUrls.length - 1].conferenceDuration
                = Date.now() - recentUrls[recentUrls.length - 1].date;

            updaterecentUrls(recentUrls);
        }
    }

    return result;
}
