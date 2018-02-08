// @flow

import { ReducerRegistry } from '../base/redux';

import { NEW_CALENDAR_ENTRY_LIST } from './actionTypes';

/**
 * ZB: this is an object, as further data is to come here, like:
 * - known domain list
 */
const DEFAULT_STATE = {
    events: []
};
const STORE_NAME = 'features/calendar-sync';

ReducerRegistry.register(
    STORE_NAME,
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case NEW_CALENDAR_ENTRY_LIST:
            return {
                events: action.events
            };

        default:
            return state;
        }
    });
