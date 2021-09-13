
import { getParticipantCount } from '../base/participants/functions';
import { toState } from '../base/redux';

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
