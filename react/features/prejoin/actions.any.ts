import {
    SET_PREJOIN_DISPLAY_NAME_REQUIRED
} from './actionTypes';

/**
 * Action used to set the stance of the display name.
 *
 * @returns {Object}
 */
export function setPrejoinDisplayNameRequired() {
    return {
        type: SET_PREJOIN_DISPLAY_NAME_REQUIRED
    };
}
