import { NativeModules } from 'react-native';

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
