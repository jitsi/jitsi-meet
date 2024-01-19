import { IReduxState } from '../app/types';
import { FEATURES_TO_BUTTONS_MAPPING } from '../base/jwt/constants';
import { isJwtFeatureEnabled } from '../base/jwt/functions';
import { IGUMPendingState } from '../base/media/types';

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
 * @returns {string[]} - The disabled by jwt buttons array.
 */
export function getJwtDisabledButtons(state: IReduxState) {
    return Object.keys(FEATURES_TO_BUTTONS_MAPPING).reduce((acc: string[], current: string) => {
        if (!isJwtFeatureEnabled(state, current, true)) {
            acc.push(FEATURES_TO_BUTTONS_MAPPING[current as keyof typeof FEATURES_TO_BUTTONS_MAPPING]);
        }

        return acc;
    }, []);
}
