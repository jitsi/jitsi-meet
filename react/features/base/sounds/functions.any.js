// @flow

/**
 * Selector for retrieving the disabled sounds array.
 *
 * @param {Object} state - The Redux state.
 * @returns {Array<string>} - The disabled sound id's array.
 */
export function getDisabledSoundIds(state: Object) {
    return state['features/base/config'].disabledSoundIds || [];
}
