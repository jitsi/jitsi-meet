import { NativeModules, Platform } from 'react-native';

import { IReduxState } from '../../app/types';
import { PIP_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';

/**
 * Checks whether Picture-in-Picture is enabled.
 *
 * @param {Object} state - The Redux state.
 * @returns {boolean} Whether PiP is enabled or not.
 */
export function isPipEnabled(state: IReduxState) {
    let enabled = getFeatureFlag(state, PIP_ENABLED);

    // Override flag for Android, since it might be unsupported.
    if (Platform.OS === 'android' && (typeof enabled === 'undefined' || enabled)) {
        enabled = NativeModules.PictureInPicture.SUPPORTED;
    }

    return Boolean(enabled);
}

/**
 * Enabled/Disables the PictureInPicture mode in PiP native module.
 *
 * @param {boolean} enabled - Whether the PiP mode should be enabled.
 * @returns {void}
 */
export function setPictureInPictureEnabled(enabled: boolean) {
    const { PictureInPicture } = NativeModules;

    if (PictureInPicture) {
        PictureInPicture.setPictureInPictureEnabled(enabled);
    }
}
