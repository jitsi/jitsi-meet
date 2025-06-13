import { IReduxState } from '../app/types';

/**
 * Returns whether speaker highlighting is enabled.
 *
 * @param {Object} state - The Redux state.
 * @returns {boolean} - Whether speaker highlighting is enabled.
 */
export function isSpeakerHighlightEnabled(state: IReduxState): boolean {
    return state['features/speaker-highlight']?.enabled ?? true;
} 