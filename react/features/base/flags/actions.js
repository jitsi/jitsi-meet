// @flow

import { UPDATE_FLAGS } from './actionTypes';

/**
 * Updates the current features flags with the given ones. They will be merged.
 *
 * @param {Object} flags - The new flags object.
 * @returns {{
 *     type: UPDATE_FLAGS,
 *     flags: Object
 * }}
 */
export function updateFlags(flags: Object) {
    return {
        type: UPDATE_FLAGS,
        flags
    };
}
