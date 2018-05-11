// @flow

import { ReducerRegistry } from '../base/redux';

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

CALENDAR_ENABLED
    && ReducerRegistry.register(STORE_NAME, (state = DEFAULT_STATE, action) => {
        switch (action.type) {

        case SET_CALENDAR_AUTHORIZATION:
            return {
                ...state,
                authorization: action.status
            };

        case SET_CALENDAR_EVENTS:
            return {
                ...state,
                events: action.events
            };

        default:
            return state;
        }
    });
