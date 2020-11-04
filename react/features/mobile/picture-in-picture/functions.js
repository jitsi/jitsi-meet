// @flow

import { NativeModules } from 'react-native';

/**
 * Enabled/Disables the PictureInPicture mode in PiP native module.
 *
 * @param {boolean} disabled - Whether the PiP mode should be disabled.
 * @returns {void}
 */
export function setPictureInPictureDisabled(disabled: boolean) {
    const { PictureInPicture } = NativeModules;

    PictureInPicture.setPictureInPictureDisabled(disabled);
}
