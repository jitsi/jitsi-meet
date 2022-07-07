import { IState } from "../app/types";

/**
 * Is noise suppression currently active.
 *
 * @param {IState} state - The state of the application.
 * @returns {boolean}
 */
export function isNoiseSuppressionActive(state: IState): boolean {
    return state['features/noise-suppression'].active;
}
