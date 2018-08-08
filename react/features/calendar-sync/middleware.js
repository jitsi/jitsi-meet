// @flow

import { APP_WILL_MOUNT } from '../base/app';
import { ADD_KNOWN_DOMAINS, addKnownDomains } from '../base/known-domains';
import {
    equals,
    MiddlewareRegistry,
    StateListenerRegistry
} from '../base/redux';
import { APP_STATE_CHANGED } from '../mobile/background/actionTypes';

import {
    setCalendarAPIState,
    setCalendarAuthorization,
    setCalendarProfileEmail
} from './actions';
import { REFRESH_CALENDAR, SET_CALENDAR_API_STATE } from './actionTypes';
import {
    CALENDAR_API_STATES,
    CALENDAR_ENABLED,
    CALENDAR_TYPE
} from './constants';
import { _fetchCalendarEntries, _updateProfile } from './functions';

CALENDAR_ENABLED
    && MiddlewareRegistry.register(store => next => action => {
        switch (action.type) {
        case ADD_KNOWN_DOMAINS: {
            // XXX Fetch new calendar entries only when an actual domain has
            // become known.
            const { getState } = store;
            const oldValue = getState()['features/base/known-domains'];
            const result = next(action);
            const newValue = getState()['features/base/known-domains'];

            equals(oldValue, newValue)
                || _fetchCalendarEntries(store, false, false);

            return result;
        }

        // mobile action type
        case APP_STATE_CHANGED: {
            const result = next(action);

            _maybeClearAccessStatus(store, action);

            return result;
        }

        case APP_WILL_MOUNT: {
            // For legacy purposes, we've allowed the deserialization of
            // knownDomains and now we're to translate it to base/known-domains.
            const state = store.getState()['features/calendar-sync'];

            if (state) {
                const { knownDomains } = state;

                Array.isArray(knownDomains)
                    && knownDomains.length
                    && store.dispatch(addKnownDomains(knownDomains));
            }

            _fetchCalendarEntries(store, false, false);

            return next(action);
        }

        case REFRESH_CALENDAR: {
            const result = next(action);

            _fetchCalendarEntries(
                store, action.isInteractive, action.forcePermission);

            return result;
        }

        case SET_CALENDAR_API_STATE: {
            const { getState } = store;
            const oldValue = getState()['features/calendar-sync'].apiState;
            const result = next(action);
            const newValue = action.apiState;

            if (oldValue === CALENDAR_API_STATES.LOADED
                && newValue === CALENDAR_API_STATES.SIGNED_IN) {
                _updateProfile(store);
            }

            return result;
        }
        }

        return next(action);
    });

StateListenerRegistry.register(
    /* selector */ state => state['features/google-api'].googleAPIState,
    /* listener */ (googleAPIState, { dispatch, getState }) => {

        // only propagate state if we are using google calendar
        if (getState()['features/calendar-sync'].calendarType
                === CALENDAR_TYPE.GOOGLE) {
            dispatch(setCalendarAPIState(googleAPIState));
        }

    });
StateListenerRegistry.register(
    /* selector */ state => state['features/google-api'].profileEmail,
    /* listener */ (profileEmail, { dispatch }) => {
        dispatch(setCalendarProfileEmail(profileEmail));
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
