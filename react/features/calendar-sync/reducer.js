// @flow

import { APP_WILL_MOUNT } from '../base/app';
import { ReducerRegistry, set } from '../base/redux';
import { PersistenceRegistry } from '../base/storage';

import {
    CLEAR_CALENDAR_INTEGRATION,
    SET_CALENDAR_AUTH_STATE,
    SET_CALENDAR_AUTHORIZATION,
    SET_CALENDAR_EVENTS,
    SET_CALENDAR_INTEGRATION,
    SET_CALENDAR_PROFILE_EMAIL,
    SET_CALENDAR_TYPE
} from './actionTypes';
import { DEFAULT_STATE } from './constants';
import { isCalendarEnabled } from './functions';

/**
 * Constant for the Redux subtree of the calendar feature.
 *
 * NOTE: Please do not access this subtree directly outside of this feature.
 * This feature can be disabled (see {@code constants.js} for details), and in
 * that case, accessing this subtree directly will return undefined and will
 * need a bunch of repetitive type checks in other features. Use the
 * {@code getCalendarState} function instead, or make sure you take care of
 * those checks, or consider using the {@code _isCalendarEnabled} value to gate
 * features if needed.
 */
const STORE_NAME = 'features/calendar-sync';

/**
 * NOTE 1: For legacy purposes, read any {@code knownDomains} persisted by the
 * feature calendar-sync.
 *
 * NOTE 2: Never persist the authorization value as it's needed to remain a
 * runtime value to see if we need to re-request the calendar permission from
 * the user.
 */
isCalendarEnabled()
    && PersistenceRegistry.register(STORE_NAME, {
        knownDomains: true,
        calendarType: true,
        integrationType: true,
        msAuthState: true
    });

isCalendarEnabled()
    && ReducerRegistry.register(STORE_NAME, (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case APP_WILL_MOUNT:
            // For legacy purposes, we've allowed the deserialization of
            // knownDomains. At this point, it should have already been
            // translated into the new state format (namely, base/known-domains)
            // and the app no longer needs it.
            if (typeof state.knownDomains !== 'undefined') {
                return set(state, 'knownDomains', undefined);
            }
            break;

        case CLEAR_CALENDAR_INTEGRATION:
            return {
                ...state,
                events: [],
                integration: undefined,
                integrationType: undefined,
                msAuthState: undefined
            };

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

        case SET_CALENDAR_EVENTS:
            return set(state, 'events', action.events);

        case SET_CALENDAR_TYPE:
            return set(state, 'calendarType', action.calendarType);

        case SET_CALENDAR_PROFILE_EMAIL:
            return set(state, 'profileEmail', action.email);

        case SET_CALENDAR_INTEGRATION:
            return {
                ...state,
                integration: action.integration,
                integrationType: action.integrationType
            };
        }

        return state;
    });
