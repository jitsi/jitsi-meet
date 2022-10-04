import { IState } from '../app/types';
import { FEATURES_TO_BUTTONS_MAPPING } from '../base/jwt/constants';
import { isJwtFeatureEnabled } from '../base/jwt/functions';

/**
 * Indicates if the audio mute button is disabled or not.
 *
 * @param {IState} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isAudioMuteButtonDisabled(state: IState) {
    const { available, muted, unmuteBlocked } = state['features/base/media'].audio;
    const { startSilent } = state['features/base/config'];

    return Boolean(!available || startSilent || (muted && unmuteBlocked));
}

/**
 * Returns the buttons corresponding to features disabled through jwt.
 *
 * @param {IState} state - The state from the Redux store.
 * @returns {string[]} - The disabled by jwt buttons array.
 */
export function getJwtDisabledButtons(state: IState) {
    return Object.keys(FEATURES_TO_BUTTONS_MAPPING).reduce((acc: string[], current: string) => {
        if (!isJwtFeatureEnabled(state, current, true)) {
            acc.push(current);
        }

        return acc;
    }, []);
}
