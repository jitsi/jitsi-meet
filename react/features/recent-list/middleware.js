// @flow

import { CONFERENCE_WILL_LEAVE, SET_ROOM } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';

import { LIST_SIZE } from './constants';
import { getRecentURLs, updateRecentURLs } from './functions';

/**
 * Middleware that captures joined rooms so they can be saved into
 * {@code window.localStorage}.
 *
 * @param {Store} store - The redux store.
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
* Stores the recently joined room into {@code window.localStorage}.
*
* @param {Store} store - The redux store in which the specified action is being
* dispatched.
* @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
* specified action to the specified store.
* @param {Action} action - The redux action {@code SET_ROOM} which is being
* dispatched in the specified store.
* @private
* @returns {Object} The new state that is the result of the reduction of the
* specified action.
*/
function _storeJoinedRoom(store, next, action) {
    const result = next(action);

    const { room } = action;

    if (room) {
        const { locationURL } = store.getState()['features/base/connection'];
        const conference = locationURL.href;

        // If the current conference is already in the list, we remove it to add
        // it to the top at the end.
        const recentURLs
            = getRecentURLs()
                .filter(e => e.conference !== conference);

        // XXX This is a reverse sorted array (i.e. newer elements at the end).
        recentURLs.push({
            conference,
            conferenceDuration: 0,
            date: Date.now()
        });

        // maximising the size
        recentURLs.splice(0, recentURLs.length - LIST_SIZE);

        updateRecentURLs(recentURLs);
    }

    return result;
}

/**
* Updates the conference length when left.
*
* @param {Store} store - The redux store in which the specified action is being
* dispatched.
* @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
* specified action to the specified store.
* @param {Action} action - The redux action {@code CONFERENCE_WILL_LEAVE} which
* is being dispatched in the specified store.
* @private
* @returns {Object} The new state that is the result of the reduction of the
* specified action.
*/
function _updateConferenceDuration({ getState }, next, action) {
    const result = next(action);

    const { locationURL } = getState()['features/base/connection'];

    if (locationURL && locationURL.href) {
        const recentURLs = getRecentURLs();

        if (recentURLs.length > 0) {
            const mostRecentURL = recentURLs[recentURLs.length - 1];

            if (mostRecentURL.conference === locationURL.href) {
                // The last conference start was stored so we need to update the
                // length.
                mostRecentURL.conferenceDuration
                    = Date.now() - mostRecentURL.date;

                updateRecentURLs(recentURLs);
            }
        }
    }

    return result;
}
