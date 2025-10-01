import { IReduxState } from '../app/types';
import { getParticipantById } from '../base/participants/functions';
import { isStageFilmstripAvailable } from '../filmstrip/functions';
import { shouldDisplayTileView } from '../video-layout/functions.any';

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
 * Determines whether the large video container should be hidden.
 * Large video is hidden in tile view, stage filmstrip mode (with multiple participants),
 * or when editing etherpad.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {boolean} True if large video should be hidden, false otherwise.
 */
export function shouldHideLargeVideo(state: IReduxState): boolean {
    return shouldDisplayTileView(state)
        || isStageFilmstripAvailable(state, 2)
        || Boolean(state['features/etherpad']?.editing);
}
