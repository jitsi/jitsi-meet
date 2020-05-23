// @flow

import { SET_CONFIG } from '../base/config';
import { ADD_KNOWN_DOMAINS } from '../base/known-domains';
import { equals, MiddlewareRegistry } from '../base/redux';
import { APP_STATE_CHANGED } from '../mobile/background/actionTypes';

import { REFRESH_CALENDAR } from './actionTypes';
import { setCalendarAuthorization } from './actions';
import { _fetchCalendarEntries, isCalendarEnabled } from './functions';

MiddlewareRegistry.register(store => next => action => {
    const { getState } = store;

    if (!isCalendarEnabled(getState)) {
        return next(action);
    }

    switch (action.type) {
    case ADD_KNOWN_DOMAINS: {
        // XXX Fetch new calendar entries only when an actual domain has
        // become known.
        const oldValue = getState()['features/base/known-domains'];
        const result = next(action);
        const newValue = getState()['features/base/known-domains'];

        equals(oldValue, newValue)
            || _fetchCalendarEntries(store, false, false);

        return result;
    }

    case APP_STATE_CHANGED: {
        const result = next(action);

        _maybeClearAccessStatus(store, action);

        return result;
    }

    case SET_CONFIG: {
        const result = next(action);

        _fetchCalendarEntries(store, false, false);

        return result;
    }

    case REFRESH_CALENDAR: {
        const result = next(action);

        _fetchCalendarEntries(
            store, action.isInteractive, action.forcePermission);

        return result;
    }
    }

    return next(action);
});

/**
 * Clears the calendar access status when the app comes back from the
 * background. This is needed as some users may never quit the app, but puts it
 * into the background and we need to try to request for a permission as often
 * as possible, but not annoyingly often.
 *
 * @param {Object} store - The redux store.
 * @param {Object} action - The Redux action.
 * @private
 * @returns {void}
 */
function _maybeClearAccessStatus(store, { appState }) {
    appState === 'background'
        && store.dispatch(setCalendarAuthorization(undefined));
}
