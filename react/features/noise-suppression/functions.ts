import { IState } from '../app/types';

/**
 * Is noise suppression currently enabled.
 *
 * @param {IState} state - The state of the application.
 * @returns {boolean}
 */
export function isNoiseSuppressionEnabled(state: IState): boolean {
    return state['features/noise-suppression'].enabled;
}
