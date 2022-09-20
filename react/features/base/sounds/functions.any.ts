import { IState } from '../../app/types';

/**
 * Selector for retrieving the disabled sounds array.
 *
 * @param {Object} state - The Redux state.
 * @returns {Array<string>} - The disabled sound id's array.
 */
export function getDisabledSounds(state: IState) {
    return state['features/base/config'].disabledSounds || [];
}
