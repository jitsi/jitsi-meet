import { IReduxState } from '../app/types';
import { getParticipantById } from '../base/participants/functions';
import { getIsLobbyVisible } from '../lobby/functions';
import { isPrejoinPageVisible } from '../prejoin/functions';


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

/**
 * Determines the necessity for watermarks.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isWatermarksEnabled(state: IReduxState): boolean {
    return !isPrejoinPageVisible(state) && !getIsLobbyVisible(state);
}
