// @flow
import { toState } from '../base/redux';

import { CALENDAR_ENABLED, DEFAULT_STATE } from './constants';

/**
 * Returns the calendar state, considering the enabled/disabled state of the
 * feature. Since that is the normal Redux behaviour, this function will always
 * return an object (the default state if the feature is disabled).
 *
 * @param {Object | Function} stateful - An object or a function that can be
 * resolved to a Redux state by {@code toState}.
 * @returns {Object}
 */
export function getCalendarState(stateful: Object | Function) {
    return CALENDAR_ENABLED
        ? toState(stateful)['features/calendar-sync'] : DEFAULT_STATE;
}
