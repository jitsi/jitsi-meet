// @flow

import {
    SET_GENERICIFRAME_VISIBILITY_STATUS,
    SET_GENERICIFRAME_URL,
    TOGGLE_GENERICIFRAME_VISIBILITY
} from './actionTypes';

/**
 * Dispatches an action to set whether genericIFrame is visible or not.
 *
 * @param {boolean} visible - Whether or not a genericIFrame is currently being
 * visible.
 * @returns {{
 *    type: SET_GENERICIFRAME_VISIBILITY_STATUS,
 visible: boolean
 * }}
 */
export function setGenericIFrameVisibilityState(visible: boolean) {
    return {
        type: SET_GENERICIFRAME_VISIBILITY_STATUS,
        visible
    };
}

/**
 * Dispatches an action to set the GenericIFrame URL.
 *
 * @param {string} iframeUrl - The GenericIFrame URL.
 * @returns {{
 *    type: SET_GENERICIFRAME_URL,
 iframeUrl: string
 * }}
 */
export function setGenericIFrameUrl(iframeUrl: ?string) {
    return {
        type: SET_GENERICIFRAME_URL,
        iframeUrl
    };
}

/**
 * Dispatches an action to show or hide Etherpad.
 *
 * @returns {{
 *    type: TOGGLE_GENERICIFRAME_VISIBILITY
 * }}
 */
export function toggleVisibility() {
    return {
        type: TOGGLE_GENERICIFRAME_VISIBILITY
    };
}
