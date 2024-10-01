import { IReduxState } from '../app/types';
import { isJwtFeatureEnabledStateless } from '../base/jwt/functions';
import { IGUMPendingState } from '../base/media/types';
import { IParticipantFeatures } from '../base/participants/types';
import { isTranscribing } from '../transcribing/functions';

/**
 * Indicates if the audio mute button is disabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isAudioMuteButtonDisabled(state: IReduxState) {
    const { available, muted, unmuteBlocked, gumPending } = state['features/base/media'].audio;
    const { startSilent } = state['features/base/config'];

    return Boolean(!available || startSilent || (muted && unmuteBlocked) || gumPending !== IGUMPendingState.NONE);
}

/**
 * Returns the buttons corresponding to features disabled through jwt.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @param {boolean} isModerator - Whether local participant is moderator.
 * @param {string | undefined} jwt - The jwt token.
 * @param {ILocalParticipant} localParticipantFeatures - The features of the local participant.
 * @returns {string[]} - The disabled by jwt buttons array.
 */
export function getJwtDisabledButtons(
        state: IReduxState,
        isModerator: boolean,
        jwt: string | undefined,
        localParticipantFeatures?: IParticipantFeatures) {
    const acc = [];

    if (!isJwtFeatureEnabledStateless({
        jwt,
        localParticipantFeatures,
        feature: 'livestreaming',
        ifNoToken: isModerator,
        ifNotInFeatures: isModerator
    })) {
        acc.push('livestreaming');
    }

    if (!isTranscribing(state) && !isJwtFeatureEnabledStateless({
        jwt,
        localParticipantFeatures,
        feature: 'transcription',
        ifNoToken: isModerator,
        ifNotInFeatures: isModerator
    })) {
        acc.push('closedcaptions');
    }

    return acc;
}
