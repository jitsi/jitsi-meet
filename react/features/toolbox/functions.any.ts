import { IState } from '../app/types';

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
