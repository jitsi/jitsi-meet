// @flow

import { NativeModules } from 'react-native';

const pip = NativeModules.PictureInPicture;

/**
 * Tells the application to enter the Picture-in-Picture mode, if supported.
 *
 * @returns {Promise} A promise which is fulfilled when PiP mode was entered, or
 * rejected in case there was a problem or it isn't supported.
 */
export function enterPictureInPictureMode(): Promise<void> {
    if (pip) {
        return pip.enterPictureInPictureMode();
    }

    return Promise.reject(new Error('PiP not supported'));
}
