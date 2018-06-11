// @flow

import { APP_WILL_MOUNT } from '../app';
import { ReducerRegistry, set } from '../base/redux';
import { PersistenceRegistry } from '../base/storage';

import {
    SET_CALENDAR_AUTHORIZATION,
    SET_CALENDAR_EVENTS
} from './actionTypes';
import { CALENDAR_ENABLED } from './constants';

const DEFAULT_STATE = {
    /**
     * Note: If features/calendar-sync ever gets persisted, do not persist the
     * authorization value as it's needed to remain a runtime value to see if we
     * need to re-request the calendar permission from the user.
     */
    authorization: undefined,
    events: []
};

const STORE_NAME = 'features/calendar-sync';

// XXX For legacy purposes, read any {@code knownDomains} persisted by the
// feature calendar-sync.
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
