import { AnyAction } from 'redux';

import { IStore } from '../app/types';
import { APP_WILL_MOUNT } from '../base/app/actionTypes';
import { CONFERENCE_WILL_LEAVE, SET_ROOM } from '../base/conference/actionTypes';
import { JITSI_CONFERENCE_URL_KEY } from '../base/conference/constants';
import { addKnownDomains } from '../base/known-domains/actions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { isEmbedded } from '../base/util/embedUtils';
import { parseURIString } from '../base/util/uri';

import { _storeCurrentConference, _updateConferenceDuration } from './actions';
import { isRecentListEnabled } from './functions';

/**
 * Middleware that captures joined rooms so they can be saved into
 * {@code window.localStorage}.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    if (isRecentListEnabled()) {
        switch (action.type) {
        case APP_WILL_MOUNT:
            return _appWillMount(store, next, action);

        case CONFERENCE_WILL_LEAVE:
            return _conferenceWillLeave(store, next, action);

        case SET_ROOM:
            return _setRoom(store, next, action);
        }
    }

    return next(action);
});

/**
 * Notifies the feature recent-list that the redux action {@link APP_WILL_MOUNT}
 * is being dispatched in a specific redux store.
 *
 * @param {Store} store - The redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The redux action {@code APP_WILL_MOUNT} which is
 * being dispatched in the specified redux store.
 * @private
 * @returns {*} The result returned by {@code next(action)}.
 */
function _appWillMount({ dispatch, getState }: IStore, next: Function, action: AnyAction) {
    const result = next(action);

    // It's an opportune time to transfer the feature recent-list's knowledge
    // about "known domains" (which is local to the feature) to the feature
    // base/known-domains (which is global to the app).
    //
    // XXX Since the feature recent-list predates the feature calendar-sync and,
    // consequently, the feature known-domains, it's possible for the feature
    // known-list to know of domains which the feature known-domains is yet to
    // discover.
    const knownDomains = [];

    for (const { conference } of getState()['features/recent-list']) {
        const uri = parseURIString(conference);
        let host;

        uri && (host = uri.host) && knownDomains.push(host);
    }
    knownDomains.length && dispatch(addKnownDomains(knownDomains));

    return result;
}

/**
 * Updates the duration of the last conference stored in the list.
 *
 * @param {Store} store - The redux store.
 * @param {Dispatch} next - The redux {@code dispatch} function.
 * @param {Action} action - The redux action {@link CONFERENCE_WILL_LEAVE}.
 * @private
 * @returns {*} The result returned by {@code next(action)}.
 */
function _conferenceWillLeave({ dispatch, getState }: IStore, next: Function, action: AnyAction) {
    const state = getState();
    const { doNotStoreRoom } = state['features/base/config'];

    if (!doNotStoreRoom && !isEmbedded()) {
        const { conference } = action;

        // Prefer the URL attached to the JitsiConference at join time
        // (see createConference in base/conference/actions.any.ts). That value
        // identifies the room we are leaving even if base/connection.locationURL
        // has already moved to a different target (e.g. fast leave -> join).
        const urlFromConference = conference?.[JITSI_CONFERENCE_URL_KEY];
        const { locationURL } = state['features/base/connection'];
        const locationURLForDuration = urlFromConference ?? locationURL;

        if (locationURLForDuration?.href) {
            dispatch(_updateConferenceDuration(locationURLForDuration));
        }
    }

    return next(action);
}

/**
 * Checks if there is a current conference (upon SET_ROOM action), and saves it
 * if necessary.
 *
 * @param {Store} store - The redux store.
 * @param {Dispatch} next - The redux {@code dispatch} function.
 * @param {Action} action - The redux action {@link SET_ROOM}.
 * @private
 * @returns {*} The result returned by {@code next(action)}.
 */
function _setRoom({ dispatch, getState }: IStore, next: Function, action: AnyAction) {
    const { doNotStoreRoom } = getState()['features/base/config'];

    if (!doNotStoreRoom && !isEmbedded() && action.room) {
        const { locationURL } = getState()['features/base/connection'];

        if (locationURL) {
            dispatch(_storeCurrentConference(locationURL));

            // Whatever domain the feature recent-list knows about, the app as a
            // whole should know about.
            //
            // XXX Technically, _storeCurrentConference could be turned into an
            // asynchronous action creator which dispatches both
            // _STORE_CURRENT_CONFERENCE and addKnownDomains but...
            dispatch(addKnownDomains(locationURL.host));
        }
    }

    return next(action);
}
