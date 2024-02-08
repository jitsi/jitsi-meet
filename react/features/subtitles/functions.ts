import { IReduxState } from '../app/types';
import { isLocalParticipantModerator } from '../base/participants/functions';
import { isTranscribing } from '../transcribing/functions';

/**
 * Checks whether the participant can start the transcription.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - True if the participant can start the transcription.
 */
export function canStartTranscribing(state: IReduxState) {
    const { transcription } = state['features/base/config'];

    return Boolean(transcription?.enabled && (isLocalParticipantModerator(state) || isTranscribing(state)));
}
