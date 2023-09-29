import { IReduxState } from '../app/types';
import { IStateful } from '../base/app/types';
import { getParticipantById, getParticipantCount, getParticipantCountWithFake } from '../base/participants/functions';
import { toState } from '../base/redux/functions';


import { MAX_MODE_LIMIT, MAX_MODE_THRESHOLD } from './constants';

/**
 * Gets the value of a specific React {@code Component} prop of the currently
 * mounted {@link App}.
 *
 * @param {IStateful} stateful - The redux store or {@code getState}
 * function.
 * @param {string} propName - The name of the React {@code Component} prop of
 * the currently mounted {@code App} to get.
 * @returns {*} The value of the specified React {@code Component} prop of the
 * currently mounted {@code App}.
 */
export function doesEveryoneSupportE2EE(stateful: IStateful) {
    const state = toState(stateful);
    const { numberOfParticipantsNotSupportingE2EE } = state['features/base/participants'];
    const { e2eeSupported } = state['features/base/conference'];
    const participantCount = getParticipantCountWithFake(state);

    if (participantCount === 1) {
        // This will happen if we are alone.

        return e2eeSupported;
    }

    return numberOfParticipantsNotSupportingE2EE === 0;
}

/**
 * Returns true is the number of participants is larger than {@code MAX_MODE_LIMIT}.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @returns {boolean}.
 */
export function isMaxModeReached(stateful: IStateful) {
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
export function isMaxModeThresholdReached(stateful: IStateful) {
    const participantCount = getParticipantCount(toState(stateful));

    return participantCount >= MAX_MODE_LIMIT + MAX_MODE_THRESHOLD;
}

/**
 * Returns whether e2ee is enabled by the backend.
 *
 * @param {Object} state - The redux state.
 * @param {string} pId - The participant id.
 * @returns {boolean}
 */
export function displayVerification(state: IReduxState, pId: string) {
    const { conference } = state['features/base/conference'];
    const participant = getParticipantById(state, pId);

    return Boolean(conference?.isE2EEEnabled()
        && participant?.e2eeVerificationAvailable
        && participant?.e2eeVerified === undefined);
}
