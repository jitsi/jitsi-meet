
import { getParticipantCount } from '../base/participants/functions';
import { toState } from '../base/redux';

import { MAX_MODE_LIMIT, MAX_MODE_THRESHOLD } from './constants';

/**
 * Gets the value of a specific React {@code Component} prop of the currently
 * mounted {@link App}.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @param {string} propName - The name of the React {@code Component} prop of
 * the currently mounted {@code App} to get.
 * @returns {*} The value of the specified React {@code Component} prop of the
 * currently mounted {@code App}.
 */
export function doesEveryoneSupportE2EE(stateful) {
    const state = toState(stateful);
    const { everyoneSupportE2EE } = state['features/e2ee'];
    const { e2eeSupported } = state['features/base/conference'];
    const participantCount = getParticipantCount(state);

    if (typeof everyoneSupportE2EE === 'undefined' && participantCount === 1) {
        // This will happen if we are alone.

        return e2eeSupported;
    }

    return everyoneSupportE2EE;
}

/**
 * Returns true is the number of participants is larger than {@code MAX_MODE_LIMIT}.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @returns {boolean}.
 */
export function isMaxModeReached(stateful) {
    const participantCount = getParticipantCount(toState(stateful));

    return participantCount >= MAX_MODE_LIMIT;
}

/**
 * Returns true is the number of participants is larger than {@code MAX_MODE_LIMIT + MAX_MODE_THREHOLD}.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @returns {boolean}.
 */
export function isMaxModeThresholdReached(stateful) {
    const participantCount = getParticipantCount(toState(stateful));

    return participantCount >= MAX_MODE_LIMIT + MAX_MODE_THRESHOLD;
}
