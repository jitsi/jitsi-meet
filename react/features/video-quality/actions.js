// @flow

import { TOGGLE_VIDEO_QUALITY_DIALOG } from './actionTypes';

/**
 * Toggles display of Video Quality Dialog.
 *
 * @returns {{
 *     type: TOGGLE_VIDEO_QUALITY_DIALOG
 * }}
 */
export function toggleVideoQualityDialog() {
    return {
        type: TOGGLE_VIDEO_QUALITY_DIALOG
    };
}
