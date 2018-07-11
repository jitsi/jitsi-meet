// @flow

import { APP_WILL_MOUNT } from '../base/app';
import { ReducerRegistry, set } from '../base/redux';
import { PersistenceRegistry } from '../base/storage';

import {
    SET_CALENDAR_AUTHORIZATION,
    SET_CALENDAR_EVENTS
} from './actionTypes';
import { CALENDAR_ENABLED, DEFAULT_STATE } from './constants';

/**
 * Constant for the Redux subtree of the calendar feature.
 *
 * NOTE: Please do not access this subtree directly outside of this feature.
 * This feature can be disabled (see {@code constants.js} for details), and in
 * that case, accessing this subtree directly will return undefined and will
 * need a bunch of repetitive type checks in other features. Use the
 * {@code getCalendarState} function instead, or make sure you take care of
 * those checks, or consider using the {@code CALENDAR_ENABLED} const to gate
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
CALENDAR_ENABLED
    && PersistenceRegistry.register(STORE_NAME, {
        knownDomains: true
    });

CALENDAR_ENABLED
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

        case SET_CALENDAR_AUTHORIZATION:
            return set(state, 'authorization', action.authorization);

        case SET_CALENDAR_EVENTS:
            return set(state, 'events', action.events);
        }

        return state;
    });
