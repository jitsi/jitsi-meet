import { IReduxState } from '../app/types';
import { FEATURES_TO_BUTTONS_MAPPING } from '../base/jwt/constants';
import { isJwtFeatureEnabledStateless } from '../base/jwt/functions';
import { IGUMPendingState } from '../base/media/types';
import { IParticipantFeatures } from '../base/participants/types';

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
 * @param {string | undefined} jwt - The jwt token.
 * @param {ILocalParticipant} localParticipantFeatures - The features of the local participant.
 * @returns {string[]} - The disabled by jwt buttons array.
 */
export function getJwtDisabledButtons(jwt: string | undefined, localParticipantFeatures?: IParticipantFeatures) {
    return Object.keys(FEATURES_TO_BUTTONS_MAPPING).reduce((acc: string[], current: string) => {
        if (!isJwtFeatureEnabledStateless({
            jwt,
            localParticipantFeatures,
            feature: current,
            ifNoToken: true
        })) {
            acc.push(FEATURES_TO_BUTTONS_MAPPING[current as keyof typeof FEATURES_TO_BUTTONS_MAPPING]);
        }

        return acc;
    }, []);
}
