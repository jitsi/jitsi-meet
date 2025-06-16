import i18next from 'i18next';

import { IReduxState, IStore } from '../app/types';
import { IStateful } from '../base/app/types';
import { getSoundFileSrc } from '../base/media/functions';
import { getParticipantById, getParticipantCount, getParticipantCountWithFake } from '../base/participants/functions';
import { toState } from '../base/redux/functions';
import { registerSound, unregisterSound } from '../base/sounds/actions';

import {
    E2EE_OFF_SOUND_ID,
    E2EE_ON_SOUND_ID,
    MAX_MODE_LIMIT,
    MAX_MODE_THRESHOLD
} from './constants';
import {
    E2EE_OFF_SOUND_FILE,
    E2EE_ON_SOUND_FILE
} from './sounds';


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
 * @returns {boolean}
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
 * @returns {boolean}
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

/**
 * Unregisters the audio files based on locale.
 *
 * @param {Dispatch<any>} dispatch - The redux dispatch function.
 * @returns {void}
 */
export function unregisterE2eeAudioFiles(dispatch: IStore['dispatch']) {
    dispatch(unregisterSound(E2EE_OFF_SOUND_ID));
    dispatch(unregisterSound(E2EE_ON_SOUND_ID));
}

/**
 * Registers the audio files based on locale.
 *
 * @param {Dispatch<any>} dispatch - The redux dispatch function.
 * @param {boolean|undefined} shouldUnregister - Whether the sounds should be unregistered.
 * @returns {void}
 */
export function registerE2eeAudioFiles(dispatch: IStore['dispatch'], shouldUnregister?: boolean) {
    const language = i18next.language;

    shouldUnregister && unregisterE2eeAudioFiles(dispatch);

    dispatch(registerSound(
        E2EE_OFF_SOUND_ID,
        getSoundFileSrc(E2EE_OFF_SOUND_FILE, language)));

    dispatch(registerSound(
        E2EE_ON_SOUND_ID,
        getSoundFileSrc(E2EE_ON_SOUND_FILE, language)));
}
