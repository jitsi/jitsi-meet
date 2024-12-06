import { IReduxState } from '../app/types';
import { isJwtFeatureEnabledStateless } from '../base/jwt/functions';
import { IGUMPendingState } from '../base/media/types';
import { IParticipantFeatures } from '../base/participants/types';
import { iAmVisitor } from '../visitors/functions';

/**
 * Indicates if the audio mute button is disabled or not.
 *
 * @param {IReduxState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isAudioMuteButtonDisabled(state: IReduxState) {
    const { available, muted, unmuteBlocked, gumPending } = state['features/base/media'].audio;
    const { startSilent } = state['features/base/config'];

    return Boolean(!available || startSilent || (muted && unmuteBlocked) || gumPending !== IGUMPendingState.NONE
        || iAmVisitor(state));
}

/**
 * Returns the buttons corresponding to features disabled through jwt.
 * This function is stateless as it returns a new array and may cause re-rendering.
 *
 * @param {boolean} isTranscribing - Whether there is currently a transcriber in the meeting.
 * @param {boolean} isModerator - Whether local participant is moderator.
 * @param {string | undefined} jwt - The jwt token.
 * @param {ILocalParticipant} localParticipantFeatures - The features of the local participant.
 * @returns {string[]} - The disabled by jwt buttons array.
 */
export function getJwtDisabledButtons(
        isTranscribing: boolean,
        isModerator: boolean,
        jwt: string | undefined,
        localParticipantFeatures?: IParticipantFeatures) {
    const acc = [];

    if (!isJwtFeatureEnabledStateless({
        jwt,
        localParticipantFeatures,
        feature: 'livestreaming',
        ifNoToken: isModerator,
        ifNotInFeatures: false
    })) {
        acc.push('livestreaming');
    }

    if (!isTranscribing && !isJwtFeatureEnabledStateless({
        jwt,
        localParticipantFeatures,
        feature: 'transcription',
        ifNoToken: isModerator,
        ifNotInFeatures: false
    })) {
        acc.push('closedcaptions');
    }

    return acc;
}
