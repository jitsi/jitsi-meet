// @flow

import { ReducerRegistry, set } from '../base/redux';
import { PersistenceRegistry } from '../base/storage';

import {
    CLEAR_CALENDAR_INTEGRATION,
    SET_CALENDAR_AUTH_STATE,
    SET_CALENDAR_AUTHORIZATION,
    SET_CALENDAR_ERROR,
    SET_CALENDAR_EVENTS,
    SET_CALENDAR_INTEGRATION,
    SET_CALENDAR_PROFILE_EMAIL,
    SET_LOADING_CALENDAR_EVENTS
} from './actionTypes';

/**
 * The default state of the calendar feature.
 *
 * @type {Object}
 */
const DEFAULT_STATE = {
    authorization: undefined,
    events: [],
    integrationReady: false,
    integrationType: undefined,
    msAuthState: undefined
};

/**
 * Constant for the Redux subtree of the calendar feature.
 *
 * NOTE: This feature can be disabled and in that case, accessing this subtree
 * directly will return undefined and will need a bunch of repetitive type
 * checks in other features. Make sure you take care of those checks, or
 * consider using the {@code isCalendarEnabled} value to gate features if
 * needed.
 */
const STORE_NAME = 'features/calendar-sync';

/**
 * NOTE: Never persist the authorization value as it's needed to remain a
 * runtime value to see if we need to re-request the calendar permission from
 * the user.
 */
PersistenceRegistry.register(STORE_NAME, {
    integrationType: true,
    msAuthState: true
});

ReducerRegistry.register(STORE_NAME, (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case CLEAR_CALENDAR_INTEGRATION:
        return DEFAULT_STATE;

    case SET_CALENDAR_AUTH_STATE: {
        if (!action.msAuthState) {
            // received request to delete the state
            return set(state, 'msAuthState', undefined);
        }

        return set(state, 'msAuthState', {
            ...state.msAuthState,
            ...action.msAuthState
        });
    }

    case SET_CALENDAR_AUTHORIZATION:
        return set(state, 'authorization', action.authorization);

    case SET_CALENDAR_ERROR:
        return set(state, 'error', action.error);

    case SET_CALENDAR_EVENTS:
        return set(state, 'events', action.events);

    case SET_CALENDAR_INTEGRATION:
        return {
            ...state,
            integrationReady: action.integrationReady,
            integrationType: action.integrationType
        };

    case SET_CALENDAR_PROFILE_EMAIL:
        return set(state, 'profileEmail', action.email);

    case SET_LOADING_CALENDAR_EVENTS:
        return set(state, 'isLoadingEvents', action.isLoadingEvents);
    }

    return state;
});
