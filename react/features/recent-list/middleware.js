// @flow

import { MiddlewareRegistry } from '../base/redux';

import { parseURIString, urlObjectToString } from '../base/util';
import { SET_ROOM } from '../base/conference';
import { RECENT_URL_STORAGE } from './constants';

/**
 * Middleware that captures joined rooms so then it can be saved to
 * {@code localStorage}
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
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
* @private
* @returns {Object} The new state that is the result of the reduction of the
* specified action.
*/
function _storeJoinedRoom(store, next, action) {
    const result = next(action);
    const { room } = action;

    if (room) {
        const location
            = parseURIString(
                store.getState()['features/app'].app._getDefaultURL()
            );

        location.room = room;

        const conferenceLink = urlObjectToString(location);
        let recentUrls = window.localStorage.getItem(RECENT_URL_STORAGE);

        if (recentUrls) {
            recentUrls = JSON.parse(recentUrls);
        } else {
            recentUrls = [];
        }

        // if the current conference is already in the list,
        // we remove it to add it
        // to the top at the end
        recentUrls = recentUrls.filter(
            entry => entry.conference !== conferenceLink
        );

        // please note, this is a reverse sorted array
        // (newer elements at the end)

        // maximising the size to 99 (+1)

        if (recentUrls.length > 99) {
            recentUrls.splice(0, recentUrls.length - 99);
        }

        recentUrls.push({
            conference: conferenceLink,
            date: Date.now()
        });

        window.localStorage.setItem(
            RECENT_URL_STORAGE,
            JSON.stringify(recentUrls)
        );
    }

    return result;
}
