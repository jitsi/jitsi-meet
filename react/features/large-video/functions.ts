import { IReduxState } from '../app/types';
import { getParticipantById } from '../base/participants/functions';

/**
 * Selector for the participant currently displaying on the large video.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
export function getLargeVideoParticipant(state: IReduxState) {
    const { participantId } = state['features/large-video'];

    return getParticipantById(state, participantId ?? '');
}
